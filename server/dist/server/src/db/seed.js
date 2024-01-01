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
exports.resetAndSeedDatabase = exports.GAME_SNAPSHOT_SEED_VALUES = void 0;
const common_1 = require("../../../shared/common");
const connection_1 = require("./connection");
exports.GAME_SNAPSHOT_SEED_VALUES = {
    game_snapshots: [
        {
            id: 1,
            room: 8393,
            turn: 0,
            game_over: false,
            mutation_index: 0,
            session_id: "a3da0a35-13e4-44fe-ba4f-bb229b658aa9",
            actor_state: [
                {
                    id: "g7kd0l89-39j4-4j3k-9j3k-3j4k3j4k3j4k",
                    name: "Player 1",
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
                    cardsInPlay: {
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
                    bonusTreasureValue: 0,
                },
                {
                    id: "l8sw0l89-39j4-4j3k-9j3k-3j4k3j4k3j4k",
                    name: "Player 2",
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
                    cardsInPlay: {
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
                    bonusTreasureValue: 0,
                },
            ],
            global_state: {
                playerUserIds: [],
                supply: {
                    copper: 60,
                    silver: 40,
                    gold: 30,
                    estate: 24,
                    duchy: 12,
                    province: 12,
                    curse: 30,
                    village: 10,
                    smithy: 10,
                    market: 10,
                    councilRoom: 10,
                    mine: 10,
                    festival: 10,
                    laboratory: 10,
                },
                history: [],
            },
        },
    ],
};
const resetAndSeedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield connection_1.pool.connect();
    try {
        yield client.query("DROP TABLE IF EXISTS game_snapshots");
        yield client.query("DROP TABLE IF EXISTS users");
        yield client.query("DROP TABLE IF EXISTS chat_log");
        yield client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          username varchar(255) UNIQUE NOT NULL,
          password varchar(255) NOT NULL,
          email varchar(255) UNIQUE NOT NULL,
          confirmation_token uuid NOT NULL,
          verified boolean NOT NULL DEFAULT false
        )
      `);
        yield client.query(`
        CREATE TABLE IF NOT EXISTS chat_log (
          id serial PRIMARY KEY,
          session_id UUID NOT NULL,
          user_id uuid NOT NULL,
          username varchar(255) NOT NULL,
          message varchar(255) NOT NULL,
          created_at timestamp NOT NULL DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(user_id)
        )`);
        yield client.query(`
        CREATE TABLE IF NOT EXISTS game_snapshots (
            id serial PRIMARY KEY,
            session_id uuid DEFAULT gen_random_uuid(),
            mutation_index serial NOT NULL,
            room integer NOT NULL,
            turn integer NOT NULL,
            game_over boolean NOT NULL DEFAULT false,
            actor_state JSONB NOT NULL,
            global_state JSONB NOT NULL,
            CONSTRAINT unique_room_session_mutation
                UNIQUE (room, session_id, mutation_index));
      `);
        // create new game snapshot
        yield client.query(`INSERT INTO game_snapshots (id,room, turn, actor_state, global_state) VALUES
        ('b3da0a35-13e4-44fe-ba4f-bb229b658aa9', 8393, 0, 
         ${JSON.stringify(exports.GAME_SNAPSHOT_SEED_VALUES.game_snapshots[0].actor_state)},
          ${JSON.stringify(exports.GAME_SNAPSHOT_SEED_VALUES.game_snapshots[0].global_state)}
      `);
    }
    catch (error) {
        console.error("Error resetting and seeding the database:", error);
    }
    finally {
        client.release();
    }
});
exports.resetAndSeedDatabase = resetAndSeedDatabase;