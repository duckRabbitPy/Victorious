import express from "express";
import { json } from "body-parser";
import { apiKeyMiddleware } from "./routes/middleware";
import { pipe } from "@effect/data/Function";
import path from "path";
import dotenv from "dotenv";
import { gameRouter } from "./routes/game-session/game-session";
import * as Effect from "@effect/io/Effect";
import { WebSocketServer } from "ws";
import { getGameSessionQuery, incrementTurnQuery } from "./models/gamestate";
import { cons } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { increment } from "fp-ts/lib/function";

dotenv.config();

const PORT = process.env?.PORT || 3000;

const wss = new WebSocketServer({ port: 8080 });

const clients = new Set();

wss.on("connection", function connection(ws: any) {
  ws.on("message", function message(msg: any) {
    clients.add(ws);
    const data = JSON.parse(msg) as any;
    console.log({ data });

    switch (data?.effect) {
      case "init": {
        console.log("send back");
        const room = Number(data.room);
        const freshData = getGameSessionQuery(room);

        Effect.runPromise(freshData).then((data) => {
          ws.send(JSON.stringify(data));
        });
        break;
      }

      case "next": {
        const room = Number(data.room);
        // apply data transformation on game state

        const incrementTurn = pipe(
          incrementTurnQuery(room),
          Effect.flatMap(() => getGameSessionQuery(room))
        );

        Effect.runPromise(incrementTurn).then((data) => {
          ws.send(JSON.stringify(data));

          clients?.forEach((client: any) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              console.log("send to other clients");
              client.send(JSON.stringify(data));
            }
          });
        });
        break;
      }
    }
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
