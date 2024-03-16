import { Pool } from "pg";
import { Context, Effect as E, Layer } from "effect";

export class DBConnection extends Context.Tag("DBConnection")<
  DBConnection,
  { readonly pool: E.Effect<Pool, never, never> }
>() {}

export const DBConnectionLive = Layer.succeed(
  DBConnection,
  DBConnection.of({
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
  })
);

export const DBConnectionTest = DBConnection.of({
  pool: E.sync(() => {
    return new Pool({
      user: "postgres",
      host: "localhost",
      database: process.env.DEV_PG_NAME,
      password: "postgres",
      port: 5432,
    });
  }),
});
