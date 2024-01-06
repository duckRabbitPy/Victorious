import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import {
  addLivePlayerQuery,
  writeNewGameStateToDB,
} from "../models/gamestate/mutations";

import { pipe } from "effect";
import {
  ClientPayload,
  safeParseCardName,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
  SupportedEffects,
} from "../../../shared/common";
import { safeParseJWT, verifyJwt } from "../utils";
import {
  cleanUp,
  dealToAllActors,
  playTreasure,
  resetPlayedTreasures,
} from "./inMemoryMutation/hand";

import { buyCard, resetBuysAndActions } from "./inMemoryMutation/buys";
import { incrementTurn } from "./inMemoryMutation/turn";
import { playAction } from "./inMemoryMutation/actions";
import { updateChatLogQuery } from "../models/chatlog/mutations";
import { getLatestChatLogQuery } from "../models/chatlog/queries";
import { broadcastToRoom } from "./broadcast";
import {
  deduceVictoryPoints,
  determineIfGameIsOver,
} from "./inMemoryMutation/victory";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import { RoomConnections } from "./createWebsocketServer";

export const handleMessage = ({
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
