import * as Schema from "@effect/schema/Schema";

const Treasure = Schema.union(
  Schema.literal("copper"),
  Schema.literal("silver"),
  Schema.literal("gold")
);

const Victory = Schema.union(
  Schema.literal("estate"),
  Schema.literal("duchy"),
  Schema.literal("province")
);

const Action = Schema.union(
  Schema.literal("village"),
  Schema.literal("smithy"),
  Schema.literal("market"),
  Schema.literal("councilRoom"),
  Schema.literal("laboratory"),
  Schema.literal("festival"),
  Schema.literal("mine")
);

export enum Phases {
  Action = "action",
  Buy = "buy",
  Cleanup = "cleanup",
}

const CardCountStruct = Schema.record(
  Schema.union(Treasure, Victory, Action),
  Schema.number
);

const ActorStateStruct = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  hand: CardCountStruct,
  actions: Schema.number,
  buys: Schema.number,
  victoryPoints: Schema.number,
  discardPile: Schema.array(Schema.union(Treasure, Victory, Action)),
  deck: Schema.array(Schema.union(Treasure, Victory, Action)),
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
  cardName: Schema.union(Treasure, Victory, Action).pipe(Schema.optional),
  room: Schema.number,
  authToken: Schema.string,
});

export type CardCount = Schema.To<typeof CardCountStruct>;

export type ActorState = Schema.To<typeof ActorStateStruct>;
export type GlobalState = Schema.To<typeof GlobalStateStruct>;
export type GameState = Schema.To<typeof GameStateStruct>;
export type ClientPayload = Schema.To<typeof ClientPayloadStruct>;

export type Treasure = Schema.To<typeof Treasure>;
export type Victory = Schema.To<typeof Victory>;
export type Action = Schema.To<typeof Action>;
