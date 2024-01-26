import { useEffect, useState } from "react";
import { GameState } from "../../../shared/common";

const GameStateDebugDisplay = ({ gameState }: { gameState: GameState }) => {
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + d to show debug info
      if (event.ctrlKey && event.key === "d") {
        setDebug((prev) => !prev);
      }
    };

    // Add event listener for keydown
    window.addEventListener("keydown", handleKeyPress);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []); //

  if (!debug) return null;

  return (
    <div
      id="game-state"
      style={{ border: "1px black solid", background: "white" }}
    >
      <h2>Game state</h2>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
};

export default GameStateDebugDisplay;
