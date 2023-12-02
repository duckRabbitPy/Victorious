import { Router } from "express";
import { createGameSession } from "../../controllers/game-session/requestHandlers";

const gameRouter = Router();

gameRouter.post("/", createGameSession);

gameRouter.use((_, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { gameRouter };
