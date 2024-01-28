import { Pool } from "pg";
import { Effect as E, pipe } from "effect";
import {
  CardName,
  GameState,
  Phases,
  botNamePrefixes,
  cardNameToCard,
  getTreasureValue,
} from "../../../../shared/common";
import { isUsersTurn } from "../../../../shared/utils";
import { buyCard, resetBuysAndActions } from "./buys";
import { IllegalGameStateError, PostgresError } from "../../customErrors";
import { writeNewGameStateToDB } from "../../models/gamestate/mutations";
import { ParseError } from "@effect/schema/ParseResult";
import { cleanUp, playTreasure } from "./hand";
import { incrementTurn } from "./turn";
import { playAction } from "./actions";

export const handleIfBotPlayerTurn = (
  gameState: GameState,
  pool: Pool
): E.Effect<
  never,
  IllegalGameStateError | ParseError | PostgresError,
  GameState
> => {
  const currentActorGameState =
    gameState.actor_state[gameState.turn % gameState.actor_state.length];

  const currentPlayerIsBot = botNamePrefixes.some((prefix) =>
    currentActorGameState.name.startsWith(prefix)
  );

  if (!currentPlayerIsBot || !currentActorGameState) {
    return E.succeed(gameState);
  }

  // first turn of game
  if (gameState.turn === 0) {
    return pipe(
      cleanUp(gameState),
      E.flatMap((gamestate) =>
        incrementTurn(gamestate, currentActorGameState.name)
      ),
      E.flatMap(resetBuysAndActions),
      E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
    );
  }

  // actionPhase
  if (
    currentActorGameState.phase === Phases.Action &&
    currentActorGameState.actions > 0
  ) {
    const actionCardsInHand = Object.entries(currentActorGameState.hand).filter(
      ([cardName, count]) =>
        cardNameToCard(cardName as CardName).type === "action" && count > 0
    ) as [CardName, number][];

    if (actionCardsInHand.length > 0) {
      const randomIndex = Math.floor(Math.random() * actionCardsInHand.length);
      const cardToPlay = actionCardsInHand[randomIndex][0];

      return pipe(
        playAction({
          gameState: gameState,
          userId: currentActorGameState.id,
          cardName: cardToPlay,
          toDiscardFromHand: [cardToPlay],
        }),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
        E.flatMap((gameState) => handleIfBotPlayerTurn(gameState, pool))
      );
    }
  }

  // buyPhase
  if (
    currentActorGameState.phase === Phases.Buy &&
    currentActorGameState.buys > 0
  ) {
    const treasureCardsInHand = Object.entries(
      currentActorGameState.hand
    ).filter(
      ([cardName, count]) =>
        cardNameToCard(cardName as CardName).type === "treasure" && count > 0
    ) as [CardName, number][];

    if (treasureCardsInHand.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * treasureCardsInHand.length
      );
      const treasureToPlay = treasureCardsInHand[randomIndex][0];

      return pipe(
        // todo do this in a loop or until all treasures played
        playTreasure({
          gameState,
          userId: currentActorGameState.id,
          cardName: treasureToPlay,
        }),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
        E.flatMap((gameState) => {
          const affordableCards = Object.entries(
            gameState.global_state.supply
          ).filter(([cardName, count]) => {
            const card = cardNameToCard(cardName as CardName);
            return (
              card.cost <=
                getTreasureValue(currentActorGameState.cardsInPlay) && count > 0
            );
          }) as [CardName, number][];

          const randomIndex = Math.floor(
            Math.random() * affordableCards.length
          );
          const cardToBuy = affordableCards[randomIndex][0];

          return buyCard({
            gameState: gameState,
            userId: currentActorGameState.id,
            cardName: cardToBuy,
            toDiscardFromHand: [cardToBuy],
          });
        }),
        E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
        E.flatMap((gameState) => handleIfBotPlayerTurn(gameState, pool))
      );
    }
  }

  return pipe(
    cleanUp(gameState),
    E.flatMap((gamestate) =>
      incrementTurn(gamestate, currentActorGameState.name)
    ),
    E.flatMap(resetBuysAndActions),
    E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool))
  );
};
