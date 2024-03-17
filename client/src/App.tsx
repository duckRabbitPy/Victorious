import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Info } from "./pages/Info.tsx";
import AuthWrappedRoom from "./components/AuthWrappedRoom.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Home} />
        <Route path="/login" Component={Login} />
        <Route path="/register" Component={Register} />
        <Route path="/info" Component={Info} />
        <Route path="/room/*" Component={AuthWrappedRoom} />
      </Routes>
    </Router>
  );
}

export default App;
