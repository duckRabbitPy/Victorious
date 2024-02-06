"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChatMessage = exports.getCurrentChatLog = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../shared/common");
const mutations_1 = require("../models/chatlog/mutations");
const queries_1 = require("../models/gamestate/queries");
const customErrors_1 = require("../customErrors");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getCurrentChatLog = ({ msg, pool }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), effect_1.Effect.flatMap(common_1.safeParseGameState));
    return (0, effect_1.pipe)(effect_1.Effect.all({
        currentGameState,
    }), effect_1.Effect.flatMap(({ currentGameState }) => (0, mutations_1.getLatestChatLogQuery)({
        sessionId: currentGameState.session_id,
        pool,
    })), effect_1.Effect.flatMap(common_1.safeParseChatLog));
};
exports.getCurrentChatLog = getCurrentChatLog;
const handleChatMessage = ({ msg, userInfo, pool, }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), effect_1.Effect.flatMap(common_1.safeParseGameState));
    const chatMessage = (0, effect_1.pipe)((0, common_1.safeParseNonEmptyString)(msg.chatMessage), effect_1.Effect.orElseFail(() => new customErrors_1.CustomParseError({
        message: "Chat message must be a non-empty string",
    })));
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
