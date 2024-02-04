"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebsocketServer = void 0;
const effect_1 = require("effect");
const utils_1 = require("../utils");
const connection_1 = require("../db/connection");
const common_1 = require("../../../shared/common");
const handleChatMessage_1 = require("./handleChatMessage");
const handleGameMessage_1 = require("./handleGameMessage");
const broadcast_1 = require("./broadcast");
const sendBotMessage_1 = require("./bots/sendBotMessage");
function createWebsocketServer(app) {
    // !! mutable state
    let roomConnections = [];
    app.ws("/", (ws, req) => {
        ws.on("message", (msg) => {
            const clientMsg = (0, utils_1.getClientMessage)(msg);
            const clientNotInList = (0, utils_1.clientNotInConnectionList)(clientMsg === null || clientMsg === void 0 ? void 0 : clientMsg.room, clientMsg === null || clientMsg === void 0 ? void 0 : clientMsg.authToken, roomConnections);
            if (clientNotInList && (clientMsg === null || clientMsg === void 0 ? void 0 : clientMsg.authToken)) {
                roomConnections.push({
                    socket: ws,
                    room: clientMsg.room,
                    uniqueUserAuthToken: clientMsg.authToken,
                });
            }
            const processMessage = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => (0, effect_1.pipe)(effect_1.Effect.all({
                msg: (0, utils_1.parseJSONToClientMsg)(msg),
                userInfo: (0, utils_1.getUserInfoFromJWT)(clientMsg === null || clientMsg === void 0 ? void 0 : clientMsg.authToken),
                pool: effect_1.Effect.succeed(pool),
            }), effect_1.Effect.flatMap(({ pool, userInfo, msg }) => {
                // handle chat related messages
                if (msg.effect === common_1.SupportedEffects.getCurrentChatLog) {
                    return (0, effect_1.pipe)((0, handleChatMessage_1.getCurrentChatLog)({
                        msg,
                        pool,
                    }), effect_1.Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)({
                        broadcastType: "chatLog",
                        payload: chatLog,
                        room: msg.room,
                        roomConnections,
                    })), effect_1.Effect.flatMap(() => effect_1.Effect.succeed("chat log sent successfully")));
                }
                if (msg.effect === common_1.SupportedEffects.sendChatMessage) {
                    return (0, effect_1.pipe)((0, handleChatMessage_1.handleChatMessage)({
                        msg,
                        userInfo,
                        pool,
                    }), effect_1.Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)({
                        broadcastType: "chatLog",
                        payload: chatLog,
                        room: msg.room,
                        roomConnections,
                    })), effect_1.Effect.flatMap(() => effect_1.Effect.succeed("chat message sent successfully")));
                }
                // handle game related messages
                return (0, effect_1.pipe)((0, handleGameMessage_1.handleGameMessage)({
                    msg,
                    userInfo,
                    pool,
                }), utils_1.tapPipeLine, effect_1.Effect.flatMap((gameState) => {
                    return (0, broadcast_1.broadcastToRoom)({
                        broadcastType: "gameState",
                        payload: gameState,
                        room: msg.room,
                        roomConnections,
                    });
                }), effect_1.Effect.flatMap(() => effect_1.Effect.succeed("game message sent successfully")));
            }))), 
            // todo: differentiate between errors that should be sent to client and errors that should be only be logged
            effect_1.Effect.catchAll((error) => (0, utils_1.sendErrorMsgToClient)(error, clientMsg, roomConnections)), effect_1.Logger.withMinimumLogLevel(effect_1.LogLevel.All));
            const processMessageRunnable = effect_1.Effect.provideService(processMessage, connection_1.DBConnection, connection_1.DBConnectionLive);
            const sendBotMessages = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => (0, effect_1.pipe)(effect_1.Effect.all({
                msg: (0, utils_1.parseJSONToClientMsg)(msg),
                pool: effect_1.Effect.succeed(pool),
            }), effect_1.Effect.flatMap(({ pool, msg }) => {
                if (msg.chatMessage) {
                    return (0, sendBotMessage_1.sendBotMessage)(msg, roomConnections, pool);
                }
                return effect_1.Effect.succeed(effect_1.Effect.unit);
            }), effect_1.Effect.catchAll((e) => {
                console.log(e);
                return effect_1.Effect.succeed(effect_1.Effect.unit);
            }))));
            const sendBotMessagesRunnable = effect_1.Effect.provideService(sendBotMessages, connection_1.DBConnection, connection_1.DBConnectionLive);
            effect_1.Effect.runPromise(processMessageRunnable)
                .then(() => effect_1.Effect.runPromise(utils_1.delay))
                .then(() => effect_1.Effect.runPromise(sendBotMessagesRunnable));
        });
        ws.on("close", () => {
            console.log(`Client disconnected. Total connections: ${roomConnections.length}`);
            // clean up roomConnections
            roomConnections = roomConnections.filter((connection) => {
                return connection.socket !== ws;
            });
        });
    });
    console.log("Websocket server created");
}
exports.createWebsocketServer = createWebsocketServer;
