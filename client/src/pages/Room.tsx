import { useParams } from "react-router-dom";
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
          coreRoomInfo={coreRoomInfo}
          gameState={gameState}
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
          gameState={gameState}
          setErrorMessage={setErrorMessage}
        />

        {
          <ChatLog
            chatLog={chatLog}
            setErrorMessage={setErrorMessage}
            socket={socket}
          />
        }

        <GameStateDebugDisplay gameState={gameState} />
      </div>
    </>
  );
};

export default Room;
