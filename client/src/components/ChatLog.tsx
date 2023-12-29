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

  const colours = ["blue", "red", "green", "orange", "purple"];

  const userNameColours: UserNameColors = Array.from(
    new Set(chatLog?.map((c) => c.username))
  ).reduce((acc, curr, i) => {
    acc[curr] = colours[i];
    return acc;
  }, {} as UserNameColors);

  return (
    <div>
      <h3>ChatLog</h3>
      <div>
        {chatLog &&
          chatLog.map((c) => (
            <div key={c.message}>
              <span style={{ color: userNameColours[c.username] }}>
                {c.username}:{" "}
              </span>
              <span>{c.message}</span>
            </div>
          ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          style={{ width: "200px" }}
          type="text"
          placeholder="Type your message here"
          value={inputValue ?? ""}
          onChange={handleInputChange}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatLog;
