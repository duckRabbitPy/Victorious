"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const websocketServer_1 = require("./websocketServer");
const httpServer_1 = require("./httpServer");
// server env set up
dotenv_1.default.config();
const SERVER_PORT = Number((_a = process.env) === null || _a === void 0 ? void 0 : _a.PORT) || 3000;
const WEBSOCKET_PORT = Number((_b = process.env) === null || _b === void 0 ? void 0 : _b.WEBSOCKET_PORT) || 8080;
// websocket server on 8080;
(0, websocketServer_1.createWebsocketServer)(WEBSOCKET_PORT);
// http server on 3000
(0, httpServer_1.createHttpServer)(SERVER_PORT);
