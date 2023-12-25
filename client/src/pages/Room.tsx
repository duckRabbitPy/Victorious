import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { GameState } from "../../../shared/common";
import { getInititalGameState } from "../effects/effects";

import { isUsersTurn } from "../../../shared/utils";
import PlayerHand from "../components/PlayerHand";
import Supply from "../components/Supply";
import TurnInfo from "../components/TurnInfo";
import EndTurnButton from "../components/EndTurnButton";
import StartGameButton from "../components/StartGameButton";
import ActivePlayerInfo from "../components/ActivePlayerInfo";
import GameStateDebugDisplay from "../components/GameStateDebug";
import ChatLog from "../components/ChatLog";

const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [initialGameStateFetched, setInitialGameStateFetched] = useState(false);

  useEffect(() => {
    const newSocket = new WebSocket("ws://localhost:8080");

    newSocket.addEventListener("message", (event) => {
      setGameState(JSON.parse(event.data));
    });

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

    newSocket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
    });

    setSocket(newSocket);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameState, socket };
};

const Room = ({ loggedInUsername }: { loggedInUsername: string }) => {
  const { gameState, socket } = useGameState();
  const { "*": roomParam } = useParams();
  const roomNumber = Number(roomParam);
  const authToken = localStorage.getItem("dominion_auth_token");

  const coreRoomInfo = { socket, authToken, roomNumber };
  const coreUserInfo = {
    loggedInUsername,
    currentUserState: gameState?.actor_state.find(
      (a) => a.name === localStorage.getItem("dominion_user_name")
    ),
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!gameState) return <div>Error fetching game state from server...</div>;

  return (
    <>
      {errorMessage && (
        <>
          <div style={{ color: "red" }}>{`Error: ${errorMessage}`}</div>
          <button onClick={() => setErrorMessage(null)}>clear</button>
        </>
      )}
      <div>
        <ActivePlayerInfo
          coreUserInfo={coreUserInfo}
          gameState={gameState}
          coreRoomInfo={coreRoomInfo}
          setErrorMessage={setErrorMessage}
        />
        <div>
          {gameState.actor_state.length > 1 && gameState.turn < 1 && (
            <StartGameButton
              coreRoomInfo={coreRoomInfo}
              setErrorMessage={setErrorMessage}
            />
          )}

          {gameState.turn > 0 && isUsersTurn(gameState, loggedInUsername) && (
            <EndTurnButton
              coreRoomInfo={coreRoomInfo}
              coreUserInfo={coreUserInfo}
              gameState={gameState}
              setErrorMessage={setErrorMessage}
            />
          )}
        </div>

        {(gameState.turn || 0) > 0 && (
          <>
            <TurnInfo coreUserInfo={coreUserInfo} gameState={gameState} />
            <Supply
              coreRoomInfo={coreRoomInfo}
              coreUserInfo={coreUserInfo}
              gameState={gameState}
              setErrorMessage={setErrorMessage}
            />
          </>
        )}

        <PlayerHand
          coreRoomInfo={coreRoomInfo}
          coreUserInfo={coreUserInfo}
          setErrorMessage={setErrorMessage}
          gameState={gameState}
        />

        <ChatLog />
        <GameStateDebugDisplay gameState={gameState} />
      </div>
    </>
  );
};

export default Room;
