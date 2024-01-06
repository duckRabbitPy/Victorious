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

export const determineIfGameIsOver = (gameState: GameState) => {
  const provinceSupplyEmpty = gameState.global_state.supply.province === 0;
  const threeSupplyPilesEmpty =
    Object.values(gameState.global_state.supply).filter(
      (supply) => supply === 0
    ).length >= 3;

  const gameOver = provinceSupplyEmpty || threeSupplyPilesEmpty;

  if (gameOver) {
    return Effect.succeed({
      ...gameState,
      gameOver: true,
    });
  } else {
    return Effect.succeed(gameState);
  }
};
