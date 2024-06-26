import { Router } from "express";
import { auth } from "../../requestHandlers";

const authRouter = Router();

authRouter.get("/", auth);

authRouter.use((_, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { authRouter };
