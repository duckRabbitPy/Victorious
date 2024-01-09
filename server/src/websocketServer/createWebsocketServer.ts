import WebSocket from "ws";
import { Logger, pipe, LogLevel, Effect } from "effect";
import {
  getUserInfoFromJWT,
  parseClientMessage,
  parseJSONToClientMsg,
  safeParseJWT,
  sendErrorMsgToClient,
  tapPipeLine,
  userNotInConnectionList,
  verifyJwt,
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
      const clientMsg = parseClientMessage(JSON.parse(msg as string))
        .pipe(Effect.orElseSucceed(() => undefined))
        .pipe(Effect.runSync);

      const room = Number(clientMsg?.room);
      const userInfoOrError = getUserInfoFromJWT(clientMsg?.authToken);

      if (
        clientMsg?.authToken &&
        userNotInConnectionList(room, clientMsg?.authToken, roomConnections)
      ) {
        roomConnections.push({
          socket: ws,
          room,
          uniqueUserAuthToken: clientMsg.authToken,
        });
      }

      const processMessage = DBConnection.pipe(
        Effect.flatMap((connection) => connection.pool),
        Effect.flatMap((pool) =>
          pipe(
            Effect.all({
              msg: parseJSONToClientMsg(msg),
              userInfo: userInfoOrError,
              pool: Effect.succeed(pool),
            }),
            Effect.flatMap(({ pool, userInfo, msg }) => {
              // handle chat related messages
              if (msg.effect === SupportedEffects.sendChatMessage) {
                return pipe(
                  handleChatMessage({
                    msg,
                    userInfo,
                    pool,
                  }),
                  Effect.flatMap((chatLog) =>
                    broadcastToRoom("chatLog", chatLog, room, roomConnections)
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
                Effect.flatMap((gameState) =>
                  broadcastToRoom("gameState", gameState, room, roomConnections)
                )
              );
            })
          )
        ),
        tapPipeLine,
        Effect.catchAll((error) =>
          sendErrorMsgToClient(error, clientMsg, roomConnections)
        ),
        Logger.withMinimumLogLevel(LogLevel.Error)
      );

      const runnable = Effect.provideService(
        processMessage,
        DBConnection,
        DBConnectionLive
      );

      Effect.runPromise(runnable);
    });

    ws.on("close", () => {
      console.log(
        `Client disconnected. Total connections: ${roomConnections.length}`
      );
    });
  });

  console.log("Websocket server created");
}
