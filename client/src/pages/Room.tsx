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

import React, { useEffect, useState } from "react";
import {
  LOCAL_STORAGE_AUTH_KEY,
  LOCAL_STORAGE_USERNAME_KEY,
  THEME_COLORS,
} from "../constants";
import { BiSolidCastle } from "react-icons/bi";

import {
  CardName,
  Phases,
  botNamePrefixes,
  countToCardNamesArray,
  getUserNameColors,
} from "../../../shared/common";
import { BackgroundSelector } from "../components/BackgroundSelector";

import { ResetPlayedTreasuresButton } from "../components/ResetPlayedTreasures";
import { handleBotPlayerTurn } from "../effects/effects";

import { EndActionsButton } from "../components/EndActionsButton";
import { Spacer } from "../components/Utils";
import useSound from "../hooks/useSound";
import { FaInfoCircle } from "react-icons/fa";
import { ConnectingStatus } from "../components/Connecting";

const Room = ({
  loggedInUsername,
  setBackgroundIndex,
}: {
  loggedInUsername: string;
  setBackgroundIndex: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { "*": roomParam } = useParams();
  const roomNumber = Number(roomParam);
  const authToken = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
  const [supplyCardInFocus, setSupplyCardInFocus] = useState<CardName | null>(
    null
  );
  const { gameState, socket, chatLog, errorMessage, setErrorMessage } =
    useGameState();

  const { loseSound, winSound } = useSound();

  const isNominatedMsgSenderForBots =
    gameState?.actor_state
      .map((a) => a.name)
      .filter((name) =>
        botNamePrefixes.every((prefix) => !name.startsWith(prefix))
      )[0] === loggedInUsername;

  const winningPlayer = gameState?.actor_state
    .slice()
    .sort((a, b) => b.victoryPoints - a.victoryPoints)
    .map((actor) => actor.name)[0];

  const endGameSound =
    winningPlayer === loggedInUsername ? winSound : loseSound;

  useEffect(() => {
    if (gameState?.game_over) {
      endGameSound?.play();
    }
  }, [gameState?.game_over, endGameSound]);

  useEffect(() => {
    if (
      gameState &&
      isNominatedMsgSenderForBots &&
      gameState.actor_state.length > 1 &&
      gameState.actor_state
        .map((a) => countToCardNamesArray(a.hand).length)
        .reduce((a, b) => a + b, 0) > 0
    ) {
      const currentActivePlayerState =
        gameState.actor_state[gameState.turn % gameState.actor_state.length];

      const currentPlayerIsBot = botNamePrefixes.some((prefix) =>
        currentActivePlayerState?.name.startsWith(prefix)
      );

      setTimeout(() => {
        if (currentPlayerIsBot) {
          handleBotPlayerTurn({
            socket,
            authToken,
            roomNumber,
            mutationIndex: gameState.mutation_index,
            setErrorMessage,
          });
        }
      }, 1000);
    }
  }, [
    authToken,
    gameState,
    isNominatedMsgSenderForBots,
    roomNumber,
    setErrorMessage,
    socket,
  ]);

  const coreRoomInfo = { socket, authToken, roomNumber };
  const coreUserInfo = {
    loggedInUsername,
    currentUserState: gameState?.actor_state.find(
      (a) => a.name === localStorage.getItem(LOCAL_STORAGE_USERNAME_KEY)
    ),
  };

  if (!gameState || !socket)
    return <ConnectingStatus gameState={gameState} socket={socket} />;

  const userNameColors = getUserNameColors(
    gameState.actor_state.map((a) => a.name)
  );
  const gameStarted = gameState.turn > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        maxHeight: "100vh",
        justifyContent: "center",
      }}
    >
      {errorMessage && (
        <>
          <div
            style={{
              color: THEME_COLORS.lightRed,
              alignSelf: "center",
            }}
          >{`Error: ${errorMessage}`}</div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ maxWidth: "fit-content", alignSelf: "center" }}
          >
            continue from savepoint
          </button>
        </>
      )}
      {gameState.game_over ? (
        <div>
          <Link to="/">Back to home</Link>
          <h1 style={{ margin: 0 }}>Game over!</h1>
          {winningPlayer === loggedInUsername ? "You win!" : "You lose!"}
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
                {gameState.actor_state
                  .slice()
                  .sort((a, b) => b.victoryPoints - a.victoryPoints)
                  .map((actor) => (
                    <div key={actor.name}>
                      <span
                        style={{
                          color: userNameColors[actor.name],
                        }}
                      >
                        {actor.name}:
                      </span>{" "}
                      {actor.victoryPoints}
                    </div>
                  ))}
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h2 style={{ margin: 0, color: "lightgreen" }}>Winner:</h2>
              <span
                style={{
                  color: winningPlayer && userNameColors[winningPlayer],
                }}
              >
                {winningPlayer}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div id="active-gameroom-outer-container">
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
                {gameState.actor_state.find(
                  (a) => a.name === loggedInUsername
                ) &&
                  gameState.turn < 1 && (
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
                    gap: "0.5rem",
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
                      setSupplyCardInFocus,
                      supplyCardInFocus,
                    }}
                  />

                  <div
                    style={{
                      minHeight: "50px",
                    }}
                  >
                    {isUsersTurn(gameState, loggedInUsername) && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {coreUserInfo?.currentUserState?.phase ===
                          Phases.Action && (
                          <EndActionsButton
                            props={{
                              gameState,
                              coreRoomInfo,
                              coreUserInfo,
                              setErrorMessage,
                            }}
                          />
                        )}
                        <EndTurnButton
                          props={{
                            gameState,
                            coreRoomInfo,
                            coreUserInfo,
                            setErrorMessage,
                          }}
                        />
                        <ResetPlayedTreasuresButton
                          gameState={gameState}
                          coreRoomInfo={coreRoomInfo}
                          coreUserInfo={coreUserInfo}
                          setErrorMessage={setErrorMessage}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Spacer />

              <PlayerHand
                coreRoomInfo={coreRoomInfo}
                coreUserInfo={coreUserInfo}
                gameState={gameState}
                setErrorMessage={setErrorMessage}
                setSupplyCardInFocus={setSupplyCardInFocus}
              />
            </div>

            <div id="game-history-chat-controls-container">
              <div style={{ display: "flex", gap: "1rem" }}>
                <div
                  style={{
                    backgroundColor: THEME_COLORS.translucentBlack,
                    color: "white",
                    padding: "1rem",
                    width: "100%",
                  }}
                >
                  Playing as :{" "}
                  <span style={{ color: userNameColors[loggedInUsername] }}>
                    {loggedInUsername}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                    }}
                  >
                    <Link
                      to="/"
                      style={{
                        backgroundColor: THEME_COLORS.translucentStraw,
                        maxWidth: "fit-content",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem",
                        fontSize: "1.2rem",
                        borderRadius: "0.5rem",
                        alignSelf: "center",
                      }}
                    >
                      Back to home <BiSolidCastle size={50} />
                    </Link>
                    <Link
                      to={"/info"}
                      style={{ alignSelf: "flex-start", display: "flex" }}
                      target="_blank"
                    >
                      <FaInfoCircle size={20} color={THEME_COLORS.victory} />
                    </Link>
                  </div>

                  <BackgroundSelector setBackgroundIndex={setBackgroundIndex} />
                </div>
              </div>

              {gameStarted && <HistoryLog gameState={gameState} />}
              <ChatLog
                chatLog={chatLog}
                userNames={gameState.actor_state.map((a) => a.name)}
                setErrorMessage={setErrorMessage}
                socket={socket}
              />
            </div>
          </div>
        </>
      )}

      <GameStateDebugDisplay gameState={gameState} />
    </div>
  );
};

export default Room;
