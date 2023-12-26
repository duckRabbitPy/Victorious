import * as Effect from "@effect/io/Effect";
import { pool } from "../../db/connection";
import { logAndThrowError } from "../../utils";

export const updateChatLogQuery = ({
  gameId,
  userInfo,
  chatMessage,
}: {
  gameId: number;
  userInfo: { userId: string; username: string };
  chatMessage: string;
}) => {
  const updateChatLog = async (
    userInfo: { userId: string; username: string },
    chatMessage: string
  ) => {
    try {
      const insertQuery = `
      INSERT INTO chat_log (game_id, user_id, username, message)
      VALUES ($1, $2, $3, $4)
      RETURNING username, message;
    `;

      const selectQuery = `
      SELECT username, message
      FROM chat_log
      WHERE game_id = $1
      ORDER BY created_at ASC;
    `;

      const insertValues = [
        gameId,
        userInfo.userId,
        userInfo.username,
        chatMessage,
      ];

      await pool.query(insertQuery, insertValues);

      const result = await pool.query(selectQuery, [gameId]);

      return result.rows;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return Effect.tryPromise({
    try: () => updateChatLog(userInfo, chatMessage),
    catch: (e) => new Error(`error updating chat log: ${e}`),
  }).pipe(Effect.retryN(1));
};
