import { Effect as E } from "effect";
import {
  ActionPhaseDemand,
  CardName,
  GameState,
  Phases,
  cardNameToCard,
  cardNamesToCount,
  countToCardNamesArray,
  getTreasureValue,
  hasActionCard,
  subtractCardCount,
  sumCardCounts,
  zeroCardCount,
} from "../../../../shared/common";
import { indefiniteArticle } from "../../../../shared/utils";
import { IllegalGameStateError } from "../../customErrors";

const selectTreasureCardsToPayWith = (
  cardNames: readonly CardName[],
  targetValue: number
): CardName[] => {
  return cardNames.reduce((acc, cardName) => {
    const currentTotalValue = getTreasureValue(cardNamesToCount(acc));
    if (currentTotalValue <= targetValue) {
      return [...acc, cardName];
    }
    return acc;
  }, [] as CardName[]);
};

export const resetBuysAndActions = (gameState: GameState) => {
  return E.succeed({
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
}: {
  gameState: GameState;
  userId: string;
  cardName: CardName;
}) => {
  if (gameState.global_state.supply[cardName] < 1) {
    return E.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because supply is empty`,
      })
    );
  }

  if (gameState.actor_state.filter((a) => a.id === userId)[0].buys < 1) {
    return E.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because no buys remaining`,
      })
    );
  }

  if (
    getTreasureValue(
      gameState.actor_state.filter((a) => a.id === userId)[0].cardsInPlay
    ) +
      gameState.actor_state.filter((a) => a.id === userId)[0]
        .bonusTreasureValue <
    cardNameToCard(cardName).cost
  ) {
    return E.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because insufficient treasure value`,
      })
    );
  }

  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === userId) {
      const remainingBuys = actor.buys - 1;

      if (cardName === "copper") {
        return {
          ...actor,
          buys: remainingBuys,
          deck: [...actor.deck, cardName],
        };
      }

      const cardsToPayWith = selectTreasureCardsToPayWith(
        countToCardNamesArray(actor.cardsInPlay),
        getTreasureValue(cardNamesToCount([cardName]))
      );

      const newCardsInPlay = subtractCardCount(
        actor.cardsInPlay,
        cardNamesToCount(cardsToPayWith)
      );

      const discardedFromPlayTeasures = subtractCardCount(
        actor.cardsInPlay,
        newCardsInPlay
      );

      return {
        ...actor,
        buys: remainingBuys,
        // todo: prevent 'overpaying' if more cards in play than needed
        cardsInPlay: newCardsInPlay,
        deck: [...actor.deck, cardName],
        discardPile: [
          ...actor.discardPile,
          ...countToCardNamesArray(discardedFromPlayTeasures),
        ],
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

  return E.succeed({
    ...gameState,
    actor_state: newActorState,
    global_state: newGlobalState,
  });
};

export const gainCard = ({
  gameState,
  userId,
  cardName,
}: {
  gameState: GameState;
  userId: string;
  cardName: CardName;
}) => {
  if (gameState.global_state.supply[cardName] < 1) {
    return E.fail(
      new IllegalGameStateError({
        message: `Cannot gain ${cardName} because supply is empty`,
      })
    );
  }

  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === userId) {
      const currentActorDemandPhase =
        actor.actionPhaseDemand as ActionPhaseDemand;

      const endActionDemandPhase =
        currentActorDemandPhase?.count === null || 1 || 0;

      const newActionPhaseDemand = endActionDemandPhase
        ? null
        : {
            ...currentActorDemandPhase,
            count: (currentActorDemandPhase?.count || 1) - 1,
          };

      const newHand = {
        ...actor.hand,
        [cardName]: actor.hand[cardName] + 1,
      };

      return {
        ...actor,
        hand: newHand,
        phase:
          hasActionCard(newHand) && actor.actions > 0
            ? Phases.Action
            : Phases.Buy,
        actionPhaseDemand: newActionPhaseDemand,
      };
    }
    return actor;
  });

  const latestTransaction = `${
    gameState.actor_state.filter((a) => a.id === userId)[0].name
  } gained ${indefiniteArticle(cardName)} ${cardName}`;

  const newGlobalState = {
    ...gameState.global_state,
    supply: {
      ...gameState.global_state.supply,
      [cardName]: gameState.global_state.supply[cardName] - 1,
    },
    history: [...gameState.global_state.history, latestTransaction],
  };

  return E.succeed({
    ...gameState,
    actor_state: newActorState,
    global_state: newGlobalState,
  });
};
