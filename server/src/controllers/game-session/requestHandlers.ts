import { RequestHandler } from "express";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { createGameSessionQuery, parseGameState } from "../../models/gamestate";
import { safeParseNumber } from "../../utils";
import { sendResponse } from "./responseHandler";

export const createGameSession: RequestHandler = (req, res) => {
  return pipe(
    safeParseNumber(Number(req.body.room)),
    Effect.flatMap((room) => createGameSessionQuery(room)),
    Effect.flatMap(parseGameState),
    (dataOrError) =>
      sendResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
      })
  );
};
