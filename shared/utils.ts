import { GameState } from "./common";

export const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const indefiniteArticle = (str: string) =>
  ["a", "e", "i", "o", "u"].includes(str[0].toLowerCase()) ? "an" : "a";

export const isUsersTurn = (gameState: GameState, userName: string) => {
  if (gameState.turn === 0) {
    return false;
  }

  const numberOfActors = gameState.actor_state.length;

  const turn = gameState.turn;

  const currentActivePlayerState = gameState.actor_state[turn % numberOfActors];

  return (
    !!currentActivePlayerState.name &&
    currentActivePlayerState.name === userName
  );
};

type GroupedItems<T> = Record<string, T[]>;

export const groupBy = <T>(
  array: T[],
  getKey: (item: T) => string
): GroupedItems<T> =>
  array.reduce((result, item) => {
    const key = getKey(item);
    (result[key] = result[key] || []).push(item);
    return result;
  }, {} as GroupedItems<T>);

export const sortBy = <T>(
  array: T[],
  getKey: (item: T) => number,
  order: "asc" | "desc" = "asc"
): T[] =>
  array.sort((a, b) => {
    const keyA = getKey(a);
    const keyB = getKey(b);
    if (keyA < keyB) {
      return order === "asc" ? -1 : 1;
    }
    if (keyA > keyB) {
      return order === "asc" ? 1 : -1;
    }

    return 0;
  });
