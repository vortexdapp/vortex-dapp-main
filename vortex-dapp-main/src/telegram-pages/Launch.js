// telegram-web-app/src/telegram-pages/Launch.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Launch.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";

const Launch = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;
  return (
    <div className="settings">
      <div className="balance">
        <div className="balance-item">
          <img src={coinIcon} alt="Coins" className="icon" />
          <span>{coinBalance}</span>
        </div>
        <div className="balance-item">
          <img src={gemIcon} alt="Gems" className="icon" />
          <span>{gemBalance}</span>
        </div>
        <div className="balance-item">
          <Link to="/wallet">
            <img src={walletIcon} alt="Wallet" className="wallet-icon" />
          </Link>
        </div>
      </div>

      <div className="level-container">
        <span className="level-text">Level {level}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="launch">
        <h2>Token Launch</h2>
        <p>Borrow initial LP and launch your token</p>

        {/* Token Launch Form */}
        <div className="launch-form">
          <label>
            Token Name:
            <input type="text" placeholder="Enter token name" />
          </label>
          <label>
            Token Symbol:
            <input type="text" placeholder="Enter token symbol" />
          </label>
          <label>
            Total Supply:
            <input type="number" placeholder="Enter total supply" />
          </label>
          <button className="launch-button">Create Token</button>
        </div>
      </div>

      {/* Footer Menu */}
      <div className="footer-menu">
        <Link to="/Dashboard" className="menu-item">
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
  );
};

export default Launch;
