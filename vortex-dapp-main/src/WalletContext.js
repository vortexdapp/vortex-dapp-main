// src/WalletContext.js
import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);

  const createWallet = () => {
    const newWallet = ethers.Wallet.createRandom();
    setWallet({
      address: newWallet.address,
      privateKey: newWallet.privateKey,
      mnemonic: newWallet.mnemonic.phrase,
    });
  };

  const disconnectWallet = () => setWallet(null);

  return (
    <WalletContext.Provider value={{ wallet, createWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
