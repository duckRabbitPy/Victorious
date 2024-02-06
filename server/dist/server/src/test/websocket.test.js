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
(0, vitest_1.describe)("gamestate tests", () => {
    (0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, seed_1.resetAndSeedDatabase)();
    }));
    (0, vitest_1.it)("add players, start game, buy card, end turn", () => __awaiter(void 0, void 0, void 0, function* () {
        // Fetch initial game state
        const initialGameState = yield effect_1.Effect.runPromise(getTestSession);
        const createTestMessage = (effect, userId, cardName, lastGameState) => ({
            mutationIndex: (lastGameState === null || lastGameState === void 0 ? void 0 : lastGameState.mutation_index) || 0,
            authToken: userId === seed_1.testUser1.userId ? seed_1.testUser1.authToken : seed_1.testUser2.authToken,
            effect,
            room: initialGameState.room,
            cardName: cardName || undefined,
            chatMessage: undefined,
            toDiscardFromHand: [],
        });
        const executeGameOperation = ({ effect, userId, cardName, lastGameState, }) => {
            const testMsg = createTestMessage(effect, userId, cardName, lastGameState);
            const operation = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({
                pool: effect_1.Effect.succeed(pool),
                msg: effect_1.Effect.succeed(testMsg),
            })), effect_1.Effect.flatMap(({ msg, pool }) => (0, handleGameMessage_1.handleGameMessage)({
                msg,
                pool,
                userInfo: {
                    userId,
                    username: userId === seed_1.testUser1.userId
                        ? seed_1.testUser1.username
                        : seed_1.testUser2.username,
                },
            })), effect_1.Effect.flatMap(common_1.safeParseGameState));
            return effect_1.Effect.provideService(operation, connection_1.DBConnection, connection_1.DBConnectionTest);
        };
        // Execute operations sequentially
        const runnable = (0, effect_1.pipe)(executeGameOperation({
            effect: common_1.SupportedEffects.addLivePlayer,
            userId: seed_1.testUser1.userId,
            lastGameState: initialGameState,
        }), effect_1.Effect.flatMap((gamestate) => executeGameOperation({
            effect: common_1.SupportedEffects.addLivePlayer,
            userId: seed_1.testUser2.userId,
            lastGameState: gamestate,
        })), effect_1.Effect.flatMap((gamestate) => executeGameOperation({
            effect: common_1.SupportedEffects.startGame,
            userId: seed_1.testUser1.userId,
            lastGameState: gamestate,
        })), effect_1.Effect.flatMap((gamestate) => executeGameOperation({
            effect: common_1.SupportedEffects.buyCard,
            userId: seed_1.testUser1.userId,
            cardName: "copper",
            lastGameState: gamestate,
        })), effect_1.Effect.flatMap((gamestate) => executeGameOperation({
            lastGameState: gamestate,
            effect: common_1.SupportedEffects.incrementTurn,
            userId: seed_1.testUser1.userId,
        })));
        const newGameState = yield effect_1.Effect.runPromise(runnable);
        // Assertions
        (0, vitest_1.expect)(newGameState.turn).toEqual(2);
        (0, vitest_1.expect)(newGameState.global_state.supply.copper).toEqual(59);
        (0, vitest_1.expect)(newGameState.global_state.history).toContain(`${seed_1.testUser1.username} purchased a copper`);
        (0, vitest_1.expect)(newGameState.actor_state[0].hand.estate +
            newGameState.actor_state[0].deck.reduce((acc, card) => (card === "estate" ? acc + 1 : acc), 0) +
            newGameState.actor_state[0].discardPile.reduce((acc, card) => (card === "estate" ? acc + 1 : acc), 0)).toEqual(3);
    }));
});
(0, vitest_1.describe)("chat tests", () => {
    (0, vitest_1.it)("send chat message", () => __awaiter(void 0, void 0, void 0, function* () {
        const initialGamestate = yield effect_1.Effect.runPromise(getTestSession);
        const room = initialGamestate.room;
        const testMsg = {
            mutationIndex: initialGamestate.mutation_index,
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
