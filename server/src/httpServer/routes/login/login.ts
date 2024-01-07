import { Router } from "express";
import { login } from "../../requestHandlers";

const loginRouter = Router();

loginRouter.post("/", login);

loginRouter.use((_, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { loginRouter };
