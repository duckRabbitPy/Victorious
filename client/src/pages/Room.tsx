import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ClientPayload,
  GameState,
  SupportedEffects,
} from "../../../shared/commonTypes";

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("open", (event) => {
      console.log("WebSocket connection opened:", event);
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
  }, []);

  return { gameState, socket };
};

const prepareMessage = ({ effect, authToken, room }: ClientPayload) => {
  return JSON.stringify({
    effect,
    authToken,
    room,
  });
};

const Room = () => {
  const { gameState, socket } = useGameState();
  const { "*": roomNumber } = useParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addNewPlayer = () => {
    const authToken = localStorage.getItem("dominion_auth_token");

    if (!socket) {
      setErrorMessage("Socket is null");
      return;
    }
    if (!authToken) {
      setErrorMessage("Auth token is null");
      return;
    }

    socket.send(
      prepareMessage({
        effect: SupportedEffects.addLivePlayer,
        authToken,
        room: Number(window.location.pathname.split("/")[2]),
      })
    );
  };

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
      <ol style={{ listStyle: "none" }}>
        {gameState?.actor_state.map((actor) => (
          <li key={actor.id}>{`✅ ${actor.name}`}</li>
        ))}
      </ol>
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link to="/">Back to home</Link>
          {
            <button id="player-ready" onClick={addNewPlayer}>
              Ready
            </button>
          }
        </div>
        <div id="game-state">
          <h2>Game state</h2>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      </div>
    </>
  );
};

export default Room;