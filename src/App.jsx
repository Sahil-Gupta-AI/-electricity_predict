import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import PredictBillPage from "./pages/PredictBillPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Home" element={<HomePage />}/>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/predictbill" element={<PredictBillPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
