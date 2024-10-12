// telegram-web-app/src/telegram-pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import { ethers } from "ethers";

const networkOptions = [
  {
    name: "Sepolia",
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"],
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
  },
  {
    name: "Base",
    chainId: "0x2105",
    chainName: "Base Mainnet",
    nativeCurrency: { name: "Base", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://base.blockscout.com/"],
  },
  {
    name: "Optimism",
    chainId: "0xa",
    chainName: "Optimism",
    nativeCurrency: { name: "Optimism", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io/"],
  },
  {
    name: "BNB Chain",
    chainId: "0x38",
    chainName: "Binance Smart Chain",
    nativeCurrency: { name: "Binance Coin", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
  },
  {
    name: "Avalanche",
    chainId: "0xa86a",
    chainName: "Avalanche C-Chain",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io/"],
  },
];

const Dashboard = () => {
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const [userAddress, setUserAddress] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(
    networkOptions[0].chainId
  );
  const [connectedChain, setConnectedChain] = useState("");

  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  const switchNetwork = async (network) => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: network.chainId }],
        });
        setConnectedChain(network.name);
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [network],
            });
            setConnectedChain(network.name);
          } catch (addError) {
            console.error("Failed to add network:", addError);
          }
        } else {
          console.error("Failed to switch network:", error);
        }
      }
    } else {
      console.error("MetaMask is not installed.");
    }
  };

  const handleNetworkChange = (event) => {
    const selectedNetwork = networkOptions.find(
      (network) => network.chainId === event.target.value
    );
    setSelectedNetwork(selectedNetwork.chainId);
    switchNetwork(selectedNetwork);
  };

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setUserAddress(accounts[0]);
        console.log("Connected Wallet Address:", accounts[0]);

        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const network = networkOptions.find((net) => net.chainId === chainId);
        setConnectedChain(network ? network.name : "Unknown");
        setSelectedNetwork(chainId);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      console.error("MetaMask not found. Please install MetaMask.");
    }
  };

  const disconnectWallet = () => {
    setUserAddress(null);
    setConnectedChain("");
    console.log("Wallet disconnected.");
  };

  useEffect(() => {
    if (userAddress) {
      const initialNetwork = networkOptions.find(
        (network) => network.chainId === selectedNetwork
      );
      switchNetwork(initialNetwork);
    }
  }, [userAddress]);

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
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {userAddress ? (
          <button className="connect-button" onClick={disconnectWallet}>
            Disconnect Wallet
          </button>
        ) : (
          <button className="connect-button" onClick={connectMetaMask}>
            Connect MetaMask
          </button>
        )}

        <select onChange={handleNetworkChange} value={selectedNetwork}>
          {networkOptions.map((network) => (
            <option key={network.chainId} value={network.chainId}>
              {network.name}
            </option>
          ))}
        </select>
      </div>

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
  );
};

export default Dashboard;
