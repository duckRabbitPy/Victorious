import { GameState, Phases } from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { CoreUserInfo } from "../client-types";

type Props = {
  coreUserInfo: CoreUserInfo;
  gameState: GameState;
};

const TurnInfo = ({
  coreUserInfo: { loggedInUsername, currentUserState },
  gameState,
}: Props) => {
  return (
    <>
      <h3>Phase: {currentUserState?.phase}</h3>
      {isUsersTurn(gameState, loggedInUsername) && (
        <>
          <h2>
            {currentUserState?.phase === Phases.Buy
              ? "Buy card"
              : "Play Action"}
          </h2>
          <p>{`victory points: ${currentUserState?.victoryPoints}`}</p>
          <p>{`actions remaining ${currentUserState?.actions}`}</p>
          <p>{`buys remaining ${currentUserState?.buys}`}</p>
        </>
      )}
    </>
  );
};

export default TurnInfo;
