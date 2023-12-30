import * as Effect from "@effect/io/Effect";
import bcrypt from "bcrypt";
import { pipe } from "effect";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../customErrors";
import {
  getHashedPasswordByUsernameQuery,
  getUserIdByUsernameQuery,
  registerNewUserQuery,
  verifyUserQuery,
} from "../../models/users";

import { safeParseJWT, verifyJwt } from "../../utils";
import { RequestHandler } from "express";
import nodemailer from "nodemailer";
import {
  sendConfirmUserResponse,
  sendAuthenticatedUserResponse,
  sendLoginResponse,
  sendRegisterResponse,
} from "../responseHandlers";
import { safeParseNonEmptyString } from "../../../../shared/common";

export const login: RequestHandler = (req, res) => {
  const username = safeParseNonEmptyString(req.body.username);
  const password = safeParseNonEmptyString(req.body.password);

  const authToken = pipe(
    Effect.all({ username, password }),
    Effect.flatMap(({ username, password }) =>
      authenticateUser(username, password)
    )
  );

  return sendLoginResponse({
    dataOrError: authToken,
    res,
    successStatus: 200,
    label: "authToken",
  });
};

export const register: RequestHandler = (req, res) => {
  const username = safeParseNonEmptyString(req.body.username);
  const email = safeParseNonEmptyString(req.body.email);
  const password = safeParseNonEmptyString(req.body.password);

  const successMsgOrError = pipe(
    Effect.all({ username, email, password }),
    Effect.flatMap(({ username, email, password }) =>
      registerUser(username, email, password)
    )
  );

  return sendRegisterResponse({
    dataOrError: successMsgOrError,
    res,
    successStatus: 201,
    label: "message",
  });
};

export const verify: RequestHandler = (req, res) => {
  const confirmation_token = safeParseNonEmptyString(
    req.params.confirmation_token
  );

  const usernameOrError = pipe(
    confirmation_token,
    Effect.flatMap((confirmation_token) => verifyUserQuery(confirmation_token)),
    Effect.flatMap((username) =>
      Effect.succeed(
        `Verified ${username}. You can now log in with your account.`
      )
    )
  );

  return sendConfirmUserResponse({
    dataOrError: usernameOrError,
    res,
    successStatus: 201,
    label: "message",
  });
};

const registerUser = (username: string, email: string, password: string) => {
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  // todo: check if user already exists first

  return pipe(
    registerNewUserQuery(username, email, hashedPassword),
    Effect.flatMap(({ email, confirmation_token }) =>
      sendConfirmationEmail({ email, confirmation_token })
    ),
    Effect.flatMap(() => Effect.succeed("Email sent"))
  );
};

const comparePasswords = (password: string, hashedPassword: string) => {
  return Effect.tryPromise({
    try: () => bcrypt.compare(password, hashedPassword),
    catch: (e) => new Error(`${e}`),
  });
};

const createAuthToken = (userId: string, username: string) => {
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("JWT secret key not found");
  }

  const payload = {
    userId,
    username,
  };

  const expiresIn = "72h";

  const authToken = jwt.sign(payload, secretKey, { expiresIn });

  return Effect.succeed(authToken);
};

const getAuthToken = (username: string, passwordMatch: boolean) => {
  return pipe(
    Effect.try({
      try: () => {
        if (!passwordMatch) {
          throw new Error();
        }
      },
      catch: () =>
        new AuthenticationError({
          message: "Invalid username or password",
        }),
    }),

    Effect.flatMap(() => getUserIdByUsernameQuery(username)),
    Effect.flatMap((userId) => createAuthToken(userId, username))
  );
};

const authenticateUser = (username: string, password: string) => {
  return pipe(
    getHashedPasswordByUsernameQuery(username),
    Effect.flatMap((hashedPassword) => safeParseNonEmptyString(hashedPassword)),
    Effect.orElseFail(
      () => new AuthenticationError({ message: "User not registered" })
    ),
    Effect.flatMap((hashedPassword) =>
      comparePasswords(password, hashedPassword)
    ),
    Effect.flatMap((passwordMatch) => getAuthToken(username, passwordMatch))
  );
};

export const sendConfirmationEmail = ({
  email,
  confirmation_token,
}: {
  email: string;
  confirmation_token: string;
}) =>
  Effect.tryPromise({
    try: () => {
      return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
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
          text: `Click the link to confirm your email: http://localhost:3000/api/register/confirm/${confirmation_token}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("Email sent: " + info.response);
            resolve(info.response);
          }
        });

        transporter.close();
      });
    },
    catch: () => new Error("Error sending confirmation email"),
  });

export const auth: RequestHandler = (req, res) => {
  // split on Bearer
  const authToken = safeParseNonEmptyString(
    req.headers.authorization?.split(" ")[1]
  );

  const userNameOrError = pipe(
    authToken,
    Effect.flatMap((authToken) =>
      verifyJwt(authToken, process.env.JWT_SECRET_KEY)
    ),
    Effect.flatMap((decoded) => safeParseJWT(decoded)),
    Effect.flatMap((decoded) => Effect.succeed(decoded.username))
  );

  return sendAuthenticatedUserResponse({
    dataOrError: userNameOrError,
    res,
    successStatus: 200,
    label: "username",
  });
};
