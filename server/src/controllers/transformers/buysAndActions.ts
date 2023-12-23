import * as Effect from "@effect/io/Effect";
import {
  CardName,
  GameState,
  Phases,
  cardNamesToCount,
  hasActionCard,
  subtractCardCount,
  sumCardCounts,
} from "../../../../shared/common";
import { indefiniteArticle } from "../../../../shared/utils";
import { dealCards } from "./hand";

export const resetBuysAndActions = (gameState: GameState) => {
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor) => {
      return {
        ...actor,
        buys: 1,
        actions: 1,
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

export const applyAction = (
  gameState: GameState,
  userId: string,
  cardName: CardName
): GameState => {
  switch (cardName) {
    case "village": {
      const newActorState = gameState.actor_state.map((actor) => {
        if (actor.id === userId) {
          return {
            ...actor,
            actions: actor.actions + 2,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }
    case "smithy": {
      const newActorState = gameState.actor_state.map((actor) => {
        const { newCards, remainingDeck } = dealCards(actor.deck, 3);
        if (actor.id === userId) {
          return {
            ...actor,
            hand: sumCardCounts(actor.hand, cardNamesToCount(newCards)),
            deck: remainingDeck,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }

    default: {
      return gameState;
    }
  }
};

export const playAction = ({
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
    const remainingActions = actor.actions - 1;
    if (actor.id === userId) {
      return {
        ...actor,
        hand: subtractCardCount(
          actor.hand,
          cardNamesToCount(toDiscardFromHand)
        ),
        discardPile: [...actor.discardPile, ...toDiscardFromHand],
        actions: remainingActions,
        phase: remainingActions < 1 ? Phases.Buy : Phases.Action,
      };
    }
    return actor;
  });

  const latestTransaction = `${
    gameState.actor_state.filter((a) => a.id === userId)[0].name
  } played ${indefiniteArticle(cardName)} ${cardName}`;

  const newGlobalState = {
    ...gameState.global_state,
    history: [...gameState.global_state.history, latestTransaction],
  };

  const updatedGameState = {
    ...gameState,
    global_state: newGlobalState,
    actor_state: newActorState,
  };

  return Effect.succeed(applyAction(updatedGameState, userId, cardName));
};
