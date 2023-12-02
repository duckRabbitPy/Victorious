import dotenv from "dotenv";
import { useWebsocketServer as createWebsocketServer } from "./websocketServer";
import { createHttpServer } from "./httpServer";

// server env set up
dotenv.config();
const SERVER_PORT = Number(process.env?.PORT) || 3000;
const WEBSOCKET_PORT = Number(process.env?.WEBSOCKET_PORT) || 8080;

// websocket server on 8080;
createWebsocketServer(WEBSOCKET_PORT);

// http server on 3000
createHttpServer(SERVER_PORT);
