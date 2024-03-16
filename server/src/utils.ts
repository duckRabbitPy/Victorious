import * as S from "@effect/schema/Schema";
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
  PostgresError,
  RegistrationError,
  DebounceError,
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

// check after update deps
export const tapPipeLine = <A, E, R>(
  effect: E.Effect<A, E, R>
): E.Effect<A, E, R> =>
  pipe(
    effect,
    E.tapBoth({
      onFailure: (f) =>
        E.logWarning(`Failed with: ${JSON.stringify(f, null, 2)}`),
      onSuccess: (s) =>
        E.logInfo(`Success with: ${JSON.stringify(s, null, 2)}`),
    })
  );

export const safeParseNumber = S.decodeUnknown(
  S.number.pipe(S.positive(), S.int(), S.nonNaN())
);

export const safeParseBoolean = S.decodeUnknown(S.boolean);

export const safeParseJWT = S.decodeUnknown(
  S.struct({
    userId: S.string,
    username: S.string,
    iat: S.number,
    exp: S.number,
  })
);

export const safeParseUUIDs = S.decodeUnknown(S.array(S.UUID));

export const safeParseUUID = S.decodeUnknown(S.UUID);

export const safeParseNumberArray = S.decodeUnknown(
  S.array(S.number.pipe(S.positive(), S.int(), S.nonNaN()))
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
  error:
    | ServerError
    | PostgresError
    | ParseError
    | IllegalGameStateError
    | DebounceError
    | Error
    | CustomParseError
    | RegistrationError
    | AuthenticationError,
  msg: ClientPayload | undefined,
  roomConnections: RoomConnections
) => {
  if (!msg?.room) {
    console.error(
      "No room number provided, cannot send error message to client"
    );
    return E.succeed(E.unit);
  }

  console.log(error);

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

export const parseClientMessage = S.decodeUnknown(ClientPayloadStruct);

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
    // if there is a mutation index violation but the last state was created within 500ms, likely due to rapid clicking, debounce so that on frontend can ignore the error rather than stop flow of the game
    if (
      currentGameState.created_at &&
      Date.now() - new Date(currentGameState.created_at).getTime() < 500
    ) {
      return E.fail(
        new IllegalGameStateError({
          message: "Debounce",
        })
      );
    }

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
