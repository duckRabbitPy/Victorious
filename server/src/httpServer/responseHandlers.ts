import { pipe, Effect as E } from "effect";
import { ParseError } from "@effect/schema/ParseResult";
import { ServerError } from "../customErrors";
import { Response } from "express";
import { GameState } from "../../../shared/common";
import { DBConnection } from "../db/connection";

type DataOrError<T> = E.Effect<DBConnection, ParseError | ServerError, T>;

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
      dataOrError,
      E.flatMap((data) => {
        return E.succeed(
          res.status(successStatus).json({ [label ?? "data"]: onSuccess(data) })
        );
      }),
      E.catchAll((error) => {
        const errorMessage =
          "message" in error
            ? error.message
            : "An unknown server error occured";

        console.log("error", error);
        return respondWithError(res, 500, errorMessage);
      })
    );

export const sendLoginResponse = createResponseHandler<string>(
  (authToken) => authToken
);

export const sendRegisterResponse = createResponseHandler<string>(
  (successMsg) => successMsg
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

export const respondWithError = (
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
