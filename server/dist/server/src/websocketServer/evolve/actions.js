"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playAction = exports.applyAction = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const hand_1 = require("./hand");
const applyAction = (gameState, userId, cardName) => {
    switch (cardName) {
        case "village": {
            const newActorState = gameState.actor_state.map((actor) => {
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { actions: actor.actions + 2 });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "smithy": {
            // todo refactor deal cards to include cards in play
            const newActorState = gameState.actor_state.map((actor) => {
                if (actor.id === userId) {
                    const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                        deck: actor.deck,
                        discardPile: actor.discardPile,
                        numberOfCardsToDraw: 3,
                    });
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, discardPile: newDiscardPile });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "market": {
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                    deck: actor.deck,
                    discardPile: actor.discardPile,
                    numberOfCardsToDraw: 1,
                });
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, actions: actor.actions + 1, buys: actor.buys + 1, discardPile: newDiscardPile, bonusTreasureValue: actor.bonusTreasureValue + 1 });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "laboratory": {
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                    deck: actor.deck,
                    discardPile: actor.discardPile,
                    numberOfCardsToDraw: 2,
                });
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, actions: actor.actions + 1, discardPile: newDiscardPile });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "festival": {
            const newActorState = gameState.actor_state.map((actor) => {
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { actions: actor.actions + 2, buys: actor.buys + 1, bonusTreasureValue: actor.bonusTreasureValue + 2 });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        default: {
            return gameState;
        }
        case "councilRoom": {
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                    deck: actor.deck,
                    discardPile: actor.discardPile,
                    numberOfCardsToDraw: 4,
                });
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, buys: actor.buys + 1, discardPile: newDiscardPile });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
    }
};
exports.applyAction = applyAction;
// todo refactor with reusable helper functions
const playAction = ({ gameState, userId, cardName, toDiscardFromHand, }) => {
    const newActorState = gameState.actor_state.map((actor) => {
        const remainingActions = actor.actions - 1;
        if (actor.id === userId) {
            return Object.assign(Object.assign({}, actor), { hand: (0, common_1.subtractCardCount)(actor.hand, (0, common_1.cardNamesToCount)(toDiscardFromHand)), discardPile: [...actor.discardPile, ...toDiscardFromHand], actions: remainingActions });
        }
        return actor;
    });
    const latestTransaction = `${gameState.actor_state.filter((a) => a.id === userId)[0].name} played ${(0, utils_1.indefiniteArticle)(cardName)} ${cardName}`;
    const newGlobalState = Object.assign(Object.assign({}, gameState.global_state), { history: [...gameState.global_state.history, latestTransaction] });
    const updatedGameState = (0, exports.applyAction)(Object.assign(Object.assign({}, gameState), { global_state: newGlobalState, actor_state: newActorState }), userId, cardName);
    const GameStateWithLatestPhase = Object.assign(Object.assign({}, updatedGameState), { actor_state: updatedGameState.actor_state.map((actor) => {
            if (actor.id === userId) {
                return Object.assign(Object.assign({}, actor), { phase: actor.actions < 1 || !(0, common_1.hasActionCard)(actor.hand)
                        ? common_1.Phases.Buy
                        : common_1.Phases.Action });
            }
            return actor;
        }) });
    return effect_1.Effect.succeed(GameStateWithLatestPhase);
};
exports.playAction = playAction;
