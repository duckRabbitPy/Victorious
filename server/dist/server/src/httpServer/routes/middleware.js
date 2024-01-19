"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenMiddleware = void 0;
const effect_1 = require("effect");
const customErrors_1 = require("../../customErrors");
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_1 = require("../../../../shared/common");
dotenv_1.default.config();
// not currently used
const tokenMiddleware = (req, res, next) => {
    const token = req.headers["Authorization"];
    const secretKey = (0, effect_1.pipe)((0, common_1.safeParseNonEmptyString)(process.env.JWT_SECRET_KEY), effect_1.Effect.orElseFail(() => effect_1.Effect.succeed("NOT_CORRECT_KEY")), effect_1.Effect.runSync);
    return (0, effect_1.pipe)(token, common_1.safeParseNonEmptyString, effect_1.Effect.flatMap((token) => {
        jsonwebtoken_1.default.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return effect_1.Effect.fail(new customErrors_1.AuthorisationError({ message: "Invalid Auth Token" }));
            }
        });
        return effect_1.Effect.succeed(next());
    }), effect_1.Effect.matchCauseEffect({
        onFailure: (cause) => {
            if (cause._tag === "Fail") {
                return effect_1.Effect.succeed(res.status(401).json({ message: cause.error._tag }));
            }
            return effect_1.Effect.succeed(res.status(500).json({ message: "Internal server error" }));
        },
        onSuccess: () => effect_1.Effect.unit,
    }), effect_1.Effect.runSync);
};
exports.tokenMiddleware = tokenMiddleware;
