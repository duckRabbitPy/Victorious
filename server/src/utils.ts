import * as Schema from "@effect/schema/Schema";
import { GameStateStruct } from "../../shared/commonTypes";
import * as Effect from "@effect/io/Effect";
import { pipe } from "effect";
import { AuthenticationError } from "./controllers/customErrors";
import jwt from "jsonwebtoken";

export const logAndThrowError = (error: unknown) => {
  console.error(error);
  throw error;
};

export const tapPipeLine = <R, E, A>(
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

export const safeParseJWT = Schema.parse(
  Schema.struct({
    userId: Schema.string,
    iat: Schema.number,
    exp: Schema.number,
  })
);

export const safeParseUUIDs = Schema.parse(Schema.array(Schema.UUID));

export const safeParseUUID = Schema.parse(Schema.UUID);

export const safeParseGameState = Schema.parse(GameStateStruct);

export const safeParseNumberArray = Schema.parse(
  Schema.array(
    Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
  )
);

export const verifyJwt = (token: string, secret: string | undefined) => {
  return pipe(
    safeParseNonEmptyString(secret),
    Effect.orElseFail(() =>
      Effect.succeed(
        new AuthenticationError({ message: "server secret key not found" })
      )
    ),
    Effect.flatMap((secret) => {
      return Effect.tryPromise({
        try: () =>
          new Promise((resolve, reject) => {
            jwt.verify(token, secret, (err: unknown, decoded: unknown) => {
              if (err) {
                reject(new Error("Invalid token"));
              }
              resolve(decoded);
            });
          }),
        catch: () => new AuthenticationError({ message: "Invalid API key" }),
      });
    })
  );
};
