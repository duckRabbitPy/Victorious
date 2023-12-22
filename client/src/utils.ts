import React from "react";
import { CardCount, CardName, getAllCardNames } from "../../shared/common";

export const diffCardCounts = (a: CardCount, b: CardCount): CardCount => {
  const diffBetweenAandB = Array.from(getAllCardNames()).reduce(
    (acc, cardName) => {
      const countA = a[cardName as keyof CardCount] || 0;
      const countB = b[cardName as keyof CardCount] || 0;
      const cardDiff = Math.max(0, countA - countB);

      if (cardDiff > 0) {
        acc[cardName as keyof CardCount] = cardDiff;
      }

      return acc;
    },
    {} as Record<CardName, number>
  );

  return { ...a, ...diffBetweenAandB };
};

export const initialCardsInPlay: CardCount = {
  copper: 0,
  silver: 0,
  gold: 0,
  estate: 0,
  duchy: 0,
  province: 0,
  village: 0,
  smithy: 0,
  market: 0,
  mine: 0,
  laboratory: 0,
  festival: 0,
  councilRoom: 0,
};

export const updateCardsInPlay = (
  cardName: CardName,
  setCardsInPlay: React.Dispatch<React.SetStateAction<CardCount>>
) => {
  setCardsInPlay((cardsInPlay) => ({
    ...cardsInPlay,
    [cardName]: cardsInPlay[cardName] + 1,
  }));
};
