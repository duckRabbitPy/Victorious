import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./Home";
import Room from "./Room";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Home} />
        <Route path="/room/*" Component={Room} />
      </Routes>
    </Router>
  );
}

export default App;
