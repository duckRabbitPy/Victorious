import React from "react";
import {
  CardName,
  getAllCardNames,
  getCardCostByName,
  getCardDescriptionByName,
  getCardTypeByName,
} from "../../../shared/common";
import copperUrl from "../../../public/images/copper.jpg";
import silverUrl from "../../../public/images/silver.jpg";
import goldUrl from "../../../public/images/gold.jpg";
import estateUrl from "../../../public/images/estate.jpg";
import duchyUrl from "../../../public/images/duchy.jpg";
import provinceUrl from "../../../public/images/province.jpg";
import village from "../../../public/images/village.jpg";
import smithy from "../../../public/images/smithy.jpg";
import { groupBy, sortBy } from "../../../shared/utils";

import { CoreProps } from "../types";
import { SupplyCard } from "./SupplyCard";
import { pipe } from "effect";

const treasureCardUrls = {
  copper: copperUrl,
  silver: silverUrl,
  gold: goldUrl,
  estate: estateUrl,
  duchy: duchyUrl,
  province: provinceUrl,
  village: village,
  smithy: smithy,
} as Record<CardName, string>;

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
        position: "relative",
        gap: "2rem",
      }}
    >
      {supplyCardInFocus && (
        <div
          style={{
            padding: "1rem",
            border: "3px solid black",
            zIndex: 1,
            height: "fit-content",
            width: "200px",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "darkgray",
            flexDirection: "column",
            justifyItems: "center",
            display: "flex",
            gap: "1rem",
            borderRadius: "5px",
          }}
        >
          <button
            style={{ alignSelf: "flex-end" }}
            onClick={() => setSupplyCardInFocus(null)}
          >
            x
          </button>
          <img
            src={treasureCardUrls[supplyCardInFocus]}
            alt={supplyCardInFocus}
            style={{
              border: "3px solid black",
              borderRadius: "10px",
              height: "200px",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "white",
              borderRadius: "5px",
            }}
          >
            <b>{supplyCardInFocus}</b>
            <div>{`Cost: ${getCardCostByName(supplyCardInFocus)}`}</div>
            <div>{`Type: ${getCardTypeByName(supplyCardInFocus)}`}</div>
            {getCardDescriptionByName(supplyCardInFocus) && (
              <div>{`${getCardDescriptionByName(supplyCardInFocus)}`}</div>
            )}
          </div>
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
