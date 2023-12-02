// avoid ts warning
/* eslint-disable no-unused-vars */
import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import { AuthenticationError, PostgresError } from "./customErrors";
import { Response } from "express";
import { pipe } from "effect";
import { GameState } from "../../../shared/commonTypes";

type DataOrError<T> = Effect.Effect<
  never,
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
      }),
      Effect.runPromise
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
