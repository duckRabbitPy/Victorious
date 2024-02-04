import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../effects/effects";
import { ChatMessage, getUserNameColors } from "../../../shared/common";
import { LOCAL_STORAGE_AUTH_KEY, THEME_COLORS } from "../constants";

const ChatLog = ({
  chatLog,
  socket,
  userNames,
  setErrorMessage,
}: {
  chatLog: readonly ChatMessage[] | null;
  socket: WebSocket;
  userNames: string[];
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [inputValue, setInputValue] = useState<string | null>("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog]);

  const userNameColours = getUserNameColors(userNames);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendChatMessage({
      socket,
      authToken: localStorage.getItem(LOCAL_STORAGE_AUTH_KEY),
      roomNumber: Number(window.location.pathname.split("/").pop()),
      chatMessage: inputValue,
      setInputValue,
      setErrorMessage,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "1rem",
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: "100%",
          maxHeight: "250px",
          width: "400px",
          overflowY: "scroll",
          backgroundColor: THEME_COLORS.translucentBlack,
          border: "2px solid black",
          color: "white",
        }}
      >
        Chat log:
        {chatLog &&
          chatLog.map((c, i) => (
            <div key={`${c.message}${i}`}>
              <span style={{ color: userNameColours[c.username] }}>
                {c.username}:{" "}
              </span>
              <span style={{ color: "white" }}>{c.message}</span>
            </div>
          ))}
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "1rem",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <div style={{ width: "100%" }}>
          <input
            // has 8px padding and border
            style={{ height: "1.5rem", width: "calc(100% - 8px)" }}
            type="text"
            placeholder="Type your message here"
            value={inputValue ?? ""}
            onChange={handleInputChange}
          />
        </div>
        <button
          type="submit"
          style={{ width: "50%", border: "2px blue solid" }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatLog;
