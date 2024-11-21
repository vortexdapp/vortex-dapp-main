// src/components/VortexConnect.js

import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { supabase } from "../supabaseClient"; // Import Supabase client
import "./VortexConnect.css";

import sepoliaIcon from "../assets/icons/sepolia.png";
import baseIcon from "../assets/icons/base.png";
import bscIcon from "../assets/icons/bsc.png";
import arbitrumIcon from "../assets/icons/arbitrum.png";
import optimismIcon from "../assets/icons/optimism.png";

const chains = [
  {
    chainId: 11155111,
    name: "Sepolia",
    currency: "ETH",
    explorerUrl: "https://eth-sepolia.blockscout.com",
    rpcUrl: process.env.REACT_APP_SEPOLIA_RPC_URL,
    icon: sepoliaIcon,
  },
  {
    chainId: 8453,
    name: "Base",
    currency: "ETH",
    explorerUrl: "https://base.blockscout.com/",
    rpcUrl: process.env.REACT_APP_BASE_RPC_URL,
    icon: baseIcon,
  },
  {
    chainId: 56,
    name: "BSC",
    currency: "BNB",
    explorerUrl: "https://bscscan.com",
    rpcUrl: process.env.REACT_APP_BSC_RPC_URL,
    icon: bscIcon,
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    currency: "ETH",
    explorerUrl: "https://arbitrum.blockscout.com/",
    rpcUrl: process.env.REACT_APP_ARBITRUM_RPC_URL,
    icon: arbitrumIcon,
  },
  {
    chainId: 10,
    name: "Optimism",
    currency: "ETH",
    explorerUrl: "https://optimism.blockscout.com/",
    rpcUrl: process.env.REACT_APP_OPTIMISM_RPC_URL,
    icon: optimismIcon,
  },
];

const chainNames = {
  11155111: "Sepolia",
  8453: "Base",
  56: "BSC",
  42161: "Arbitrum",
  10: "Optimism",
};

const VortexConnect = ({ onConnect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitchingChains, setIsSwitchingChains] = useState(false);
  const [address, setAddress] = useState(
    localStorage.getItem("connectedAddress") || null
  );
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInWalletBrowser, setIsInWalletBrowser] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Newly added state

  // Create a ref for the modal
  const modalRef = useRef();

  useEffect(() => {
    // Detect if the user is on a mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    if (isAndroid || isIOS) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }

    // Detect if the DApp is accessed via a wallet's in-app browser
    if (isMobile) {
      // Enhanced detection using userAgent
      const isMetaMask =
        window.ethereum?.isMetaMask || /MetaMask/i.test(userAgent);
      const isTrustWallet =
        window.ethereum?.isTrust || /TrustWallet/i.test(userAgent);
      const isPhantom = window.phantom?.ethereum || /Phantom/i.test(userAgent);
      const isCoinbase =
        window.ethereum?.isCoinbaseWallet || /CoinbaseWallet/i.test(userAgent);
      const isRabby = window.ethereum?.isRabby || /Rabby/i.test(userAgent);

      if (isMetaMask || isTrustWallet || isPhantom || isCoinbase || isRabby) {
        setIsInWalletBrowser(true);
      } else {
        setIsInWalletBrowser(false);
      }
    }

    if (address) {
      reconnectWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isMobile]);

  // Close modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setIsSwitchingChains(false);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAddress(accounts[0]);
      setIsConnected(true);
      localStorage.setItem("connectedAddress", accounts[0]);
      setError(null);
    }
  };

  const handleChainChanged = (chainIdHex) => {
    const decimalChainId = parseInt(chainIdHex, 16);
    setChainId(decimalChainId);
    setError(null);
  };

  const connectWallet = async (walletType = "MetaMask") => {
    try {
      let tempProvider;
      let walletFound = false;

      // Detect and initialize the selected wallet
      if (walletType === "MetaMask" && window.ethereum?.isMetaMask) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
        walletFound = true;
      } else if (
        walletType === "TrustWallet" &&
        (window.ethereum?.isTrust || /TrustWallet/i.test(navigator.userAgent))
      ) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
        walletFound = true;
      } else if (walletType === "Phantom" && window.phantom?.ethereum) {
        tempProvider = new ethers.BrowserProvider(window.phantom.ethereum);
        walletFound = true;
      } else if (
        walletType === "Coinbase" &&
        window.ethereum?.isCoinbaseWallet
      ) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
        walletFound = true;
      } else if (walletType === "Rabby" && window.ethereum?.isRabby) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
        walletFound = true;
      }

      if (!walletFound) {
        throw new Error(
          `${walletType} not found. Please ensure it is installed and accessible.`
        );
      }

      // Request account access
      await tempProvider.send("eth_requestAccounts", []);
      const tempSigner = await tempProvider.getSigner();
      const userAddress = await tempSigner.getAddress();
      const network = await tempProvider.getNetwork();

      // Update state
      setProvider(tempProvider);
      setAddress(userAddress);
      setIsConnected(true);
      setChainId(network.chainId);
      localStorage.setItem("connectedAddress", userAddress);
      setError(null);
      closeModal();

      if (onConnect) {
        onConnect({
          provider: tempProvider,
          signer: tempSigner,
          chainId: chainId,
        });
      }

      // Save the wallet address to Supabase
      await saveUserToSupabase(userAddress);

      // Setup event listeners directly on window.ethereum or specific wallet provider
      if (walletType !== "Phantom") {
        // Phantom might have a different event emitter
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      } else {
        window.phantom.ethereum.on("accountsChanged", handleAccountsChanged);
        window.phantom.ethereum.on("chainChanged", handleChainChanged);
      }
    } catch (err) {
      console.error(`${walletType} connection error:`, err);
      setError(
        `${walletType} connection failed. Please check your wallet setup.`
      );
    }
  };

  const saveUserToSupabase = async (userAddress) => {
    try {
      // Check if the user already exists
      const { data: existingUser, error: selectError } = await supabase
        .from("usersweb")
        .select("wallet")
        .eq("wallet", userAddress);

      if (selectError) {
        console.error(
          "Error checking existing user in Supabase:",
          selectError.message,
          selectError
        );
      } else if (existingUser && existingUser.length === 0) {
        // User does not exist, insert new record
        const { data: insertData, error: insertError } = await supabase
          .from("usersweb")
          .insert([
            {
              wallet: userAddress,
              created: new Date().toISOString(),
              points: 1,
            },
          ]);

        if (insertError) {
          console.error(
            "Error inserting user into Supabase:",
            insertError.message,
            insertError
          );
        } else {
          console.log("User saved to Supabase:", insertData);
        }
      } else {
        console.log("User already exists in Supabase");
      }
    } catch (error) {
      console.error(
        "Unexpected error during Supabase user check/insert:",
        error.message,
        error
      );
    }
  };

  const reconnectWallet = async () => {
    if (window.ethereum && address) {
      try {
        const tempProvider = new ethers.BrowserProvider(window.ethereum);
        const tempSigner = await tempProvider.getSigner();
        const userAddress = await tempSigner.getAddress();
        const network = await tempProvider.getNetwork();

        setProvider(tempProvider);
        setAddress(userAddress);
        setIsConnected(true);
        setChainId(network.chainId);
        setError(null);

        // Setup event listeners directly on window.ethereum
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      } catch (err) {
        console.error("Wallet reconnection error:", err);
        disconnectWallet();
      }
    } else if (window.phantom?.ethereum && address) {
      // Handle Phantom wallet reconnection
      try {
        const tempProvider = new ethers.BrowserProvider(
          window.phantom.ethereum
        );
        const tempSigner = await tempProvider.getSigner();
        const userAddress = await tempSigner.getAddress();
        const network = await tempProvider.getNetwork();

        setProvider(tempProvider);
        setAddress(userAddress);
        setIsConnected(true);
        setChainId(network.chainId);
        setError(null);

        // Setup event listeners directly on window.phantom.ethereum
        window.phantom.ethereum.on("accountsChanged", handleAccountsChanged);
        window.phantom.ethereum.on("chainChanged", handleChainChanged);
      } catch (err) {
        console.error("Phantom wallet reconnection error:", err);
        disconnectWallet();
      }
    }
    // Add similar blocks for other wallets if necessary
  };

  const disconnectWallet = () => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setIsConnected(false); // Update connection status
    localStorage.removeItem("connectedAddress");
    setError(null);

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    }
    if (window.phantom?.ethereum) {
      window.phantom.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      window.phantom.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    }
    // Add similar blocks for other wallets if necessary
    closeModal();
  };

  const switchChain = async (targetChain) => {
    if (!window.ethereum && !window.phantom?.ethereum) {
      setError("Ethereum provider not found.");
      return;
    }

    const hexChainId = "0x" + targetChain.chainId.toString(16);

    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexChainId }],
        });
      } else if (window.phantom?.ethereum) {
        await window.phantom.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: hexChainId }],
        });
      }
      setError(null);
      closeModal();
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          if (window.ethereum) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: hexChainId,
                  chainName: targetChain.name,
                  nativeCurrency: {
                    name: targetChain.currency,
                    symbol: targetChain.currency,
                    decimals: 18,
                  },
                  rpcUrls: [targetChain.rpcUrl],
                  blockExplorerUrls: [targetChain.explorerUrl],
                },
              ],
            });
          } else if (window.phantom?.ethereum) {
            await window.phantom.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: hexChainId,
                  chainName: targetChain.name,
                  nativeCurrency: {
                    name: targetChain.currency,
                    symbol: targetChain.currency,
                    decimals: 18,
                  },
                  rpcUrls: [targetChain.rpcUrl],
                  blockExplorerUrls: [targetChain.explorerUrl],
                },
              ],
            });
          }
          setError(null);
          closeModal();
        } catch (addError) {
          console.error("Add Chain Error:", addError);
          setError("Failed to add the network.");
        }
      } else {
        console.error("Switch Chain Error:", switchError);
        setError("Failed to switch the network.");
      }
    }
  };

  const changeWallet = async () => {
    if (window.ethereum) {
      try {
        // Request permission to change the connected account
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        // No additional logic needed as event listeners handle state updates
      } catch (error) {
        console.error("Error changing wallet:", error);
        setError("Failed to change wallet. Please try again.");
      }
    } else {
      setError("Ethereum provider not found.");
    }
  };

  const openInWalletApp = (walletType) => {
    let walletUrlScheme = "";
    let appStoreUrl = "";
    let playStoreUrl = "";

    switch (walletType) {
      case "MetaMask":
        walletUrlScheme = "metamask://";
        appStoreUrl = "https://apps.apple.com/app/metamask/id1438144202"; // iOS App Store
        playStoreUrl =
          "https://play.google.com/store/apps/details?id=io.metamask"; // Android Play Store
        break;
      case "TrustWallet":
        walletUrlScheme = "trust://";
        appStoreUrl =
          "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409";
        playStoreUrl =
          "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp";
        break;
      case "Phantom":
        walletUrlScheme = "phantom://";
        appStoreUrl = "https://apps.apple.com/app/phantom-wallet/id1438144202"; // Replace with actual iOS URL
        playStoreUrl =
          "https://play.google.com/store/apps/details?id=phantom.wallet.app"; // Replace with actual Android URL
        break;
      case "Coinbase":
        walletUrlScheme = "coinbase://";
        appStoreUrl = "https://apps.apple.com/app/coinbase-wallet/id1278383455";
        playStoreUrl =
          "https://play.google.com/store/apps/details?id=com.coinbase.wallet";
        break;
      case "Rabby":
        walletUrlScheme = "rabby://";
        appStoreUrl = "https://apps.apple.com/app/rabby-wallet/idXXXXXXX"; // Replace with actual iOS URL
        playStoreUrl =
          "https://play.google.com/store/apps/details?id=com.rabby.wallet"; // Replace with actual Android URL
        break;
      default:
        return;
    }

    // Encode the current URL
    const encodedUrl = encodeURIComponent(window.location.href);
    const deepLink = `${walletUrlScheme}wc?uri=${encodedUrl}`;

    // Attempt to open the wallet app
    window.location.href = deepLink;

    // Detect OS to set the appropriate fallback URL
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    setTimeout(() => {
      if (isIOS) {
        window.location.href = appStoreUrl;
      } else if (isAndroid) {
        window.location.href = playStoreUrl;
      } else {
        // For desktops or other devices, you might want to provide a generic message or alternative
        alert(
          `${walletType} is not installed. Please install it from your device's app store.`
        );
      }
    }, 2000);
  };

  const chainDetails = chains.find((chain) => chain.chainId === chainId);
  const chainName = chainNames[chainId] || `Unknown Chain (${chainId})`;

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div>
      {address ? (
        <button onClick={openModal} className="connect-button">
          {shortenAddress(address)}
        </button>
      ) : (
        <button onClick={openModal} className="connect-button">
          Connect
        </button>
      )}
      {error && <p className="error-message">{error}</p>}

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content" ref={modalRef}>
            <button onClick={closeModal} className="close-button">
              ×
            </button>
            {isSwitchingChains ? (
              <>
                <h4>Select a Network</h4>
                <div className="chain-buttons-container">
                  {chains.map((chain) => (
                    <button
                      key={chain.chainId}
                      onClick={() => switchChain(chain)}
                      className="wallet-button"
                    >
                      <img
                        src={chain.icon}
                        alt={`${chain.name} icon`}
                        className="chain-icon"
                      />
                      {chain.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsSwitchingChains(false)}
                  className="cancel-button"
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <h2>Wallet Options</h2>
                {address && (
                  <div className="wallet-info">
                    <p>
                      <strong>Connected Wallet:</strong>{" "}
                      {shortenAddress(address)}
                      <button
                        onClick={() => copyToClipboard(address)}
                        className={`copy-button ${copySuccess ? "copied" : ""}`}
                      >
                        {copySuccess ? "Copied" : "Copy"}
                      </button>
                    </p>
                    <p>
                      <strong>Chain:</strong> {chainName}
                    </p>
                  </div>
                )}

                {!address && (
                  <>
                    {isMobile && !isInWalletBrowser ? (
                      <>
                        <p>
                          Please open this DApp in your preferred wallet app:
                        </p>
                        <button
                          onClick={() => openInWalletApp("MetaMask")}
                          className="wallet-button"
                        >
                          Open in MetaMask
                        </button>
                        <button
                          onClick={() => openInWalletApp("TrustWallet")}
                          className="wallet-button"
                        >
                          Open in Trust Wallet
                        </button>
                        <button
                          onClick={() => openInWalletApp("Phantom")}
                          className="wallet-button"
                        >
                          Open in Phantom
                        </button>
                        <button
                          onClick={() => openInWalletApp("Coinbase")}
                          className="wallet-button"
                        >
                          Open in Coinbase Wallet
                        </button>
                        <button
                          onClick={() => openInWalletApp("Rabby")}
                          className="wallet-button"
                        >
                          Open in Rabby
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => connectWallet("MetaMask")}
                          className="wallet-button"
                        >
                          MetaMask
                        </button>
                        <button
                          onClick={() => connectWallet("TrustWallet")}
                          className="wallet-button"
                        >
                          Trust Wallet
                        </button>
                        <button
                          onClick={() => connectWallet("Phantom")}
                          className="wallet-button"
                        >
                          Phantom
                        </button>
                        <button
                          onClick={() => connectWallet("Coinbase")}
                          className="wallet-button"
                        >
                          Coinbase Wallet
                        </button>
                        <button
                          onClick={() => connectWallet("Rabby")}
                          className="wallet-button"
                        >
                          Rabby Wallet
                        </button>
                      </>
                    )}
                  </>
                )}

                {address && (
                  <>
                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="wallet-button"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setIsSwitchingChains(true)}
                      className="wallet-button"
                    >
                      Switch Chains
                    </button>
                    <button onClick={changeWallet} className="wallet-button">
                      Change Account
                    </button>
                    <button
                      onClick={disconnectWallet}
                      className="disconnect-button"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VortexConnect;
