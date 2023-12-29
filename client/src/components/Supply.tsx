import { getAllCardNames, getCardTypeByName } from "../../../shared/common";
import { groupBy } from "../../../shared/utils";

import { CoreProps } from "../types";
import { SupplyCard } from "./SupplyCard";

const Supply = ({ props }: { props: CoreProps }) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { loggedInUsername, currentUserState },
    setErrorMessage,
  } = props;

  if (!currentUserState) return null;

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
              props={{
                gameState,
                coreRoomInfo: { socket, authToken, roomNumber },
                coreUserInfo: { loggedInUsername, currentUserState },
                setErrorMessage,
              }}
            >
              {cardName}
            </SupplyCard>
          ))}

          {victoryCards.map((cardName) => (
            <SupplyCard
              key={cardName}
              props={{
                gameState,
                coreRoomInfo: { socket, authToken, roomNumber },
                coreUserInfo: { loggedInUsername, currentUserState },
                setErrorMessage,
              }}
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
            props={{
              gameState,
              coreRoomInfo: { socket, authToken, roomNumber },
              coreUserInfo: { loggedInUsername, currentUserState },
              setErrorMessage,
            }}
          >
            {cardName}
          </SupplyCard>
        ))}
      </div>
    </div>
  );
};

export default Supply;
