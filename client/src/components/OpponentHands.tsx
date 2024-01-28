import { useState } from "react";
import { GameState, getUserNameColors } from "../../../shared/common";
import { isUsersTurn } from "../../../shared/utils";
import { THEME_COLORS } from "../constants";

const OpponentHands = ({
  gameState,
  loggedInUsername,
}: {
  gameState: GameState;
  loggedInUsername: string;
}) => {
  const [cardImgLoaded, setCardImgLoaded] = useState(false);

  const opponents = gameState.actor_state.filter((actor) => {
    return actor.name !== loggedInUsername;
  });

  const userNameColors = getUserNameColors(
    gameState.actor_state.map((actor) => actor.name)
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
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
              background: THEME_COLORS.translucentStraw,
              minWidth: "100%",
            }}
          >
            <p
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
              }}
            >
              <span
                style={{
                  color: THEME_COLORS.lightRed,
                }}
              >
                Opponent:
              </span>
              <span>{opponent.name}</span>
              <span
                style={{
                  display: "inline-block",
                  width: "1rem",
                  height: "1rem",
                  marginLeft: "0.5rem",
                  backgroundColor: userNameColors[opponent.name],
                }}
              />
            </p>
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
                      cardImgLoaded
                        ? "https://res.cloudinary.com/dkytnwn87/image/upload/v1704141742/dominion/Leonardo_Diffusion_XL_back_of_playing_card_dark_blue_regal_0_unuaad.jpg"
                        : "https://res.cloudinary.com/dkytnwn87/image/upload/v1705697183/dominion/Low_res_Leonardo_Diffusion_XL_back_of_playing_card_dark_blue_regal_0_unuaad_1_uowxin.jpg"
                    }
                    onLoad={() => {
                      setCardImgLoaded(true);
                    }}
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
