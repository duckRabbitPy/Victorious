import { GameState } from "../../../shared/common";

const GameStateDebugDisplay = ({ gameState }: { gameState: GameState }) => {
  return (
    <div id="game-state" style={{ border: "1px black solid" }}>
      <h2>Game state</h2>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
    </div>
  );
};

export default GameStateDebugDisplay;
