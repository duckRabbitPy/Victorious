import React from "react";
import {
  CardName,
  countToCardNamesArray,
  getTreasureValue,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { canBuyCard, canGainCard } from "../effects/clientValidation";
import { buyCard, gainCard } from "../effects/effects";
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

  const canGain = canGainCard({
    gameState,
    loggedInUsername,
    cardName,
  });

  const isCurrentUsersTurn = isUsersTurn(gameState, loggedInUsername);

  const cardStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontSize: "small",
    cursor: canBuy || canGain ? "pointer" : "not-allowed",
    border: `2px solid ${
      isCurrentUsersTurn && canBuy
        ? "green"
        : isCurrentUsersTurn
        ? "blue"
        : "red"
    }`,
    backgroundColor: "rgba(239, 236, 220, 0.7)",
    animation: canBuy ? "pulse 1.2s 1s" : "",
  };

  const numberRemaining = gameState.global_state.supply[cardName];

  return (
    <div>
      <button
        style={cardStyle}
        onContextMenu={(e) => {
          e.preventDefault();
          setSupplyCardInFocus(cardName);
        }}
        disabled={!canBuy && !canGain}
        onClick={() => {
          if (canGain) {
            gainCard({
              mutationIndex: gameState.mutation_index,
              socket,
              authToken,
              roomNumber,
              cardName,
              setErrorMessage,
            });
            return;
          }

          canBuy &&
            buyCard({
              mutationIndex: gameState.mutation_index,
              socket,
              authToken,
              roomNumber,
              cardName,
              setErrorMessage,
              toDiscardFromHand: countToCardNamesArray(currentUserState.hand),
            });
        }}
      >
        {cardName +
          " " +
          `(${numberRemaining})` +
          (numberRemaining ? "" : " ❌")}
      </button>
    </div>
  );
};
