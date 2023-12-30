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
exports.sendAuthenticatedUserResponse = exports.sendOpenRoomsResponse = exports.sendGameStateResponse = exports.sendConfirmUserResponse = exports.sendRegisterResponse = exports.sendLoginResponse = void 0;
// avoid ts warning
/* eslint-disable no-unused-vars */
const Effect = __importStar(require("@effect/io/Effect"));
const effect_1 = require("effect");
const createResponseHandler = (onSuccess) => ({ dataOrError, res, successStatus, label }) => (0, effect_1.pipe)(Effect.matchCauseEffect(dataOrError, {
    onFailure: (cause) => {
        console.error(JSON.stringify(cause));
        switch (cause._tag) {
            case "Die":
            case "Interrupt":
                respondWithError(res, 500, "Internal server error");
        }
        return Effect.succeed(res.status(500).json("Internal Server error"));
    },
    onSuccess: (data) => Effect.succeed(res
        .status(successStatus)
        .json({ [label !== null && label !== void 0 ? label : "data"]: onSuccess(data) })),
}), Effect.runPromise);
exports.sendLoginResponse = createResponseHandler((authToken) => authToken);
exports.sendRegisterResponse = createResponseHandler((successMsg) => ({
    successMsg,
}));
exports.sendConfirmUserResponse = createResponseHandler((confirmMessage) => ({
    confirmMessage,
}));
exports.sendGameStateResponse = createResponseHandler((gameState) => ({
    gameState,
}));
exports.sendOpenRoomsResponse = createResponseHandler((openRooms) => ({
    openRooms,
}));
exports.sendAuthenticatedUserResponse = createResponseHandler((username) => username);
const respondWithError = (res, status, message, additionalInfo) => (0, effect_1.pipe)(Effect.succeed(res.status(status).json({
    message: `Fail: ${message}`,
    info: additionalInfo,
})));
