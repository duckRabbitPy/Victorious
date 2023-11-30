import * as Effect from "@effect/io/Effect";
import { PostgresError } from "../controllers/customErrors";
import { pool } from "../db/connection";
import { logAndThrowError } from "../utils";

export const getHashedPasswordByUsernameQuery = (username: string) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT password FROM users WHERE username = $1",
        [username]
      );

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

export const getUserIdByUsernameQuery = (username: string) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username]
      );

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
