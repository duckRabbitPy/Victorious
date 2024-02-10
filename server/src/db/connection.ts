import { Pool } from "pg";
import { Context, Effect as E } from "effect";

export interface DBConnection {
  readonly pool: E.Effect<never, never, Pool>;
}

export const DBConnection = Context.Tag<DBConnection>();

export const program = DBConnection.pipe(
  E.flatMap((connection) => connection.pool)
);

export const DBConnectionLive = DBConnection.of({
  pool: E.sync(() => {
    return process.env.NODE_ENV === "production"
      ? new Pool({
          connectionString: process.env.PROD_DATABASE_URL,
          max: 40,
        })
      : new Pool({
          user: "postgres",
          host: "localhost",
          database: process.env.DEV_PG_NAME,
          password: "postgres",
          port: 5432,
        });
  }),
});

export const DBConnectionTest = DBConnection.of({
  pool: E.sync(() => {
    console.log("env name", process.env.VITE_DEV_PG_NAME);
    return new Pool({
      user: "postgres",
      host: "localhost",
      database: process.env.DEV_PG_NAME,
      password: "postgres",
      port: 5432,
    });
  }),
});
