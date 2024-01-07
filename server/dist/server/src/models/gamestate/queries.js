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
exports.getOpenGameSessionsQuery = exports.getLatestGameSnapshotQuery = void 0;
// @query
const getLatestGameSnapshotQuery = (room, pool) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // todo ensure is refering to correct game e.g. in a bad state with an old game
            const result = yield pool.query("SELECT * FROM game_snapshots WHERE room = $1 AND game_over = false ORDER BY mutation_index DESC LIMIT 1;", [room]);
            return result.rows[0];
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.getLatestGameSnapshotQuery = getLatestGameSnapshotQuery;
const effect_1 = require("effect");
const customErrors_1 = require("../../customErrors");
const utils_1 = require("../../utils");
// @query
const getOpenGameSessionsQuery = (pool) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("SELECT DISTINCT room FROM game_snapshots WHERE turn = 0 AND game_over = false;");
            return result.rows.map((row) => row.room);
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.getOpenGameSessionsQuery = getOpenGameSessionsQuery;
