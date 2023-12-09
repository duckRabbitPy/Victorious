import * as Effect from "@effect/io/Effect";
import { CardName, GameState } from "../../../../shared/common";

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

export const buyCardTransform = ({
  gameState,
  userId,
  cardName,
}: {
  gameState: GameState;
  userId: string;
  //   todo validate card name
  cardName: CardName | undefined;
}) => {
  //   todo validate card name
  if (!cardName) return Effect.succeed(gameState);
  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === userId) {
      return {
        ...actor,
        deck: { ...actor.deck, [cardName]: actor.deck.concat(cardName) },
        buys: actor.buys - 1,
      };
    }
    return actor;
  });

  const newGlobalState = {
    ...gameState.global_state,
    supply: {
      ...gameState.global_state.supply,
      [cardName]: gameState.global_state.supply[cardName] - 1,
    },
  };

  return Effect.succeed({
    ...gameState,
    global_state: newGlobalState,
    actor_state: newActorState,
  });
};
