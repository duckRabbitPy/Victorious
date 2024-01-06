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
import { Connection, ConnectionLive } from "../../db/connection";
import { Pool } from "pg";

export const createGameSession: RequestHandler = (req, res) => {
  const createGameSession = Connection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) =>
      Effect.all({
        pool: Effect.succeed(pool),
        room: safeParseNumber(req.body.room),
      })
    ),
    Effect.flatMap(({ pool, room }) => createGameSessionQuery(room, pool)),
    Effect.flatMap(safeParseGameState),
    (dataOrError) =>
      sendGameStateResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 201,
      })
  );

  const runnable = Effect.provideService(
    createGameSession,
    Connection,
    ConnectionLive
  );

  Effect.runPromise(runnable);
};

export const getOpenGameSessions: RequestHandler = (req, res) => {
  const getOpenGameSessions = Connection.pipe(
    Effect.flatMap((connection) => connection.pool),
    Effect.flatMap((pool) => getOpenGameSessionsQuery(pool)),
    Effect.flatMap((rooms) => safeParseNumberArray(rooms)),
    (dataOrError) =>
      sendOpenRoomsResponse({
        dataOrError: dataOrError,
        res,
        successStatus: 200,
      })
  );

  const runnable = Effect.provideService(
    getOpenGameSessions,
    Connection,
    ConnectionLive
  );

  Effect.runPromise(runnable);
};
