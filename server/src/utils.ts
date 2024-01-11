import * as Schema from "@effect/schema/Schema";
import {
  ClientPayloadStruct,
  safeParseNonEmptyString,
  ClientPayload,
} from "../../shared/common";
import { Effect, pipe } from "effect";
import { AuthenticationError, JSONParseError } from "./customErrors";
import jwt from "jsonwebtoken";
import { broadcastToRoom } from "./websocketServer/broadcast";
import { RoomConnections } from "./websocketServer/createWebsocketServer";

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
    broadcastToRoom({
      broadcastType: "error",
      payload: errorMessage,
      roomConnections,
      room: msg.room,
    })
  );
};

export const parseClientMessage = Schema.parse(ClientPayloadStruct);

export const parseJSONToClientMsg = (msg: unknown) =>
  pipe(
    Effect.try({
      try: () => JSON.parse(msg as string),
      catch: (e) =>
        new JSONParseError({
          message: `error parsing client message: ${e}`,
        }),
    }),
    Effect.flatMap((msg) => parseClientMessage(msg))
  );

export const getUserInfoFromJWT = (authToken: string | undefined) =>
  pipe(
    safeParseNonEmptyString(authToken),
    Effect.flatMap((authToken) =>
      verifyJwt(authToken, process.env.JWT_SECRET_KEY)
    ),
    Effect.flatMap((decoded) => safeParseJWT(decoded)),
    Effect.flatMap((decoded) =>
      Effect.succeed({
        userId: decoded.userId,
        username: decoded.username,
      })
    )
  );

export const getClientMessage = (msg: unknown) =>
  parseClientMessage(JSON.parse(msg as string))
    .pipe(Effect.orElseSucceed(() => undefined))
    .pipe(Effect.runSync);

export const clientNotInConnectionList = (
  room: number | undefined,
  authToken: string | undefined,
  roomConnections: RoomConnections
) =>
  roomConnections.every(
    (connection) =>
      connection.room !== room || connection.uniqueUserAuthToken !== authToken
  );
