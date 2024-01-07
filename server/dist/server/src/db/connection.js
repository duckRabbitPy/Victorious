"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBConnectionTest = exports.DBConnectionLive = exports.program = exports.DBConnection = void 0;
const pg_1 = require("pg");
const effect_1 = require("effect");
exports.DBConnection = effect_1.Context.Tag();
exports.program = exports.DBConnection.pipe(effect_1.Effect.flatMap((connection) => connection.pool));
exports.DBConnectionLive = exports.DBConnection.of({
    pool: effect_1.Effect.sync(() => {
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
exports.DBConnectionTest = exports.DBConnection.of({
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
