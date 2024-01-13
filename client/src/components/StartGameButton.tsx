import { CoreRoomInfo } from "../types";
import { startGame } from "../effects/effects";
import { GameState } from "../../../shared/common";

type Props = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const StartGameButton = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  setErrorMessage,
}: Props) => {
  return (
    <button
      id="start-game"
      onClick={() => {
        startGame({
          mutationIndex: gameState.mutation_index,
          socket,
          authToken,
          roomNumber,
          setErrorMessage,
        });
      }}
      style={{
        border: "1px solid green",
        animation: "pulse 1.2s infinite",
      }}
    >
      Start game
    </button>
  );
};

export default StartGameButton;
