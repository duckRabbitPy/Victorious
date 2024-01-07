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
exports.handleChatMessage = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const effect_1 = require("effect");
const common_1 = require("../../../shared/common");
const mutations_1 = require("../models/chatlog/mutations");
const queries_1 = require("../models/gamestate/queries");
const handleChatMessage = ({ msg, userInfo, pool, }) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), Effect.flatMap(common_1.safeParseGameState));
    const chatMessage = (0, common_1.safeParseNonEmptyString)(msg.chatMessage);
    return (0, effect_1.pipe)(Effect.all({
        chatMessage,
        currentGameState,
    }), Effect.flatMap(({ chatMessage, currentGameState }) => (0, mutations_1.updateChatLogQuery)({
        sessionId: currentGameState.session_id,
        userInfo,
        chatMessage,
        pool,
    })), Effect.flatMap(common_1.safeParseChatLog));
};
exports.handleChatMessage = handleChatMessage;
