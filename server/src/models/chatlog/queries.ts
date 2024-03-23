import { Pool } from "pg";
import { logAndThrowError } from "../../utils";
import { Effect as E } from "effect";

export const getLatestChatLogQuery = ({
  sessionId,
  pool,
}: {
  sessionId: string;
  pool: Pool;
}) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT username, message FROM chat_log WHERE session_id = $1 ORDER BY created_at ASC;",
        [sessionId]
      );

      return result.rows;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new Error("postgres query error"),
  }).pipe(E.retry({ times: 1 }));
};
