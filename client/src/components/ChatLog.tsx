import { useState } from "react";
import { sendChatMessage } from "../effects/effects";
import { ChatMessage } from "../../../shared/common";

interface UserNameColors {
  [username: string]: string;
}

const ChatLog = ({
  chatLog,
  socket,
  setErrorMessage,
}: {
  chatLog: readonly ChatMessage[] | null;
  socket: WebSocket;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [inputValue, setInputValue] = useState<string | null>("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendChatMessage({
      socket,
      authToken: localStorage.getItem("dominion_auth_token"),
      roomNumber: Number(window.location.pathname.split("/").pop()),
      chatMessage: inputValue,
      setInputValue,
      setErrorMessage,
    });
  };

  const colours = ["cyan", "magenta", "lime", "yellow", "orange"];

  const userNameColours: UserNameColors = Array.from(
    new Set(chatLog?.map((c) => c.username))
  ).reduce((acc, curr, i) => {
    acc[curr] = colours[i] ?? "white";
    return acc;
  }, {} as UserNameColors);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          height: "100%",
          width: "400px",
          overflowY: "scroll",
          backgroundColor: "rgba(28, 26, 27, 0.66)",
          border: "2px solid black",
        }}
      >
        {chatLog &&
          chatLog.map((c) => (
            <div key={c.message}>
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
        <button type="submit" style={{ width: "50%" }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatLog;
