"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChatMessage = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../shared/common");
const mutations_1 = require("../models/chatlog/mutations");
const queries_1 = require("../models/gamestate/queries");
const handleChatMessage = ({ msg, userInfo, pool, }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), effect_1.Effect.flatMap(common_1.safeParseGameState));
    const chatMessage = (0, common_1.safeParseNonEmptyString)(msg.chatMessage);
    return (0, effect_1.pipe)(effect_1.Effect.all({
        chatMessage,
        currentGameState,
    }), effect_1.Effect.flatMap(({ chatMessage, currentGameState }) => (0, mutations_1.updateChatLogQuery)({
        sessionId: currentGameState.session_id,
        userInfo,
        chatMessage,
        pool,
    })), effect_1.Effect.flatMap(common_1.safeParseChatLog));
};
exports.handleChatMessage = handleChatMessage;
