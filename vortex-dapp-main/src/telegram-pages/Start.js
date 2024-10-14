// src/telegram-pages/StartPage.js
import React from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../WalletContext";
import "./Start.css";

function StartPage() {
  const { wallet, createWallet } = useWallet();

  return (
    <div className="centered-content">
      <img src="logo512.png" alt="Logo" className="logo2" />
      <h1 className="titlehome">
        Launch, stake and trade <br />
      </h1>
      <h4 className="subtitlehome">A gamified defi experience</h4>

      {!wallet ? (
        <button className="home-button" onClick={createWallet}>
          Create Wallet
        </button>
      ) : (
        <div>
          <p>Your Wallet Address: {wallet.address}</p>
          <p>
            Recovery Phrase: <em>{wallet.mnemonic}</em>
          </p>
          <Link to="/dashboard">
            <button className="home-button">Enter Dashboard</button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default StartPage;
