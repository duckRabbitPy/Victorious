import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { pool } from "../db/connection";
import { PostgresError } from "../controllers/customErrors";
import { GameStateStruct, GlobalState } from "../../../shared/commonTypes";
import { logAndThrowError } from "../utils";

export const parseGameState = Schema.parse(GameStateStruct);

const hexChars = "0123456789abcdef";

function generateUUID(): string {
  const generateChar = (): string => hexChars[Math.floor(Math.random() * 16)];

  const generateSegment = (length: number): string =>
    Array.from({ length }, generateChar).join("");

  return `${generateSegment(8)}-${generateSegment(4)}-${generateSegment(
    4
  )}-${generateSegment(4)}-${generateSegment(12)}`;
}

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

export const createGameSessionQuery = (room: number) => {
  const turn = 0;

  const create = async () => {
    try {
      const result = await pool.query(
        `INSERT INTO game_snapshots (id, room, turn, actor_state, global_state)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [generateUUID(), room, turn, "[]", generatateGlobalState()]
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

export const addLivePlayerQuery = (userId: string, room: number) => {
  const add = async () => {
    try {
      const currentGlobalState = (
        await pool.query(
          "SELECT global_state FROM game_snapshots WHERE room = $1 ORDER BY turn DESC LIMIT 1;",
          [room]
        )
      ).rows[0].global_state;

      const currentActorState = (
        await pool.query(
          "SELECT actor_state FROM game_snapshots WHERE room = $1 ORDER BY turn DESC LIMIT 1;",
          [room]
        )
      ).rows[0].actor_state;

      const newGlobalState = JSON.stringify({
        ...currentGlobalState,
        liveActors: [...currentGlobalState.liveActors, userId],
      });

      const newActorState =
        currentActorState.length > 0
          ? JSON.stringify([
              ...currentActorState,
              {
                id: userId,
                name: `Player ${currentActorState.length}`,
                coins: 0,
                hand: [],
                actions: 0,
                buys: 0,
                victoryPoints: 0,
              },
            ])
          : generateActorState([userId]);

      const result = await pool.query(
        "UPDATE game_snapshots SET global_state = $1, actor_state = $2 WHERE room = $3 RETURNING *",
        [newGlobalState, newActorState, room]
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

export const getGameSessionQuery = (room: number) => {
  const get = async () => {
    try {
      // todo: sort if turn the same?
      const result = await pool.query(
        "SELECT * FROM game_snapshots WHERE room = $1 ORDER BY turn DESC;",
        [room]
      );

      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};

export const incrementTurnQuery = (room: number) => {
  const increment = async () => {
    try {
      const result = await pool.query(
        "UPDATE game_snapshots SET turn = turn + 1 WHERE room = $1 RETURNING *",
        [room]
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
