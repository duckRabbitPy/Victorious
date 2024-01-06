import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";

import { Logger, pipe, LoggerLevel } from "effect";
import {
  parseClientMessage,
  parseJSONToClientMsg,
  safeParseJWT,
  sendErrorMsgToClient,
  tapPipeLine,
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
  // mutable state
  const roomConnections: RoomConnections = [];

  // websocket
  app.ws("/", function (ws, req) {
    ws.on("message", function message(msg: unknown) {
      // todo error handle if json parse fails
      const clientMsg = parseClientMessage(JSON.parse(msg as string)).pipe(
        Effect.runSync
      );
      const room = Number(clientMsg.room);
      const authToken = clientMsg.authToken;
      const decodedJwt = verifyJwt(authToken, process.env.JWT_SECRET_KEY);

      const userInfoOrError = pipe(
        decodedJwt,
        Effect.flatMap((decoded) => safeParseJWT(decoded)),
        Effect.flatMap((decoded) =>
          Effect.succeed({
            userId: decoded.userId,
            username: decoded.username,
          })
        )
      );

      if (
        !roomConnections.some((connection) => {
          connection.room === room &&
            connection.uniqueUserAuthToken === authToken;
        })
      ) {
        roomConnections.push({
          socket: ws,
          room,
          uniqueUserAuthToken: authToken,
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
        Effect.catchAll((error) => {
          const msgOrUndefined = pipe(
            parseClientMessage(JSON.parse(msg as string)),
            Effect.orElseSucceed(() => undefined),
            Effect.runSync
          );
          return sendErrorMsgToClient(error, msgOrUndefined, roomConnections);
        }),
        Logger.withMinimumLogLevel(LoggerLevel.Error)
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
