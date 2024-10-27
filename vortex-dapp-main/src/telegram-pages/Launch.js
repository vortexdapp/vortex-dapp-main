import { ethers } from "ethers";
import React, { useState, useEffect } from "react";
import { useWallet } from "../WalletContext"; // Access the user's wallet from context
import { restoreWalletIfNeeded } from "../WalletManager"; // Import wallet restoration logic
import "./Launch.css";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";
import WalletRestorer from "../telegram-components/WalletRestorer"; // Import WalletRestorer

// Your ABI (replace with the actual ABI of the factory and locker contracts)
import factoryABI from "../abis/FactoryABI.json";
import lockerABI from "../abis/LockerABI.json";

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

const Launch = () => {
  const { wallet, setExistingWallet } = useWallet(); // Use the connected wallet from WalletContext
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);

  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;
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

  // Function to deploy the token and add liquidity
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
      // Connect to the factory and locker contracts using ABI and addresses
      const factoryAddress = "0xadF0A9557991188E1B642e38F8d0210801E19B41"; // Replace with your factory contract address
      const lockerAddress = "0x002cbBDcca63eF5DeF050570E7e0b892EDB4617A"; // Replace with your locker contract address

      const factory = new ethers.Contract(factoryAddress, factoryABI, signer);
      const locker = new ethers.Contract(lockerAddress, lockerABI, signer);

      // Define necessary amounts
      const amountIn = ethers.parseUnits("0.0000000", 18); // ETH amount
      const liquidityAmount = ethers.parseUnits("0.0000012", 18); // Liquidity amount
      const launchPrice = ethers.parseUnits("0.00002", 18); // Launch price

      // Call the deployToken function of the factory contract
      const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply);
      await tx.wait();
      console.log("Token deployed successfully!");

      // Get the deployed token address from the TokenDeployed event
      const tokenDeployedEvent = await factory.queryFilter("TokenDeployed");
      const tokenAddress =
        tokenDeployedEvent[tokenDeployedEvent.length - 1].args[0]; // Get the token address
      console.log("Token Address: ", tokenAddress);

      // Add liquidity, swap, and lock liquidity
      console.log("Adding initial liquidity, swapping and locking");
      const txtest = await factory.addLiquidityLockSwap(
        tokenAddress,
        amountIn,
        false,
        {
          value: amountIn + liquidityAmount + launchPrice, // ETH value
          gasLimit: 9000000, // Adjust gas limit based on contract complexity
        }
      );
      await txtest.wait();
      console.log("Success!");
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
      <WalletRestorer username={username} /> {/* Add the wallet restorer */}
      <p className="display-wallet">
        Connected: {wallet?.address || "No wallet connected"}
      </p>
      <div className="launch">
        <h2>Token Launch</h2>
        <p className="title">Borrow initial LP and launch your token</p>

        {/* Token Launch Form */}
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
