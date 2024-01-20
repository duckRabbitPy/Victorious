import { Effect as E } from "effect";
import {
  GameState,
  Phases,
  CardCount,
  ActorState,
  GlobalState,
} from "../../../shared/common";
import { DBConnectionTest } from "./connection";

type GameSnapshot = {
  game_snapshots: GameState[];
};

export const TEST_ROOM = 1;

export const testUser1 = {
  userId: "839152db-48f5-41e1-8db6-4ee5667c03c8",
  username: "testUser1",
  email: "test@test",
  password: process.env.TEST_PASSWORD,
  hashedPassword:
    "$2b$10$QB7PoZbnUborzB0DptDdHOcLjNGdSe2o19xvCB7pvup5L20aybMEy",
  confirmation_token: "e2f692a4-1152-40d7-9464-562900d12243",
  authToken: "zI1NivsInR5tCI6IkpPVCJ9.eyJ1c2VySWQiOiIyYzLkZmIy",
};

export const testUser2 = {
  userId: "b47ac10b-58cc-4372-a567-0e02b2c3d472",
  username: "testUser2",
  email: "test2@test",
  password: process.env.TEST_PASSWORD,
  hashedPassword:
    "$2b$10$QB7PoZbnUborzB0DptDdHOcLjNGdSe2o19xvCB7pvup5L20aybMEy",
  authToken: "zI1NivsInR5tCI6IkpPVCJ9.eyJ1c2VySWQiOiIyYzLkZmIy",
  confirmation_token: "3d61b80d-7275-4ba0-994b-67f59438275a",
};

export const GAME_SNAPSHOT_SEED_VALUES: GameSnapshot = {
  game_snapshots: [
    {
      id: 1454425,
      room: TEST_ROOM,
      turn: 0,
      game_over: false,
      mutation_index: 0,
      session_id: "z47ac10b-58cc-4372-a567-0e02b2c3d479",
      created_at: new Date(),
      actor_state: [
        {
          id: testUser1.userId,
          name: testUser1.username,
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
          } as CardCount,
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
          phase: Phases.Action,
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
          id: testUser2.userId,
          name: testUser2.username,
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
          } as CardCount,
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
          phase: Phases.Action,
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
      ] as ActorState[],
      global_state: {
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
        } as CardCount,
        history: [],
      } as GlobalState,
    },
  ],
};

export const resetAndSeedDatabase = async () => {
  const client = await E.runPromise(
    DBConnectionTest.pool.pipe(E.flatMap((pool) => E.succeed(pool.connect())))
  );

  try {
    await client.query("DROP TABLE IF EXISTS chat_log CASCADE");
    await client.query("DROP TABLE IF EXISTS users CASCADE");
    await client.query("DROP TABLE IF EXISTS game_snapshots CASCADE");

    await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          username varchar(255) UNIQUE NOT NULL,
          password varchar(255) NOT NULL,
          email varchar(255) UNIQUE NOT NULL,
          confirmation_token uuid NOT NULL,
          verified boolean NOT NULL DEFAULT false
        )
      `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS chat_log (
          id serial PRIMARY KEY,
          session_id UUID NOT NULL,
          user_id uuid NOT NULL,
          username varchar(255) NOT NULL,
          message varchar(255) NOT NULL,
          created_at timestamp NOT NULL DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(user_id)
        )`);

    await client.query(`
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

    // add test user 1
    await client.query(
      `INSERT INTO users (user_id, username, password, email, confirmation_token, verified) VALUES
        ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        testUser1.userId,
        testUser1.username,
        testUser1.hashedPassword,
        testUser1.email,
        testUser1.confirmation_token,
        true,
      ]
    );

    // add test user 2
    await client.query(
      `INSERT INTO users (user_id, username, password, email, confirmation_token, verified) VALUES
        ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        testUser2.userId,
        testUser2.username,
        testUser2.hashedPassword,
        testUser2.email,
        testUser2.confirmation_token,
        true,
      ]
    );

    // create new game snapshot
    await client.query(
      `INSERT INTO game_snapshots (id, room, turn, actor_state, global_state) VALUES
        (1454425, $1, 0, 
        $2::jsonb, $3::jsonb) RETURNING *`,
      [
        TEST_ROOM,
        JSON.stringify([]),
        JSON.stringify(
          GAME_SNAPSHOT_SEED_VALUES.game_snapshots[0].global_state
        ),
      ]
    );
  } catch (error) {
    console.error("Error resetting and seeding the database:", error);
  } finally {
    client.release();
  }
};
