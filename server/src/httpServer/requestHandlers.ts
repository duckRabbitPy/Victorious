import { Request, RequestHandler } from "express";
import { pipe, Effect as E, Effect } from "effect";
import { getOpenGameSessionsQuery } from "../models/gamestate/queries";
import path from "path";
import {
  safeParseBoolean,
  safeParseNumber,
  safeParseNumberArray,
} from "../utils";
import {
  respondWithError,
  sendGameStateResponse,
  sendOpenRoomsResponse,
} from "./responseHandlers";
import {
  createGameSessionQuery,
  endStaleGameSessionsMutation,
} from "../models/gamestate/mutations";
import { botNamePrefixes, safeParseGameState } from "../../../shared/common";
import { DBConnection, DBConnectionLive } from "../db/connection";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  CustomClientPayloadParseError,
  RegistrationError,
} from "../customErrors";
import {
  isVerifiedUserQuery,
  getAllRegisteredUserNamesQuery,
  getHashedPasswordByUsernameQuery,
  getUserIdByUsernameQuery,
  registerNewUserQuery,
  verifyUserQuery,
} from "../models/users";

import { safeParseJWT, verifyJwt } from "../utils";
import {
  sendAuthenticatedUserResponse,
  sendLoginResponse,
  sendRegisterResponse,
} from "./responseHandlers";

import { safeParseNonEmptyString } from "../../../shared/common";
import { Pool } from "pg";
import { sendConfirmationEmail } from "./sendConfirmationEmail";
import { NEW_API_TEST_USER } from "../test/helpers";

const checkHasValidToken = (req: Request, pool: Pool) => {
  return pipe(
    req.headers.authorization?.split(" ")[1],
    safeParseNonEmptyString,
    E.flatMap((authToken) => verifyJwt(authToken, process.env.JWT_SECRET_KEY)),
    E.flatMap((decoded) => safeParseJWT(decoded)),
    E.flatMap(() => E.succeed(pool)),
    E.orElseFail(
      () =>
        new AuthenticationError({
          message: "Invalid or missing token, retry login for fresh token",
        })
    )
  );
};

export const createGameSession: RequestHandler = (req, res) => {
  safeParseNonEmptyString(req.headers.authorization);
  const createGameSession = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) => checkHasValidToken(req, pool)),
    E.flatMap((pool) => endStaleGameSessionsMutation(pool)),
    E.flatMap((pool) =>
      E.all({
        pool: E.succeed(pool),
        room: safeParseNumber(req.body.room).pipe(
          E.orElseFail(
            () =>
              new CustomClientPayloadParseError({
                message: "Room number must be a positive integer",
              })
          )
        ),
      })
    ),
    E.flatMap(({ pool, room }) => createGameSessionQuery(room, pool)),
    E.flatMap(safeParseGameState),
    (dataOrError) =>
      sendGameStateResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
      })
  );

  const runnable = E.provide(createGameSession, DBConnectionLive);

  E.runPromise(runnable);
};

export const getOpenGameSessions: RequestHandler = (req, res) => {
  const getOpenGameSessions = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) => checkHasValidToken(req, pool)),
    E.flatMap((pool) => endStaleGameSessionsMutation(pool)),
    E.flatMap((pool) => getOpenGameSessionsQuery(pool)),
    E.flatMap((rooms) => safeParseNumberArray(rooms)),
    (dataOrError) =>
      sendOpenRoomsResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
      })
  );

  const runnable = E.provide(getOpenGameSessions, DBConnectionLive);

  E.runPromise(runnable);
};

export const login: RequestHandler = (req, res) => {
  const login = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) =>
      E.all({
        username: safeParseNonEmptyString(req.body.username),
        password: safeParseNonEmptyString(req.body.password),
        pool: E.succeed(pool),
      })
    ),
    E.flatMap(({ username, password, pool }) =>
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

  const runnable = E.provide(login, DBConnectionLive);

  return E.runPromise(runnable);
};

export const register: RequestHandler = (req, res) => {
  const username = safeParseNonEmptyString(req.body.username);
  const email = safeParseNonEmptyString(req.body.email);
  const password = safeParseNonEmptyString(req.body.password);

  const successMsgOrError = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) =>
      E.all({ username, email, password, pool: E.succeed(pool) })
    ),
    E.flatMap(({ username, email, password, pool }) => {
      const saltRounds = 10;
      const hashedPassword = bcrypt.hashSync(password, saltRounds);

      return pipe(
        getAllRegisteredUserNamesQuery(pool),
        E.flatMap((usernames) => {
          const conflictWithBotNames =
            botNamePrefixes.includes(username) ||
            botNamePrefixes.some((botName) => username.includes(botName));
          if (
            (usernames && usernames.includes(username)) ||
            conflictWithBotNames
          ) {
            return E.fail(
              new RegistrationError({
                message: "Username is reserved or taken",
              })
            );
          }
          return E.unit;
        }),
        E.flatMap(() =>
          registerNewUserQuery(username, email, hashedPassword, pool)
        ),
        E.flatMap(({ email, confirmation_token }) => {
          if (
            !email.includes("@bot") &&
            !email.includes(NEW_API_TEST_USER.email)
          ) {
            return sendConfirmationEmail({ email, confirmation_token });
          }

          return E.succeed("skipping email sending for bots");
        }),
        E.flatMap(() => E.succeed("Email sent"))
      );
    }),
    (dataOrError) =>
      sendRegisterResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
        label: "successMsg",
      })
  );

  const runnable = E.provide(successMsgOrError, DBConnectionLive);

  E.runPromise(runnable);
};

export const verify: RequestHandler = (req, res) => {
  const usernameOrError = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) =>
      E.all({
        pool: E.succeed(pool),
        confirmation_token: safeParseNonEmptyString(
          req.params.confirmation_token
        ),
      })
    ),
    E.flatMap(({ confirmation_token, pool }) =>
      verifyUserQuery(confirmation_token, pool)
    ),
    E.flatMap(() =>
      E.succeed(
        res.sendFile(
          path.join(process.cwd(), "server/src/httpServer/userVerfied.html")
        )
      )
    ),
    E.orElseFail(() => respondWithError(res, 500, "Internal server error"))
  );

  const runnable = E.provide(usernameOrError, DBConnectionLive);

  return E.runPromise(runnable);
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

  return E.succeed(authToken);
};

const getAuthToken = (username: string, passwordMatch: boolean, pool: Pool) => {
  return pipe(
    E.try({
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

    E.flatMap(() => getUserIdByUsernameQuery(username, pool)),
    E.flatMap((userId) => createAuthToken(userId, username))
  );
};

const authenticateUser = (username: string, password: string, pool: Pool) => {
  return pipe(
    isVerifiedUserQuery(username, pool),
    E.flatMap((verified) => safeParseBoolean(verified)),
    E.flatMap((verified) => {
      if (!verified) {
        return E.fail(
          new AuthenticationError({
            message: "User not verified",
          })
        );
      }
      return pipe(
        getHashedPasswordByUsernameQuery(username, pool),
        E.flatMap((hashedPassword) => safeParseNonEmptyString(hashedPassword)),
        E.orElseFail(
          () =>
            new AuthenticationError({ message: "password not found for user" })
        )
      );
    }),
    E.flatMap((hashedPassword) =>
      E.tryPromise({
        try: () => bcrypt.compare(password, hashedPassword),
        catch: (e) => new Error(`${e}`),
      })
    ),
    E.flatMap((passwordMatch) => getAuthToken(username, passwordMatch, pool))
  );
};

export const auth: RequestHandler = (req, res) => {
  // split on Bearer
  const authToken = safeParseNonEmptyString(
    req.headers.authorization?.split(" ")[1]
  );

  const userNameOrError = pipe(
    authToken,
    E.flatMap((authToken) => verifyJwt(authToken, process.env.JWT_SECRET_KEY)),
    E.flatMap((decoded) => safeParseJWT(decoded)),
    E.flatMap((decoded) => E.succeed(decoded.username))
  );

  // todo type dataOrError so that connection not needed here as is not used
  const getUsername = DBConnection.pipe(
    E.flatMap(() =>
      sendAuthenticatedUserResponse({
        dataOrError: userNameOrError,
        res,
        successStatus: 200,
        label: "username",
      })
    )
  );

  const runnable = E.provide(getUsername, DBConnectionLive);

  return E.runPromise(runnable);
};
