import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { pool } from "../../db/connection";
import { PostgresError } from "../../controllers/customErrors";
import {
  GameState,
  GameStateStruct,
  GlobalState,
} from "../../../../shared/commonTypes";
import { logAndThrowError } from "../../utils";
import { getLatestGameSnapshotQuery } from "./queries";

export const safeParseGameState = Schema.parse(GameStateStruct);

const generateActorState = (actorIds: readonly string[]) => {
  const actorStates = actorIds.map((id, i) => {
    return {
      id,
      name: `Player ${i + 1}`,
      coins: 0,
      hand: [],
      actions: 0,
      buys: 0,
      victoryPoints: 0,
    };
  });

  return JSON.stringify(actorStates);
};

const generatateGlobalState = () => {
  const startingState: GlobalState = {
    board: [],
    deck: [],
    history: [],
    liveActors: [],
  };

  return JSON.stringify(startingState);
};

// @mutation
export const createGameSessionQuery = (room: number) => {
  const turn = 0;

  const create = async () => {
    try {
      const existingOpenRooms = await pool.query(
        "SELECT room FROM game_snapshots WHERE room = $1 AND turn = 0 AND game_over = false;",
        [room]
      );

      if (existingOpenRooms.rows.length > 0) {
        throw new Error(`There is already an open room ${room}`);
      }

      const result = await pool.query(
        `INSERT INTO game_snapshots (room, turn, actor_state, global_state)
             VALUES ($1, $2, $3, $4) RETURNING *`,
        [room, turn, "[]", generatateGlobalState()]
      );

      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => create(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};

// @mutation
export const addLivePlayerQuery = ({
  userId,
  currentGameState,
}: {
  userId: string;
  currentGameState: GameState;
}) => {
  const add = async () => {
    try {
      const room = currentGameState.room;
      const { turn, actor_state, global_state, mutation_index, game_over } =
        currentGameState;
      const newMutationIndex = mutation_index + 1;

      if (global_state.liveActors?.includes(userId)) {
        // no change in state if player already in game
        const currState = await Effect.runPromise(
          getLatestGameSnapshotQuery(room)
        );
        return currState;
      }

      const newGlobalState = JSON.stringify({
        ...global_state,
        liveActors: [...global_state.liveActors, userId],
      });

      const newActorState =
        actor_state.length > 0
          ? JSON.stringify([
              ...actor_state,
              {
                id: userId,
                name: `Player ${actor_state.length + 1}`,
                coins: 0,
                hand: [],
                actions: 0,
                buys: 0,
                victoryPoints: 0,
              },
            ])
          : generateActorState([userId]);

      const result = await pool.query(
        "INSERT INTO game_snapshots (room, turn, actor_state, global_state, mutation_index, game_over) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [room, turn, newActorState, newGlobalState, newMutationIndex, game_over]
      );
      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => add(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};

// @mutation
export const incrementTurnQuery = (currentGameState: GameState) => {
  const { room, turn, actor_state, global_state, game_over, mutation_index } =
    currentGameState;
  const newTurn = turn + 1;
  const newMutationIndex = mutation_index + 1;

  const increment = async () => {
    try {
      const result = await pool.query(
        "INSERT INTO game_snapshots (room, turn, actor_state, global_state, mutation_index, game_over) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          room,
          newTurn,
          JSON.stringify(actor_state),
          JSON.stringify(global_state),
          newMutationIndex,
          game_over,
        ]
      );
      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => increment(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};
