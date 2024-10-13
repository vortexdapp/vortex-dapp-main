// telegram-web-app/src/telegram-pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";

const Dashboard = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const [userAddress, setUserAddress] = useState(null);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  // Function to connect to Telegram Wallet
  const connectTelegramWallet = async () => {
    if (window.Telegram && window.Telegram.WebApp) {
      const walletAddress = window.Telegram.WebApp.initDataUnsafe?.user?.id;
      if (walletAddress) {
        setUserAddress(walletAddress);
        console.log("Connected to Telegram with address:", walletAddress);
      } else {
        console.error("Telegram Wallet not found.");
      }
    } else {
      console.error("Telegram WebApp is not available.");
    }
  };

  const disconnectWallet = () => {
    setUserAddress(null);
    console.log("Wallet disconnected.");
  };

  return (
    <div className="background-image">
      <div className="dashboard">
        <div className="balance">
          <div className="balance-item">
            <img src={coinIcon} alt="Coins" className="icon" />
            <span>{coinBalance}</span>
          </div>
          <div className="balance-item">
            <img src={gemIcon} alt="Gems" className="icon" />
            <span>{gemBalance}</span>
          </div>
        </div>

        {userAddress && <p>Connected: {userAddress}</p>}

        <div className="level-container">
          <span className="level-text">Level {level}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {userAddress ? (
          <button className="connect-button" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
        ) : (
          <button className="connect-button" onClick={connectTelegramWallet}>
            Connect Telegram Wallet
          </button>
        )}

        <div className="footer-menu">
          <Link to="/dashboard" className="menu-item">
            Dashboard
          </Link>
          <Link to="/launch" className="menu-item">
            Launch
          </Link>
          <Link to="/stake" className="menu-item">
            Stake
          </Link>
          <Link to="/trade" className="menu-item">
            Trade
          </Link>
          <Link to="/airdrop" className="menu-item">
            Airdrop
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
