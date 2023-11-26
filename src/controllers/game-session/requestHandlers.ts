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
  const safeArgs = {
    room: safeParseNumber(Number(req.body.room)),
    userIds: safeParseUUIDs(req.body.userIds),
  };
  return pipe(
    Effect.all(safeArgs),
    Effect.flatMap(({ room, userIds }) =>
      createGameSessionQuery(room, userIds)
    ),
    Effect.flatMap(parseGameState),
    (getDataEffect) =>
      sendResponse({
        getDataEffect,
        response: res,
        successStatus: 201,
      })
  );
};
