"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumCardCounts = exports.subtractCardCount = exports.zeroCardCount = exports.ClientPayloadStruct = exports.SupportedEffects = exports.safeParseChatLog = exports.safeParseGameState = exports.safeParseBroadCast = exports.safeParseCardName = exports.safeParseNonEmptyString = exports.BroadCastStruct = exports.ChatMessageStruct = exports.GameStateStruct = exports.Phases = exports.CardCountStruct = exports.cardNameToCard = exports.cardNameToVictoryPoints = exports.getTreasureValue = exports.hasActionCard = exports.getCardTypeByName = exports.cardNamesToCount = exports.countToCardNamesArray = exports.getCardValueByName = exports.getCardDescriptionByName = exports.getCardCostByName = exports.getAllCardNames = exports.ActionNames = exports.VictoryNames = exports.TreasureNames = void 0;
const S = __importStar(require("@effect/schema/Schema"));
const copper = {
    name: "copper",
    cost: 0,
    type: "treasure",
    value: 1,
};
const silver = {
    name: "silver",
    cost: 3,
    type: "treasure",
    value: 2,
};
const gold = {
    name: "gold",
    cost: 6,
    type: "treasure",
    value: 3,
};
const estate = {
    name: "estate",
    cost: 2,
    type: "victory",
    value: 1,
};
const duchy = {
    name: "duchy",
    cost: 5,
    type: "victory",
    value: 3,
};
const province = {
    name: "province",
    cost: 8,
    type: "victory",
    value: 6,
};
const curse = {
    name: "curse",
    cost: 0,
    type: "curse",
    value: -1,
};
const village = {
    name: "village",
    cost: 3,
    type: "action",
    value: 0,
};
const smithy = {
    name: "smithy",
    cost: 4,
    type: "action",
    value: 0,
};
const market = {
    name: "market",
    cost: 5,
    type: "action",
    value: 0,
    description: "Draw 1 card, +1 action, +1 buy, +1 treasure",
};
const councilRoom = {
    name: "councilRoom",
    cost: 5,
    type: "action",
    value: 0,
    description: "Draw 4 cards, +1 buy",
};
const laboratory = {
    name: "laboratory",
    cost: 5,
    type: "action",
    value: 0,
    description: "Draw 2 cards, +1 action",
};
const festival = {
    name: "festival",
    cost: 5,
    type: "action",
    value: 0,
    description: "+2 actions, +1 buy, +2 treasure",
};
const Mine = {
    name: "mine",
    cost: 5,
    type: "action",
    value: 0,
    description: "Trash a treasure card from your hand. Gain a treasure card costing up to 3 more; put it into your hand.",
};
exports.TreasureNames = S.union(S.literal("copper"), S.literal("silver"), S.literal("gold"));
exports.VictoryNames = S.union(S.literal("estate"), S.literal("duchy"), S.literal("province"));
exports.ActionNames = S.union(S.literal("village"), S.literal("smithy"), S.literal("market"), S.literal("councilRoom"), S.literal("laboratory"), S.literal("festival"), S.literal("mine"), S.literal("curse"));
const CardNames = S.union(exports.TreasureNames, exports.VictoryNames, exports.ActionNames);
const CardTypes = S.union(S.literal("treasure"), S.literal("victory"), S.literal("action"), S.literal("curse"));
const CardStruct = S.struct({
    name: CardNames,
    cost: S.number,
    type: CardTypes,
    value: S.number,
    description: S.optional(S.string),
});
const getAllCardNames = () => {
    return [
        "copper",
        "silver",
        "gold",
        "estate",
        "duchy",
        "province",
        "village",
        "smithy",
        "market",
        "councilRoom",
        "laboratory",
        "festival",
        "mine",
    ];
};
exports.getAllCardNames = getAllCardNames;
const getCardCostByName = (cardName) => {
    return (0, exports.cardNameToCard)(cardName).cost;
};
exports.getCardCostByName = getCardCostByName;
const getCardDescriptionByName = (cardName) => {
    var _a, _b;
    return (_b = (_a = (0, exports.cardNameToCard)(cardName)) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : "";
};
exports.getCardDescriptionByName = getCardDescriptionByName;
const getCardValueByName = (cardName) => {
    return (0, exports.cardNameToCard)(cardName).value;
};
exports.getCardValueByName = getCardValueByName;
const countToCardNamesArray = (cardCount) => {
    const cardNames = [];
    for (const cardName of (0, exports.getAllCardNames)()) {
        for (let i = 0; i < cardCount[cardName]; i++) {
            cardNames.push(cardName);
        }
    }
    return cardNames;
};
exports.countToCardNamesArray = countToCardNamesArray;
const cardNamesToCount = (cardNames) => {
    const temporaryCardCount = {
        copper: 0,
        silver: 0,
        gold: 0,
        estate: 0,
        duchy: 0,
        province: 0,
        curse: 0,
        village: 0,
        smithy: 0,
        market: 0,
        councilRoom: 0,
        mine: 0,
        festival: 0,
        laboratory: 0,
    };
    for (const cardName of cardNames) {
        temporaryCardCount[cardName]++;
    }
    return temporaryCardCount;
};
exports.cardNamesToCount = cardNamesToCount;
const getCardTypeByName = (cardName) => {
    return (0, exports.cardNameToCard)(cardName).type;
};
exports.getCardTypeByName = getCardTypeByName;
const hasActionCard = (hand) => {
    for (const cardName of Object.keys(hand)) {
        if ((0, exports.getCardTypeByName)(cardName) === "action" && hand[cardName] > 0) {
            return true;
        }
    }
    return false;
};
exports.hasActionCard = hasActionCard;
const getTreasureValue = (hand) => {
    return (hand.copper * (0, exports.getCardValueByName)("copper") +
        hand.silver * (0, exports.getCardValueByName)("silver") +
        hand.gold * (0, exports.getCardValueByName)("gold"));
};
exports.getTreasureValue = getTreasureValue;
const cardNameToVictoryPoints = (cardName) => {
    if ((0, exports.getCardTypeByName)(cardName) !== "victory") {
        return 0;
    }
    return (0, exports.cardNameToCard)(cardName).value;
};
exports.cardNameToVictoryPoints = cardNameToVictoryPoints;
const cardNameToCard = (cardName) => {
    switch (cardName) {
        case "copper":
            return copper;
        case "silver":
            return silver;
        case "gold":
            return gold;
        case "estate":
            return estate;
        case "duchy":
            return duchy;
        case "province":
            return province;
        case "village":
            return village;
        case "smithy":
            return smithy;
        case "market":
            return market;
        case "councilRoom":
            return councilRoom;
        case "laboratory":
            return laboratory;
        case "festival":
            return festival;
        case "mine":
            return Mine;
        case "curse":
            return curse;
    }
};
exports.cardNameToCard = cardNameToCard;
exports.CardCountStruct = S.record(S.union(exports.TreasureNames, exports.VictoryNames, exports.ActionNames), S.number);
var Phases;
(function (Phases) {
    Phases["Action"] = "action";
    Phases["Buy"] = "buy";
})(Phases || (exports.Phases = Phases = {}));
const ActorStateStruct = S.struct({
    id: S.UUID,
    name: S.string,
    hand: exports.CardCountStruct,
    cardsInPlay: exports.CardCountStruct,
    bonusTreasureValue: S.number,
    actions: S.number,
    buys: S.number,
    victoryPoints: S.number,
    discardPile: S.array(S.union(exports.TreasureNames, exports.VictoryNames, exports.ActionNames)),
    deck: S.array(S.union(exports.TreasureNames, exports.VictoryNames, exports.ActionNames)),
    phase: S.enums(Phases),
});
const GlobalStateStruct = S.struct({
    supply: exports.CardCountStruct,
    history: S.array(S.string),
});
exports.GameStateStruct = S.struct({
    id: S.number,
    room: S.number,
    turn: S.number,
    session_id: S.UUID,
    mutation_index: S.number,
    actor_state: S.array(ActorStateStruct),
    global_state: GlobalStateStruct,
    created_at: S.ValidDateFromSelf,
    game_over: S.boolean,
});
exports.ChatMessageStruct = S.struct({
    username: S.string,
    message: S.string,
});
exports.BroadCastStruct = S.struct({
    broadcastType: S.union(S.literal("gameState"), S.literal("chatLog"), S.literal("error")),
    gameState: S.optional(exports.GameStateStruct),
    chatLog: S.optional(S.array(exports.ChatMessageStruct)),
    error: S.optional(S.string),
});
exports.safeParseNonEmptyString = S.parse(S.string.pipe(S.minLength(1)));
exports.safeParseCardName = S.parse(CardNames);
exports.safeParseBroadCast = S.parse(exports.BroadCastStruct);
exports.safeParseGameState = S.parse(exports.GameStateStruct);
exports.safeParseChatLog = S.parse(S.array(exports.ChatMessageStruct));
var SupportedEffects;
(function (SupportedEffects) {
    SupportedEffects["startGame"] = "startGame";
    SupportedEffects["getCurrentGameState"] = "getCurrentGameState";
    SupportedEffects["addLivePlayer"] = "addLivePlayer";
    SupportedEffects["buyCard"] = "buyCard";
    SupportedEffects["playTreasure"] = "playTreasure";
    SupportedEffects["resetPlayedTreasures"] = "resetPlayedTreasures";
    SupportedEffects["playAction"] = "playAction";
    SupportedEffects["incrementTurn"] = "incrementTurn";
    SupportedEffects["getCurrentChatLog"] = "getCurrentChatLog";
    SupportedEffects["sendChatMessage"] = "sendChatMessage";
})(SupportedEffects || (exports.SupportedEffects = SupportedEffects = {}));
exports.ClientPayloadStruct = S.struct({
    mutationIndex: S.number,
    effect: S.enums(SupportedEffects),
    cardName: S.optional(S.union(exports.TreasureNames, exports.VictoryNames, exports.ActionNames)),
    toDiscardFromHand: S.array(S.union(exports.TreasureNames, exports.VictoryNames, exports.ActionNames)),
    room: S.number,
    authToken: S.string,
    chatMessage: S.optional(S.string),
});
exports.zeroCardCount = {
    copper: 0,
    silver: 0,
    gold: 0,
    estate: 0,
    duchy: 0,
    province: 0,
    village: 0,
    smithy: 0,
    market: 0,
    mine: 0,
    laboratory: 0,
    festival: 0,
    councilRoom: 0,
    curse: 0,
};
const subtractCardCount = (a, b) => {
    const result = {};
    for (const cardName of Object.keys(a)) {
        const countA = a[cardName];
        const countB = b[cardName];
        if (typeof countB === "number") {
            const cardDiff = countA - countB;
            result[cardName] = cardDiff;
        }
    }
    return result;
};
exports.subtractCardCount = subtractCardCount;
const sumCardCounts = (a, b) => {
    const result = {};
    for (const cardName of Object.keys(a)) {
        const countA = a[cardName];
        const countB = b[cardName];
        if (typeof countB === "number") {
            const cardSum = countA + countB;
            result[cardName] = cardSum;
        }
    }
    return result;
};
exports.sumCardCounts = sumCardCounts;
