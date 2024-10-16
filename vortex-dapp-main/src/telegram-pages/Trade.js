// telegram-web-app/src/telegram-pages/Trade.js
import React, { useState, useEffect } from "react";
import "./Launch.css";
import coinIcon from "../assets/coin.png";
import gemIcon from "../assets/gem.png";
import walletIcon from "../assets/wallet.png";
import { Link, useNavigate } from "react-router-dom";
import "./Trade.css";
import Header from "../telegram-components/Header";
import Footer from "../telegram-components/Footer";

const Trade = ({ tokenList }) => {
  const navigate = useNavigate();
  const [coinBalance, setCoinBalance] = useState(1000);
  const [gemBalance, setGemBalance] = useState(250);
  const [level, setLevel] = useState(1);
  const levelUpThreshold = 1000;
  const totalPoints = coinBalance + gemBalance;
  const progress = ((totalPoints % levelUpThreshold) / levelUpThreshold) * 100;

  useEffect(() => {
    // Enable scrolling when the Trade page is mounted
    document.body.style.overflow = "auto";

    // Disable scrolling when the component is unmounted
    return () => {
      document.body.style.overflow = "hidden";
    };
  }, []);

  const handleTradeClick = (token) => {
    navigate(`/token/${token.symbol}`);
  };

  return (
    <div className="settings">
      <Header coinBalance={coinBalance} gemBalance={gemBalance} level={level} />

      <div className="trade-page">
        <h2>Available Tokens</h2>
        <div className="token-list">
          {tokenList.map((token) => (
            <div className="token-box" key={token.address}>
              <h3>{token.name}</h3>
              <p>{token.symbol}</p>
              <button
                className="trade-button"
                onClick={() => handleTradeClick(token)}
              >
                Trade
              </button>
            </div>
          ))}
        </div>
      </div>
      {/* Footer Menu */}
      <Footer />
    </div>
  );
};

export default Trade;
