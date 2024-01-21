import { Effect as E } from "effect";
import { PostgresError } from "../../customErrors";
import { logAndThrowError } from "../../utils";
import { Pool } from "pg";

// @query
export const getLatestGameSnapshotQuery = (room: number, pool: Pool) => {
  // there is an assumption here that all past game sessions with same room number have been succesfully closed by endStaleGameSessions
  const get = async () => {
    try {
      const result = await pool.query(
        `SELECT *
         FROM game_snapshots gs1
         WHERE room = $1
             AND gs1.session_id NOT IN (
                  SELECT session_id
                  FROM inactive_sessions
              )
         ORDER BY gs1.mutation_index DESC
         LIMIT 1;`,
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
        `SELECT gs.room FROM game_snapshots gs WHERE
          gs.session_id NOT IN (
            SELECT session_id FROM inactive_sessions
          )
          AND gs.turn = 0
          GROUP BY gs.room;`
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
