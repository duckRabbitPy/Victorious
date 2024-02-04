import WebSocket from "ws";
import { Logger, pipe, LogLevel, Effect as E } from "effect";
import {
  getUserInfoFromJWT,
  parseJSONToClientMsg,
  sendErrorMsgToClient,
  clientNotInConnectionList,
  getClientMessage,
  delay,
} from "../utils";

import { wsApplication } from "@wll8/express-ws/dist/src/type";
import { DBConnection, DBConnectionLive } from "../db/connection";
import { SupportedEffects } from "../../../shared/common";
import { getCurrentChatLog, handleChatMessage } from "./handleChatMessage";
import { handleGameMessage } from "./handleGameMessage";
import { broadcastToRoom } from "./broadcast";
import { sendBotMessage } from "./bots/sendBotMessage";

export type RoomConnections = {
  socket: WebSocket;
  room: number;
  uniqueUserAuthToken: string;
}[];

export type UserInfo = {
  userId: string;
  username: string;
};

export function createWebsocketServer(app: wsApplication) {
  // !! mutable state
  let roomConnections: RoomConnections = [];

  app.ws("/", (ws, req) => {
    ws.on("message", (msg: unknown) => {
      const clientMsg = getClientMessage(msg);
      const clientNotInList = clientNotInConnectionList(
        clientMsg?.room,
        clientMsg?.authToken,
        roomConnections
      );

      if (clientNotInList && clientMsg?.authToken) {
        roomConnections.push({
          socket: ws,
          room: clientMsg.room,
          uniqueUserAuthToken: clientMsg.authToken,
        });
      }

      const processMessage = DBConnection.pipe(
        E.flatMap((connection) => connection.pool),
        E.flatMap((pool) =>
          pipe(
            E.all({
              msg: parseJSONToClientMsg(msg),
              userInfo: getUserInfoFromJWT(clientMsg?.authToken),
              pool: E.succeed(pool),
            }),
            E.flatMap(({ pool, userInfo, msg }) => {
              // handle chat related messages
              if (msg.effect === SupportedEffects.getCurrentChatLog) {
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
              if (msg.effect === SupportedEffects.sendChatMessage) {
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

              // handle game related messages
              return pipe(
                handleGameMessage({
                  msg,
                  userInfo,
                  pool,
                }),
                E.flatMap((gameState) => {
                  return broadcastToRoom({
                    broadcastType: "gameState",
                    payload: gameState,
                    room: msg.room,
                    roomConnections,
                  });
                }),
                E.flatMap(() => E.succeed("game message sent successfully"))
              );
            })
          )
        ),
        // todo: differentiate between errors that should be sent to client and errors that should be only be logged
        E.catchAll((error) =>
          sendErrorMsgToClient(error, clientMsg, roomConnections)
        ),
        Logger.withMinimumLogLevel(LogLevel.All)
      );

      const processMessageRunnable = E.provideService(
        processMessage,
        DBConnection,
        DBConnectionLive
      );

      const sendBotMessages = DBConnection.pipe(
        E.flatMap((connection) => connection.pool),
        E.flatMap((pool) =>
          pipe(
            E.all({
              msg: parseJSONToClientMsg(msg),
              pool: E.succeed(pool),
            }),
            E.flatMap(({ pool, msg }) => {
              if (msg.chatMessage) {
                return sendBotMessage(msg, roomConnections, pool);
              }
              return E.succeed(E.unit);
            }),
            E.catchAll((e) => {
              console.log(e);
              return E.succeed(E.unit);
            })
          )
        )
      );

      const sendBotMessagesRunnable = E.provideService(
        sendBotMessages,
        DBConnection,
        DBConnectionLive
      );

      E.runPromise(processMessageRunnable)
        .then(() => E.runPromise(delay))
        .then(() => E.runPromise(sendBotMessagesRunnable));
    });

    ws.on("close", () => {
      console.log(
        `Client disconnected. Total connections: ${roomConnections.length}`
      );
      // clean up roomConnections
      roomConnections = roomConnections.filter((connection) => {
        return connection.socket !== ws;
      });
    });
  });

  console.log("Websocket server created");
}
