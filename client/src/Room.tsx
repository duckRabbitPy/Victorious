import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const useGameState = () => {
  // TODO share types between client and server
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gameState, setGameState] = useState<any | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.addEventListener("open", (event) => {
      console.log("WebSocket connection opened:", event);
    });

    socket.addEventListener("message", (event) => {
      console.log("Received message:", event.data);
      setGameState(JSON.parse(event.data));
    });

    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });
  }, []);

  return gameState;
};

// const addNewPlayer = () => {
//   function getAuthToken() {
//     // TODO: get auth token from cookie after sign in
//     // generate a random uuid for now
//     return uuidv4();
//   }

//   function addLivePlayer() {
//     socket.send(
//       JSON.stringify({
//         effect: "addLivePlayer",
//         authToken: getAuthToken(),
//         room: window.location.pathname.split("/")[2],
//       })
//     );
//   }
// };

const Room = () => {
  const gameState = useGameState();
  const { 0: roomParam } = useParams();

  console.log("gameState", gameState);
  return (
    <>
      <h1>Room {roomParam}</h1>
      <h2>Players</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Link href="/">Back to home</Link>
        <button id="player-ready" onClick={() => {}}>
          Ready
        </button>
        <button id="next" onClick={() => {}}>
          Next
        </button>

        <div id="game-state">
          <h2>Game state</h2>
          <pre id="game-state-text"></pre>
        </div>
      </div>
    </>
  );
};

export default Room;
