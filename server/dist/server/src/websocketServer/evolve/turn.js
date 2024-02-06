"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementTurn = void 0;
const effect_1 = require("effect");
const incrementTurn = (gameState, username) => {
    const latestTransaction = gameState.turn > 0
        ? `${username} ended their turn`
        : `${username} started the game`;
    const newHistory = gameState.global_state.history.concat(latestTransaction);
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { turn: gameState.turn + 1, global_state: Object.assign(Object.assign({}, gameState.global_state), { history: newHistory }) }));
};
exports.incrementTurn = incrementTurn;
