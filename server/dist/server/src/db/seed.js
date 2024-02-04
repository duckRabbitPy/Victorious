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
exports.resetAndSeedDatabase = exports.GAME_SNAPSHOT_SEED_VALUES = exports.testUser2 = exports.testUser1 = exports.TEST_ROOM = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../shared/common");
const connection_1 = require("./connection");
exports.TEST_ROOM = 1;
exports.testUser1 = {
    userId: "839152db-48f5-41e1-8db6-4ee5667c03c8",
    username: "testUser1",
    email: "test@test",
    password: process.env.TEST_PASSWORD,
    hashedPassword: "$2b$10$QB7PoZbnUborzB0DptDdHOcLjNGdSe2o19xvCB7pvup5L20aybMEy",
    confirmation_token: "e2f692a4-1152-40d7-9464-562900d12243",
    authToken: "zI1NivsInR5tCI6IkpPVCJ9.eyJ1c2VySWQiOiIyYzLkZmIy",
};
exports.testUser2 = {
    userId: "b47ac10b-58cc-4372-a567-0e02b2c3d472",
    username: "testUser2",
    email: "test2@test",
    password: process.env.TEST_PASSWORD,
    hashedPassword: "$2b$10$QB7PoZbnUborzB0DptDdHOcLjNGdSe2o19xvCB7pvup5L20aybMEy",
    authToken: "zI1NivsInR5tCI6IkpPVCJ9.eyJ1c2VySWQiOiIyYzLkZmIy",
    confirmation_token: "3d61b80d-7275-4ba0-994b-67f59438275a",
};
exports.GAME_SNAPSHOT_SEED_VALUES = {
    game_snapshots: [
        {
            id: 1454425,
            room: exports.TEST_ROOM,
            turn: 0,
            game_over: false,
            mutation_index: 0,
            session_id: "z47ac10b-58cc-4372-a567-0e02b2c3d479",
            created_at: new Date(),
            actor_state: [
                {
                    id: exports.testUser1.userId,
                    name: exports.testUser1.username,
                    actionPhaseDemand: null,
                    hand: {
                        copper: 0,
                        silver: 0,
                        gold: 0,
                        estate: 0,
                        duchy: 0,
                        province: 0,
                        village: 0,
                        smithy: 0,
                        market: 0,
                        councilRoom: 0,
                        mine: 0,
                        festival: 0,
                        laboratory: 0,
                        moneylender: 0,
                        workshop: 0,
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
                        village: 0,
                        smithy: 0,
                        market: 0,
                        councilRoom: 0,
                        mine: 0,
                        festival: 0,
                        laboratory: 0,
                        moneylender: 0,
                        workshop: 0,
                    },
                    bonusTreasureValue: 0,
                },
                {
                    id: exports.testUser2.userId,
                    name: exports.testUser2.username,
                    actionPhaseDemand: null,
                    hand: {
                        copper: 0,
                        silver: 0,
                        gold: 0,
                        estate: 0,
                        duchy: 0,
                        province: 0,
                        village: 0,
                        smithy: 0,
                        market: 0,
                        councilRoom: 0,
                        mine: 0,
                        festival: 0,
                        laboratory: 0,
                        moneylender: 0,
                        workshop: 0,
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
                        village: 0,
                        smithy: 0,
                        market: 0,
                        councilRoom: 0,
                        mine: 0,
                        festival: 0,
                        laboratory: 0,
                        moneylender: 0,
                        workshop: 0,
                    },
                    bonusTreasureValue: 0,
                },
            ],
            global_state: {
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
                    festival: 10,
                    laboratory: 10,
                    moneylender: 10,
                    workshop: 10,
                },
                history: [],
            },
        },
    ],
};
const resetAndSeedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield effect_1.Effect.runPromise(connection_1.DBConnectionTest.pool.pipe(effect_1.Effect.flatMap((pool) => effect_1.Effect.succeed(pool.connect()))));
    try {
        yield client.query("DROP TABLE IF EXISTS chat_log CASCADE");
        yield client.query("DROP TABLE IF EXISTS users CASCADE");
        yield client.query("DROP TABLE IF EXISTS game_snapshots CASCADE");
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
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_room_session_mutation
                UNIQUE (room, session_id, mutation_index));
      `);
        yield client.query(`
      CREATE TABLE IF NOT EXISTS inactive_sessions (
        session_id uuid PRIMARY KEY
      );
  `);
        // add test user 1
        yield client.query(`INSERT INTO users (user_id, username, password, email, confirmation_token, verified) VALUES
        ($1, $2, $3, $4, $5, $6) RETURNING *`, [
            exports.testUser1.userId,
            exports.testUser1.username,
            exports.testUser1.hashedPassword,
            exports.testUser1.email,
            exports.testUser1.confirmation_token,
            true,
        ]);
        // add test user 2
        yield client.query(`INSERT INTO users (user_id, username, password, email, confirmation_token, verified) VALUES
        ($1, $2, $3, $4, $5, $6) RETURNING *`, [
            exports.testUser2.userId,
            exports.testUser2.username,
            exports.testUser2.hashedPassword,
            exports.testUser2.email,
            exports.testUser2.confirmation_token,
            true,
        ]);
        // create new game snapshot
        yield client.query(`INSERT INTO game_snapshots (id, room, turn, actor_state, global_state) VALUES
        (1454425, $1, 0, 
        $2::jsonb, $3::jsonb) RETURNING *`, [
            exports.TEST_ROOM,
            JSON.stringify([]),
            JSON.stringify(exports.GAME_SNAPSHOT_SEED_VALUES.game_snapshots[0].global_state),
        ]);
    }
    catch (error) {
        console.error("Error resetting and seeding the database:", error);
    }
    finally {
        client.release();
    }
});
exports.resetAndSeedDatabase = resetAndSeedDatabase;
