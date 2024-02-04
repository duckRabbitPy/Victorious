"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIfBotPlayerTurn = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../../shared/common");
const buys_1 = require("./buys");
const customErrors_1 = require("../../customErrors");
const mutations_1 = require("../../models/gamestate/mutations");
const hand_1 = require("./hand");
const actions_1 = require("./actions");
const handleIfBotPlayerTurn = (gameState, pool) => {
    const currentActorGameState = gameState.actor_state[gameState.turn % gameState.actor_state.length];
    const currentPlayerIsBot = common_1.botNamePrefixes.some((prefix) => currentActorGameState.name.startsWith(prefix));
    if (!currentPlayerIsBot || !currentActorGameState) {
        return effect_1.Effect.fail(new customErrors_1.IllegalGameStateError({
            message: "current player is not a bot",
        }));
    }
    return (0, effect_1.pipe)(botActionPhase(gameState, pool), effect_1.Effect.flatMap((postActionPhaseGamestate) => botBuyPhase(postActionPhaseGamestate, pool)));
};
exports.handleIfBotPlayerTurn = handleIfBotPlayerTurn;
const botActionPhase = (gameState, pool) => {
    const currentActorGameState = gameState.actor_state[gameState.turn % gameState.actor_state.length];
    // actionPhase
    if (currentActorGameState.phase === common_1.Phases.Action &&
        currentActorGameState.actions > 0) {
        const actionCardsInHand = Object.entries(currentActorGameState.hand).filter(([cardName, count]) => (0, common_1.cardNameToCard)(cardName).type === "action" && count > 0);
        if (actionCardsInHand.length > 0) {
            const randomIndex = Math.floor(Math.random() * actionCardsInHand.length);
            const cardToPlay = actionCardsInHand[randomIndex][0];
            return (0, effect_1.pipe)((0, actions_1.playAction)({
                gameState: gameState,
                userId: currentActorGameState.id,
                cardName: cardToPlay,
                toDiscardFromHand: [cardToPlay],
            }), effect_1.Effect.flatMap((gameState) => (0, exports.handleIfBotPlayerTurn)(gameState, pool)));
        }
    }
    return effect_1.Effect.succeed(gameState);
};
const botBuyPhase = (gameState, pool) => {
    const currentActorGameState = gameState.actor_state[gameState.turn % gameState.actor_state.length];
    if (currentActorGameState.phase === common_1.Phases.Buy &&
        currentActorGameState.buys > 0) {
        return (0, effect_1.pipe)((0, hand_1.playAllTreasures)(gameState), effect_1.Effect.flatMap((gamestate) => (0, mutations_1.writeNewGameStateToDB)(gamestate, pool)), effect_1.Effect.flatMap((newGameState) => {
            const newActorGameState = newGameState.actor_state[newGameState.turn % newGameState.actor_state.length];
            const affordableCards = Object.entries(newGameState.global_state.supply).filter(([cardName, count]) => {
                const card = (0, common_1.cardNameToCard)(cardName);
                return (card.cost <= (0, common_1.getTreasureValue)(newActorGameState.cardsInPlay) &&
                    count > 0);
            });
            const randomIndex = Math.floor(Math.random() * affordableCards.length);
            if (affordableCards.length === 0) {
                return effect_1.Effect.succeed(newGameState);
            }
            const cardToBuy = affordableCards[randomIndex][0];
            return (0, buys_1.buyCard)({
                gameState: newGameState,
                userId: newActorGameState.id,
                cardName: cardToBuy,
                toDiscardFromHand: [],
            });
        }), effect_1.Effect.flatMap((gameState) => (0, exports.handleIfBotPlayerTurn)(gameState, pool)));
    }
    return effect_1.Effect.succeed(gameState);
};
