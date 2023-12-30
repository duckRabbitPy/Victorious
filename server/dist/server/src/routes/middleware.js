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
exports.tokenMiddleware = void 0;
const Function_1 = require("@effect/data/Function");
const customErrors_1 = require("../controllers/customErrors");
const dotenv_1 = __importDefault(require("dotenv"));
const Effect = __importStar(require("@effect/io/Effect"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_1 = require("../../../shared/common");
dotenv_1.default.config();
const tokenMiddleware = (req, res, next) => {
    const token = req.headers["Authorization"];
    const secretKey = (0, Function_1.pipe)((0, common_1.safeParseNonEmptyString)(process.env.JWT_SECRET_KEY), Effect.orElseFail(() => Effect.succeed("NOT_CORRECT_KEY")), Effect.runSync);
    return (0, Function_1.pipe)(token, common_1.safeParseNonEmptyString, Effect.flatMap((token) => {
        jsonwebtoken_1.default.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return Effect.fail(new customErrors_1.AuthorisationError({ message: "Invalid Auth Token" }));
            }
        });
        return Effect.succeed(next());
    }), Effect.matchCauseEffect({
        onFailure: (cause) => {
            if (cause._tag === "Fail") {
                return Effect.succeed(res.status(401).json({ message: cause.error._tag }));
            }
            return Effect.succeed(res.status(500).json({ message: "Internal server error" }));
        },
        onSuccess: () => Effect.unit,
    }), Effect.runSync);
};
exports.tokenMiddleware = tokenMiddleware;
