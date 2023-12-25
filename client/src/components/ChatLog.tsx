import { useEffect, useState } from "react";
import { ChatMessage } from "../../../shared/common";
import { sendChatMessage } from "../effects/effects";

const useChatLog = () => {
  const [chatLog, setChatLog] = useState<ChatMessage[] | null>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("message", (event) => {
      setChatLog(JSON.parse(event.data));
    });

    newSocket.addEventListener("open", (event) => {
      console.log("WebSocket connection opened:", event);
    });

    newSocket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    setSocket(newSocket);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { chatLog, socket };
};

const ChatLog = () => {
  const { chatLog, socket } = useChatLog();

  return (
    <div>
      <h1>ChatLog</h1>
      <div>
        {chatLog &&
          chatLog.map((c) => (
            <div key={c.message}>
              <span>{c.name}</span>
              <span>{c.message}</span>
            </div>
          ))}
      </div>
      <input type="text" placeholder="Type your message here" />
      <button
        onClick={() =>
          sendChatMessage({
            socket,
            authToken: localStorage.getItem("dominion_auth_token"),
            roomNumber: Number(window.location.pathname.split("/").pop()),
            chatMessage: "test",
            setErrorMessage: () => {},
          })
        }
      >
        Send
      </button>
    </div>
  );
};

export default ChatLog;
