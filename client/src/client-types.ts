import { ActorState } from "../../shared/common";

export type CoreRoomInfo = {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
};

export type CoreUserInfo = {
  loggedInUsername: string;
  currentUserState: ActorState | undefined;
};
