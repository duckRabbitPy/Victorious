import * as S from "@effect/schema/Schema";

const copper = {
  name: "copper",
  cost: 0,
  type: "treasure",
  value: 1,
} as const;

const silver = {
  name: "silver",
  cost: 3,
  type: "treasure",
  value: 2,
} as const;

const gold = {
  name: "gold",
  cost: 6,
  type: "treasure",
  value: 3,
} as const;

const estate = {
  name: "estate",
  cost: 2,
  type: "victory",
  value: 1,
} as const;

const duchy = {
  name: "duchy",
  cost: 5,
  type: "victory",
  value: 3,
} as const;

const province = {
  name: "province",
  cost: 8,
  type: "victory",
  value: 6,
} as const;

const curse = {
  name: "curse",
  cost: 0,
  type: "curse",
  value: -1,
} as const;

const village = {
  name: "village",
  cost: 3,
  type: "action",
  value: 0,
} as const;

const smithy = {
  name: "smithy",
  cost: 4,
  type: "action",
  value: 0,
} as const;

const market = {
  name: "market",
  cost: 5,
  type: "action",
  value: 0,
  description: "Draw 1 card, +1 action, +1 buy, +1 treasure",
} as const;

const councilRoom = {
  name: "councilRoom",
  cost: 5,
  type: "action",
  value: 0,
  description: "Draw 4 cards, +1 buy",
} as const;

const laboratory = {
  name: "laboratory",
  cost: 5,
  type: "action",
  value: 0,
  description: "Draw 2 cards, +1 action",
} as const;

const festival = {
  name: "festival",
  cost: 5,
  type: "action",
  value: 0,
  description: "+2 actions, +1 buy, +2 treasure",
} as const;

const Mine = {
  name: "mine",
  cost: 5,
  type: "action",
  value: 0,
  description:
    "Trash a treasure card from your hand. Gain a treasure card costing up to 3 more; put it into your hand.",
} as const;

export const TreasureNames = S.union(
  S.literal("copper"),
  S.literal("silver"),
  S.literal("gold")
);

export const VictoryNames = S.union(
  S.literal("estate"),
  S.literal("duchy"),
  S.literal("province")
);

export const ActionNames = S.union(
  S.literal("village"),
  S.literal("smithy"),
  S.literal("market"),
  S.literal("councilRoom"),
  S.literal("laboratory"),
  S.literal("festival"),
  S.literal("mine"),
  S.literal("curse")
);

const CardNames = S.union(TreasureNames, VictoryNames, ActionNames);
const CardTypes = S.union(
  S.literal("treasure"),
  S.literal("victory"),
  S.literal("action"),
  S.literal("curse")
);

const CardStruct = S.struct({
  name: CardNames,
  cost: S.number,
  type: CardTypes,
  value: S.number,
  description: S.optional(S.string),
});

export const getAllCardNames = (): CardName[] => {
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
  for (const cardName of getAllCardNames()) {
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
      return Mine;
    case "curse":
      return curse;
  }
};

export type CardName = S.Schema.To<typeof CardNames>;
export type CardCount = S.Schema.To<typeof CardCountStruct>;
export type Card = S.Schema.To<typeof CardStruct>;
export const CardCountStruct = S.record(
  S.union(TreasureNames, VictoryNames, ActionNames),
  S.number
);

export enum Phases {
  Action = "action",
  Buy = "buy",
}

const ActorStateStruct = S.struct({
  id: S.UUID,
  name: S.string,
  hand: CardCountStruct,
  cardsInPlay: CardCountStruct,
  bonusTreasureValue: S.number,
  actions: S.number,
  buys: S.number,
  victoryPoints: S.number,
  discardPile: S.array(S.union(TreasureNames, VictoryNames, ActionNames)),
  deck: S.array(S.union(TreasureNames, VictoryNames, ActionNames)),
  phase: S.enums(Phases),
});

const GlobalStateStruct = S.struct({
  supply: CardCountStruct,
  history: S.array(S.string),
});

export const GameStateStruct = S.struct({
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

export const ChatMessageStruct = S.struct({
  username: S.string,
  message: S.string,
});

export const BroadCastStruct = S.struct({
  broadcastType: S.union(
    S.literal("gameState"),
    S.literal("chatLog"),
    S.literal("error")
  ),
  gameState: S.optional(GameStateStruct),
  chatLog: S.optional(S.array(ChatMessageStruct)),
  error: S.optional(S.string),
});

export type ActorState = S.Schema.To<typeof ActorStateStruct>;
export type GlobalState = S.Schema.To<typeof GlobalStateStruct>;
export type GameState = S.Schema.To<typeof GameStateStruct>;
export type ClientPayload = S.Schema.To<typeof ClientPayloadStruct>;
export type ChatMessage = S.Schema.To<typeof ChatMessageStruct>;
export type BroadCast = S.Schema.To<typeof BroadCastStruct>;

export const safeParseNonEmptyString = S.parse(S.string.pipe(S.minLength(1)));
export const safeParseCardName = S.parse(CardNames);
export const safeParseBroadCast = S.parse(BroadCastStruct);
export const safeParseGameState = S.parse(GameStateStruct);
export const safeParseChatLog = S.parse(S.array(ChatMessageStruct));

export type BroadCastType = "gameState" | "chatLog" | "error";

export enum SupportedEffects {
  startGame = "startGame",
  getCurrentGameState = "getCurrentGameState",
  addLivePlayer = "addLivePlayer",
  buyCard = "buyCard",
  playTreasure = "playTreasure",
  resetPlayedTreasures = "resetPlayedTreasures",
  playAction = "playAction",
  incrementTurn = "incrementTurn",
  getCurrentChatLog = "getCurrentChatLog",
  sendChatMessage = "sendChatMessage",
}

export const ClientPayloadStruct = S.struct({
  mutationIndex: S.number,
  effect: S.enums(SupportedEffects),
  cardName: S.optional(S.union(TreasureNames, VictoryNames, ActionNames)),
  toDiscardFromHand: S.array(S.union(TreasureNames, VictoryNames, ActionNames)),
  room: S.number,
  authToken: S.string,
  chatMessage: S.optional(S.string),
});

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
  curse: 0,
};

export const subtractCardCount = (a: CardCount, b: CardCount): CardCount => {
  const result: Record<CardName, number> = {} as Record<CardName, number>;

  for (const cardName of Object.keys(a) as Array<CardName>) {
    const countA = a[cardName];
    const countB = b[cardName];

    if (typeof countB === "number") {
      const cardDiff = countA - countB;
      result[cardName as keyof CardCount] = cardDiff;
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

  return userNames.reduce((acc, curr, i) => {
    acc[curr] = colours[i] ?? "white";
    return acc;
  }, {} as UserNameColors);
};
