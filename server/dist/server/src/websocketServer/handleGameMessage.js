"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGameMessage = void 0;
const effect_1 = require("effect");
const mutations_1 = require("../models/gamestate/mutations");
const common_1 = require("../../../shared/common");
const hand_1 = require("./evolve/hand");
const bots_1 = require("./evolve/bots");
const buys_1 = require("./evolve/buys");
const turn_1 = require("./evolve/turn");
const actions_1 = require("./evolve/actions");
const victory_1 = require("./evolve/victory");
const queries_1 = require("../models/gamestate/queries");
const customErrors_1 = require("../customErrors");
const utils_1 = require("../utils");
const utils_2 = require("../../../shared/utils");
const users_1 = require("../models/users");
const handleGameMessage = ({ msg, pool, userInfo, }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), effect_1.Effect.flatMap(common_1.safeParseGameState), effect_1.Effect.flatMap((currentGameState) => (0, utils_1.checkClientStateIsUptoDate)({
        currentGameState,
        msg,
    })));
    const cardName = (0, effect_1.pipe)((0, common_1.safeParseCardName)(msg.cardName), effect_1.Effect.orElseFail(() => new customErrors_1.CustomParseError({ message: "Invalid card name in client payload" })));
    const toDiscardFromHand = msg.toDiscardFromHand;
    switch (msg.effect) {
        // read only operation
        case common_1.SupportedEffects.getCurrentGameState: {
            return currentGameState;
        }
        // mutation operations
        case common_1.SupportedEffects.addLivePlayer: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((currentGameState) => (0, utils_1.checkNotAlreadyInRoom)({ currentGameState, userInfo })), effect_1.Effect.flatMap((currentGameState) => (0, mutations_1.addLivePlayerQuery)({
                userInfo,
                currentGameState,
                pool,
            })), effect_1.Effect.flatMap(common_1.safeParseGameState));
        }
        case common_1.SupportedEffects.addBotPlayer: {
            const botUserName = `${common_1.botNamePrefixes[Math.floor(Math.random() * common_1.botNamePrefixes.length)]}${Math.floor(Math.random() * 1000) + 1}`;
            const newBotUserInfo = (0, effect_1.pipe)((0, users_1.registerNewUserQuery)(botUserName, `bot${(0, utils_2.uuidv4)()}@botemail.com`, (0, utils_2.uuidv4)(), pool), effect_1.Effect.flatMap(common_1.safeParseRegisterResult), effect_1.Effect.flatMap((botRegistrationInfo) => {
                return effect_1.Effect.succeed({
                    userId: botRegistrationInfo.user_id,
                    username: botRegistrationInfo.username,
                });
            }));
            return (0, effect_1.pipe)(effect_1.Effect.all({
                newBotUserInfo,
                currentGameState,
            }), effect_1.Effect.flatMap(({ newBotUserInfo, currentGameState }) => (0, mutations_1.addLivePlayerQuery)({
                userInfo: newBotUserInfo,
                currentGameState,
                pool,
            })), effect_1.Effect.flatMap(common_1.safeParseGameState));
        }
        case common_1.SupportedEffects.startGame: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap(utils_1.checkEnoughPlayers), effect_1.Effect.flatMap((currentGameState) => (0, hand_1.dealToAllActors)(currentGameState)), effect_1.Effect.flatMap(buys_1.resetBuysAndActions), effect_1.Effect.flatMap((gamestate) => (0, turn_1.incrementTurn)(gamestate, userInfo.username)), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.incrementTurn: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((currentGameState) => (0, hand_1.cleanUp)(currentGameState)), effect_1.Effect.flatMap((gamestate) => (0, turn_1.incrementTurn)(gamestate, userInfo.username)), effect_1.Effect.flatMap(buys_1.resetBuysAndActions), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        case common_1.SupportedEffects.handleBotPlayerTurn: {
            return (0, effect_1.pipe)(currentGameState, effect_1.Effect.flatMap((gamestate) => (0, bots_1.handleIfBotPlayerTurn)(gamestate, pool)), effect_1.Effect.flatMap((postBuyPhaseGamestate) => (0, hand_1.cleanUp)(postBuyPhaseGamestate)), effect_1.Effect.flatMap((gamestate) => (0, turn_1.incrementTurn)(gamestate, gamestate.actor_state[gamestate.turn % gamestate.actor_state.length]
                .name)), effect_1.Effect.flatMap(buys_1.resetBuysAndActions), effect_1.Effect.flatMap((postIncrementGamestate) => (0, mutations_1.writeNewGameStateToDB)(postIncrementGamestate, pool)));
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
        case common_1.SupportedEffects.gainCard: {
            return (0, effect_1.pipe)(effect_1.Effect.all({
                currentGameState,
                cardName,
            }), effect_1.Effect.flatMap(({ currentGameState, cardName }) => (0, buys_1.gainCard)({
                gameState: currentGameState,
                cardName,
                userId: userInfo.userId,
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
        case common_1.SupportedEffects.trashCardToMeetDemand: {
            return (0, effect_1.pipe)(effect_1.Effect.all({
                currentGameState,
                cardName,
            }), effect_1.Effect.flatMap(({ currentGameState, cardName }) => (0, actions_1.trashCardToMeetDemand)({
                userId: userInfo.userId,
                gameState: currentGameState,
                toTrash: cardName,
            })), effect_1.Effect.flatMap(victory_1.deduceVictoryPoints), effect_1.Effect.flatMap(victory_1.determineIfGameIsOver), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)));
        }
        default: {
            return currentGameState;
        }
    }
};
exports.handleGameMessage = handleGameMessage;
