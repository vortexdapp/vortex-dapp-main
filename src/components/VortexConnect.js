// src/components/VortexConnect.js

import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import './VortexConnect.css';
import sepoliaIcon from '../assets/icons/sepolia.png';
import baseIcon from '../assets/icons/base.png';
import bscIcon from '../assets/icons/bsc.png';
import arbitrumIcon from '../assets/icons/arbitrum.png';
import optimismIcon from '../assets/icons/optimism.png';


const chains = [
  {
    chainId: 11155111,
    name: "Sepolia",
    currency: "ETH",
    explorerUrl: "https://eth-sepolia.blockscout.com",
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    icon:sepoliaIcon,
  },
  {
    chainId: 8453,
    name: "Base",
    currency: "ETH",
    explorerUrl: "https://base.blockscout.com/",
    rpcUrl: process.env.BASE_RPC_URL,
    icon:baseIcon,
  },
  {
    chainId: 56,
    name: "BSC",
    currency: "BNB",
    explorerUrl: "https://bscscan.com",
    rpcUrl: process.env.BSC_RPC_URL,
    icon:bscIcon,
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    currency: "ETH",
    explorerUrl: "https://arbitrum.blockscout.com/",
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    icon:arbitrumIcon,
  },
  {
    chainId: 10,
    name: "Optimism",
    currency: "ETH",
    explorerUrl: "https://optimism.blockscout.com/",
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    icon:optimismIcon,
  },
];

const chainNames = {
  11155111: "Sepolia",
  8453: "Base",
  56: "BSC",
  42161: "Arbitrum",
  10: "Optimism"
};

const VortexConnect = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSwitchingChains, setIsSwitchingChains] = useState(false);
  const [address, setAddress] = useState(localStorage.getItem('connectedAddress') || null);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Create a ref for the modal
  const modalRef = useRef();

  useEffect(() => {
    if (address) {
      reconnectWallet();
    }
  }, []);

  // Close modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modalRef]);

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
      localStorage.setItem('connectedAddress', accounts[0]);
      setError(null);
    }
  };

  const handleChainChanged = (chainIdHex) => {
    setChainId(parseInt(chainIdHex, 16));
    setError(null);
  };

  const connectWallet = async (walletType) => {
    try {
      let tempProvider;

      if (walletType === 'MetaMask' && window.ethereum?.isMetaMask) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
      } else if (walletType === 'TrustWallet' && window.ethereum?.isTrust) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
      } else if (walletType === 'Phantom' && window.phantom?.ethereum) {
        tempProvider = new ethers.BrowserProvider(window.phantom.ethereum);
      } else if (walletType === 'Coinbase' && window.ethereum?.isCoinbaseWallet) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
      } else if (walletType === 'Rabby' && window.ethereum?.isRabby) {
        tempProvider = new ethers.BrowserProvider(window.ethereum);
      } else {
        throw new Error(`${walletType} not found`);
      }

      await tempProvider.send('eth_requestAccounts', []);
      const tempSigner = await tempProvider.getSigner();
      const userAddress = await tempSigner.getAddress();
      const network = await tempProvider.getNetwork();

      setProvider(tempProvider);
      setAddress(userAddress);
      setChainId(network.chainId);
      localStorage.setItem('connectedAddress', userAddress);
      setError(null);
      closeModal();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } catch (err) {
      console.error(`${walletType} connection error:`, err);
      setError(`${walletType} connection failed. Please check your wallet setup.`);
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
        setChainId(network.chainId);
        setError(null);

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } catch (err) {
        console.error("Wallet reconnection error:", err);
        disconnectWallet();
      }
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    localStorage.removeItem('connectedAddress');
    setError(null);

    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
    closeModal();
  };

  const switchChain = async (targetChain) => {
    if (!window.ethereum) {
      setError("Ethereum provider not found.");
      return;
    }

    const hexChainId = '0x' + targetChain.chainId.toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setError(null);
      closeModal();
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
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

  const chainDetails = chains.find((chain) => chain.chainId === chainId);
  const chainName = chainNames[chainId] || `Unknown Chain (${chainId})`;

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div>
      {address ? (
        <button onClick={openModal} className="connect-button">Options</button>
      ) : (
        <button onClick={openModal} className="connect-button">Connect Wallet</button>
      )}
      {error && <p className="error-message">{error}</p>}

      {isModalOpen && (
        <div className="modal">
        
          <div className="modal-content" ref={modalRef}>
            <button onClick={closeModal} className="close-button">×</button>
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
        src={chain.icon} // Using the icon property
        alt={`${chain.name} icon`}
        className="chain-icon" // You can add styles to adjust the size and appearance
      />
      {chain.name} {/* Optional text next to the icon */}
    </button>
  ))}
</div>

                <button onClick={() => setIsSwitchingChains(false)} className="cancel-button">Back</button>
              </>
            ) : (
              <>
                <h2>Wallet Options</h2>
                {address && (
                  <div className="wallet-info">
                    <p>
                      <strong>Connected Wallet:</strong> {shortenAddress(address)}
                      <button onClick={() => copyToClipboard(address)} className={`copy-button ${copySuccess ? 'copied' : ''}`}>
                        {copySuccess ? 'Copied' : 'Copy'}
                      </button>
                    </p>
                    <p><strong>Chain:</strong> {chainName}</p>
                  </div>
                )}
                
                {!address && (
                  <>
                    <button onClick={() => connectWallet('MetaMask')} className="wallet-button">MetaMask</button>
                    <button onClick={() => connectWallet('TrustWallet')} className="wallet-button">Trust Wallet</button>
                    <button onClick={() => connectWallet('Phantom')} className="wallet-button">Phantom</button>
                    <button onClick={() => connectWallet('Coinbase')} className="wallet-button">Coinbase Wallet</button>
                    <button onClick={() => connectWallet('Rabby')} className="wallet-button">Rabby Wallet</button>
                  </>
                )}

                {address && (
                  <>
                    <button onClick={() => setIsSwitchingChains(true)} className="wallet-button">Switch Chains</button>
                    <button onClick={disconnectWallet} className="disconnect-button">Disconnect</button>
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
