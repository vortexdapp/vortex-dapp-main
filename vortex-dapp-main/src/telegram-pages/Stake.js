// telegram-web-app/src/telegram-pages/Stake.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Stake.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";

const Stake = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  return (
    <div>
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

        <h2>Stake Your Tokens</h2>
        <p>Earn rewards by staking your Vortex tokens!</p>

        {/* Staking Form */}
        <div className="stake-form">
          <label>
            <input type="number" placeholder="Enter amount" />
          </label>
          <div className="button-group">
            <button className="action-button">Stake</button>
            <button className="action-button">Unstake</button>
            <button className="action-button">Claim Rewards</button>
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
    </div>
  );
};

export default Stake;
