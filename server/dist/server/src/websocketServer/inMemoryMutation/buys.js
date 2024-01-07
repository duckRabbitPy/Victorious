"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyCard = exports.resetBuysAndActions = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const resetBuysAndActions = (gameState) => {
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
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
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { global_state: newGlobalState, actor_state: newActorState }));
};
exports.buyCard = buyCard;
