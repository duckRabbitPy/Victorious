import React from "react";
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
  setSupplyCardInFocus,
  coreProps,
}: {
  coreProps: CoreProps;
  setSupplyCardInFocus: React.Dispatch<React.SetStateAction<CardName | null>>;
  children: CardName;
}) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { loggedInUsername, currentUserState },
    setErrorMessage,
  } = coreProps;

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

  const cardStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    cursor: canBuy ? "pointer" : "not-allowed",
    border: `2px solid ${
      isCurrentUsersTurn && canBuy
        ? "green"
        : isCurrentUsersTurn
        ? "blue"
        : "red"
    }`,
    backgroundColor: "#C6D0D5",
  };

  return (
    <div>
      <button
        style={cardStyle}
        onContextMenu={(e) => {
          e.preventDefault();
          setSupplyCardInFocus(cardName);
        }}
        onClick={() => {
          canBuy &&
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
    </div>
  );
};
