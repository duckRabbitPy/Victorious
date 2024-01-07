"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.verify = exports.register = exports.login = exports.getOpenGameSessions = exports.createGameSession = void 0;
const effect_1 = require("effect");
const queries_1 = require("../models/gamestate/queries");
const utils_1 = require("../utils");
const responseHandlers_1 = require("./responseHandlers");
const mutations_1 = require("../models/gamestate/mutations");
const common_1 = require("../../../shared/common");
const connection_1 = require("../db/connection");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const customErrors_1 = require("../customErrors");
const users_1 = require("../models/users");
const utils_2 = require("../utils");
const responseHandlers_2 = require("./responseHandlers");
const common_2 = require("../../../shared/common");
const sendConfirmationEmail_1 = require("./sendConfirmationEmail");
const createGameSession = (req, res) => {
    const createGameSession = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({
        pool: effect_1.Effect.succeed(pool),
        room: (0, utils_1.safeParseNumber)(req.body.room),
    })), effect_1.Effect.flatMap(({ pool, room }) => (0, mutations_1.createGameSessionQuery)(room, pool)), effect_1.Effect.flatMap(common_1.safeParseGameState), (dataOrError) => (0, responseHandlers_1.sendGameStateResponse)({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
    }));
    const runnable = effect_1.Effect.provideService(createGameSession, connection_1.DBConnection, connection_1.DBConnectionLive);
    effect_1.Effect.runPromise(runnable);
};
exports.createGameSession = createGameSession;
const getOpenGameSessions = (req, res) => {
    const getOpenGameSessions = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => (0, queries_1.getOpenGameSessionsQuery)(pool)), effect_1.Effect.flatMap((rooms) => (0, utils_1.safeParseNumberArray)(rooms)), (dataOrError) => (0, responseHandlers_1.sendOpenRoomsResponse)({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
    }));
    const runnable = effect_1.Effect.provideService(getOpenGameSessions, connection_1.DBConnection, connection_1.DBConnectionLive);
    effect_1.Effect.runPromise(runnable);
};
exports.getOpenGameSessions = getOpenGameSessions;
const login = (req, res) => {
    const login = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({
        username: (0, common_2.safeParseNonEmptyString)(req.body.username),
        password: (0, common_2.safeParseNonEmptyString)(req.body.password),
        pool: effect_1.Effect.succeed(pool),
    })), effect_1.Effect.flatMap(({ username, password, pool }) => authenticateUser(username, password, pool)), (authToken) => (0, responseHandlers_2.sendLoginResponse)({
        dataOrError: authToken,
        res,
        successStatus: 200,
        label: "authToken",
    }));
    const runnable = effect_1.Effect.provideService(login, connection_1.DBConnection, connection_1.DBConnectionLive);
    return effect_1.Effect.runPromise(runnable);
};
exports.login = login;
const register = (req, res) => {
    const username = (0, common_2.safeParseNonEmptyString)(req.body.username);
    const email = (0, common_2.safeParseNonEmptyString)(req.body.email);
    const password = (0, common_2.safeParseNonEmptyString)(req.body.password);
    const successMsgOrError = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({ username, email, password, pool: effect_1.Effect.succeed(pool) })), effect_1.Effect.flatMap(({ username, email, password, pool }) => {
        const saltRounds = 10;
        const hashedPassword = bcrypt_1.default.hashSync(password, saltRounds);
        // todo: check if user already exists first
        return (0, effect_1.pipe)((0, users_1.registerNewUserQuery)(username, email, hashedPassword, pool), effect_1.Effect.flatMap(({ email, confirmation_token }) => (0, sendConfirmationEmail_1.sendConfirmationEmail)({ email, confirmation_token })), effect_1.Effect.flatMap(() => effect_1.Effect.succeed("Email sent")));
    }), (dataOrError) => (0, responseHandlers_2.sendRegisterResponse)({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
        label: "successMsg",
    }));
    const runnable = effect_1.Effect.provideService(successMsgOrError, connection_1.DBConnection, connection_1.DBConnectionLive);
    return effect_1.Effect.runPromise(runnable);
};
exports.register = register;
const verify = (req, res) => {
    const confirmation_token = (0, common_2.safeParseNonEmptyString)(req.params.confirmation_token);
    const usernameOrError = connection_1.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool), effect_1.Effect.flatMap((pool) => effect_1.Effect.all({
        pool: effect_1.Effect.succeed(pool),
        confirmation_token: (0, common_2.safeParseNonEmptyString)(confirmation_token),
    })), effect_1.Effect.flatMap(({ confirmation_token, pool }) => (0, users_1.verifyUserQuery)(confirmation_token, pool)), effect_1.Effect.flatMap((username) => effect_1.Effect.succeed(`Verified ${username}. You can now log in with your account.`)), (dataOrError) => (0, responseHandlers_2.sendConfirmUserResponse)({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
        label: "message",
    }));
    const runnable = effect_1.Effect.provideService(usernameOrError, connection_1.DBConnection, connection_1.DBConnectionLive);
    return effect_1.Effect.runPromise(runnable);
};
exports.verify = verify;
const createAuthToken = (userId, username) => {
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
        throw new Error("JWT secret key not found");
    }
    const payload = {
        userId,
        username,
    };
    const expiresIn = "72h";
    const authToken = jsonwebtoken_1.default.sign(payload, secretKey, { expiresIn });
    return effect_1.Effect.succeed(authToken);
};
const getAuthToken = (username, passwordMatch, pool) => {
    return (0, effect_1.pipe)(effect_1.Effect.try({
        try: () => {
            if (!passwordMatch) {
                throw new Error();
            }
        },
        catch: () => new customErrors_1.AuthenticationError({
            message: "Invalid username or password",
        }),
    }), effect_1.Effect.flatMap(() => (0, users_1.getUserIdByUsernameQuery)(username, pool)), effect_1.Effect.flatMap((userId) => createAuthToken(userId, username)));
};
const authenticateUser = (username, password, pool) => {
    return (0, effect_1.pipe)((0, users_1.getHashedPasswordByUsernameQuery)(username, pool), effect_1.Effect.flatMap((hashedPassword) => (0, common_2.safeParseNonEmptyString)(hashedPassword)), effect_1.Effect.orElseFail(() => new customErrors_1.AuthenticationError({ message: "User not registered" })), effect_1.Effect.flatMap((hashedPassword) => effect_1.Effect.tryPromise({
        try: () => bcrypt_1.default.compare(password, hashedPassword),
        catch: (e) => new Error(`${e}`),
    })), effect_1.Effect.flatMap((passwordMatch) => getAuthToken(username, passwordMatch, pool)));
};
const auth = (req, res) => {
    var _a;
    // split on Bearer
    const authToken = (0, common_2.safeParseNonEmptyString)((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
    const userNameOrError = (0, effect_1.pipe)(authToken, effect_1.Effect.flatMap((authToken) => (0, utils_2.verifyJwt)(authToken, process.env.JWT_SECRET_KEY)), effect_1.Effect.flatMap((decoded) => (0, utils_2.safeParseJWT)(decoded)), effect_1.Effect.flatMap((decoded) => effect_1.Effect.succeed(decoded.username)));
    // todo type dataOrError so that connection not needed here as is not used
    const getUsername = connection_1.DBConnection.pipe(effect_1.Effect.flatMap(() => (0, responseHandlers_2.sendAuthenticatedUserResponse)({
        dataOrError: userNameOrError,
        res,
        successStatus: 200,
        label: "username",
    })));
    const runnable = effect_1.Effect.provideService(getUsername, connection_1.DBConnection, connection_1.DBConnectionLive);
    return effect_1.Effect.runPromise(runnable);
};
exports.auth = auth;
