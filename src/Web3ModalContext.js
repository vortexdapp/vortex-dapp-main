import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";

const Web3ModalContext = createContext(null);

export const Web3ModalProvider = ({ children }) => {
  const [web3Modal, setWeb3Modal] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const accountData = useWeb3ModalAccount();

  useEffect(() => {
    if (!web3Modal && !isInitialized) {
      const metadata = {
        name: "Vortex Dapp",
        description: "An EVM liquidity lender and token launcher",
        url: "https://vortexdapp.com",
        icons: ["https://vortexdapp.com/favicon.ico"],
      };

      const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

      if (!projectId) {
        console.error('WalletConnect Project ID is not defined in environment variables');
        return;
      }

      const ethersConfig = defaultConfig({
        metadata,
        enableEIP6963: true,
        enableInjected: true,
        enableCoinbase: true,
        rpcUrl: process.env.BASE_RPC_URL,
        defaultChainId: 8453,
        auth: {
          email: true,
          socials: ["google", "x", "github", "discord", "apple", "facebook"],
          showWallets: true,
          walletFeatures: true,
        },
      });

      const chains = [
        {
          chainId: 11155111,
          name: "Sepolia",
          currency: "ETH",
          explorerUrl: "https://eth-sepolia.blockscout.com",
          rpcUrl: process.env.SEPOLIA_RPC_URL,
        },
        {
          chainId: 8453,
          name: "Base",
          currency: "ETH",
          explorerUrl: "https://base.blockscout.com/",
          rpcUrl: process.env.BASE_RPC_URL,
        },
        {
          chainId: 56,
          name: "BSC",
          currency: "BNB",
          explorerUrl: "https://bscscan.com",
          rpcUrl: process.env.BSC_RPC_URL,
        },
        {
          chainId: 42161,
          name: "Arbitrum",
          currency: "ETH",
          explorerUrl: "https://arbitrum.blockscout.com/",
          rpcUrl: process.env.ARBITRUM_RPC_URL,
        },
        {
          chainId: 10,
          name: "Optimism",
          currency: "ETH",
          explorerUrl: "https://optimism.blockscout.com/",
          rpcUrl: process.env.OPTIMISM_RPC_URL,
        },
        {
          chainId: 42220,
          name: "Celo",
          currency: "CELO",
          explorerUrl: "https://explorer.celo.org/mainnet/",
          rpcUrl: process.env.CELO_RPC_URL,
        },
      ];

      const initWeb3Modal = createWeb3Modal({
        ethersConfig,
        chains,
        projectId,
        enableAnalytics: true,
        explorerExcludedWalletIds: [
          "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
        ],
      });

      setWeb3Modal(initWeb3Modal);
      setIsInitialized(true);
    }
  }, [web3Modal, isInitialized]);

  return (
    <Web3ModalContext.Provider value={{ web3Modal, ...accountData }}>
      {children}
    </Web3ModalContext.Provider>
  );
};

export const useCustomWeb3Modal = () => {
  const context = useContext(Web3ModalContext);
  if (!context) {
    throw new Error('useCustomWeb3Modal must be used within a Web3ModalProvider');
  }
  return context;
};
