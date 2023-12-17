// @query
export const getLatestGameSnapshotQuery = (room: number) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT * FROM game_snapshots WHERE room = $1 AND game_over = false ORDER BY mutation_index DESC LIMIT 1;",
        [room]
      );
      console.log(result.rows[0]);
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

import * as Effect from "@effect/io/Effect";
import { pool } from "../../db/connection";
import { PostgresError } from "../../controllers/customErrors";
import { logAndThrowError } from "../../utils";

// @query
export const getOpenGameSessionsQuery = () => {
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

  return Effect.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(Effect.retryN(1));
};
