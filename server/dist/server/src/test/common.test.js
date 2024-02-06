"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("../../../shared/common");
const hand_1 = require("../websocketServer/evolve/hand");
(0, vitest_1.describe)("common util testing", () => {
    (0, vitest_1.it)("subtract card count", () => {
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
        (0, vitest_1.expect)((0, common_1.subtractCardCount)(cardCountA, cardCountB)).toEqual({
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
            workshop: 0,
            moneylender: 0,
        });
    });
    (0, vitest_1.it)("subtract zero cards", () => {
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
        (0, vitest_1.expect)((0, common_1.subtractCardCount)(cardCountA, cardCountB)).toEqual({
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
    (0, vitest_1.it)("deal more cards than in deck", () => {
        const deck = ["smithy", "silver"];
        const discardPile = ["copper", "copper", "copper"];
        const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
            deck,
            discardPile,
            numberOfCardsToDraw: 3,
        });
        (0, vitest_1.expect)(newCardsIntoHand).toEqual(["smithy", "silver", "copper"]);
        (0, vitest_1.expect)(newDeck).toEqual(["copper", "copper"]);
        (0, vitest_1.expect)(newDiscardPile).toEqual([]);
    });
});
