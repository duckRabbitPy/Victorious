import * as Schema from "@effect/schema/Schema";
import {
  ClientPayloadStruct,
  safeParseNonEmptyString,
  ClientPayload,
  GameState,
} from "../../shared/common";
import { Effect as E, pipe } from "effect";
import {
  AuthenticationError,
  ServerError,
  CustomParseError,
  IllegalGameStateError,
  JSONParseError,
} from "./customErrors";
import jwt from "jsonwebtoken";
import { broadcastToRoom } from "./websocketServer/broadcast";
import {
  RoomConnections,
  UserInfo,
} from "./websocketServer/createWebsocketServer";
import { ParseError } from "@effect/schema/ParseResult";

export const logAndThrowError = (error: unknown) => {
  console.error(error);
  throw error;
};

export const tapPipeLine = <R, E, A>(
  effect: E.Effect<R, E, A>
): E.Effect<R, E, A> =>
  pipe(
    effect,
    E.tapBoth({
      onFailure: (f) =>
        E.logWarning(`Failed with: ${JSON.stringify(f, null, 2)}`),
      onSuccess: (s) =>
        E.logInfo(`Success with: ${JSON.stringify(s, null, 2)}`),
    })
  );

export const safeParseNumber = Schema.parse(
  Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
);

export const safeParseBoolean = Schema.parse(Schema.boolean);

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
    E.flatMap((secret) => {
      return E.tryPromise({
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

export const sendErrorMsgToClient = (
  error: ServerError | ParseError,
  msg: ClientPayload | undefined,
  roomConnections: RoomConnections
) => {
  if (!msg?.room) {
    console.error(
      "No room number provided, cannot send error message to client"
    );
    return E.succeed(E.unit);
  }

  const errorMessage =
    "message" in error ? error.message : "An unknown server error occured";

  return E.succeed(
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
    E.try({
      try: () => JSON.parse(msg as string),
      catch: (e) =>
        new JSONParseError({
          message: `error parsing client string to json ${e}`,
        }),
    }),
    E.flatMap((msg) => parseClientMessage(msg)),
    E.orElseFail(
      () =>
        new CustomParseError({
          message: "Failed to parse client message to match type ClientPayload",
        })
    )
  );

export const getUserInfoFromJWT = (authToken: string | undefined) =>
  pipe(
    safeParseNonEmptyString(authToken),
    E.flatMap((authToken) => verifyJwt(authToken, process.env.JWT_SECRET_KEY)),
    E.flatMap((decoded) => safeParseJWT(decoded)),
    E.flatMap((decoded) =>
      E.succeed({
        userId: decoded.userId,
        username: decoded.username,
      })
    )
  );

export const getClientMessage = (msg: unknown) =>
  parseClientMessage(JSON.parse(msg as string))
    .pipe(E.orElseSucceed(() => undefined))
    .pipe(E.runSync);

export const clientNotInConnectionList = (
  room: number | undefined,
  authToken: string | undefined,
  roomConnections: RoomConnections
) =>
  roomConnections.every(
    (connection) =>
      connection.room !== room || connection.uniqueUserAuthToken !== authToken
  );

export const checkClientStateIsUptoDate = ({
  msg,
  currentGameState,
}: {
  msg: ClientPayload;
  currentGameState: GameState;
}) => {
  if (
    msg.mutationIndex > 0 &&
    msg.mutationIndex < currentGameState.mutation_index
  ) {
    return E.fail(
      new IllegalGameStateError({
        message: `Client state is out of date. Expected mutation index ${currentGameState.mutation_index} but got ${msg.mutationIndex}`,
      })
    );
  }

  return E.succeed(currentGameState);
};

export const checkEnoughPlayers = (gameState: GameState) => {
  if (gameState.actor_state.length < 2) {
    return E.fail(
      new IllegalGameStateError({
        message: `Not enough players to start game`,
      })
    );
  }

  return E.succeed(gameState);
};

export const checkNotAlreadyInRoom = ({
  currentGameState,
  userInfo,
}: {
  currentGameState: GameState;
  userInfo: UserInfo;
}) => {
  if (
    currentGameState.actor_state
      .map((actor) => actor.id)
      .includes(userInfo.userId)
  ) {
    return E.fail(
      new IllegalGameStateError({
        message: `User ${userInfo.username} already exists in room ${currentGameState.room}`,
      })
    );
  }

  return E.succeed(currentGameState);
};

export const delay = E.promise(
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve("waited 1 sec");
      }, 1000);
    })
);
