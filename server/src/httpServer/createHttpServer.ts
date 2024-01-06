import express, { json, urlencoded } from "express";
import cors from "cors";
import { loginRouter } from "./routes/login/login";
import { gameRouter } from "./routes/game-sessions/game-sessions";
import { registerRouter } from "./routes/register/register";
import { authRouter } from "./routes/auth/auth";
import path from "path";
import { wsApplication } from "@wll8/express-ws/dist/src/type";

export function createHttpServer(app: wsApplication) {
  const isDev = process.env.NODE_ENV === "development";
  const rootPath = isDev
    ? process.cwd()
    : path.resolve(__dirname, "../../../../");
  const clientDistPath = path.join(rootPath, "client/dist");

  app.use(cors());

  app.use(
    cors({
      // Vite app running on port 5173 in development
      origin: isDev ? process.env.VITE_DEV_CLIENT_URL : "",
      optionsSuccessStatus: 200,
    })
  );

  app.use(json());
  app.use(urlencoded({ extended: true }));

  // API routes
  app.use("/api/login", loginRouter);
  app.use("/api/register", registerRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/game-sessions", gameRouter);

  // React app running on the same port as the server, in development use Vite server on port 5173
  app.use("/", express.static(clientDistPath));

  // Serve static files from the dist/client folder in production
  if (!isDev) {
    app.use("/public", express.static(path.join(rootPath, "dist/public")));
    app.use("/", express.static(path.join(rootPath, "dist/client")));
  }

  // Handle any other client routes by serving the React app's entry point
  app.get("*", (_, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });

  console.log("HTTP server created");

  return app;
}