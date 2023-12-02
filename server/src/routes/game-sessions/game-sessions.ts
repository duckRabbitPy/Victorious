import { Router } from "express";
import {
  createGameSession,
  getOpenGameSessions,
} from "../../controllers/game-session/requestHandlers";

const gameRouter = Router();

gameRouter.put("/", createGameSession);

gameRouter.get("/", getOpenGameSessions);

gameRouter.use((_, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { gameRouter };
