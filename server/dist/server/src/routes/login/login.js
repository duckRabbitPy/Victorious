"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRouter = void 0;
const express_1 = require("express");
const requestHandlers_1 = require("../../controllers/users/requestHandlers");
const loginRouter = (0, express_1.Router)();
exports.loginRouter = loginRouter;
loginRouter.post("/", requestHandlers_1.login);
loginRouter.use((_, res) => {
    res.status(406).json({ message: "Method Not Acceptable" });
});
