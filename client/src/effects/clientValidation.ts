import { CardName, GameState, cardNameToCard } from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";

const getActorFromGameState = (gameState: GameState, userName: string) => {
  const actor = gameState.actor_state.find((actor) => actor.name === userName);
  if (!actor) {
    throw new Error(`Actor ${userName} not found in game state`);
  }
  return actor;
};

export const canBuyCard = ({
  gameState,
  loggedInUsername,
  cardName,
  totalTreasureValue,
}: {
  gameState: GameState;
  loggedInUsername: string;
  cardName: CardName;
  totalTreasureValue: number;
}) => {
  const actor = getActorFromGameState(gameState, loggedInUsername);
  const cardCost = cardNameToCard(cardName).cost;
  const buysRemaining = actor.buys;

  return (
    buysRemaining > 0 &&
    gameState.global_state.supply[cardName] > 0 &&
    totalTreasureValue >= cardCost &&
    isUsersTurn(gameState, loggedInUsername)
  );
};

export const canGainCard = ({
  gameState,
  loggedInUsername,
  cardName,
}: {
  gameState: GameState;
  loggedInUsername: string;
  cardName: CardName;
}) => {
  const actor = getActorFromGameState(gameState, loggedInUsername);
  const cardCost = cardNameToCard(cardName).cost;
  const demandHasBeenMet = actor.actionPhaseDemand?.demandType === "Gain";
  const gainsRemaining = actor.actionPhaseDemand?.count || 0;

  return (
    demandHasBeenMet &&
    gainsRemaining > 0 &&
    gameState.global_state.supply[cardName] > 0 &&
    (actor.actionPhaseDemand.requirement?.maxValue || 999) > cardCost &&
    isUsersTurn(gameState, loggedInUsername)
  );
};
