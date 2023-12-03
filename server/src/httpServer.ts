import express, { Express, json, urlencoded } from "express";
import cors from "cors";
import { loginRouter } from "./routes/login/login";
import { gameRouter } from "./routes/game-sessions/game-sessions";
import { registerRouter } from "./routes/register/register";

export function createHttpServer(port: number): Express {
  const server = express();

  server.use(cors());

  server.use(
    cors({
      origin: `${process.env.CLIENT_URL || "http://localhost:5173"}`,
      optionsSuccessStatus: 200,
    })
  );

  server.use(json());
  server.use(urlencoded({ extended: true }));

  server.use("/login", loginRouter);
  server.use("/register", registerRouter);
  server.use("/game-sessions", gameRouter);

  console.log("\x1b[42m", `listening on port ${port}`, "\x1b[0m");

  server.listen(port);

  return server;
}
