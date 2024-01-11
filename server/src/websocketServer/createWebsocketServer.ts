import WebSocket from "ws";
import { Logger, pipe, LogLevel, Effect as E, Effect } from "effect";
import {
  getUserInfoFromJWT,
  parseJSONToClientMsg,
  sendErrorMsgToClient,
  clientNotInConnectionList,
  getClientMessage,
  tapPipeLine,
} from "../utils";

import { wsApplication } from "@wll8/express-ws/dist/src/type";
import { DBConnection, DBConnectionLive } from "../db/connection";
import { SupportedEffects } from "../../../shared/common";
import { handleChatMessage } from "./handleChatMessage";
import { handleGameMessage } from "./handleGameMessage";
import { broadcastToRoom } from "./broadcast";

export type RoomConnections = {
  socket: WebSocket;
  room: number;
  uniqueUserAuthToken: string;
}[];

export type UserInfo = {
  userId: string;
  username: string;
};

export function createWebsocketServer(app: wsApplication): void {
  // !! mutable state
  let roomConnections: RoomConnections = [];

  app.ws("/", function (ws, req) {
    ws.on("message", function message(msg: unknown) {
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
                  E.flatMap(() =>
                    Effect.succeed("chat message sent successfully")
                  )
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
                E.flatMap(() =>
                  Effect.succeed("game message sent successfully")
                )
              );
            })
          )
        ),
        tapPipeLine,
        E.catchAll((error) =>
          sendErrorMsgToClient(error, clientMsg, roomConnections)
        ),
        Logger.withMinimumLogLevel(LogLevel.All)
      );

      const runnable = E.provideService(
        processMessage,
        DBConnection,
        DBConnectionLive
      );

      E.runPromise(runnable);
    });

    ws.on("close", () => {
      console.log(
        `Client disconnected. Total connections: ${roomConnections.length}`
      );

      roomConnections = roomConnections.filter((connection) => {
        return connection.socket !== ws;
      });
    });
  });

  console.log("Websocket server created");
}
