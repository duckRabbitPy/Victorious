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
exports.auth = exports.sendConfirmationEmail = exports.verify = exports.register = exports.login = void 0;
const Effect = __importStar(require("@effect/io/Effect"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const effect_1 = require("effect");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const customErrors_1 = require("../customErrors");
const users_1 = require("../../models/users");
const utils_1 = require("../../utils");
const nodemailer_1 = __importDefault(require("nodemailer"));
const responseHandlers_1 = require("../responseHandlers");
const common_1 = require("../../../../shared/common");
const server_1 = require("../../server");
const login = (req, res) => {
    const username = (0, common_1.safeParseNonEmptyString)(req.body.username);
    const password = (0, common_1.safeParseNonEmptyString)(req.body.password);
    const authToken = (0, effect_1.pipe)(Effect.all({ username, password }), Effect.flatMap(({ username, password }) => authenticateUser(username, password)));
    return (0, responseHandlers_1.sendLoginResponse)({
        dataOrError: authToken,
        res,
        successStatus: 200,
        label: "authToken",
    });
};
exports.login = login;
const register = (req, res) => {
    const username = (0, common_1.safeParseNonEmptyString)(req.body.username);
    const email = (0, common_1.safeParseNonEmptyString)(req.body.email);
    const password = (0, common_1.safeParseNonEmptyString)(req.body.password);
    const successMsgOrError = (0, effect_1.pipe)(Effect.all({ username, email, password }), Effect.flatMap(({ username, email, password }) => registerUser(username, email, password)));
    return (0, responseHandlers_1.sendRegisterResponse)({
        dataOrError: successMsgOrError,
        res,
        successStatus: 201,
        label: "message",
    });
};
exports.register = register;
const verify = (req, res) => {
    const confirmation_token = (0, common_1.safeParseNonEmptyString)(req.params.confirmation_token);
    const usernameOrError = (0, effect_1.pipe)(confirmation_token, Effect.flatMap((confirmation_token) => (0, users_1.verifyUserQuery)(confirmation_token)), Effect.flatMap((username) => Effect.succeed(`Verified ${username}. You can now log in with your account.`)));
    return (0, responseHandlers_1.sendConfirmUserResponse)({
        dataOrError: usernameOrError,
        res,
        successStatus: 201,
        label: "message",
    });
};
exports.verify = verify;
const registerUser = (username, email, password) => {
    const saltRounds = 10;
    const hashedPassword = bcrypt_1.default.hashSync(password, saltRounds);
    // todo: check if user already exists first
    return (0, effect_1.pipe)((0, users_1.registerNewUserQuery)(username, email, hashedPassword), Effect.flatMap(({ email, confirmation_token }) => (0, exports.sendConfirmationEmail)({ email, confirmation_token })), Effect.flatMap(() => Effect.succeed("Email sent")));
};
const comparePasswords = (password, hashedPassword) => {
    return Effect.tryPromise({
        try: () => bcrypt_1.default.compare(password, hashedPassword),
        catch: (e) => new Error(`${e}`),
    });
};
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
    return Effect.succeed(authToken);
};
const getAuthToken = (username, passwordMatch) => {
    return (0, effect_1.pipe)(Effect.try({
        try: () => {
            if (!passwordMatch) {
                throw new Error();
            }
        },
        catch: () => new customErrors_1.AuthenticationError({
            message: "Invalid username or password",
        }),
    }), Effect.flatMap(() => (0, users_1.getUserIdByUsernameQuery)(username)), Effect.flatMap((userId) => createAuthToken(userId, username)));
};
const authenticateUser = (username, password) => {
    return (0, effect_1.pipe)((0, users_1.getHashedPasswordByUsernameQuery)(username), Effect.flatMap((hashedPassword) => (0, common_1.safeParseNonEmptyString)(hashedPassword)), Effect.orElseFail(() => new customErrors_1.AuthenticationError({ message: "User not registered" })), Effect.flatMap((hashedPassword) => comparePasswords(password, hashedPassword)), Effect.flatMap((passwordMatch) => getAuthToken(username, passwordMatch)));
};
const sendConfirmationEmail = ({ email, confirmation_token, }) => Effect.tryPromise({
    try: () => {
        return new Promise((resolve, reject) => {
            const transporter = nodemailer_1.default.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: {
                    user: "duck.rabbit.python@gmail.com",
                    pass: `${process.env.GMAIL_APP_PASSWORD}`,
                },
            });
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: "Confirm your email",
                text: `Click the link to confirm your email: ${server_1.API_ENDPOINT}/register/confirm/${confirmation_token}`,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                else {
                    console.log("Email sent: " + info.response);
                    resolve(info.response);
                }
            });
            transporter.close();
        });
    },
    catch: () => new Error("Error sending confirmation email"),
});
exports.sendConfirmationEmail = sendConfirmationEmail;
const auth = (req, res) => {
    var _a;
    // split on Bearer
    const authToken = (0, common_1.safeParseNonEmptyString)((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]);
    const userNameOrError = (0, effect_1.pipe)(authToken, Effect.flatMap((authToken) => (0, utils_1.verifyJwt)(authToken, process.env.JWT_SECRET_KEY)), Effect.flatMap((decoded) => (0, utils_1.safeParseJWT)(decoded)), Effect.flatMap((decoded) => Effect.succeed(decoded.username)));
    return (0, responseHandlers_1.sendAuthenticatedUserResponse)({
        dataOrError: userNameOrError,
        res,
        successStatus: 200,
        label: "username",
    });
};
exports.auth = auth;
