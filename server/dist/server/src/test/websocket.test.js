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
const Effect = __importStar(require("@effect/io/Effect"));
const vitest_1 = require("vitest");
const connection_1 = require("../db/connection");
const seed_1 = require("../db/seed");
const queries_1 = require("../models/gamestate/queries");
const common_1 = require("../../../shared/common");
const handleGameMessage_1 = require("../websocketServer/handleGameMessage");
const handleChatMessage_1 = require("../websocketServer/handleChatMessage");
const getTestSession = Effect.provideService(connection_1.DBConnection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => (0, queries_1.getLatestGameSnapshotQuery)(seed_1.TEST_ROOM, pool)), Effect.flatMap((gameState) => Effect.succeed(gameState)), Effect.flatMap(common_1.safeParseGameState)), connection_1.DBConnection, connection_1.DBConnectionTest);
(0, vitest_1.describe)("websocket message handling", () => {
    (0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, seed_1.resetAndSeedDatabase)();
    }));
    (0, vitest_1.it)("addLivePlayer", () => __awaiter(void 0, void 0, void 0, function* () {
        const initialGamestate = yield Effect.runPromise(getTestSession);
        const room = initialGamestate.room;
        const testMsg = {
            authToken: seed_1.testUser1.authToken,
            effect: common_1.SupportedEffects.addLivePlayer,
            room: room,
            cardName: undefined,
            userId: seed_1.testUser1.userId,
            toDiscardFromHand: [],
            chatMessage: undefined,
        };
        const addNewPlayerToGame = connection_1.DBConnection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => Effect.all({
            pool: Effect.succeed(pool),
            msg: Effect.succeed(testMsg),
        })), Effect.flatMap(({ msg, pool }) => (0, handleGameMessage_1.handleGameMessage)({
            msg,
            pool,
            userInfo: {
                userId: seed_1.testUser1.userId,
                username: seed_1.testUser1.username,
            },
        })), Effect.flatMap(common_1.safeParseGameState));
        const runnable = Effect.provideService(addNewPlayerToGame, connection_1.DBConnection, connection_1.DBConnectionTest);
        (0, vitest_1.expect)((yield Effect.runPromise(runnable)).actor_state[0].id).toEqual(seed_1.testUser1.userId);
    }));
    (0, vitest_1.it)("send chat message", () => __awaiter(void 0, void 0, void 0, function* () {
        const initialGamestate = yield Effect.runPromise(getTestSession);
        const room = initialGamestate.room;
        const testMsg = {
            authToken: seed_1.testUser1.authToken,
            effect: common_1.SupportedEffects.sendChatMessage,
            room: room,
            cardName: undefined,
            userId: seed_1.testUser1.userId,
            toDiscardFromHand: [],
            chatMessage: "test chat message",
        };
        const sendChatMessage = connection_1.DBConnection.pipe(Effect.flatMap((connection) => connection.pool), Effect.flatMap((pool) => Effect.all({
            pool: Effect.succeed(pool),
            msg: Effect.succeed(testMsg),
        })), Effect.flatMap(({ msg, pool }) => (0, handleChatMessage_1.handleChatMessage)({
            msg,
            pool,
            userInfo: {
                userId: seed_1.testUser1.userId,
                username: seed_1.testUser1.username,
            },
        })), Effect.flatMap(common_1.safeParseChatLog));
        const runnable = Effect.provideService(sendChatMessage, connection_1.DBConnection, connection_1.DBConnectionTest);
        (0, vitest_1.expect)((yield Effect.runPromise(runnable))[0].message).toEqual(testMsg.chatMessage);
    }));
});
