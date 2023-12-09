import * as Effect from "@effect/io/Effect";
import { GameState } from "../../../../shared/common";

export const resetBuysAndActions = (gameState: GameState) => {
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor) => {
      return {
        ...actor,
        buys: 1,
        actions: 1,
      };
    }),
  });
};
