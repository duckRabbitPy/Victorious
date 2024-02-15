import { Effect as E } from "effect";

import { DBConnectionTest, DBConnection } from "../db/connection";
import { testUser1, testUser2 } from "../db/seed";

import {
  CardName,
  ClientPayload,
  GameState,
  SupportedEffects,
  safeParseGameState,
} from "../../../shared/common";
import { handleGameMessage } from "../websocketServer/handleGameMessage";

export const NEW_API_TEST_USER = {
  username: "api_tester1",
  password: "testpassword",
  email: "api_tester@api_test.com",
};

const createTestMessage = (
  effect: SupportedEffects,
  userId: string,
  cardName: CardName | undefined,
  lastGameState: GameState | undefined
): ClientPayload => {
  if (!lastGameState?.room) {
    throw new Error("room is undefined");
  }

  return {
    mutationIndex: lastGameState?.mutation_index || 0,
    authToken:
      userId === testUser1.userId ? testUser1.authToken : testUser2.authToken,
    effect,
    room: lastGameState.room,
    cardName: cardName || undefined,
    chatMessage: undefined,
  };
};

export const executeGameOperation = ({
  effect,
  userId,
  cardName,
  lastGameState,
}: {
  lastGameState: GameState | undefined;
  effect: SupportedEffects;
  userId: string;
  cardName?: CardName;
}) => {
  const testMsg = createTestMessage(effect, userId, cardName, lastGameState);
  const operation = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) =>
      E.all({
        pool: E.succeed(pool),
        msg: E.succeed(testMsg),
      })
    ),
    E.flatMap(({ msg, pool }) =>
      handleGameMessage({
        msg,
        pool,
        userInfo: {
          userId,
          username:
            userId === testUser1.userId
              ? testUser1.username
              : testUser2.username,
        },
      })
    ),
    E.flatMap(safeParseGameState)
  );

  return E.provideService(operation, DBConnection, DBConnectionTest);
};
