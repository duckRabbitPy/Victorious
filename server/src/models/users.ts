import { Effect as E } from "effect";
import { PostgresError, RegistrationError } from "../customErrors";
import { logAndThrowError } from "../utils";
import { uuidv4 } from "../../../shared/utils";
import { Pool } from "pg";

export const isVerifiedUserQuery = (username: string, pool: Pool) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT verified FROM users WHERE username = $1",
        [username]
      );
      return !!result.rows[0]?.verified;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retry({ times: 1 }));
};

export const getHashedPasswordByUsernameQuery = (
  username: string,
  pool: Pool
) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT password FROM users WHERE username = $1",
        [username]
      );

      return result.rows[0].password;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retry({ times: 1 }));
};

export const getUserIdByUsernameQuery = (username: string, pool: Pool) => {
  const get = async () => {
    try {
      const result = await pool.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username]
      );

      return result.rows[0].user_id;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retry({ times: 1 }));
};

export const getAllRegisteredUserNamesQuery = (pool: Pool) => {
  const get = async () => {
    try {
      const result = await pool.query("SELECT username FROM users");

      return result.rows.map((row) => row.username);
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => get(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retry({ times: 1 }));
};

export const registerNewUserQuery = (
  username: string,
  email: string,
  hashedPassword: string,
  pool: Pool
) => {
  const add = async () => {
    try {
      const confirmation_token = uuidv4();

      const result = await pool.query(
        "INSERT INTO users (username, password, email, confirmation_token) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, confirmation_token",
        [username, hashedPassword, email, confirmation_token]
      );

      return result.rows[0];
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => add(),
    catch: () =>
      new RegistrationError({
        message: "Error registering user, email and usernames must be unique",
      }),
  }).pipe(E.retry({ times: 1 }));
};

export const verifyUserQuery = (confirmation_token: string, pool: Pool) => {
  const confirm = async () => {
    try {
      const result = await pool.query(
        "UPDATE users SET verified = true WHERE confirmation_token = $1 RETURNING username",
        [confirmation_token]
      );

      return result.rows[0].username;
    } catch (error) {
      logAndThrowError(error);
    }
  };

  return E.tryPromise({
    try: () => confirm(),
    catch: () => new PostgresError({ message: "postgres query error" }),
  }).pipe(E.retry({ times: 1 }));
};
