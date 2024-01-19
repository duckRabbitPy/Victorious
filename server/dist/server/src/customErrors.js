"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IllegalGameStateError = exports.JSONParseError = exports.CustomParseError = exports.AuthorisationError = exports.AuthenticationError = exports.PostgresError = void 0;
const effect_1 = require("effect");
class PostgresError extends effect_1.Data.TaggedClass("PostgresError") {
}
exports.PostgresError = PostgresError;
class AuthenticationError extends effect_1.Data.TaggedClass("AuthenticationError") {
}
exports.AuthenticationError = AuthenticationError;
class AuthorisationError extends effect_1.Data.TaggedClass("AuthorisationError") {
}
exports.AuthorisationError = AuthorisationError;
class CustomParseError extends effect_1.Data.TaggedClass("CustomParseError") {
}
exports.CustomParseError = CustomParseError;
class JSONParseError extends effect_1.Data.TaggedClass("JSONParseError") {
}
exports.JSONParseError = JSONParseError;
class IllegalGameStateError extends effect_1.Data.TaggedClass("IllegalGameStateError") {
}
exports.IllegalGameStateError = IllegalGameStateError;
