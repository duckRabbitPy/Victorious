import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import {
  addLivePlayerQuery,
  writeNewGameStateToDB,
} from "./models/gamestate/mutations";
import * as Schema from "@effect/schema/Schema";
import { Logger, pipe, LoggerLevel } from "effect";
import {
  ClientPayload,
  ClientPayloadStruct,
  safeParseCardName,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
  SupportedEffects,
} from "../../shared/common";
import {
  parseClientMessage,
  parseJSONToClientMsg,
  safeParseJWT,
  sendErrorMsgToClient,
  tapPipeLine,
  verifyJwt,
} from "./utils";
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
import {
  deduceVictoryPoints,
  determineIfGameIsOver,
} from "./controllers/transformers/victory";
import { wsApplication } from "@wll8/express-ws/dist/src/type";
import { Connection, ConnectionLive } from "./db/connection";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "./models/gamestate/queries";

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
      const processMessage = Connection.pipe(
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
        Connection,
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

const handleMessage = ({
  msg,
  ws,
  roomConnections,
  pool,
}: {
  msg: ClientPayload;
  ws: WebSocket;
  roomConnections: RoomConnections;
  pool: Pool;
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

  const currentGameState = pipe(
    getLatestGameSnapshotQuery(room, pool),
    Effect.flatMap(safeParseGameState)
  );

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

  // todo: validate that next effect permitted given current game state, e.g pass mutation index from frontend and compare to mutation index in db

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
          getLatestChatLogQuery(currentGameState.session_id, pool)
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
            pool,
          })
        ),
        Effect.flatMap(safeParseGameState),
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
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
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
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
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
        Effect.flatMap(determineIfGameIsOver),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
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
        Effect.flatMap(determineIfGameIsOver),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
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
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
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
        Effect.flatMap(determineIfGameIsOver),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
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
            pool,
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
