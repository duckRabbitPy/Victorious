const Spacer = ({ size }: { size?: "small" | "medium" | "large" }) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return "0.5rem";
      case "medium":
        return "1rem";
      case "large":
        return "1.5rem";
      default:
        return "1rem";
    }
  };

  return <div style={{ margin: getSize() }} />;
};

export default Spacer;
