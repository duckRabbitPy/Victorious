import { describe, expect, it } from "vitest";
import { subtractCardCount } from "../../../shared/common";
import { dealCards } from "../websocketServer/evolve/hand";

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
      workshop: 0,
      moneylender: 0,
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
      workshop: 0,
      moneylender: 0,
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
      // count should not go below zero
      market: 0,
      mine: 0,
      laboratory: 0,
      festival: 0,
      councilRoom: 0,
      workshop: 0,
      moneylender: 0,
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
      workshop: 0,
      moneylender: 0,
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
      workshop: 0,
      moneylender: 0,
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
      workshop: 0,
      moneylender: 0,
    });
  });

  it("deal new hand", () => {
    const deck = [
      "smithy",
      "silver",
      "village",
      "councilRoom",
      "gold",
      "mine",
    ] as const;

    const discardPile = ["copper"] as const;

    const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
      deck,
      discardPile,
      numberOfCardsToDraw: 5,
    });

    expect(newCardsIntoHand[0]).toEqual("smithy");
    expect(newCardsIntoHand.length).toEqual(5);
    expect(new Set(newCardsIntoHand)).toEqual(
      new Set(["smithy", "silver", "village", "councilRoom", "gold"])
    );
    expect(newDeck).toEqual(["mine"]);
    expect(newDiscardPile).toEqual(["copper"]);
  });

  it("deal more cards than in deck", () => {
    const deck = ["smithy", "silver"] as const;

    const discardPile = ["copper", "copper", "copper"] as const;

    const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
      deck,
      discardPile,
      numberOfCardsToDraw: 3,
    });

    expect(newCardsIntoHand.length).toEqual(3);
    expect(new Set(newCardsIntoHand)).toEqual(
      new Set(["smithy", "silver", "copper"])
    );

    expect(newDeck.length).toEqual(2);
    expect(newDeck).toEqual(["copper", "copper"]);
    expect(newDiscardPile).toEqual([]);
  });

  it("deal more cards than in deck with empty deck", () => {
    const deck = [] as const;

    const discardPile = [
      "copper",
      "copper",
      "copper",
      "copper",
      "copper",
    ] as const;

    const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
      deck,
      discardPile,
      numberOfCardsToDraw: 5,
    });

    expect(newCardsIntoHand.length).toEqual(5);
    expect(new Set(newCardsIntoHand)).toEqual(
      new Set(["copper", "copper", "copper", "copper", "copper"])
    );
    expect(newDeck).toEqual([]);
    expect(newDiscardPile).toEqual([]);
  });

  it("called to draw more cards than in deck and dicard pile in total", () => {
    const deck = ["smithy"] as const;

    const discardPile = ["mine", "copper", "copper", "copper"] as const;

    const { newCardsIntoHand, newDeck, newDiscardPile } = dealCards({
      deck,
      discardPile,
      numberOfCardsToDraw: 7,
    });

    expect(newCardsIntoHand.length).toEqual(5);
    expect(new Set(newCardsIntoHand)).toEqual(
      new Set(["smithy", "mine", "copper", "copper", "copper"])
    );
    expect(newDeck).toEqual([]);
    expect(newDiscardPile).toEqual([]);
  });
});
