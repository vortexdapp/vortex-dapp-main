// src/pages/TokenManagement.js

import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { supabase } from "../supabaseClient";
import { VortexConnectContext } from "../VortexConnectContext";
import { ethers } from "ethers"; // Import ethers.js
import factoryABI from "../abis/FactoryABI.json"; // Import your Factory ABI
import "./TokenManagement.css"; // Import CSS for styling

const networkConfig = {
  8453: {
    factoryAddress: "0x447D107F1D3D984B13603c3cF44f7BcD75aaB5eD",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    factoryAddress: "0xbBE1Dc6148D1a43347Cf02612Ed1C6519146A8E9",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },
  // Add other networks as needed
};

const TokenManagement = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const { address, isConnected, chainId } = useContext(VortexConnectContext);

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  const [liquidityRemoved, setLiquidityRemoved] = useState(false);

  useEffect(() => {
    // Redirect to home if not connected
    if (!isConnected) {
      navigate("/");
      return;
    }

    const fetchTokenData = async () => {
      try {
        const { data, error } = await supabase
          .from("tokens")
          .select("address, name, timestamp, chain, liquidity_amount, lock_id, token_id, deployer")
          .eq("address", tokenAddress)
          .single();

        if (error) {
          console.error("Error fetching token data:", error);
          setError("Failed to fetch token data.");
          setLoading(false);
          return;
        }

        if (data.deployer.toLowerCase() !== address.toLowerCase()) {
          setAccessDenied(true);
        } else {
          setTokenData(data);
        }

        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching token data:", err);
        setError("An unexpected error occurred.");
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [isConnected, address, tokenAddress, navigate]);

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleRemoveLiquidity = async () => {
    if (!tokenData) {
      setError("Token data not loaded.");
      return;
    }

    try {
      setIsRemovingLiquidity(true);
      setError("");

      // Initialize provider and signer
      if (!window.ethereum) {
        setError("MetaMask is not installed.");
        setIsRemovingLiquidity(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get factory address from networkConfig
      const factoryAddress = networkConfig[chainId]?.factoryAddress;
      if (!factoryAddress) {
        setError("Factory contract not configured for this network.");
        setIsRemovingLiquidity(false);
        return;
      }

      // Initialize factory contract
      const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);

      // Example tokenId and lockId; replace with actual values or fetch dynamically
      const tokenId = tokenData.token_id; // Replace with actual token ID
      const lockId = tokenData.lock_id; // Replace with actual lock ID

      console.log("Retrieving user provided liquidity...");

      // Call removeUserLiquidity
      const tx = await factoryContract.removeUserLiquidity(tokenId, lockId);
      console.log("Transaction sent:", tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Liquidity retrieved successfully!", receipt);

      setLiquidityRemoved(true);
      setIsRemovingLiquidity(false);
    } catch (err) {
      console.error("Error removing liquidity:", err);
      setError(err.message || "Failed to remove liquidity.");
      setIsRemovingLiquidity(false);
    }
  };

  if (!isConnected) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <p>Please connect your wallet to view this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <h1>Loading...</h1>
          <p>Please wait while we verify your access.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <h1>Access Denied</h1>
          <p>You do not have permission to manage this token.</p>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header />
        <div className="token-management-container">
          <h1>Error</h1>
          <p>{error}</p>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="token-management-container">
        <h1>Token Management</h1>
        <h2>{tokenData.name}</h2>

        <p>
          <strong>Token Address:</strong> {tokenData.address}
        </p>
        <p>
          <strong>Chain:</strong> {tokenData.chain}
        </p>
        <button
          onClick={() =>
            navigate(`/trading/${tokenData.chain}/${tokenData.address}`)
          }
          className="trade-button"
        >
          Trade it
        </button>

        {/* Manage Liquidity Section */}
        <div className="manage-liquidity-section">
          <h2>Manage Liquidity</h2>
          <button
            onClick={handleRemoveLiquidity}
            className="remove-liquidity-button"
            disabled={isRemovingLiquidity || liquidityRemoved}
          >
            {isRemovingLiquidity
              ? "Removing Liquidity..."
              : liquidityRemoved
              ? "Liquidity Removed"
              : "Remove Liquidity"}
          </button>
          {error && <p className="error-message">{error}</p>}
          {liquidityRemoved && (
            <p className="success-message">
              Liquidity removed successfully!
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Export the component
export default TokenManagement;
