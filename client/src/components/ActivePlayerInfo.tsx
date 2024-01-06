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
    <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
      <div
        style={{
          backgroundColor: "rgba(239, 236, 220, 0.7)",
          border: "2px solid black",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1>Room {roomNumber}</h1>
        <p style={{ fontWeight: "bold" }}>
          Players ready: {gameState.actor_state.length}
        </p>
        {
          <>
            <ol style={{ listStyle: "none", padding: "0" }}>
              {gameState.actor_state.map((actor) => (
                <li
                  key={actor.id}
                  style={{
                    color: isUsersTurn(gameState, actor.name)
                      ? "green"
                      : "black",
                  }}
                >{`✅ ${actor.name} ${
                  isUsersTurn(gameState, actor.name) ? "👈" : ""
                }`}</li>
              ))}
            </ol>
            <div>
              {gameState.actor_state.length < 2 && (
                <p>Waiting for players to join...</p>
              )}
            </div>
          </>
        }
      </div>

      <div style={{}}>
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
            style={{
              border: "2px solid green",
              animation: "pulse 1.2s infinite",
            }}
          >
            Ready
          </button>
        )}
      </div>
    </div>
  );
};

export default ActivePlayerInfo;
