import {
  CardName,
  countToCardNamesArray,
  getTreasureValue,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { canBuyCard } from "../effects/clientValidation";
import { buyCard } from "../effects/effects";
import { CoreProps } from "../types";

export const SupplyCard = ({
  children: cardName,
  props,
}: {
  props: CoreProps;
  children: CardName;
}) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { loggedInUsername, currentUserState },
    setErrorMessage,
  } = props;

  if (!currentUserState) return null;

  const totalTreasureValue =
    getTreasureValue(currentUserState.cardsInPlay) +
    currentUserState.bonusTreasureValue;

  const canBuy = canBuyCard({
    gameState,
    loggedInUsername,
    cardName,
    totalTreasureValue,
  });

  const isCurrentUsersTurn = isUsersTurn(gameState, loggedInUsername);

  const cardStyle = {
    cursor: canBuy ? "pointer" : "not-allowed",
    border: `2px solid ${
      isCurrentUsersTurn && canBuy
        ? "green"
        : isCurrentUsersTurn
        ? "blue"
        : "red"
    }`,
  };
  return (
    <button
      style={cardStyle}
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
      {cardName + " " + `(${gameState.global_state.supply[cardName]})`}
    </button>
  );
};
