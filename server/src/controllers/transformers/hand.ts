import * as Effect from "@effect/io/Effect";
import {
  CardName,
  GameState,
  cardNamesToCount,
  discardHand,
} from "../../../../shared/common";
import { isUsersTurn } from "../../../../shared/utils";

const dealFiveCards = (
  deck: readonly CardName[]
): { newCards: readonly CardName[]; remainingDeck: readonly CardName[] } => {
  return {
    newCards: deck.slice(0, 5),
    remainingDeck: deck.slice(5),
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
      const { newCards, remainingDeck } = dealFiveCards(shuffledDecks[index]);
      return {
        ...actor,
        hand: cardNamesToCount(newCards),
        deck: remainingDeck,
        discardPile: discardHand(actor.hand, actor.discardPile),
      };
    }),
  });
};

const reshuffleDeck = (
  deck: readonly CardName[],
  discardPile: readonly CardName[]
) => {
  return shuffleDeck(deck.concat(discardPile));
};

export const cleanUp = (gameState: GameState) => {
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor, index) => {
      if (isUsersTurn(gameState, actor.name)) {
        if (actor.deck.length >= 5) {
          const { newCards, remainingDeck } = dealFiveCards(actor.deck);
          return {
            ...actor,
            hand: cardNamesToCount(newCards),
            deck: remainingDeck,
            discardPile: discardHand(actor.hand, actor.discardPile),
          };
        } else {
          const newDeck = reshuffleDeck(actor.deck, actor.discardPile);
          const { newCards, remainingDeck } = dealFiveCards(newDeck);
          return {
            ...actor,
            hand: cardNamesToCount(newCards),
            deck: remainingDeck,
            discardPile: [],
          };
        }
      } else return gameState.actor_state[index];
    }),
  });
};
