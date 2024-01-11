import { pipe, Effect as E } from "effect";
import {
  addLivePlayerQuery,
  writeNewGameStateToDB,
} from "../models/gamestate/mutations";

import {
  ClientPayload,
  GameState,
  safeParseCardName,
  safeParseGameState,
  SupportedEffects,
} from "../../../shared/common";
import {
  cleanUp,
  dealToAllActors,
  playTreasure,
  resetPlayedTreasures,
} from "./evolve/hand";

import { buyCard, resetBuysAndActions } from "./evolve/buys";
import { incrementTurn } from "./evolve/turn";
import { playAction } from "./evolve/actions";
import { deduceVictoryPoints, determineIfGameIsOver } from "./evolve/victory";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import { IllegalGameStateError, PostgresError } from "../customErrors";
import { ParseError } from "@effect/schema/ParseResult";

type handleGameMessageProps = {
  msg: ClientPayload;
  pool: Pool;
  userInfo: {
    userId: string;
    username: string;
  };
};

export const handleGameMessage = ({
  msg,
  pool,
  userInfo,
}: handleGameMessageProps): E.Effect<
  never,
  PostgresError | ParseError | IllegalGameStateError | Error,
  GameState
> => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    E.flatMap(safeParseGameState)
  );

  const cardName = pipe(safeParseCardName(msg.cardName));
  const toDiscardFromHand = msg.toDiscardFromHand;

  // todo: validate that next effect permitted given current game state, e.g pass mutation index from frontend and compare to mutation index in db

  switch (msg.effect) {
    // read only operation
    case SupportedEffects.getCurrentGameState: {
      return currentGameState;
    }

    // mutation operations
    case SupportedEffects.addLivePlayer: {
      return pipe(
        currentGameState,
        E.flatMap((currentGameState) =>
          addLivePlayerQuery({
            userInfo,
            currentGameState,
            pool,
          })
        ),
        E.flatMap(safeParseGameState)
      );
    }

    case SupportedEffects.startGame: {
      return pipe(
        currentGameState,
        E.flatMap((currentGameState) => dealToAllActors(currentGameState)),
        E.flatMap(resetBuysAndActions),
        E.flatMap(incrementTurn),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.incrementTurn: {
      return pipe(
        currentGameState,
        E.flatMap((currentGameState) => cleanUp(currentGameState)),
        E.flatMap(incrementTurn),
        E.flatMap(resetBuysAndActions),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.buyCard: {
      return pipe(
        E.all({
          currentGameState,
          cardName,
        }),
        E.flatMap(({ currentGameState, cardName }) =>
          buyCard({
            gameState: currentGameState,
            userId: userInfo.userId,
            cardName,
            toDiscardFromHand,
          })
        ),
        E.flatMap(deduceVictoryPoints),
        E.flatMap(determineIfGameIsOver),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.playTreasure: {
      return pipe(
        E.all({
          currentGameState,
          cardName,
        }),
        E.flatMap(({ currentGameState, cardName }) =>
          playTreasure({
            gameState: currentGameState,
            userId: userInfo.userId,
            cardName,
          })
        ),
        E.flatMap(deduceVictoryPoints),
        E.flatMap(determineIfGameIsOver),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.resetPlayedTreasures: {
      return pipe(
        currentGameState,
        E.flatMap((currentGameState) => resetPlayedTreasures(currentGameState)),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.playAction: {
      return pipe(
        E.all({
          currentGameState,
          cardName,
        }),
        E.flatMap(({ currentGameState, cardName }) =>
          playAction({
            gameState: currentGameState,
            userId: userInfo.userId,
            cardName,
            toDiscardFromHand,
          })
        ),
        E.flatMap(deduceVictoryPoints),
        E.flatMap(determineIfGameIsOver),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    default: {
      return currentGameState;
    }
  }
};
