import { logAndThrowError } from "../../utils";
import * as Effect from "@effect/io/Effect";
import { pool } from "../../db/connection";

export const getLatestChatLogQuery = (gameId: number) => {
  const getLatestChatLog = async (gameId: number) => {
    try {
      const result = await pool.query(
        `
        SELECT username, message
        FROM chat_log
        WHERE game_id = $1
        ORDER BY created_at ASC;
        `,
        [gameId]
      );
      return result.rows;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => getLatestChatLog(gameId),
    catch: (e) => new Error(`error getting latest chat log: ${e}`),
  }).pipe(Effect.retryN(1));
};
