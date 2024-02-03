# README:

## Development

`yarn dev:server` - start the backend server which runs on port 3000

`yarn dev:client` - starts the client using vite dev server on port 5173

`yarn regen` - wipes out the client node modules and runs the dev server, is useful if dev:client fails due to cacheing issues

(run these commands in seperate terminals)

---

## Testing

`yarn test` - runs vite unit tests and db tests

---

## production

`yarn build` - creates a javascript build in /dist in the client and the server directories

`yarn start` - runs the server in production mode (this should be only be run on the production host server e.g. render.com / koyeb.com) the client is served by the express server as a static asset

## Environmental variables

the .env file is not checked into git, add a .env file to the root of the project with the following keys

NODE_ENV = string (development | production)

PROD_DATABASE_URL= (postgres connection string e.g. "postgres://postgres.xyz:[YOUR-PASSWORD]@aws-0-eu-west-2.supabase.com")

PORT = (number e.g 3000)

JWT_SECRET_KEY= (string e.g "MY_VERY_SECRET_KEY")

SENDER_EMAIL= (string e.g. "sender.account@gmail.com")

GMAIL_APP_PASSWORD= (string e.g "jfijsfnjnwesnksl")

DEV_PG_NAME= (string e.g. "victorious_pg_test")

## Misc

Press ctrl + d to see full gamestate while playing a game
