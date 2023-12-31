import dotenv from "dotenv";
import { createWebsocketServer } from "./websocketServer";
import { createHttpServer } from "./httpServer";

import express from "express";
import http from "http";
import expressWs from "@wll8/express-ws";

// server env set up
dotenv.config();
const SERVER_PORT = Number(process.env?.PORT) || 3000;
export const API_ENDPOINT =
  process.env.NODE_ENV === "production"
    ? "https://dominion.onrender.com/api"
    : "http://localhost:3000/api";

console.log({ API_ENDPOINT });

const expressApp = express();

const httpServer = http.createServer(expressApp);
const appWithWSSUpgrade = expressWs({
  app: expressApp,
  server: httpServer,
}).app;

createHttpServer(appWithWSSUpgrade);
createWebsocketServer(appWithWSSUpgrade);

appWithWSSUpgrade.listen(SERVER_PORT, () => {
  console.log(
    "\x1b[42m",
    `Server is running on port ${SERVER_PORT}`,
    "\x1b[0m"
  );
});

appWithWSSUpgrade.on("error", (error) => {
  console.error("Server failed to start:", error);
});
