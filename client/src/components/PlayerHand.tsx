import {
  Phases,
  getCardTypeByName,
  CardName,
  cardNameToCard,
  getCardValueByName,
  zeroCardCount,
  GameState,
  subtractCardCount,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { playAction } from "../effects/effects";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { updateCardsInPlay } from "../utils";

type Props = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  coreUserInfo: CoreUserInfo;
  setCardsInPlay: React.Dispatch<
    React.SetStateAction<Record<CardName, number>>
  >;
  setSelectedTreasureValue: React.Dispatch<React.SetStateAction<number>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const PlayerHand = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: {
    loggedInUsername,
    currentUserState,
    cardsInPlay,
    selectedTreasureValue,
  },
  setCardsInPlay,
  setSelectedTreasureValue,
  setErrorMessage,
}: Props) => {
  if (gameState.turn < 1 || !socket || !currentUserState) return null;

  const currentHand = currentUserState.hand;

  const visibleHand = currentHand
    ? subtractCardCount(currentHand, cardsInPlay)
    : zeroCardCount;

  return (
    <div>
      <>
        <h3>Hand</h3>
        {!isUsersTurn(gameState, loggedInUsername)
          ? "Waiting for your turn..."
          : "Click on a card to play it."}
      </>

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
                          getCardTypeByName(cardName as CardName) === "treasure"
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
                      getCardTypeByName(cardName as CardName) !== "action") ||
                    (currentUserState?.phase === Phases.Buy &&
                      getCardTypeByName(cardName as CardName) !== "treasure") ||
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
                          currValue + getCardValueByName(cardName as CardName)
                      );
                      updateCardsInPlay(cardName as CardName, setCardsInPlay);
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
    </div>
  );
};

export default PlayerHand;
