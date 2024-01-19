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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNotAlreadyInRoom = exports.checkClientStateIsUptoDate = exports.clientNotInConnectionList = exports.getClientMessage = exports.getUserInfoFromJWT = exports.parseJSONToClientMsg = exports.parseClientMessage = exports.sendErrorMsgToClient = exports.verifyJwt = exports.safeParseNumberArray = exports.safeParseUUID = exports.safeParseUUIDs = exports.safeParseJWT = exports.safeParseNumber = exports.tapPipeLine = exports.logAndThrowError = void 0;
const Schema = __importStar(require("@effect/schema/Schema"));
const common_1 = require("../../shared/common");
const effect_1 = require("effect");
const customErrors_1 = require("./customErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const broadcast_1 = require("./websocketServer/broadcast");
const logAndThrowError = (error) => {
    console.error(error);
    throw error;
};
exports.logAndThrowError = logAndThrowError;
const tapPipeLine = (effect) => (0, effect_1.pipe)(effect, effect_1.Effect.tapBoth({
    onFailure: (f) => effect_1.Effect.logWarning(`Failed with: ${JSON.stringify(f, null, 2)}`),
    onSuccess: (s) => effect_1.Effect.logInfo(`Success with: ${JSON.stringify(s, null, 2)}`),
}));
exports.tapPipeLine = tapPipeLine;
exports.safeParseNumber = Schema.parse(Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN()));
exports.safeParseJWT = Schema.parse(Schema.struct({
    userId: Schema.string,
    username: Schema.string,
    iat: Schema.number,
    exp: Schema.number,
}));
exports.safeParseUUIDs = Schema.parse(Schema.array(Schema.UUID));
exports.safeParseUUID = Schema.parse(Schema.UUID);
exports.safeParseNumberArray = Schema.parse(Schema.array(Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())));
const verifyJwt = (token, secret) => {
    return (0, effect_1.pipe)((0, common_1.safeParseNonEmptyString)(secret), effect_1.Effect.flatMap((secret) => {
        return effect_1.Effect.tryPromise({
            try: () => new Promise((resolve, reject) => {
                jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
                    if (err) {
                        reject(new Error("Invalid token"));
                    }
                    resolve(decoded);
                });
            }),
            catch: () => new customErrors_1.AuthenticationError({ message: "Invalid AuthToken" }),
        });
    }));
};
exports.verifyJwt = verifyJwt;
const sendErrorMsgToClient = (error, msg, roomConnections) => {
    if (!(msg === null || msg === void 0 ? void 0 : msg.room)) {
        console.error("No room number provided, cannot send error message to client");
        return effect_1.Effect.succeed(effect_1.Effect.unit);
    }
    const errorMessage = "message" in error ? error.message : "An unknown server error occured";
    return effect_1.Effect.succeed((0, broadcast_1.broadcastToRoom)({
        broadcastType: "error",
        payload: errorMessage,
        roomConnections,
        room: msg.room,
    }));
};
exports.sendErrorMsgToClient = sendErrorMsgToClient;
exports.parseClientMessage = Schema.parse(common_1.ClientPayloadStruct);
const parseJSONToClientMsg = (msg) => (0, effect_1.pipe)(effect_1.Effect.try({
    try: () => JSON.parse(msg),
    catch: (e) => new customErrors_1.JSONParseError({
        message: `error parsing client string to json ${e}`,
    }),
}), effect_1.Effect.flatMap((msg) => (0, exports.parseClientMessage)(msg)), effect_1.Effect.orElseFail(() => new customErrors_1.CustomParseError({
    message: "Failed to parse client message to match type ClientPayload",
})));
exports.parseJSONToClientMsg = parseJSONToClientMsg;
const getUserInfoFromJWT = (authToken) => (0, effect_1.pipe)((0, common_1.safeParseNonEmptyString)(authToken), effect_1.Effect.flatMap((authToken) => (0, exports.verifyJwt)(authToken, process.env.JWT_SECRET_KEY)), effect_1.Effect.flatMap((decoded) => (0, exports.safeParseJWT)(decoded)), effect_1.Effect.flatMap((decoded) => effect_1.Effect.succeed({
    userId: decoded.userId,
    username: decoded.username,
})));
exports.getUserInfoFromJWT = getUserInfoFromJWT;
const getClientMessage = (msg) => (0, exports.parseClientMessage)(JSON.parse(msg))
    .pipe(effect_1.Effect.orElseSucceed(() => undefined))
    .pipe(effect_1.Effect.runSync);
exports.getClientMessage = getClientMessage;
const clientNotInConnectionList = (room, authToken, roomConnections) => roomConnections.every((connection) => connection.room !== room || connection.uniqueUserAuthToken !== authToken);
exports.clientNotInConnectionList = clientNotInConnectionList;
const checkClientStateIsUptoDate = ({ msg, currentGameState, }) => {
    if (msg.mutationIndex > 0 &&
        msg.mutationIndex < currentGameState.mutation_index) {
        return effect_1.Effect.fail(new customErrors_1.IllegalGameStateError({
            message: `Client state is out of date. Expected mutation index ${currentGameState.mutation_index} but got ${msg.mutationIndex}`,
        }));
    }
    return effect_1.Effect.succeed(currentGameState);
};
exports.checkClientStateIsUptoDate = checkClientStateIsUptoDate;
const checkNotAlreadyInRoom = ({ currentGameState, userInfo, }) => {
    if (currentGameState.actor_state
        .map((actor) => actor.id)
        .includes(userInfo.userId)) {
        return effect_1.Effect.fail(new customErrors_1.IllegalGameStateError({
            message: `User ${userInfo.username} already exists in room ${currentGameState.room}`,
        }));
    }
    return effect_1.Effect.succeed(currentGameState);
};
exports.checkNotAlreadyInRoom = checkNotAlreadyInRoom;
