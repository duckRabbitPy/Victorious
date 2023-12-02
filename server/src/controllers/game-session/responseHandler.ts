import * as Effect from "@effect/io/Effect";
import { ParseError } from "@effect/schema/ParseResult";
import { GameState } from "../../../../shared/commonTypes";
import { PostgresError } from "../customErrors";
import { Response } from "express";

import { pipe } from "effect";

type GameStateOrError = Effect.Effect<
  never,
  ParseError | PostgresError,
  GameState
>;

type sendResponseProps = {
  dataOrError: GameStateOrError;
  res: Response;
  successStatus: number;
};

export function sendResponse({
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
      onSuccess: (game_state) => {
        return Effect.succeed(res.status(successStatus).json(game_state));
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
