"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastToRoom = void 0;
const effect_1 = require("effect");
const broadcastToRoom = (broadcastType, payload, room, roomConnections) => {
    roomConnections.forEach((connection) => {
        if (connection.room !== room)
            return;
        connection.socket.send(JSON.stringify({
            broadcastType,
            [broadcastType]: payload,
        }));
        connection.socket.onerror = (error) => {
            console.error(`WebSocket error in room ${connection.room}:`, error);
        };
        connection.socket.onclose = (event) => {
            console.log(`WebSocket connection closed in room ${connection.room}:`, event.reason);
        };
    });
    return effect_1.Effect.unit;
};
exports.broadcastToRoom = broadcastToRoom;
