import * as Effect from "@effect/io/Effect";
import { GameState, cardNameToVictoryPoints } from "../../../../shared/common";

export const deduceVictoryPoints = (gameState: GameState) => {
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor) => {
      const victoryPoints = actor.deck.reduce((acc, cardName) => {
        return acc + cardNameToVictoryPoints(cardName);
      }, 0);
      return {
        ...actor,
        victoryPoints,
      };
    }),
  });
};
