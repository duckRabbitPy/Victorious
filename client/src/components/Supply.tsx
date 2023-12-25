import {
  getAllCardNames,
  countToCardNamesArray,
  GameState,
  getTreasureValue,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { canBuyCard } from "../effects/clientValidation";
import { buyCard } from "../effects/effects";

type Props = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  coreUserInfo: CoreUserInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const Supply = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: { loggedInUsername, currentUserState },
  setErrorMessage,
}: Props) => {
  if (!currentUserState) return null;

  const totalTreasureValue =
    getTreasureValue(currentUserState.cardsInPlay) +
    currentUserState.bonusTreasureValue;

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
              totalTreasureValue,
            })
          }
          style={{
            cursor: canBuyCard({
              gameState,
              loggedInUsername,
              cardName,
              totalTreasureValue,
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
                    totalTreasureValue,
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
              toDiscardFromHand: countToCardNamesArray(currentUserState.hand),
            });
          }}
        >
          {cardName}
        </button>
      ))}
    </div>
  );
};

export default Supply;
