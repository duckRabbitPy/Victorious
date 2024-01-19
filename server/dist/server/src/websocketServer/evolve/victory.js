"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineIfGameIsOver = exports.deduceVictoryPoints = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../../shared/common");
const deduceVictoryPoints = (gameState) => {
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            const victoryPoints = actor.deck.reduce((acc, cardName) => {
                return acc + (0, common_1.cardNameToVictoryPoints)(cardName);
            }, 0);
            return Object.assign(Object.assign({}, actor), { victoryPoints });
        }) }));
};
exports.deduceVictoryPoints = deduceVictoryPoints;
// todo fix game ove
const determineIfGameIsOver = (gameState) => {
    const provinceSupplyEmpty = gameState.global_state.supply.province === 0;
    const threeSupplyPilesEmpty = Object.values(gameState.global_state.supply).filter((supply) => supply === 0).length >= 3;
    const gameOver = provinceSupplyEmpty || threeSupplyPilesEmpty;
    if (gameOver) {
        return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { game_over: true }));
    }
    else {
        return effect_1.Effect.succeed(gameState);
    }
};
exports.determineIfGameIsOver = determineIfGameIsOver;
