import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import {
  addLivePlayerQuery,
  updateGameState,
} from "./models/gamestate/mutations";
import * as Schema from "@effect/schema/Schema";
import { pipe } from "effect";
import { JSONParseError } from "./controllers/customErrors";
import {
  ClientPayload,
  ClientPayloadStruct,
  GameState,
} from "../../shared/common";
import { safeParseGameState, safeParseJWT, verifyJwt } from "./utils";
import { getLatestLiveGameSnapshot } from "./controllers/game-session/requestHandlers";
import { cleanUp, dealToAllActors } from "./controllers/transformers/hand";
import {
  buyCard as buyCard,
  resetBuysAndActions,
} from "./controllers/transformers/buysAndActions";
import { incrementTurn } from "./controllers/transformers/turn";

const parseClientMessage = Schema.parse(ClientPayloadStruct);

type RoomConnections = {
  socket: WebSocket;
  room: number;
  userId: string;
}[];

export function createWebsocketServer(port: number): void {
  const roomConnections: RoomConnections = [];

  const wss = new WebSocket.Server({ port });

  const handleMessage = (msg: ClientPayload, ws: WebSocket) => {
    const room = Number(msg.room);
    const authToken = msg.authToken;
    const decodedJwt = verifyJwt(authToken, process.env.JWT_SECRET_KEY);

    const userDetailsOrError = pipe(
      decodedJwt,
      Effect.flatMap((decoded) => safeParseJWT(decoded)),
      Effect.flatMap((decoded) =>
        Effect.succeed({
          userId: decoded.userId,
          username: decoded.username,
        })
      )
    );

    const currentGameState = getLatestLiveGameSnapshot({ room });

    if (
      !roomConnections.some((connection) => {
        // todo use userid instead of auth token
        connection.room === room && connection.userId === authToken;
      })
    ) {
      roomConnections.push({
        socket: ws,
        room,
        userId: authToken,
      });
    }

    const broadcastToRoom = (gameState: GameState) => {
      roomConnections.forEach((connection) => {
        if (connection.room !== room) return;

        connection.socket.send(JSON.stringify(gameState));

        connection.socket.onerror = (error) => {
          console.error(`WebSocket error in room ${connection.room}:`, error);
        };

        connection.socket.onclose = (event) => {
          console.log(
            `WebSocket connection closed in room ${connection.room}:`,
            event.reason
          );
        };
      });

      return Effect.unit;
    };

    switch (msg.effect) {
      // read only operation
      case "getCurrentGameState": {
        pipe(
          userDetailsOrError,
          Effect.flatMap(() => getLatestLiveGameSnapshot({ room })),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }
      // mutation operations
      case "addLivePlayer": {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ userInfo, currentGameState }) =>
            addLivePlayerQuery({
              userId: userInfo.userId,
              username: userInfo.username,
              currentGameState,
            })
          ),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case "startGame": {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ currentGameState }) =>
            dealToAllActors(currentGameState)
          ),
          Effect.flatMap(resetBuysAndActions),
          Effect.flatMap(incrementTurn),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case "incrementTurn": {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ currentGameState }) => cleanUp(currentGameState)),
          Effect.flatMap(incrementTurn),
          Effect.flatMap(resetBuysAndActions),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case "buyCard": {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ userInfo, currentGameState }) =>
            buyCard({
              gameState: currentGameState,
              userId: userInfo.userId,
              cardName: msg.cardName,
            })
          ),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }
    }
    return Effect.unit;
  };

  wss.on("connection", function connection(ws: WebSocket) {
    ws.on("message", function message(msg: unknown) {
      pipe(
        Effect.try({
          try: () => JSON.parse(msg as string),
          catch: (e) =>
            new JSONParseError({
              message: `error parsing client message: ${e}`,
            }),
        }),
        Effect.flatMap((msg) => parseClientMessage(msg)),
        Effect.flatMap((msg) => handleMessage(msg, ws)),
        Effect.runSync
      );
    });
  });
}
