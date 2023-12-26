import express, { Express, json, urlencoded } from "express";
import cors from "cors";
import { loginRouter } from "./routes/login/login";
import { gameRouter } from "./routes/game-sessions/game-sessions";
import { registerRouter } from "./routes/register/register";
import { authRouter } from "./routes/auth/auth";
import path from "path";

export function createHttpServer(port: number): Express {
  const server = express();

  const isDev = process.env.NODE_ENV === "development";
  const rootPath = isDev
    ? process.cwd()
    : path.resolve(__dirname, "../../../../");
  const clientDistPath = path.join(rootPath, "client/dist");

  server.use(cors());

  server.use(
    cors({
      // Vite app running on port 5173 in development
      origin: isDev ? process.env.VITE_DEV_CLIENT_URL : "",
      optionsSuccessStatus: 200,
    })
  );

  server.use(json());
  server.use(urlencoded({ extended: true }));

  // API routes
  server.use("/api/login", loginRouter);
  server.use("/api/register", registerRouter);
  server.use("/api/auth", authRouter);
  server.use("/api/game-sessions", gameRouter);

  // React app running on the same port as the server, in development use Vite server on port 5173
  server.use("/", express.static(clientDistPath));

  // Serve static files from the dist/client folder in production
  if (!isDev) {
    server.use("/", express.static(path.join(rootPath, "dist/client")));
  }

  // Handle any other client routes by serving the React app's entry point
  server.get("*", (_, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });

  console.log("\x1b[42m", `Listening on port ${port}`, "\x1b[0m");

  server.listen(port);

  return server;
}
