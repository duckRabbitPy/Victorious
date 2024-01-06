import { GameState, Phases } from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { CoreUserInfo } from "../types";

type Props = {
  coreUserInfo: CoreUserInfo;
  gameState: GameState;
};

const TurnInfo = ({
  coreUserInfo: { loggedInUsername, currentUserState },
  gameState,
}: Props) => {
  if (!currentUserState) return null;

  const buyPhaseInstruction =
    currentUserState.buys > 0 ? "You may buy a card" : "No buys remaining";
  const actionPhaseInstruction =
    currentUserState.actions > 0
      ? "You may play an action"
      : "No actions remaining";
  return (
    <div
      style={{
        border: "1px black solid",
        background: "rgba(255, 255, 255, 0.7)",
        padding: "1rem",
      }}
    >
      {!isUsersTurn(gameState, loggedInUsername) && (
        <p>Waiting for other player...</p>
      )}
      {isUsersTurn(gameState, loggedInUsername) && (
        <>
          <h3 style={{ margin: 0 }}>Phase: {currentUserState.phase}</h3>
          <p style={{ margin: 0 }}>
            {currentUserState?.phase === Phases.Buy
              ? buyPhaseInstruction
              : actionPhaseInstruction}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <p>
              Victory points: <b>{currentUserState.victoryPoints}</b>
            </p>
            <p>
              Actions remaining: <b>{currentUserState.actions}</b>
            </p>
            <p>
              Buys remaining: <b>{currentUserState.buys}</b>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TurnInfo;
