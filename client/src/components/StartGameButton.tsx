import { CoreRoomInfo } from "../types";
import { startGame } from "../effects/effects";

type Props = {
  coreRoomInfo: CoreRoomInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const StartGameButton = ({
  coreRoomInfo: { socket, authToken, roomNumber },
  setErrorMessage,
}: Props) => {
  return (
    <button
      id="start-game"
      onClick={() => {
        startGame({
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
