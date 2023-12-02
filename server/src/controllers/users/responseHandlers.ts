import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import { AuthenticationError, PostgresError } from "../customErrors";
import { Response } from "express";

import { pipe } from "effect";

type AuthtokenOrError = Effect.Effect<
  never,
  ParseError | PostgresError | AuthenticationError | Error,
  string
>;

type sendResponseProps = {
  dataOrError: AuthtokenOrError;
  res: Response;
  successStatus: number;
};

export function sendLoginResponse({
  dataOrError: dataOrErrorEffect,
  res,
  successStatus,
}: sendResponseProps) {
  return pipe(
    Effect.matchCauseEffect(dataOrErrorEffect, {
      onFailure: (cause) => {
        console.error(JSON.stringify(cause));
        switch (cause._tag) {
          case "Die":
          case "Interrupt":
            respondWithError(res, 500, "Internal server error");
        }
        return Effect.succeed(res.status(500).json("Internal Server error"));
      },
      onSuccess: (authToken) => {
        return Effect.succeed(res.status(successStatus).json(authToken));
      },
    }),
    Effect.runPromise
  );
}

export function sendRegisterResponse({
  dataOrError: dataOrErrorEffect,
  res,
  successStatus,
}: sendResponseProps) {
  return pipe(
    Effect.matchCauseEffect(dataOrErrorEffect, {
      onFailure: (cause) => {
        console.error(JSON.stringify(cause));
        switch (cause._tag) {
          case "Die":
          case "Interrupt":
            respondWithError(res, 500, "Internal server error");
        }
        return Effect.succeed(res.status(500).json("Internal Server error"));
      },
      onSuccess: (successMsg) => {
        return Effect.succeed(res.status(successStatus).json({ successMsg }));
      },
    }),
    Effect.runPromise
  );
}
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
