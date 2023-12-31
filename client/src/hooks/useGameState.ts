import { useState, useEffect } from "react";
import {
  ChatMessage,
  GameState,
  safeParseBroadCast,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
} from "../../../shared/common";
import { pipe } from "effect";
import { getInitialGameState, getInititalChatLog } from "../effects/effects";
import * as Effect from "@effect/io/Effect";

const updateStateElseError = <T>({
  effect,
  updateState,
  errorMessage,
  setErrorMessage,
}: {
  effect: Effect.Effect<never, unknown, T>;
  updateState: React.Dispatch<React.SetStateAction<T | null>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) =>
  pipe(
    effect,
    Effect.mapBoth({
      onFailure: () => {
        setErrorMessage(errorMessage);
        return Effect.unit;
      },
      onSuccess: (newState) => {
        updateState(newState);
        return Effect.unit;
      },
    }),
    Effect.runSync
  );

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialGameStateFetched, setInitialGameStateFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<readonly ChatMessage[] | null>([]);
  const [initialChatLogFetched, setInitialChatLogFetched] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket(
      process.env.NODE_EV === "production"
        ? "wss://dominion.onrender.com"
        : "ws://localhost:8080"
    );

    newSocket.addEventListener("message", (event) => {
      const eventData = safeParseBroadCast(JSON.parse(event.data)).pipe(
        Effect.runSync
      );

      switch (eventData.broadcastType) {
        case "gameState": {
          updateStateElseError({
            effect: safeParseGameState(eventData.gameState),
            updateState: setGameState,
            errorMessage: "Failed to parse game state from server",
            setErrorMessage,
          });
          break;
        }
        case "chatLog": {
          updateStateElseError({
            effect: safeParseChatLog(eventData.chatLog),
            updateState: setChatLog,
            errorMessage: "Failed to parse chat log from server",
            setErrorMessage,
          });
          break;
        }

        case "error": {
          updateStateElseError({
            effect: safeParseNonEmptyString(eventData.error),
            updateState: setErrorMessage,
            errorMessage: "Failed to parse error from server",
            setErrorMessage,
          });
          break;
        }
        default:
          break;
      }
    });

    newSocket.addEventListener("open", (event) => {
      console.log("WebSocket connection opened:", event);

      if (!initialGameStateFetched) {
        getInitialGameState({
          socket: newSocket,
          authToken: localStorage.getItem("dominion_auth_token"),
          roomNumber: Number(window.location.pathname.split("/").pop()),
        });
        setInitialGameStateFetched(true);
      }

      if (!initialChatLogFetched) {
        getInititalChatLog({
          socket: newSocket,
          authToken: localStorage.getItem("dominion_auth_token"),
          roomNumber: Number(window.location.pathname.split("/").pop()),
          setErrorMessage,
        });
        setInitialChatLogFetched(true);
      }
    });

    newSocket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    setSocket(newSocket);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameState, socket, errorMessage, chatLog, setErrorMessage };
};
