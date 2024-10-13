import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import WalletConnectProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

const Dashboard = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const [userAddress, setUserAddress] = useState(null);
  const [connectedChain, setConnectedChain] = useState("");
  const [provider, setProvider] = useState(null);

  const initializeWalletConnect = async () => {
    const wcProvider = new WalletConnectProvider({
      rpc: {
        11155111: "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
        // Add other network RPC URLs here as needed
      },
      qrcodeModalOptions: {
        mobileLinks: ["metamask", "trust"],
      },
    });

    await wcProvider.enable(); // Prompt WalletConnect modal on mobile
    setProvider(new ethers.BrowserProvider(wcProvider));
  };

  const connectWallet = async () => {
    try {
      if (!provider) {
        await initializeWalletConnect();
      }
      const accounts = await provider.listAccounts();
      setUserAddress(accounts[0]);

      const network = await provider.getNetwork();
      setConnectedChain(network.name || "Unknown");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const disconnectWallet = () => {
    if (provider && provider.disconnect) {
      provider.disconnect();
    }
    setUserAddress(null);
    setConnectedChain("");
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

        {userAddress && <p>Connected: {userAddress}</p>}
        <p>Current Chain: {connectedChain}</p>

        <div className="level-container">
          <span className="level-text">Level {level}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((coinBalance + gemBalance) % 1000) / 10}%` }}
            ></div>
          </div>
        </div>

        {userAddress ? (
          <button className="connect-button" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
        ) : (
          <button className="connect-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

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
    </div>
  );
};

export default Dashboard;
