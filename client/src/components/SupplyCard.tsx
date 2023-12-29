export const SupplyCard = ({
  children,
  onClick,
  canBuyCard,
  isUsersTurn,
}: {
  children: string;
  onClick: () => void;
  canBuyCard: boolean;
  isUsersTurn: boolean;
}) => {
  const cardStyle = {
    cursor: canBuyCard ? "pointer" : "not-allowed",
    border: `2px solid ${
      isUsersTurn && canBuyCard ? "green" : isUsersTurn ? "blue" : "red"
    }`,
  };
  return (
    <button style={cardStyle} onClick={onClick}>
      {children}
    </button>
  );
};
