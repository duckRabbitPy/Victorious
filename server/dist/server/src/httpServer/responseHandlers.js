"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAuthenticatedUserResponse = exports.sendOpenRoomsResponse = exports.sendGameStateResponse = exports.sendConfirmUserResponse = exports.sendRegisterResponse = exports.sendLoginResponse = void 0;
const effect_1 = require("effect");
const createResponseHandler = (onSuccess) => ({ dataOrError, res, successStatus, label }) => (0, effect_1.pipe)(effect_1.Effect.matchCauseEffect(dataOrError, {
    onFailure: (cause) => {
        console.error(JSON.stringify(cause));
        switch (cause._tag) {
            case "Die":
            case "Interrupt":
                respondWithError(res, 500, "Internal server error");
        }
        return effect_1.Effect.succeed(res.status(500).json("Internal Server error"));
    },
    onSuccess: (data) => effect_1.Effect.succeed(res
        .status(successStatus)
        .json({ [label !== null && label !== void 0 ? label : "data"]: onSuccess(data) })),
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
