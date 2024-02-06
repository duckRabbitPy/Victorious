import {
  Phases,
  getCardTypeByName,
  CardName,
  cardNameToCard,
  GameState,
  getTreasureValue,
  ActionPhaseDemand,
} from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { THEME_COLORS } from "../constants";
import {
  playAction,
  playTreasure,
  trashCardToMeetDemand,
} from "../effects/effects";

import { CoreRoomInfo, CoreUserInfo } from "../types";

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
  onContextMenu,
}: {
  cardName: CardName;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
  buttonStyle: React.CSSProperties;
  index: number;
  disabled: boolean;
}) => {
  return (
    <button
      key={index}
      style={buttonStyle}
      onContextMenu={onContextMenu}
      disabled={disabled}
      onClick={onClick}
    >
      {cardName}
    </button>
  );
};

const constructDemandText = (actionPhaseDemand: ActionPhaseDemand) => {
  const { demandType, count, requirement } = actionPhaseDemand;

  if (demandType === "Gain") {
    return `Gain ${count} ${count > 1 ? "cards" : "card"} ${
      requirement?.maxValue ? `worth up to ${requirement.maxValue}` : ""
    } ${requirement?.minValue ? `worth at least ${requirement.minValue}` : ""}`;
  }

  if (demandType === "Trash") {
    if (requirement?.maxValue === 1) {
      return "Trash a copper from your hand";
    }
    return `Trash ${count} ${count > 1 ? "cards" : "card"} ${
      requirement?.maxValue ? `worth up to ${requirement.maxValue}` : ""
    } ${requirement?.minValue ? `worth at least ${requirement.minValue}` : ""}`;
  }

  return "";
};

const PlayerHand = ({
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  coreUserInfo: { loggedInUsername, currentUserState },
  setErrorMessage,
  setSupplyCardInFocus,
}: Props & {
  setSupplyCardInFocus: React.Dispatch<React.SetStateAction<CardName | null>>;
}) => {
  if (gameState.turn < 1 || !currentUserState) return null;

  const currentHand = currentUserState.hand;
  const cardsInPlay = currentUserState.cardsInPlay;

  const visibleHandCountKVP = Object.entries(currentHand).filter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, count]) => count > 0
  ) as [CardName, number][];

  const playerMustGain =
    currentUserState.actionPhaseDemand?.demandType === "Gain";

  const playerMustTrash =
    currentUserState.actionPhaseDemand?.demandType === "Trash";

  return (
    <div
      style={{
        backgroundColor: THEME_COLORS.translucentBlack,
        border: "2px solid black",
        color: "white",
      }}
    >
      <>
        <h3 style={{ margin: 0 }}>Hand</h3>
        {!isUsersTurn(gameState, loggedInUsername) &&
          "Waiting for your turn..."}

        <div
          style={{
            minHeight: "2rem",
            color:
              currentUserState.actionPhaseDemand?.demandType === "Trash"
                ? THEME_COLORS.lightRed
                : THEME_COLORS.lightGreen,
          }}
        >
          {currentUserState.actionPhaseDemand &&
            constructDemandText(currentUserState.actionPhaseDemand)}
        </div>
      </>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          minHeight: "50px",
        }}
      >
        {visibleHandCountKVP.map(([cardName, count]) => {
          const isActionCard = getCardTypeByName(cardName) === "action";
          const isTreasureCard = getCardTypeByName(cardName) === "treasure";

          const isNotUsersTurn = !isUsersTurn(gameState, loggedInUsername);
          const isNotAppropriatePhase =
            (currentUserState.phase === Phases.Action &&
              getCardTypeByName(cardName) !== "action") ||
            (currentUserState.phase === Phases.Buy &&
              getCardTypeByName(cardName) !== "treasure") ||
            !currentUserState.buys ||
            cardNameToCard(cardName).type === "victory";

          const NoActionsLeftOrInProgressInActionPhase =
            currentUserState.phase === Phases.Action &&
            currentUserState.actions < 1 &&
            currentUserState.actionPhaseDemand === null;

          const MoneyLenderInPlayAndIsCopper =
            playerMustTrash &&
            currentUserState?.actionPhaseDemand?.requirement?.maxValue === 1 &&
            cardName === "copper";

          const disabled =
            (isNotUsersTurn ||
              isNotAppropriatePhase ||
              playerMustGain ||
              NoActionsLeftOrInProgressInActionPhase) &&
            !MoneyLenderInPlayAndIsCopper;

          const getCardInHandColor = () => {
            if (playerMustTrash) {
              return "2px solid red";
            }

            if (
              ((currentUserState.phase === Phases.Action && isActionCard) ||
                (currentUserState.phase === Phases.Buy && isTreasureCard)) &&
              !playerMustGain
            ) {
              return "2px solid green";
            }

            return "2px solid black";
          };

          const buttonStyle = {
            margin: "0.1rem",
            fontSize: "small",
            border: getCardInHandColor(),
            cursor: disabled ? "not-allowed" : "pointer",
          };

          const onClick = () => {
            if (
              currentUserState?.phase === Phases.Buy &&
              getCardTypeByName(cardName) === "treasure"
            ) {
              playTreasure({
                mutationIndex: gameState.mutation_index,
                socket,
                authToken,
                roomNumber,
                cardName: cardName,
                setErrorMessage,
              });
            } else if (
              currentUserState.actionPhaseDemand?.demandType === "Trash"
            ) {
              trashCardToMeetDemand({
                mutationIndex: gameState.mutation_index,
                socket,
                authToken,
                roomNumber,
                cardName,
                setErrorMessage,
              });
            } else if (
              currentUserState.phase === Phases.Action &&
              getCardTypeByName(cardName) === "action"
            ) {
              playAction({
                mutationIndex: gameState.mutation_index,
                socket,
                authToken,
                roomNumber,
                cardName: cardName,
                setErrorMessage,
              });
            }
          };

          return (
            <div
              key={cardName}
              style={{
                display: "flex",
                justifyContent: "center",
                height: "fit-content",
              }}
            >
              {new Array(count).fill(0).map((_, index) => {
                return (
                  <CardInHand
                    key={`${cardName}-${index}`}
                    cardName={cardName}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSupplyCardInFocus(cardName);
                    }}
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
      </div>

      <div>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "yellow" }}>
            Cash:{" "}
            {getTreasureValue(cardsInPlay) +
              currentUserState.bonusTreasureValue}
          </p>
          <p>
            Trash:{" "}
            {Object.values(currentUserState.cardsInPlay).reduce(
              (acc, curr) => acc + curr,
              0
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerHand;
