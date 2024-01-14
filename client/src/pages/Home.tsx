import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetLoggedInUsername } from "../hooks/auth";
import { API_ENDPOINT } from "../constants";

export const Home = () => {
  const [room, setRoom] = useState<number | null>(null);
  const [openRooms, setOpenRooms] = useState<number[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { loggedInUsername } = useGetLoggedInUsername();

  const openRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const room = e.currentTarget.room.value;

    const data = {
      room: Number(room),
    };

    fetch(`${API_ENDPOINT}/game-sessions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((json) => {
        setErrorMessage(null);

        if (json.data?.gameState?.room) {
          setRoom(json.data?.gameState?.room);
        } else {
          setErrorMessage(json?.message || "Error: room creation failed");
        }
      })
      .catch(() => {
        setErrorMessage("Error: room creation failed");
      });
  };

  const getOpenRooms = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetch(`${API_ENDPOINT}/game-sessions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.openRooms.length === 0) {
          setErrorMessage(
            "There are no open rooms at this time. Please create a room."
          );
          return;
        }

        if (json.data.openRooms.length) {
          setErrorMessage(null);
          setOpenRooms(json.data?.openRooms);
        } else {
          setErrorMessage("Error: fetching rooms failed");
        }
      })
      .catch(() => {
        setErrorMessage("Error: fetching rooms failed");
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
      {loggedInUsername ? (
        <div>
          <p style={{ color: "green" }}>Logged in as: {loggedInUsername}</p>
          <div>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          </div>
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
          </form>
          <div style={{ padding: "1rem" }}>
            {room && <Link to={`/room/${room}`}>Go to room: {room}</Link>}
          </div>
          <p>or</p>
          <div>
            <div>
              <form onClick={getOpenRooms}>
                <button>See current rooms available</button>
              </form>
              <ol style={{ padding: 0 }}>
                {openRooms?.map((room) => (
                  <li key={room} style={{ listStyle: "none" }}>
                    <Link to={`/room/${room}`}>Room {room}</Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
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
