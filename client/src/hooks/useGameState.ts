import { useState, useEffect } from "react";
import {
  ChatMessage,
  GameState,
  safeParseBroadCast,
  safeParseChatLog,
  safeParseGameState,
  safeParseNonEmptyString,
} from "../../../shared/common";
import { Effect as E, pipe } from "effect";
import { getInitialGameState, getInititalChatLog } from "../effects/effects";
import { WEB_SOCKET_URL } from "../constants";

const updateStateElseError = <T>({
  dataOrError,
  updateState,
  errorMessage,
  setErrorMessage,
}: {
  dataOrError: E.Effect<never, unknown, T>;
  updateState: React.Dispatch<React.SetStateAction<T | null>>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) =>
  pipe(
    dataOrError,
    E.mapBoth({
      onFailure: () => {
        setErrorMessage(errorMessage);
        return E.unit;
      },
      onSuccess: (newState) => {
        updateState(newState);
        return E.unit;
      },
    }),
    E.runSync
  );

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialGameStateFetched, setInitialGameStateFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<readonly ChatMessage[] | null>([]);
  const [initialChatLogFetched, setInitialChatLogFetched] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket(WEB_SOCKET_URL);
    console.log(
      `Using websocket url ${WEB_SOCKET_URL}`,
      `env ${import.meta.env.MODE}`
    );

    newSocket.addEventListener("message", (event) => {
      const eventData = safeParseBroadCast(JSON.parse(event.data)).pipe(
        E.runSync
      );
      console.log("Received message from server:", eventData);

      switch (eventData.broadcastType) {
        case "gameState": {
          updateStateElseError({
            dataOrError: safeParseGameState(eventData.gameState),
            updateState: setGameState,
            errorMessage: "Failed to parse game state from server",
            setErrorMessage,
          });
          break;
        }
        case "chatLog": {
          updateStateElseError({
            dataOrError: safeParseChatLog(eventData.chatLog),
            updateState: setChatLog,
            errorMessage: "Failed to parse chat log from server",
            setErrorMessage,
          });
          break;
        }

        case "error": {
          updateStateElseError({
            dataOrError: safeParseNonEmptyString(eventData.error),
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
