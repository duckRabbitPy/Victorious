import { ActorState, CardName } from "../../shared/common";

export type CoreRoomInfo = {
  socket: WebSocket | null;
  authToken: string | null;
  roomNumber: number;
};

export type CoreUserInfo = {
  loggedInUsername: string;
  currentUserState: ActorState | undefined;
  cardsInPlay: Record<CardName, number>;
  selectedTreasureValue: number;
};
