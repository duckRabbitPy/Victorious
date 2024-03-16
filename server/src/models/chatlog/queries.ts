import { Pool } from "pg";
import { logAndThrowError } from "../../utils";
import { Effect as E } from "effect";

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

  return E.tryPromise({
    try: () => getLatestChatLog(sessionId),
    catch: (e) => new Error(`error getting latest chat log: ${e}`),
  }).pipe(E.retry({ times: 1 }));
};
