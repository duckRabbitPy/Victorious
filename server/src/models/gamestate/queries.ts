import { Effect as E, Effect } from "effect";
import { PostgresError } from "../../customErrors";
import { logAndThrowError } from "../../utils";
import { Pool } from "pg";
import { GameState } from "../../../../shared/common";

// @query
export const getLatestGameSnapshotQuery = (room: number, pool: Pool) => {
  const get = async () => {
    try {
      // todo ensure is refering to correct game e.g. in a bad state with an old game
      const result = await pool.query(
        "SELECT * FROM game_snapshots WHERE room = $1 AND game_over = false ORDER BY mutation_index DESC LIMIT 1;",
        [room]
      );

      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retryN(1));
};

// @query
export const getOpenGameSessionsQuery = (pool: Pool) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT gs.room FROM game_snapshots gs WHERE NOT EXISTS (SELECT 1 FROM game_snapshots WHERE session_id = gs.session_id AND game_over = true);"
      );

      return result.rows.map((row) => row.room);
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retryN(1));
};

// @mutation

export const endStaleGameSessionsMutation = (pool: Pool) => {
  const endStaleSessions = async () => {
    try {
      const killAfterInactivityDuration = "5 seconds";
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
        );`);

      const terminatedGameSessions = latestStaleGameSnapshots.rows.map(
        (row: GameState) => ({
          ...row,
          mutation_index: row.mutation_index + 1,
          game_over: true,
        })
      );
      console.log(
        "ending sessions in rooms",
        terminatedGameSessions.map((s) => s.room)
      );

      for (const session of terminatedGameSessions) {
        await pool.query(
          `
            INSERT INTO game_snapshots
              (session_id, mutation_index, room, turn, game_over, actor_state, global_state)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7)
             
          `,
          [
            session.session_id,
            session.mutation_index,
            session.room,
            session.turn,
            session.game_over,
            JSON.stringify(session.actor_state),
            JSON.stringify(session.global_state),
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
