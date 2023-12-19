import { GameState } from "./common";

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function indefiniteArticle(str: string) {
  return ["a", "e", "i", "o", "u"].includes(str[0].toLowerCase()) ? "an" : "a";
}

export const isUsersTurn = (gameState: GameState, userName: string) => {
  if (gameState.turn === 0) {
    return false;
  }

  const numberOfActors = gameState.actor_state.length;

  const turn = gameState.turn;

  const currentActivePlayer = gameState.actor_state[turn % numberOfActors];

  return !!currentActivePlayer.name && currentActivePlayer.name === userName;
};
