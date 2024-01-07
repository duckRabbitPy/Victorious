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
exports.handleGameMessage = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const mutations_1 = require("../models/gamestate/mutations");
const effect_1 = require("effect");
const common_1 = require("../../../shared/common");
const hand_1 = require("./inMemoryMutation/hand");
const buys_1 = require("./inMemoryMutation/buys");
const turn_1 = require("./inMemoryMutation/turn");
const actions_1 = require("./inMemoryMutation/actions");
const victory_1 = require("./inMemoryMutation/victory");
const queries_1 = require("../models/gamestate/queries");
const handleGameMessage = ({ msg, pool, userInfo, }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), Effect.flatMap(common_1.safeParseGameState));
    const cardName = (0, effect_1.pipe)((0, common_1.safeParseCardName)(msg.cardName));
    const toDiscardFromHand = msg.toDiscardFromHand;
    // todo: validate that next effect permitted given current game state, e.g pass mutation index from frontend and compare to mutation index in db
    switch (msg.effect) {
        // read only operation
        case common_1.SupportedEffects.getCurrentGameState: {
            return currentGameState;
        }
        // mutation operations
        case common_1.SupportedEffects.addLivePlayer: {
            return (0, effect_1.pipe)(currentGameState, Effect.flatMap((currentGameState) => (0, mutations_1.addLivePlayerQuery)({
                userInfo,
                currentGameState,
                pool,
            })), Effect.flatMap(common_1.safeParseGameState));
        }
        case common_1.SupportedEffects.startGame: {
            return (0, effect_1.pipe)(currentGameState, Effect.flatMap((currentGameState) => (0, hand_1.dealToAllActors)(currentGameState)), Effect.flatMap(buys_1.resetBuysAndActions), Effect.flatMap(turn_1.incrementTurn), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.incrementTurn: {
            return (0, effect_1.pipe)(currentGameState, Effect.flatMap((currentGameState) => (0, hand_1.cleanUp)(currentGameState)), Effect.flatMap(turn_1.incrementTurn), Effect.flatMap(buys_1.resetBuysAndActions), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.buyCard: {
            return (0, effect_1.pipe)(Effect.all({
                currentGameState,
                cardName,
            }), Effect.flatMap(({ currentGameState, cardName }) => (0, buys_1.buyCard)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
                toDiscardFromHand,
            })), Effect.flatMap(victory_1.deduceVictoryPoints), Effect.flatMap(victory_1.determineIfGameIsOver), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.playTreasure: {
            return (0, effect_1.pipe)(Effect.all({
                currentGameState,
                cardName,
            }), Effect.flatMap(({ currentGameState, cardName }) => (0, hand_1.playTreasure)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
            })), Effect.flatMap(victory_1.deduceVictoryPoints), Effect.flatMap(victory_1.determineIfGameIsOver), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.resetPlayedTreasures: {
            return (0, effect_1.pipe)(currentGameState, Effect.flatMap((currentGameState) => (0, hand_1.resetPlayedTreasures)(currentGameState)), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.playAction: {
            return (0, effect_1.pipe)(Effect.all({
                currentGameState,
                cardName,
            }), Effect.flatMap(({ currentGameState, cardName }) => (0, actions_1.playAction)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
                toDiscardFromHand,
            })), Effect.flatMap(victory_1.deduceVictoryPoints), Effect.flatMap(victory_1.determineIfGameIsOver), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        default: {
            return currentGameState;
        }
    }
};
exports.handleGameMessage = handleGameMessage;
