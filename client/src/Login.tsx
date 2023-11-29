import { Link } from "react-router-dom";

export const Login = () => {
  const login = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = e.currentTarget.username.value;

    const data = {
      username,
    };
    // fetch from backend running on port 3000
    fetch(`http://localhost:3000/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link to={"/"}>Home</Link>
      </div>
      <h1>Login</h1>
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
          <input type="password" id="password" placeholder="Enter password" />
          <button type="submit">Login</button>
        </form>
      </div>
    </>
  );
};

export default Login;
