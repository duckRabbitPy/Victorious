import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Backgrounds } from "../constants";

export const BackgroundSelector = ({
  setBackgroundIndex,
}: {
  setBackgroundIndex: React.Dispatch<React.SetStateAction<number>>;
}) => (
  <div style={{ display: "flex", gap: "1rem", color: "white" }}>
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
      <FaArrowLeft />
    </button>
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
      <FaArrowRight />
    </button>
  </div>
);
