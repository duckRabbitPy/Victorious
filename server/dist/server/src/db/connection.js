"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const effect_1 = require("effect");
const customErrors_1 = require("../controllers/customErrors");
dotenv_1.default.config();
console.log("NODE_ENV for db connection", process.env.NODE_ENV);
const environment = process.env.NODE_ENV;
const maybePool = environment === "production"
    ? new pg_1.Pool({
        connectionString: process.env.PROD_DATABASE_URL,
        max: 40,
    })
    : new pg_1.Pool({
        user: "postgres",
        host: "localhost",
        database: "dominion_pg_test",
        password: "postgres",
        port: 5432,
    });
const getPoolOrThrow = (pool) => {
    if (pool) {
        return effect_1.Effect.succeed(pool);
    }
    return effect_1.Effect.fail(new customErrors_1.PostgresError({ message: "No pool" }));
};
exports.pool = effect_1.Effect.runSync(getPoolOrThrow(maybePool));
