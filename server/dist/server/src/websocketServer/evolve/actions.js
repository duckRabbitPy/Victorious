"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trashCardToMeetDemand = exports.playAction = exports.applyAction = void 0;
const effect_1 = require("effect");
const common_1 = require("../../../../shared/common");
const utils_1 = require("../../../../shared/utils");
const hand_1 = require("./hand");
const applyAction = (gameState, userId, cardName) => {
    switch (cardName) {
        case "village": {
            const newActorState = gameState.actor_state.map((actor) => {
                if (actor.id === userId) {
                    const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                        deck: actor.deck,
                        discardPile: actor.discardPile,
                        numberOfCardsToDraw: 1,
                    });
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, discardPile: newDiscardPile, actions: actor.actions + 2 });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "smithy": {
            // todo refactor deal cards to include cards in play
            const newActorState = gameState.actor_state.map((actor) => {
                if (actor.id === userId) {
                    const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                        deck: actor.deck,
                        discardPile: actor.discardPile,
                        numberOfCardsToDraw: 3,
                    });
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, discardPile: newDiscardPile });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "market": {
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                    deck: actor.deck,
                    discardPile: actor.discardPile,
                    numberOfCardsToDraw: 1,
                });
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, actions: actor.actions + 1, buys: actor.buys + 1, discardPile: newDiscardPile, bonusTreasureValue: actor.bonusTreasureValue + 1 });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "laboratory": {
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                    deck: actor.deck,
                    discardPile: actor.discardPile,
                    numberOfCardsToDraw: 2,
                });
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, actions: actor.actions + 1, discardPile: newDiscardPile });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "festival": {
            const newActorState = gameState.actor_state.map((actor) => {
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { actions: actor.actions + 2, buys: actor.buys + 1, bonusTreasureValue: actor.bonusTreasureValue + 2 });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        default: {
            return gameState;
        }
        case "councilRoom": {
            const newActorState = gameState.actor_state.map((actor) => {
                const { newCardsIntoHand, newDeck, newDiscardPile } = (0, hand_1.dealCards)({
                    deck: actor.deck,
                    discardPile: actor.discardPile,
                    numberOfCardsToDraw: 4,
                });
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { hand: (0, common_1.sumCardCounts)(actor.hand, (0, common_1.cardNamesToCount)(newCardsIntoHand)), deck: newDeck, buys: actor.buys + 1, discardPile: newDiscardPile });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        // actions that require user action
        case "mine": {
            const newActorState = gameState.actor_state.map((actor) => {
                const actionPhaseDemand = {
                    actionCard: "mine",
                    demandType: "Trash",
                    count: 1,
                };
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { actionPhaseDemand });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "workshop": {
            const newActorState = gameState.actor_state.map((actor) => {
                const actionPhaseDemand = {
                    actionCard: "workshop",
                    demandType: "Gain",
                    count: 1,
                    requirement: getGainRequirementFromAction("workshop"),
                };
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { actionPhaseDemand });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
        case "moneylender": {
            const newActorState = gameState.actor_state.map((actor) => {
                const actionPhaseDemand = {
                    actionCard: "moneylender",
                    demandType: "Trash",
                    count: 1,
                    requirement: getTrashRequirementFromAction("moneylender"),
                };
                if (actor.id === userId) {
                    return Object.assign(Object.assign({}, actor), { actionPhaseDemand });
                }
                return actor;
            });
            return Object.assign(Object.assign({}, gameState), { actor_state: newActorState });
        }
    }
};
exports.applyAction = applyAction;
const playAction = ({ gameState, userId, cardName, toDiscardFromHand, }) => {
    const newActorState = gameState.actor_state.map((actor) => {
        const remainingActions = actor.actions - 1;
        if (actor.id === userId) {
            return Object.assign(Object.assign({}, actor), { hand: (0, common_1.subtractCardCount)(actor.hand, (0, common_1.cardNamesToCount)(toDiscardFromHand)), discardPile: [...actor.discardPile, ...toDiscardFromHand], actions: remainingActions });
        }
        return actor;
    });
    const latestTransaction = `${gameState.actor_state.filter((a) => a.id === userId)[0].name} played ${(0, utils_1.indefiniteArticle)(cardName)} ${cardName}`;
    const newGlobalState = Object.assign(Object.assign({}, gameState.global_state), { history: [...gameState.global_state.history, latestTransaction] });
    const updatedGameState = (0, exports.applyAction)(Object.assign(Object.assign({}, gameState), { global_state: newGlobalState, actor_state: newActorState }), userId, cardName);
    const GameStateWithLatestPhase = Object.assign(Object.assign({}, updatedGameState), { actor_state: updatedGameState.actor_state.map((actor) => {
            if (actor.id === userId) {
                return Object.assign(Object.assign({}, actor), { phase: (actor.actions < 1 && actor.actionPhaseDemand === null) ||
                        (!(0, common_1.hasActionCard)(actor.hand) && actor.actionPhaseDemand === null)
                        ? common_1.Phases.Buy
                        : common_1.Phases.Action });
            }
            return actor;
        }) });
    return effect_1.Effect.succeed(GameStateWithLatestPhase);
};
exports.playAction = playAction;
const trashCardToMeetDemand = ({ userId, gameState, toTrash, }) => {
    const newActorState = gameState.actor_state.map((actor) => {
        var _a, _b;
        if (actor.id === userId && actor.actionPhaseDemand) {
            const remainingDemandCount = (((_a = actor.actionPhaseDemand) === null || _a === void 0 ? void 0 : _a.count) &&
                ((_b = actor.actionPhaseDemand) === null || _b === void 0 ? void 0 : _b.count) - 1) ||
                0;
            const newDemandType = remainingDemandCount > 0 ? "Trash" : "Gain";
            const newActionPhaseDemand = {
                actionCard: actor.actionPhaseDemand.actionCard,
                demandType: newDemandType,
                count: newDemandType === "Trash"
                    ? getTrashCountDemandFromAction(actor.actionPhaseDemand.actionCard)
                    : getGainCountDemandFromAction(actor.actionPhaseDemand.actionCard),
                requirement: newDemandType === "Trash"
                    ? getTrashRequirementFromAction(actor.actionPhaseDemand.actionCard)
                    : getGainRequirementFromAction(actor.actionPhaseDemand.actionCard, toTrash),
            };
            const handCopy = Object.assign({}, actor.hand);
            const updatedHand = Object.assign(Object.assign({}, handCopy), { [toTrash]: handCopy[toTrash] - 1 });
            return Object.assign(Object.assign({}, actor), { hand: updatedHand, discardPile: [...actor.discardPile, toTrash], actionPhaseDemand: newActionPhaseDemand });
        }
        return actor;
    });
    const latestTransaction = `${gameState.actor_state.filter((a) => a.id === userId)[0].name} trashed ${(0, utils_1.indefiniteArticle)(toTrash)} ${toTrash}`;
    const newGlobalState = Object.assign(Object.assign({}, gameState.global_state), { history: [...gameState.global_state.history, latestTransaction] });
    const updatedGameState = Object.assign(Object.assign({}, gameState), { global_state: newGlobalState, actor_state: newActorState });
    return effect_1.Effect.succeed(updatedGameState);
};
exports.trashCardToMeetDemand = trashCardToMeetDemand;
const getTrashCountDemandFromAction = (actionCard) => {
    switch (actionCard) {
        case "moneylender":
        case "mine":
            return 1;
        case "workshop":
            return 0;
        default:
            return 0;
    }
};
const getGainCountDemandFromAction = (actionCard) => {
    switch (actionCard) {
        case "mine":
            return 1;
        case "moneylender":
        case "workshop":
            return 1;
        default:
            return 0;
    }
};
const getTrashRequirementFromAction = (actionCard) => {
    switch (actionCard) {
        case "moneylender":
            return {
                type: "Treasure",
                minValue: 0,
                maxValue: 1,
            };
        default:
            return undefined;
    }
};
const getGainRequirementFromAction = (actionCard, trashedCard) => {
    switch (actionCard) {
        case "mine":
            return {
                maxValue: trashedCard && (0, common_1.getCardValueByName)(trashedCard) + 3,
            };
        case "workshop":
            return {
                maxValue: 4,
            };
        case "moneylender":
            return {
                maxValue: 3,
            };
        default:
            return undefined;
    }
};
