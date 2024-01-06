import * as Effect from "@effect/io/Effect";
import { beforeAll, describe, expect, it } from "vitest";
import { DBConnectionTest, DBConnection } from "../db/connection";
import { SEED_ROOM, resetAndSeedDatabase } from "../db/seed";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import {
  ClientPayload,
  SupportedEffects,
  safeParseGameState,
} from "../../../shared/common";
import { handleGameMessage } from "../websocketServer/handleGameMessage";

const testUser = {
  userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  username: "testUser1",
  authToken: "zI1NivsInR5tCI6IkpPVCJ9.eyJ1c2VySWQiOiIyYzLkZmIy",
};

const getTestSession = Effect.provideService(
  DBConnection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) => getLatestGameSnapshotQuery(SEED_ROOM, pool)),
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
      authToken: testUser.authToken,
      effect: SupportedEffects.addLivePlayer,
      room: room,
      cardName: undefined,
      userId: testUser.userId,
      toDiscardFromHand: [],
      chatMessage: undefined,
    } as ClientPayload;

    const processMessage = DBConnection.pipe(
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
            userId: testUser.userId,
            username: testUser.username,
          },
        })
      ),
      Effect.flatMap(safeParseGameState)
    );
    const runnable = Effect.provideService(
      processMessage,
      DBConnection,
      DBConnectionTest
    );

    expect((await Effect.runPromise(runnable)).actor_state[0].id).toEqual(
      testUser.userId
    );
  });
});
