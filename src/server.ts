import express from "express";
import { json } from "body-parser";
import { apiKeyMiddleware } from "./routes/middleware";
import path from "path";
import dotenv from "dotenv";
import { gameRouter } from "./routes/game-session/game-session";
import * as Effect from "@effect/io/Effect";
import { WebSocketServer } from "ws";
import { getGameSessionQuery } from "./models/gamestate";
import { cons } from "fp-ts/lib/ReadonlyNonEmptyArray";

dotenv.config();

const PORT = process.env?.PORT || 3000;

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws: any) {
  ws.on("message", function message(msg: any) {
    const data = JSON.parse(msg) as any;
    console.log({ data });
    if (!data && !data?.roomId) {
      return;
    }
    const room = Number(data.room);
    // apply data transformation on game state
    console.log("received: %s", data);

    const freshData = getGameSessionQuery(room);

    // todo handle multiple clients
    Effect.runPromise(freshData).then((data) => {
      ws.send(JSON.stringify(data));
    });
  });
});

const server = express();

server.use(json());
server.use(express.urlencoded({ extended: true }));

server.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

server.get("/room/:id", (_, res) => {
  res.sendFile(path.join(__dirname, "../client/room.html"));
});

// server.use("/game-state", apiKeyMiddleware);
server.use("/game-state", gameRouter);

console.log("\x1b[42m", `listening on port ${PORT}`, "\x1b[0m");

server.listen(PORT);
