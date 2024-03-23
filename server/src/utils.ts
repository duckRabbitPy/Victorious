import * as S from "@effect/schema/Schema";
import {
  safeParseNonEmptyString,
  ClientPayload,
  GameState,
} from "../../shared/common";
import { Effect as E, pipe } from "effect";
import {
  AuthenticationError,
  CustomClientPayloadParseError,
  IllegalGameStateError,
  PostgresError,
  RegistrationError,
  RuntimeError,
  AllPossibleWebsocketErrors,
} from "./customErrors";
import jwt from "jsonwebtoken";
import { broadcastToRoom } from "./websocketServer/broadcast";
import {
  RoomConnections,
  UserInfo,
} from "./websocketServer/createWebsocketServer";

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

export class UserJWT extends S.Class<UserJWT>("ParsedJWT")({
  userId: S.string,
  username: S.string,
  iat: S.number,
  exp: S.number,
}) {}

export const safeParseUserJWT = S.decodeUnknown(UserJWT);

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
  error: AllPossibleWebsocketErrors,
  msg: ClientPayload | undefined,
  roomConnections: RoomConnections
) => {
  if (!msg?.room) {
    console.error(
      "No room number provided, cannot send error message to client"
    );
    return E.succeed(E.unit);
  }

  // server log
  console.error(error.message);

  const errorMessage = getClientErrorMessages(error);

  return broadcastToRoom({
    broadcastType: "error",
    payload: errorMessage,
    room: msg.room,
    roomConnections,
  });
};

const getClientErrorMessages = (error: AllPossibleWebsocketErrors) => {
  if (
    error instanceof IllegalGameStateError ||
    error instanceof RegistrationError ||
    error instanceof RuntimeError
  ) {
    return error.message;
  } else if (error instanceof AuthenticationError) {
    return "Authentication error, check your login status";
  } else if (error instanceof CustomClientPayloadParseError) {
    return "Server failed to parse data from browser, try again";
  } else if (error instanceof PostgresError) {
    return "A database error occurred, try again";
  }

  return "An unexpected server error occurred, try again";
};

export const parseClientMessage = S.decodeUnknown(ClientPayload);

export const parseJSONToClientMsg = (msg: unknown) =>
  pipe(
    E.try({
      try: () => JSON.parse(msg as string),
      catch: (e) => {
        console.error(e);
        return e;
      },
    }),
    E.flatMap((msg) => parseClientMessage(msg)),
    E.orElseFail(
      () =>
        new CustomClientPayloadParseError({
          message: "Failed to parse client message to match type ClientPayload",
        })
    )
  );

export const getUserInfoFromJWT = (authToken: string | undefined) =>
  pipe(
    safeParseNonEmptyString(authToken),
    E.flatMap((authToken) => verifyJwt(authToken, process.env.JWT_SECRET_KEY)),
    E.flatMap((decoded) => safeParseUserJWT(decoded)),
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
