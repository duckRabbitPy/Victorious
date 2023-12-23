import React from "react";
import { CardCount, CardName } from "../../shared/common";

export const updateCardsInPlay = (
  cardName: CardName,
  setCardsInPlay: React.Dispatch<React.SetStateAction<CardCount>>
) => {
  setCardsInPlay((cardsInPlay) => ({
    ...cardsInPlay,
    [cardName]: cardsInPlay[cardName] + 1,
  }));
};
