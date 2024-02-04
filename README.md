# README:

## Development

`yarn dev:server` - start the backend server which runs on port 3000

`yarn dev:client` - starts the client using vite dev server on port 5173

`yarn regen` - wipes out the client node modules and runs the dev server, is useful if dev:client fails due to cacheing issues

(run these commands in seperate terminals)

## Testing

`yarn test` - runs vite unit tests and db tests

## Production

`yarn build` - creates a javascript build in /dist in the client and the server directories

`yarn start` - runs the server in production mode (this should be only be run on the production host server e.g. render.com) the client is served by the express server as a static asset

## Environmental variables

the .env file is not checked into git, add a .env file to the root of the project with the following keys

NODE_ENV= string (development | production)

PROD_DATABASE_URL= (postgres connection string e.g. "postgres://postgres.xyz:[YOUR-PASSWORD]@aws-0-eu-west-2.supabase.com")

PORT= (number e.g 3000)

JWT_SECRET_KEY= (string e.g "MY_VERY_SECRET_KEY")

SENDER_EMAIL= (string e.g. "sender.account@gmail.com")

GMAIL_APP_PASSWORD= (string e.g "jfijsfnjnwesnksl")

DEV_PG_NAME= (string e.g. "victorious_pg_test")

## Misc

Press ctrl + d to see full gamestate while playing a game

## Tech stack
<img width="1344" alt="Screenshot 2024-02-04 at 14 42 58" src="https://github.com/duckRabbitPy/Victorious/assets/78092825/916a3e7f-3563-4bf8-984b-cee9fc7ef9dc">

##### Backend

- Node js
- Express Http server
- Node Websockets
- Effect TS functional error handling and Effect system
- Node mailer
- Vitest
- Postgres

##### Frontend

- Vite + React
- Typescript

##### Deployment

- Render.com
- Supabase for Postgres

## What is Effect?

EffectTS is a library that provides a powerful way to work with systems that can both succeed and fail in different places and in different ways.

The Effect module provides us with an immutable value `Effect<Requirements, Error, Value>` that represents both the success case and the failure case of an operation in its type definition.

These immutable lazy values can be passed around the program so that every operation that requires a success result is guaranteed to have it.

The Effect module has been written to accomodate a functional style of programming, Effect immutable values can be mapped, flatmapped, piped, zipped and composed in numerous ways.

Failure cases that can occur on writing to a database, parsing user input, sending a network request, validating json etc. are omitted from the 'happy path' of pipe operations which means you can code with confidence that your values are correct, possible errors and failures accumulate in the error channel which can be handled separately.

See for example my `getDataEffect` below, it is an Effect that if successful will return a Todo or array of Todos or void. I also have the types for all of my potential errors `ParseError | PostgresError | ParameterError | ItemNotFoundError`

I can match on different error cases and return custom error messages. With throw and try..catch there is nothing at all in the function type signature that tells you if that function can throw and what type of error it will throw. With Effect you can know at every point in your system what the success and failure case will be, this makes it easy to write composable, reliable and perfomant systems.

```ts
getDataEffect: Effect.Effect<
  never,
  ParseError | PostgresError | ParameterError | ItemNotFoundError,
  Todo | readonly Todo[] | void
>;
```
