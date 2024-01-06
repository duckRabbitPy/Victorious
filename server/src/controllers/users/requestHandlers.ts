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
import { SERVER_API_ENDPOINT } from "../../server";
import { Pool } from "pg";
import { Connection, ConnectionLive } from "../../db/connection";

export const login: RequestHandler = (req, res) => {
  const login = Connection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) =>
      Effect.all({
        username: safeParseNonEmptyString(req.body.username),
        password: safeParseNonEmptyString(req.body.password),
        pool: Effect.succeed(pool),
      })
    ),
    Effect.flatMap(({ username, password, pool }) =>
      authenticateUser(username, password, pool)
    ),
    (authToken) =>
      sendLoginResponse({
        dataOrError: authToken,
        res,
        successStatus: 200,
        label: "authToken",
      })
  );

  const runnable = Effect.provideService(login, Connection, ConnectionLive);

  return Effect.runPromise(runnable);
};

export const register: RequestHandler = (req, res) => {
  const username = safeParseNonEmptyString(req.body.username);
  const email = safeParseNonEmptyString(req.body.email);
  const password = safeParseNonEmptyString(req.body.password);

  const successMsgOrError = Connection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) =>
      Effect.all({ username, email, password, pool: Effect.succeed(pool) })
    ),
    Effect.flatMap(({ username, email, password, pool }) =>
      registerUser(username, email, password, pool)
    ),
    (dataOrError) =>
      sendRegisterResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
        label: "successMsg",
      })
  );

  const runnable = Effect.provideService(
    successMsgOrError,
    Connection,
    ConnectionLive
  );

  return Effect.runPromise(runnable);
};

export const verify: RequestHandler = (req, res) => {
  const confirmation_token = safeParseNonEmptyString(
    req.params.confirmation_token
  );

  const usernameOrError = Connection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) =>
      Effect.all({
        pool: Effect.succeed(pool),
        confirmation_token: safeParseNonEmptyString(confirmation_token),
      })
    ),
    Effect.flatMap(({ confirmation_token, pool }) =>
      verifyUserQuery(confirmation_token, pool)
    ),
    Effect.flatMap((username) =>
      Effect.succeed(
        `Verified ${username}. You can now log in with your account.`
      )
    ),
    (dataOrError) =>
      sendConfirmUserResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
        label: "message",
      })
  );

  const runnable = Effect.provideService(
    usernameOrError,
    Connection,
    ConnectionLive
  );

  return Effect.runPromise(runnable);
};

const registerUser = (
  username: string,
  email: string,
  password: string,
  pool: Pool
) => {
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  // todo: check if user already exists first

  return pipe(
    registerNewUserQuery(username, email, hashedPassword, pool),
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

const getAuthToken = (username: string, passwordMatch: boolean, pool: Pool) => {
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

    Effect.flatMap(() => getUserIdByUsernameQuery(username, pool)),
    Effect.flatMap((userId) => createAuthToken(userId, username))
  );
};

const authenticateUser = (username: string, password: string, pool: Pool) => {
  return pipe(
    getHashedPasswordByUsernameQuery(username, pool),
    Effect.flatMap((hashedPassword) => safeParseNonEmptyString(hashedPassword)),
    Effect.orElseFail(
      () => new AuthenticationError({ message: "User not registered" })
    ),
    Effect.flatMap((hashedPassword) =>
      comparePasswords(password, hashedPassword)
    ),
    Effect.flatMap((passwordMatch) =>
      getAuthToken(username, passwordMatch, pool)
    )
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
          text: `Click the link to confirm your email: ${SERVER_API_ENDPOINT}/register/confirm/${confirmation_token}`,
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

  // todo type dataOrError so that connection not needed here as is not used
  const getUsername = Connection.pipe(
    Effect.flatMap(() =>
      sendAuthenticatedUserResponse({
        dataOrError: userNameOrError,
        res,
        successStatus: 200,
        label: "username",
      })
    )
  );

  const runnable = Effect.provideService(
    getUsername,
    Connection,
    ConnectionLive
  );

  return Effect.runPromise(runnable);
};
