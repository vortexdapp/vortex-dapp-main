// src/telegram-pages/Launch.js
import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import { useWallet } from "../WalletContext";
import { supabase } from "../supabaseClient"; // Import Supabase client
import "./Launch.css";
import WalletRestorer from "../telegram-components/WalletRestorer";
import factoryABI from "../abis/FactoryABI.json";
import lockerABI from "../abis/LockerABI.json";

async function getLatestEvent(token, eventName) {
  // Get the filter for the TokenDeployed event
  const filter = token.filters[eventName]();

  // Query the filter for events emitted by the token contract
  const events = await token.queryFilter(filter);

  // Find the TokenDeployed event emitted by the token contract
  const latestEvent = events[events.length - 1]; // Get the latest event

  return latestEvent;
}

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
];

const Launch = () => {
  const { wallet } = useWallet();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState(0);
  const [buyAmount, setBuyAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
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

  const handleLaunchToken = async () => {
    if (!signer) {
      setErrorMessage("No wallet found. Please ensure you're logged in.");
      return;
    }

    if (!tokenName || !tokenSymbol || !tokenSupply) {
      setErrorMessage("Please fill in all the fields.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const factoryAddress = "0xfa7CD03150363656dA394d0BE40487dcd5Eb03c3";
      const lockerAddress = "0xf84679fF4F4d1e2Be76495194d0f6f2feA056CBb";
      const factory = new ethers.Contract(factoryAddress, factoryABI, signer);
      const amountIn = ethers.parseUnits("0.00000001", 18);
      const liquidityAmount = ethers.parseUnits("0.0000012", 18);
      const launchPrice = ethers.parseUnits("0.00002", 18);

      console.log("Adding initial liquidity, swapping and locking");
      const tx = await factory.addLiquidityLockSwap(
        amountIn,
        false,
        tokenName,
        tokenSymbol,
        tokenSupply,
        {
          value: amountIn + liquidityAmount + launchPrice,
          gasLimit: 9000000,
        }
      );

      const receipt = await tx.wait();

      //await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay

      const tokenLaunchedEvent = await getLatestEvent(factory, "TokenLaunched");

      const [poolAddress, tokenAddress, tokenId, lockID] =
        tokenLaunchedEvent.args;
      console.log("Pool Address:", poolAddress);
      console.log("Token Address:", tokenAddress);
      console.log("Token ID:", tokenId);
      console.log("Lock ID:", lockID);

      const { data, error } = await supabase
        .from("tokens")
        .insert([
          {
            name: tokenName,
            symbol: tokenSymbol,
            supply: tokenSupply,
            address: tokenAddress,
            imageUrl: "fhjddfnjsdjf",
            deployer: signer,
            timestamp: new Date().toISOString(),
            chain: "sepolia",
            pool: poolAddress,
          },
        ])
        .select("user_id"); // Return the user_id from the inserted row

      if (error) {
        console.error("Error storing encrypted wallet:", error);
        return null;
      }

      /* if (tokenInsertError) {
        console.error("Error inserting token to database:", tokenInsertError);
        setErrorMessage(
          "Token launch succeeded, but saving to database failed."
        );
      } else {
        console.log("Token saved to database:", data);
        alert("Token launch and database entry succeeded!");
      } */
    } catch (error) {
      console.error("Error launching token:", error);
      setErrorMessage("Error launching token. Please try again.");
    }

    setLoading(false);
  };

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

  return (
    <div className="settings">
      <WalletRestorer username={username} />
      <p className="display-wallet">
        Connected: {wallet?.address || "No wallet connected"}
      </p>
      <div className="launch">
        <h2>Token Launch</h2>
        <p className="title">Borrow initial LP and launch your token</p>

        <div className="launch-form">
          <label>
            Token Name:
            <input
              type="text"
              placeholder="Enter token name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
          </label>
          <label>
            Token Symbol:
            <input
              type="text"
              placeholder="Enter token symbol"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
            />
          </label>
          <label>
            Total Supply:
            <input
              type="number"
              placeholder="Enter total supply"
              value={tokenSupply}
              onChange={(e) => setTokenSupply(Number(e.target.value))}
            />
          </label>
          <label>
            Buy Amount:
            <input
              type="number"
              placeholder="Enter buy amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(Number(e.target.value))}
            />
          </label>
          <button
            className="launch-button"
            onClick={handleLaunchToken}
            disabled={loading}
          >
            {loading ? "Launching Token..." : "Create Token"}
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
        <div className="network-selector">
          <label>
            Select Network:
            <select
              value={selectedNetwork.chainId}
              onChange={handleNetworkChange}
            >
              {networkOptions.map((option) => (
                <option key={option.chainId} value={option.chainId}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Launch;
