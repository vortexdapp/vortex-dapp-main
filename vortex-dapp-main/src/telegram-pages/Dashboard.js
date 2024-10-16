// telegram-web-app/src/telegram-pages/Dashboard.js

import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../WalletContext";
import "./Dashboard.css";
import "../TelegramApp.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import realm1 from "../assets/realm1.png";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";

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
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);

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
      <Header coinBalance={coinBalance} gemBalance={gemBalance} level={level} />
      <p className="display-wallet">
        Connected: {wallet?.address || "No wallet connected"}
      </p>
      {/* <select value={selectedNetwork.chainId} onChange={handleNetworkChange}>
        {networkOptions.map((option) => (
          <option key={option.chainId} value={option.chainId}>
            {option.name}
          </option>
        ))}
      </select>

      <button onClick={sendTransaction} className="button">
        Send 0.01 ETH
      </button> */}
      <img src={realm1} alt="Realm1" className="realm" />
      <Footer /> {/* Include Footer component */}
    </div>
  );
};

export default Dashboard;
