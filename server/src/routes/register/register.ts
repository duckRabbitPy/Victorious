import { Router } from "express";
import {
  confirmAccount,
  register,
} from "../../controllers/users/requestHandlers";

const registerRouter = Router();

registerRouter.post("/", register);
registerRouter.post("/confirm", confirmAccount);

registerRouter.use((req, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { registerRouter };
