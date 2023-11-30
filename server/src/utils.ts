import * as Schema from "@effect/schema/Schema";

export const logAndThrowError = (error: unknown) => {
  console.error(error);
  throw error;
};

export const safeParseNumber = Schema.parse(
  Schema.number.pipe(Schema.positive(), Schema.int(), Schema.nonNaN())
);

export const safeParseNonEmptyString = Schema.parse(
  Schema.string.pipe(Schema.minLength(1))
);

export const safeParseUUIDs = Schema.parse(Schema.array(Schema.UUID));
