import { pipe, Effect } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { DBConnectionTest, DBConnection } from "../db/connection";
import { TEST_ROOM, resetAndSeedDatabase, testUser1 } from "../db/seed";
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

describe("websocket message handling", () => {
  beforeAll(async () => {
    await resetAndSeedDatabase();
  });

  it("addLivePlayer", async () => {
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
    const runnable = Effect.provideService(
      addNewPlayerToGame,
      DBConnection,
      DBConnectionTest
    );

    expect((await Effect.runPromise(runnable)).actor_state[0].id).toEqual(
      testUser1.userId
    );
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
});
