import {
  CardName,
  GameState,
  cardNameToCard,
  getHandTreasureValue,
} from "../../../shared/common";

export const isCurrentUsersTurn = (gameState: GameState, userName: string) => {
  if (gameState.turn === 0) {
    return false;
  }

  const numberOfActors = gameState.actor_state.length;

  const turn = gameState.turn;

  const currentActvePlayerIndex = gameState.actor_state[turn % numberOfActors];

  return currentActvePlayerIndex.name === userName;
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
  currentUserName,
  cardName,
  selectedTreasureValue,
}: {
  gameState: GameState;
  currentUserName: string;
  cardName: CardName;
  selectedTreasureValue: number;
}) => {
  const actor = getActorFromGameState(gameState, currentUserName);
  const cardCost = cardNameToCard(cardName).cost;
  const handValue = getHandTreasureValue(actor.hand);

  return (
    handValue >= cardCost &&
    selectedTreasureValue >= cardCost &&
    isCurrentUsersTurn(gameState, currentUserName)
  );
};
