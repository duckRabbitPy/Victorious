import * as S from "@effect/schema/Schema";

export const ALL_CARD_NAMES: CardName[] = [
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
  "workshop",
  "moneylender",
] as const;

const copper = {
  name: "copper" as const,
  cost: 0,
  type: "treasure",
  value: 1,
} as const;

const silver = {
  name: "silver" as const,
  cost: 3,
  type: "treasure",
  value: 2,
} as const;

const gold = {
  name: "gold" as const,
  cost: 6,
  type: "treasure",
  value: 3,
} as const;

const estate = {
  name: "estate" as const,
  cost: 2,
  type: "victory",
  value: 1,
} as const;

const duchy = {
  name: "duchy" as const,
  cost: 5,
  type: "victory",
  value: 3,
} as const;

const province = {
  name: "province" as const,
  cost: 8,
  type: "victory",
  value: 6,
} as const;

const village = {
  name: "village" as const,
  cost: 3,
  type: "action",
  value: 0,
  description: "Draw 1 card, +2 actions",
} as const;

const smithy = {
  name: "smithy" as const,
  cost: 4,
  type: "action",
  value: 0,
  description: "Draw 3 cards",
} as const;

const market = {
  name: "market" as const,
  cost: 5,
  type: "action",
  value: 0,
  description: "Draw 1 card, +1 action, +1 buy, +1 treasure",
} as const;

const councilRoom = {
  name: "councilRoom" as const,
  cost: 5,
  type: "action",
  value: 0,
  description: "Draw 4 cards, +1 buy",
} as const;

const laboratory = {
  name: "laboratory" as const,
  cost: 5,
  type: "action",
  value: 0,
  description: "Draw 2 cards, +1 action",
} as const;

const festival = {
  name: "festival" as const,
  cost: 5,
  type: "action",
  value: 0,
  description: "+2 actions, +1 buy, +2 treasure",
} as const;

const mine = {
  name: "mine" as const,
  cost: 5,
  type: "action",
  value: 0,
  description:
    "Trash a treasure card from your hand. Gain a treasure card costing up to 3 more; put it into your hand.",
} as const;

const workshop = {
  name: "workshop" as const,
  cost: 3,
  type: "action",
  value: 0,
  description: "Gain a card costing up to 4 coins",
} as const;

const moneylender = {
  name: "moneylender" as const,
  cost: 4,
  type: "action",
  value: 0,
  description: "Trash a copper from your hand. If you do, +3 treasure",
} as const;

const TreasureNames = S.Union(
  S.Literal("copper"),
  S.Literal("silver"),
  S.Literal("gold")
);

const VictoryNames = S.Union(
  S.Literal("estate"),
  S.Literal("duchy"),
  S.Literal("province")
);

const ActionNames = S.Union(
  S.Literal("village"),
  S.Literal("smithy"),
  S.Literal("market"),
  S.Literal("councilRoom"),
  S.Literal("laboratory"),
  S.Literal("festival"),
  S.Literal("mine"),
  S.Literal("workshop"),
  S.Literal("moneylender")
);

const CardNames = S.Union(TreasureNames, VictoryNames, ActionNames);

const CardTypes = S.Union(
  S.Literal("treasure"),
  S.Literal("victory"),
  S.Literal("action")
);

class Card extends S.Class<Card>("Card")({
  name: CardNames,
  cost: S.Number,
  type: CardTypes,
  value: S.Number,
  description: S.optional(S.String),
}) {}

export const getCardCostByName = (cardName: CardName): number => {
  return cardNameToCard(cardName).cost;
};

export const getCardDescriptionByName = (cardName: CardName): string => {
  return cardNameToCard(cardName)?.description ?? "";
};

export const getCardValueByName = (cardName: CardName): number => {
  return cardNameToCard(cardName).value;
};

export const countToCardNamesArray = (cardCount: CardCount): CardName[] => {
  const cardNames: CardName[] = [];
  for (const cardName of ALL_CARD_NAMES) {
    for (let i = 0; i < cardCount[cardName]; i++) {
      cardNames.push(cardName);
    }
  }
  return cardNames;
};

export const cardNamesToCount = (cardNames: readonly CardName[]): CardCount => {
  const temporaryCardCount = {
    copper: 0,
    silver: 0,
    gold: 0,
    estate: 0,
    duchy: 0,
    province: 0,
    village: 0,
    smithy: 0,
    market: 0,
    councilRoom: 0,
    mine: 0,
    festival: 0,
    laboratory: 0,
    workshop: 0,
    moneylender: 0,
  };

  for (const cardName of cardNames) {
    temporaryCardCount[cardName]++;
  }

  return temporaryCardCount;
};

export const getCardTypeByName = (cardName: CardName): Card["type"] => {
  return cardNameToCard(cardName).type;
};

export const hasActionCard = (hand: CardCount): boolean => {
  for (const cardName of Object.keys(hand) as Array<CardName>) {
    if (getCardTypeByName(cardName) === "action" && hand[cardName] > 0) {
      return true;
    }
  }
  return false;
};

export const getTreasureValue = (hand: CardCount): number => {
  return (
    hand.copper * getCardValueByName("copper") +
    hand.silver * getCardValueByName("silver") +
    hand.gold * getCardValueByName("gold")
  );
};

export const cardNameToVictoryPoints = (cardName: CardName): number => {
  if (getCardTypeByName(cardName) !== "victory") {
    return 0;
  }
  return cardNameToCard(cardName).value;
};

export const getTotalCardsForActor = (actor: ActorState) => {
  return (
    countToCardNamesArray(actor.cardsInPlay).length +
    countToCardNamesArray(actor.hand).length +
    actor.deck.length +
    actor.discardPile.length
  );
};

export const cardNameToCard = (cardName: CardName): Card => {
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
      return mine;
    case "workshop":
      return workshop;
    case "moneylender":
      return moneylender;
  }
};

export type CardName = S.Schema.Type<typeof CardNames>;
export type CardCount = S.Schema.Type<typeof CardCountStruct>;

const CardCountStruct = S.Record(
  S.Union(TreasureNames, VictoryNames, ActionNames),
  S.Number
);

class Requirement extends S.Class<Requirement>("Requirement")({
  type: S.optional(
    S.Union(S.Literal("Treasure"), S.Literal("Victory"), S.Literal("Action"))
  ),
  maxValue: S.optional(S.Number),
  minValue: S.optional(S.Number),
}) {}

export class ActionPhaseDemand extends S.Class<ActionPhaseDemand>(
  "ActionPhaseDemand"
)({
  actionCard: ActionNames,
  demandType: S.Union(S.Literal("Gain"), S.Literal("Trash")),
  requirement: S.optional(Requirement),
  count: S.Number,
}) {}

export enum Phases {
  Action = "action",
  Buy = "buy",
}

export class ActorState extends S.Class<ActorState>("ActorState")({
  id: S.UUID,
  name: S.String,
  hand: CardCountStruct,
  cardsInPlay: CardCountStruct,
  bonusTreasureValue: S.Number,
  actions: S.Number,
  buys: S.Number,
  victoryPoints: S.Number,
  discardPile: S.Array(S.Union(TreasureNames, VictoryNames, ActionNames)),
  deck: S.Array(S.Union(TreasureNames, VictoryNames, ActionNames)),
  actionPhaseDemand: S.NullishOr(ActionPhaseDemand),
  phase: S.Enums(Phases),
}) {}

export class GlobalState extends S.Class<GlobalState>("GlobalState")({
  supply: CardCountStruct,
  history: S.Array(S.String),
}) {}

export class GameState extends S.Class<GameState>("GameState")({
  id: S.Number,
  room: S.Number,
  turn: S.Number,
  session_id: S.UUID,
  mutation_index: S.Number,
  actor_state: S.Array(ActorState),
  global_state: GlobalState,
  created_at: S.ValidDateFromSelf,
  game_over: S.Boolean,
}) {}

export class ChatMessage extends S.Class<ChatMessage>("ChatMessage")({
  username: S.String,
  message: S.String,
}) {}

export class BroadCast extends S.Class<BroadCast>("BroadCast")({
  broadcastType: S.Union(
    S.Literal("gameState"),
    S.Literal("chatLog"),
    S.Literal("error")
  ),
  gameState: S.optional(GameState),
  chatLog: S.optional(S.Array(ChatMessage)),
  error: S.optional(S.String),
}) {}

class RegisterResult extends S.Class<RegisterResult>("RegisterResult")({
  user_id: S.String,
  username: S.String,
  email: S.String,
  confirmation_token: S.String,
}) {}

export const safeParseNonEmptyString = S.decodeUnknown(
  S.String.pipe(S.minLength(1))
);
export const safeParseCardName = S.decodeUnknown(CardNames);
export const safeParseBroadCast = S.decodeUnknown(BroadCast);
export const safeParseGameState = S.decodeUnknown(GameState);
export const safeParseChatLog = S.decodeUnknown(S.Array(ChatMessage));
export const safeParseRegisterResult = S.decodeUnknown(RegisterResult);

export type BroadCastType = "gameState" | "chatLog" | "error";

export enum SupportedEffects {
  startGame = "startGame",
  getCurrentGameState = "getCurrentGameState",
  addLivePlayer = "addLivePlayer",
  addBotPlayer = "addBotPlayer",
  handleBotPlayerTurn = "handleBotPlayerTurn",
  buyCard = "buyCard",
  gainCard = "gainCard",
  playTreasure = "playTreasure",
  resetPlayedTreasures = "resetPlayedTreasures",
  playAction = "playAction",
  incrementTurn = "incrementTurn",
  endActions = "endActions",
  getCurrentChatLog = "getCurrentChatLog",
  sendChatMessage = "sendChatMessage",
  trashCardToMeetDemand = "trashCardToMeetDemand",
}

export class ClientPayload extends S.Class<ClientPayload>("ClientPayload")({
  mutationIndex: S.Number,
  effect: S.Enums(SupportedEffects),
  cardName: S.optional(S.Union(TreasureNames, VictoryNames, ActionNames)),
  room: S.Number,
  authToken: S.String,
  chatMessage: S.optional(S.String),
}) {}

export const zeroCardCount: CardCount = {
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
  workshop: 0,
  moneylender: 0,
};

export const subtractCardCount = (a: CardCount, b: CardCount): CardCount => {
  const result: Record<CardName, number> = {} as Record<CardName, number>;

  for (const cardName of Object.keys(a) as Array<CardName>) {
    const countA = a[cardName];
    const countB = b[cardName];

    if (typeof countB === "number") {
      const cardDiff = countA - countB;
      // cardCount cannot be below 0
      result[cardName as keyof CardCount] = cardDiff > 0 ? cardDiff : 0;
    }
  }
  return result;
};

export const sumCardCounts = (a: CardCount, b: CardCount): CardCount => {
  const result: Record<CardName, number> = {} as Record<CardName, number>;

  for (const cardName of Object.keys(a) as Array<CardName>) {
    const countA = a[cardName];
    const countB = b[cardName];

    if (typeof countB === "number") {
      const cardSum = countA + countB;
      result[cardName as keyof CardCount] = cardSum;
    }
  }
  return result;
};

export interface UserNameColors {
  [username: string]: string;
}

export const getUserNameColors = (userNames: string[]) => {
  const colours = ["cyan", "magenta", "lime", "yellow", "orange"];

  return userNames.sort().reduce((acc, curr, i) => {
    acc[curr] = colours[i] ?? "white";
    return acc;
  }, {} as UserNameColors);
};

export const botNamePrefixes = [
  "Lancelot_bot_",
  "Arthur_bot_",
  "Guinevere_bot_",
  "Merlin_bot_",
  "Morgana_bot_",
  "Galahad_bot_",
];
