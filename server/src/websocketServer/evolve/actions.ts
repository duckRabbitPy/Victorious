import { Effect as E } from "effect";
import {
  ActionPhaseDemand,
  CardName,
  GameState,
  Phases,
  cardNamesToCount,
  getCardValueByName,
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
          const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
            deck: actor.deck,
            discardPile: actor.discardPile,
            numberOfCardsToDraw: 1,
            cardThatMustRemainInDiscardPile: "village",
          });

          return {
            ...actor,
            hand: sumCardCounts(actor.hand, cardNamesToCount(newCardsIntoHand)),
            deck: newDeck,
            discardPile: newDiscardPile,
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
            cardThatMustRemainInDiscardPile: "smithy",
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
          cardThatMustRemainInDiscardPile: "market",
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
          cardThatMustRemainInDiscardPile: "laboratory",
        });

        console.log({
          newCardsIntoHand,
          newDeck,
          newDiscardPile,
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
          cardThatMustRemainInDiscardPile: "councilRoom",
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

    // actions that require user action
    case "mine": {
      const newActorState = gameState.actor_state.map((actor) => {
        const actionPhaseDemand: ActionPhaseDemand = {
          actionCard: "mine",
          demandType: "Trash",
          count: 1,
        };

        if (actor.id === userId) {
          return {
            ...actor,
            actionPhaseDemand,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }

    case "workshop": {
      const newActorState = gameState.actor_state.map((actor) => {
        const actionPhaseDemand: ActionPhaseDemand = {
          actionCard: "workshop",
          demandType: "Gain",
          count: 1,
          requirement: getGainRequirementFromAction("workshop"),
        };

        if (actor.id === userId) {
          return {
            ...actor,
            actionPhaseDemand,
          };
        }
        return actor;
      });

      return {
        ...gameState,
        actor_state: newActorState,
      };
    }

    case "moneylender": {
      const newActorState = gameState.actor_state.map((actor) => {
        const actionPhaseDemand: ActionPhaseDemand = {
          actionCard: "moneylender",
          demandType: "Trash",
          count: 1,
          requirement: getTrashRequirementFromAction("moneylender"),
        };

        if (actor.id === userId) {
          return {
            ...actor,
            actionPhaseDemand,
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
          discardPile: [...actor.discardPile, ...toDiscardFromHand],
          phase:
            (actor.actions < 1 && actor.actionPhaseDemand === null) ||
            (!hasActionCard(actor.hand) && actor.actionPhaseDemand === null)
              ? Phases.Buy
              : Phases.Action,
        };
      }
      return actor;
    }),
  };

  return E.succeed(GameStateWithLatestPhase);
};

export const trashCardToMeetDemand = ({
  userId,
  gameState,
  toTrash,
}: {
  userId: string;
  gameState: GameState;
  toTrash: CardName;
}) => {
  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === userId && actor.actionPhaseDemand) {
      const remainingDemandCount =
        (actor.actionPhaseDemand?.count &&
          actor.actionPhaseDemand?.count - 1) ||
        0;

      const newDemandType = remainingDemandCount > 0 ? "Trash" : "Gain";

      const newActionPhaseDemand = {
        actionCard: actor.actionPhaseDemand.actionCard,
        demandType: newDemandType,
        count:
          newDemandType === "Trash"
            ? getTrashCountDemandFromAction(actor.actionPhaseDemand.actionCard)
            : getGainCountDemandFromAction(actor.actionPhaseDemand.actionCard),
        requirement:
          newDemandType === "Trash"
            ? getTrashRequirementFromAction(actor.actionPhaseDemand.actionCard)
            : getGainRequirementFromAction(
                actor.actionPhaseDemand.actionCard,
                toTrash
              ),
      } as ActionPhaseDemand;

      const handCopy = { ...actor.hand };
      const updatedHand = {
        ...handCopy,
        [toTrash]: handCopy[toTrash] - 1,
      };

      return {
        ...actor,
        hand: updatedHand,
        discardPile: [...actor.discardPile, toTrash],
        actionPhaseDemand: newActionPhaseDemand,
      };
    }
    return actor;
  });

  const latestTransaction = `${
    gameState.actor_state.filter((a) => a.id === userId)[0].name
  } trashed ${indefiniteArticle(toTrash)} ${toTrash}`;

  const newGlobalState = {
    ...gameState.global_state,
    history: [...gameState.global_state.history, latestTransaction],
  };

  const updatedGameState = {
    ...gameState,
    global_state: newGlobalState,
    actor_state: newActorState,
  };

  return E.succeed(updatedGameState);
};

const getTrashCountDemandFromAction = (actionCard: CardName) => {
  switch (actionCard) {
    case "moneylender":
    case "mine":
      return 1;
    case "workshop":
      return 0;
    default:
      return 0;
  }
};

const getGainCountDemandFromAction = (actionCard: CardName) => {
  switch (actionCard) {
    case "mine":
      return 1;
    case "moneylender":
    case "workshop":
      return 1;
    default:
      return 0;
  }
};

const getTrashRequirementFromAction = (actionCard: CardName) => {
  switch (actionCard) {
    case "moneylender":
      return {
        type: "Treasure" as const,
        minValue: 0,
        maxValue: 1,
      };
    default:
      return undefined;
  }
};

const getGainRequirementFromAction = (
  actionCard: CardName,
  trashedCard?: CardName
) => {
  switch (actionCard) {
    case "mine":
      return {
        maxValue: trashedCard && getCardValueByName(trashedCard) + 3,
      };
    case "workshop":
      return {
        maxValue: 4,
      };
    case "moneylender":
      return {
        maxValue: 3,
      };
    default:
      return undefined;
  }
};

export const goToBuyPhase = (gameState: GameState) => {
  const currentActorGameState =
    gameState.actor_state[gameState.turn % gameState.actor_state.length];

  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === currentActorGameState.id) {
      return {
        ...actor,
        actions: 0,
        actionPhaseDemand: null,
        phase: Phases.Buy,
      };
    }
    return actor;
  });

  return E.succeed({
    ...gameState,
    actor_state: newActorState,
  });
};
