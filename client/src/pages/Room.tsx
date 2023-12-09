import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { GameState } from "../../../shared/common";
import {
  addNewPlayer,
  getInititalGameState,
  incrementTurn,
  startGame,
} from "../effects/effects";

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialGameStateFetched, setInitialGameStateFetched] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("open", (event) => {
      console.log("WebSocket connection opened:", event);

      if (!initialGameStateFetched) {
        getInititalGameState({
          socket: newSocket,
          authToken: localStorage.getItem("dominion_auth_token"),
          roomNumber: Number(window.location.pathname.split("/").pop()),
        });
        setInitialGameStateFetched(true);
      }
    });

    newSocket.addEventListener("message", (event) => {
      console.log("Received message:", event.data);
      setGameState(JSON.parse(event.data));
    });

    newSocket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameState, socket };
};

const Room = () => {
  const { gameState, socket } = useGameState();
  const { "*": roomParam } = useParams();
  const roomNumber = Number(roomParam);
  const authToken = localStorage.getItem("dominion_auth_token");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <>
      {errorMessage && (
        <>
          <div style={{ color: "red" }}>{`Error: ${errorMessage}`}</div>
          <button onClick={() => setErrorMessage(null)}>clear</button>
        </>
      )}
      <h1>Room {roomNumber}</h1>
      <p>Players ready: {gameState?.actor_state.length}</p>
      {
        <ol style={{ listStyle: "none" }}>
          {gameState?.actor_state?.map((actor) => (
            <li key={actor.id}>{`✅ ${actor.name}`}</li>
          ))}
        </ol>
      }
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link to="/">Back to home</Link>
          {
            <button
              id="player-ready"
              onClick={() =>
                addNewPlayer({
                  socket,
                  authToken,
                  roomNumber,
                  setErrorMessage,
                })
              }
            >
              Ready
            </button>
          }
        </div>
        <div>
          {gameState?.actor_state && gameState.actor_state.length > 1 && (
            <button
              id="start-game"
              onClick={() => {
                if (gameState.turn === 0) {
                  startGame({
                    socket,
                    authToken,
                    roomNumber,
                    setErrorMessage,
                  });
                }

                incrementTurn({
                  socket,
                  authToken,
                  roomNumber,
                  setErrorMessage,
                });
              }}
            >
              {gameState.turn === 0 ? "Start game" : "End turn"}
            </button>
          )}
        </div>
        <div id="game-state">
          <h2>Game state</h2>
          <button
            onClick={() =>
              getInititalGameState({ socket, authToken, roomNumber })
            }
          >
            refresh
          </button>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      </div>
    </>
  );
};

export default Room;
