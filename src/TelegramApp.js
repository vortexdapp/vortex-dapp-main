import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./telegram-pages/Dashboard";
import Launch from "./telegram-pages/Launch";
import Stake from "./telegram-pages/Stake";
import Trade from "./telegram-pages/Trade";
import Airdrop from "./telegram-pages/Airdrop";
import StartPage from "./telegram-pages/Start";
import CheckIn from "./telegram-pages/DailyCheckIn";
import Token from "./telegram-pages/Token";
import Wallet from "./telegram-pages/Wallet";
import Wheel from "./telegram-pages/Wheel";
import Header from "./telegram-components/Header";
import Footer from "./telegram-components/Footer";
import { WalletProvider } from "./WalletContext";
import "./TelegramApp.css";

const TelegramApp = () => {
  const [coinBalance, setCoinBalance] = useState(0);
  const [gemBalance, setGemBalance] = useState(50);
  const [level, setLevel] = useState(1);

  return (
    <WalletProvider>
      <Router>
        <div className="settings">
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/start" element={<StartPage />} />
            <Route
              path="/dashboard"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Dashboard />
                  <Footer />
                </>
              }
            />
            <Route
              path="/launch"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Launch />
                  <Footer />
                </>
              }
            />
            <Route
              path="/stake"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Stake />
                  <Footer />
                </>
              }
            />
            <Route
              path="/trade"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Trade />
                  <Footer />
                </>
              }
            />
            <Route
              path="/token"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Token
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Footer />
                </>
              }
            />
            <Route
              path="/daily-checkin"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <CheckIn
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    setGemBalance={setGemBalance}
                    level={level}
                    setLevel={setLevel}
                  />
                  <Footer />
                </>
              }
            />
            <Route
              path="/wallet"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Wallet />
                  <Footer />
                </>
              }
            />
            <Route
              path="/wheel"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Wheel
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Footer />
                </>
              }
            />
            <Route
              path="/airdrop"
              element={
                <>
                  <Header
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setCoinBalance={setCoinBalance}
                    setGemBalance={setGemBalance}
                    setLevel={setLevel}
                  />
                  <Airdrop
                    coinBalance={coinBalance}
                    gemBalance={gemBalance}
                    level={level}
                    setGemBalance={setGemBalance} // Make sure to pass this
                    setCoinBalance={setCoinBalance} // Pass this as well
                    setLevel={setLevel} // And this
                  />
                  <Footer />
                </>
              }
            />

            {/* Other routes remain the same */}
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
};

export default TelegramApp;
