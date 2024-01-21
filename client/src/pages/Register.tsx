import { useState } from "react";
import { Link } from "react-router-dom";
import { API_ENDPOINT } from "../constants";

export const Register = () => {
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const login = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const username = e.currentTarget.username.value;
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;

    const data = {
      username,
      email,
      password,
    };

    fetch(`${API_ENDPOINT}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      // todo parse json and type response
      .then((data) => {
        if (data.successMsg) {
          setErrorMessage(null);
          setEmailSent(true);
        } else {
          setErrorMessage("An error occurred, please try again.");
        }
      })
      .catch((error) => {
        setErrorMessage("An error occurred, please try again.");
        console.error("Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link to={"/"}>Home</Link>
      </div>
      <h1>Register</h1>
      <div>
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
          <input type="text" id="email" placeholder="Enter email" />
          <input type="password" id="password" placeholder="Enter password" />
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        {emailSent && <p style={{ color: "green" }}>Email sent!</p>}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      </div>
    </>
  );
};

export default Register;
