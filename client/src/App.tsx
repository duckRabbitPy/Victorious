import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Home} />
        <Route path="/login" Component={Login} />
        <Route path="/register" Component={Register} />
        <Route path="/room/*" Component={Room} />
      </Routes>
    </Router>
  );
}

export default App;
