"use strict";
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
exports.verifyUserQuery = exports.registerNewUserQuery = exports.getAllRegisteredUserNamesQuery = exports.getUserIdByUsernameQuery = exports.getHashedPasswordByUsernameQuery = void 0;
const effect_1 = require("effect");
const customErrors_1 = require("../customErrors");
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
    return effect_1.Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
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
    return effect_1.Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.getUserIdByUsernameQuery = getUserIdByUsernameQuery;
const getAllRegisteredUserNamesQuery = (pool) => {
    const get = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield pool.query("SELECT username FROM users");
            return result.rows.map((row) => row.username);
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => get(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.getAllRegisteredUserNamesQuery = getAllRegisteredUserNamesQuery;
const registerNewUserQuery = (username, email, hashedPassword, pool) => {
    const add = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const confirmation_token = (0, utils_2.uuidv4)();
            const result = yield pool.query("INSERT INTO users (username, password, email, confirmation_token) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, confirmation_token", [username, hashedPassword, email, confirmation_token]);
            return result.rows[0];
        }
        catch (error) {
            (0, utils_1.logAndThrowError)(error);
        }
    });
    return effect_1.Effect.tryPromise({
        try: () => add(),
        catch: () => new customErrors_1.RegistrationError({
            message: "Error registering user, email and usernames must be unique",
        }),
    }).pipe(effect_1.Effect.retryN(1));
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
    return effect_1.Effect.tryPromise({
        try: () => confirm(),
        catch: () => new customErrors_1.PostgresError({ message: "postgres query error" }),
    }).pipe(effect_1.Effect.retryN(1));
};
exports.verifyUserQuery = verifyUserQuery;
