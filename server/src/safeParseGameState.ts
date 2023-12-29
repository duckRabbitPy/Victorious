import * as Schema from "@effect/schema/Schema";
import { GameStateStruct } from "../../shared/common";

export const safeParseGameState = Schema.parse(GameStateStruct);
