import React from "react";
import { CardName, GameState, zeroCardCount } from "../../../shared/common";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { incrementTurn, startGame } from "../effects/effects";

type Props = {
  coreUserInfo: CoreUserInfo;
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setCardsInPlay: React.Dispatch<
    React.SetStateAction<Record<CardName, number>>
  >;
};

const EndTurnButton = ({
  coreUserInfo: { currentUserState },
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  setErrorMessage,
  setCardsInPlay,
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
        }
        setCardsInPlay(zeroCardCount);
        incrementTurn({
          socket,
          authToken,
          roomNumber,
          setErrorMessage,
        });
      }}
    >
      End turn
    </button>
  );
};

export default EndTurnButton;
