import * as Effect from "@effect/io/Effect";
import {
  CardName,
  GameState,
  Phases,
  cardNamesToCount,
  hasActionCard,
  subtractCardCount,
  zeroCardCount,
} from "../../../../shared/common";
import { indefiniteArticle } from "../../../../shared/utils";

export const resetBuysAndActions = (gameState: GameState) => {
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor) => {
      return {
        ...actor,
        buys: 1,
        actions: 1,
        cardsInPlay: zeroCardCount,
        phase: hasActionCard(actor.hand) ? Phases.Action : Phases.Buy,
      };
    }),
  });
};

export const buyCard = ({
  gameState,
  userId,
  cardName,
  toDiscardFromHand,
}: {
  gameState: GameState;
  userId: string;
  cardName: CardName;
  toDiscardFromHand: readonly CardName[];
}) => {
  const newActorState = gameState.actor_state.map((actor) => {
    const remainingBuys = actor.buys - 1;
    if (actor.id === userId) {
      return {
        ...actor,
        deck: [...actor.deck, cardName],
        buys: remainingBuys,
        hand: subtractCardCount(
          actor.hand,
          cardNamesToCount(toDiscardFromHand)
        ),
        // todo: prevent 'overpaying' if more cards in play than needed
        cardsInPlay: zeroCardCount,
        phase: remainingBuys < 1 ? Phases.Buy : Phases.Action,
        discardPile: [...actor.discardPile, ...toDiscardFromHand],
      };
    }
    return actor;
  });

  const latestTransaction = `${
    gameState.actor_state.filter((a) => a.id === userId)[0].name
  } purchased ${indefiniteArticle(cardName)} ${cardName}`;

  const newGlobalState = {
    ...gameState.global_state,
    supply: {
      ...gameState.global_state.supply,
      [cardName]: gameState.global_state.supply[cardName] - 1,
    },
    history: [...gameState.global_state.history, latestTransaction],
  };

  return Effect.succeed({
    ...gameState,
    global_state: newGlobalState,
    actor_state: newActorState,
  });
};
