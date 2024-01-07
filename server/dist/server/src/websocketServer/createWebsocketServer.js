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
function createWebsocketServer(app) {
    // mutable state
    const roomConnections = [];
    // websocket
    app.ws("/", function (ws, req) {
        ws.on("message", function message(msg) {
            // todo error handle if json parse fails
            const clientMsg = (0, utils_1.parseClientMessage)(JSON.parse(msg)).pipe(effect_1.Effect.runSync);
            const room = Number(clientMsg.room);
            const authToken = clientMsg.authToken;
            const decodedJwt = (0, utils_1.verifyJwt)(authToken, process.env.JWT_SECRET_KEY);
            const userInfoOrError = (0, effect_1.pipe)(decodedJwt, effect_1.Effect.flatMap((decoded) => (0, utils_1.safeParseJWT)(decoded)), effect_1.Effect.flatMap((decoded) => effect_1.Effect.succeed({
                userId: decoded.userId,
                username: decoded.username,
            })));
            if (!roomConnections.some((connection) => {
                connection.room === room &&
                    connection.uniqueUserAuthToken === authToken;
            })) {
                roomConnections.push({
                    socket: ws,
                    room,
                    uniqueUserAuthToken: authToken,
                });
            }
            const processMessage = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => (0, effect_1.pipe)(effect_1.Effect.all({
                msg: (0, utils_1.parseJSONToClientMsg)(msg),
                userInfo: userInfoOrError,
                pool: effect_1.Effect.succeed(pool),
            }), effect_1.Effect.flatMap(({ pool, userInfo, msg }) => {
                if (msg.effect === common_1.SupportedEffects.sendChatMessage) {
                    return (0, effect_1.pipe)((0, handleChatMessage_1.handleChatMessage)({
                        msg,
                        userInfo,
                        pool,
                    }), effect_1.Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)("chatLog", chatLog, room, roomConnections)));
                }
                return (0, effect_1.pipe)((0, handleGameMessage_1.handleGameMessage)({
                    msg,
                    userInfo,
                    pool,
                }), effect_1.Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
            }))), utils_1.tapPipeLine, effect_1.Effect.catchAll((error) => {
                const msgOrUndefined = (0, effect_1.pipe)((0, utils_1.parseClientMessage)(JSON.parse(msg)), effect_1.Effect.orElseSucceed(() => undefined), effect_1.Effect.runSync);
                return (0, utils_1.sendErrorMsgToClient)(error, msgOrUndefined, roomConnections);
            }), effect_1.Logger.withMinimumLogLevel(effect_1.LogLevel.Error));
            const runnable = effect_1.Effect.provideService(processMessage, connection_1.DBConnection, connection_1.DBConnectionLive);
            effect_1.Effect.runPromise(runnable);
        });
        ws.on("close", () => {
            console.log(`Client disconnected. Total connections: ${roomConnections.length}`);
        });
    });
    console.log("Websocket server created");
}
exports.createWebsocketServer = createWebsocketServer;
