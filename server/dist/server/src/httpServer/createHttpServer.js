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
function createHttpServer(app) {
    const isDev = process.env.NODE_ENV === "development";
    const rootPath = isDev
        ? process.cwd()
        : path_1.default.resolve(__dirname, "../../../../..");
    const clientDistPath = path_1.default.join(rootPath, "client/dist");
    app.use((0, cors_1.default)());
    app.use((0, express_1.json)());
    app.use((0, express_1.urlencoded)({ extended: true }));
    // API routes
    app.use("/api/login", login_1.loginRouter);
    app.use("/api/register", register_1.registerRouter);
    app.use("/api/auth", auth_1.authRouter);
    app.use("/api/game-sessions", game_sessions_1.gameRouter);
    // React app running on the same port as the server, in development use Vite server on port 5173
    app.use("/", express_1.default.static(clientDistPath));
    // Serve static files from the dist/client folder in production
    if (!isDev) {
        app.use("/public", express_1.default.static(path_1.default.join(rootPath, "dist/public")));
        app.use("/", express_1.default.static(path_1.default.join(rootPath, "dist/client")));
    }
    // Handle any other client routes by serving the React app's entry point
    app.get("*", (_, res) => {
        res.sendFile(path_1.default.join(clientDistPath, "index.html"));
    });
    console.log("HTTP server created");
    return app;
}
exports.createHttpServer = createHttpServer;
