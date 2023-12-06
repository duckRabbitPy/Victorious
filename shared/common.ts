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
  Schema.literal("mine")
);

const CardStruct = Schema.struct({
  name: Schema.string,
  cost: Schema.number,
  type: Schema.string,
  value: Schema.number,
});

const CardNames = Schema.union(TreasureNames, VictoryNames, ActionNames);

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

const getCardValueByName = (cardName: CardName): number => {
  return cardNameToCard(cardName).value;
};

const getCardTypeByName = (cardName: CardName): string => {
  return cardNameToCard(cardName).type;
};

const getHandTreasureValue = (hand: CardCount): number => {
  return (
    hand.copper * getCardValueByName("copper") +
    hand.silver * getCardValueByName("silver") +
    hand.gold * getCardValueByName("gold")
  );
};

const getPlayerVictoryPoints = (deck: CardCount): number => {
  return (
    deck.estate * getCardValueByName("estate") +
    deck.duchy * getCardValueByName("duchy") +
    deck.province * getCardValueByName("province")
  );
};

const cardNameToCard = (cardName: CardName): Card => {
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
  Cleanup = "cleanup",
}

const ActorStateStruct = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  hand: CardCountStruct,
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

export type ActorState = Schema.To<typeof ActorStateStruct>;
export type GlobalState = Schema.To<typeof GlobalStateStruct>;
export type GameState = Schema.To<typeof GameStateStruct>;
export type ClientPayload = Schema.To<typeof ClientPayloadStruct>;

export enum SupportedEffects {
  getCurrentGameState = "getCurrentGameState",
  addLivePlayer = "addLivePlayer",
  buyCard = "buyCard",
  incrementTurn = "incrementTurn",
}

export const ClientPayloadStruct = Schema.struct({
  effect: Schema.enums(SupportedEffects),
  cardName: Schema.union(TreasureNames, VictoryNames, ActionNames).pipe(
    Schema.optional
  ),
  room: Schema.number,
  authToken: Schema.string,
});
