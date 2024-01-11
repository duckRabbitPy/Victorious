import { pipe, Effect } from "effect";

import {
  ChatMessage,
  ClientPayload,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
} from "../../../shared/common";
import { updateChatLogQuery } from "../models/chatlog/mutations";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import { UserInfo } from "./createWebsocketServer";
import { ParseError } from "@effect/schema/ParseResult";
import { PostgresError } from "../customErrors";

type handleChatMessageProps = {
  msg: ClientPayload;
  userInfo: UserInfo;
  pool: Pool;
};

type handleChatMessageResult = Effect.Effect<
  never,
  PostgresError | ParseError | Error,
  readonly ChatMessage[]
>;

export const handleChatMessage = ({
  msg,
  userInfo,
  pool,
}: handleChatMessageProps): handleChatMessageResult => {
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
