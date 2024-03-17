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
  }).pipe(
    E.retry({
      times: 1,
    })
  );
};

// @query
export const getOpenGameSessionsQuery = (pool: Pool) => {
  const get = async () => {
    try {
      // select from active sessions where max turn is 0 to select games that have'nt started yet
      const result = await pool.query(
        `WITH MaxTurns AS (
          SELECT session_id, MAX(turn) AS max_turn
          FROM game_snapshots
          GROUP BY session_id
      )
      
      SELECT gs.room
      FROM game_snapshots gs
      JOIN MaxTurns mt ON gs.session_id = mt.session_id

      WHERE gs.session_id NOT IN (
              SELECT session_id 
              FROM inactive_sessions
            )
            AND gs.turn <= 0
            AND gs.turn = mt.max_turn;`
      );

      return result.rows.map((row) => row.room);
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retry({ times: 1 }));
};
