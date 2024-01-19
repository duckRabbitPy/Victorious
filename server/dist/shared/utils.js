"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortBy = exports.groupBy = exports.isUsersTurn = exports.indefiniteArticle = exports.uuidv4 = void 0;
const uuidv4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0, v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
exports.uuidv4 = uuidv4;
const indefiniteArticle = (str) => ["a", "e", "i", "o", "u"].includes(str[0].toLowerCase()) ? "an" : "a";
exports.indefiniteArticle = indefiniteArticle;
const isUsersTurn = (gameState, userName) => {
    if (gameState.turn === 0) {
        return false;
    }
    const numberOfActors = gameState.actor_state.length;
    const turn = gameState.turn;
    const currentActivePlayer = gameState.actor_state[turn % numberOfActors];
    return !!currentActivePlayer.name && currentActivePlayer.name === userName;
};
exports.isUsersTurn = isUsersTurn;
const groupBy = (array, getKey) => array.reduce((result, item) => {
    const key = getKey(item);
    (result[key] = result[key] || []).push(item);
    return result;
}, {});
exports.groupBy = groupBy;
const sortBy = (array, getKey, order = "asc") => array.sort((a, b) => {
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
exports.sortBy = sortBy;
