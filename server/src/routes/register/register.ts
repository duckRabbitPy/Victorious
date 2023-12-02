import { Router } from "express";
import { register, verify } from "../../controllers/users/requestHandlers";

const registerRouter = Router();

registerRouter.post("/", register);
registerRouter.get("/confirm/:confirmation_token", verify);

registerRouter.use((req, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { registerRouter };
