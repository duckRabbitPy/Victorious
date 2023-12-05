import * as Effect from "@effect/io/Effect";
import { pool } from "../../db/connection";
import { PostgresError } from "../../controllers/customErrors";
import {
  ActorState,
  CardCount,
  CardNames,
  GameState,
  GlobalState,
  Phases,
} from "../../../../shared/commonTypes";
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
  ];

  return JSON.stringify(newActorState);
};

const generatateGlobalState = () => {
  const startingState: GlobalState = {
    supply: {
      [CardNames.Copper]: 60,
      [CardNames.Silver]: 40,
      [CardNames.Gold]: 30,
      [CardNames.Estate]: 24,
      [CardNames.Duchy]: 12,
      [CardNames.Province]: 12,
      [CardNames.Curse]: 30,
      [CardNames.Village]: 10,
      [CardNames.Smithy]: 10,
      [CardNames.Market]: 10,
      [CardNames.CouncilRoom]: 10,
      [CardNames.Laboratory]: 10,
      [CardNames.Festival]: 10,
      [CardNames.Mine]: 10,
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
export const incrementTurnQuery = (currentGameState: GameState) => {
  const {
    room,
    turn,
    actor_state,
    global_state,
    game_over,
    mutation_index,
    session_id,
  } = currentGameState;
  const newTurn = turn + 1;
  const newMutationIndex = mutation_index + 1;

  const increment = async () => {
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
          newTurn,
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
    try: () => increment(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};
