import { useState, useEffect } from "react";
import { ChatMessage } from "../../../shared/common";
import { getInititalChatLog } from "../effects/effects";

export const useChatLog = () => {
  const [chatLog, setChatLog] = useState<ChatMessage[] | null>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialChatLogFetched, setInitialChatLogFetched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("message", (event) => {
      if (JSON.parse(event.data).broadcastType === "chatLog") {
        setChatLog(JSON.parse(event.data).chatLog);
      }
    });

    newSocket.addEventListener("open", (event) => {
      console.log(initialChatLogFetched);
      if (!initialChatLogFetched) {
        getInititalChatLog({
          socket: newSocket,
          authToken: localStorage.getItem("dominion_auth_token"),
          roomNumber: Number(window.location.pathname.split("/").pop()),
          setErrorMessage,
        });
        setInitialChatLogFetched(true);
      }
      console.log("WebSocket connection opened:", event);
    });

    newSocket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    setSocket(newSocket);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { chatLog, socket, errorMessage, setErrorMessage };
};
