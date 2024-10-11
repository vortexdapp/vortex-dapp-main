// telegram-web-app/src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import coinIcon from "../assets/coin.jpg";
import gemIcon from "../assets/gem.jpg";
import coolIcon from "../assets/cool.png";

const Dashboard = () => {
  const [coinBalance, setCoinBalance] = useState(1000); // Replace with actual data
  const [gemBalance, setGemBalance] = useState(250); // Replace with actual data
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;

  // Calculate the total points and progress toward the next level
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  // Check if user has leveled up
  useEffect(() => {
    if (totalPoints >= level * levelUpThreshold) {
      setLevel((prevLevel) => prevLevel + 1);
    }
  }, [totalPoints, level, levelUpThreshold]);

  return (
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

      {/* Level and Progress Bar at the Top */}
      <div className="level-container">
        <span className="level-text">Level {level}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <img src={coolIcon} alt="Cool" className="image" />

      <div className="footer-menu">
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

export default Dashboard;
