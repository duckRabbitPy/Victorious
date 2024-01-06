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
exports.getLatestLiveGameSnapshot = exports.getOpenGameSessions = exports.createGameSession = void 0;
const Function_1 = require("@effect/data/Function");
const Effect = __importStar(require("@effect/io/Effect"));
const queries_1 = require("../../models/gamestate/queries");
const utils_1 = require("../../utils");
const responseHandlers_1 = require("../responseHandlers");
const mutations_1 = require("../../models/gamestate/mutations");
const common_1 = require("../../../../shared/common");
const connection_1 = require("../../db/connection");
const createGameSession = (req, res) => {
    const createGameSession = connection_1.Connection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => Effect.all({
        pool: Effect.succeed(pool),
        room: (0, utils_1.safeParseNumber)(req.body.room),
    })), Effect.flatMap(({ pool, room }) => (0, mutations_1.createGameSessionQuery)(room, pool)), Effect.flatMap(common_1.safeParseGameState), (dataOrError) => (0, responseHandlers_1.sendGameStateResponse)({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
    }));
    const runnable = Effect.provideService(createGameSession, connection_1.Connection, connection_1.ConnectionLive);
    Effect.runPromise(runnable);
};
exports.createGameSession = createGameSession;
const getOpenGameSessions = (req, res) => {
    const getOpenGameSessions = connection_1.Connection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => (0, queries_1.getOpenGameSessionsQuery)(pool)), Effect.flatMap((rooms) => (0, utils_1.safeParseNumberArray)(rooms)), (dataOrError) => (0, responseHandlers_1.sendOpenRoomsResponse)({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
    }));
    const runnable = Effect.provideService(getOpenGameSessions, connection_1.Connection, connection_1.ConnectionLive);
    Effect.runPromise(runnable);
};
exports.getOpenGameSessions = getOpenGameSessions;
const getLatestLiveGameSnapshot = ({ room, pool, }) => {
    return (0, Function_1.pipe)((0, queries_1.getLatestGameSnapshotQuery)(room, pool), Effect.flatMap(common_1.safeParseGameState));
};
exports.getLatestLiveGameSnapshot = getLatestLiveGameSnapshot;
