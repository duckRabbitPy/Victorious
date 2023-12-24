import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  CardCount,
  CardName,
  GameState,
  Phases,
  cardNameToCard,
  countToCardNamesArray,
  getAllCardNames,
  getCardTypeByName,
  getCardValueByName,
  subtractCardCount,
  zeroCardCount,
} from "../../../shared/common";
import {
  addNewPlayer,
  buyCard,
  getInititalGameState,
  incrementTurn,
  playAction,
  startGame,
} from "../effects/effects";
import { canBuyCard } from "../effects/clientValidation";
import { updateCardsInPlay } from "../utils";
import { isUsersTurn } from "../../../shared/utils";

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

  const [selectedTreasureValue, setSelectedTreasureValue] = useState(0);
  const [cardsInPlay, setCardsInPlay] = useState<CardCount>(zeroCardCount);
  const currentUserState = gameState?.actor_state.find(
    (a) => a.name === localStorage.getItem("dominion_user_name")
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!gameState) return <div>Error fetching game state from server...</div>;

  const currentHand = currentUserState?.hand;

  const visibleHand = currentHand
    ? subtractCardCount(currentHand, cardsInPlay)
    : zeroCardCount;

  return (
    <>
      {errorMessage && (
        <>
          <div style={{ color: "red" }}>{`Error: ${errorMessage}`}</div>
          <button onClick={() => setErrorMessage(null)}>clear</button>
        </>
      )}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        playing as : {loggedInUsername}
      </div>
      <Link to="/">Back to home</Link>
      <h1>Room {roomNumber}</h1>
      <p>Players ready: {gameState.actor_state.length}/2</p>
      {
        <ol style={{ listStyle: "none" }}>
          {gameState.actor_state.map((actor) => (
            <li
              key={actor.id}
              style={{
                color: isUsersTurn(gameState, actor.name) ? "green" : "black",
              }}
            >{`✅ ${actor.name} ${
              isUsersTurn(gameState, actor.name) ? "👈" : ""
            }`}</li>
          ))}
        </ol>
      }
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {gameState.actor_state.every((a) => a.name !== loggedInUsername) && (
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
          )}
        </div>
        <div>
          {/* seperate start and increment buttons */}
          {gameState.actor_state.length > 1 && gameState.turn < 1 && (
            <button
              id="start-game"
              onClick={() => {
                startGame({
                  socket,
                  authToken,
                  roomNumber,
                  setErrorMessage,
                });
              }}
            >
              Start game
            </button>
          )}
          {gameState.turn > 0 && isUsersTurn(gameState, loggedInUsername) && (
            <button
              id="start-game"
              style={
                currentUserState?.buys === 0
                  ? {
                      border: "1px solid green",
                      animation: "pulse 1.2s infinite",
                    }
                  : {}
              }
              onClick={() => {
                if (gameState.turn === 0) {
                  startGame({
                    socket,
                    authToken,
                    roomNumber,
                    setErrorMessage,
                  });
                }
                setCardsInPlay(zeroCardCount);
                incrementTurn({
                  socket,
                  authToken,
                  roomNumber,
                  setErrorMessage,
                });
              }}
            >
              End turn
            </button>
          )}
        </div>

        {(gameState.turn || 0) > 0 && (
          <div>
            <h3>Phase: {currentUserState?.phase}</h3>
            {isUsersTurn(gameState, loggedInUsername) && (
              <>
                <h2>
                  {currentUserState?.phase === Phases.Buy
                    ? "Buy card"
                    : "Play Action"}
                </h2>

                <p>{`actions remaining ${currentUserState?.actions}`}</p>
                <p>{`buys remaining ${currentUserState?.buys}`}</p>
              </>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {getAllCardNames().map((cardName) => (
                <button
                  key={cardName}
                  disabled={
                    !canBuyCard({
                      gameState,
                      loggedInUsername,
                      cardName,
                      selectedTreasureValue,
                    })
                  }
                  style={{
                    cursor: canBuyCard({
                      gameState,
                      loggedInUsername,
                      cardName,
                      selectedTreasureValue,
                    })
                      ? "pointer"
                      : "not-allowed",
                    border: `2px solid ${
                      !isUsersTurn(gameState, loggedInUsername)
                        ? "blue"
                        : canBuyCard({
                            gameState,
                            loggedInUsername,
                            cardName,
                            selectedTreasureValue,
                          })
                        ? "green"
                        : "red"
                    }`,
                  }}
                  onClick={() => {
                    buyCard({
                      socket,
                      authToken,
                      roomNumber,
                      cardName,
                      setErrorMessage,
                      toDiscardFromHand: countToCardNamesArray(cardsInPlay),
                    });
                    setCardsInPlay(zeroCardCount);
                    setSelectedTreasureValue(0);
                  }}
                >
                  {cardName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          {gameState.turn > 0 && (
            <>
              <h3>Hand</h3>
              {!isUsersTurn(gameState, loggedInUsername)
                ? "Waiting for your turn..."
                : "Click on a card to play it."}
            </>
          )}

          {/* hand */}
          {/* todo abstract into component and tidy up stateful logic */}
          {Object.entries(visibleHand).map(([cardName, count]) => (
            <div key={cardName}>
              {
                <>
                  {new Array(count).fill(0).map((_, i) => (
                    <button
                      key={i}
                      style={{
                        margin: "0.2rem",
                        border:
                          currentUserState?.phase === Phases.Action &&
                          getCardTypeByName(cardName as CardName) === "action"
                            ? "2px solid green"
                            : currentUserState?.phase === Phases.Buy &&
                              getCardTypeByName(cardName as CardName) ===
                                "treasure"
                            ? "2px solid green"
                            : "2px solid black",
                        cursor:
                          !isUsersTurn(gameState, loggedInUsername) ||
                          !currentUserState?.buys
                            ? "not-allowed"
                            : "pointer",
                      }}
                      disabled={
                        // todo fix typing
                        !isUsersTurn(gameState, loggedInUsername) ||
                        (currentUserState?.phase === Phases.Action &&
                          getCardTypeByName(cardName as CardName) !==
                            "action") ||
                        (currentUserState?.phase === Phases.Buy &&
                          getCardTypeByName(cardName as CardName) !==
                            "treasure") ||
                        !currentUserState?.buys ||
                        cardNameToCard(cardName as CardName).type === "victory"
                      }
                      onClick={() => {
                        if (
                          currentUserState?.phase === Phases.Buy &&
                          getCardTypeByName(cardName as CardName) === "treasure"
                        ) {
                          setSelectedTreasureValue(
                            (currValue) =>
                              currValue +
                              getCardValueByName(cardName as CardName)
                          );
                          updateCardsInPlay(
                            cardName as CardName,
                            setCardsInPlay
                          );
                        } else if (
                          currentUserState?.phase === Phases.Action &&
                          getCardTypeByName(cardName as CardName) === "action"
                        ) {
                          playAction({
                            socket,
                            authToken,
                            roomNumber,
                            cardName: cardName as CardName,
                            setErrorMessage,
                          });
                        }
                      }}
                    >
                      {cardName}
                    </button>
                  ))}
                </>
              }
            </div>
          ))}
          {gameState.turn > 0 && (
            <div>
              <h4>Hand value: {selectedTreasureValue}</h4>
              {selectedTreasureValue > 0 && (
                <button
                  onClick={() => {
                    setSelectedTreasureValue(0);
                    setCardsInPlay(zeroCardCount);
                  }}
                >
                  reset played treasures
                </button>
              )}
            </div>
          )}
        </div>
        <div id="game-state" style={{ border: "1px black solid" }}>
          <h2>Game state</h2>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      </div>
    </>
  );
};

export default Room;
