"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_API_ENDPOINT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const websocketServer_1 = require("./websocketServer");
const httpServer_1 = require("./httpServer");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const express_ws_1 = __importDefault(require("@wll8/express-ws"));
// server env set up
dotenv_1.default.config();
const SERVER_PORT = Number((_a = process.env) === null || _a === void 0 ? void 0 : _a.PORT) || 3000;
exports.SERVER_API_ENDPOINT = process.env.NODE_ENV === "production"
    ? "https://dominion.onrender.com/api"
    : "http://localhost:3000/api";
console.log({ SERVER_API_ENDPOINT: exports.SERVER_API_ENDPOINT });
const expressApp = (0, express_1.default)();
const httpServer = http_1.default.createServer(expressApp);
const appWithWSSUpgrade = (0, express_ws_1.default)({
    app: expressApp,
    server: httpServer,
}).app;
(0, httpServer_1.createHttpServer)(appWithWSSUpgrade);
(0, websocketServer_1.createWebsocketServer)(appWithWSSUpgrade);
appWithWSSUpgrade.listen(SERVER_PORT, () => {
    console.log("\x1b[42m", `Server is running on port ${SERVER_PORT}`, "\x1b[0m");
});
appWithWSSUpgrade.on("error", (error) => {
    console.error("Server failed to start:", error);
});
