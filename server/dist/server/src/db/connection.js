"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionTest = exports.ConnectionLive = exports.program = exports.Connection = void 0;
const pg_1 = require("pg");
const effect_1 = require("effect");
exports.Connection = effect_1.Context.Tag();
exports.program = exports.Connection.pipe(effect_1.Effect.flatMap((connection) => connection.pool));
exports.ConnectionLive = exports.Connection.of({
    pool: effect_1.Effect.sync(() => {
        console.log("NODE_ENV for db connection", process.env.NODE_ENV);
        return process.env.NODE_ENV === "production"
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
    }),
});
exports.ConnectionTest = exports.Connection.of({
    pool: effect_1.Effect.sync(() => {
        return new pg_1.Pool({
            user: "postgres",
            host: "localhost",
            database: "dominion_pg_test",
            password: "postgres",
            port: 5432,
        });
    }),
});
