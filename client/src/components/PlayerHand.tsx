import {
  Phases,
  getCardTypeByName,
  CardName,
  cardNameToCard,
  GameState,
  getTreasureValue,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import {
  playAction,
  playTreasure,
  resetPlayedTreasures,
} from "../effects/effects";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";

type Props = {
  gameState: GameState;
  coreRoomInfo: CoreRoomInfo;
  coreUserInfo: CoreUserInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const CardInHand = ({
  cardName,
  onClick,
  buttonStyle,
  index,
  disabled,
}: {
  cardName: CardName;
  onClick: () => void;
  buttonStyle: React.CSSProperties;
  index: number;
  disabled: boolean;
}) => {
  return (
    <button
      key={index}
      style={buttonStyle}
      disabled={disabled}
      onClick={onClick}
    >
      {cardName}
    </button>
  );
};

const PlayerHand = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: { loggedInUsername, currentUserState },
  setErrorMessage,
}: Props) => {
  if (gameState.turn < 1 || !socket || !currentUserState) return null;

  const currentHand = currentUserState.hand;
  const cardsInPlay = currentUserState.cardsInPlay;

  const visibleHandCountKVP = Object.entries(currentHand).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, count]) => count > 0
  ) as [CardName, number][];

  return (
    <div>
      <>
        <h3>Hand</h3>
        {!isUsersTurn(gameState, loggedInUsername)
          ? "Waiting for your turn..."
          : "Click on a card to play it."}
      </>

      {visibleHandCountKVP.map(([cardName, count]) => {
        const isActionCard = getCardTypeByName(cardName) === "action";
        const isTreasureCard = getCardTypeByName(cardName) === "treasure";

        const borderColor =
          (currentUserState.phase === Phases.Action && isActionCard) ||
          (currentUserState.phase === Phases.Buy && isTreasureCard)
            ? "2px solid green"
            : "2px solid black";

        const cursor =
          !isUsersTurn(gameState, loggedInUsername) || !currentUserState.buys
            ? "not-allowed"
            : "pointer";

        const buttonStyle = {
          margin: "0.2rem",
          border: borderColor,
          cursor: cursor,
        };

        const disabled =
          !isUsersTurn(gameState, loggedInUsername) ||
          (currentUserState.phase === Phases.Action &&
            getCardTypeByName(cardName) !== "action") ||
          (currentUserState.phase === Phases.Buy &&
            getCardTypeByName(cardName) !== "treasure") ||
          !currentUserState.buys ||
          cardNameToCard(cardName).type === "victory";

        const onClick = () => {
          if (
            currentUserState?.phase === Phases.Buy &&
            getCardTypeByName(cardName) === "treasure"
          ) {
            playTreasure({
              socket,
              authToken,
              roomNumber,
              cardName: cardName,
              setErrorMessage,
            });
          } else if (
            currentUserState.phase === Phases.Action &&
            getCardTypeByName(cardName) === "action"
          ) {
            playAction({
              socket,
              authToken,
              roomNumber,
              cardName: cardName,
              setErrorMessage,
            });
          }
        };

        return (
          <div key={cardName}>
            {new Array(count).fill(0).map((_, index) => {
              return (
                <CardInHand
                  cardName={cardName}
                  onClick={onClick}
                  buttonStyle={buttonStyle}
                  index={index}
                  disabled={disabled}
                />
              );
            })}
          </div>
        );
      })}

      <div>
        <h4>
          Treasure{" "}
          {getTreasureValue(cardsInPlay) + currentUserState.bonusTreasureValue}
        </h4>
        {getTreasureValue(cardsInPlay) > 0 && (
          <button
            onClick={() => {
              resetPlayedTreasures({
                socket,
                authToken,
                roomNumber,
                setErrorMessage,
              });
            }}
          >
            reset played treasures
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
