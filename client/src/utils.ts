import {
  ActionPhaseDemand,
  CardName,
  Phases,
  getCardTypeByName,
  cardNameToCard,
} from "../../shared/common";
import { CoreUserInfo } from "./types";

export const constructDemandText = (actionPhaseDemand: ActionPhaseDemand) => {
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

export const cardInHandIsDisabled = (
  currentUserState: CoreUserInfo["currentUserState"],
  cardName: CardName,
  isUsersTurn: boolean
) => {
  if (!currentUserState) return true;

  const phase = currentUserState.phase;
  const actionPhaseDemand = currentUserState.actionPhaseDemand;

  const isNotAppropriatePhase =
    (phase === Phases.Action && getCardTypeByName(cardName) !== "action") ||
    (phase === Phases.Buy && getCardTypeByName(cardName) !== "treasure") ||
    !currentUserState.buys ||
    cardNameToCard(cardName).type === "victory";

  const NoActionPlayAvailableInActionPhase =
    phase === Phases.Action &&
    currentUserState.actions < 1 &&
    actionPhaseDemand === null;

  // Mine and MoneyLender require trashing from hand
  const MoneyLenderInPlay =
    actionPhaseDemand?.demandType === "Trash" &&
    actionPhaseDemand.requirement?.type === "Treasure" &&
    actionPhaseDemand.requirement?.maxValue === 1;

  const MoneyLenderInPlayAndIsCopper =
    MoneyLenderInPlay && cardName === "copper";

  const MoneyLenderInPlayButNotCopper =
    MoneyLenderInPlay && cardName !== "copper";

  const MineInPlay =
    actionPhaseDemand?.demandType === "Trash" &&
    actionPhaseDemand.requirement?.maxValue === 6;

  const hasReasonToBeDisabled =
    (isNotAppropriatePhase ||
      NoActionPlayAvailableInActionPhase ||
      !isUsersTurn ||
      actionPhaseDemand?.demandType === "Gain" ||
      MoneyLenderInPlayButNotCopper) &&
    !MoneyLenderInPlayAndIsCopper &&
    !MineInPlay;

  return hasReasonToBeDisabled;
};
