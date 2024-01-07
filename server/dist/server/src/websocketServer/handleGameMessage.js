"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGameMessage = void 0;
const effect_1 = require("effect");
const mutations_1 = require("../models/gamestate/mutations");
const common_1 = require("../../../shared/common");
const hand_1 = require("./inMemoryMutation/hand");
const buys_1 = require("./inMemoryMutation/buys");
const turn_1 = require("./inMemoryMutation/turn");
const actions_1 = require("./inMemoryMutation/actions");
const victory_1 = require("./inMemoryMutation/victory");
const queries_1 = require("../models/gamestate/queries");
const handleGameMessage = ({ msg, pool, userInfo, }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), effect_1.Effect.flatMap(common_1.safeParseGameState));
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
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((currentGameState) => (0, mutations_1.addLivePlayerQuery)({
                userInfo,
                currentGameState,
                pool,
            })), effect_1.Effect.flatMap(common_1.safeParseGameState));
        }
        case common_1.SupportedEffects.startGame: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((currentGameState) => (0, hand_1.dealToAllActors)(currentGameState)), effect_1.Effect.flatMap(buys_1.resetBuysAndActions), effect_1.Effect.flatMap(turn_1.incrementTurn), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.incrementTurn: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((currentGameState) => (0, hand_1.cleanUp)(currentGameState)), effect_1.Effect.flatMap(turn_1.incrementTurn), effect_1.Effect.flatMap(buys_1.resetBuysAndActions), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.buyCard: {
            return (0, effect_1.pipe)(effect_1.Effect.all({
                currentGameState,
                cardName,
            }), effect_1.Effect.flatMap(({ currentGameState, cardName }) => (0, buys_1.buyCard)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
                toDiscardFromHand,
            })), effect_1.Effect.flatMap(victory_1.deduceVictoryPoints), effect_1.Effect.flatMap(victory_1.determineIfGameIsOver), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.playTreasure: {
            return (0, effect_1.pipe)(effect_1.Effect.all({
                currentGameState,
                cardName,
            }), effect_1.Effect.flatMap(({ currentGameState, cardName }) => (0, hand_1.playTreasure)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
            })), effect_1.Effect.flatMap(victory_1.deduceVictoryPoints), effect_1.Effect.flatMap(victory_1.determineIfGameIsOver), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.resetPlayedTreasures: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((currentGameState) => (0, hand_1.resetPlayedTreasures)(currentGameState)), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.playAction: {
            return (0, effect_1.pipe)(effect_1.Effect.all({
                currentGameState,
                cardName,
            }), effect_1.Effect.flatMap(({ currentGameState, cardName }) => (0, actions_1.playAction)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
                toDiscardFromHand,
            })), effect_1.Effect.flatMap(victory_1.deduceVictoryPoints), effect_1.Effect.flatMap(victory_1.determineIfGameIsOver), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        default: {
            return currentGameState;
        }
    }
};
exports.handleGameMessage = handleGameMessage;
