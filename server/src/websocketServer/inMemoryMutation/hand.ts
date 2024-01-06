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
import { isUsersTurn } from "../../../../shared/utils";

export const dealCards = (
  deck: readonly CardName[],
  number: number,
  discardPile: readonly CardName[]
): {
  newCards: readonly CardName[];
  remainingDeck: readonly CardName[];
  discardPile: readonly CardName[];
} => {
  if (deck.length < number) {
    const lastCards = deck.slice(0, deck.length);
    const newDeck = reshuffleDeck(deck.slice(deck.length), discardPile);

    return {
      newCards: lastCards.concat(newDeck.slice(0, number - lastCards.length)),
      remainingDeck: newDeck.slice(number - lastCards.length),
      discardPile: [],
    };
  }
  return {
    newCards: deck.slice(0, number),
    remainingDeck: deck.slice(number),
    discardPile,
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

  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor, index) => {
      const { newCards, remainingDeck, discardPile } = dealCards(
        shuffledDecks[index],
        5,
        actor.discardPile
      );
      const newHand = cardNamesToCount(newCards);
      return {
        ...actor,
        hand: newHand,
        deck: remainingDeck,
        discardPile: discardPile,
        phase: hasActionCard(newHand) ? Phases.Action : Phases.Buy,
      };
    }),
  });
};

export const reshuffleDeck = (
  deck: readonly CardName[],
  discardPile: readonly CardName[]
) => {
  return shuffleDeck(deck.concat(discardPile));
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

  return Effect.succeed({
    ...gameState,
    actor_state: newActorState,
  });
};

export const resetPlayedTreasures = (gameState: GameState) => {
  return Effect.succeed({
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
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor, index) => {
      if (isUsersTurn(gameState, actor.name)) {
        const toDiscardFromHand = Object.entries(actor.hand).reduce(
          (acc, [cardName, count]) => {
            return acc.concat(Array(count).fill(cardName));
          },
          [] as CardName[]
        );

        const newDeck = reshuffleDeck(
          actor.deck,
          actor.discardPile.concat(toDiscardFromHand)
        );
        const { newCards, remainingDeck, discardPile } = dealCards(
          newDeck,
          5,
          actor.discardPile
        );

        return {
          ...actor,
          hand: cardNamesToCount(newCards),
          deck: remainingDeck,
          discardPile,
        };
      } else return gameState.actor_state[index];
    }),
  });
};
