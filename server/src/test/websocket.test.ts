import { pipe, Effect as E } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
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
  getTotalCardsForActor,
  safeParseChatLog,
  safeParseGameState,
  zeroCardCount,
} from "../../../shared/common";
import { handleChatMessage } from "../websocketServer/handleChatMessage";
import { executeGameOperation } from "./helpers";
import { delay } from "../utils";
import { getSendBotMessagesRunnable } from "../websocketServer/bots/sendBotMessage";

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

const setUpGame = async () => {
  const initialGameState = await E.runPromise(getTestSession);
  const runnable = pipe(
    executeGameOperation({
      effect: SupportedEffects.addLivePlayer,
      userId: testUser1.userId,
      lastGameState: initialGameState,
    }),
    E.flatMap((gamestate) =>
      executeGameOperation({
        effect: SupportedEffects.addLivePlayer,
        userId: testUser2.userId,
        lastGameState: gamestate,
      })
    ),
    E.flatMap((gamestate) =>
      executeGameOperation({
        effect: SupportedEffects.startGame,
        userId: testUser1.userId,
        lastGameState: gamestate,
      })
    )
  );

  return E.runPromise(runnable);
};

describe("gamestate tests", () => {
  beforeEach(async () => {
    await resetAndSeedDatabase();
  });

  it("buy copper, end turn", async () => {
    // Fetch initial game state
    const startingGameState = await setUpGame();
    const startingTestUserState = startingGameState.actor_state[0];

    const totalCards = getTotalCardsForActor(startingTestUserState);

    expect(totalCards).toEqual(10);

    const runnable = pipe(
      executeGameOperation({
        effect: SupportedEffects.buyCard,
        userId: testUser1.userId,
        cardName: "copper",
        lastGameState: startingGameState,
      }),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.incrementTurn,
          userId: testUser1.userId,
        })
      )
    );

    const postTestGameState = await E.runPromise(runnable);

    // Assertions
    expect(postTestGameState.turn).toEqual(2);
    expect(postTestGameState.global_state.supply.copper).toEqual(59);
    expect(postTestGameState.global_state.history).toContain(
      `${testUser1.username} purchased a copper`
    );
    expect(postTestGameState.actor_state[0].cardsInPlay).toEqual(zeroCardCount);

    const postTestTotalCards = getTotalCardsForActor(
      postTestGameState.actor_state[0]
    );
    expect(postTestTotalCards).toEqual(11);
  });

  it("only the cards used for purchase are removed from cardsInPlay", async () => {
    // Fetch initial game state
    const startingGameState = await setUpGame();

    const gameStateWithExtraCoppersInHand = {
      ...startingGameState,
      actor_state: startingGameState.actor_state.map((actor) => {
        return {
          ...actor,
          hand: {
            ...actor.hand,
            copper: 5,
          },
        };
      }),
    };

    const runnable = pipe(
      executeGameOperation({
        lastGameState: gameStateWithExtraCoppersInHand,
        effect: SupportedEffects.playTreasure,
        userId: testUser1.userId,
        cardName: "copper",
      }),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.playTreasure,
          userId: testUser1.userId,
          cardName: "copper",
        })
      ),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.playTreasure,
          userId: testUser1.userId,
          cardName: "copper",
        })
      ),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.playTreasure,
          userId: testUser1.userId,
          cardName: "copper",
        })
      ),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.playTreasure,
          userId: testUser1.userId,
          cardName: "copper",
        })
      ),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.buyCard,
          userId: testUser1.userId,
          cardName: "silver",
        })
      )
    );

    const postTestGameState = await E.runPromise(runnable);

    // Assertions
    expect(postTestGameState.actor_state[0].cardsInPlay).toEqual({
      copper: 2,
      silver: 0,
      gold: 0,
      estate: 0,
      duchy: 0,
      province: 0,
      village: 0,
      smithy: 0,
      market: 0,
      mine: 0,
      laboratory: 0,
      festival: 0,
      councilRoom: 0,
      workshop: 0,
      moneylender: 0,
    });
  });
});

describe("chat tests", () => {
  beforeEach(async () => {
    await resetAndSeedDatabase();
  });

  it("send chat message", async () => {
    const initialGamestate = await E.runPromise(getTestSession);

    const room = initialGamestate.room;
    const testMsg = {
      mutationIndex: initialGamestate.mutation_index,
      authToken: testUser1.authToken,
      effect: SupportedEffects.sendChatMessage,
      room: room,
      cardName: undefined,
      userId: testUser1.userId,
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

  it("can add bot and have converstion with bot", async () => {
    const initialGameState = await E.runPromise(getTestSession);
    const addBotPlayerRunnable = pipe(
      executeGameOperation({
        effect: SupportedEffects.addLivePlayer,
        userId: testUser1.userId,
        lastGameState: initialGameState,
      }),
      E.flatMap((gamestate) =>
        executeGameOperation({
          effect: SupportedEffects.addBotPlayer,
          userId: testUser1.userId,
          lastGameState: gamestate,
        })
      )
    );

    const testMsg1 = {
      mutationIndex: initialGameState.mutation_index,
      authToken: testUser1.authToken,
      effect: SupportedEffects.sendChatMessage,
      room: initialGameState.room,
      cardName: undefined,
      userId: testUser1.userId,
      chatMessage: "test chat message 1",
    } as ClientPayload;

    const testMsg2 = {
      ...testMsg1,
      chatMessage: "test chat message 2",
    } as ClientPayload;

    const sendChatMessage1 = DBConnection.pipe(
      E.flatMap((connection) => connection.pool),
      E.flatMap((pool) =>
        E.all({
          pool: E.succeed(pool),
          msg: E.succeed(testMsg1),
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

    const sendChatMessage2 = DBConnection.pipe(
      E.flatMap((connection) => connection.pool),
      E.flatMap((pool) =>
        E.all({
          pool: E.succeed(pool),
          msg: E.succeed(testMsg2),
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

    const sendChatMessage1Runnable = E.provideService(
      sendChatMessage1,
      DBConnection,
      DBConnectionTest
    );

    const sendBotMessagesRunnable = getSendBotMessagesRunnable(testMsg1, []);

    const sendChatMessage2Runnable = E.provideService(
      sendChatMessage2,
      DBConnection,
      DBConnectionTest
    );

    await E.runPromise(addBotPlayerRunnable);
    await E.runPromise(sendChatMessage1Runnable);
    await E.runPromise(sendBotMessagesRunnable);
    const resultLog = await E.runPromise(sendChatMessage2Runnable);
    expect(resultLog.some((msg) => msg.username.match(/_bot_/))).toEqual(true);
    expect(resultLog.length).toEqual(3);
  });
});
