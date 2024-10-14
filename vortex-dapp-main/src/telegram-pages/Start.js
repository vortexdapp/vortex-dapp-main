import React from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../WalletContext"; // Ensure this path is correct
import "./Start.css"; // Ensure this path is correct

function StartPage() {
  const { wallet, createWallet } = useWallet(); // Use the wallet from the WalletContext

  const showWalletInfo = () => (
    <div>
      <p>Your Wallet Address: {wallet.address}</p>
      <p>
        Recovery Phrase: <em>{wallet.mnemonic}</em>
      </p>{" "}
      <Link to="/dashboard">
        <button className="home-button">Enter Dashboard</button>
      </Link>
    </div>
  );

  return (
    <div className="centered-content">
      <img src="logo512.png" alt="Logo" className="logo2" />

      <h1 className="titlehome">
        Launch, stake and trade <br />
      </h1>
      <h4 className="subtitlehome">A gamified defi experience</h4>

      {!wallet.address ? (
        <button className="home-button" onClick={createWallet}>
          Create Wallet
        </button>
      ) : (
        showWalletInfo()
      )}
    </div>
  );
}

export default StartPage;
