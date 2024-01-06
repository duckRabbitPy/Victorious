import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";

import { Logger, pipe, LoggerLevel } from "effect";
import {
  parseClientMessage,
  parseJSONToClientMsg,
  sendErrorMsgToClient,
  tapPipeLine,
} from "../utils";

import { wsApplication } from "@wll8/express-ws/dist/src/type";
import { DBConnection, ConnectionLive } from "../db/connection";
import { handleMessage } from "./handleMessage";

export type RoomConnections = {
  socket: WebSocket;
  room: number;
  uniqueUserAuthToken: string;
}[];

export function createWebsocketServer(app: wsApplication): void {
  // mutable state
  const roomConnections: RoomConnections = [];

  // websocket
  app.ws("/", function (ws, req) {
    ws.on("message", function message(msg: unknown) {
      const processMessage = DBConnection.pipe(
        Effect.flatMap((connection) => connection.pool),
        Effect.flatMap((pool) =>
          Effect.all({
            pool: Effect.succeed(pool),
            msg: parseJSONToClientMsg(msg),
          })
        ),
        Effect.flatMap(({ msg, pool }) =>
          handleMessage({
            msg,
            ws,
            roomConnections,
            pool,
          })
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
        ConnectionLive
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
