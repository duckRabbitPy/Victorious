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
import React from "react";
import { Backgrounds, THEME_COLORS } from "../constants";
import { BiSolidCastle } from "react-icons/bi";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const Room = ({
  loggedInUsername,
  setBackgroundIndex,
}: {
  loggedInUsername: string;
  setBackgroundIndex: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const debug = true;
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
    return <div>Error fetching game state from server... </div>;

  const gameStarted = gameState.turn > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {errorMessage && (
        <>
          <div style={{ color: "red" }}>{`Error: ${errorMessage}`}</div>
          <button onClick={() => setErrorMessage(null)}>clear</button>
        </>
      )}
      <Link
        to="/"
        style={{
          backgroundColor: THEME_COLORS.translucentStraw,
          maxWidth: "fit-content",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.5rem",
          borderRadius: "0.5rem",
          alignSelf: "flex-end",
        }}
      >
        Back to home <BiSolidCastle />
      </Link>
      <div>Playing as : {loggedInUsername}</div>

      {gameState.game_over ? (
        <>
          <div>
            <h1 style={{ margin: 0 }}>Game over!</h1>
            {gameState.actor_state
              .slice()
              .sort((a, b) => a.victoryPoints - b.victoryPoints)
              .map((actor) => actor.name)[0] === loggedInUsername
              ? "You win!"
              : "You lose!"}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                color: "white",
                backgroundColor: `rgba(28, 26, 27, 0.66)`,
              }}
            >
              <div>
                <h2>Final scores:</h2>
                <div>
                  {gameState.actor_state.map((actor) => (
                    <div key={actor.name}>
                      {actor.name}: {actor.victoryPoints}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "1rem", color: "lightgreen" }}>
                <h2 style={{ margin: 0 }}>Winner:</h2>
                {
                  gameState.actor_state
                    .slice()
                    .sort((a, b) => a.victoryPoints - b.victoryPoints)
                    .map((actor) => actor.name)[0]
                }
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: "1rem", color: "white" }}>
            <button
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => {
                setBackgroundIndex((i = 0) =>
                  i === 0 ? Backgrounds.length : i - 1
                );
              }}
            >
              <FaArrowLeft />
            </button>
            <button
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => {
                setBackgroundIndex((i) =>
                  i === Backgrounds.length - 1 ? 0 : i + 1
                );
              }}
            >
              <FaArrowRight />
            </button>
          </div>

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
                    gameState={gameState}
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

            <div
              style={{ display: "flex", gap: "1rem", flexDirection: "column" }}
            >
              {gameStarted && <HistoryLog gameState={gameState} />}

              <ChatLog
                chatLog={chatLog}
                userNames={gameState.actor_state.map((actor) => actor.name)}
                setErrorMessage={setErrorMessage}
                socket={socket}
              />
            </div>
          </div>
        </>
      )}

      {debug && <GameStateDebugDisplay gameState={gameState} />}
    </div>
  );
};

export default Room;
