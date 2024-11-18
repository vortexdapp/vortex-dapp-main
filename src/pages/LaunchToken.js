// src/pages/LaunchToken.js

import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import "./LaunchToken.css";
import { Link } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";
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

const networkConfig = {
  8453: {
    factoryAddress: "0x447D107F1D3D984B13603c3cF44f7BcD75aaB5eD",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    factoryAddress: process.env.REACT_APP_FACTORY_SEPOLIA_CA,
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },
  // Add other networks as needed
};

const CHAIN_NAMES = {
  56: "BSC",
  42161: "Arbitrum",
  8453: "Base",
  11155111: "Sepolia",
  10: "Optimism",
  42220: "Celo",
};

const IMGUR_API_URL = "https://api.imgur.com/3/image";
const CLIENT_ID = "7bd162baabe49a2";

const uploadImageToImgur = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(IMGUR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${CLIENT_ID}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      console.log("Image uploaded to Imgur:", data.data.link);
      return data.data.link;
    } else {
      throw new Error("Failed to upload image to Imgur");
    }
  } catch (error) {
    console.error("Error uploading image to Imgur:", error);
    return null;
  }
};

function LaunchToken() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenImage, setTokenImage] = useState(null);
  const [tokenImageUrl, setTokenImageUrl] = useState(null);
  const [deployedContractAddress, setDeployedContractAddress] = useState("");
  const [poolAddress, setPoolAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [amountToBuy, setAmountToBuy] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showLiquidity, setShowLiquidity] = useState(false);
  const [liquidityAmount, setLiquidityAmount] = useState(0);

  // Use VortexConnectContext
  const {
    address: connectedWallet,
    chainId,
    isConnected,
    connectMetaMask: connect,
    disconnectWallet: disconnect,
  } = useContext(VortexConnectContext);

  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://eth.blockscout.com/";
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const wethAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";

  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      setIsInitialized(true);
    }
  }, [chainId, isInitialized, factoryChainAddress]);

  const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;

  // Function to deploy token and add liquidity in one transaction
  async function deployTokenAndAddLiquidity(e) {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet before trying to deploy a token.");
      return;
    }

    // Input validations
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      setError("Please fill in all the required fields.");
      return;
    }

    if (!amountToBuy || isNaN(amountToBuy) || parseFloat(amountToBuy) < 0) {
      setError("Please enter a valid amount of ETH to buy tokens.");
      return;
    }

    setIsLoading(true);
    setError(""); // Clear any existing error at the start

    let imageUrl = null;
    if (tokenImage) {
      imageUrl = await uploadImageToImgur(tokenImage);
      if (!imageUrl) {
        setError("Failed to upload image, proceeding without it.");
      } else {
        setTokenImageUrl(imageUrl);
      }
    }

    try {
      const factoryAddress = factoryChainAddress; // Use the factory address from networkConfig
      const lockerAddress = "0xaD1d41a47b0Faf28cba5FA0291A85df6eB1561e5"; // Replace with your locker contract address

      // Initialize provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryAddress,
        factoryABI,
        signer
      );
      const locker = new ethers.Contract(lockerAddress, lockerABI, signer);

      // Convert amounts to BigInt
      const amountIn = ethers.parseUnits(amountToBuy, 18); // amountIn from user input
      const liquidityAmount = ethers.parseUnits("0.00001", 18);
      const launchPrice = ethers.parseUnits("0.00002", 18);

      const totalValue = amountIn + liquidityAmount + launchPrice;

      // Call addLiquidityLockSwap in one transaction
      console.log("Adding initial liquidity, swapping and locking");
      const addLiquidityTx = await factoryContract.addLiquidityLockSwap(
        amountIn,
        false, // Adjust as needed for liquidity lock
        tokenName,
        tokenSymbol,
        tokenSupply,
        {
          value: totalValue,
          gasLimit: 9000000,
        }
      );

      const receipt = await addLiquidityTx.wait();

      console.log("Add Liquidity Transaction Sent:", addLiquidityTx.hash);
      setTxHash(addLiquidityTx.hash);

      const addLiquidityReceipt = await addLiquidityTx.wait();
      console.log("Add Liquidity Transaction Confirmed:", addLiquidityReceipt);

      // Parse events to get tokenAddress and poolAddress
      let tokenAddress = null;
      for (const log of addLiquidityReceipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog.name === "TokenDeployed") {
            tokenAddress = parsedLog.args.tokenAddress;
            console.log("Token Deployed at:", tokenAddress);
          }
        } catch (error) {
          // Ignore logs that can't be parsed
        }
      }

      if (!tokenAddress) {
        throw new Error("Token address not found in transaction logs.");
      }

      const tokenLaunchedEvent = await getLatestEvent(
        factoryContract,
        "TokenLaunched"
      );

      const poolAddress = tokenLaunchedEvent.args[0];
      const token_Address = tokenLaunchedEvent.args[1];
      const tokenId = parseInt(tokenLaunchedEvent.args[2], 10);
      const lockID = parseInt(tokenLaunchedEvent.args[3], 10);
      console.log("Pool Address: ", poolAddress);
      console.log("Token Address: ", token_Address);
      console.log("tokenId: ", tokenId);
      console.log("lockID: ", lockID);

      setDeployedContractAddress(tokenAddress);

      // Insert token details into the tokens table
      const { error: tokenInsertError } = await supabase.from("tokens").insert([
        {
          name: tokenName,
          symbol: tokenSymbol,
          supply: tokenSupply,
          address: tokenAddress,
          imageUrl: imageUrl,
          deployer: connectedWallet,
          timestamp: new Date().toISOString(),
          chain: chainName,
          pool: poolAddress,
          token_id:tokenId,
          lock_id:lockID,
        },
      ]);

      if (tokenInsertError) {
        throw tokenInsertError;
      }

      // Increment the points for the user in the usersweb table
      const { data: userData, error: fetchError } = await supabase
        .from("usersweb")
        .select("points")
        .eq("wallet", connectedWallet)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user points:", fetchError);
      } else {
        const currentPoints = userData ? userData.points : 0;

        // Update the points by adding 1
        const { error: updateError } = await supabase
          .from("usersweb")
          .update({ points: currentPoints + 1 })
          .eq("wallet", connectedWallet);

        if (updateError) {
          throw updateError;
        }
      }

     
      setPoolAddress(poolAddress);

      
      // Success Message
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error during deployment and liquidity addition:", err);
      // Check for user denial error
      if (err.message.includes("User denied transaction signature")) {
        setError("You rejected the transaction.");
      } else {
        setError(
          err.message ||
            "There was an error with the transaction. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Header
        connectWallet={connect}
        disconnectWallet={disconnect}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div>
        <h1 className="titlelaunch">Launch your new token</h1>
        <h3 className="subtitlefactory">
          Vortex provides liquidity to launch tokens, directly on
          Uniswap.
        </h3>
      </div>
      <div className="center-container">
        <div className="factory-container">
          
          <form onSubmit={deployTokenAndAddLiquidity} className="token-form">
            {/* Image Upload */}
            <div className="custom-file-input">
              {tokenImage ? null : <span>Add image here</span>}
              <input
                type="file"
                id="tokenImage"
                accept="image/*"
                onChange={(e) => setTokenImage(e.target.files[0])}
                className="input"
              />
              {tokenImage && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <img
                    src={URL.createObjectURL(tokenImage)}
                    alt="Token Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Input Fields in Two Columns */}
            <div className="input-container">
              {/* Token Name */}
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="Token Name"
                className="input"
                required
              />
              
              {/* Token Symbol */}
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                placeholder="Ticker"
                className="input"
                required
              />
              
              {/* Token Supply */}
              <input
                type="number"
                value={tokenSupply}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive integers
                  if (/^\d*$/.test(value)) {
                    setTokenSupply(value);
                  }
                }}
                placeholder="Total Supply"
                className="input"
                required
                min="1"
              />
              
              {/* Amount to Buy ETH */}
              <input
                type="number"
                step="0.0000001"
                value={amountToBuy}
                onChange={(e) => setAmountToBuy(e.target.value)}
                placeholder="Buy Tokens (ETH)"
                className="input"
                required
                min="0"
              />
            </div>

            {/* Clickable Box for Adding Liquidity */}
            <div
              onClick={() => setShowLiquidity(!showLiquidity)} // Toggle visibility
              className="liquidity-toggle" // Add a class for the clickable box
            >
              {showLiquidity ? "Hide Liquidity Options" : "Would you like to add your own liquidity?"}
            </div>

            {/* Liquidity Section */}
            {showLiquidity && (
              <div className="liquidity-section"> {/* Add a class for the liquidity section */}
                <label className="liquidity-label">Select Liquidity Amount: {liquidityAmount} ETH</label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.1"
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(e.target.value)}
                  className="liquidity-slider" // Add a class for the slider
                />
              </div>
            )}

            {/* Submit Button */}
            {!deployedContractAddress && (
              <button
                type="submit"
                className="deploy-button"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Launch Token"}
              </button>
            )}
          </form>

          {/* Display Errors */}
          {error && <p className="error-message">{error}</p>}

          {/* Display Success Messages */}
          {deployedContractAddress && (
            <>
              <p className="token_address_message">
                Your new token address is:{" "}
                <a
                  href={`${explorerUrl}/address/${deployedContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {deployedContractAddress}
                </a>
              </p>

              {poolAddress && (
                <p className="pool_address_message">
                  Your liquidity pool address is:{" "}
                  <a
                    href={`${explorerUrl}/address/${poolAddress}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {poolAddress}
                  </a>
                </p>
              )}

              <Link to={`/dashboard/${deployedContractAddress}`}>
                <button className="deploy-button">Next Step</button>
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LaunchToken;
