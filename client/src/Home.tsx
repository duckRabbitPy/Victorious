import React, { useState } from "react";
import { Link } from "react-router-dom";

export const Home = () => {
  const [room, setRoom] = useState<number | null>(null);
  const openRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = e.currentTarget.username.value;
    const room = e.currentTarget.room.value;

    const data = {
      name,
      room,
      userIds: [
        // getAuthToken(),
        "0d3a57b4-6375-42f6-86d3-6a8635867000",
      ],
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
      .then((data) => {
        setRoom(data?.room);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <>
      <h1>Welcome to Dominion!</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* form submission to get name and room */}
        <form onSubmit={openRoom}>
          <input type="text" id="username" placeholder="Enter your name" />
          <input type="text" id="room" placeholder="Enter room number" />
          <button type="submit">Create room</button>
          {room && <Link to={`/room/${room}`}>Go to room: {room}</Link>}
        </form>
      </div>
    </>
  );
};

export default Home;
