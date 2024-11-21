import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./Swapper.css";

// Supported network configurations
const SUPPORTED_CHAINS = {
  11155111: {
    // Sepolia
    name: "Sepolia",
    SwapContract: "0x589641815aEffF68191223f44489089AcAFF08c4",
    WETH: process.env.REACT_APP_SEPOLIA_WETH,
  },
  8453: {
    // Base
    name: "Base",
    SwapContract: "0x589641815aEffF68191223f44489089AcAFF08c4",
    WETH: process.env.REACT_APP_BASE_WETH,
  },
  // Add other chains if needed
};

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

const Swapper = ({ tokenAddress }) => {
  const [inputAmount, setInputAmount] = useState("");
  const [isEthToToken, setIsEthToToken] = useState(true);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");
  const [swapContractAddress, setSwapContractAddress] = useState("");
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Initialize signer, provider, and chainId
  useEffect(() => {
    const initializeWallet = async () => {
      if (window.ethereum) {
        try {
          const tempProvider = new ethers.BrowserProvider(window.ethereum);
          const tempSigner = await tempProvider.getSigner();
          const network = await tempProvider.getNetwork();

          setProvider(tempProvider);
          setSigner(tempSigner);
          setChainId(network.chainId);

          if (SUPPORTED_CHAINS[network.chainId]) {
            setSwapContractAddress(
              SUPPORTED_CHAINS[network.chainId].SwapContract
            );
          } else {
            console.error("Unsupported chain ID:", network.chainId);
          }
        } catch (error) {
          console.error("Failed to initialize wallet:", error);
        }
      }
    };

    initializeWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", initializeWallet);
      window.ethereum.on("chainChanged", initializeWallet);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", initializeWallet);
        window.ethereum.removeListener("chainChanged", initializeWallet);
      }
    };
  }, []);

  useEffect(() => {
    if (signer) {
      fetchBalances();
    }
  }, [signer, isEthToToken]);

  const fetchBalances = async () => {
    if (!signer || !provider) return;
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

  const approveToken = async (spender, amount) => {
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
    if (!signer || !provider) {
      alert("Wallet is not connected.");
      return;
    }

    setLoading(true);
    console.log("Starting swap execution...");

    try {
      if (!inputAmount || isNaN(inputAmount) || Number(inputAmount) <= 0) {
        alert("Please enter a valid amount.");
        setLoading(false);
        return;
      }

      const amountIn = ethers.parseUnits(inputAmount, 18); // Assuming 18 decimals

      if (!swapContractAddress) {
        alert("Swap contract address is not configured.");
        setLoading(false);
        return;
      }

      const swapContract = new ethers.Contract(
        swapContractAddress,
        SwapContractABI,
        signer
      );

      if (!isEthToToken) {
        await approveToken(swapContractAddress, amountIn);
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
    <div className="swap-container">
      <h2>{isEthToToken ? "Swap ETH for Tokens" : "Swap Tokens for ETH"}</h2>

      <div className="balance-display">
        <p>
          {isEthToToken ? "ETH Balance: " : "Token Balance: "} {balance}
        </p>
      </div>

      <div className="swap-input">
        <label>{isEthToToken ? "ETH Amount:" : "Token Amount:"}</label>
        <input
          className="input3"
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
  );
};

export default Swapper;
