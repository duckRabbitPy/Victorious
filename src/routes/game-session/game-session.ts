import { Router } from "express";
import { createGameSession } from "../../controllers/game-session/requestHandlers";

const gameRouter = Router();

gameRouter.post("/", createGameSession);

// todoRouter.get("/:id", getGameSession);

// todoRouter.put("/:id", updateGameSession);

// todoRouter.delete("/:id", deleteToDoItem);

gameRouter.use((req, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { gameRouter };
