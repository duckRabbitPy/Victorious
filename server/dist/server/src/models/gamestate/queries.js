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
exports.endStaleGameSessionsMutation = exports.getOpenGameSessionsQuery = exports.getLatestGameSnapshotQuery = void 0;
const effect_1 = require("effect");
const customErrors_1 = require("../../customErrors");
const utils_1 = require("../../utils");
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
// @query
const getOpenGameSessionsQuery = (pool) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("SELECT gs.room FROM game_snapshots gs WHERE NOT EXISTS (SELECT 1 FROM game_snapshots WHERE session_id = gs.session_id AND game_over = true);");
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
// @mutation
const endStaleGameSessionsMutation = (pool) => {
    const endStaleSessions = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const killAfterInactivityDuration = "5 seconds";
            const latestStaleGameSnapshots = yield pool.query(`
      SELECT gs.*
      FROM game_snapshots gs
      WHERE created_at < NOW() - interval '${killAfterInactivityDuration}'
        AND NOT EXISTS (
          SELECT 1
          FROM game_snapshots
          WHERE session_id = gs.session_id
            AND game_over = true
            AND mutation_index > gs.mutation_index
        );`);
            const terminatedGameSessions = latestStaleGameSnapshots.rows.map((row) => (Object.assign(Object.assign({}, row), { mutation_index: row.mutation_index + 1, game_over: true })));
            console.log("ending sessions in rooms", terminatedGameSessions.map((s) => s.room));
            for (const session of terminatedGameSessions) {
                yield pool.query(`
            INSERT INTO game_snapshots
              (session_id, mutation_index, room, turn, game_over, actor_state, global_state)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7)
             
          `, [
                    session.session_id,
                    session.mutation_index,
                    session.room,
                    session.turn,
                    session.game_over,
                    JSON.stringify(session.actor_state),
                    JSON.stringify(session.global_state),
                ]);
            }
            return pool;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
            return pool;
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => endStaleSessions(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.endStaleGameSessionsMutation = endStaleGameSessionsMutation;
