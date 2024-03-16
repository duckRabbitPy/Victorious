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
import { buyCard } from "./buys";
import { IllegalGameStateError, PostgresError } from "../../customErrors";
import { writeNewGameStateToDB } from "../../models/gamestate/mutations";
import { ParseError } from "@effect/schema/ParseResult";
import { playAllTreasures } from "./hand";

import { playAction } from "./actions";

export const handleIfBotPlayerTurn = (
  gameState: GameState,
  pool: Pool
): E.Effect<GameState, IllegalGameStateError | ParseError | PostgresError> => {
  const currentActorGameState =
    gameState.actor_state[gameState.turn % gameState.actor_state.length];
  const currentPlayerIsBot = botNamePrefixes.some((prefix) =>
    currentActorGameState.name.startsWith(prefix)
  );

  if (!currentPlayerIsBot || !currentActorGameState) {
    return E.fail(
      new IllegalGameStateError({
        message: "current player is not a bot",
      })
    );
  }

  return pipe(
    botActionPhase(gameState, pool),
    E.flatMap((postActionPhaseGamestate) =>
      botBuyPhase(postActionPhaseGamestate, pool)
    )
  );
};

const botActionPhase = (gameState: GameState, pool: Pool) => {
  const currentActorGameState =
    gameState.actor_state[gameState.turn % gameState.actor_state.length];

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
        }),
        E.flatMap((gameState) => handleIfBotPlayerTurn(gameState, pool))
      );
    }
  }

  return E.succeed(gameState);
};

const botBuyPhase = (gameState: GameState, pool: Pool) => {
  const currentActorGameState =
    gameState.actor_state[gameState.turn % gameState.actor_state.length];

  if (
    currentActorGameState.phase === Phases.Buy &&
    currentActorGameState.buys > 0
  ) {
    return pipe(
      playAllTreasures(gameState),
      E.flatMap((gamestate) => writeNewGameStateToDB(gamestate, pool)),
      E.flatMap((newGameState) => {
        const newActorGameState =
          newGameState.actor_state[
            newGameState.turn % newGameState.actor_state.length
          ];

        const unsupportedCardsForBots = [
          "mine",
          "moneylender",
          "workshop",
          "councilRoom",
          "laboratory",
        ];

        const affordableCards = Object.entries(
          newGameState.global_state.supply
        ).filter(([cardName, count]) => {
          const card = cardNameToCard(cardName as CardName);
          return (
            card.cost <= getTreasureValue(newActorGameState.cardsInPlay) &&
            count > 0 &&
            !unsupportedCardsForBots.includes(cardName)
          );
        }) as [CardName, number][];

        const randomIndex = Math.floor(Math.random() * affordableCards.length);

        if (affordableCards.length === 0) {
          return E.succeed(newGameState);
        }

        const favouredCards: CardName[] =
          newGameState.turn < 12
            ? ["smithy", "silver", "gold"]
            : ["duchy", "province", "estate"];

        const cardToBuy =
          favouredCards.find((card) =>
            affordableCards.map(([cardName]) => cardName).includes(card)
          ) || affordableCards[randomIndex][0];

        return buyCard({
          gameState: newGameState,
          userId: newActorGameState.id,
          cardName: cardToBuy,
        });
      }),
      E.flatMap((gameState) => handleIfBotPlayerTurn(gameState, pool))
    );
  }

  return E.succeed(gameState);
};
