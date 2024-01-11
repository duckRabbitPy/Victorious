import { pipe, Effect as E } from "effect";
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

const getTestSession = E.provideService(
  DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) => getLatestGameSnapshotQuery(TEST_ROOM, pool)),
    E.flatMap((gameState) => E.succeed(gameState)),
    E.flatMap(safeParseGameState)
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
    const initialGamestate = await E.runPromise(getTestSession);

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
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      E.flatMap(safeParseGameState)
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
      E.flatMap((connection) => connection.pool),
      E.flatMap((pool) =>
        E.all({
          pool: E.succeed(pool),
          msg: E.succeed(testMsg2),
        })
      ),
      E.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser2.userId,
            username: testUser2.username,
          },
        })
      ),
      E.flatMap(safeParseGameState)
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
      E.flatMap((connection) => connection.pool),
      E.flatMap((pool) =>
        E.all({
          pool: E.succeed(pool),
          msg: E.succeed(testMsg3),
        })
      ),
      E.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      E.flatMap(safeParseGameState)
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
      E.flatMap((connection) => connection.pool),
      E.flatMap((pool) =>
        E.all({
          pool: E.succeed(pool),
          msg: E.succeed(testMsg4),
        })
      ),
      E.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      E.flatMap(safeParseGameState)
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
      E.flatMap((connection) => connection.pool),
      E.flatMap((pool) =>
        E.all({
          pool: E.succeed(pool),
          msg: E.succeed(testMsg5),
        })
      ),
      E.flatMap(({ msg, pool }) =>
        handleGameMessage({
          msg,
          pool,
          userInfo: {
            userId: testUser1.userId,
            username: testUser1.username,
          },
        })
      ),
      E.flatMap(safeParseGameState)
    );

    const addPlayer1Runnable = E.provideService(
      addNewPlayerToGame,
      DBConnection,
      DBConnectionTest
    );
    const addPlayer2Runnable = E.provideService(
      addNewPlayerToGame2,
      DBConnection,
      DBConnectionTest
    );

    const startGameRunnable = E.provideService(
      startGame,
      DBConnection,
      DBConnectionTest
    );

    const buyCardRunnable = E.provideService(
      buyCard,
      DBConnection,
      DBConnectionTest
    );

    const incrementTurnRunnable = E.provideService(
      incrementTurn,
      DBConnection,
      DBConnectionTest
    );

    const runAll = pipe(
      addPlayer1Runnable,
      E.flatMap(() => addPlayer2Runnable),
      E.flatMap(() => startGameRunnable),
      E.flatMap(() => buyCardRunnable),
      E.flatMap(() => incrementTurnRunnable)
    );

    const newGameState = await E.runPromise(runAll);

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
  const initialGamestate = await E.runPromise(getTestSession);

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
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) =>
      E.all({
        pool: E.succeed(pool),
        msg: E.succeed(testMsg),
      })
    ),
    E.flatMap(({ msg, pool }) =>
      handleChatMessage({
        msg,
        pool,
        userInfo: {
          userId: testUser1.userId,
          username: testUser1.username,
        },
      })
    ),
    E.flatMap(safeParseChatLog)
  );
  const runnable = E.provideService(
    sendChatMessage,
    DBConnection,
    DBConnectionTest
  );

  expect((await E.runPromise(runnable))[0].message).toEqual(
    testMsg.chatMessage
  );
});
