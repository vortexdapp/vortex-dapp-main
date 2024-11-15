// src/telegram-pages/Swap.js

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams } from "react-router-dom";
import WalletRestorer from "../telegram-components/WalletRestorer";
import { useWallet } from "../WalletContext";
import { supabase } from "../supabaseClient"; // Import Supabase client
import "./Token.css";

// ABI for your Swap contract
const SwapContractABI = [
  "function swapWETHforTokens(uint256 amountIn, address tokenAddress) public returns (uint256)",
  "function swapTokensforWETH(uint256 amountIn, address tokenAddress) public returns (uint256)",
];

// Minimal ABI for ERC20 tokens
const ERC20ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
];

// Supported network configurations
const SUPPORTED_CHAINS = [
  {
    name: "Sepolia",
    chainId: "0xaa36a7", // Hexadecimal for Sepolia
    rpcUrl: "https://sepolia.infura.io/v3/4a4fe805be2e453fb73eb027658a0aa6",
    SwapContract: "0x589641815aEffF68191223f44489089AcAFF08c4",
    WETH: process.env.SEPOLIA_WETH,
  },
  {
    name: "Base",
    chainId: "0x2105", // Hexadecimal for Base
    rpcUrl: "https://mainnet.base.org",
    SwapContract: process.env.BASE_SWAP_CONTRACT,
    WETH: process.env.BASE_WETH,
  },
];

const Swap = () => {
  const { tokenAddress } = useParams(); // Fetch token address from URL params
  const { wallet } = useWallet();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_CHAINS[0]);
  const [inputAmount, setInputAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEthToToken, setIsEthToToken] = useState(true);
  const [balance, setBalance] = useState("0");
  const [poolAddress, setPoolAddress] = useState(""); // State to hold pool address
  const username = localStorage.getItem("username");

  // Initialize provider and signer
  useEffect(() => {
    if (wallet && selectedNetwork) {
      try {
        const networkProvider = new ethers.JsonRpcProvider(
          selectedNetwork.rpcUrl
        );
        const privateKey = wallet.privateKey.startsWith("0x")
          ? wallet.privateKey
          : `0x${wallet.privateKey}`;
        const userWallet = new ethers.Wallet(privateKey, networkProvider);
        setProvider(networkProvider);
        setSigner(userWallet);
        console.log(`Signer initialized: ${userWallet.address}`);
      } catch (error) {
        console.error("Failed to create signer with private key:", error);
      }
    }
  }, [wallet, selectedNetwork]);

  // Fetch balances
  useEffect(() => {
    if (signer) {
      fetchBalances();
    }
  }, [signer, isEthToToken]);

  const fetchBalances = async () => {
    if (!signer) return;
    try {
      if (isEthToToken) {
        const ethBalance = await provider.getBalance(await signer.getAddress());
        setBalance(ethers.formatEther(ethBalance));
      } else {
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20ABI,
          signer
        );
        const tokenBalance = await tokenContract.balanceOf(
          await signer.getAddress()
        );
        const decimals = await tokenContract.decimals();
        setBalance(ethers.formatUnits(tokenBalance, decimals));
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      setBalance("0");
    }
  };

  // Fetch pool address from Supabase
  useEffect(() => {
    const fetchPoolAddress = async () => {
      try {
        const { data, error } = await supabase
          .from("tokens")
          .select("pool")
          .eq("address", tokenAddress)
          .single();

        if (error) {
          console.error("Error fetching pool address:", error);
        } else {
          setPoolAddress(data?.pool || "");
        }
      } catch (error) {
        console.error("Error fetching pool address:", error);
      }
    };

    if (tokenAddress) {
      fetchPoolAddress();
    }
  }, [tokenAddress]);

  const ensureSigner = () => {
    if (!signer) {
      alert("Wallet is not connected. Please ensure your wallet is connected.");
      return false;
    }
    return true;
  };

  const approveToken = async (tokenAddress, spender, amount) => {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const tx = await tokenContract.approve(spender, amount);
      await tx.wait();
      console.log("Token approval successful!");
    } catch (error) {
      console.error("Token approval error:", error);
      throw new Error("Token approval failed.");
    }
  };

  const executeSwap = async () => {
    if (!ensureSigner()) return;
    setLoading(true);
    console.log("Starting swap execution...");

    try {
      if (!inputAmount || isNaN(inputAmount) || Number(inputAmount) <= 0) {
        alert("Please enter a valid amount.");
        setLoading(false);
        return;
      }

      const amountIn = ethers.parseUnits(inputAmount, 18); // Assuming 18 decimals
      const swapContractAddress = selectedNetwork.SwapContract;

      if (!swapContractAddress) {
        alert(
          "Swap contract address is not configured for the selected network."
        );
        setLoading(false);
        return;
      }

      const swapContract = new ethers.Contract(
        swapContractAddress,
        SwapContractABI,
        signer
      );

      if (!isEthToToken) {
        await approveToken(tokenAddress, swapContractAddress, amountIn);
      }

      console.log("Executing swap...");
      const tx = isEthToToken
        ? await swapContract.swapWETHforTokens(amountIn, tokenAddress, {
            value: amountIn,
            gasLimit: 3000000,
          })
        : await swapContract.swapTokensforWETH(amountIn, tokenAddress, {
            gasLimit: 3000000,
          });
      await tx.wait();
      console.log("Swap completed successfully.");
      alert("Swap successful!");
    } catch (error) {
      console.error("Swap error:", error);
      if (error.code === 4001) {
        alert("Swap transaction was rejected by the user.");
      } else {
        alert(`Swap failed: ${error.reason || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSwapDirection = () => {
    setIsEthToToken(!isEthToToken);
  };

  return (
    <div className="main-container">
      {/* Display iframe with dynamic pool address */}
      {poolAddress ? (
        <iframe
          height="100%"
          width="100%"
          id="geckoterminal-embed"
          title="GeckoTerminal Embed"
          src={`https://www.geckoterminal.com/sepolia-testnet/pools/${poolAddress}?embed=1&info=0&swaps=1`}
          frameBorder="0"
          allow="clipboard-write"
          allowFullScreen
        ></iframe>
      ) : (
        <p>Loading pool chart...</p>
      )}

      <div className="swap-container">
        <WalletRestorer username={username} />
        <h2>{isEthToToken ? "Swap ETH for Tokens" : "Swap Tokens for ETH"}</h2>

        <div className="balance-display">
          <p>
            {isEthToToken ? "ETH Balance: " : "Token Balance: "} {balance}
          </p>
        </div>

        <div className="swap-input">
          <label>{isEthToToken ? "ETH Amount:" : "Token Amount:"}</label>
          <input
            type="number"
            placeholder={`Enter ${isEthToToken ? "ETH" : "Token"} amount`}
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
          />
        </div>

        <button onClick={toggleSwapDirection} disabled={loading}>
          {isEthToToken ? "Switch to Token - ETH" : "Switch to ETH - Token"}
        </button>

        <button onClick={executeSwap} disabled={loading || !signer}>
          {loading ? "Swapping..." : "Swap"}
        </button>
      </div>
    </div>
  );
};

export default Swap;
