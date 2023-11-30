import * as Effect from "@effect/io/Effect";
import bcrypt from "bcrypt";
import { pipe } from "effect";
import jwt from "jsonwebtoken";
import { AuthenticationError } from "../customErrors";
import {
  getHashedPasswordByUsernameQuery,
  getUserIdByUsernameQuery,
} from "../../models/users";
import { safeParseNonEmptyString } from "../../utils";
import { RequestHandler } from "express";

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
