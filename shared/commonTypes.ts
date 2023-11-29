import * as Schema from "@effect/schema/Schema";

const ActorStateStruct = Schema.struct({
  id: Schema.UUID,
  name: Schema.string,
  coins: Schema.number,
  hand: Schema.array(Schema.UUID),
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
  actor_state: Schema.array(ActorStateStruct),
  global_state: GlobalStateStruct,
});

export type GameState = Schema.To<typeof GameStateStruct>;
