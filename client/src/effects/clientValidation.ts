import {
  CardName,
  GameState,
  cardNameToCard,
  getHandTreasureValue,
} from "../../../shared/common";

export const isUsersTurn = (gameState: GameState, userName: string) => {
  if (gameState.turn === 0) {
    return false;
  }

  const numberOfActors = gameState.actor_state.length;

  const turn = gameState.turn;

  const currentActivePlayer = gameState.actor_state[turn % numberOfActors];

  return !!currentActivePlayer.name && currentActivePlayer.name === userName;
};

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
  selectedTreasureValue,
}: {
  gameState: GameState;
  loggedInUsername: string;
  cardName: CardName;
  selectedTreasureValue: number;
}) => {
  const actor = getActorFromGameState(gameState, loggedInUsername);
  const cardCost = cardNameToCard(cardName).cost;
  const handValue = getHandTreasureValue(actor.hand);
  const buysRemaining = actor.buys;

  return (
    buysRemaining > 0 &&
    handValue >= cardCost &&
    selectedTreasureValue >= cardCost &&
    isUsersTurn(gameState, loggedInUsername)
  );
};
