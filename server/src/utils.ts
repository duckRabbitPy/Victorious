import * as Schema from "@effect/schema/Schema";
import { GameStateStruct } from "../../shared/commonTypes";
import * as Effect from "@effect/io/Effect";
import { pipe } from "effect";

export const logAndThrowError = (error: unknown) => {
  console.error(error);
  throw error;
};

export const TapPipeLine = <R, E, A>(
  effect: Effect.Effect<R, E, A>
): Effect.Effect<R, E, A> =>
  pipe(
    effect,
    Effect.tapBoth({
      onFailure: (f) =>
        Effect.log(`Failed with: ${JSON.stringify(f, null, 2)}`),
      onSuccess: (s) =>
        Effect.log(`Success with: ${JSON.stringify(s, null, 2)}`),
    }),
    Effect.flatMap(() => effect)
  );

export const safeParseNumber = Schema.parse(
  Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
);

export const safeParseNonEmptyString = Schema.parse(
  Schema.string.pipe(Schema.minLength(1))
);

export const safeParseUUIDs = Schema.parse(Schema.array(Schema.UUID));

export const safeParseGameState = Schema.parse(GameStateStruct);
