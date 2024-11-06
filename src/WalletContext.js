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

  const setExistingWallet = (privateKey) => {
    const existingWallet = new ethers.Wallet(privateKey);
    setWallet({
      address: existingWallet.address,
      privateKey: existingWallet.privateKey,
      // Do not set mnemonic here since it does not exist for an existing wallet
    });
  };

  const disconnectWallet = () => setWallet(null);

  return (
    <WalletContext.Provider
      value={{ wallet, createWallet, setExistingWallet, disconnectWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
};
