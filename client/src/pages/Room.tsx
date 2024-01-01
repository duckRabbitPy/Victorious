import { Link, useParams } from "react-router-dom";
import { isUsersTurn } from "../../../shared/utils";
import PlayerHand from "../components/PlayerHand";
import Supply from "../components/Supply";
import TurnInfo from "../components/TurnInfo";
import EndTurnButton from "../components/EndTurnButton";
import StartGameButton from "../components/StartGameButton";
import ActivePlayerInfo from "../components/ActivePlayerInfo";
import GameStateDebugDisplay from "../components/GameStateDebug";
import ChatLog from "../components/ChatLog";
import { useGameState } from "../hooks/useGameState";
import HistoryLog from "../components/HistoryLog";
import OpponentHands from "../components/OpponentHands";
import Spacer from "../components/Spacer";

const Room = ({ loggedInUsername }: { loggedInUsername: string }) => {
  const { gameState, socket, chatLog, errorMessage, setErrorMessage } =
    useGameState();
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

  if (!gameState || !socket)
    return <div>Error fetching game state from server...</div>;

  const gameStarted = gameState.turn > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {errorMessage && (
        <>
          <div style={{ color: "red" }}>{`Error: ${errorMessage}`}</div>
          <button onClick={() => setErrorMessage(null)}>clear</button>
        </>
      )}
      <Link to="/">Back to home</Link>
      <div>Playing as : {loggedInUsername}</div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          {!gameStarted && (
            <ActivePlayerInfo
              props={{
                gameState,
                coreRoomInfo,
                coreUserInfo,
                setErrorMessage,
              }}
            />
          )}
          <div>
            {gameState.actor_state.length > 1 && gameState.turn < 1 && (
              <StartGameButton
                coreRoomInfo={coreRoomInfo}
                setErrorMessage={setErrorMessage}
              />
            )}
          </div>

          {gameStarted && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyItems: "space-between",
                gap: "1rem",
              }}
            >
              <OpponentHands
                gameState={gameState}
                loggedInUsername={loggedInUsername}
              />
              <TurnInfo coreUserInfo={coreUserInfo} gameState={gameState} />
              <Supply
                props={{
                  gameState,
                  coreRoomInfo,
                  coreUserInfo,
                  setErrorMessage,
                }}
              />
              {isUsersTurn(gameState, loggedInUsername) && (
                <EndTurnButton
                  props={{
                    gameState,
                    coreRoomInfo,
                    coreUserInfo,
                    setErrorMessage,
                  }}
                />
              )}
            </div>
          )}

          <Spacer />

          <PlayerHand
            coreRoomInfo={coreRoomInfo}
            coreUserInfo={coreUserInfo}
            gameState={gameState}
            setErrorMessage={setErrorMessage}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
          {gameStarted && <HistoryLog gameState={gameState} />}

          <ChatLog
            chatLog={chatLog}
            setErrorMessage={setErrorMessage}
            socket={socket}
          />
        </div>
      </div>

      <GameStateDebugDisplay gameState={gameState} />
    </div>
  );
};

export default Room;
