// telegram-web-app/src/telegram-pages/Dashboard.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../WalletContext"; // Import the wallet context hook
import "./Dashboard.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import { ethers } from "ethers";

const Dashboard = () => {
  const { wallet, disconnectWallet } = useWallet(); // Use wallet from context
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100; // Correctly defined progress

  const sendTransaction = async () => {
    if (!wallet || !wallet.signer) {
      alert("Wallet not connected or signer not available");
      return;
    }
    try {
      const txResponse = await wallet.signer.sendTransaction({
        to: "0xf11D21eB5447549E3E815c6E357e3D0779FeC838", // Specify the receiver's address here
        value: ethers.parseEther("0.01"), // Sending 0.01 ETH
      });
      console.log("Transaction hash:", txResponse.hash);
      alert("Transaction sent! Hash: " + txResponse.hash);
    } catch (error) {
      console.error("Transaction error:", error);
      alert("Failed to send transaction: " + error.message);
    }
  };

  return (
    <div className="background-image">
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

        {wallet && wallet.address ? (
          <div>
            <p>Connected: {wallet.address}</p>
          </div>
        ) : (
          <p>No wallet connected</p>
        )}

        <div className="level-container">
          <span className="level-text">Level {level}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <button onClick={sendTransaction} className="connect-button">
          Send 0.01 ETH
        </button>

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

export default Dashboard;
