// telegram-web-app/src/telegram-pages/Stake.js
import React from "react";
import { Link } from "react-router-dom";
import "./Stake.css";

const Stake = () => {
  return (
    <div className="background-img">
      <div className="stake">
        <h2>Stake Your Tokens</h2>
        <p>Earn rewards by staking your Vortex tokens!</p>

        {/* Staking Form */}
        <div className="stake-form">
          <label>
            Amount to Stake:
            <input type="number" placeholder="Enter amount" />
          </label>
          <div className="button-group">
            <button className="action-button">Stake</button>
            <button className="action-button">Unstake</button>
            <button className="action-button">Claim Rewards</button>
          </div>
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

export default Stake;
