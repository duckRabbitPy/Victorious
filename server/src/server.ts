import express from "express";
import { json } from "body-parser";
import dotenv from "dotenv";
import { gameRouter } from "./routes/game-session/game-session";
import * as Schema from "@effect/schema/Schema";
import * as Effect from "@effect/io/Effect";
import WebSocket, { WebSocketServer } from "ws";
import cors from "cors";
import { addLivePlayerQuery, incrementTurnQuery } from "./models/gamestate";
import { pipe } from "effect";
import {
  AuthenticationError,
  JSONParseError,
} from "./controllers/customErrors";
import { loginRouter } from "./routes/login/login";
import { registerRouter } from "./routes/register/register";
import jwt from "jsonwebtoken";
import { TapPipeLine, safeParseNonEmptyString } from "./utils";

dotenv.config();

const PORT = process.env?.PORT || 3000;

const wss = new WebSocketServer({ port: 8080 });

const clients = new Set<WebSocket>();

const verifyJwt = (token: string, secret: string | undefined) => {
  return pipe(
    safeParseNonEmptyString(secret),
    Effect.orElseFail(() =>
      Effect.succeed(
        new AuthenticationError({ message: "server secret key not found" })
      )
    ),
    TapPipeLine,
    Effect.flatMap((secret) => {
      return Effect.tryPromise({
        try: () =>
          new Promise((resolve, reject) => {
            jwt.verify(token, secret, (err: unknown, decoded: unknown) => {
              if (err) {
                reject(new Error("Invalid token"));
              }
              resolve(decoded);
            });
          }),
        catch: () => new AuthenticationError({ message: "Invalid API key" }),
      });
    }),
    TapPipeLine
  );
};

const getUserIdFromToken = (token: string) => {
  const decodedJwt = verifyJwt(token, process.env.JWT_SECRET_KEY);

  // todo: implement
  return Effect.runPromise(decodedJwt);
};

const clientPayloadStruct = Schema.struct({
  effect: Schema.string,
  room: Schema.number,
  authToken: Schema.string,
});

export const parseClientMessage = Schema.parse(clientPayloadStruct);

wss.on("connection", function connection(ws: WebSocket) {
  ws.on("message", function message(msg: unknown) {
    clients.add(ws);

    const safeMsg = pipe(
      Effect.try({
        try: () => JSON.parse(msg as string),
        catch: (e) =>
          new JSONParseError({ message: `error parsing client message: ${e}` }),
      }),
      Effect.flatMap((msg) =>
        Effect.succeed({ ...msg, room: Number(msg.room) })
      ),
      Effect.flatMap((msg) => parseClientMessage(msg)),
      Effect.runSync
    );

    switch (safeMsg?.effect) {
      case "addLivePlayer": {
        const room = Number(safeMsg.room);
        const authToken = safeMsg.authToken;

        console.log(getUserIdFromToken(authToken));
        // const userId = getUserIdFromToken(authToken);
        const userId = "2abb7402-8b4c-4494-a763-283fa50a21a6";
        Effect.runPromise(addLivePlayerQuery(userId, room)).then((data) => {
          ws.send(JSON.stringify(data));

          clients?.forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        });
        break;
      }
      case "next": {
        const room = safeMsg.room;
        Effect.runPromise(incrementTurnQuery(room)).then((data) => {
          ws.send(JSON.stringify(data));

          clients?.forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
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

server.use(cors());

server.use(
  cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
  })
);

server.use(json());
server.use(express.urlencoded({ extended: true }));

server.use("/login", loginRouter);
server.use("/register", registerRouter);
server.use("/game-state", gameRouter);

console.log("\x1b[42m", `listening on port ${PORT}`, "\x1b[0m");

server.listen(PORT);
