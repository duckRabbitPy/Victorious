import { Pool } from "pg";
import dotenv from "dotenv";
import { Effect } from "effect";
import { PostgresError } from "../controllers/customErrors";

dotenv.config();

console.log("NODE_ENV for db connection", process.env.NODE_ENV);

const environment = process.env.NODE_ENV;

const maybePool =
  environment === "production"
    ? new Pool({
        connectionString: process.env.PROD_DATABASE_URL,
        max: 40,
      })
    : new Pool({
        user: "postgres",
        host: "localhost",
        database: "dominion_pg_test",
        password: "postgres",
        port: 5432,
      });

const getPoolOrThrow = (pool: Pool | null) => {
  if (pool) {
    return Effect.succeed(pool);
  }
  return Effect.fail(new PostgresError({ message: "No pool" }));
};

export const pool = Effect.runSync(getPoolOrThrow(maybePool));
