import { pipe, Effect } from "effect";
import { ParseError } from "@effect/schema/ParseResult";
import { AuthenticationError, PostgresError } from "../customErrors";
import { Response } from "express";
import { GameState } from "../../../shared/common";
import { DBConnection } from "../db/connection";

type DataOrError<T> = Effect.Effect<
  DBConnection,
  ParseError | PostgresError | AuthenticationError | Error,
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
      Effect.matchCauseEffect(dataOrError, {
        onFailure: (cause) => {
          console.error(JSON.stringify(cause));
          switch (cause._tag) {
            case "Die":
            case "Interrupt":
              respondWithError(res, 500, "Internal server error");
          }
          return Effect.succeed(res.status(500).json("Internal Server error"));
        },
        onSuccess: (data) =>
          Effect.succeed(
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
    Effect.succeed(
      res.status(status).json({
        message: `Fail: ${message}`,
        info: additionalInfo,
      })
    )
  );
