"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanUp = exports.resetPlayedTreasures = exports.playTreasure = exports.playAllTreasures = exports.dealToAllActors = exports.dealCards = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const dealCards = ({ deck, numberOfCardsToDraw, discardPile, }) => {
    if (deck.length < numberOfCardsToDraw) {
        const lastCardsInDeck = deck.slice(0, deck.length);
        const numberOfCardsLeftInDeck = deck.length;
        const restOfDeck = shuffleDeck([
            ...deck.slice(deck.length),
            ...discardPile,
        ]);
        const newCardsToHand = restOfDeck.slice(0, numberOfCardsToDraw - numberOfCardsLeftInDeck);
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
exports.dealCards = dealCards;
const shuffleDeck = (deck) => {
    const shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
};
const dealToAllActors = (gameState) => {
    const decks = gameState.actor_state.map((actor) => actor.deck);
    const shuffledDecks = decks.map((deck) => shuffleDeck(deck));
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor, index) => {
            const { newCardsIntoHand, newDeck, newDiscardPile } = (0, exports.dealCards)({
                deck: shuffledDecks[index],
                numberOfCardsToDraw: 5,
                discardPile: actor.discardPile,
            });
            const newHand = (0, common_1.cardNamesToCount)(newCardsIntoHand);
            return Object.assign(Object.assign({}, actor), { hand: newHand, deck: newDeck, discardPile: newDiscardPile, phase: (0, common_1.hasActionCard)(newHand) ? common_1.Phases.Action : common_1.Phases.Buy });
        }) }));
};
exports.dealToAllActors = dealToAllActors;
const playAllTreasures = (gameState) => {
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            if ((0, utils_1.isUsersTurn)(gameState, actor.name)) {
                const newHand = Object.assign(Object.assign({}, actor.hand), { copper: 0, silver: 0, gold: 0 });
                return Object.assign(Object.assign({}, actor), { hand: newHand, cardsInPlay: Object.assign(Object.assign({}, actor.cardsInPlay), { copper: actor.hand.copper, silver: actor.hand.silver, gold: actor.hand.gold }) });
            }
            return actor;
        }) }));
};
exports.playAllTreasures = playAllTreasures;
const playTreasure = ({ gameState, userId, cardName, }) => {
    const newActorState = gameState.actor_state.map((actor) => {
        if (actor.id === userId) {
            return Object.assign(Object.assign({}, actor), { hand: (0, common_1.subtractCardCount)(actor.hand, (0, common_1.cardNamesToCount)([cardName])), cardsInPlay: Object.assign(Object.assign({}, actor.cardsInPlay), { [cardName]: actor.cardsInPlay[cardName] + 1 }) });
        }
        return actor;
    });
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: newActorState }));
};
exports.playTreasure = playTreasure;
const resetPlayedTreasures = (gameState) => {
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            return Object.assign(Object.assign({}, actor), { cardsInPlay: common_1.zeroCardCount, hand: Object.assign(Object.assign({}, actor.hand), { copper: actor.hand.copper + actor.cardsInPlay.copper, silver: actor.hand.silver + actor.cardsInPlay.silver, gold: actor.hand.gold + actor.cardsInPlay.gold }) });
        }) }));
};
exports.resetPlayedTreasures = resetPlayedTreasures;
const cleanUp = (gameState) => {
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor, index) => {
            if ((0, utils_1.isUsersTurn)(gameState, actor.name)) {
                const toDiscardFromHand = Object.entries(actor.hand).reduce((acc, [cardName, count]) => {
                    return acc.concat(Array(count).fill(cardName));
                }, []);
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, exports.dealCards)({
                    deck: actor.deck,
                    numberOfCardsToDraw: 5,
                    discardPile: actor.discardPile
                        .concat(toDiscardFromHand)
                        .concat((0, common_1.countToCardNamesArray)(actor.cardsInPlay)),
                });
                return Object.assign(Object.assign({}, actor), { actionPhaseDemand: null, bonusTreasureValue: 0, hand: (0, common_1.cardNamesToCount)(newCardsIntoHand), deck: newDeck, cardsInPlay: common_1.zeroCardCount, discardPile: newDiscardPile });
            }
            else
                return gameState.actor_state[index];
        }) }));
};
exports.cleanUp = cleanUp;
