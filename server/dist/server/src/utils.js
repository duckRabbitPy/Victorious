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
exports.sendErrorMsgToClient = exports.verifyJwt = exports.parseClientMessage = exports.safeParseNumberArray = exports.safeParseUUID = exports.safeParseUUIDs = exports.safeParseJWT = exports.safeParseNumber = exports.tapPipeLine = exports.logAndThrowError = void 0;
const Schema = __importStar(require("@effect/schema/Schema"));
const common_1 = require("../../shared/common");
const Effect = __importStar(require("@effect/io/Effect"));
const effect_1 = require("effect");
const customErrors_1 = require("./controllers/customErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const broadcast_1 = require("./broadcast");
const logAndThrowError = (error) => {
    console.error(error);
    throw error;
};
exports.logAndThrowError = logAndThrowError;
const tapPipeLine = (effect) => {
    (0, effect_1.pipe)(effect, Effect.tapBoth({
        onFailure: (f) => Effect.log(`Failed with: ${JSON.stringify(f, null, 2)}`),
        onSuccess: (s) => Effect.log(`Success with: ${JSON.stringify(s, null, 2)}`),
    }));
    return effect;
};
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
exports.parseClientMessage = Schema.parse(common_1.ClientPayloadStruct);
const verifyJwt = (token, secret) => {
    return (0, effect_1.pipe)((0, common_1.safeParseNonEmptyString)(secret), Effect.flatMap((secret) => {
        return Effect.tryPromise({
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
        return Effect.succeed(Effect.unit);
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occured";
    return Effect.succeed((0, broadcast_1.broadcastToRoom)("error", errorMessage, msg.room, roomConnections));
};
exports.sendErrorMsgToClient = sendErrorMsgToClient;