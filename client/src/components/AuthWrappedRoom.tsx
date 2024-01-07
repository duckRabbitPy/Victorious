import { Link } from "react-router-dom";
import { useGetLoggedInUsername } from "../hooks/auth";
import Room from "../pages/Room";
import React, { useState } from "react";
import { Backgrounds } from "../constants";

const AuthWrappedRoom = () => {
  const { loggedInUsername } = useGetLoggedInUsername();
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  const imgStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: -1,
  } as React.CSSProperties;

  if (loggedInUsername) {
    return (
      <>
        <img
          src={Backgrounds[backgroundIndex]}
          alt="Background"
          style={imgStyle}
        />
        <Room
          loggedInUsername={loggedInUsername}
          setBackgroundIndex={setBackgroundIndex}
        />
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <Link to={"/"}>Home</Link>
        <Link to={"/login"}>Login</Link>
      </div>
      <h1>Not logged in</h1>
    </>
  );
};

export default AuthWrappedRoom;
