import {
  CardNames,
  GameState,
  Phases,
  CardCount,
} from "../../../shared/commonTypes";
import { pool } from "./connection";

type GameSnapshot = {
  game_snapshots: GameState[];
};

export const GAME_SNAPSHOT_SEED_VALUES: GameSnapshot = {
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
            [CardNames.Copper]: 0,
            [CardNames.Silver]: 0,
            [CardNames.Gold]: 0,
            [CardNames.Estate]: 0,
            [CardNames.Duchy]: 0,
            [CardNames.Province]: 0,
            [CardNames.Market]: 0,
            [CardNames.Smithy]: 0,
            [CardNames.Village]: 0,
            [CardNames.Festival]: 0,
            [CardNames.Laboratory]: 0,
            [CardNames.CouncilRoom]: 0,
          } as CardCount,
          actions: 0,
          buys: 0,
          victoryPoints: 0,
          deck: [
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Estate,
            CardNames.Estate,
            CardNames.Estate,
          ],
          discardPile: [],
          phase: Phases.Action,
        },
        {
          id: "l8sw0l89-39j4-4j3k-9j3k-3j4k3j4k3j4k",
          name: "Player 2",
          hand: {
            [CardNames.Copper]: 0,
            [CardNames.Silver]: 0,
            [CardNames.Gold]: 0,
            [CardNames.Estate]: 0,
            [CardNames.Duchy]: 0,
            [CardNames.Province]: 0,
            [CardNames.Market]: 0,
            [CardNames.Smithy]: 0,
            [CardNames.Village]: 0,
            [CardNames.Festival]: 0,
            [CardNames.Laboratory]: 0,
            [CardNames.CouncilRoom]: 0,
          } as CardCount,
          actions: 0,
          buys: 0,
          victoryPoints: 0,
          deck: [
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Copper,
            CardNames.Estate,
            CardNames.Estate,
            CardNames.Estate,
          ],
          discardPile: [],
          phase: Phases.Action,
        },
      ],
      global_state: {
        playerUserIds: [],
        supply: {
          [CardNames.Copper]: 60,
          [CardNames.Silver]: 40,
          [CardNames.Gold]: 30,
          [CardNames.Estate]: 24,
          [CardNames.Duchy]: 12,
          [CardNames.Province]: 12,
          [CardNames.Market]: 10,
          [CardNames.Smithy]: 10,
          [CardNames.Village]: 10,
          [CardNames.Festival]: 10,
          [CardNames.Laboratory]: 10,
          [CardNames.CouncilRoom]: 10,
        } as CardCount,
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

    // there should never be collisions on mutation_index for the same room and session_id
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
