// telegram-web-app/src/telegram-pages/Launch.js
import React from "react";
import { Link } from "react-router-dom";
import "./Launch.css";

const Launch = () => {
  return (
    <div className="settings">
      <div className="launch">
        <h2>Token Launch</h2>
        <p>Borrow initial LP and launch your token</p>

        {/* Token Launch Form */}
        <div className="launch-form">
          <label>
            Token Name:
            <input type="text" placeholder="Enter token name" />
          </label>
          <label>
            Token Symbol:
            <input type="text" placeholder="Enter token symbol" />
          </label>
          <label>
            Total Supply:
            <input type="number" placeholder="Enter total supply" />
          </label>
          <button className="launch-button">Create Token</button>
        </div>
      </div>

      {/* Footer Menu */}
      <div className="footer-menu">
        <Link to="/Dashboard" className="menu-item">
          Dashboard
        </Link>
        <Link to="/launch" className="menu-item">
          Launch
        </Link>
        <Link to="/stake" className="menu-item">
          Stake
        </Link>
        <Link to="/trade" className="menu-item">
          Trade
        </Link>
        <Link to="/airdrop" className="menu-item">
          Airdrop
        </Link>
      </div>
    </div>
  );
};

export default Launch;
