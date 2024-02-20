import { pipe, Effect as E, Effect } from "effect";
import {
  addLivePlayerQuery,
  writeNewGameStateToDB,
} from "../models/gamestate/mutations";

import {
  botNamePrefixes,
  ClientPayload,
  GameState,
  safeParseCardName,
  safeParseGameState,
  safeParseRegisterResult,
  SupportedEffects,
} from "../../../shared/common";
import {
  cleanUp,
  dealToAllActors,
  playTreasure,
  resetPlayedTreasures,
} from "./evolve/hand";

import { handleIfBotPlayerTurn } from "./evolve/bots";
import { buyCard, gainCard, resetBuysAndActions } from "./evolve/buys";
import { incrementTurn } from "./evolve/turn";
import {
  goToBuyPhase,
  playAction,
  trashCardToMeetDemand,
} from "./evolve/actions";
import { deduceVictoryPoints, determineIfGameIsOver } from "./evolve/victory";
import { Pool } from "pg";
import { getLatestGameSnapshotQuery } from "../models/gamestate/queries";
import {
  CustomParseError,
  DebounceError,
  IllegalGameStateError,
  PostgresError,
  RegistrationError,
} from "../customErrors";
import { ParseError } from "@effect/schema/ParseResult";
import {
  checkClientStateIsUptoDate,
  checkEnoughPlayers,
  checkNotAlreadyInRoom,
} from "../utils";
import { uuidv4 } from "../../../shared/utils";
import { registerNewUserQuery } from "../models/users";

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
  | PostgresError
  | ParseError
  | IllegalGameStateError
  | DebounceError
  | Error
  | CustomParseError
  // can occur when registering bots in game
  | RegistrationError,
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

    case SupportedEffects.addBotPlayer: {
      const botUserName = `${
        botNamePrefixes[Math.floor(Math.random() * botNamePrefixes.length)]
      }${Math.floor(Math.random() * 1000) + 1}`;

      const newBotUserInfo = pipe(
        registerNewUserQuery(
          botUserName,
          `bot${uuidv4()}@botemail.com`,
          uuidv4(),
          pool
        ),
        E.flatMap(safeParseRegisterResult),
        E.flatMap((botRegistrationInfo) => {
          return E.succeed({
            userId: botRegistrationInfo.user_id,
            username: botRegistrationInfo.username,
          });
        })
      );

      return pipe(
        Effect.all({
          newBotUserInfo,
          currentGameState,
        }),
        E.flatMap(({ newBotUserInfo, currentGameState }) =>
          addLivePlayerQuery({
            userInfo: newBotUserInfo,
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
        E.flatMap(checkEnoughPlayers),
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
        E.flatMap(deduceVictoryPoints),
        E.flatMap(resetBuysAndActions),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.endActions: {
      return pipe(
        currentGameState,
        E.flatMap((currentGameState) => goToBuyPhase(currentGameState)),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
      );
    }

    case SupportedEffects.handleBotPlayerTurn: {
      return pipe(
        currentGameState,
        E.flatMap((gamestate) => handleIfBotPlayerTurn(gamestate, pool)),
        E.flatMap((postBuyPhaseGamestate) => cleanUp(postBuyPhaseGamestate)),
        E.flatMap((gamestate) =>
          incrementTurn(
            gamestate,
            gamestate.actor_state[gamestate.turn % gamestate.actor_state.length]
              .name
          )
        ),
        E.flatMap(resetBuysAndActions),
        E.flatMap((postIncrementGamestate) =>
          writeNewGameStateToDB(postIncrementGamestate, pool)
        )
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
