import { GameState } from "../../../shared/common";
import { THEME_COLORS } from "../constants";

const HistoryLog = ({ gameState }: { gameState: GameState }) => {
  const history = gameState.global_state.history;
  const historyLog = history.map((historyItem, index) => {
    return <li key={index}>{historyItem}</li>;
  });

  return (
    <div
      style={{
        height: "100%",
        width: "400px",
        maxHeight: "300px",
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
