import * as Effect from "@effect/io/Effect";
import bcrypt from "bcrypt";
import { pipe } from "effect";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../customErrors";
import {
  confirmUserQuery,
  getHashedPasswordByUsernameQuery,
  getUserIdByUsernameQuery,
  registerNewUserQuery,
} from "../../models/users";
import { safeParseNonEmptyString } from "../../utils";
import { RequestHandler } from "express";
import nodemailer from "nodemailer";

export const login: RequestHandler = (req, res) => {
  const userName = safeParseNonEmptyString(req.body.userName);
  const password = safeParseNonEmptyString(req.body.password);

  return pipe(
    Effect.all({ userName, password }),
    Effect.flatMap(({ userName, password }) =>
      authenticateUser(userName, password)
    ),
    Effect.flatMap((authToken) =>
      Effect.succeed(res.status(200).json({ authToken }))
    )
  );
};

export const register: RequestHandler = (req, res) => {
  const userName = safeParseNonEmptyString(req.body.userName);
  const email = safeParseNonEmptyString(req.body.email);
  const password = safeParseNonEmptyString(req.body.password);

  return pipe(
    Effect.all({ userName, email, password }),
    Effect.flatMap(({ userName, email, password }) =>
      registerUser(userName, email, password)
    ),
    Effect.flatMap((authToken) =>
      Effect.succeed(res.status(200).json({ authToken }))
    )
  );
};

const registerUser = (username: string, email: string, password: string) => {
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  // todo: check if user already exists

  return pipe(
    registerNewUserQuery(username, hashedPassword),
    Effect.flatMap((res) =>
      Effect.all({
        email: safeParseNonEmptyString(res.email),
        confirmation_token: safeParseNonEmptyString(res.confirmation_token),
      })
    ),
    Effect.flatMap(({ email, confirmation_token }) =>
      sendConfirmationEmail({ email, confirmation_token })
    )
  );
};

export const confirmAccount: RequestHandler = (req, res) => {
  const confirmation_token = safeParseNonEmptyString(
    req.query.confirmation_token
  );
  const email = safeParseNonEmptyString(req.query.email);

  return pipe(
    Effect.all({ confirmation_token, email }),
    Effect.flatMap(({ confirmation_token, email }) =>
      confirmUserQuery(confirmation_token, email)
    ),
    Effect.flatMap((authToken) =>
      Effect.succeed(res.status(200).json({ authToken }))
    )
  );
};

const comparePasswords = (password: string, hashedPassword: string) => {
  return Effect.tryPromise({
    try: () => bcrypt.compare(password, hashedPassword),
    catch: (e) => new Error(`${e}`),
  });
};

const createAuthToken = (userId: string) => {
  const secretKey = process.env.JWT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("JWT secret key not found");
  }

  const payload = {
    userId: userId,
  };

  const expiresIn = "24h";

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
    Effect.flatMap((userId) => createAuthToken(userId))
  );
};

const authenticateUser = (username: string, password: string) => {
  return pipe(
    getUserIdByUsernameQuery(username),
    Effect.flatMap((userId) => getHashedPasswordByUsernameQuery(userId)),
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

const sendConfirmationEmail = ({
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
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Confirm your email",
          text: `Click the link to confirm your email: http://localhost:3000/confirm/${confirmation_token}`,
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
      });
    },
    catch: () => new Error("Error sending confirmation email"),
  });
