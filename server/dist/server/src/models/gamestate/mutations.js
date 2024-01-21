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
exports.endStaleGameSessionsMutation = exports.writeNewGameStateToDB = exports.updateGameState = exports.addLivePlayerQuery = exports.createGameSessionQuery = void 0;
const effect_1 = require("effect");
const customErrors_1 = require("../../customErrors");
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../utils");
const setUpActorsForGame = ({ currentActorStateArray, newUserId, newUserName, }) => {
    const newActorState = [
        ...(currentActorStateArray.length > 0 ? currentActorStateArray : []),
        {
            id: newUserId,
            name: newUserName,
            hand: {
                copper: 0,
                silver: 0,
                gold: 0,
                estate: 0,
                duchy: 0,
                province: 0,
                curse: 0,
                village: 0,
                smithy: 0,
                market: 0,
                councilRoom: 0,
                mine: 0,
                festival: 0,
                laboratory: 0,
            },
            actions: 0,
            buys: 0,
            bonusTreasureValue: 0,
            cardsInPlay: common_1.zeroCardCount,
            victoryPoints: 0,
            deck: [
                "copper",
                "copper",
                "copper",
                "copper",
                "copper",
                "copper",
                "copper",
                "estate",
                "estate",
                "estate",
            ],
            discardPile: [],
            phase: common_1.Phases.Action,
        },
    ];
    return JSON.stringify(newActorState);
};
const startingState = {
    supply: {
        copper: 60,
        silver: 40,
        gold: 30,
        estate: 24,
        duchy: 12,
        province: 12,
        village: 10,
        smithy: 10,
        market: 10,
        councilRoom: 10,
        mine: 10,
        curse: 30,
        festival: 10,
        laboratory: 10,
    },
    history: [],
};
// @mutation
const createGameSessionQuery = (room, pool) => {
    const turn = 0;
    const create = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const existingOpenRooms = yield pool.query(`
        SELECT *
        FROM game_snapshots gs1
        WHERE room = $1
            AND gs1.session_id NOT IN (
                SELECT session_id
                FROM inactive_sessions
            )
        `, [room]);
            if (existingOpenRooms.rows.length > 0) {
                throw new customErrors_1.PostgresError({
                    message: `There is already an open room ${room}`,
                });
            }
            const result = yield pool.query(`INSERT INTO game_snapshots (room, turn, actor_state, global_state)
             VALUES ($1, $2, $3, $4) RETURNING *`, [room, turn, "[]", JSON.stringify(startingState)]);
            return result.rows[0];
        }
        catch (error) {
            console.log({ error });
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => create(),
        catch: (e) => e instanceof customErrors_1.PostgresError
            ? e
            : new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.createGameSessionQuery = createGameSessionQuery;
// @mutation
const addLivePlayerQuery = ({ userInfo, currentGameState, pool, }) => {
    const add = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const room = currentGameState.room;
            const { turn, actor_state, global_state, mutation_index, game_over, session_id, } = currentGameState;
            const newMutationIndex = mutation_index + 1;
            const newActorState = setUpActorsForGame({
                currentActorStateArray: actor_state,
                newUserId: userInfo.userId,
                newUserName: userInfo.username,
            });
            const result = yield pool.query(`
        WITH max_mutation AS (
            SELECT MAX(mutation_index) AS max_mutation_index
            FROM game_snapshots
            WHERE session_id = $7
        )
        INSERT INTO game_snapshots (room, turn, actor_state, global_state, mutation_index, game_over, session_id)
        SELECT $1, $2, $3, $4, $5, $6, $7
        WHERE $5 = (SELECT max_mutation_index FROM max_mutation) + 1
        RETURNING *;
        `, [
                room,
                turn,
                newActorState,
                global_state,
                newMutationIndex,
                game_over,
                session_id,
            ]);
            return result.rows[0];
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => add(),
        catch: () => {
            return new customErrors_1.PostgresError({ message: "postgres query error" });
        },
    }).pipe(effect_1.Effect.retryN(1));
};
exports.addLivePlayerQuery = addLivePlayerQuery;
// @mutation
const updateGameState = (newGameState, pool) => {
    const { room, turn, actor_state, global_state, game_over, mutation_index, session_id, } = newGameState;
    const newMutationIndex = mutation_index + 1;
    const update = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query(`
        WITH max_mutation AS (
            SELECT MAX(mutation_index) AS max_mutation_index
            FROM game_snapshots
            WHERE session_id = $7
        )
        INSERT INTO game_snapshots (room, turn, actor_state, global_state, mutation_index, game_over, session_id)
        SELECT $1, $2, $3, $4, $5, $6, $7
        WHERE $5 = (SELECT max_mutation_index FROM max_mutation) + 1
        RETURNING *;
        `, [
                room,
                turn,
                JSON.stringify(actor_state),
                JSON.stringify(global_state),
                newMutationIndex,
                game_over,
                session_id,
            ]);
            return result.rows[0];
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => update(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.updateGameState = updateGameState;
const writeNewGameStateToDB = (maybeValidGameState, pool) => (0, effect_1.pipe)((0, common_1.safeParseGameState)(maybeValidGameState), effect_1.Effect.flatMap((gamestate) => (0, exports.updateGameState)(gamestate, pool)), effect_1.Effect.flatMap(common_1.safeParseGameState));
exports.writeNewGameStateToDB = writeNewGameStateToDB;
// @mutation
const endStaleGameSessionsMutation = (pool) => {
    const endStaleSessions = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const killAfterInactivityDuration = "3 days";
            yield pool.query(`
        INSERT INTO inactive_sessions (session_id)
        SELECT DISTINCT ON (session_id) session_id
        FROM game_snapshots
        WHERE created_at < NOW() - INTERVAL '${killAfterInactivityDuration}'
        AND session_id NOT IN (
          SELECT session_id
          FROM inactive_sessions
        )
        ORDER BY session_id, mutation_index DESC
      `);
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
