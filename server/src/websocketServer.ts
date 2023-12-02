import * as Effect from "@effect/io/Effect";
import WebSocket from "ws";
import { addLivePlayerQuery, incrementTurnQuery } from "./models/gamestate";
import * as Schema from "@effect/schema/Schema";
import { pipe } from "effect";
import { JSONParseError } from "./controllers/customErrors";
import { safeParseJWT, verifyJwt } from "./utils";

const clientPayloadStruct = Schema.struct({
  effect: Schema.string,
  room: Schema.number,
  authToken: Schema.string,
});

const parseClientMessage = Schema.parse(clientPayloadStruct);

export function useWebsocketServer(port: number): void {
  const clients = new Set<WebSocket>();

  const wss = new WebSocket.Server({ port });

  wss.on("connection", function connection(ws: WebSocket) {
    ws.on("message", function message(msg: unknown) {
      clients.add(ws);

      const safeMsg = pipe(
        Effect.try({
          try: () => JSON.parse(msg as string),
          catch: (e) =>
            new JSONParseError({
              message: `error parsing client message: ${e}`,
            }),
        }),
        Effect.flatMap((msg) =>
          Effect.succeed({ ...msg, room: Number(msg.room) })
        ),
        Effect.flatMap((msg) => parseClientMessage(msg)),
        Effect.runSync
      );

      switch (safeMsg?.effect) {
        case "addLivePlayer": {
          const room = Number(safeMsg.room);
          const authToken = safeMsg.authToken;

          const decodedJwt = verifyJwt(authToken, process.env.JWT_SECRET_KEY);

          const addLivePlayer = pipe(
            decodedJwt,
            Effect.flatMap((decoded) => safeParseJWT(decoded)),
            Effect.flatMap((decoded) => Effect.succeed(decoded.userId)),
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
          const room = safeMsg.room;
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
    });
  });
}
