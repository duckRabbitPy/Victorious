"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAuthenticatedUserResponse = exports.sendOpenRoomsResponse = exports.sendGameStateResponse = exports.sendConfirmUserResponse = exports.sendRegisterResponse = exports.sendLoginResponse = void 0;
const effect_1 = require("effect");
const createResponseHandler = (onSuccess) => ({ dataOrError, res, successStatus, label }) => (0, effect_1.pipe)(dataOrError, effect_1.Effect.flatMap((data) => {
    return effect_1.Effect.succeed(res.status(successStatus).json({ [label !== null && label !== void 0 ? label : "data"]: onSuccess(data) }));
}), effect_1.Effect.catchAll((error) => {
    const errorMessage = "message" in error
        ? error.message
        : "An unknown server error occured";
    console.log("error", error);
    return respondWithError(res, 500, errorMessage);
}));
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
const respondWithError = (res, status, message, additionalInfo) => (0, effect_1.pipe)(effect_1.Effect.succeed(res.status(status).json({
    message: `Fail: ${message}`,
    info: additionalInfo,
})));
