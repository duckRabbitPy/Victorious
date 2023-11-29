import { RequestHandler } from "express";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { createGameSessionQuery, parseGameState } from "../../models/gamestate";
import { sendResponse } from "./responseHandler";

export const safeParseNumber = Schema.parse(
  Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
);

export const safeParseUUIDs = Schema.parse(Schema.array(Schema.UUID));

export const createGameSession: RequestHandler = (req, res) => {
  return pipe(
    safeParseNumber(Number(req.body.room)),
    Effect.flatMap((room) => createGameSessionQuery(room)),
    Effect.tap((gameState) => Effect.log(JSON.stringify(gameState, null, 2))),
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
