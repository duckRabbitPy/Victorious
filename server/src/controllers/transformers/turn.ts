import * as Effect from "@effect/io/Effect";
import { GameState } from "../../../../shared/common";

export const incrementTurn = (gameState: GameState) => {
  return Effect.succeed({ ...gameState, turn: gameState.turn + 1 });
};
