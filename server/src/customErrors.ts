import { Data } from "effect";

export type AllPossibleWebsocketErrors =
  | AuthenticationError
  | Error
  | PostgresError
  | IllegalGameStateError
  | CustomClientPayloadParseError
  | RegistrationError
  | RuntimeError;

export interface ServerError {
  message: string;
}

export class PostgresError extends Data.TaggedClass("PostgresError")<{
  message: string;
}> {}

export class AuthenticationError extends Data.TaggedClass(
  "AuthenticationError"
)<{
  message: string;
}> {}

export class AuthorisationError extends Data.TaggedClass("AuthorisationError")<{
  message: string;
}> {}

export class RegistrationError extends Data.TaggedClass("RegistrationError")<{
  message: string;
}> {}

export class CustomClientPayloadParseError extends Data.TaggedClass(
  "CustomClientPayloadParseError"
)<{
  message: string;
}> {}

export class IllegalGameStateError extends Data.TaggedClass(
  "IllegalGameStateError"
)<{
  message: string;
}> {}

export class ExternalServiceError extends Data.TaggedClass(
  "ExternalServiceError"
)<{
  message: string;
}> {}

export class RuntimeError extends Data.TaggedClass("RuntimeError")<{
  message: string;
}> {}
