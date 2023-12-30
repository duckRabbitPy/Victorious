"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpServer = void 0;
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const login_1 = require("./routes/login/login");
const game_sessions_1 = require("./routes/game-sessions/game-sessions");
const register_1 = require("./routes/register/register");
const auth_1 = require("./routes/auth/auth");
const path_1 = __importDefault(require("path"));
function createHttpServer(port) {
    const server = (0, express_1.default)();
    const isDev = process.env.NODE_ENV === "development";
    const rootPath = isDev
        ? process.cwd()
        : path_1.default.resolve(__dirname, "../../../../");
    const clientDistPath = path_1.default.join(rootPath, "client/dist");
    server.use((0, cors_1.default)());
    server.use((0, cors_1.default)({
        // Vite app running on port 5173 in development
        origin: isDev ? process.env.VITE_DEV_CLIENT_URL : "",
        optionsSuccessStatus: 200,
    }));
    server.use((0, express_1.json)());
    server.use((0, express_1.urlencoded)({ extended: true }));
    // API routes
    server.use("/api/login", login_1.loginRouter);
    server.use("/api/register", register_1.registerRouter);
    server.use("/api/auth", auth_1.authRouter);
    server.use("/api/game-sessions", game_sessions_1.gameRouter);
    // React app running on the same port as the server, in development use Vite server on port 5173
    server.use("/", express_1.default.static(clientDistPath));
    // Serve static files from the dist/client folder in production
    if (!isDev) {
        server.use("/public", express_1.default.static(path_1.default.join(rootPath, "dist/public")));
        server.use("/", express_1.default.static(path_1.default.join(rootPath, "dist/client")));
    }
    // Handle any other client routes by serving the React app's entry point
    server.get("*", (_, res) => {
        res.sendFile(path_1.default.join(clientDistPath, "index.html"));
    });
    console.log("\x1b[42m", `Listening on port ${port}`, "\x1b[0m");
    server.listen(port);
    return server;
}
exports.createHttpServer = createHttpServer;
