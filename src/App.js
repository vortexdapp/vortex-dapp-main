// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StakingPage from "./pages/StakingPage";
import DashboardPage from "./pages/Dashboard";
import FactoryPage from "./pages/FactoryPage";
import PointsPage from "./pages/Points";
import TaskPage from "./pages/Task";
import AfterLaunch from "./pages/AfterLaunch";
import TokensPage from "./pages/TokenListPage";
import CombinedFactoryDashboard from "./pages/Launch";
import TokenBuyTrackerPage from "./pages/TokenBuyTrackerPage";
import VortexConnectPage from "./pages/VortexConnectPage";
import Trading from "./pages/Trading";
import { VortexConnectProvider } from "./VortexConnectContext"; // Import context provider
import Header from "./components/Header";

function App() {
  return (
    <VortexConnectProvider> {/* Wrap the entire app with the provider */}
      <Router>
       
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/factory" element={<FactoryPage />} />
          <Route path="/launch" element={<CombinedFactoryDashboard />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/tokenbuy" element={<TokenBuyTrackerPage />} />
          <Route path="/dashboard/:contractAddress" element={<DashboardPage />} />
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
