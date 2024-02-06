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
exports.getLatestChatLogQuery = void 0;
const utils_1 = require("../../utils");
const effect_1 = require("effect");
const getLatestChatLogQuery = (sessionId, pool) => {
    const getLatestChatLog = (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query(`
        SELECT username, message
        FROM chat_log
        WHERE session_id = $1
        ORDER BY created_at ASC;
        `, [sessionId]);
            return result.rows;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => getLatestChatLog(sessionId),
        catch: (e) => new Error(`error getting latest chat log: ${e}`),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.getLatestChatLogQuery = getLatestChatLogQuery;
