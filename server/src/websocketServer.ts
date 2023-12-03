import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import {
  addLivePlayerQuery,
  incrementTurnQuery,
} from "./models/gamestate/mutations";
import * as Schema from "@effect/schema/Schema";
import { pipe } from "effect";
import { JSONParseError } from "./controllers/customErrors";
import {
  ClientPayloadStruct,
  ClientPayload,
  GameState,
} from "../../shared/commonTypes";
import { safeParseGameState, safeParseJWT, verifyJwt } from "./utils";
import { getLatestLiveGameSnapshot } from "./controllers/game-session/requestHandlers";

const parseClientMessage = Schema.parse(ClientPayloadStruct);

export function useWebsocketServer(port: number): void {
  const clients = new Set<WebSocket>();

  const wss = new WebSocket.Server({ port });

  const handleMessage = (msg: ClientPayload, ws: WebSocket) => {
    const room = Number(msg.room);
    const authToken = msg.authToken;
    const decodedJwt = verifyJwt(authToken, process.env.JWT_SECRET_KEY);

    const userDetailsOrError = pipe(
      decodedJwt,
      Effect.flatMap((decoded) => safeParseJWT(decoded)),
      Effect.flatMap((decoded) =>
        Effect.succeed({
          userId: decoded.userId,
          username: decoded.username,
        })
      )
    );

    const currentGameState = getLatestLiveGameSnapshot({ room });
    // lock postgres gamestate row

    const broacastNewGameState = (newGameState: GameState) => {
      ws.send(JSON.stringify(newGameState));
      clients?.forEach((client) => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(JSON.stringify(newGameState));
        }
      });
      return Effect.unit;
    };

    switch (msg.effect) {
      // read only operation
      case "getCurrentGameState": {
        pipe(
          userDetailsOrError,
          Effect.flatMap(() => getLatestLiveGameSnapshot({ room })),
          Effect.flatMap((newGameState) => broacastNewGameState(newGameState)),
          Effect.runPromise
        );
        break;
      }
      // mutation operations
      case "addLivePlayer": {
        pipe(
          Effect.all({ userInfo: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ userInfo, currentGameState }) =>
            addLivePlayerQuery({
              userId: userInfo.userId,
              username: userInfo.username,
              currentGameState,
            })
          ),
          Effect.flatMap((newGameState) => broacastNewGameState(newGameState)),
          Effect.runPromise
        );
        break;
      }

      case "incrementTurn": {
        pipe(
          Effect.all({ userId: userDetailsOrError, currentGameState }),
          Effect.flatMap(({ currentGameState }) =>
            incrementTurnQuery(currentGameState)
          ),
          Effect.flatMap((gameState) => safeParseGameState(gameState)),
          Effect.flatMap((newGameState) => broacastNewGameState(newGameState)),
          Effect.runPromise
        );
        break;
      }
    }
    return Effect.unit;
  };

  wss.on("connection", function connection(ws: WebSocket) {
    ws.on("message", function message(msg: unknown) {
      clients.add(ws);

      pipe(
        Effect.try({
          try: () => JSON.parse(msg as string),
          catch: (e) =>
            new JSONParseError({
              message: `error parsing client message: ${e}`,
            }),
        }),
        Effect.flatMap((msg) => parseClientMessage(msg)),
        Effect.flatMap((msg) => handleMessage(msg, ws)),
        Effect.runSync
      );
    });
  });
}
