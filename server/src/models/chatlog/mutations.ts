import * as Effect from "@effect/io/Effect";
import { pool } from "../../db/connection";

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
      await pool.query(
        `INSERT INTO chat_log WHERE game_id = $1 VALUES ($1, $2, $3, $4)`,
        [gameId, userInfo.userId, userInfo.username, chatMessage]
      );
    } catch (e) {}
  };

  return Effect.try({
    try: () => updateChatLog(userInfo, chatMessage),
    catch: (e) => new Error(`error updating chat log: ${e}`),
  });
};
