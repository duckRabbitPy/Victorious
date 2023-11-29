import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import { GameState } from "../../../../shared/commonTypes";
import { PostgresError } from "../customErrors";
import { Response } from "express";

import { pipe } from "effect";

type sendResponseInput = {
  getDataEffect: Effect.Effect<never, ParseError | PostgresError, GameState>;
  response: Response;
  successStatus: number;
  redirect?: boolean;
};

const respondWithError = (
  response: Response,
  status: number,
  message: string,
  additionalInfo?: string
) =>
  pipe(
    Effect.succeed(
      response.status(status).json({
        message: `Fail: ${message}`,
        info: additionalInfo,
      })
    )
  );

export function sendResponse({
  getDataEffect,
  response,
  successStatus,
}: sendResponseInput) {
  return pipe(
    Effect.matchCauseEffect(getDataEffect, {
      onFailure: (cause) => {
        console.error(JSON.stringify(cause));
        switch (cause._tag) {
          //   case "Fail":
          //     if (cause.error._tag === "ItemNotFoundError") {
          //       return respondWithError(
          //         response,
          //         404,
          //         cause.error._tag,
          //         cause.error.message
          //       );
          //     }
          //     if (cause.error._tag === "ParameterError") {
          //       return respondWithError(
          //         response,
          //         400,
          //         cause.error._tag,
          //         cause.error.message
          //       );
          //     }
          //     return respondWithError(response, 500, cause.error._tag);
          case "Die":
          case "Interrupt":
            respondWithError(response, 500, "Internal server error");
        }
        return Effect.succeed(
          response.status(500).json("Internal Server error")
        );
      },
      onSuccess: (todos) => {
        return Effect.succeed(response.status(successStatus).json(todos));
      },
    }),
    Effect.runPromise
  );
}
