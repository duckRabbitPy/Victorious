import React from "react";
import {
  CardName,
  getAllCardNames,
  getCardCostByName,
  getCardDescriptionByName,
  getCardTypeByName,
} from "../../../shared/common";
import { groupBy, sortBy } from "../../../shared/utils";

import { CoreProps } from "../types";
import { SupplyCard } from "./SupplyCard";
import { pipe } from "effect";

const Supply = ({ props }: { props: CoreProps }) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { loggedInUsername, currentUserState },
    setErrorMessage,
  } = props;

  const [supplyCardInFocus, setSupplyCardInFocus] =
    React.useState<CardName | null>(null);

  if (!currentUserState) return null;

  const cardTypeGroups = groupBy(getAllCardNames(), (cardName) =>
    getCardTypeByName(cardName)
  );

  const treasureCards = pipe(cardTypeGroups["treasure"], (cardNames) =>
    sortBy(cardNames, (cardName) => getCardCostByName(cardName), "desc")
  );
  const victoryCards = pipe(cardTypeGroups["victory"], (cardNames) =>
    sortBy(cardNames, (cardName) => getCardCostByName(cardName), "desc")
  );
  const actionCards = (cardTypeGroups["action"] = pipe(
    cardTypeGroups["action"],
    (cardNames) =>
      sortBy(cardNames, (cardName) => getCardCostByName(cardName), "desc")
  ));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        position: "relative", // Add relative positioning
        gap: "2rem",
      }}
    >
      {supplyCardInFocus && (
        <div
          style={{
            backgroundColor: "white",
            padding: "1rem",
            border: "1px solid black",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "300px",
            width: "200px",
            position: "absolute", // Set absolute positioning
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)", // Center the box
          }}
        >
          <button
            style={{ alignSelf: "flex-end" }}
            onClick={() => setSupplyCardInFocus(null)}
          >
            x
          </button>
          <b>{supplyCardInFocus}</b>
          <div>{`Cost: ${getCardCostByName(supplyCardInFocus)}`}</div>
          <div>{`Type: ${getCardTypeByName(supplyCardInFocus)}`}</div>
          {getCardDescriptionByName(supplyCardInFocus) && (
            <div>{`${getCardDescriptionByName(supplyCardInFocus)}`}</div>
          )}
        </div>
      )}
      <div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {treasureCards.map((cardName) => (
            <SupplyCard
              key={cardName}
              coreProps={{
                gameState,
                coreRoomInfo: { socket, authToken, roomNumber },
                coreUserInfo: { loggedInUsername, currentUserState },
                setErrorMessage,
              }}
              setSupplyCardInFocus={setSupplyCardInFocus}
            >
              {cardName}
            </SupplyCard>
          ))}

          {victoryCards.map((cardName) => (
            <SupplyCard
              key={cardName}
              coreProps={{
                gameState,
                coreRoomInfo: { socket, authToken, roomNumber },
                coreUserInfo: { loggedInUsername, currentUserState },
                setErrorMessage,
              }}
              setSupplyCardInFocus={setSupplyCardInFocus}
            >
              {cardName}
            </SupplyCard>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {actionCards.map((cardName) => (
          <SupplyCard
            key={cardName}
            coreProps={{
              gameState,
              coreRoomInfo: { socket, authToken, roomNumber },
              coreUserInfo: { loggedInUsername, currentUserState },
              setErrorMessage,
            }}
            setSupplyCardInFocus={setSupplyCardInFocus}
          >
            {cardName}
          </SupplyCard>
        ))}
      </div>
    </div>
  );
};

export default Supply;
