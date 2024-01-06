import * as Effect from "@effect/io/Effect";
import { describe, it } from "vitest";
import { DBConnectionTest, DBConnection } from "../db/connection";

import { ClientPayload, SupportedEffects } from "../../../shared/common";
import { handleGameMessage } from "../websocketServer/handleGameMessage";

describe("websocket message handling", () => {
  it("addLivePlayer", () => {
    const testMsg = {
      authToken: "test",
      effect: SupportedEffects.addLivePlayer,
      room: 1,
      cardName: "copper",
      userId: "1",
      toDiscardFromHand: [],
      chatMessage: "",
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
            userId: "1",
            username: "test",
          },
        })
      )
    );

    const runnable = Effect.provideService(
      processMessage,
      DBConnection,
      DBConnectionTest
    );

    Effect.runPromise(runnable);
  });
});
