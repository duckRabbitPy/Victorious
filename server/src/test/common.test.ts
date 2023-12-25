import { describe, expect, it } from "vitest";
import { subtractCardCount } from "../../../shared/common";
import { dealCards } from "../controllers/transformers/hand";

describe("common util testing", () => {
  it("subtract card count", () => {
    const cardCountA = {
      copper: 5,
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
      curse: 0,
    };

    const cardCountB = {
      copper: 2,
      silver: 0,
      gold: 0,
      estate: 0,
      duchy: 0,
      province: 0,
      village: 0,
      smithy: 0,
      market: 2,
      mine: 0,
      laboratory: 0,
      festival: 0,
      councilRoom: 0,
      curse: 0,
    };

    expect(subtractCardCount(cardCountA, cardCountB)).toEqual({
      copper: 3,
      silver: 0,
      gold: 0,
      estate: 0,
      duchy: 0,
      province: 0,
      village: 0,
      smithy: 0,
      market: -2,
      mine: 0,
      laboratory: 0,
      festival: 0,
      councilRoom: 0,
      curse: 0,
    });
  });

  it("subtract zero cards", () => {
    const cardCountA = {
      copper: 3,
      silver: 0,
      gold: 0,
      estate: 2,
      duchy: 0,
      province: 0,
      village: 0,
      smithy: 0,
      market: 0,
      mine: 0,
      laboratory: 0,
      festival: 0,
      councilRoom: 0,
      curse: 0,
    };

    const cardCountB = {
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
      curse: 0,
    };

    expect(subtractCardCount(cardCountA, cardCountB)).toEqual({
      copper: 3,
      silver: 0,
      gold: 0,
      estate: 2,
      duchy: 0,
      province: 0,
      village: 0,
      smithy: 0,
      market: 0,
      mine: 0,
      laboratory: 0,
      festival: 0,
      councilRoom: 0,
      curse: 0,
    });
  });

  it("deal more cards than in deck", () => {
    const deck = ["smithy", "silver"] as const;

    const discardPile = ["copper", "copper", "copper"] as const;

    const { newCards, remainingDeck } = dealCards(deck, 3, discardPile);

    expect(newCards).toEqual(["smithy", "silver", "copper"]);
    expect(remainingDeck).toEqual(["copper", "copper"]);
  });
});
