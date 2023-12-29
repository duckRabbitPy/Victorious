import * as Schema from "@effect/schema/Schema";

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
} as const;

const councilRoom = {
  name: "councilRoom",
  cost: 5,
  type: "action",
  value: 0,
} as const;

const laboratory = {
  name: "laboratory",
  cost: 5,
  type: "action",
  value: 0,
} as const;

const festival = {
  name: "festival",
  cost: 5,
  type: "action",
  value: 0,
} as const;

const Mine = {
  name: "mine",
  cost: 5,
  type: "action",
  value: 0,
} as const;

export const TreasureNames = Schema.union(
  Schema.literal("copper"),
  Schema.literal("silver"),
  Schema.literal("gold")
);

export const VictoryNames = Schema.union(
  Schema.literal("estate"),
  Schema.literal("duchy"),
  Schema.literal("province")
);

export const ActionNames = Schema.union(
  Schema.literal("village"),
  Schema.literal("smithy"),
  Schema.literal("market"),
  Schema.literal("councilRoom"),
  Schema.literal("laboratory"),
  Schema.literal("festival"),
  Schema.literal("mine"),
  Schema.literal("curse")
);

const CardNames = Schema.union(TreasureNames, VictoryNames, ActionNames);
const CardTypes = Schema.union(
  Schema.literal("treasure"),
  Schema.literal("victory"),
  Schema.literal("action"),
  Schema.literal("curse")
);

const CardStruct = Schema.struct({
  name: CardNames,
  cost: Schema.number,
  type: CardTypes,
  value: Schema.number,
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

const getCardCostByName = (cardName: CardName): number => {
  return cardNameToCard(cardName).cost;
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

export const discardHand = (
  currentHand: CardCount,
  currentDiscardPile: readonly CardName[]
): readonly CardName[] => {
  return currentDiscardPile.concat(countToCardNamesArray(currentHand));
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

export type CardName = Schema.To<typeof CardNames>;
export type CardCount = Schema.To<typeof CardCountStruct>;
export type Card = Schema.To<typeof CardStruct>;
export const CardCountStruct = Schema.record(
  Schema.union(TreasureNames, VictoryNames, ActionNames),
  Schema.number
);

export enum Phases {
  Action = "action",
  Buy = "buy",
}

const ActorStateStruct = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  hand: CardCountStruct,
  cardsInPlay: CardCountStruct,
  bonusTreasureValue: Schema.number,
  actions: Schema.number,
  buys: Schema.number,
  victoryPoints: Schema.number,
  discardPile: Schema.array(
    Schema.union(TreasureNames, VictoryNames, ActionNames)
  ),
  deck: Schema.array(Schema.union(TreasureNames, VictoryNames, ActionNames)),
  phase: Schema.enums(Phases),
});

const GlobalStateStruct = Schema.struct({
  supply: CardCountStruct,
  history: Schema.array(Schema.string),
  playerUserIds: Schema.array(Schema.UUID),
});

export const GameStateStruct = Schema.struct({
  id: Schema.number,
  room: Schema.number,
  turn: Schema.number,
  session_id: Schema.UUID,
  mutation_index: Schema.number,
  actor_state: Schema.array(ActorStateStruct),
  global_state: GlobalStateStruct,
  game_over: Schema.boolean,
});

export const ChatMessageStruct = Schema.struct({
  username: Schema.string,
  message: Schema.string,
});

export const BroadCastStruct = Schema.struct({
  broadcastType: Schema.union(
    Schema.literal("gameState"),
    Schema.literal("chatLog"),
    Schema.literal("error")
  ),
  gameState: GameStateStruct.pipe(Schema.optional),
  chatLog: Schema.array(ChatMessageStruct).pipe(Schema.optional),
  error: Schema.string.pipe(Schema.optional),
});

export type ActorState = Schema.To<typeof ActorStateStruct>;
export type GlobalState = Schema.To<typeof GlobalStateStruct>;
export type GameState = Schema.To<typeof GameStateStruct>;
export type ClientPayload = Schema.To<typeof ClientPayloadStruct>;
export type ChatMessage = Schema.To<typeof ChatMessageStruct>;

export const safeParseNonEmptyString = Schema.parse(
  Schema.string.pipe(Schema.minLength(1))
);
export const safeParseCardName = Schema.parse(CardNames);
export const safeParseBroadCast = Schema.parse(BroadCastStruct);
export const safeParseGameState = Schema.parse(GameStateStruct);
export const safeParseChatLog = Schema.parse(Schema.array(ChatMessageStruct));

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

export const ClientPayloadStruct = Schema.struct({
  effect: Schema.enums(SupportedEffects),
  cardName: Schema.union(TreasureNames, VictoryNames, ActionNames).pipe(
    Schema.optional
  ),
  toDiscardFromHand: Schema.array(
    Schema.union(TreasureNames, VictoryNames, ActionNames)
  ),
  room: Schema.number,
  authToken: Schema.string,
  chatMessage: Schema.string.pipe(Schema.optional),
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
