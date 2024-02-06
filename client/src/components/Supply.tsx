import React from "react";
import {
  ALL_CARD_NAMES,
  CardName,
  getCardCostByName,
  getCardDescriptionByName,
  getCardTypeByName,
} from "../../../shared/common";

import { groupBy, sortBy } from "../../../shared/utils";
import { CoreProps } from "../types";
import { SupplyCard } from "./SupplyCard";
import { pipe } from "effect";

const treasureCardUrls = {
  copper:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959199/dominion/copper_vriytw.jpg",
  silver:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959198/dominion/silver_brqd5d.jpg",
  gold: "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959198/dominion/gold_cdvobf.jpg",
  estate:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959199/dominion/estate_pdsk94.jpg",
  duchy:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959197/dominion/duchy_mugjav.jpg",
  province:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959198/dominion/province_k1dims.jpg",
  village:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959200/dominion/village_chghpw.jpg",
  smithy:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959199/dominion/smithy_aq0iv6.jpg",
  market:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_medieval_market_trading_3_vbl76b.jpg",
  laboratory:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_medieval_laboratory_0_flwgg2.jpg",
  festival:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_medieval_festival_tents_peasants_party_j_2_ufvpsa.jpg",
  councilRoom:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_medieval_council_room_0_g9hye5.jpg",
  mine: "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_medieval_mine_0_rizl4d.jpg",
  moneylender:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1706955426/dominion/Leonardo_Diffusion_XL_money_lender_small_pouch_of_coins_being_1_qnu368.jpg",
  workshop:
    "https://res.cloudinary.com/dkytnwn87/image/upload/v1706955296/dominion/Leonardo_Diffusion_XL_workshop_medival_tools_at_table_3_wxhz9k.jpg",
} as Record<CardName, string>;

const Supply = ({
  props,
}: {
  props: CoreProps & {
    supplyCardInFocus: CardName | null;
    setSupplyCardInFocus: React.Dispatch<React.SetStateAction<CardName | null>>;
  };
}) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { loggedInUsername, currentUserState },
    setErrorMessage,
    supplyCardInFocus,
    setSupplyCardInFocus,
  } = props;

  if (!currentUserState) return null;

  const cardTypeGroups = groupBy(ALL_CARD_NAMES, (cardName) =>
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
        gap: "0.5rem",
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
            backgroundColor: "rgba(28, 26, 27, 1)",
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
              backgroundColor: "rgba(239, 236, 220, 0.7)",
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "0.5rem",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
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
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
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

        <div
          style={{
            gridColumn: "span 3",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridAutoRows: "minmax(60px, auto)",
            gap: "0.5rem",
            marginLeft: "1rem",
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
    </div>
  );
};

export default Supply;
