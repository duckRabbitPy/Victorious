import { RequestHandler } from "express";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { createGameSessionQuery, parseGameState } from "../../models/gamestate";
import { sendResponse } from "./responseHandler";
import { safeParseNumber } from "../../utils";

export const createGameSession: RequestHandler = (req, res) => {
  return pipe(
    safeParseNumber(Number(req.body.room)),
    Effect.flatMap((room) => createGameSessionQuery(room)),
    Effect.flatMap(parseGameState),
    (getDataEffect) =>
      sendResponse({
        getDataEffect,
        response: res,
        successStatus: 201,
        redirect: true,
      })
  );
};
