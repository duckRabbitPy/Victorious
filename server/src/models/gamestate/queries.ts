import { Effect as E } from "effect";
import { PostgresError } from "../../customErrors";
import { logAndThrowError } from "../../utils";
import { Pool } from "pg";

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
        "SELECT DISTINCT room FROM game_snapshots WHERE turn = 0 AND game_over = false;"
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
