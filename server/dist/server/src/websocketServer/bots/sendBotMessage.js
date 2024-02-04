"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBotMessage = void 0;
const effect_1 = require("effect");
const openai_1 = require("openai");
const common_1 = require("../../../../shared/common");
const customErrors_1 = require("../../customErrors");
const queries_1 = require("../../models/gamestate/queries");
const broadcast_1 = require("../broadcast");
const handleChatMessage_1 = require("../handleChatMessage");
const openAI_1 = require("./openAI");
const sendBotMessage = (msg, roomConnections, pool) => {
    const currentGameState = (0, effect_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(msg.room, pool), effect_1.Effect.flatMap(common_1.safeParseGameState));
    return (0, effect_1.pipe)(effect_1.Effect.all({
        botMsg: effect_1.Effect.tryPromise({
            try: () => (0, openAI_1.sendMsgToAIService)(msg),
            catch: (e) => {
                return new customErrors_1.ExternalServiceError({
                    message: e instanceof openai_1.OpenAIError ? e.message : "Openai error",
                });
            },
        }),
        currentGameState,
    }), effect_1.Effect.flatMap(({ botMsg, currentGameState }) => {
        const botActorInfo = currentGameState.actor_state
            .filter((actor) => common_1.botNamePrefixes.some((prefix) => actor.name.startsWith(prefix)))
            .map((actor) => {
            return {
                userId: actor.id,
                username: actor.name,
            };
        });
        const botUserInfo = botActorInfo[Math.floor(Math.random() * botActorInfo.length)];
        if (!botUserInfo) {
            return effect_1.Effect.fail(new Error("no bot user info"));
        }
        if (!botMsg.content) {
            return effect_1.Effect.fail(new Error("no bot message"));
        }
        return (0, handleChatMessage_1.handleChatMessage)({
            msg: Object.assign(Object.assign({}, msg), { chatMessage: botMsg.content }),
            userInfo: botUserInfo,
            pool,
        });
    }), effect_1.Effect.flatMap((chatLog) => (0, broadcast_1.broadcastToRoom)({
        broadcastType: "chatLog",
        payload: chatLog,
        room: msg.room,
        roomConnections,
    })));
};
exports.sendBotMessage = sendBotMessage;
