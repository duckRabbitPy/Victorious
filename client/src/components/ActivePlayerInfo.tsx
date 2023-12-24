import { Link } from "react-router-dom";
import { GameState } from "../../../shared/common";
import { CoreRoomInfo, CoreUserInfo } from "../client-types";
import { isUsersTurn } from "../../../shared/utils";
import { addNewPlayer } from "../effects/effects";

type Props = {
  gameState: GameState;
  coreUserInfo: CoreUserInfo;
  coreRoomInfo: CoreRoomInfo;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
};

const ActivePlayerInfo = ({
  coreUserInfo: { loggedInUsername },
  gameState,
  coreRoomInfo: { socket, authToken, roomNumber },
  setErrorMessage,
}: Props) => {
  return (
    <>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          playing as : {loggedInUsername}
        </div>
        <Link to="/">Back to home</Link>
        <h1>Room {roomNumber}</h1>
        <p>Players ready: {gameState.actor_state.length}/2</p>
        {
          <ol style={{ listStyle: "none" }}>
            {gameState.actor_state.map((actor) => (
              <li
                key={actor.id}
                style={{
                  color: isUsersTurn(gameState, actor.name) ? "green" : "black",
                }}
              >{`✅ ${actor.name} ${
                isUsersTurn(gameState, actor.name) ? "👈" : ""
              }`}</li>
            ))}
          </ol>
        }
      </div>
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {gameState.actor_state.every((a) => a.name !== loggedInUsername) && (
            <button
              id="player-ready"
              onClick={() =>
                addNewPlayer({
                  socket,
                  authToken,
                  roomNumber,
                  setErrorMessage,
                })
              }
            >
              Ready
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ActivePlayerInfo;
