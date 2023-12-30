"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRouter = void 0;
const express_1 = require("express");
const requestHandlers_1 = require("../../controllers/users/requestHandlers");
const registerRouter = (0, express_1.Router)();
exports.registerRouter = registerRouter;
registerRouter.post("/", requestHandlers_1.register);
registerRouter.get("/confirm/:confirmation_token", requestHandlers_1.verify);
registerRouter.use((req, res) => {
    res.status(406).json({ message: "Method Not Acceptable" });
});
