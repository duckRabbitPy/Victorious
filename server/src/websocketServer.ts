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
  ChatMessage,
  ClientPayload,
  ClientPayloadStruct,
  GameState,
  safeParseCardName,
  SupportedEffects,
} from "../../shared/common";
import {
  safeParseChatLog,
  safeParseGameState,
  safeParseJWT,
  safeParseNonEmptyString,
  tapPipeLine,
  verifyJwt,
} from "./utils";
import { getLatestLiveGameSnapshot } from "./controllers/game-session/requestHandlers";
import {
  cleanUp,
  dealToAllActors,
  playTreasure,
  resetPlayedTreasures,
} from "./controllers/transformers/hand";

import { buyCard, resetBuysAndActions } from "./controllers/transformers/buys";
import { incrementTurn } from "./controllers/transformers/turn";
import { playAction } from "./controllers/transformers/actions";
import { updateChatLogQuery } from "./models/chatlog/mutations";
import { getLatestChatLogQuery } from "./models/chatlog/queries";

const parseClientMessage = Schema.parse(ClientPayloadStruct);

type RoomConnections = {
  socket: WebSocket;
  room: number;
  userId: string;
}[];

type BroadCastType = "gameState" | "chatLog";

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
    const cardName = pipe(safeParseCardName(msg.cardName));
    const toDiscardFromHand = msg.toDiscardFromHand;

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

        connection.socket.send(
          JSON.stringify({
            broadcastType: "gameState",
            gameState,
          })
        );

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

    const broadCastChatLog = (chatLog: readonly ChatMessage[]) => {
      roomConnections.forEach((connection) => {
        if (connection.room !== room) return;
        console.log("broadcasting", chatLog);
        connection.socket.send(
          JSON.stringify({
            broadcastType: "chatLog",
            chatLog,
          })
        );

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
      case SupportedEffects.getCurrentGameState: {
        pipe(
          userDetailsOrError,
          Effect.flatMap(() => getLatestLiveGameSnapshot({ room })),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }
      // mutation operations
      case SupportedEffects.addLivePlayer: {
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

      case SupportedEffects.startGame: {
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

      case SupportedEffects.incrementTurn: {
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

      case SupportedEffects.buyCard: {
        pipe(
          Effect.all({
            userInfo: userDetailsOrError,
            currentGameState,
            cardName,
          }),
          Effect.flatMap(({ userInfo, currentGameState, cardName }) =>
            buyCard({
              gameState: currentGameState,
              userId: userInfo.userId,
              cardName,
              toDiscardFromHand,
            })
          ),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case SupportedEffects.playTreasure: {
        pipe(
          Effect.all({
            userInfo: userDetailsOrError,
            currentGameState,
            cardName,
          }),
          Effect.flatMap(({ userInfo, currentGameState, cardName }) =>
            playTreasure({
              gameState: currentGameState,
              userId: userInfo.userId,
              cardName,
            })
          ),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case SupportedEffects.resetPlayedTreasures: {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ currentGameState }) =>
            resetPlayedTreasures(currentGameState)
          ),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case SupportedEffects.playAction: {
        pipe(
          Effect.all({
            userInfo: userDetailsOrError,
            currentGameState,
            cardName,
          }),
          Effect.flatMap(({ userInfo, currentGameState, cardName }) =>
            playAction({
              gameState: currentGameState,
              userId: userInfo.userId,
              cardName,
              toDiscardFromHand,
            })
          ),
          Effect.flatMap(safeParseGameState),
          Effect.flatMap(updateGameState),
          Effect.flatMap(broadcastToRoom),
          Effect.runPromise
        );
        break;
      }

      case SupportedEffects.getCurrentChatLog: {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ currentGameState }) =>
            getLatestChatLogQuery(currentGameState.session_id)
          ),
          Effect.flatMap(safeParseChatLog),
          Effect.flatMap(broadCastChatLog),
          Effect.runPromise
        );
        break;
      }

      case SupportedEffects.sendChatMessage: {
        const chatMessage = safeParseNonEmptyString(msg.chatMessage);
        pipe(
          Effect.all({
            userInfo: userDetailsOrError,
            chatMessage,
            currentGameState,
          }),
          Effect.flatMap(({ userInfo, chatMessage, currentGameState }) =>
            updateChatLogQuery({
              sessionId: currentGameState.session_id,
              userInfo,
              chatMessage,
            })
          ),
          Effect.flatMap(safeParseChatLog),
          Effect.flatMap(broadCastChatLog),
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
