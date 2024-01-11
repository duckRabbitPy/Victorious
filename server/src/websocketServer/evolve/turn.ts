import { Effect as E } from "effect";
import { GameState } from "../../../../shared/common";

export const incrementTurn = (gameState: GameState) => {
  return E.succeed({ ...gameState, turn: gameState.turn + 1 });
};
