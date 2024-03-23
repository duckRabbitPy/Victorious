import { useEffect, useState } from "react";
import { GameState } from "../../../shared/common";
import { Spinner } from "./Utils";
import { Link } from "react-router-dom";

export const ConnectingStatus = ({
  gameState,
  socket,
}: {
  gameState: GameState | null;
  socket: WebSocket | null;
}) => {
  const [failedToConnect, setFailedToConnect] = useState(false);

  useEffect(() => {
    const connectionTimeout = setTimeout(() => {
      if (!gameState) {
        setFailedToConnect(true);
      }
    }, 5000);

    return () => clearTimeout(connectionTimeout);
  }, [gameState]);

  if (!gameState || !socket) {
    return (
      <div>
        {failedToConnect ? (
          <p>Failed to connect</p>
        ) : (
          <>
            <p>{!socket && "Connecting to server"}</p>
            <p>{!gameState && "Loading game state"}</p>
            <Spinner />
          </>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {failedToConnect && (
            <button onClick={() => window.location.reload()}>Retry</button>
          )}
          <Link to="/"> Go home</Link>
        </div>
      </div>
    );
  }
};
