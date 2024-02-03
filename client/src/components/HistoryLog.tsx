import { useEffect, useRef } from "react";
import {
  ALL_CARD_NAMES,
  CardName,
  GameState,
  UserNameColors,
  getCardTypeByName,
  getUserNameColors,
} from "../../../shared/common";
import { THEME_COLORS } from "../constants";

const treasureColors = {
  copper: "#fca868",
  silver: "#cccac8",
  gold: "#e6cb57",
};

const getColor = (word: string, gameState: GameState) => {
  const userNames = gameState.actor_state.map((actor) => actor.name);

  const userNameColors = getUserNameColors(userNames);

  const wordIsCard = ALL_CARD_NAMES.includes(word as CardName);

  if (wordIsCard && getCardTypeByName(word as CardName) === "treasure")
    return treasureColors[word as keyof typeof treasureColors];

  if (userNames.includes(word))
    return userNameColors[word as keyof UserNameColors];

  return "white";
};

const renderColoredText = (historyItem: string, gameState: GameState) => {
  const words = historyItem.split(" ");

  return (
    <div>
      {words.map((word, index) => (
        <span key={index} style={{ color: getColor(word, gameState) }}>
          {word}{" "}
        </span>
      ))}
    </div>
  );
};

const HistoryLog = ({ gameState }: { gameState: GameState }) => {
  const history = gameState.global_state.history;
  const historyLog = history.map((historyItem, index) => {
    return <li key={index}>{renderColoredText(historyItem, gameState)}</li>;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        width: "400px",
        maxHeight: "250px",
        overflowY: "scroll",
        backgroundColor: THEME_COLORS.translucentBlack,
        border: "2px solid black",
      }}
    >
      <ul
        style={{
          listStyle: "none",
          margin: "0",
          padding: "0",
          color: "white",
        }}
      >
        Game History:
        {historyLog}
      </ul>
    </div>
  );
};

export default HistoryLog;
