import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { RiPaintFill } from "react-icons/ri";

import { Backgrounds, THEME_COLORS } from "../constants";

export const BackgroundSelector = ({
  setBackgroundIndex,
}: {
  setBackgroundIndex: React.Dispatch<React.SetStateAction<number>>;
}) => (
  <div
    style={{
      display: "flex",
      gap: "1rem",
      color: "white",
      alignItems: "center",
    }}
  >
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
      }}
    >
      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={() => {
          setBackgroundIndex((i = 0) => (i === 0 ? Backgrounds.length : i - 1));
        }}
      >
        <FaArrowLeft size={10} />
      </button>
      <div
        style={{
          backgroundColor: THEME_COLORS.white,
          padding: "0.2rem 0.5rem",
          borderRadius: "5px",
        }}
      >
        <RiPaintFill color="black" size={20} />
      </div>
      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onClick={() => {
          setBackgroundIndex((i) => (i === Backgrounds.length - 1 ? 0 : i + 1));
        }}
      >
        <FaArrowRight size={10} />
      </button>
    </div>
  </div>
);
