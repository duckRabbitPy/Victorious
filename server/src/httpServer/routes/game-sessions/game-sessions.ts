import { Router } from "express";
import { createGameSession, getOpenGameSessions } from "../../requestHandlers";

const gameRouter = Router();

gameRouter.put("/", createGameSession);

gameRouter.get("/", getOpenGameSessions);

gameRouter.use((_, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { gameRouter };
