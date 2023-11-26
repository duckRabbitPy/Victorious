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
  const turn = 1;

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
      console.log(result.rows[0].actor_state);
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
