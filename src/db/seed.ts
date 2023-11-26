import { pool } from "./connection";
import * as Schema from "@effect/schema/Schema";

export const GAME_SNAPSHOT_SEED_VALUES = {
  game_snapshots: [
    {
      id: "b3da0a35-13e4-44fe-ba4f-bb229b658aa9",
      room: 8393,
      turn: 1,
      actorState: [
        {
          name: "Player 1",
          coins: 0,
          hand: [],
          actions: 0,
          buys: 0,
          victoryPoints: 0,
        },
        {
          name: "Player 2",
          coins: 0,
          hand: [],
          actions: 0,
          buys: 0,
          victoryPoints: 0,
        },
      ],
      globalState: {
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

    await client.query(`
        CREATE TABLE IF NOT EXISTS game_snapshots (
          id uuid PRIMARY KEY, 
          room integer NOT NULL,
          turn integer NOT NULL,
          actor_state JSONB NOT NULL,
          global_state JSONB NOT NULL
        )
      `);

    // create new game snapshot
    await client.query(
      `INSERT INTO game_snapshots (id,room, turn, actor_state, global_state) VALUES
        ('b3da0a35-13e4-44fe-ba4f-bb229b658aa9', 8393, 1, 
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
