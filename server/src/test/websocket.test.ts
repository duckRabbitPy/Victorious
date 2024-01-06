import * as Effect from "@effect/io/Effect";
import { beforeAll, describe, it } from "vitest";
import { DBConnectionTest, DBConnection } from "../db/connection";
import { SEED_ROOM, resetAndSeedDatabase } from "../db/seed";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import { safeParseGameState } from "../../../shared/common";

const getTestSession = Effect.provideService(
  DBConnection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) => getLatestGameSnapshotQuery(SEED_ROOM, pool)),
    Effect.flatMap((gameState) => Effect.succeed(gameState)),
    safeParseGameState
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
    console.log(JSON.stringify(initialGamestate));
    // const room = initialGamestate.room;
    // const testMsg = {
    //   authToken: "test",
    //   effect: SupportedEffects.addLivePlayer,
    //   room: room,
    //   cardName: "copper",
    //   userId: "1",
    //   toDiscardFromHand: [],
    //   chatMessage: "",
    // } as ClientPayload;
    // const processMessage = DBConnection.pipe(
    //   Effect.flatMap((connection) => connection.pool),
    //   Effect.flatMap((pool) =>
    //     Effect.all({
    //       pool: Effect.succeed(pool),
    //       msg: Effect.succeed(testMsg),
    //     })
    //   ),
    //   Effect.flatMap(({ msg, pool }) =>
    //     handleGameMessage({
    //       msg,
    //       pool,
    //       userInfo: {
    //         userId: "1",
    //         username: "test",
    //       },
    //     })
    //   )
    // );
    // const runnable = Effect.provideService(
    //   processMessage,
    //   DBConnection,
    //   DBConnectionTest
    // );
    // Effect.runPromise(runnable);
  });
});
