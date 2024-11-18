// src/context/VortexConnectContext.js

import React, { useState, useEffect, createContext } from 'react';
import { ethers } from 'ethers';

const VortexConnectContext = createContext();

const VortexConnectProvider = ({ children }) => {
  const [address, setAddress] = useState(localStorage.getItem('connectedAddress') || null);
  const [isConnected, setIsConnected] = useState(!!address);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (address) {
      reconnectWallet();
    }
  }, [address]);

  // Set up event listeners once when the provider mounts
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        // Clean up listeners when the provider unmounts
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connectMetaMask = async () => {
    try {
      if (window.ethereum && window.ethereum.isMetaMask) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const network = await provider.getNetwork();

        setAddress(userAddress);
        setIsConnected(true);
        setChainId(network.chainId);
        localStorage.setItem('connectedAddress', userAddress);
      }
    } catch (err) {
      console.error("Error connecting MetaMask:", err);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAddress(accounts[0]);
      setIsConnected(true);
      localStorage.setItem('connectedAddress', accounts[0]);
    }
  };

  const handleChainChanged = (chainIdHex) => {
    const decimalChainId = parseInt(chainIdHex, 16);
    setChainId(decimalChainId);
  };

  const reconnectWallet = async () => {
    if (window.ethereum && address) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const network = await provider.getNetwork();

        setAddress(userAddress);
        setIsConnected(true);
        setChainId(network.chainId);
      } catch (err) {
        console.error("Error reconnecting wallet:", err);
        disconnectWallet();
      }
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    localStorage.removeItem('connectedAddress');
  };

  return (
    <VortexConnectContext.Provider
      value={{
        address,
        isConnected,
        chainId,
        connectMetaMask,
        disconnectWallet,
      }}
    >
      {children}
    </VortexConnectContext.Provider>
  );
};

export { VortexConnectContext, VortexConnectProvider };
