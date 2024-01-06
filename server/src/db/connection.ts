import { Pool } from "pg";
import { Context, Effect } from "effect";

export interface Connection {
  readonly pool: Effect.Effect<never, never, Pool>;
}

export const Connection = Context.Tag<Connection>();

export const program = Connection.pipe(
  Effect.flatMap((connection) => connection.pool)
);

export const ConnectionLive = Connection.of({
  pool: Effect.sync(() => {
    console.log("NODE_ENV for db connection", process.env.NODE_ENV);
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

export const ConnectionTest = Connection.of({
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
