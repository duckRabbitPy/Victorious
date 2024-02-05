import { Link } from "react-router-dom";
import { useGetLoggedInUsername } from "../hooks/auth";
import Room from "../pages/Room";
import React, { useState } from "react";
import { Backgrounds } from "../constants";
import { Spinner } from "./Utils";

const AuthWrappedRoom = () => {
  const { loggedInUsername, loading: loadingLoginData } =
    useGetLoggedInUsername();
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
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
          src={
            backgroundLoaded
              ? Backgrounds[backgroundIndex]
              : "https://res.cloudinary.com/dkytnwn87/image/upload/v1705708773/dominion/low_res_default_background.jpg"
          }
          alt="Background"
          style={imgStyle}
          onLoad={() => {
            setBackgroundLoaded(true);
          }}
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
      <>{loadingLoginData ? <Spinner /> : <h1>Not logged in </h1>}</>
    </>
  );
};

export default AuthWrappedRoom;
