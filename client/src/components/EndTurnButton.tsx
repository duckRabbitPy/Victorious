import { CoreProps } from "../types";
import { incrementTurn, startGame } from "../effects/effects";

const EndTurnButton = ({ props }: { props: CoreProps }) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { currentUserState },
    setErrorMessage,
  } = props;
  return (
    <button
      id="end-turn"
      style={
        currentUserState?.buys === 0
          ? {
              border: "1px solid green",
              animation: "pulse 1.2s infinite",
            }
          : {}
      }
      onClick={() => {
        if (gameState.turn === 0) {
          startGame({
            mutationIndex: gameState.mutation_index,
            socket,
            authToken,
            roomNumber,
            setErrorMessage,
          });
        } else {
          incrementTurn({
            mutationIndex: gameState.mutation_index,
            socket,
            authToken,
            roomNumber,
            setErrorMessage,
          });
        }
      }}
    >
      End {currentUserState?.phase === "buy" ? "Buys" : "Actions"}
    </button>
  );
};

export default EndTurnButton;
