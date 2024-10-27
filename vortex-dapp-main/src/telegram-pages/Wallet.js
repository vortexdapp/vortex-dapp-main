// telegram-web-app/src/telegram-pages/Wallet.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../WalletContext";
import { ethers } from "ethers";
import "./Wallet.css";

const networkOptions = [
  {
    name: "Sepolia",
    chainId: "0xaa36a7",
    rpcUrl: "https://sepolia.infura.io/v3/4a4fe805be2e453fb73eb027658a0aa6",
  },
  {
    name: "Base",
    chainId: "0x2105",
    rpcUrl: "https://mainnet.base.org",
  },
];

const Wallet = () => {
  const { wallet } = useWallet();
  const [balance, setBalance] = useState("0.0");
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  useEffect(() => {
    if (wallet && selectedNetwork) {
      const provider = new ethers.JsonRpcProvider(selectedNetwork.rpcUrl);
      provider.getBalance(wallet.address).then((balance) => {
        setBalance(ethers.formatEther(balance));
      });
    }
  }, [wallet, selectedNetwork]);

  const handleNetworkChange = (event) => {
    const newChainId = event.target.value;
    const network = networkOptions.find((n) => n.chainId === newChainId);
    setSelectedNetwork(network);
  };

  return (
    <div className="settings">
      <div className="wallet-page">
        <h2>Wallet</h2>
        <p>Address: {wallet?.address || "No wallet connected"}</p>
        <p>Balance: {balance} ETH</p>

        <select value={selectedNetwork.chainId} onChange={handleNetworkChange}>
          {networkOptions.map((option) => (
            <option key={option.chainId} value={option.chainId}>
              {option.name}
            </option>
          ))}
        </select>

        {/* <div className="level-container">
        <span className="level-text">Level {level}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div> */}
      </div>
    </div>
  );
};

export default Wallet;
