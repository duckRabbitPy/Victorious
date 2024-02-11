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
import { handleChatMessage } from "../websocketServer/handleChatMessage";
import { executeGameOperation } from "./helpers";

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

describe("gamestate tests", () => {
  beforeAll(async () => {
    await resetAndSeedDatabase();
  });

  it("add players, start game, buy card, end turn", async () => {
    // Fetch initial game state
    const initialGameState = await E.runPromise(getTestSession);

    // Execute operations sequentially
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
      ),
      E.flatMap((gamestate) =>
        executeGameOperation({
          effect: SupportedEffects.buyCard,
          userId: testUser1.userId,
          cardName: "copper",
          lastGameState: gamestate,
        })
      ),
      E.flatMap((gamestate) =>
        executeGameOperation({
          lastGameState: gamestate,
          effect: SupportedEffects.incrementTurn,
          userId: testUser1.userId,
        })
      )
    );

    const newGameState = await E.runPromise(runnable);

    // Assertions
    expect(newGameState.turn).toEqual(2);
    expect(newGameState.global_state.supply.copper).toEqual(59);
    expect(newGameState.global_state.history).toContain(
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

describe("chat tests", () => {
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
});
