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
import {
  getCurrentChatLogAndBroadcast,
  handleChatMessageAndBroadcast,
} from "./handleChatMessage";
import { handleGameMessageAndBroadcast } from "./handleGameMessage";
import { getSendBotMessagesRunnable } from "./bots/sendBotMessage";
import { RuntimeError } from "../customErrors";

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

  app.ws("/", (ws, _req) => {
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
              switch (msg.effect) {
                case SupportedEffects.getCurrentChatLog:
                  return getCurrentChatLogAndBroadcast({
                    msg,
                    pool,
                    roomConnections,
                  });
                case SupportedEffects.sendChatMessage:
                  return handleChatMessageAndBroadcast({
                    msg,
                    userInfo,
                    pool,
                    roomConnections,
                  });
                default:
                  return handleGameMessageAndBroadcast({
                    msg,
                    userInfo,
                    pool,
                    roomConnections,
                  });
              }
            })
          )
        ),
        E.catchAll((error) =>
          sendErrorMsgToClient(error, clientMsg, roomConnections)
        ),
        E.catchAllDefect((defect) => {
          console.error("defect", defect);
          return sendErrorMsgToClient(
            new RuntimeError({
              message:
                "A serious server error occured, you may not be able to continue",
            }),
            clientMsg,
            roomConnections
          );
        }),
        Logger.withMinimumLogLevel(LogLevel.Error)
      );

      const processMessageRunnable = E.provide(
        processMessage,
        DBConnectionLive
      );

      const sendBotMessagesRunnable = getSendBotMessagesRunnable(
        clientMsg,
        roomConnections
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
