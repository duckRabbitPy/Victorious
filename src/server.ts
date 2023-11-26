import express from "express";
import { json } from "body-parser";
import { apiKeyMiddleware } from "./routes/middleware";
import path from "path";
import dotenv from "dotenv";
import { gameRouter } from "./routes/game-session/game-session";

dotenv.config();

const PORT = process.env?.PORT || 3000;

const server = express();

server.use(json());
server.use(express.urlencoded({ extended: true }));

server.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

// server.use("/game-state", apiKeyMiddleware);
server.use("/game-state", gameRouter);

console.log("\x1b[42m", `listening on port ${PORT}`, "\x1b[0m");

server.listen(PORT);
