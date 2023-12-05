import * as Schema from "@effect/schema/Schema";

export enum Cards {
  Copper = "copper",
  Silver = "silver",
  Gold = "gold",
  Estate = "estate",
  Duchy = "duchy",
  Province = "province",
  Curse = "curse",
  Village = "village",
  Smithy = "smithy",
  Market = "market",
  CouncilRoom = "councilRoom",
  Mine = "mine",
  Festival = "festival",
  Laboratory = "laboratory",
}

export enum Phases {
  Action = "action",
  Buy = "buy",
  Cleanup = "cleanup",
}

const CardCountStruct = Schema.record(Schema.enums(Cards), Schema.number);
export type CardCount = Schema.To<typeof CardCountStruct>;

const ActorStateStruct = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  hand: CardCountStruct,
  actions: Schema.number,
  buys: Schema.number,
  victoryPoints: Schema.number,
  discardPile: Schema.array(Schema.enums(Cards)),
  deck: Schema.array(Schema.enums(Cards)),
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

// eslint-disable-next-func no-unused-vars
export enum SupportedEffects {
  getCurrentGameState = "getCurrentGameState",
  addLivePlayer = "addLivePlayer",
  buyCard = "buyCard",
  incrementTurn = "incrementTurn",
}

export const ClientPayloadStruct = Schema.struct({
  effect: Schema.enums(SupportedEffects),
  room: Schema.number,
  authToken: Schema.string,
});

export type ActorState = Schema.To<typeof ActorStateStruct>;
export type GlobalState = Schema.To<typeof GlobalStateStruct>;
export type GameState = Schema.To<typeof GameStateStruct>;
export type ClientPayload = Schema.To<typeof ClientPayloadStruct>;
