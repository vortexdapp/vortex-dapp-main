import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Add useNavigate for redirection
import { fetchUserBalance } from "../WalletManager"; // Import the balance fetching function
import "./Header.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import wheelIcon from "../assets/Wheel.png";

const Header = ({
  coinBalance,
  gemBalance,
  level,
  setCoinBalance,
  setGemBalance,
  setLevel,
}) => {
  const navigate = useNavigate(); // Now it's inside the Router context
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchBalances = async () => {
      if (username) {
        const userBalances = await fetchUserBalance(username);
        if (userBalances) {
          setCoinBalance(userBalances.coin_balance);
          setGemBalance(userBalances.gem_balance);
          setLevel(userBalances.level);
        } else {
          setCoinBalance(0);
          setGemBalance(50);
          setLevel(1);
        }
      } else {
        navigate("/start"); // Redirect if no username found
      }
    };

    fetchBalances();
  }, [navigate, setCoinBalance, setGemBalance, setLevel, username]);

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
        <div className="balance-item">
          <Link to="/wheel">
            <img src={wheelIcon} alt="Wheel" className="wallet-icon" />
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
