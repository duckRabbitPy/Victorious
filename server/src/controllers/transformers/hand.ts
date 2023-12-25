import * as Effect from "@effect/io/Effect";
import {
  CardName,
  GameState,
  Phases,
  cardNamesToCount,
  discardHand,
  hasActionCard,
  subtractCardCount,
  zeroCardCount,
} from "../../../../shared/common";
import { isUsersTurn } from "../../../../shared/utils";

export const dealCards = (
  deck: readonly CardName[],
  number: number
): { newCards: readonly CardName[]; remainingDeck: readonly CardName[] } => {
  return {
    newCards: deck.slice(0, number),
    remainingDeck: deck.slice(number),
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
      const { newCards, remainingDeck } = dealCards(shuffledDecks[index], 5);
      const newHand = cardNamesToCount(newCards);
      return {
        ...actor,
        hand: newHand,
        deck: remainingDeck,
        discardPile: discardHand(actor.hand, actor.discardPile),
        phase: hasActionCard(newHand) ? Phases.Action : Phases.Buy,
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
      };
    }),
  });
};

export const cleanUp = (gameState: GameState) => {
  return Effect.succeed({
    ...gameState,
    actor_state: gameState.actor_state.map((actor, index) => {
      if (isUsersTurn(gameState, actor.name)) {
        if (actor.deck.length >= 5) {
          const { newCards, remainingDeck } = dealCards(actor.deck, 5);
          return {
            ...actor,
            hand: cardNamesToCount(newCards),
            deck: remainingDeck,
            discardPile: discardHand(actor.hand, actor.discardPile),
          };
        } else {
          const newDeck = reshuffleDeck(actor.deck, actor.discardPile);
          const { newCards, remainingDeck } = dealCards(newDeck, 5);
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
