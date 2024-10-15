// telegram-web-app/src/telegram-pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../WalletContext";
import "./Dashboard.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import { ethers } from "ethers";

const networkOptions = [
  {
    name: "Sepolia",
    chainId: "0xaa36a7", // Hexadecimal for Sepolia
    rpcUrl: "https://sepolia.infura.io/v3/4a4fe805be2e453fb73eb027658a0aa6",
    explorerUrl: "https://sepolia.etherscan.io/",
  },
  {
    name: "Base",
    chainId: "0x2105", // Hexadecimal for Base
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org/",
  },
];

const Dashboard = () => {
  const { wallet, disconnectWallet } = useWallet();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [userData, setUserData] = useState({});

  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  useEffect(() => {
    if (wallet && selectedNetwork) {
      try {
        const networkProvider = new ethers.JsonRpcProvider(
          selectedNetwork.rpcUrl
        );
        const privateKey = wallet.privateKey.startsWith("0x")
          ? wallet.privateKey
          : `0x${wallet.privateKey}`;
        const userWallet = new ethers.Wallet(privateKey, networkProvider);
        setProvider(networkProvider);
        setSigner(userWallet);
      } catch (error) {
        console.error("Failed to create signer with private key:", error);
      }
    }

    // Safely check for Telegram WebApp Data
    if (window.Telegram && window.Telegram.WebApp) {
      const { username, photo_url } =
        window.Telegram.WebApp.initDataUnsafe.user || {};
      if (username && photo_url) {
        setUserData({ username, photo_url });
        console.log("User data loaded:", { username, photo_url });
      } else {
        console.warn("User data not available in Telegram WebApp.");
        setUserData({
          username: "No username found",
          photo_url: "", // Default placeholder if needed
        });
      }
    } else {
      console.warn(
        "Telegram WebApp is not available. Ensure this is running within the Telegram environment."
      );
    }
  }, [wallet, selectedNetwork]);

  const handleNetworkChange = async (event) => {
    const newChainId = event.target.value;
    const network = networkOptions.find((n) => n.chainId === newChainId);
    if (!network) {
      alert("Network configuration not found for the selected chain ID.");
      return;
    }
    setSelectedNetwork(network);

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
    } catch (error) {
      console.error("Network switch error:", error);
    }
  };

  const sendTransaction = async () => {
    if (!signer) {
      alert("Wallet not connected or signer not available");
      return;
    }
    try {
      const tx = await signer.sendTransaction({
        to: "0xf11D21eB5447549E3E815c6E357e3D0779FeC838",
        value: ethers.parseEther("0.01"),
      });
      alert("Transaction sent! Hash: " + tx.hash);
    } catch (error) {
      console.error("Transaction error:", error);
      alert("Failed to send transaction: " + error.message);
    }
  };

  return (
    <div className="settings">
      <div className="user-info">
        {userData.photo_url ? (
          <img src={userData.photo_url} alt="User Avatar" className="avatar" />
        ) : (
          <div className="avatar-placeholder"></div>
        )}
        <p>{userData.username}</p>
      </div>

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

      <p>Connected: {wallet?.address || "No wallet connected"}</p>
      <div className="level-container">
        <span className="level-text">Level {level}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <select value={selectedNetwork.chainId} onChange={handleNetworkChange}>
        {networkOptions.map((option) => (
          <option key={option.chainId} value={option.chainId}>
            {option.name}
          </option>
        ))}
      </select>

      <button onClick={sendTransaction} className="button">
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
  );
};

export default Dashboard;
