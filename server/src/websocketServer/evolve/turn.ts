import { Effect as E } from "effect";
import { GameState } from "../../../../shared/common";

export const incrementTurn = (gameState: GameState, username: string) => {
  const latestTransaction =
    gameState.turn > 0
      ? `${username} ended their turn`
      : `${username} started the game`;

  const newHistory = gameState.global_state.history.concat(latestTransaction);

  return E.succeed({
    ...gameState,
    turn: gameState.turn + 1,
    global_state: { ...gameState.global_state, history: newHistory },
  });
};
