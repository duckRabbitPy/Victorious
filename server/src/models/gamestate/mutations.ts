import { pipe, Effect as E } from "effect";
import { PostgresError } from "../../customErrors";
import {
  ActorState,
  CardCount,
  GameState,
  GlobalState,
  Phases,
  safeParseGameState,
  zeroCardCount,
} from "../../../../shared/common";
import { logAndThrowError } from "../../utils";
import { Pool } from "pg";
import { UserInfo } from "../../websocketServer/createWebsocketServer";

const setUpActorsForGame = ({
  currentActorStateArray,
  newUserId,
  newUserName,
}: {
  currentActorStateArray: readonly ActorState[];
  newUserId: string;
  newUserName: string;
}) => {
  const newActorState: ActorState[] = [
    ...(currentActorStateArray.length > 0 ? currentActorStateArray : []),
    {
      id: newUserId,
      name: newUserName,
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
      bonusTreasureValue: 0,
      cardsInPlay: zeroCardCount,
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
    },
  ];

  return JSON.stringify(newActorState);
};

const startingState: GlobalState = {
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
    curse: 30,
    festival: 10,
    laboratory: 10,
  },
  history: [],
};

// @mutation
export const createGameSessionQuery = (room: number, pool: Pool) => {
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
        [room, turn, "[]", JSON.stringify(startingState)]
      );
      return result.rows[0];
    } catch (error) {
      console.log({ error });
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => create(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retryN(1));
};

// @mutation
export const addLivePlayerQuery = ({
  userInfo,
  currentGameState,
  pool,
}: {
  userInfo: UserInfo;
  currentGameState: GameState;
  pool: Pool;
}) => {
  const add = async () => {
    try {
      const room = currentGameState.room;
      const {
        turn,
        actor_state,
        global_state,
        mutation_index,
        game_over,
        session_id,
      } = currentGameState;

      if (
        currentGameState.actor_state
          .map((actor) => actor.id)
          .includes(userInfo.userId)
      ) {
        throw new Error(
          `User ${userInfo.username} already exists in room ${room}`
        );
      }

      const newMutationIndex = mutation_index + 1;

      const newActorState = setUpActorsForGame({
        currentActorStateArray: actor_state,
        newUserId: userInfo.userId,
        newUserName: userInfo.username,
      });

      const result = await pool.query(
        `
        WITH max_mutation AS (
            SELECT MAX(mutation_index) AS max_mutation_index
            FROM game_snapshots
            WHERE session_id = $7
        )
        INSERT INTO game_snapshots (room, turn, actor_state, global_state, mutation_index, game_over, session_id)
        SELECT $1, $2, $3, $4, $5, $6, $7
        WHERE $5 = (SELECT max_mutation_index FROM max_mutation) + 1
        RETURNING *;
        `,
        [
          room,
          turn,
          newActorState,
          global_state,
          newMutationIndex,
          game_over,
          session_id,
        ]
      );
      return result.rows[0] as Partial<GameState>;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => add(),
    catch: () => {
      return new PostgresError({ message: "postgres query error" });
    },
  }).pipe(E.retryN(1));
};

// @mutation
export const updateGameState = (newGameState: GameState, pool: Pool) => {
  const {
    room,
    turn,
    actor_state,
    global_state,
    game_over,
    mutation_index,
    session_id,
  } = newGameState;

  const newMutationIndex = mutation_index + 1;

  const update = async () => {
    try {
      const result = await pool.query(
        `
        WITH max_mutation AS (
            SELECT MAX(mutation_index) AS max_mutation_index
            FROM game_snapshots
            WHERE session_id = $7
        )
        INSERT INTO game_snapshots (room, turn, actor_state, global_state, mutation_index, game_over, session_id)
        SELECT $1, $2, $3, $4, $5, $6, $7
        WHERE $5 = (SELECT max_mutation_index FROM max_mutation) + 1
        RETURNING *;
        `,
        [
          room,
          turn,
          JSON.stringify(actor_state),
          JSON.stringify(global_state),
          newMutationIndex,
          game_over,
          session_id,
        ]
      );
      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => update(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retryN(1));
};

export const writeNewGameStateToDB = (
  maybeValidGameState: unknown,
  pool: Pool
) =>
  pipe(
    safeParseGameState(maybeValidGameState),
    E.flatMap((gamestate) => updateGameState(gamestate, pool)),
    E.flatMap(safeParseGameState)
  );
