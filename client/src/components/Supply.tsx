import {
  getAllCardNames,
  countToCardNamesArray,
  GameState,
  getTreasureValue,
  getCardTypeByName,
} from "../../../shared/common";
import { groupBy, isUsersTurn } from "../../../shared/utils";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { canBuyCard } from "../effects/clientValidation";
import { buyCard } from "../effects/effects";
import { SupplyCard } from "./SupplyCard";

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

  const cardTypeGroups = groupBy(getAllCardNames(), (cardName) =>
    getCardTypeByName(cardName)
  );

  const treasureCards = cardTypeGroups["treasure"] || [];
  const victoryCards = cardTypeGroups["victory"] || [];
  const actionCards = cardTypeGroups["action"] || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: "2rem",
      }}
    >
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
              onClick={() => {
                buyCard({
                  socket,
                  authToken,
                  roomNumber,
                  cardName,
                  setErrorMessage,
                  toDiscardFromHand: countToCardNamesArray(
                    currentUserState.hand
                  ),
                });
              }}
              canBuyCard={canBuyCard({
                gameState,
                loggedInUsername,
                cardName,
                totalTreasureValue,
              })}
              isUsersTurn={isUsersTurn(gameState, loggedInUsername)}
            >
              {cardName + " " + `(${gameState.global_state.supply[cardName]})`}
            </SupplyCard>
          ))}

          {victoryCards.map((cardName) => (
            <SupplyCard
              key={cardName}
              onClick={() => {
                buyCard({
                  socket,
                  authToken,
                  roomNumber,
                  cardName,
                  setErrorMessage,
                  toDiscardFromHand: countToCardNamesArray(
                    currentUserState.hand
                  ),
                });
              }}
              canBuyCard={canBuyCard({
                gameState,
                loggedInUsername,
                cardName,
                totalTreasureValue,
              })}
              isUsersTurn={isUsersTurn(gameState, loggedInUsername)}
            >
              {cardName + " " + `(${gameState.global_state.supply[cardName]})`}
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
            canBuyCard={canBuyCard({
              gameState,
              loggedInUsername,
              cardName,
              totalTreasureValue,
            })}
            isUsersTurn={isUsersTurn(gameState, loggedInUsername)}
          >
            {cardName + " " + `(${gameState.global_state.supply[cardName]})`}
          </SupplyCard>
        ))}
      </div>
    </div>
  );
};

export default Supply;
