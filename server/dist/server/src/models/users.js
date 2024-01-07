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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUserQuery = exports.registerNewUserQuery = exports.getUserIdByUsernameQuery = exports.getHashedPasswordByUsernameQuery = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const customErrors_1 = require("../controllers/customErrors");
const utils_1 = require("../utils");
const utils_2 = require("../../../shared/utils");
const getHashedPasswordByUsernameQuery = (username, pool) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("SELECT password FROM users WHERE username = $1", [username]);
            return result.rows[0].password;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(Effect.retryN(1));
};
exports.getHashedPasswordByUsernameQuery = getHashedPasswordByUsernameQuery;
const getUserIdByUsernameQuery = (username, pool) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("SELECT user_id FROM users WHERE username = $1", [username]);
            return result.rows[0].user_id;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(Effect.retryN(1));
};
exports.getUserIdByUsernameQuery = getUserIdByUsernameQuery;
const registerNewUserQuery = (username, email, hashedPassword, pool) => {
    const add = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const confirmation_token = (0, utils_2.uuidv4)();
            const result = yield pool.query("INSERT INTO users (username, password, email, confirmation_token) VALUES ($1, $2, $3, $4) RETURNING email, confirmation_token", [username, hashedPassword, email, confirmation_token]);
            return result.rows[0];
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return Effect.tryPromise({
        try: () => add(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(Effect.retryN(1));
};
exports.registerNewUserQuery = registerNewUserQuery;
const verifyUserQuery = (confirmation_token, pool) => {
    const confirm = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("UPDATE users SET verified = true WHERE confirmation_token = $1 RETURNING username", [confirmation_token]);
            return result.rows[0].username;
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return Effect.tryPromise({
        try: () => confirm(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(Effect.retryN(1));
};
exports.verifyUserQuery = verifyUserQuery;
