"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanUp = exports.resetPlayedTreasures = exports.playTreasure = exports.reshuffleDeck = exports.dealToAllActors = exports.dealCards = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const dealCards = (deck, number, discardPile) => {
    if (deck.length < number) {
        const lastCards = deck.slice(0, deck.length);
        const newDeck = (0, exports.reshuffleDeck)(deck.slice(deck.length), discardPile);
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
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor, index) => {
            const { newCards, remainingDeck, discardPile } = (0, exports.dealCards)(shuffledDecks[index], 5, actor.discardPile);
            const newHand = (0, common_1.cardNamesToCount)(newCards);
            return Object.assign(Object.assign({}, actor), { hand: newHand, deck: remainingDeck, discardPile: discardPile, phase: (0, common_1.hasActionCard)(newHand) ? common_1.Phases.Action : common_1.Phases.Buy });
        }) }));
};
exports.dealToAllActors = dealToAllActors;
const reshuffleDeck = (deck, discardPile) => {
    return shuffleDeck(deck.concat(discardPile));
};
exports.reshuffleDeck = reshuffleDeck;
const playTreasure = ({ gameState, userId, cardName, }) => {
    const newActorState = gameState.actor_state.map((actor) => {
        if (actor.id === userId) {
            return Object.assign(Object.assign({}, actor), { hand: (0, common_1.subtractCardCount)(actor.hand, (0, common_1.cardNamesToCount)([cardName])), cardsInPlay: Object.assign(Object.assign({}, actor.cardsInPlay), { [cardName]: actor.cardsInPlay[cardName] + 1 }) });
        }
        return actor;
    });
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: newActorState }));
};
exports.playTreasure = playTreasure;
const resetPlayedTreasures = (gameState) => {
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            return Object.assign(Object.assign({}, actor), { cardsInPlay: common_1.zeroCardCount, hand: Object.assign(Object.assign({}, actor.hand), { copper: actor.hand.copper + actor.cardsInPlay.copper, silver: actor.hand.silver + actor.cardsInPlay.silver, gold: actor.hand.gold + actor.cardsInPlay.gold }) });
        }) }));
};
exports.resetPlayedTreasures = resetPlayedTreasures;
const cleanUp = (gameState) => {
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor, index) => {
            if ((0, utils_1.isUsersTurn)(gameState, actor.name)) {
                const toDiscardFromHand = Object.entries(actor.hand).reduce((acc, [cardName, count]) => {
                    return acc.concat(Array(count).fill(cardName));
                }, []);
                const newDeck = (0, exports.reshuffleDeck)(actor.deck, actor.discardPile.concat(toDiscardFromHand));
                const { newCards, remainingDeck, discardPile } = (0, exports.dealCards)(newDeck, 5, actor.discardPile);
                return Object.assign(Object.assign({}, actor), { hand: (0, common_1.cardNamesToCount)(newCards), deck: remainingDeck, discardPile });
            }
            else
                return gameState.actor_state[index];
        }) }));
};
exports.cleanUp = cleanUp;
