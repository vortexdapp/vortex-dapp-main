// src/WalletContext.js
import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({
    address: null,
    signer: null,
    mnemonic: "",
  });

  const createWallet = () => {
    const newWallet = ethers.Wallet.createRandom(); // Using ethers.js
    setWallet({
      address: newWallet.address,
      signer: newWallet.connect(new ethers.BrowserProvider(window.ethereum)), // connecting the wallet
      mnemonic: newWallet.mnemonic.phrase,
    });
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      signer: null,
      mnemonic: "",
    });
  };

  return (
    <WalletContext.Provider value={{ wallet, createWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
