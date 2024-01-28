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

import { buyCard, gainCard, resetBuysAndActions } from "./evolve/buys";
import { incrementTurn } from "./evolve/turn";
import { playAction, trashCardToMeetDemand } from "./evolve/actions";
import { deduceVictoryPoints, determineIfGameIsOver } from "./evolve/victory";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import {
  CustomParseError,
  IllegalGameStateError,
  PostgresError,
} from "../customErrors";
import { ParseError } from "@effect/schema/ParseResult";
import { checkClientStateIsUptoDate, checkNotAlreadyInRoom } from "../utils";

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
  PostgresError | ParseError | IllegalGameStateError | Error | CustomParseError,
  GameState
> => {
  const currentGameState = pipe(
    getLatestGameSnapshotQuery(msg.room, pool),
    E.flatMap(safeParseGameState),
    E.flatMap((currentGameState) =>
      checkClientStateIsUptoDate({
        currentGameState,
        msg,
      })
    )
  );

  const cardName = pipe(
    safeParseCardName(msg.cardName),
    E.orElseFail(
      () =>
        new CustomParseError({ message: "Invalid card name in client payload" })
    )
  );
  const toDiscardFromHand = msg.toDiscardFromHand;

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
          checkNotAlreadyInRoom({ currentGameState, userInfo })
        ),
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
        E.flatMap((gamestate) => incrementTurn(gamestate, userInfo.username)),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.incrementTurn: {
      return pipe(
        currentGameState,
        E.flatMap((currentGameState) => cleanUp(currentGameState)),
        E.flatMap((gamestate) => incrementTurn(gamestate, userInfo.username)),
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

    case SupportedEffects.gainCard: {
      return pipe(
        E.all({
          currentGameState,
          cardName,
        }),
        E.flatMap(({ currentGameState, cardName }) =>
          gainCard({
            gameState: currentGameState,
            cardName,
            userId: userInfo.userId,
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

    case SupportedEffects.trashCardToMeetDemand: {
      return pipe(
        E.all({
          currentGameState,
          cardName,
        }),
        E.flatMap(({ currentGameState, cardName }) =>
          trashCardToMeetDemand({
            userId: userInfo.userId,
            gameState: currentGameState,
            toTrash: cardName,
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
