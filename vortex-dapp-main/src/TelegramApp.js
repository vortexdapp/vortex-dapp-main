// telegram-web-app/src/TelegramApp.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./telegram-pages/Dashboard";
import Launch from "./telegram-pages/Launch";
import Stake from "./telegram-pages/Stake";
import Trade from "./telegram-pages/Trade";
import Airdrop from "./telegram-pages/Airdrop";
import StartPage from "./telegram-pages/Start";
import CheckIn from "./telegram-pages/DailyCheckIn";
import Token from "./telegram-pages/Token";
import { WalletProvider } from "./WalletContext";
import "./TelegramApp.css";

const tokenList = [
  {
    symbol: "VTX",
    address: "0x123",
    name: "Vortex Token",
    logo: "vtx-logo.png",
    marketCap: 1000000,
  },
  {
    symbol: "GEM",
    address: "0x456",
    name: "Gem Token",
    logo: "gem-logo.png",
    marketCap: 500000,
  },
  {
    symbol: "COIN",
    address: "0x789",
    name: "Coin Token",
    logo: "coin-logo.png",
    marketCap: 200000,
  },
];

const TelegramApp = () => {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/launch" element={<Launch />} />
          <Route path="/stake" element={<Stake />} />
          <Route path="/trade" element={<Trade tokenList={tokenList} />} />
          <Route path="/airdrop" element={<Airdrop />} />
          <Route path="/daily-checkin" element={<CheckIn />} />
          <Route
            path="/token/:symbol"
            element={<Token tokenList={tokenList} />}
          />
        </Routes>
      </Router>
    </WalletProvider>
  );
};

export default TelegramApp;
