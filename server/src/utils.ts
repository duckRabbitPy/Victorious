import * as Schema from "@effect/schema/Schema";
import {
  GameStateStruct,
  ClientPayloadStruct,
  ChatMessageStruct,
  safeParseNonEmptyString,
  ClientPayload,
} from "../../shared/common";
import * as Effect from "@effect/io/Effect";
import { pipe } from "effect";
import { AuthenticationError } from "./controllers/customErrors";
import jwt from "jsonwebtoken";
import { broadcastToRoom } from "./broadcast";
import { RoomConnections } from "./websocketServer";

export const logAndThrowError = (error: unknown) => {
  console.error(error);
  throw error;
};

export const tapPipeLine = <R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> =>
  pipe(
    effect,
    Effect.tapBoth({
      onFailure: (f) =>
        Effect.logWarning(`Failed with: ${JSON.stringify(f, null, 2)}`),
      onSuccess: (s) =>
        Effect.logInfo(`Success with: ${JSON.stringify(s, null, 2)}`),
    })
  );

export const safeParseNumber = Schema.parse(
  Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
);

export const safeParseJWT = Schema.parse(
  Schema.struct({
    userId: Schema.string,
    username: Schema.string,
    iat: Schema.number,
    exp: Schema.number,
  })
);

export const safeParseUUIDs = Schema.parse(Schema.array(Schema.UUID));

export const safeParseUUID = Schema.parse(Schema.UUID);

export const safeParseNumberArray = Schema.parse(
  Schema.array(
    Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
  )
);

export const parseClientMessage = Schema.parse(ClientPayloadStruct);

export const verifyJwt = (token: string, secret: string | undefined) => {
  return pipe(
    safeParseNonEmptyString(secret),
    Effect.flatMap((secret) => {
      return Effect.tryPromise({
        try: () =>
          new Promise((resolve, reject) => {
            jwt.verify(token, secret, (err: unknown, decoded: unknown) => {
              if (err) {
                reject(new Error("Invalid token"));
              }
              resolve(decoded);
            });
          }),
        catch: () => new AuthenticationError({ message: "Invalid AuthToken" }),
      });
    })
  );
};

export const sendErrorMsgToClient = <T>(
  error: T,
  msg: ClientPayload | undefined,
  roomConnections: RoomConnections
) => {
  if (!msg?.room) {
    console.error(
      "No room number provided, cannot send error message to client"
    );
    return Effect.succeed(Effect.unit);
  }

  const errorMessage =
    error instanceof Error ? error.message : "An unknown server error occured";

  return Effect.succeed(
    broadcastToRoom("error", errorMessage, msg.room, roomConnections)
  );
};
