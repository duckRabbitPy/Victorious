import { endActions } from "../effects/effects";
import { CoreProps } from "../types";

export const EndActionsButton = ({ props }: { props: CoreProps }) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { currentUserState },
    setErrorMessage,
  } = props;

  return (
    <button
      id="end-actions"
      style={
        currentUserState?.buys === 0
          ? {
              border: "1px solid green",
              animation: "pulse 1.2s infinite",
            }
          : {}
      }
      onClick={() => {
        endActions({
          mutationIndex: gameState.mutation_index,
          socket,
          authToken,
          roomNumber,
          setErrorMessage,
        });
      }}
    >
      End Actions
    </button>
  );
};
