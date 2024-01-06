import * as Effect from "@effect/io/Effect";
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

export const SEED_ROOM = 1;

export const GAME_SNAPSHOT_SEED_VALUES: GameSnapshot = {
  game_snapshots: [
    {
      id: 1454425,
      room: SEED_ROOM,
      turn: 0,
      game_over: false,
      mutation_index: 0,
      session_id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      actor_state: [
        {
          id: "a47ac10b-58cc-4372-a567-0e02b2c3d479",
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
  const client = await Effect.runPromise(
    DBConnectionTest.pool.pipe(
      Effect.flatMap((pool) => Effect.succeed(pool.connect()))
    )
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
            CONSTRAINT unique_room_session_mutation
                UNIQUE (room, session_id, mutation_index));
      `);

    // create new game snapshot
    await client.query(
      `INSERT INTO game_snapshots (id, room, turn, actor_state, global_state) VALUES
        (1454425, $1, 0, 
        $2::jsonb, $3::jsonb) RETURNING *`,
      [
        SEED_ROOM,
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
