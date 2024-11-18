// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StakingPage from "./pages/StakingPage";
import PointsPage from "./pages/Points";
import TaskPage from "./pages/Task";
import AfterLaunch from "./pages/AfterLaunch";
import TokensPage from "./pages/TokenListPage";
import TokenBuyTrackerPage from "./pages/TokenBuyTrackerPage";
import VortexConnectPage from "./pages/VortexConnectPage";
import Trading from "./pages/Trading";
import { VortexConnectProvider } from "./VortexConnectContext"; // Import context provider
import Header from "./components/Header";
import LaunchToken from "./pages/LaunchToken";

function App() {
  return (
    <VortexConnectProvider> {/* Wrap the entire app with the provider */}
      <Router>
       
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/factory" element={<LaunchToken />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/tokenbuy" element={<TokenBuyTrackerPage />} />
          <Route path="/connect" element={<VortexConnectPage />} />
          <Route path="/tokens" element={<TokensPage />} />
          <Route path="/token/:contractAddress" element={<AfterLaunch />} />
          <Route path="/trading/:chain/:contractAddress" element={<Trading />} />
          <Route path="/staking" element={<StakingPage />} />
        </Routes>
      </Router>
    </VortexConnectProvider>
  );
}

export default App;
