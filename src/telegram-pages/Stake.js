// telegram-web-app/src/telegram-pages/Stake.js
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import { useWallet } from "../WalletContext"; // Access the user's wallet from context
import "./Stake.css";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";
import WalletRestorer from "../telegram-components/WalletRestorer";

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

const Stake = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const { wallet, setExistingWallet } = useWallet(); // Use the connected wallet from WalletContext
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const username = localStorage.getItem("username");

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

  return (
    <div className="settings">
      <WalletRestorer username={username} /> {/* Add the wallet restorer */}
      <p className="display-wallet">
        Connected: {wallet?.address || "No wallet connected"}
      </p>
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
    </div>
  );
};

export default Stake;
