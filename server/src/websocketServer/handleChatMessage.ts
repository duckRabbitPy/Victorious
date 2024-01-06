import * as Effect from "@effect/io/Effect";

import { pipe } from "effect";
import {
  ClientPayload,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
} from "../../../shared/common";
import { updateChatLogQuery } from "../models/chatlog/mutations";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import { UserInfo } from "./createWebsocketServer";

export const handleChatMessage = ({
  msg,
  userInfo,
  pool,
}: {
  msg: ClientPayload;
  userInfo: UserInfo;
  pool: Pool;
}) => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    Effect.flatMap(safeParseGameState)
  );

  const chatMessage = safeParseNonEmptyString(msg.chatMessage);
  return pipe(
    Effect.all({
      chatMessage,
      currentGameState,
    }),
    Effect.flatMap(({ chatMessage, currentGameState }) =>
      updateChatLogQuery({
        sessionId: currentGameState.session_id,
        userInfo,
        chatMessage,
        pool,
      })
    ),
    Effect.flatMap(safeParseChatLog)
  );
};
