import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { pool } from "../db/connection";
import { PostgresError } from "../controllers/customErrors";

const logAndThrowError = (error: unknown) => {
  console.error(error);
  throw error;
};

const ActorState = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  coins: Schema.number,
  hand: Schema.array(Schema.UUID),
  actions: Schema.number,
  buys: Schema.number,
  victoryPoints: Schema.number,
});

const GlobalState = Schema.struct({
  board: Schema.array(Schema.UUID),
  deck: Schema.array(Schema.UUID),
  history: Schema.array(Schema.string),
  liveActors: Schema.array(Schema.UUID),
});

const GameState = Schema.struct({
  id: Schema.UUID,
  room: Schema.number,
  turn: Schema.number,
  actor_state: Schema.array(ActorState),
  global_state: GlobalState,
});

export type GameState = Schema.To<typeof GameState>;

export const parseGameState = Schema.parse(GameState);

const hexChars = "0123456789abcdef";

function generateUUID(): string {
  const generateChar = (): string => hexChars[Math.floor(Math.random() * 16)];

  const generateSegment = (length: number): string =>
    Array.from({ length }, generateChar).join("");

  return `${generateSegment(8)}-${generateSegment(4)}-${generateSegment(
    4
  )}-${generateSegment(4)}-${generateSegment(12)}`;
}

const generatateActorState = (actorIds: readonly string[]) => {
  const actorStates = actorIds.map((id, i) => {
    return {
      id,
      name: `Player ${i}`,
      coins: 0,
      hand: [],
      actions: 0,
      buys: 0,
      victoryPoints: 0,
    };
  });

  return JSON.stringify(actorStates);
};

const generatateGlobalState = (actorIds: readonly string[]) => {
  return JSON.stringify({
    board: [],
    deck: [],
    history: [],
    liveActors: actorIds,
  });
};

export const createGameSessionQuery = (
  room: number,
  actorIds: readonly string[]
) => {
  const turn = 0;

  const create = async () => {
    try {
      const result = await pool.query(
        `INSERT INTO game_snapshots (id, room, turn, actor_state, global_state)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          generateUUID(),
          room,
          turn,
          generatateActorState(actorIds),
          generatateGlobalState(actorIds),
        ]
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
          `SELECT global_state FROM game_snapshots WHERE room = $1 ORDER BY turn DESC LIMIT 1;`,
          [room]
        )
      ).rows[0].global_state;

      const newGlobalState = JSON.stringify({
        ...currentGlobalState,
        liveActors: [...currentGlobalState.liveActors, userId],
      });

      const result = await pool.query(
        `UPDATE game_snapshots SET global_state = $1 WHERE room = $2 RETURNING *`,
        [newGlobalState, room]
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
        `SELECT * FROM game_snapshots WHERE room = $1 ORDER BY turn DESC;`,
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
        `UPDATE game_snapshots SET turn = turn + 1 WHERE room = $1 RETURNING *`,
        [room]
      );
      console.log(result.rows[0]);
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
