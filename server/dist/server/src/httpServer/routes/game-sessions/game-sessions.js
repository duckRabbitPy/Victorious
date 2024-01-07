"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameRouter = void 0;
const express_1 = require("express");
const requestHandlers_1 = require("../../requestHandlers");
const gameRouter = (0, express_1.Router)();
exports.gameRouter = gameRouter;
gameRouter.put("/", requestHandlers_1.createGameSession);
gameRouter.get("/", requestHandlers_1.getOpenGameSessions);
gameRouter.use((_, res) => {
    res.status(406).json({ message: "Method Not Acceptable" });
});
