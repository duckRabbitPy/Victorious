import { pipe, Effect } from "effect";
import {
  CardName,
  GameState,
  Phases,
  cardNameToCard,
  cardNamesToCount,
  getTreasureValue,
  hasActionCard,
  subtractCardCount,
  zeroCardCount,
} from "../../../../shared/common";
import { indefiniteArticle } from "../../../../shared/utils";
import { IllegalGameStateError } from "../../customErrors";

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
  if (gameState.global_state.supply[cardName] < 1) {
    return Effect.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because supply is empty`,
      })
    );
  }

  if (gameState.actor_state.filter((a) => a.id === userId)[0].buys < 1) {
    return Effect.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because no buys remaining`,
      })
    );
  }

  if (
    getTreasureValue(cardNamesToCount(toDiscardFromHand)) <
    cardNameToCard(cardName).cost
  ) {
    return Effect.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because insufficient treasure value`,
      })
    );
  }

  const newActorState = gameState.actor_state.map((actor) => {
    // todo effect.fail if not enough buys
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
    actor_state: newActorState,
    global_state: newGlobalState,
  });
};

export const validateCanBuyCard = ({
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
  if (gameState.global_state.supply[cardName] < 1) {
    return Effect.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because supply is empty`,
      })
    );
  }

  if (gameState.actor_state.filter((a) => a.id === userId)[0].buys < 1) {
    return Effect.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because no buys remaining`,
      })
    );
  }

  if (
    getTreasureValue(cardNamesToCount(toDiscardFromHand)) <
    cardNameToCard(cardName).cost
  ) {
    return Effect.fail(
      new IllegalGameStateError({
        message: `Cannot buy ${cardName} because insufficient treasure value`,
      })
    );
  }

  return Effect.succeed(gameState);
};
