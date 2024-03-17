import { Link } from "react-router-dom";
import { THEME_COLORS } from "../constants";

export const Info = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
        padding: "2rem",
        margin: "2rem",
        color: "black",
        fontSize: "1.5rem",
        backgroundColor: THEME_COLORS.translucentStraw,
        borderRadius: "5px",
      }}
    >
      <Link to={"/"}>Home</Link>

      <h1 style={{ color: THEME_COLORS.victory }}>How to Play</h1>
      <div
        style={{
          textAlign: "left",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div>
          <h2>Cards</h2>
          <p>
            {" "}
            To inspect a card, right click on that card to read the description
            and understand what the card does.{" "}
          </p>
          <p>
            {" "}
            There are 250 cards in the game in total and three types of cards:
            Treasure, Action and Victory.{" "}
          </p>
          <p> You start each turn with 5 cards in your hand. </p>

          <h2>Action phase</h2>
          <p>
            {" "}
            Each turn you have the opportunity to play Action cards from your
            hand if you have them and if you have enough actions to do so.{" "}
          </p>
          <p>
            {" "}
            Playing action cards have a variety of positive effects such as
            increasing the number of buys, actions or cards.{" "}
          </p>

          <h2>Buy phase</h2>
          <p>
            {" "}
            After the Action phase you have the opportunity to play treasure
            cards in your hand, the more treasures you play the more cash you
            will have to buy expensive and powerful cards.{" "}
          </p>
          <p>
            {" "}
            Choose which cards you buy wisely based on what you need and how
            many buys you have available (typically at the start of the game you
            will need to buy treasure cards and at the end you will buy victory
            cards).{" "}
          </p>
          <p>
            {" "}
            Victory cards secure victory points which will be needed to win the
            game.{" "}
          </p>
          <p>When you have run out of buys or cash you must end your turn.</p>
          <h2>End game</h2>
          <p>
            {" "}
            The game ends when 3 piles are empty, or if the province pile is
            empty.{" "}
          </p>
          <p>
            {" "}
            When the game ends the player with the most victory points wins.{" "}
          </p>
        </div>
      </div>
    </div>
  );
};
