import {
  Phases,
  getCardTypeByName,
  CardName,
  cardNameToCard,
  GameState,
  getTreasureValue,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import {
  playAction,
  playTreasure,
  resetPlayedTreasures,
} from "../effects/effects";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";

type Props = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  coreUserInfo: CoreUserInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const PlayerHand = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: { loggedInUsername, currentUserState },
  setErrorMessage,
}: Props) => {
  if (gameState.turn < 1 || !socket || !currentUserState) return null;

  const currentHand = currentUserState.hand;
  const cardsInPlay = currentUserState.cardsInPlay;

  const visibleHandCountKVP = Object.entries(currentHand).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, count]) => count > 0
  );

  return (
    <div>
      <>
        <h3>Hand</h3>
        {!isUsersTurn(gameState, loggedInUsername)
          ? "Waiting for your turn..."
          : "Click on a card to play it."}
      </>

      {visibleHandCountKVP.map(([cardName, count]) => (
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
                      playTreasure({
                        socket,
                        authToken,
                        roomNumber,
                        cardName: cardName as CardName,
                        setErrorMessage,
                      });
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
        <h4>
          Treasure{" "}
          {getTreasureValue(cardsInPlay) + currentUserState.bonusTreasureValue}
        </h4>
        {getTreasureValue(cardsInPlay) > 0 && (
          <button
            onClick={() => {
              resetPlayedTreasures({
                socket,
                authToken,
                roomNumber,
                setErrorMessage,
              });
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
