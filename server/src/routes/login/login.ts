import { Router } from "express";
import { login } from "../../controllers/users/requestHandlers";

const loginRouter = Router();

loginRouter.post("/", login);

loginRouter.use((req, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { loginRouter };
