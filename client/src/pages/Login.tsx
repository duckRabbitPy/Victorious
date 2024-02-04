import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetLoggedInUsername } from "../hooks/auth";
import { API_ENDPOINT } from "../constants";

export const Login = () => {
  const { loggedInUsername, refetchLoginStatus } = useGetLoggedInUsername();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = e.currentTarget.username.value;
    const password = e.currentTarget.password.value;

    const data = {
      username,
      password,
    };
    // fetch from backend running on port 3000
    fetch(`${API_ENDPOINT}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.authToken) {
          setErrorMessage(null);
          localStorage.removeItem("victorious_auth_token");
          localStorage.removeItem("victorious_user_name");
          localStorage.setItem("victorious_auth_token", data.authToken);
          localStorage.setItem("victorious_user_name", username);
          refetchLoginStatus();
          window.location.href = "/";
        } else {
          setErrorMessage(
            "A login error occurred, are you sure you have registered and entered the correct username and password?"
          );
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
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
        <button
          onClick={() => {
            localStorage.removeItem("victorious_auth_token");
            localStorage.removeItem("victorious_user_name");
            refetchLoginStatus();
            setErrorMessage(null);
          }}
        >
          Logout
        </button>
      </div>
      <h1>Login</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <form
          onSubmit={login}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          <input type="text" id="username" placeholder="Enter username" />
          <input type="password" id="password" placeholder="Enter password" />
          <button type="submit">Login</button>
        </form>
        {loggedInUsername ? (
          <div style={{ color: "green" }}>
            {loggedInUsername}: You're logged in!
          </div>
        ) : (
          <div style={{ color: "red" }}>Logged out</div>
        )}
        {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
      </div>
    </>
  );
};

export default Login;
