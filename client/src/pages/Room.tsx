import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  CardCount,
  CardName,
  GameState,
  cardNameToCard,
  getAllCardNames,
  getCardValueByName,
} from "../../../shared/common";
import {
  addNewPlayer,
  buyCard,
  getInititalGameState,
  incrementTurn,
  startGame,
} from "../effects/effects";
import { canBuyCard } from "../effects/clientValidation";

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

const diffCardCounts = (a: CardCount, b: CardCount): CardCount => {
  const diff = Object.entries(a).reduce((acc, [cardName, count]) => {
    const diff = count - b[cardName as CardName];
    if (diff > 0) {
      acc[cardName] = diff;
    }
    return acc;
  }, {} as Record<string, number>);

  return diff as CardCount;
};

const Room = () => {
  const { gameState, socket } = useGameState();
  const { "*": roomParam } = useParams();
  const roomNumber = Number(roomParam);
  const authToken = localStorage.getItem("dominion_auth_token");
  const currentUserName = localStorage.getItem("dominion_user_name");
  const [selectedTreasureValue, setSelectedTreasureValue] = useState(0);
  const [cardsInPlay, setCardsInPlay] = useState<CardCount>({
    copper: 0,
    silver: 0,
    gold: 0,
    estate: 0,
    duchy: 0,
    province: 0,
    village: 0,
    smithy: 0,
    market: 0,
    mine: 0,
    laboratory: 0,
    festival: 0,
    councilRoom: 0,
  });

  const updateCardsInPlay = (cardName: CardName) => {
    setCardsInPlay((cardsInPlay) => ({
      ...cardsInPlay,
      [cardName]: cardsInPlay[cardName] + 1,
    }));
  };

  const currentUserState = gameState?.actor_state.find(
    (a) => a.name === localStorage.getItem("dominion_user_name")
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  if (!currentUserName) {
    return <div>Must be logged in to play</div>;
  }
  if (!gameState) return <div>Error fetching game state from server...</div>;

  const currentHand = currentUserState?.hand;

  const visibleHand = currentHand
    ? diffCardCounts(currentHand, cardsInPlay)
    : {};

  return (
    <>
      {errorMessage && (
        <>
          <div style={{ color: "red" }}>{`Error: ${errorMessage}`}</div>
          <button onClick={() => setErrorMessage(null)}>clear</button>
        </>
      )}
      <h1>Room {roomNumber}</h1>
      <p>Players ready: {gameState.actor_state.length}/2</p>
      {
        <ol style={{ listStyle: "none" }}>
          {gameState.actor_state.map((actor) => (
            <li key={actor.id}>{`✅ ${actor.name}`}</li>
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
          <Link to="/">Back to home</Link>

          {gameState.actor_state.every((a) => a.name !== currentUserName) && (
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
          {gameState.actor_state.length > 1 && (
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

        {(gameState.turn || 0) > 0 && (
          <div>
            <h2>Buy card</h2>
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
                      currentUserName,
                      cardName,
                      selectedTreasureValue,
                    })
                  }
                  style={{
                    cursor: canBuyCard({
                      gameState,
                      currentUserName,
                      cardName,
                      selectedTreasureValue,
                    })
                      ? "pointer"
                      : "not-allowed",
                    border: `2px solid ${
                      canBuyCard({
                        gameState,
                        currentUserName,
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
                    });
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
          <h3>Hand</h3>
          <div>
            <h4>Coins: {selectedTreasureValue}</h4>
            <button
              onClick={() => {
                setSelectedTreasureValue(0);
              }}
            >
              reset played treasures
            </button>
          </div>
          {Object.entries(visibleHand).map(([cardName, count]) => (
            <div key={cardName}>
              {
                <>
                  {new Array(count).fill(0).map((_, i) => (
                    <button
                      key={i}
                      disabled={
                        // todo fix typing
                        cardNameToCard(cardName as CardName).type === "victory"
                      }
                      onClick={() => {
                        setSelectedTreasureValue(
                          (currValue) =>
                            currValue + getCardValueByName(cardName as CardName)
                        );
                        updateCardsInPlay(cardName as CardName);
                      }}
                    >
                      {cardName}
                    </button>
                  ))}
                </>
              }
            </div>
          ))}
        </div>
        <div id="game-state">
          <h2>Game state</h2>
          <button onClick={() => window.location.reload()}>reconnect</button>
          <pre>{JSON.stringify(gameState, null, 2)}</pre>
        </div>
      </div>
    </>
  );
};

export default Room;
