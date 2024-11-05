// telegram-web-app/src/Web3ModalContext.js
import React, { createContext, useContext } from "react";
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

// Set up the context
const Web3ModalContext = createContext(null);

// Define configuration for Web3Modal
const metadata = {
  name: "Vortex Dapp",
  description: "A dapp to create ERC20 tokens and get initial LP.",
  url: "https://vortexdapp.com",
  icons: ["https://vortexdapp.com/favicon.ico"],
};

const ethersConfig = defaultConfig({
  metadata,
  projectId:
    process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || "default_project_id",
  enableInjected: true,
  chains: [
    {
      chainId: 8453, // Base Chain ID
      rpcUrl:
        process.env.REACT_APP_BASE_RPC_URL || "https://fallback.base.rpc.url",
    },
    {
      chainId: 11155111, // Sepolia Chain ID
      rpcUrl:
        process.env.REACT_APP_SEPOLIA_RPC_URL ||
        "https://fallback.sepolia.rpc.url",
    },
  ],
});

// Create Web3Modal instance
const web3Modal = createWeb3Modal({ config: ethersConfig });

export const Web3ModalProvider = ({ children }) => (
  <Web3ModalContext.Provider value={web3Modal}>
    {children}
  </Web3ModalContext.Provider>
);

export const useWeb3ModalContext = () => useContext(Web3ModalContext);
