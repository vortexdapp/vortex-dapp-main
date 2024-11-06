// src/telegram-pages/Swap.js

import React, { useState, useEffect } from "react";
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseUnits,
  formatUnits,
  isAddress,
  MaxUint256,
} from "ethers";
import WalletRestorer from "../telegram-components/WalletRestorer";
import { useWallet } from "../WalletContext";
import "./Token.css";

// Minimal ABI for SwapRouter (including deadline in exactInputSingle)
const SwapRouterABI = [
  "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

// Minimal ABI for ERC20 (symbol, name, decimals, approve, allowance)
const ERC20ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

// Define supported chains with their configurations from environment variables
const SUPPORTED_CHAINS = [
  {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: process.env.ALCHEMY_SEPOLIA_ENDPOINT,
    explorerUrl: "https://sepolia.etherscan.io/",
    SwapRouter: process.env.SEPOLIA_SWAP_ROUTER,
    WETH: process.env.SEPOLIA_WETH,
  },
  {
    name: "Base",
    chainId: 8453,
    rpcUrl: process.env.ALCHEMY_BASE_ENDPOINT,
    explorerUrl: "https://basescan.org/",
    SwapRouter: process.env.BASE_SWAP_ROUTER,
    WETH: process.env.BASE_WETH,
  },
];

const Swap = () => {
  const { wallet } = useWallet();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_CHAINS[0]);
  const [inputAmount, setInputAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("");
  const username = localStorage.getItem("username");

  // Initialize provider and signer based on the selected network and wallet
  useEffect(() => {
    const init = async () => {
      if (wallet && selectedNetwork.rpcUrl) {
        try {
          const networkProvider = new JsonRpcProvider(selectedNetwork.rpcUrl);
          const userWallet = new Wallet(wallet.privateKey, networkProvider);
          setProvider(networkProvider);
          setSigner(userWallet);
          console.log(`Signer initialized: ${userWallet.address}`);
        } catch (error) {
          console.error("Failed to create signer with private key:", error);
        }
      }
    };
    init();
  }, [wallet, selectedNetwork]);

  // Function to fetch token details
  const fetchTokenDetails = async (address) => {
    try {
      const tokenContract = new Contract(address, ERC20ABI, provider);
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);
      setSymbol(symbol);
      return { symbol, name, decimals: Number(decimals) };
    } catch (error) {
      console.error("Error fetching token details:", error);
      alert("Invalid token address or unable to fetch token details.");
      return null;
    }
  };

  // Function to approve tokens if needed
  const approveTokenIfNeeded = async (tokenAddress, spender, amount) => {
    try {
      const tokenContract = new Contract(tokenAddress, ERC20ABI, signer);
      const currentAllowance = await tokenContract.allowance(
        wallet.address,
        spender
      );

      if (currentAllowance.lt(amount)) {
        const tx = await tokenContract.approve(spender, MaxUint256);
        await tx.wait();
        console.log("Token approved.");
      } else {
        console.log("Sufficient allowance already set.");
      }
    } catch (error) {
      console.error("Approval error:", error);
      if (error.code === 4001) {
        alert("Approval transaction was rejected by the user.");
      } else {
        alert(`Approval failed: ${error.reason || error.message}`);
      }
    }
  };

  const executeSwap = async () => {
    setLoading(true);
    setOutputAmount("");
    console.log("Starting swap execution...");

    try {
      if (!inputAmount || isNaN(inputAmount) || Number(inputAmount) <= 0) {
        alert("Please enter a valid WETH amount.");
        setLoading(false);
        return;
      }

      if (!isAddress(tokenAddress)) {
        alert("Please enter a valid token address.");
        setLoading(false);
        return;
      }

      const tokenDetails = await fetchTokenDetails(tokenAddress);
      if (!tokenDetails) {
        setLoading(false);
        return;
      }

      const { decimals } = tokenDetails;
      const WETH_ADDRESS = selectedNetwork.WETH;
      const SWAP_ROUTER_ADDRESS = selectedNetwork.SwapRouter;

      if (!SWAP_ROUTER_ADDRESS || !WETH_ADDRESS) {
        alert(
          "SwapRouter or WETH address is not configured for the selected network."
        );
        setLoading(false);
        return;
      }

      const amountIn = parseUnits(inputAmount, 18);

      const swapRouterContract = new Contract(
        SWAP_ROUTER_ADDRESS,
        SwapRouterABI,
        signer
      );
      const amountOutMinimum = 0;

      await approveTokenIfNeeded(WETH_ADDRESS, SWAP_ROUTER_ADDRESS, amountIn);

      const params = {
        tokenIn: WETH_ADDRESS,
        tokenOut: tokenAddress,
        fee: 3000,
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        amountIn: amountIn.toString(),
        amountOutMinimum: amountOutMinimum.toString(),
        sqrtPriceLimitX96: 0,
      };

      const tx = await swapRouterContract.exactInputSingle(params, {
        gasLimit: 500000,
      });
      await tx.wait();
      console.log("Transaction confirmed.");

      setOutputAmount("Unknown");
      alert("Swap successful. Check your wallet for the received tokens.");
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

  return (
    <div className="swap-container">
      <WalletRestorer username={username} />
      <h2>Swap WETH for Tokens</h2>
      <div className="swap-input">
        <label>WETH Amount:</label>
        <input
          type="number"
          placeholder="Enter WETH amount"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
        />
      </div>
      <div className="swap-input">
        <label>Token Address:</label>
        <input
          type="text"
          placeholder="Paste token contract address"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />
      </div>
      <button onClick={executeSwap} disabled={loading || !signer}>
        {loading ? "Swapping..." : "Swap"}
      </button>
      {outputAmount && (
        <p>
          Estimated Output: {outputAmount} {symbol}
        </p>
      )}
    </div>
  );
};

export default Swap;
