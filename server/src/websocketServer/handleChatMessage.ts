import { pipe, Effect as E } from "effect";

import {
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
import { CustomClientPayloadParseError } from "../customErrors";
import dotenv from "dotenv";
import { broadcastToRoom } from "./broadcast";

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
}: HandleChatMessageProps) => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    E.flatMap(safeParseGameState)
  );

  const chatMessage = pipe(
    safeParseNonEmptyString(msg.chatMessage),
    E.orElseFail(
      () =>
        new CustomClientPayloadParseError({
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

export function getCurrentChatLogAndBroadcast({
  msg,
  pool,
  roomConnections,
}: {
  msg: ClientPayload;
  pool: Pool;
  roomConnections: RoomConnections;
}) {
  return pipe(
    getCurrentChatLog({
      msg,
      pool,
    }),
    E.flatMap((chatLog) =>
      broadcastToRoom({
        broadcastType: "chatLog",
        payload: chatLog,
        room: msg.room,
        roomConnections,
      })
    ),
    E.flatMap(() => E.succeed("chat log sent successfully"))
  );
}

export function handleChatMessageAndBroadcast({
  msg,
  userInfo,
  pool,
  roomConnections,
}: {
  msg: ClientPayload;
  userInfo: UserInfo;
  pool: Pool;
  roomConnections: RoomConnections;
}) {
  return pipe(
    handleChatMessage({
      msg,
      userInfo,
      pool,
    }),
    E.flatMap((chatLog) =>
      broadcastToRoom({
        broadcastType: "chatLog",
        payload: chatLog,
        room: msg.room,
        roomConnections,
      })
    ),
    E.flatMap(() => E.succeed("chat message sent successfully"))
  );
}
