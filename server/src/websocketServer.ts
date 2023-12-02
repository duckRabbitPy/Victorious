import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import { addLivePlayerQuery, incrementTurnQuery } from "./models/gamestate";
import * as Schema from "@effect/schema/Schema";
import { pipe } from "effect";
import { JSONParseError } from "./controllers/customErrors";
import { ClientPayloadStruct, ClientPayload } from "../../shared/commonTypes";
import { safeParseJWT, verifyJwt } from "./utils";

const parseClientMessage = Schema.parse(ClientPayloadStruct);

export function useWebsocketServer(port: number): void {
  const clients = new Set<WebSocket>();

  const wss = new WebSocket.Server({ port });

  const handleMessage = (msg: ClientPayload, ws: WebSocket) => {
    const room = Number(msg.room);
    const authToken = msg.authToken;
    const decodedJwt = verifyJwt(authToken, process.env.JWT_SECRET_KEY);

    const userIdOrError = pipe(
      decodedJwt,
      Effect.flatMap((decoded) => safeParseJWT(decoded)),
      Effect.flatMap((decoded) => Effect.succeed(decoded.userId))
    );

    switch (msg?.effect) {
      case "addLivePlayer": {
        const addLivePlayer = pipe(
          userIdOrError,
          Effect.flatMap((userId) => addLivePlayerQuery(userId, room)),
          Effect.runPromise
        );

        addLivePlayer.then((data) => {
          ws.send(JSON.stringify(data));

          clients?.forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        });
        break;
      }
      case "next": {
        const room = msg.room;
        Effect.runPromise(incrementTurnQuery(room)).then((data) => {
          ws.send(JSON.stringify(data));

          clients?.forEach((client) => {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        });
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
