import { pipe, Effect as E } from "effect";

import {
  ChatMessage,
  ClientPayload,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
} from "../../../shared/common";
import {
  getLatestChatLogQuery,
  updateChatLogQuery,
} from "../models/chatlog/mutations";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import { RoomConnections, UserInfo } from "./createWebsocketServer";
import { ParseError } from "@effect/schema/ParseResult";
import {
  CustomParseError,
  ExternalServiceError,
  PostgresError,
} from "../customErrors";
import dotenv from "dotenv";
import { broadcastToRoom } from "./broadcast";
import { OpenAIError } from "openai/error";
import { cons } from "effect/List";
import { b } from "vitest/dist/suite-WwpgKT7k";
import { OpenAIStub } from "./bots/openAI";

dotenv.config();

type HandleChatMessageProps = {
  msg: ClientPayload;
  userInfo: UserInfo;
  pool: Pool;
};

type GetCurrentChatLogProps = {
  msg: ClientPayload;
  pool: Pool;
};

export const getCurrentChatLog = ({ msg, pool }: GetCurrentChatLogProps) => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    E.flatMap(safeParseGameState)
  );

  return pipe(
    E.all({
      currentGameState,
    }),
    E.flatMap(({ currentGameState }) =>
      getLatestChatLogQuery({
        sessionId: currentGameState.session_id,
        pool,
      })
    ),
    E.flatMap(safeParseChatLog)
  );
};

export const handleChatMessage = ({
  msg,
  userInfo,
  pool,
}: HandleChatMessageProps): E.Effect<
  never,
  PostgresError | ParseError | Error | CustomParseError,
  readonly ChatMessage[]
> => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    E.flatMap(safeParseGameState)
  );

  const chatMessage = pipe(
    safeParseNonEmptyString(msg.chatMessage),
    E.orElseFail(
      () =>
        new CustomParseError({
          message: "Chat message must be a non-empty string",
        })
    )
  );

  return pipe(
    E.all({
      chatMessage,
      currentGameState,
    }),
    E.flatMap(({ chatMessage, currentGameState }) =>
      updateChatLogQuery({
        sessionId: currentGameState.session_id,
        userInfo,
        chatMessage,
        pool,
      })
    ),
    E.flatMap(safeParseChatLog)
  );
};
