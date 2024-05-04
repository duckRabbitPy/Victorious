import express, { json, urlencoded } from "express";
import cors from "cors";
import { loginRouter } from "./routes/login/login";
import { gameRouter } from "./routes/game-sessions/game-sessions";
import { registerRouter } from "./routes/register/register";
import { authRouter } from "./routes/auth/auth";
import path from "path";
import { wsApplication } from "@wll8/express-ws/dist/src/type";
import { pingRouter } from "./routes/db-ping/ping";

export function createHttpServer(app: wsApplication) {
  const isDev = process.env.NODE_ENV === "development";
  const rootPath = isDev
    ? process.cwd()
    : path.resolve(__dirname, "../../../../..");
  const clientDistPath = path.join(rootPath, "client/dist");

  // 20 min browser cache
  const MAX_CACHE_AGE = isDev ? "0" : String(1000 * 60 * 20);

  app.use(cors());

  app.use(json());
  app.use(urlencoded({ extended: true }));

  // API routes
  app.use("/api/login", loginRouter);
  app.use("/api/register", registerRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/ping", pingRouter);
  app.use("/api/game-sessions", gameRouter);

  // React app running on the same port as the server, in development use Vite server on port 5173
  app.use("/", express.static(clientDistPath, { maxAge: MAX_CACHE_AGE }));

  // Serve static files from the dist/client folder in production
  if (!isDev) {
    app.use(
      "/public",
      express.static(path.join(rootPath, "dist/public"), {
        maxAge: MAX_CACHE_AGE,
      })
    );

    app.use(
      "/",
      express.static(path.join(rootPath, "dist/client"), {
        maxAge: MAX_CACHE_AGE,
      })
    );
  }

  // Handle any other client routes by serving the React app's entry point
  app.get("*", (_, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"), {
      maxAge: MAX_CACHE_AGE,
    });
  });

  console.log("HTTP server created");

  return app;
}
