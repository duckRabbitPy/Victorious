import { Router } from "express";
import { ping } from "../../requestHandlers";

const pingRouter = Router();

pingRouter.get("/", ping);

pingRouter.use((_, res) => {
  res.status(406).json({ message: "Method Not Acceptable" });
});

export { pingRouter };
