import { RequestHandler } from "express";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import {
  getLatestGameSnapshotQuery,
  getOpenGameSessionsQuery,
} from "../../models/gamestate/queries";

import { safeParseNumber, safeParseNumberArray } from "../../utils";
import {
  sendGameStateResponse,
  sendOpenRoomsResponse,
} from "../responseHandlers";
import { createGameSessionQuery } from "../../models/gamestate/mutations";
import { safeParseGameState } from "../../../../shared/common";

export const createGameSession: RequestHandler = (req, res) => {
  return pipe(
    safeParseNumber(Number(req.body.room)),
    Effect.flatMap((room) => createGameSessionQuery(room)),
    Effect.flatMap(safeParseGameState),
    (dataOrError) =>
      sendGameStateResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
      })
  );
};

export const getLatestLiveGameSnapshot = ({ room }: { room: number }) => {
  return pipe(
    getLatestGameSnapshotQuery(room),
    Effect.flatMap(safeParseGameState)
  );
};

export const getOpenGameSessions: RequestHandler = (req, res) => {
  return pipe(
    getOpenGameSessionsQuery(),
    Effect.flatMap((rooms) => safeParseNumberArray(rooms)),
    (dataOrError) =>
      sendOpenRoomsResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
      })
  );
};
