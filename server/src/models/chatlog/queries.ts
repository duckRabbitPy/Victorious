import { Pool } from "pg";
import { logAndThrowError } from "../../utils";
import { pipe, Effect } from "effect";

export const getLatestChatLogQuery = (sessionId: string, pool: Pool) => {
  const getLatestChatLog = async (sessionId: string) => {
    try {
      const result = await pool.query(
        `
        SELECT username, message
        FROM chat_log
        WHERE session_id = $1
        ORDER BY created_at ASC;
        `,
        [sessionId]
      );
      return result.rows;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => getLatestChatLog(sessionId),
    catch: (e) => new Error(`error getting latest chat log: ${e}`),
  }).pipe(Effect.retryN(1));
};
