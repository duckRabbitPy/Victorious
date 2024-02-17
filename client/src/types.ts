import { ActorState, GameState } from "../../shared/common";
import React from "react";

export type CoreRoomInfo = {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
};

export type CoreUserInfo = {
  loggedInUsername: string;
  currentUserState: ActorState | undefined;
};

export type CoreProps = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  coreUserInfo: CoreUserInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};
