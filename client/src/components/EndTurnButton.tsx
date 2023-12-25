import React from "react";
import { GameState } from "../../../shared/common";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { incrementTurn, startGame } from "../effects/effects";

type Props = {
  coreUserInfo: CoreUserInfo;
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const EndTurnButton = ({
  coreUserInfo: { currentUserState },
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  setErrorMessage,
}: Props) => {
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
            socket,
            authToken,
            roomNumber,
            setErrorMessage,
          });
        } else {
          incrementTurn({
            socket,
            authToken,
            roomNumber,
            setErrorMessage,
          });
        }
      }}
    >
      End turn
    </button>
  );
};

export default EndTurnButton;
