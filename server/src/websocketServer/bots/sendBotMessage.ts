import { pipe, Effect as E } from "effect";
import { OpenAIError } from "openai";
import {
  ClientPayload,
  safeParseGameState,
  botNamePrefixes,
} from "../../../../shared/common";
import { ExternalServiceError } from "../../customErrors";
import { getLatestGameSnapshotQuery } from "../../models/gamestate/queries";
import { broadcastToRoom } from "../broadcast";
import { RoomConnections } from "../createWebsocketServer";
import { handleChatMessage } from "../handleChatMessage";
import { sendMsgToAIService } from "./openAI";
import { Pool } from "pg";
import { DBConnection, DBConnectionLive } from "../../db/connection";
import { parseJSONToClientMsg } from "../../utils";

const sendBotMessage = (
  msg: ClientPayload,
  roomConnections: RoomConnections,
  pool: Pool
) => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    E.flatMap(safeParseGameState)
  );

  return pipe(
    E.all({
      botMsg: E.tryPromise({
        try: () => sendMsgToAIService(msg),
        catch: (e) => {
          return new ExternalServiceError({
            message: e instanceof OpenAIError ? e.message : "Openai error",
          });
        },
      }),
      currentGameState,
    }),
    E.flatMap(({ botMsg, currentGameState }) => {
      const botActorInfo = currentGameState.actor_state
        .filter((actor) =>
          botNamePrefixes.some((prefix) => actor.name.startsWith(prefix))
        )
        .map((actor) => {
          return {
            userId: actor.id,
            username: actor.name,
          };
        });

      const botUserInfo =
        botActorInfo[Math.floor(Math.random() * botActorInfo.length)];

      if (!botUserInfo) {
        return E.fail(new Error("no bot user info"));
      }

      if (!botMsg.content) {
        return E.fail(new Error("no bot message"));
      }

      return handleChatMessage({
        msg: { ...msg, chatMessage: botMsg.content },
        userInfo: botUserInfo,
        pool,
      });
    }),
    E.flatMap((chatLog) =>
      broadcastToRoom({
        broadcastType: "chatLog",
        payload: chatLog,
        room: msg.room,
        roomConnections,
      })
    )
  );
};

export function getSendBotMessagesRunnable(
  msg: ClientPayload | undefined,
  roomConnections: RoomConnections
) {
  const sendBotMessages = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) => {
      if (msg?.chatMessage) {
        return sendBotMessage(msg, roomConnections, pool);
      }
      return E.succeed(E.unit);
    }),

    E.catchAll((e) => {
      console.log(e);
      return E.succeed(E.unit);
    })
  );

  return E.provide(sendBotMessages, DBConnectionLive);
}
