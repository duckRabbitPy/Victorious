import { Link } from "react-router-dom";
import { useGetLoggedInUsername } from "../hooks/auth";
import Room from "../pages/Room";

const AuthWrappedRoom = () => {
  const { loggedInUsername } = useGetLoggedInUsername();

  if (loggedInUsername) {
    return <Room loggedInUsername={loggedInUsername} />;
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
