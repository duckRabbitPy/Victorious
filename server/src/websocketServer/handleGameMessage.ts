import { pipe, Effect } from "effect";
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
} from "./inMemoryMutation/hand";

import { buyCard, resetBuysAndActions } from "./inMemoryMutation/buys";
import { incrementTurn } from "./inMemoryMutation/turn";
import { playAction } from "./inMemoryMutation/actions";
import {
  deduceVictoryPoints,
  determineIfGameIsOver,
} from "./inMemoryMutation/victory";
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

type handleGameMessageResult = Effect.Effect<
  never,
  PostgresError | IllegalGameStateError | ParseError,
  GameState
>;

export const handleGameMessage = ({
  msg,
  pool,
  userInfo,
}: handleGameMessageProps): handleGameMessageResult => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    Effect.flatMap(safeParseGameState)
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
        Effect.flatMap((currentGameState) =>
          addLivePlayerQuery({
            userInfo,
            currentGameState,
            pool,
          })
        ),
        Effect.flatMap(safeParseGameState)
      );
    }

    case SupportedEffects.startGame: {
      return pipe(
        currentGameState,
        Effect.flatMap((currentGameState) => dealToAllActors(currentGameState)),
        Effect.flatMap(resetBuysAndActions),
        Effect.flatMap(incrementTurn),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.incrementTurn: {
      return pipe(
        currentGameState,
        Effect.flatMap((currentGameState) => cleanUp(currentGameState)),
        Effect.flatMap(incrementTurn),
        Effect.flatMap(resetBuysAndActions),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.buyCard: {
      return pipe(
        Effect.all({
          currentGameState,
          cardName,
        }),
        Effect.flatMap(({ currentGameState, cardName }) =>
          buyCard({
            gameState: currentGameState,
            userId: userInfo.userId,
            cardName,
            toDiscardFromHand,
          })
        ),
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(determineIfGameIsOver),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.playTreasure: {
      return pipe(
        Effect.all({
          currentGameState,
          cardName,
        }),
        Effect.flatMap(({ currentGameState, cardName }) =>
          playTreasure({
            gameState: currentGameState,
            userId: userInfo.userId,
            cardName,
          })
        ),
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(determineIfGameIsOver),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.resetPlayedTreasures: {
      return pipe(
        currentGameState,
        Effect.flatMap((currentGameState) =>
          resetPlayedTreasures(currentGameState)
        ),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.playAction: {
      return pipe(
        Effect.all({
          currentGameState,
          cardName,
        }),
        Effect.flatMap(({ currentGameState, cardName }) =>
          playAction({
            gameState: currentGameState,
            userId: userInfo.userId,
            cardName,
            toDiscardFromHand,
          })
        ),
        Effect.flatMap(deduceVictoryPoints),
        Effect.flatMap(determineIfGameIsOver),
        Effect.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    default: {
      return currentGameState;
    }
  }
};
