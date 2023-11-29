import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GameState } from "../../shared/commonTypes";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

const Room = () => {
  const { gameState, socket } = useGameState();
  const { "*": roomNumber } = useParams();

  const addNewPlayer = () => {
    function getAuthToken() {
      // TODO: get auth token from cookie after sign in
      // generate a random uuid for now
      return uuidv4();
    }

    if (!socket) throw new Error("Socket is null");

    socket.send(
      JSON.stringify({
        effect: "addLivePlayer",
        authToken: getAuthToken(),
        room: window.location.pathname.split("/")[2],
      })
    );
  };

  console.log("gameState", gameState);
  return (
    <>
      <h1>Room {roomNumber}</h1>
      <p>Players ready: {gameState?.actor_state.length}</p>
      <ol style={{ listStyle: "none" }}>
        {gameState?.actor_state.map((actor) => (
          <li key={actor.id}>{`✅ ${actor.name}`}</li>
        ))}
      </ol>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "2rem",
          alignItems: "center",
        }}
      >
        <Link to="/">Back to home</Link>
        <button id="player-ready" onClick={addNewPlayer}>
          Ready
        </button>
        <button id="next" onClick={() => {}}>
          Next
        </button>
      </div>
      <div id="game-state">
        <h2>Game state</h2>
        <pre style={{ width: "100px", display: "flex" }}>
          {JSON.stringify(gameState, null, 2)}
        </pre>
      </div>
    </>
  );
};

export default Room;
