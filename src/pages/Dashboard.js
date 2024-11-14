// src/pages/Dashboard.js

import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json"; // Adjust the path as necessary
import { Link, useParams } from "react-router-dom";
import "./Dashboard.css";
import Header from "../components/Header.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";

/* global BigInt */

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // BASE (replace with the correct Chain ID for Base)
    factoryAddress: "0xF686e6CAF7d823E4130339E6f2b02C37836fE90F",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: process.env.REACT_APP_FACTORY_SEPOLIA_CA,
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },
  // Add other networks as needed
};

function DashboardPage() {
  const { contractAddress } = useParams(); // Get the contract address from the URL
  const [tokenDetails, setTokenDetails] = useState({
    name: "",
    symbol: "",
    supply: "",
    imageUrl: "",
  });

  // Use VortexConnectContext
  const {
    address: connectedWallet,
    chainId,
    isConnected,
    connectMetaMask: connect,
    disconnectWallet: disconnect,
  } = useContext(VortexConnectContext);

  const [deployedPoolAddress, setDeployedPoolAddress] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [tokenAmountToBuy, setTokenAmountToBuy] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const WETH_ChainAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";
  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://etherscan.io";

  // Effect to log and set factory address only when chainId changes
  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      console.log("WETH Address initialized:", WETH_ChainAddress);
      setIsInitialized(true); // Prevent further initialization logs
    }
  }, [chainId, isInitialized, factoryChainAddress, WETH_ChainAddress]);

  useEffect(() => {
    fetchTokenDetails();
  }, [contractAddress, isConnected]);

  // New useEffect to save pool address when it's set
  useEffect(() => {
    if (deployedPoolAddress) {
      savePoolAddressToSupabase();
    }
  }, [deployedPoolAddress]);

  async function connectWallet() {
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  async function fetchTokenDetails() {
    if (!contractAddress) return;

    try {
      // Fetch token details from Supabase, including the pool address
      const { data, error } = await supabase
        .from("tokens")
        .select("name, symbol, supply, imageUrl, pool")
        .eq("address", contractAddress)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTokenDetails({
          name: data.name,
          symbol: data.symbol,
          supply: data.supply.toString(),
          imageUrl: data.imageUrl,
        });

        // Set the pool address from Supabase if it exists
        if (data.pool) {
          setDeployedPoolAddress(data.pool);
        }
      }
    } catch (error) {
      console.error("Error fetching token details from Supabase:", error);
      setErrorMessage("Failed to fetch token details. Please try again.");
    }
  }

  async function savePoolAddressToSupabase() {
    if (!deployedPoolAddress || !contractAddress) return;

    try {
      const { data, error } = await supabase
        .from("tokens")
        .update({ pool: deployedPoolAddress })
        .eq("address", contractAddress);

      if (error) {
        throw error;
      }

      console.log("Pool address saved to Supabase:", deployedPoolAddress);
    } catch (error) {
      console.error("Error saving pool address to Supabase:", error);
    }
  }

  async function handleMulticall() {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Add validation for empty/invalid input, but allow zero
      if (tokenAmountToBuy === "" || tokenAmountToBuy === undefined) {
        setErrorMessage("Please enter a valid amount (0 or greater)");
        setIsLoading(false);
        return;
      }

      const swapAmountValue = parseFloat(tokenAmountToBuy);
      if (isNaN(swapAmountValue) || swapAmountValue < 0) {
        setErrorMessage("Please enter a valid number (0 or greater)");
        setIsLoading(false);
        return;
      }

      const swapAmount = ethers.parseUnits(swapAmountValue.toString(), 18);

      // Setup for adding liquidity
      const tokenAmount = ethers.parseUnits(tokenDetails.supply, 18);
      const wethAmount = ethers.parseUnits("0.03", 18); // Example amount of WETH

      // Create provider and signer using window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      // Call the addLiquidityLockSwap function
      const txAddLiquidity = await factoryContract.addLiquidityLockSwap(
        contractAddress,
        swapAmount,
        { value: swapAmount, gasLimit: 9000000 }
      );

      // Log the transaction hash
      console.log("Transaction Hash:", txAddLiquidity.hash);
      setTxHash(txAddLiquidity.hash);

      setSuccessMessage(
        `Your token is now live on the blockchain. Trade it anywhere.`
      );

      // Wait for the transaction to be confirmed
      const receipt = await txAddLiquidity.wait();
      console.log("Liquidity added and locked!");

      // Extract the pool address from the transaction receipt
      let poolAddress = "";

      for (const log of receipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog.name === "PoolCreated") {
            poolAddress = parsedLog.args.poolAddress; // Adjust based on your event's argument names
            console.log("Pool Address:", poolAddress);

            // Set the pool address in state
            setDeployedPoolAddress(poolAddress);

            // Save the pool address to Supabase
            await savePoolAddressToSupabase();
            break;
          }
        } catch (error) {
          // Ignore logs that can't be parsed
        }
      }

      if (!poolAddress) {
        console.error("Pool address not found in transaction events.");
        setErrorMessage("Failed to retrieve pool address.");
      }
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        setErrorMessage("Transaction failed: User rejected transaction.");
      } else {
        console.error(error);
        setErrorMessage("Transaction failed, please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Header
        connectWallet={connect}
        isConnected={isConnected}
        chainId={chainId}
      />

      <h1 className="titlefactory">Get Initial LP for your token</h1>
      <h3 className="subtitlefactory">
        Click to launch your token with initial liquidity
      </h3>

      <div className="center-container">
        <div className="factory-container">
          <div className="token-info">
            {tokenDetails.imageUrl && (
              <img
                src={tokenDetails.imageUrl}
                alt={tokenDetails.name}
                className="token-image"
              />
            )}
            <h5 className="your-token">Your token:</h5>
            <p>Token Symbol: {tokenDetails.symbol}</p>
            <p>Total Supply: {tokenDetails.supply}</p>
            <p>
              Contract Address:{" "}
              <a
                href={`${explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="a"
              >
                {contractAddress}
              </a>
            </p>

            <div className="swap-container">
              <label htmlFor="tokenAmount">Enter amount in ETH to buy:</label>
              <input
                id="tokenAmount"
                type="number"
                step="0.01"
                value={tokenAmountToBuy}
                onChange={(e) => {
                  let value = e.target.value.replace(/,/g, "."); // Standardize input
                  if (value === "" || value.match(/^\d*\.?\d*$/)) {
                    setTokenAmountToBuy(value);
                  }
                }}
                onBlur={(e) => {
                  let value = e.target.value
                    ? parseFloat(e.target.value).toFixed(4)
                    : "0.0000";
                  if (parseFloat(value) > 0.0015) {
                    value = "0.0015"; // Set to max value if it exceeds the limit
                  }
                  setTokenAmountToBuy(value);
                }}
                placeholder="Token amount"
                min="0.00"
                max="0.01"
              />
            </div>
          </div>
          {!successMessage && (
            <button
              onClick={handleMulticall}
              className="deploy-button"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Launch Token"}
            </button>
          )}
          {successMessage && (
            <div>
              <div className="success-message2">{successMessage}</div>
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="a"
              >
                <span>Check transaction</span>
              </a>
            </div>
          )}

          {successMessage && (
            <Link to={`/token/${contractAddress}`}>
              <button className="deploy-button">Next</button>
            </Link>
          )}
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
