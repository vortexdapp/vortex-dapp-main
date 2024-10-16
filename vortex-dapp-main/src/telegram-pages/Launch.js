// telegram-web-app/src/telegram-pages/Launch.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Launch.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";

const Launch = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;
  return (
    <div className="settings">
      <Header coinBalance={coinBalance} gemBalance={gemBalance} level={level} />
      <div className="launch">
        <h2>Token Launch</h2>
        <p className="title">Borrow initial LP and launch your token</p>

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
      <Footer />
    </div>
  );
};

export default Launch;
