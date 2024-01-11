import { Effect as E } from "effect";
import { logAndThrowError } from "../../utils";
import { Pool } from "pg";
import { UserInfo } from "../../websocketServer/createWebsocketServer";

// @mutation
export const updateChatLogQuery = ({
  sessionId,
  userInfo,
  chatMessage,
  pool,
}: {
  sessionId: string;
  userInfo: UserInfo;
  chatMessage: string;
  pool: Pool;
}) => {
  const updateChatLog = async (
    userInfo: { userId: string; username: string },
    chatMessage: string
  ) => {
    try {
      const insertQuery = `
      INSERT INTO chat_log (session_id, user_id, username, message)
      VALUES ($1, $2, $3, $4)
      RETURNING username, message;
    `;
      const selectQuery = `
      SELECT username, message
      FROM chat_log
      WHERE session_id = $1
      ORDER BY created_at ASC;
    `;

      const insertValues = [
        sessionId,
        userInfo.userId,
        userInfo.username,
        chatMessage,
      ];

      await pool.query(insertQuery, insertValues);
      const result = await pool.query(selectQuery, [sessionId]);

      return result.rows;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => updateChatLog(userInfo, chatMessage),
    catch: (e) => new Error(`error updating chat log: ${e}`),
  }).pipe(E.retryN(1));
};
