// telegram-web-app/src/telegram-pages/Trade.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Trade.css";

const Trade = ({ tokenList }) => {
  const navigate = useNavigate();

  const handleTradeClick = (token) => {
    navigate(`/token/${token.symbol}`);
  };

  return (
    <div className="settings">
      <div className="trade-page">
        <h2>Available Tokens</h2>
        <div className="token-list">
          {tokenList.map((token) => (
            <div className="token-box" key={token.address}>
              <h3>{token.name}</h3>
              <p>{token.symbol}</p>
              <button
                className="launch-button"
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
