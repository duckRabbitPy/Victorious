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
const effect_1 = require("effect");
const vitest_1 = require("vitest");
const connection_1 = require("../db/connection");
const seed_1 = require("../db/seed");
const queries_1 = require("../models/gamestate/queries");
const common_1 = require("../../../shared/common");
const handleGameMessage_1 = require("../websocketServer/handleGameMessage");
const handleChatMessage_1 = require("../websocketServer/handleChatMessage");
const getTestSession = effect_1.Effect.provideService(connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => (0, queries_1.getLatestGameSnapshotQuery)(seed_1.TEST_ROOM, pool)), effect_1.Effect.flatMap((gameState) => effect_1.Effect.succeed(gameState)), effect_1.Effect.flatMap(common_1.safeParseGameState)), connection_1.DBConnection, connection_1.DBConnectionTest);
(0, vitest_1.describe)("websocket message handling", () => {
    (0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, seed_1.resetAndSeedDatabase)();
    }));
    (0, vitest_1.it)("addLivePlayer", () => __awaiter(void 0, void 0, void 0, function* () {
        const initialGamestate = yield effect_1.Effect.runPromise(getTestSession);
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
        const addNewPlayerToGame = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({
            pool: effect_1.Effect.succeed(pool),
            msg: effect_1.Effect.succeed(testMsg),
        })), effect_1.Effect.flatMap(({ msg, pool }) => (0, handleGameMessage_1.handleGameMessage)({
            msg,
            pool,
            userInfo: {
                userId: seed_1.testUser1.userId,
                username: seed_1.testUser1.username,
            },
        })), effect_1.Effect.flatMap(common_1.safeParseGameState));
        const runnable = effect_1.Effect.provideService(addNewPlayerToGame, connection_1.DBConnection, connection_1.DBConnectionTest);
        (0, vitest_1.expect)((yield effect_1.Effect.runPromise(runnable)).actor_state[0].id).toEqual(seed_1.testUser1.userId);
    }));
    (0, vitest_1.it)("send chat message", () => __awaiter(void 0, void 0, void 0, function* () {
        const initialGamestate = yield effect_1.Effect.runPromise(getTestSession);
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
        const sendChatMessage = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({
            pool: effect_1.Effect.succeed(pool),
            msg: effect_1.Effect.succeed(testMsg),
        })), effect_1.Effect.flatMap(({ msg, pool }) => (0, handleChatMessage_1.handleChatMessage)({
            msg,
            pool,
            userInfo: {
                userId: seed_1.testUser1.userId,
                username: seed_1.testUser1.username,
            },
        })), effect_1.Effect.flatMap(common_1.safeParseChatLog));
        const runnable = effect_1.Effect.provideService(sendChatMessage, connection_1.DBConnection, connection_1.DBConnectionTest);
        (0, vitest_1.expect)((yield effect_1.Effect.runPromise(runnable))[0].message).toEqual(testMsg.chatMessage);
    }));
});
