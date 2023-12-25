import React from "react";
import { CardCount, CardName } from "../../shared/common";

export const diffCardCounts = (a: CardCount, b: CardCount): CardCount => {
  const diff = Object.entries(a).reduce((acc, [cardName, count]) => {
    const diff = count - b[cardName as CardName];
    if (diff > 0) {
      acc[cardName] = diff;
    }
    return acc;
  }, {} as Record<string, number>);

  return diff as CardCount;
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
  curse: 0,
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
