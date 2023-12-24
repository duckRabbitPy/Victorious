import {
  getAllCardNames,
  countToCardNamesArray,
  zeroCardCount,
  CardName,
  GameState,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { canBuyCard } from "../effects/clientValidation";
import { buyCard } from "../effects/effects";

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

const Supply = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: { loggedInUsername, cardsInPlay, selectedTreasureValue },
  setCardsInPlay,
  setSelectedTreasureValue,
  setErrorMessage,
}: Props) => {
  return (
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
  );
};

export default Supply;
