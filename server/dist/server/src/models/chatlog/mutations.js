"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChatLogQuery = exports.getLatestChatLogQuery = void 0;
const effect_1 = require("effect");
const utils_1 = require("../../utils");
const getLatestChatLogQuery = ({ sessionId, pool, }) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("SELECT username, message FROM chat_log WHERE session_id = $1 ORDER BY created_at ASC;", [sessionId]);
            return result.rows;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => get(),
        catch: () => new Error("postgres query error"),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.getLatestChatLogQuery = getLatestChatLogQuery;
// @mutation
const updateChatLogQuery = ({ sessionId, userInfo, chatMessage, pool, }) => {
    const updateChatLog = (userInfo, chatMessage) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const insertQuery = `
      INSERT INTO chat_log (session_id, user_id, username, message)
      VALUES ($1, $2, $3, $4)
      RETURNING username, message;
    `;
            const selectQuery = `
      SELECT username, message
      FROM chat_log
      WHERE session_id = $1
      ORDER BY created_at ASC;
    `;
            const insertValues = [
                sessionId,
                userInfo.userId,
                userInfo.username,
                chatMessage,
            ];
            yield pool.query(insertQuery, insertValues);
            const result = yield pool.query(selectQuery, [sessionId]);
            return result.rows;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => updateChatLog(userInfo, chatMessage),
        catch: (e) => new Error(`error updating chat log: ${e}`),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.updateChatLogQuery = updateChatLogQuery;
