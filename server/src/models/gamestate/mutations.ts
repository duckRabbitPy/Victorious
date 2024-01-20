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
        `
        SELECT *
        FROM game_snapshots gs1
        WHERE room = $1
            AND NOT EXISTS (
                SELECT 1
                FROM game_snapshots gs2
                WHERE gs2.session_id = gs1.session_id
                    AND gs2.game_over = true
            )
        `,
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
  maybeValidGameState: GameState,
  pool: Pool
) =>
  pipe(
    safeParseGameState(maybeValidGameState),
    E.flatMap((gamestate) => updateGameState(gamestate, pool)),
    E.flatMap(safeParseGameState)
  );

// @mutation
export const endStaleGameSessionsMutation = (pool: Pool) => {
  const endStaleSessions = async () => {
    try {
      const killAfterInactivityDuration = "10 seconds";
      const latestStaleGameSnapshots = await pool.query(`
        SELECT gs.*
        FROM game_snapshots gs
        WHERE created_at < NOW() - interval '${killAfterInactivityDuration}'
            AND NOT EXISTS (
                SELECT 1
                FROM game_snapshots
                WHERE session_id = gs.session_id
                    AND game_over = true
                    AND mutation_index > gs.mutation_index
            )
            AND mutation_index = (
                SELECT MAX(mutation_index)
                FROM game_snapshots
                WHERE session_id = gs.session_id
                  AND game_over = false
            );`);

      const finalSnapShotForSession = latestStaleGameSnapshots.rows.map(
        (row: GameState) => ({
          ...row,
          mutation_index: row.mutation_index + 1,
          game_over: true,
        })
      );

      for (const finalShapshot of finalSnapShotForSession) {
        await pool.query(
          `
              INSERT INTO game_snapshots
                (session_id, mutation_index, room, turn, game_over, actor_state, global_state)
              VALUES
                ($1, $2, $3, $4, $5, $6, $7)
               
            `,
          [
            finalShapshot.session_id,
            finalShapshot.mutation_index,
            finalShapshot.room,
            finalShapshot.turn,
            finalShapshot.game_over,
            JSON.stringify(finalShapshot.actor_state),
            JSON.stringify(finalShapshot.global_state),
          ]
        );
      }

      return pool;
    } catch (error) {
      logAndThrowError(error);
      return pool;
    }
  };

  return E.tryPromise({
    try: () => endStaleSessions(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retryN(1));
};
