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
            const clientMsg = (0, utils_1.parseClientMessage)(JSON.parse(msg)).pipe(Effect.runSync);
            const room = Number(clientMsg.room);
            const authToken = clientMsg.authToken;
            const decodedJwt = (0, utils_1.verifyJwt)(authToken, process.env.JWT_SECRET_KEY);
            const userInfoOrError = (0, effect_1.pipe)(decodedJwt, Effect.flatMap((decoded) => (0, utils_1.safeParseJWT)(decoded)), Effect.flatMap((decoded) => Effect.succeed({
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
            const processMessage = connection_1.DBConnection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => (0, effect_1.pipe)(Effect.all({
                msg: (0, utils_1.parseJSONToClientMsg)(msg),
                userInfo: userInfoOrError,
                pool: Effect.succeed(pool),
            }), Effect.flatMap(({ pool, userInfo, msg }) => {
                if (msg.effect === common_1.SupportedEffects.sendChatMessage) {
                    return (0, effect_1.pipe)((0, handleChatMessage_1.handleChatMessage)({
                        msg,
                        userInfo,
                        pool,
                    }), Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)("chatLog", chatLog, room, roomConnections)));
                }
                return (0, effect_1.pipe)((0, handleGameMessage_1.handleGameMessage)({
                    msg,
                    userInfo,
                    pool,
                }), Effect.flatMap((gameState) => (0, broadcast_1.broadcastToRoom)("gameState", gameState, room, roomConnections)));
            }))), utils_1.tapPipeLine, Effect.catchAll((error) => {
                const msgOrUndefined = (0, effect_1.pipe)((0, utils_1.parseClientMessage)(JSON.parse(msg)), Effect.orElseSucceed(() => undefined), Effect.runSync);
                return (0, utils_1.sendErrorMsgToClient)(error, msgOrUndefined, roomConnections);
            }), effect_1.Logger.withMinimumLogLevel(effect_1.LoggerLevel.Error));
            const runnable = Effect.provideService(processMessage, connection_1.DBConnection, connection_1.DBConnectionLive);
            Effect.runPromise(runnable);
        });
        ws.on("close", () => {
            console.log(`Client disconnected. Total connections: ${roomConnections.length}`);
        });
    });
    console.log("Websocket server created");
}
exports.createWebsocketServer = createWebsocketServer;
