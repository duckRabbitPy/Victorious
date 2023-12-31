import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import {
  addLivePlayerQuery,
  writeNewGameStateToDB,
} from "./models/gamestate/mutations";
import * as Schema from "@effect/schema/Schema";
import { pipe } from "effect";
import { JSONParseError } from "./controllers/customErrors";
import {
  ClientPayload,
  ClientPayloadStruct,
  safeParseCardName,
  safeParseChatLog,
  safeParseNonEmptyString,
  SupportedEffects,
} from "../../shared/common";
import {
  safeParseJWT,
  sendErrorMsgToClient,
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
import { broadcastToRoom } from "./broadcast";
import { deduceVictoryPoints } from "./controllers/transformers/victory";
import { wsApplication } from "@wll8/express-ws/dist/src/type";
import { success } from "@effect/schema/ParseResult";

const parseClientMessage = Schema.parse(ClientPayloadStruct);

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
      pipe(
        Effect.try({
          try: () => JSON.parse(msg as string),
          catch: (e) =>
            new JSONParseError({
              message: `error parsing client message: ${e}`,
            }),
        }),
        Effect.flatMap((msg) => parseClientMessage(msg)),
        Effect.flatMap((msg) =>
          handleMessage({
            msg,
            ws,
            roomConnections,
          })
        ),
        Effect.catchAll((error) => {
          const roomOrUndefined = pipe(
            parseClientMessage(JSON.parse(msg as string)),
            Effect.map((msg) => msg.room),
            Effect.orElseSucceed(() => undefined),
            Effect.runSync
          );

          console.log("Error in websocket handler:", error);
          console.log(JSON.stringify(error, null, 2));
          console.log("\n");
          return sendErrorMsgToClient(error, roomOrUndefined, roomConnections);
        }),
        Effect.runPromise
      );
    });

    ws.on("close", () => {
      console.log(
        `Client disconnected. Total connections: ${roomConnections.length}`
      );
    });
  });

  console.log("Websocket server created");
}

const handleMessage = ({
  msg,
  ws,
  roomConnections,
}: {
  msg: ClientPayload;
  ws: WebSocket;
  roomConnections: RoomConnections;
}) => {
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
    // only push to roomConnections if currently authed user in room is not already in roomConnections
    !roomConnections.some((connection) => {
      connection.room === room && connection.uniqueUserAuthToken === authToken;
    })
  ) {
    roomConnections.push({
      socket: ws,
      room,
      uniqueUserAuthToken: authToken,
    });
  }

  switch (msg.effect) {
    // read only operations
    case SupportedEffects.getCurrentGameState: {
      return pipe(
        currentGameState,
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.getCurrentChatLog: {
      return pipe(
        Effect.all({ userInfo: userDetailsOrError, currentGameState }),
        Effect.flatMap(({ currentGameState }) =>
          getLatestChatLogQuery(currentGameState.session_id)
        ),
        Effect.flatMap(safeParseChatLog),
        Effect.flatMap((chatLog) =>
          broadcastToRoom("chatLog", chatLog, room, roomConnections)
        )
      );
    }

    // mutation operations
    case SupportedEffects.addLivePlayer: {
      return pipe(
        Effect.all({ userInfo: userDetailsOrError, currentGameState }),
        Effect.flatMap(({ userInfo, currentGameState }) =>
          addLivePlayerQuery({
            userId: userInfo.userId,
            username: userInfo.username,
            currentGameState,
          })
        ),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.startGame: {
      return pipe(
        Effect.all({ userInfo: userDetailsOrError, currentGameState }),
        Effect.flatMap(({ currentGameState }) =>
          dealToAllActors(currentGameState)
        ),
        Effect.flatMap(resetBuysAndActions),
        Effect.flatMap(incrementTurn),
        Effect.flatMap(writeNewGameStateToDB),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.incrementTurn: {
      return pipe(
        Effect.all({ userInfo: userDetailsOrError, currentGameState }),
        Effect.flatMap(({ currentGameState }) => cleanUp(currentGameState)),
        Effect.flatMap(incrementTurn),
        Effect.flatMap(resetBuysAndActions),
        Effect.flatMap(writeNewGameStateToDB),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.buyCard: {
      return pipe(
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
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(writeNewGameStateToDB),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.playTreasure: {
      return pipe(
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
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(writeNewGameStateToDB),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.resetPlayedTreasures: {
      return pipe(
        Effect.all({ userInfo: userDetailsOrError, currentGameState }),
        Effect.flatMap(({ currentGameState }) =>
          resetPlayedTreasures(currentGameState)
        ),
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(writeNewGameStateToDB),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.playAction: {
      return pipe(
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
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(writeNewGameStateToDB),
        Effect.flatMap((gameState) =>
          broadcastToRoom("gameState", gameState, room, roomConnections)
        )
      );
    }

    case SupportedEffects.sendChatMessage: {
      const chatMessage = safeParseNonEmptyString(msg.chatMessage);
      return pipe(
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
        Effect.flatMap((chatLog) =>
          broadcastToRoom("chatLog", chatLog, room, roomConnections)
        )
      );
    }

    default: {
      return Effect.succeed({ success: false });
    }
  }
};
