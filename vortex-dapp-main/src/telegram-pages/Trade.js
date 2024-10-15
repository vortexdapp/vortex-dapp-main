// telegram-web-app/src/telegram-pages/Trade.js
import React, { useState, useEffect } from "react";
import "./Launch.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import { Link, useNavigate } from "react-router-dom";
import "./Trade.css";

const Trade = ({ tokenList }) => {
  const navigate = useNavigate();
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  const handleTradeClick = (token) => {
    navigate(`/token/${token.symbol}`);
  };

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

      <div className="trade-page">
        <h2>Available Tokens</h2>
        <div className="token-list">
          {tokenList.map((token) => (
            <div className="token-box" key={token.address}>
              <h3>{token.name}</h3>
              <p>{token.symbol}</p>
              <button
                className="trade-button"
                onClick={() => handleTradeClick(token)}
              >
                Trade
              </button>
            </div>
          ))}
        </div>
      </div>
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
  );
};

export default Trade;
