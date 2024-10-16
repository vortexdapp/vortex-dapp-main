// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";

const Header = ({ coinBalance, gemBalance, level }) => {
  const levelUpThreshold = level * 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  return (
    <header className="header-container">
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
    </header>
  );
};

export default Header;
