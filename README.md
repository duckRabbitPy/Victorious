# README:

Welcome to Victorious, an online realtime multiplayer deck building game. Available to play for free at: https://victorious-duckrabbit.koyeb.app

## Sign up and log in

Register with an email address and password.

Log in and create a room to play in, or join an open room.

You can now play against other online players, against bots or play with mix of real players and bots!


#  How to Play


## Cards

To inspect a card, right click on that card to read the description and understand what the card does.  
There are 250 cards in the game in total and three types of cards: Treasure, Action and Victory.  
You start each turn with 5 cards in your hand.

#####  Action phase

Each turn you have the opportunity to play Action cards from your hand if you have them and if you have enough actions to do so.  
Playing action cards has a variety of positive effects such as increasing the number of buys, actions or cards.

#####  Buy phase

After the Action phase you have the opportunity to play treasure cards in your hand, the more treasures you play the more cash you will have to buy expensive and powerful cards.  
Choose which cards you buy wisely based on what you need and how many buys you have available (typically at the start of the game you will need to buy treasure cards and at the end you will buy victory cards).  
Victory cards secure victory points which will be needed to win the game.  
When you have run out of buys or cash you must end your turn.

#####  End game

The game ends when 3 piles are empty, or if the province pile is empty.  
When the game ends the player with the most victory points wins.

# Tech stack

I used this project to explore different technologies in my own time, this project was great for playing with websockets and realtime data as well as the EffectTS functional programming ecosystem.

<img width="1260" alt="Screenshot 2024-02-06 at 21 28 49" src="https://github.com/duckRabbitPy/Victorious/assets/78092825/165aba36-aafe-4e18-af96-9317ddb01459">

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

- Koyeb.com

## What is Effect?

EffectTS is a library that provides a powerful way to work with systems that can both succeed and fail in different places and in different ways.

The Effect module provides us with an immutable value `Effect<Requirements, Error, Value>` that represents both the success case and the failure case of an operation in its type definition.

These immutable lazy values can be passed around the program so that every operation that requires a success result is guaranteed to have it.

The Effect module has been written to accomodate a functional style of programming, Effect immutable values can be mapped, flatmapped, piped, zipped and composed in numerous ways.

<img width="655" alt="Screenshot 2024-03-21 at 01 12 16" src="https://github.com/duckRabbitPy/Victorious/assets/78092825/fe56608d-f837-481f-8e82-467157fc2998">

Failure cases that can occur on writing to a database, parsing user input, sending a network request, validating json etc. are omitted from the 'happy path' of pipe operations which means you can code with confidence that your values are correct, possible errors and failures accumulate in the error channel which can be handled separately.

I can match on different error cases and return custom error messages. With throw and try..catch there is nothing at all in the function type signature that tells you if that function can throw and what type of error it will throw. With Effect you can know at every point in your system what the success and failure case will be, this makes it easy to write composable, reliable and performant systems.

<img width="895" alt="Screenshot 2024-03-21 at 01 05 46" src="https://github.com/duckRabbitPy/Victorious/assets/78092825/61819496-c801-4462-bfa5-03af4af194a6">



## Development

If you want to play around with the repo, you'll need a postgres db and a gmail account for nodemailer

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
