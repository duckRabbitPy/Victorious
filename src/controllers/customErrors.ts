import { Data } from "effect";

export class PostgresError extends Data.TaggedClass("PostgresError")<{
  message: string;
}> {}

export class AuthorisationError extends Data.TaggedClass("AuthorisationError")<{
  message: string;
}> {}
