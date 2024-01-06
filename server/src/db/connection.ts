import { Pool } from "pg";
import { Context, Effect } from "effect";

export interface DBConnection {
  readonly pool: Effect.Effect<never, never, Pool>;
}

export const DBConnection = Context.Tag<DBConnection>();

export const program = DBConnection.pipe(
  Effect.flatMap((connection) => connection.pool)
);

export const DBConnectionLive = DBConnection.of({
  pool: Effect.sync(() => {
    return process.env.NODE_ENV === "production"
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
  }),
});

export const DBConnectionTest = DBConnection.of({
  pool: Effect.sync(() => {
    return new Pool({
      user: "postgres",
      host: "localhost",
      database: "dominion_pg_test",
      password: "postgres",
      port: 5432,
    });
  }),
});
