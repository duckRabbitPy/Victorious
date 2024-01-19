"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementTurn = void 0;
const effect_1 = require("effect");
const incrementTurn = (gameState) => {
    return effect_1.Effect.succeed(Object.assign(Object.assign({}, gameState), { turn: gameState.turn + 1 }));
};
exports.incrementTurn = incrementTurn;
