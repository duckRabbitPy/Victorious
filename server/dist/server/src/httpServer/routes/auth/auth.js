"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const requestHandlers_1 = require("../../requestHandlers");
const authRouter = (0, express_1.Router)();
exports.authRouter = authRouter;
authRouter.get("/", requestHandlers_1.auth);
authRouter.use((_, res) => {
    res.status(406).json({ message: "Method Not Acceptable" });
});
