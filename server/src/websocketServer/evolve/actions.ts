import { Effect as E } from "effect";
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
      // todo refactor deal cards to include cards in play
      const newActorState = gameState.actor_state.map((actor) => {
        if (actor.id === userId) {
          const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
            deck: actor.deck,
            discardPile: actor.discardPile,
            numberOfCardsToDraw: 3,
          });

          return {
            ...actor,
            hand: sumCardCounts(actor.hand, cardNamesToCount(newCardsIntoHand)),
            deck: newDeck,
            discardPile: newDiscardPile,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }

    case "market": {
      const newActorState = gameState.actor_state.map((actor) => {
        const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
          deck: actor.deck,
          discardPile: actor.discardPile,
          numberOfCardsToDraw: 1,
        });

        if (actor.id === userId) {
          return {
            ...actor,
            hand: sumCardCounts(actor.hand, cardNamesToCount(newCardsIntoHand)),
            deck: newDeck,
            actions: actor.actions + 1,
            buys: actor.buys + 1,
            discardPile: newDiscardPile,
            bonusTreasureValue: actor.bonusTreasureValue + 1,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }

    case "laboratory": {
      const newActorState = gameState.actor_state.map((actor) => {
        const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
          deck: actor.deck,
          discardPile: actor.discardPile,
          numberOfCardsToDraw: 2,
        });
        if (actor.id === userId) {
          return {
            ...actor,
            hand: sumCardCounts(actor.hand, cardNamesToCount(newCardsIntoHand)),
            deck: newDeck,
            actions: actor.actions + 1,
            discardPile: newDiscardPile,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }

    case "festival": {
      const newActorState = gameState.actor_state.map((actor) => {
        if (actor.id === userId) {
          return {
            ...actor,
            actions: actor.actions + 2,
            buys: actor.buys + 1,
            bonusTreasureValue: actor.bonusTreasureValue + 2,
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

    case "councilRoom": {
      const newActorState = gameState.actor_state.map((actor) => {
        const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
          deck: actor.deck,
          discardPile: actor.discardPile,
          numberOfCardsToDraw: 4,
        });
        if (actor.id === userId) {
          return {
            ...actor,
            hand: sumCardCounts(actor.hand, cardNamesToCount(newCardsIntoHand)),
            deck: newDeck,
            buys: actor.buys + 1,
            discardPile: newDiscardPile,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }
  }
};

// todo refactor with reusable helper functions
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

  const updatedGameState = applyAction(
    {
      ...gameState,
      global_state: newGlobalState,
      actor_state: newActorState,
    },
    userId,
    cardName
  );

  const GameStateWithLatestPhase = {
    ...updatedGameState,
    actor_state: updatedGameState.actor_state.map((actor) => {
      if (actor.id === userId) {
        return {
          ...actor,
          phase:
            actor.actions < 1 || !hasActionCard(actor.hand)
              ? Phases.Buy
              : Phases.Action,
        };
      }
      return actor;
    }),
  };

  return E.succeed(GameStateWithLatestPhase);
};
