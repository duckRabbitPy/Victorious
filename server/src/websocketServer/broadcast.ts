import { Effect as E } from "effect";
import { GameState, ChatMessage, BroadCastType } from "../../../shared/common";
import { RoomConnections } from "./createWebsocketServer";

export const broadcastToRoom = <
  T extends GameState | readonly ChatMessage[] | string
>({
  broadcastType,
  payload,
  roomConnections,
  room,
}: {
  broadcastType: BroadCastType;
  payload: T;
  roomConnections: RoomConnections;
  room: number;
}) => {
  roomConnections.forEach((connection) => {
    if (connection.room !== room) return;

    connection.socket.send(
      JSON.stringify({
        broadcastType,
        [broadcastType]: payload,
      })
    );

    connection.socket.onerror = (error) => {
      console.error(`WebSocket error in room ${connection.room}:`, error);
    };

    connection.socket.onclose = (event) => {
      console.log(
        `WebSocket connection closed in room ${connection.room}:`,
        event.reason
      );
    };
  });

  return E.void;
};
