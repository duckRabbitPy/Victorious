import { GameState } from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";

const OpponentHands = ({
  gameState,
  loggedInUsername,
}: {
  gameState: GameState;
  loggedInUsername: string;
}) => {
  const opponents = gameState.actor_state.filter((actor) => {
    return actor.name !== loggedInUsername;
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      {opponents.map((opponent, index) => {
        const cardsInHand = Object.values(opponent.hand).reduce(
          (acc, curr) => acc + curr,
          0
        );

        const cardsInPlay = Object.values(opponent.cardsInPlay).reduce(
          (acc, curr) => acc + curr,
          0
        );
        return (
          <div
            key={index}
            style={{
              border: "1px black solid",
              boxSizing: "border-box",
              background: "rgba(255, 255, 255, 0.7)",
              minWidth: "100%",
            }}
          >
            <p style={{ margin: 0 }}>Opponent: {opponent.name} ⚔️</p>
            <p style={{ margin: 0 }}>
              Victory points: <b>{opponent.victoryPoints}</b>
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.5rem",
                margin: "0.5rem",
              }}
            >
              {Array(cardsInHand)
                .fill(0)
                .map((_, index) => (
                  <img
                    src={
                      "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_back_of_playing_card_dark_blue_regal_0_unuaad.jpg"
                    }
                    key={index}
                    style={{
                      height: isUsersTurn(gameState, loggedInUsername)
                        ? "50px"
                        : "150px",
                      width: isUsersTurn(gameState, loggedInUsername)
                        ? "30px"
                        : "90px",
                      border: "2px black solid",
                    }}
                  />
                ))}
              <div>
                <p>Trash: {cardsInPlay}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OpponentHands;
