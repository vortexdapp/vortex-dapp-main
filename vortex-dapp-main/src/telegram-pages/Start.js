// src/Start.js
import { ethers } from "ethers";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For redirecting to the dashboard
import { createAndStoreWallet, fetchAndDecryptWallet } from "../WalletManager";
import { useWallet } from "../WalletContext"; // Import the custom hook
import "./Start.css";

function StartPage() {
  const { wallet, createWallet, setExistingWallet } = useWallet(); // Access wallet context
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [walletCreated, setWalletCreated] = useState(false); // Tracks if a wallet was created
  const [loginMode, setLoginMode] = useState(false); // Tracks if the user is in login mode
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate(); // Hook for navigating to dashboard

  // Handles wallet creation and displaying wallet details
  const handleCreateWallet = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Create a new wallet using ethers.js from the context
      createWallet();
      setWalletCreated(true); // Show the created wallet details
    } catch (error) {
      console.error("Error creating wallet:", error);
      setErrorMessage("Unexpected error occurred while creating the wallet.");
    }

    setLoading(false);
  };

  // Handles storing the wallet with username and password
  const handleStoreWallet = async () => {
    if (!username) {
      setErrorMessage("Username is required.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const success = await createAndStoreWallet(
        username,
        wallet.privateKey,
        password
      );
      if (success) {
        localStorage.setItem("username", username);
        navigate("/dashboard"); // Redirect to dashboard upon success
      } else {
        setErrorMessage("Error storing wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error storing wallet:", error);
      setErrorMessage("Unexpected error occurred while storing the wallet.");
    }

    setLoading(false);
  };

  // Handles wallet decryption and retrieval from Supabase by username
  const handleLogin = async () => {
    if (!username) {
      setErrorMessage("Username is required.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const decryptedPrivateKey = await fetchAndDecryptWallet(
        username,
        password
      );
      if (decryptedPrivateKey) {
        console.log("Private Key:", decryptedPrivateKey);
        localStorage.setItem("username", username);
        // Automatically connect the wallet after successful login
        setExistingWallet(decryptedPrivateKey); // Set the existing wallet in context
        console.log("Connected Wallet:", wallet);

        navigate("/dashboard"); // Redirect to dashboard upon successful login
      } else {
        setErrorMessage("Invalid username, password, or wallet not found.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setErrorMessage("Unexpected error during login.");
    }

    setLoading(false);
  };

  return (
    <div className="centered-content">
      <img src="logo512.png" alt="Logo" className="logo2" />
      <h1 className="titlehome">Launch, stake, and trade</h1>
      <h4 className="subtitlehome">A gamified DeFi experience</h4>

      {!walletCreated && !loginMode && (
        <>
          <button
            className="button"
            onClick={handleCreateWallet}
            disabled={loading}
          >
            {loading ? "Creating Wallet..." : "Create Wallet"}
          </button>
          <button
            className="button"
            onClick={() => setLoginMode(true)}
            disabled={loading}
          >
            {loading ? "Preparing Login..." : "Log In"}
          </button>
        </>
      )}

      {walletCreated && wallet && (
        <>
          <p>Wallet Address: {wallet.address}</p>
          <p>Recovery Phrase: {wallet.mnemonic}</p>
          <input
            type="text"
            placeholder="Set a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Set a Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="button"
            onClick={handleStoreWallet}
            disabled={loading || !password || !username}
          >
            {loading ? "Storing Wallet..." : "Store Wallet"}
          </button>
        </>
      )}

      {loginMode && (
        <>
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="button"
            onClick={handleLogin}
            disabled={loading || !password || !username}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
          <button
            className="button"
            onClick={() => setLoginMode(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
}

export default StartPage;
