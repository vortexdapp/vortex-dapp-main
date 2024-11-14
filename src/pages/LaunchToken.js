// src/pages/LaunchToken.js

import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import "./LaunchToken.css";
import { Link } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";

const networkConfig = {
  8453: {
    factoryAddress: "0xF686e6CAF7d823E4130339E6f2b02C37836fE90F",
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

// Example values for launch price and liquidity amount
const launchPriced = 0.0001;
const liquidityAmountt = 0.0000012;

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

  // Use VortexConnectContext
  const {
    address: connectedWallet,
    chainId,
    isConnected,
    connectMetaMask: connect,
    disconnectWallet: disconnect,
  } = useContext(VortexConnectContext);

  const explorerUrl = networkConfig[chainId]?.explorerUrl || "https://eth.blockscout.com/";
  const factoryChainAddress = networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const wethAddress = networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";

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

    if (!amountToBuy) {
      setError("Please enter the amount of ETH to buy tokens.");
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
      // Initialize provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      // Convert amounts to BigInt
      const swapAmount = ethers.parseUnits(amountToBuy.toString(), 18); // amountIn
      const liquidityAmount = ethers.parseUnits("0.0000012", 18);
      const launchPrice = ethers.parseUnits("0.00002", 18);

      const totalValue = swapAmount + liquidityAmount + launchPrice;

      // Call addLiquidityLockSwap in one transaction
      const addLiquidityTx = await factoryContract.addLiquidityLockSwap(
        swapAmount,
        false, // Adjust as needed for liquidity lock
        tokenName,
        tokenSymbol,
        tokenSupply,
        {
          value: totalValue,
          gasLimit: 9000000,
        }
      );

      console.log("Add Liquidity Transaction Sent:", addLiquidityTx.hash);
      setTxHash(addLiquidityTx.hash);
      const addLiquidityReceipt = await addLiquidityTx.wait();
      console.log("Add Liquidity Transaction Confirmed:", addLiquidityReceipt);

      // Parse events to get tokenAddress and poolAddress
      let tokenAddress = null;
      let createdPoolAddress = null;
      for (const log of addLiquidityReceipt.logs) {
        try {
          const parsedLog = factoryContract.interface.parseLog(log);
          if (parsedLog.name === "TokenDeployed") {
            tokenAddress = parsedLog.args.tokenAddress;
            console.log("Token Deployed at:", tokenAddress);
          } else if (parsedLog.name === "PoolCreated") {
            createdPoolAddress = parsedLog.args.poolAddress;
            console.log("Pool Created at:", createdPoolAddress);
          }
        } catch (error) {
          // Ignore logs that can't be parsed
        }
      }

      if (!tokenAddress) {
        throw new Error("Token address not found in transaction logs.");
      }

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
          pool: null,
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

      if (!createdPoolAddress) {
        throw new Error("Pool address not found in transaction logs.");
      }

      setPoolAddress(createdPoolAddress);

      // Update the pool address in Supabase
      const { error: poolUpdateError } = await supabase
        .from("tokens")
        .update({ pool: createdPoolAddress })
        .eq("address", tokenAddress);

      if (poolUpdateError) {
        throw poolUpdateError;
      }

      // Success Message
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error during deployment and liquidity addition:", err);
      // Check for user denial error
      if (err.message.includes("User denied transaction signature")) {
        setError("You rejected the transaction.");
      } else {
        setError(err.message || "There was an error with the transaction. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Header connectWallet={connect} isConnected={isConnected} chainId={chainId} />
      <div>
        <h1 className="titlefactory">Launch your new ERC20 token</h1>
        <h3 className="subtitlefactory">
          Vortex provides liquidity lending to launch tokens, directly on Uniswap.
        </h3>
      </div>
      <div className="center-container">
        <div className="factory-container">
          <h2 className="createerc">Create Your New Token</h2>
          <form onSubmit={deployTokenAndAddLiquidity} className="token-form">
            {/* Image Upload */}
            <div className="custom-file-input">
              <span>Add image here</span>
              <input
                type="file"
                id="tokenImage"
                accept="image/*"
                onChange={(e) => setTokenImage(e.target.files[0])}
                className="input"
              />
              {tokenImage && (
                <div>
                  <img
                    src={URL.createObjectURL(tokenImage)}
                    alt="Token Preview"
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                </div>
              )}
            </div>

            {/* Token Name */}
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token Name"
              className="input"
              required
            />
            <br />

            {/* Token Symbol */}
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="Token Symbol"
              className="input"
              required
            />
            <br />

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
            <br />

            {/* Amount to Buy ETH */}
            <input
              type="number"
              step="0.0001"
              value={amountToBuy}
              onChange={(e) => setAmountToBuy(e.target.value)}
              placeholder="Buy Tokens (ETH)"
              className="input"
              required
              min={launchPriced}
              max={liquidityAmountt * 0.05 + launchPriced}
            />
            <br />

            {/* Submit Button */}
            {!deployedContractAddress && (
              <button type="submit" className="deploy-button" disabled={isLoading}>
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
                    href={`${networkConfig[chainId]?.explorerUrl}/address/${poolAddress}`}
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
