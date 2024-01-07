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
exports.createWebsocketServer = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const mutations_1 = require("./models/gamestate/mutations");
const Schema = __importStar(require("@effect/schema/Schema"));
const effect_1 = require("effect");
const customErrors_1 = require("./controllers/customErrors");
const common_1 = require("../../shared/common");
const utils_1 = require("./utils");
const requestHandlers_1 = require("./controllers/game-session/requestHandlers");
const hand_1 = require("./controllers/transformers/hand");
const buys_1 = require("./controllers/transformers/buys");
const turn_1 = require("./controllers/transformers/turn");
const actions_1 = require("./controllers/transformers/actions");
const mutations_2 = require("./models/chatlog/mutations");
const queries_1 = require("./models/chatlog/queries");
const broadcast_1 = require("./broadcast");
const victory_1 = require("./controllers/transformers/victory");
const connection_1 = require("./db/connection");
const parseClientMessage = Schema.parse(common_1.ClientPayloadStruct);
const parseJSONToClientMsg = (msg) => (0, effect_1.pipe)(Effect.try({
    try: () => JSON.parse(msg),
    catch: (e) => new customErrors_1.JSONParseError({
        message: `error parsing client message: ${e}`,
    }),
}), Effect.flatMap((msg) => parseClientMessage(msg)));
function createWebsocketServer(app) {
    // mutable state
    const roomConnections = [];
    // websocket
    app.ws("/", function (ws, req) {
        ws.on("message", function message(msg) {
            const processMessage = connection_1.Connection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => Effect.all({
                pool: Effect.succeed(pool),
                msg: parseJSONToClientMsg(msg),
            })), Effect.flatMap(({ msg, pool }) => handleMessage({
                msg,
                ws,
                roomConnections,
                pool,
            })), utils_1.tapPipeLine, Effect.catchAll((error) => {
                const msgOrUndefined = (0, effect_1.pipe)(parseClientMessage(JSON.parse(msg)), Effect.orElseSucceed(() => undefined), Effect.runSync);
                return (0, utils_1.sendErrorMsgToClient)(error, msgOrUndefined, roomConnections);
            }), effect_1.Logger.withMinimumLogLevel(effect_1.LoggerLevel.Error));
            const runnable = Effect.provideService(processMessage, connection_1.Connection, connection_1.ConnectionLive);
            Effect.runPromise(runnable);
        });
        ws.on("close", () => {
            console.log(`Client disconnected. Total connections: ${roomConnections.length}`);
        });
    });
    console.log("Websocket server created");
}
exports.createWebsocketServer = createWebsocketServer;
const handleMessage = ({ msg, ws, roomConnections, pool, }) => {
    const room = Number(msg.room);
    const authToken = msg.authToken;
    const decodedJwt = (0, utils_1.verifyJwt)(authToken, process.env.JWT_SECRET_KEY);
    const userDetailsOrError = (0, effect_1.pipe)(decodedJwt, Effect.flatMap((decoded) => (0, utils_1.safeParseJWT)(decoded)), Effect.flatMap((decoded) => Effect.succeed({
        userId: decoded.userId,
        username: decoded.username,
    })));
    const currentGameState = (0, requestHandlers_1.getLatestLiveGameSnapshot)({ room, pool });
    const cardName = (0, effect_1.pipe)((0, common_1.safeParseCardName)(msg.cardName));
    const toDiscardFromHand = msg.toDiscardFromHand;
    if (
    // only push to roomConnections if currently authed user in room is not already in roomConnections
    !roomConnections.some((connection) => {
        connection.room === room && connection.uniqueUserAuthToken === authToken;
    })) {
        roomConnections.push({
            socket: ws,
            room,
            uniqueUserAuthToken: authToken,
        });
    }
    // todo: validate that next effect permitted given current game state, e.g pass mutation index from frontend and compare to mutation index in db
    switch (msg.effect) {
        // read only operations
        case common_1.SupportedEffects.getCurrentGameState: {
            return (0, effect_1.pipe)(currentGameState, Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.getCurrentChatLog: {
            return (0, effect_1.pipe)(Effect.all({ userInfo: userDetailsOrError, currentGameState }), Effect.flatMap(({ currentGameState }) => (0, queries_1.getLatestChatLogQuery)(currentGameState.session_id, pool)), Effect.flatMap(common_1.safeParseChatLog), Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)("chatLog", chatLog, room, roomConnections)));
        }
        // mutation operations
        case common_1.SupportedEffects.addLivePlayer: {
            return (0, effect_1.pipe)(Effect.all({ userInfo: userDetailsOrError, currentGameState }), Effect.flatMap(({ userInfo, currentGameState }) => (0, mutations_1.addLivePlayerQuery)({
                userId: userInfo.userId,
                username: userInfo.username,
                currentGameState,
                pool,
            })), Effect.flatMap(common_1.safeParseGameState), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.startGame: {
            return (0, effect_1.pipe)(Effect.all({ userInfo: userDetailsOrError, currentGameState }), Effect.flatMap(({ currentGameState }) => (0, hand_1.dealToAllActors)(currentGameState)), Effect.flatMap(buys_1.resetBuysAndActions), Effect.flatMap(turn_1.incrementTurn), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.incrementTurn: {
            return (0, effect_1.pipe)(Effect.all({ userInfo: userDetailsOrError, currentGameState }), Effect.flatMap(({ currentGameState }) => (0, hand_1.cleanUp)(currentGameState)), Effect.flatMap(turn_1.incrementTurn), Effect.flatMap(buys_1.resetBuysAndActions), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.buyCard: {
            return (0, effect_1.pipe)(Effect.all({
                userInfo: userDetailsOrError,
                currentGameState,
                cardName,
            }), Effect.flatMap(({ userInfo, currentGameState, cardName }) => (0, buys_1.buyCard)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
                toDiscardFromHand,
            })), Effect.flatMap(victory_1.deduceVictoryPoints), Effect.flatMap(victory_1.determineIfGameIsOver), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.playTreasure: {
            return (0, effect_1.pipe)(Effect.all({
                userInfo: userDetailsOrError,
                currentGameState,
                cardName,
            }), Effect.flatMap(({ userInfo, currentGameState, cardName }) => (0, hand_1.playTreasure)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
            })), Effect.flatMap(victory_1.deduceVictoryPoints), Effect.flatMap(victory_1.determineIfGameIsOver), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.resetPlayedTreasures: {
            return (0, effect_1.pipe)(Effect.all({ userInfo: userDetailsOrError, currentGameState }), Effect.flatMap(({ currentGameState }) => (0, hand_1.resetPlayedTreasures)(currentGameState)), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.playAction: {
            return (0, effect_1.pipe)(Effect.all({
                userInfo: userDetailsOrError,
                currentGameState,
                cardName,
            }), Effect.flatMap(({ userInfo, currentGameState, cardName }) => (0, actions_1.playAction)({
                gameState: currentGameState,
                userId: userInfo.userId,
                cardName,
                toDiscardFromHand,
            })), Effect.flatMap(victory_1.deduceVictoryPoints), Effect.flatMap(victory_1.determineIfGameIsOver), Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
        }
        case common_1.SupportedEffects.sendChatMessage: {
            const chatMessage = (0, common_1.safeParseNonEmptyString)(msg.chatMessage);
            return (0, effect_1.pipe)(Effect.all({
                userInfo: userDetailsOrError,
                chatMessage,
                currentGameState,
            }), Effect.flatMap(({ userInfo, chatMessage, currentGameState }) => (0, mutations_2.updateChatLogQuery)({
                sessionId: currentGameState.session_id,
                userInfo,
                chatMessage,
                pool,
            })), Effect.flatMap(common_1.safeParseChatLog), Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)("chatLog", chatLog, room, roomConnections)));
        }
        default: {
            return Effect.succeed({ success: false });
        }
    }
};
