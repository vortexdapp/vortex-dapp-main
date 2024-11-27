import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { VortexConnectContext } from "../VortexConnectContext";
import TokensList from "../components/TokenList";

function HomePage() {
  const { address: connectedWallet, chainId, isConnected, connectMetaMask: connect, disconnectWallet: disconnect } = useContext(VortexConnectContext);
  const [error, setError] = useState("");

  return (
    <div>
      <Header connectWallet={connect} isConnected={isConnected} chainId={chainId} />

      <div className="centered-content">
        <img src="logo512.png" alt="Logo" className="logo2" />

        <h1 className="titlehome">
          Trade, launch and earn.
          <br />
        </h1>
        <h4 className="subtitlehome">
          Earn trading, launching tokens, staking and achieving milestones.
        </h4>

        {/* Buttons */}
        <div className="button-container">
          <Link to="/tokens">
            <button className="trading-button">Start Trading</button>
          </Link>
          <div>
            <Link to="/factory">
              <button className="home-button">Launch</button>
            </Link>
            <Link to="/staking">
              <button className="stake-home-button">Stake</button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <TokensList />
      </div>


      {/* Display an error message if wallet connection fails */}
      {error && <p className="error-message">{error}</p>}

      <Footer />
    </div>
  );
}

export default HomePage;
