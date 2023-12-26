import { useState, useEffect } from "react";
import { ChatMessage, GameState } from "../../../shared/common";
import { getInitialGameState, getInititalChatLog } from "../effects/effects";

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialGameStateFetched, setInitialGameStateFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<ChatMessage[] | null>([]);
  const [initialChatLogFetched, setInitialChatLogFetched] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("message", (event) => {
      if (JSON.parse(event.data).broadcastType === "gameState") {
        setGameState(JSON.parse(event.data).gameState);
      }

      if (JSON.parse(event.data).broadcastType === "chatLog") {
        setChatLog(JSON.parse(event.data).chatLog);
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
