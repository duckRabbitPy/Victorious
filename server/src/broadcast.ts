import { Effect } from "effect";
import { GameState, ChatMessage } from "../../shared/common";
import { RoomConnections } from "./websocketServer";

type BroadCastType = "gameState" | "chatLog";

export const broadcastToRoom = <T extends GameState | readonly ChatMessage[]>(
  broadcastType: BroadCastType,
  payload: T,
  room: number,
  roomConnections: RoomConnections
) => {
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

  return Effect.unit;
};
