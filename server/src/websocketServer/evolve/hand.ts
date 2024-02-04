import { Effect as E } from "effect";
import {
  CardName,
  GameState,
  Phases,
  cardNamesToCount,
  countToCardNamesArray,
  hasActionCard,
  subtractCardCount,
  sumCardCounts,
  zeroCardCount,
} from "../../../../shared/common";
import { isUsersTurn } from "../../../../shared/utils";
import { sum } from "effect/Duration";

export const dealCards = ({
  deck,
  numberOfCardsToDraw,
  discardPile,
}: {
  deck: readonly CardName[];
  numberOfCardsToDraw: number;
  discardPile: readonly CardName[];
}) => {
  if (deck.length < numberOfCardsToDraw) {
    const lastCardsInDeck = deck.slice(0, deck.length);
    const numberOfCardsLeftInDeck = deck.length;

    const restOfDeck = shuffleDeck([
      ...deck.slice(deck.length),
      ...discardPile,
    ]);

    const newCardsToHand = restOfDeck.slice(
      0,
      numberOfCardsToDraw - numberOfCardsLeftInDeck
    );

    return {
      newCardsIntoHand: lastCardsInDeck.concat(newCardsToHand),
      newDeck: restOfDeck.slice(numberOfCardsToDraw - numberOfCardsLeftInDeck),
      newDiscardPile: [],
    };
  }

  return {
    newCardsIntoHand: deck.slice(0, numberOfCardsToDraw),
    newDeck: deck.slice(numberOfCardsToDraw, deck.length),
    newDiscardPile: discardPile,
  };
};

const shuffleDeck = (deck: readonly CardName[]): readonly CardName[] => {
  const shuffledDeck = [...deck];
  for (let i = shuffledDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
  }
  return shuffledDeck;
};

export const dealToAllActors = (gameState: GameState) => {
  const decks = gameState.actor_state.map((actor) => actor.deck);

  const shuffledDecks = decks.map((deck) => shuffleDeck(deck));

  return E.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor, index) => {
      const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
        deck: shuffledDecks[index],
        numberOfCardsToDraw: 5,
        discardPile: actor.discardPile,
      });
      const newHand = cardNamesToCount(newCardsIntoHand);
      return {
        ...actor,
        hand: newHand,
        deck: newDeck,
        discardPile: newDiscardPile,
        phase: hasActionCard(newHand) ? Phases.Action : Phases.Buy,
      };
    }),
  });
};

export const playAllTreasures = (gameState: GameState) => {
  return E.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor) => {
      if (isUsersTurn(gameState, actor.name)) {
        const newHand = {
          ...actor.hand,
          copper: 0,
          silver: 0,
          gold: 0,
        };
        return {
          ...actor,
          hand: newHand,
          cardsInPlay: {
            ...actor.cardsInPlay,
            copper: actor.hand.copper,
            silver: actor.hand.silver,
            gold: actor.hand.gold,
          },
        };
      }
      return actor;
    }),
  });
};

export const playTreasure = ({
  gameState,
  userId,
  cardName,
}: {
  gameState: GameState;
  userId: string;
  cardName: CardName;
}) => {
  const newActorState = gameState.actor_state.map((actor) => {
    if (actor.id === userId) {
      return {
        ...actor,
        hand: subtractCardCount(actor.hand, cardNamesToCount([cardName])),
        cardsInPlay: {
          ...actor.cardsInPlay,
          [cardName]: actor.cardsInPlay[cardName] + 1,
        },
      };
    }
    return actor;
  });

  return E.succeed({
    ...gameState,
    actor_state: newActorState,
  });
};

export const resetPlayedTreasures = (gameState: GameState) => {
  return E.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor) => {
      return {
        ...actor,
        cardsInPlay: zeroCardCount,
        hand: {
          ...actor.hand,
          copper: actor.hand.copper + actor.cardsInPlay.copper,
          silver: actor.hand.silver + actor.cardsInPlay.silver,
          gold: actor.hand.gold + actor.cardsInPlay.gold,
        },
      };
    }),
  });
};

export const cleanUp = (gameState: GameState) => {
  return E.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor, index) => {
      if (isUsersTurn(gameState, actor.name)) {
        const toDiscardFromHand = Object.entries(actor.hand).reduce(
          (acc, [cardName, count]) => {
            return acc.concat(Array(count).fill(cardName));
          },
          [] as CardName[]
        );

        const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
          deck: actor.deck,
          numberOfCardsToDraw: 5,
          discardPile: actor.discardPile
            .concat(toDiscardFromHand)
            .concat(countToCardNamesArray(actor.cardsInPlay)),
        });

        return {
          ...actor,
          actionPhaseDemand: null,
          bonusTreasureValue: 0,
          hand: cardNamesToCount(newCardsIntoHand),
          deck: newDeck,
          cardsInPlay: zeroCardCount,
          discardPile: newDiscardPile,
        };
      } else return gameState.actor_state[index];
    }),
  });
};
