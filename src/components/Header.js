// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import VortexConnect from "./VortexConnect"; // Import VortexConnect

const Header = ({ onWalletConnect }) => {
  return (
    <header>
      <div className="header-content">
        <div className="div-logo">
          <Link to="https://vortexdapp.com">
            <img
              src="https://i.imgur.com/XDHnW0R.png"
              alt="VortexLogo png"
              className="logo"
            />
          </Link>
        </div>
        <div className="div-burger">
          <button className="burger-menu">&#9776;</button>
          <nav className="menu">
            <Link to="/">Home</Link>
            <Link to="/factory">Launch</Link>
            <Link to="/staking">Stake</Link>
            <Link to="/tokens">Trade</Link>
            <a
              href="https://docs.vortexdapp.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </nav>
        </div>

        {/* Render VortexConnect here instead of custom connect button */}
        <div className="div-button">
          <VortexConnect onConnect={onWalletConnect} />
        </div>
      </div>
    </header>
  );
};

export default Header;
