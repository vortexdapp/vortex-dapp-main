// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css"; // Ensure you create and adjust the CSS file to match your styling

const Footer = () => {
  return (
    <div className="footer-menu">
      <Link to="/dashboard" className="menu-item">
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
  );
};

export default Footer;
