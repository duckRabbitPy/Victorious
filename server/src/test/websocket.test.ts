import { pipe, Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { DBConnectionTest, DBConnection } from "../db/connection";
import {
  TEST_ROOM,
  resetAndSeedDatabase,
  testUser1,
  testUser2,
} from "../db/seed";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import {
  ClientPayload,
  SupportedEffects,
  safeParseChatLog,
  safeParseGameState,
} from "../../../shared/common";
import { handleGameMessage } from "../websocketServer/handleGameMessage";
import { handleChatMessage } from "../websocketServer/handleChatMessage";

const getTestSession = Effect.provideService(
  DBConnection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) => getLatestGameSnapshotQuery(TEST_ROOM, pool)),
    Effect.flatMap((gameState) => Effect.succeed(gameState)),
    Effect.flatMap(safeParseGameState)
  ),
  DBConnection,
  DBConnectionTest
);

describe("add players, start game and buy card", () => {
  beforeAll(async () => {
    await resetAndSeedDatabase();
  });
  it("estate bug, buying cards should not increase number of estates", async () => {
    // add player 1
    const initialGamestate = await Effect.runPromise(getTestSession);

    const room = initialGamestate.room;
    const testMsg = {
      authToken: testUser1.authToken,
      effect: SupportedEffects.addLivePlayer,
      room: room,
      cardName: undefined,
      userId: testUser1.userId,
      toDiscardFromHand: [],
      chatMessage: undefined,
    } as ClientPayload;

    const addNewPlayerToGame = DBConnection.pipe(
      Effect.flatMap((connection) => connection.pool),
      Effect.flatMap((pool) =>
        Effect.all({
          pool: Effect.succeed(pool),
          msg: Effect.succeed(testMsg),
        })
      ),
      Effect.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      Effect.flatMap(safeParseGameState)
    );

    // add player 2
    const testMsg2 = {
      authToken: testUser2.authToken,
      effect: SupportedEffects.addLivePlayer,
      room,
      cardName: undefined,
      userId: testUser2.userId,
      toDiscardFromHand: [],
      chatMessage: undefined,
    } as ClientPayload;

    const addNewPlayerToGame2 = DBConnection.pipe(
      Effect.flatMap((connection) => connection.pool),
      Effect.flatMap((pool) =>
        Effect.all({
          pool: Effect.succeed(pool),
          msg: Effect.succeed(testMsg2),
        })
      ),
      Effect.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser2.userId,
            username: testUser2.username,
          },
        })
      ),
      Effect.flatMap(safeParseGameState)
    );

    // start game

    const testMsg3 = {
      authToken: testUser1.authToken,
      effect: SupportedEffects.startGame,
      room,
      cardName: undefined,
      userId: testUser1.userId,
      toDiscardFromHand: [],
      chatMessage: undefined,
    } as ClientPayload;

    const startGame = DBConnection.pipe(
      Effect.flatMap((connection) => connection.pool),
      Effect.flatMap((pool) =>
        Effect.all({
          pool: Effect.succeed(pool),
          msg: Effect.succeed(testMsg3),
        })
      ),
      Effect.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      Effect.flatMap(safeParseGameState)
    );

    // buy card
    const testMsg4 = {
      authToken: testUser1.authToken,
      effect: SupportedEffects.buyCard,
      room,
      cardName: "copper",
      userId: testUser1.userId,
      toDiscardFromHand: [],
      chatMessage: undefined,
    } as ClientPayload;

    const buyCard = DBConnection.pipe(
      Effect.flatMap((connection) => connection.pool),
      Effect.flatMap((pool) =>
        Effect.all({
          pool: Effect.succeed(pool),
          msg: Effect.succeed(testMsg4),
        })
      ),
      Effect.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      Effect.flatMap(safeParseGameState)
    );

    // End turn
    const testMsg5 = {
      authToken: testUser1.authToken,
      effect: SupportedEffects.incrementTurn,
      room,
      cardName: undefined,
      userId: testUser1.userId,
      toDiscardFromHand: [],
      chatMessage: undefined,
    } as ClientPayload;

    const incrementTurn = DBConnection.pipe(
      Effect.flatMap((connection) => connection.pool),
      Effect.flatMap((pool) =>
        Effect.all({
          pool: Effect.succeed(pool),
          msg: Effect.succeed(testMsg5),
        })
      ),
      Effect.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      Effect.flatMap(safeParseGameState)
    );

    const addPlayer1Runnable = Effect.provideService(
      addNewPlayerToGame,
      DBConnection,
      DBConnectionTest
    );
    const addPlayer2Runnable = Effect.provideService(
      addNewPlayerToGame2,
      DBConnection,
      DBConnectionTest
    );

    const startGameRunnable = Effect.provideService(
      startGame,
      DBConnection,
      DBConnectionTest
    );

    const buyCardRunnable = Effect.provideService(
      buyCard,
      DBConnection,
      DBConnectionTest
    );

    const incrementTurnRunnable = Effect.provideService(
      incrementTurn,
      DBConnection,
      DBConnectionTest
    );

    const runAll = pipe(
      addPlayer1Runnable,
      Effect.flatMap(() => addPlayer2Runnable),
      Effect.flatMap(() => startGameRunnable),
      Effect.flatMap(() => buyCardRunnable),
      Effect.flatMap(() => incrementTurnRunnable)
    );

    const newGameState = await Effect.runPromise(runAll);

    expect(newGameState.turn).toEqual(2);
    expect(newGameState.global_state.supply.copper).toEqual(59);
    expect(newGameState.global_state.history).includes(
      `${testUser1.username} purchased a copper`
    );
    expect(
      newGameState.actor_state[0].hand.estate +
        newGameState.actor_state[0].deck.reduce(
          (acc, card) => (card === "estate" ? acc + 1 : acc),
          0
        ) +
        newGameState.actor_state[0].discardPile.reduce(
          (acc, card) => (card === "estate" ? acc + 1 : acc),
          0
        )
    ).toEqual(3);
  });
});

it("send chat message", async () => {
  const initialGamestate = await Effect.runPromise(getTestSession);

  const room = initialGamestate.room;
  const testMsg = {
    authToken: testUser1.authToken,
    effect: SupportedEffects.sendChatMessage,
    room: room,
    cardName: undefined,
    userId: testUser1.userId,
    toDiscardFromHand: [],
    chatMessage: "test chat message",
  } as ClientPayload;

  const sendChatMessage = DBConnection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) =>
      Effect.all({
        pool: Effect.succeed(pool),
        msg: Effect.succeed(testMsg),
      })
    ),
    Effect.flatMap(({ msg, pool }) =>
      handleChatMessage({
        msg,
        pool,
        userInfo: {
          userId: testUser1.userId,
          username: testUser1.username,
        },
      })
    ),
    Effect.flatMap(safeParseChatLog)
  );
  const runnable = Effect.provideService(
    sendChatMessage,
    DBConnection,
    DBConnectionTest
  );

  expect((await Effect.runPromise(runnable))[0].message).toEqual(
    testMsg.chatMessage
  );
});
