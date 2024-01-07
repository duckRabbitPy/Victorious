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
exports.determineIfGameIsOver = exports.deduceVictoryPoints = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const common_1 = require("../../../../shared/common");
const deduceVictoryPoints = (gameState) => {
    return Effect.succeed(Object.assign(Object.assign({}, gameState), { actor_state: gameState.actor_state.map((actor) => {
            const victoryPoints = actor.deck.reduce((acc, cardName) => {
                return acc + (0, common_1.cardNameToVictoryPoints)(cardName);
            }, 0);
            return Object.assign(Object.assign({}, actor), { victoryPoints });
        }) }));
};
exports.deduceVictoryPoints = deduceVictoryPoints;
const determineIfGameIsOver = (gameState) => {
    const provinceSupplyEmpty = gameState.global_state.supply.province === 0;
    const threeSupplyPilesEmpty = Object.values(gameState.global_state.supply).filter((supply) => supply === 0).length >= 3;
    const gameOver = provinceSupplyEmpty || threeSupplyPilesEmpty;
    if (gameOver) {
        return Effect.succeed(Object.assign(Object.assign({}, gameState), { gameOver: true }));
    }
    else {
        return Effect.succeed(gameState);
    }
};
exports.determineIfGameIsOver = determineIfGameIsOver;
