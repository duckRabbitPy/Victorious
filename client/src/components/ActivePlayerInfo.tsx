import { Link } from "react-router-dom";
import { CoreProps } from "../types";
import { isUsersTurn } from "../../../shared/utils";
import { addNewPlayer } from "../effects/effects";

const ActivePlayerInfo = ({ props }: { props: CoreProps }) => {
  const {
    gameState,
    coreRoomInfo: { socket, authToken, roomNumber },
    coreUserInfo: { loggedInUsername },
    setErrorMessage,
  } = props;
  return (
    <>
      <div
        style={{
          backgroundColor: "rgba(239, 236, 220, 0.7)",
          border: "2px solid black",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          playing as : {loggedInUsername}
        </div>
        <Link to="/">Back to home</Link>
        <h1>Room {roomNumber}</h1>
        <p>Players ready: {gameState.actor_state.length}</p>
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
