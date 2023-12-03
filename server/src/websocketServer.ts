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

type RoomConnections = {
  socket: WebSocket;
  room: number;
}[];

export function createWebsocketServer(port: number): void {
  const roomConnections: RoomConnections = [];

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

    const broacastNewGameState = (newGameState: GameState) => {
      if (
        roomConnections.map((connection) => connection.room).includes(room) ===
        false
      ) {
        roomConnections.push({ socket: ws, room });
      }

      ws.send(JSON.stringify(newGameState));
      roomConnections?.forEach((connection) => {
        // only broadcast to sessions with same room
        // todo: narrow to session and cleanup dead connections
        if (
          connection.socket !== ws &&
          connection.socket.readyState === ws.OPEN &&
          connection.room === room &&
          connection.socket !== ws
        ) {
          connection.socket.send(JSON.stringify(newGameState));
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
