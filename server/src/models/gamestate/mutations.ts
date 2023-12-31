import * as Effect from "@effect/io/Effect";
import { pipe } from "effect";

import { pool } from "../../db/connection";
import { PostgresError } from "../../controllers/customErrors";
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

import { getLatestGameSnapshotQuery } from "./queries";

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

const generatateGlobalState = () => {
  const startingState: GlobalState = {
    supply: {
      copper: 2,
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
    playerUserIds: [],
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
  username,
  currentGameState,
}: {
  userId: string;
  username: string;
  currentGameState: GameState;
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

      if (global_state.playerUserIds?.includes(userId)) {
        // no change in state if player already in game
        const currState = await Effect.runPromise(
          getLatestGameSnapshotQuery(room)
        );
        return currState;
      }

      const newGlobalState = JSON.stringify({
        ...global_state,
        playerUserIds: [...global_state.playerUserIds, userId],
      });

      const newActorState = setUpActorsForGame({
        currentActorStateArray: actor_state,
        newUserId: userId,
        newUserName: username,
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
          newGlobalState,
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

  return Effect.tryPromise({
    try: () => add(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};

// @mutation
export const updateGameState = (newGameState: GameState) => {
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

  return Effect.tryPromise({
    try: () => update(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};

export const writeNewGameStateToDB = (maybeValidGameState: unknown) =>
  pipe(
    safeParseGameState(maybeValidGameState),
    Effect.flatMap(updateGameState),
    Effect.flatMap(safeParseGameState)
  );
