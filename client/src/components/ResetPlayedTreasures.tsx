import { GameState, getTreasureValue } from "../../../shared/common";
import { resetPlayedTreasures } from "../effects/effects";
import { CoreRoomInfo, CoreUserInfo } from "../types";
type Props = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  coreUserInfo: CoreUserInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

export const ResetPlayedTreasuresButton = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: { currentUserState },
  setErrorMessage,
}: Props) => {
  if (!currentUserState) return null;

  const canReset = getTreasureValue(currentUserState.cardsInPlay) > 0;

  if (!canReset) {
    return null;
  }

  return (
    <button
      onClick={() => {
        resetPlayedTreasures({
          mutationIndex: gameState.mutation_index,
          socket,
          authToken,
          roomNumber,
          setErrorMessage,
        });
      }}
    >
      reset played treasures
    </button>
  );
};
