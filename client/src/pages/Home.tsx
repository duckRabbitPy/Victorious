import React, { useState } from "react";
import { Link } from "react-router-dom";

export const Home = () => {
  const [room, setRoom] = useState<number | null>(null);
  const hasAuthToken = !!localStorage.getItem("dominion_auth_token");

  const openRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const room = e.currentTarget.room.value;

    const data = {
      room,
    };
    // fetch from backend running on port 3000
    fetch(`http://localhost:3000/game-state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => {
        setRoom(json.data?.gameState?.room);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
        <Link to={"/login"}>Login</Link>
        <Link to={"/register"}>
          <span style={{ color: "green" }}> Register</span>
        </Link>
      </div>
      <h1>Welcome to Dominion!</h1>
      {hasAuthToken ? (
        <div>
          <form
            onSubmit={openRoom}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2rem",
            }}
          >
            <input type="text" id="room" placeholder="Enter room number" />
            <button type="submit">Create room</button>
            {room && <Link to={`/room/${room}`}>Go to room: {room}</Link>}
          </form>
        </div>
      ) : (
        <div>
          <p>Please login or register to play!</p>
        </div>
      )}
    </>
  );
};

export default Home;
