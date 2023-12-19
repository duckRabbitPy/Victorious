import * as Effect from "@effect/io/Effect";
import { CardCount, CardName, GameState } from "../../../../shared/common";
import { indefiniteArticle } from "../../../../shared/utils";

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

export const buyCard = ({
  gameState,
  userId,
  cardName,
}: {
  gameState: GameState;
  userId: string;
  //   todo validate card name
  cardName: CardName | undefined;
}) => {
  if (!cardName) return Effect.succeed(gameState);
  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === userId) {
      return {
        ...actor,
        deck: [...actor.deck, cardName],
        buys: actor.buys - 1,
      };
    }
    return actor;
  });

  const lastestTransaction = `${
    gameState.actor_state.filter((a) => a.id === userId)[0].name
  } purchased ${indefiniteArticle(cardName)} ${cardName}`;

  const newGlobalState = {
    ...gameState.global_state,
    supply: {
      ...gameState.global_state.supply,
      [cardName]: gameState.global_state.supply[cardName] - 1,
    },
    history: [...gameState.global_state.history, lastestTransaction],
  };

  return Effect.succeed({
    ...gameState,
    global_state: newGlobalState,
    actor_state: newActorState,
  });
};
