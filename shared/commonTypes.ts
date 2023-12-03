import * as Schema from "@effect/schema/Schema";

const CardCountStruct = Schema.struct({
  copper: Schema.number,
  silver: Schema.number,
  gold: Schema.number,
  estate: Schema.number,
  duchy: Schema.number,
  province: Schema.number,
});

const ActorStateStruct = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  hand: CardCountStruct,
  actions: Schema.number,
  buys: Schema.number,
  victoryPoints: Schema.number,
});

const GlobalStateStruct = Schema.struct({
  board: Schema.array(Schema.UUID),
  deck: Schema.array(Schema.UUID),
  history: Schema.array(Schema.string),
  liveActors: Schema.array(Schema.UUID),
});

export const GameStateStruct = Schema.struct({
  id: Schema.UUID,
  room: Schema.number,
  turn: Schema.number,
  mutation_index: Schema.number,
  actor_state: Schema.array(ActorStateStruct),
  global_state: GlobalStateStruct,
  game_over: Schema.boolean,
});

// eslint-disable-next-func no-unused-vars
export enum SupportedEffects {
  // eslint-disable-next-line no-unused-vars
  getCurrentGameState = "getCurrentGameState",
  // eslint-disable-next-line no-unused-vars
  addLivePlayer = "addLivePlayer",
  buyCard = "buyCard",
  // eslint-disable-next-line no-unused-vars
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
