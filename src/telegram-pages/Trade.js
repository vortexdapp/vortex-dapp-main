// src/telegram-pages/Trade.js

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../WalletContext";
import { supabase } from "../supabaseClient"; // Import Supabase client
import "./Trade.css";
import WalletRestorer from "../telegram-components/WalletRestorer";

const networkOptions = [
  {
    name: "Sepolia",
    chainId: "0xaa36a7",
    rpcUrl: "https://sepolia.infura.io/v3/4a4fe805be2e453fb73eb027658a0aa6",
    explorerUrl: "https://sepolia.etherscan.io/",
  },
  {
    name: "Base",
    chainId: "0x2105",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org/",
  },
  {
    name: "Ethereum Mainnet",
    chainId: "1", // Hexadecimal for Mainnet
    rpcUrl:
      "https://eth-mainnet.g.alchemy.com/v2/KpNrW4KZXsySi2tjlTCb3E9KbWxhXmYY",
    explorerUrl: "https://etherscan.io/",
  },
];

const Trade = () => {
  const { wallet } = useWallet();
  const [provider, setProvider] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [tokenList, setTokenList] = useState([]);
  const username = localStorage.getItem("username");

  // Fetch tokens from Supabase
  useEffect(() => {
    const fetchTokens = async () => {
      const { data, error } = await supabase
        .from("tokens")
        .select("name, symbol, supply, address");
      if (error) {
        console.error("Error fetching tokens:", error);
      } else {
        setTokenList(data);
      }
    };
    fetchTokens();
  }, []);

  useEffect(() => {
    if (wallet && selectedNetwork) {
      try {
        const networkProvider = new ethers.JsonRpcProvider(
          selectedNetwork.rpcUrl
        );
        const privateKey = wallet.privateKey.startsWith("0x")
          ? wallet.privateKey
          : `0x${wallet.privateKey}`;
        new ethers.Wallet(privateKey, networkProvider);
        setProvider(networkProvider);
      } catch (error) {
        console.error("Failed to create provider with private key:", error);
      }
    }
  }, [wallet, selectedNetwork]);

  const handleTradeClick = (token) => {
    window.open(`/token/${token.address}`, "_blank"); // Redirecting to /token/<tokenAddress>
  };

  return (
    <div className="settings">
      <WalletRestorer username={username} />
      <p className="display-wallet">
        Connected: {wallet?.address || "No wallet connected"}
      </p>
      <div className="trade-page">
        <h2>Available Tokens</h2>
        <div className="token-list">
          {tokenList.map((token) => (
            <div className="token-box" key={token.address}>
              <h3>{token.name}</h3>
              <p>Symbol: {token.symbol}</p>
              <p>
                Market Cap: {token.supply ? `${token.supply * 0.1} USD` : "N/A"}
              </p>
              <button
                className="trade-button"
                onClick={() => handleTradeClick(token)}
              >
                Trade
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trade;
