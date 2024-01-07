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
exports.buyCard = exports.resetBuysAndActions = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const resetBuysAndActions = (gameState) => {
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            return Object.assign(Object.assign({}, actor), { buys: 1, actions: 1, cardsInPlay: common_1.zeroCardCount, phase: (0, common_1.hasActionCard)(actor.hand) ? common_1.Phases.Action : common_1.Phases.Buy });
        }) }));
};
exports.resetBuysAndActions = resetBuysAndActions;
const buyCard = ({ gameState, userId, cardName, toDiscardFromHand, }) => {
    // todo effect.fail card not available
    const newActorState = gameState.actor_state.map((actor) => {
        // todo effect.fail if not enough buys
        const remainingBuys = actor.buys - 1;
        if (actor.id === userId) {
            return Object.assign(Object.assign({}, actor), { deck: [...actor.deck, cardName], buys: remainingBuys, hand: (0, common_1.subtractCardCount)(actor.hand, (0, common_1.cardNamesToCount)(toDiscardFromHand)), 
                // todo: prevent 'overpaying' if more cards in play than needed
                cardsInPlay: common_1.zeroCardCount, phase: remainingBuys < 1 ? common_1.Phases.Buy : common_1.Phases.Action, discardPile: [...actor.discardPile, ...toDiscardFromHand] });
        }
        return actor;
    });
    const latestTransaction = `${gameState.actor_state.filter((a) => a.id === userId)[0].name} purchased ${(0, utils_1.indefiniteArticle)(cardName)} ${cardName}`;
    const newGlobalState = Object.assign(Object.assign({}, gameState.global_state), { supply: Object.assign(Object.assign({}, gameState.global_state.supply), { [cardName]: gameState.global_state.supply[cardName] - 1 }), history: [...gameState.global_state.history, latestTransaction] });
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { global_state: newGlobalState, actor_state: newActorState }));
};
exports.buyCard = buyCard;
