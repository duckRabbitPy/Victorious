import { Data } from "effect";

export class PostgresError extends Data.TaggedClass("PostgresError")<{
  message: string;
  clientErrorMsg?: string;
  serverErrorMsg?: string;
}> {}

export class AuthenticationError extends Data.TaggedClass(
  "AuthenticationError"
)<{
  message: string;
}> {}

export class AuthorisationError extends Data.TaggedClass("AuthorisationError")<{
  message: string;
}> {}

export class JSONParseError extends Data.TaggedClass("JSONParseError")<{
  message: string;
}> {}

export class IllegalGameStateError extends Data.TaggedClass(
  "IllegalGameStateError"
)<{
  message: string;
}> {}
