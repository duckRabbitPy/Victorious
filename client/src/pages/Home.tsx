import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useGetLoggedInUsername } from "../hooks/auth";
import { FaInfoCircle } from "react-icons/fa";
import {
  API_ENDPOINT,
  LOCAL_STORAGE_AUTH_KEY,
  THEME_COLORS,
} from "../constants";

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
        authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)}`,
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
        authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)}`,
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
        setOpenRooms(null);
        setErrorMessage("Error: fetching rooms failed");
      });
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
        }}
      >
        <Link to={"/login"}>Login</Link>
        <Link to={"/register"}>
          <span style={{ color: "green" }}>Register</span>
        </Link>

        <Link
          to={"/info"}
          style={{ alignSelf: "center", display: "flex" }}
          target="_blank"
        >
          <FaInfoCircle size={20} color={THEME_COLORS.victory} />
        </Link>
      </div>
      <h1
        style={{
          color: THEME_COLORS.victory,
        }}
      >
        Welcome to Victorious! 🏰
      </h1>
      <div style={{ minHeight: "300px" }}>
        {loggedInUsername ? (
          <div>
            <p style={{ color: "green" }}>Logged in as: {loggedInUsername}</p>
            <div
              style={{
                display: "inline-flex",
                justifyContent: "space-between",
                gap: "0.5rem",
              }}
            >
              {errorMessage && (
                <>
                  <p style={{ color: "red" }}>{errorMessage}</p>
                  <button
                    style={{
                      padding: "0.5rem",
                      height: "fit-content",
                      alignSelf: "center",
                      color: "red",
                    }}
                    onClick={() => setErrorMessage(null)}
                  >
                    X
                  </button>
                </>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // check number less than 1 million
                if (e.currentTarget.room.value > 10000000) {
                  setErrorMessage(
                    "Error: room number must be less than 10 million"
                  );
                  return;
                } else {
                  openRoom(e);
                }
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2rem",
              }}
            >
              <input
                id="room"
                placeholder="Enter room number"
                type="number"
                min={1}
                style={{ width: "18ch", padding: "0.5rem" }}
              />
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
            <p style={{ animation: "pulse 2s infinite" }}>
              Please login or register to play!
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;
