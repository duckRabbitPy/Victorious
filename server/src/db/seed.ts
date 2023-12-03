import { GameState } from "../../../shared/commonTypes";
import { pool } from "./connection";

type GameSnapshot = {
  game_snapshots: GameState[];
};

export const GAME_SNAPSHOT_SEED_VALUES: GameSnapshot = {
  game_snapshots: [
    {
      id: "b3da0a35-13e4-44fe-ba4f-bb229b658aa9",
      room: 8393,
      turn: 0,
      actor_state: [
        {
          id: "g7kd0l89-39j4-4j3k-9j3k-3j4k3j4k3j4k",
          name: "Player 1",
          coins: 0,
          hand: [],
          actions: 0,
          buys: 0,
          victoryPoints: 0,
        },
        {
          id: "l8sw0l89-39j4-4j3k-9j3k-3j4k3j4k3j4k",
          name: "Player 2",
          coins: 0,
          hand: [],
          actions: 0,
          buys: 0,
          victoryPoints: 0,
        },
      ],
      global_state: {
        liveActors: [],
        board: [],
        deck: [],
        history: [],
      },
    },
  ],
};

export const resetAndSeedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("DROP TABLE IF EXISTS game_snapshots");

    await client.query("DROP TABLE IF EXISTS users");

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
        CREATE TABLE IF NOT EXISTS game_snapshots (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(), 
          room integer NOT NULL,
          turn integer NOT NULL,
          actor_state JSONB NOT NULL,
          global_state JSONB NOT NULL
        )
      `);

    // create new game snapshot
    await client.query(
      `INSERT INTO game_snapshots (id,room, turn, actor_state, global_state) VALUES
        ('b3da0a35-13e4-44fe-ba4f-bb229b658aa9', 8393, 0, 
         '[{"name": "Player 1", "coins": 0, "hand": [], "actions": 0, "buys": 0, "victoryPoints": 0}, {"name": "Player 2", "coins": 0, "hand": [], "actions": 0, "buys": 0, "victoryPoints": 0}]',
         '{"board": [], "deck": [], "history": []}');
      `
    );
  } catch (error) {
    console.error("Error resetting and seeding the database:", error);
  } finally {
    client.release();
  }
};
