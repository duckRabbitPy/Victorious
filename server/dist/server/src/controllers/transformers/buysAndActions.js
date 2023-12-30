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
exports.playAction = exports.applyAction = exports.buyCard = exports.resetBuysAndActions = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const hand_1 = require("./hand");
const resetBuysAndActions = (gameState) => {
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            return Object.assign(Object.assign({}, actor), { buys: 1, actions: 1, phase: (0, common_1.hasActionCard)(actor.hand) ? common_1.Phases.Action : common_1.Phases.Buy });
        }) }));
};
exports.resetBuysAndActions = resetBuysAndActions;
const buyCard = ({ gameState, userId, cardName, toDiscardFromHand, }) => {
    const newActorState = gameState.actor_state.map((actor) => {
        const remainingBuys = actor.buys - 1;
        if (actor.id === userId) {
            return Object.assign(Object.assign({}, actor), { deck: [...actor.deck, cardName], buys: remainingBuys, hand: (0, common_1.subtractCardCount)(actor.hand, (0, common_1.cardNamesToCount)(toDiscardFromHand)), phase: remainingBuys < 1 ? common_1.Phases.Buy : common_1.Phases.Action, discardPile: [...actor.discardPile, ...toDiscardFromHand] });
        }
        return actor;
    });
    const latestTransaction = `${gameState.actor_state.filter((a) => a.id === userId)[0].name} purchased ${(0, utils_1.indefiniteArticle)(cardName)} ${cardName}`;
    const newGlobalState = Object.assign(Object.assign({}, gameState.global_state), { supply: Object.assign(Object.assign({}, gameState.global_state.supply), { [cardName]: gameState.global_state.supply[cardName] - 1 }), history: [...gameState.global_state.history, latestTransaction] });
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { global_state: newGlobalState, actor_state: newActorState }));
};
exports.buyCard = buyCard;
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
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCards, remainingDeck } = (0, hand_1.dealCards)(actor.deck, 3);
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCards)), deck: remainingDeck });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        default: {
            return gameState;
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
    return Effect.succeed(GameStateWithLatestPhase);
};
exports.playAction = playAction;
