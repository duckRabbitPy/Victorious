type Copper = typeof copper;
type Silver = typeof silver;
type Gold = typeof gold;
type Estate = typeof estate;
type Duchy = typeof duchy;
type Province = typeof province;
type Curse = typeof curse;
type Village = typeof village;
type Smithy = typeof smithy;
type Market = typeof market;
type CouncilRoom = typeof councilRoom;
type Laboratory = typeof laboratory;
type Festival = typeof festival;
type Mine = typeof Mine;

type Card =
  | Copper
  | Silver
  | Gold
  | Estate
  | Duchy
  | Province
  | Curse
  | Village
  | Smithy
  | Market
  | CouncilRoom
  | Laboratory
  | Festival
  | Mine;

type CardName = Card["name"];
type Treasure = Copper | Silver | Gold;
type Victory = Estate | Duchy | Province;
type Action =
  | Village
  | Smithy
  | Market
  | CouncilRoom
  | Laboratory
  | Festival
  | Mine;

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

const isTreasure = (card: Card): card is Treasure => {
  return card.type === "treasure";
};

const isVictory = (card: Card): card is Victory => {
  return card.type === "victory";
};

const isAction = (card: Card): card is Action => {
  return card.type === "action";
};

const getCardCostByName = (cardName: CardName): number => {
  return cardNameToCard(cardName).cost;
};

const getCardValueByName = (cardName: CardName): number => {
  return cardNameToCard(cardName).value;
};

const getHandTreasureValue = (hand: Card[]): number => {
  return hand.reduce((acc, card) => {
    if (isTreasure(card)) {
      return acc + card.value;
    }

    return acc;
  }, 0);
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
    case "curse":
      return curse;
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
