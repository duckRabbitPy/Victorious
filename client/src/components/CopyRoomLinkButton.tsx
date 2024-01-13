import { useState } from "react";

const CopyRoomLinkButton = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <button
      onClick={handleCopyClick}
      style={{
        minWidth: "15ch",
      }}
    >
      {copied ? "✅ Copied!" : "🔗 Copy link"}
    </button>
  );
};

export default CopyRoomLinkButton;
