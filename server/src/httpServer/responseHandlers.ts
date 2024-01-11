import { pipe, Effect as E } from "effect";
import { ParseError } from "@effect/schema/ParseResult";
import {
  AuthenticationError,
  IllegalGameStateError,
  PostgresError,
} from "../customErrors";
import { Response } from "express";
import { GameState } from "../../../shared/common";
import { DBConnection } from "../db/connection";

type DataOrError<T> = E.Effect<
  DBConnection,
  | ParseError
  | PostgresError
  | AuthenticationError
  | IllegalGameStateError
  | Error,
  T
>;

type SendResponseProps<T> = {
  dataOrError: DataOrError<T>;
  res: Response;
  successStatus: number;
  label?: string;
};

const createResponseHandler =
  <T>(onSuccess: (data: T) => unknown) =>
  ({ dataOrError, res, successStatus, label }: SendResponseProps<T>) =>
    pipe(
      E.matchCauseEffect(dataOrError, {
        onFailure: (cause) => {
          console.error(JSON.stringify(cause));
          switch (cause._tag) {
            case "Die":
            case "Interrupt":
              respondWithError(res, 500, "Internal server error");
          }
          return E.succeed(res.status(500).json("Internal Server error"));
        },
        onSuccess: (data) =>
          E.succeed(
            res
              .status(successStatus)
              .json({ [label ?? "data"]: onSuccess(data) })
          ),
      })
    );

export const sendLoginResponse = createResponseHandler<string>(
  (authToken) => authToken
);

export const sendRegisterResponse = createResponseHandler<string>(
  (successMsg) => ({
    successMsg,
  })
);

export const sendConfirmUserResponse = createResponseHandler<string>(
  (confirmMessage) => ({
    confirmMessage,
  })
);

export const sendGameStateResponse = createResponseHandler<GameState>(
  (gameState) => ({
    gameState,
  })
);

export const sendOpenRoomsResponse = createResponseHandler<readonly number[]>(
  (openRooms) => ({
    openRooms,
  })
);

export const sendAuthenticatedUserResponse = createResponseHandler<string>(
  (username) => username
);

const respondWithError = (
  res: Response,
  status: number,
  message: string,
  additionalInfo?: string
) =>
  pipe(
    E.succeed(
      res.status(status).json({
        message: `Fail: ${message}`,
        info: additionalInfo,
      })
    )
  );
