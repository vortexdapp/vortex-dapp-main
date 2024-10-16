// telegram-web-app/src/telegram-pages/Stake.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Stake.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";

const Stake = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;
  return (
    <div className="settings">
      <Header coinBalance={coinBalance} gemBalance={gemBalance} level={level} />
      <div className="staking">
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
      </div>
      {/* Footer Menu */}
      <Footer />
    </div>
  );
};

export default Stake;
