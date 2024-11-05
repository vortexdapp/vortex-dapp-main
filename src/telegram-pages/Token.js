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
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import {
  Pool,
  Route,
  Trade,
  SwapRouter,
  computePoolAddress,
  TickMath,
} from "@uniswap/v3-sdk";
import WalletRestorer from "../telegram-components/WalletRestorer";
import { useWallet } from "../WalletContext";
import "./Token.css";

const Swap = () => {
  const { wallet } = useWallet();
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const [inputAmount, setInputAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const username = localStorage.getItem("username");

  useEffect(() => {
    if (wallet) {
      const newProvider = new JsonRpcProvider(
        "https://base-mainnet.g.alchemy.com/v2/zKbXaPT2AXf2nljEsWJNUtGZubI7hsAT" // Replace with your actual provider URL
      );
      const newSigner = new Wallet(wallet.privateKey, newProvider);
      setProvider(newProvider);
      setSigner(newSigner);
    }
  }, [wallet]);

  const fetchTokenDetails = async (address) => {
    try {
      const erc20ABI = [
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function decimals() view returns (uint8)",
      ];
      const tokenContract = new Contract(address, erc20ABI, provider);

      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);

      return { symbol, name, decimals: Number(decimals) };
    } catch (error) {
      console.error("Error fetching token details:", error);
      alert(
        "Invalid token address or unable to fetch token details. Please check the address and try again."
      );
      return null;
    }
  };

  const approveTokenIfNeeded = async (tokenInstance, spender) => {
    try {
      const erc20ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)",
      ];
      const tokenContract = new Contract(
        tokenInstance.address,
        erc20ABI,
        signer
      );

      const currentAllowance = await tokenContract.allowance(
        wallet.address,
        spender
      );
      const amountToApprove = MaxUint256;

      if (currentAllowance < parseUnits(inputAmount, tokenInstance.decimals)) {
        const tx = await tokenContract.approve(spender, amountToApprove);
        await tx.wait();
      } else {
        console.log("Sufficient allowance already set.");
      }
    } catch (error) {
      console.error("Approval error:", error);
      alert(`Approval failed: ${error.message}`);
    }
  };

  const executeSwap = async () => {
    setLoading(true);
    setOutputAmount("");

    try {
      if (!inputAmount || isNaN(inputAmount) || Number(inputAmount) <= 0) {
        alert("Please enter a valid ETH amount.");
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

      const { symbol, name, decimals } = tokenDetails;
      const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
      const chainId = 8453;

      const WETH = new Token(
        chainId,
        WETH_ADDRESS,
        18,
        "WETH",
        "Wrapped Ether"
      );

      const inputToken = WETH;
      const outputToken = new Token(
        chainId,
        tokenAddress,
        decimals,
        symbol,
        name
      );

      const fee = 3000;

      const poolAddress = computePoolAddress({
        factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
        tokenA: inputToken,
        tokenB: outputToken,
        fee: fee,
      });

      console.log("Computed Pool Address:", poolAddress);

      const code = await provider.getCode(poolAddress);
      if (code === "0x") {
        alert("Pool does not exist for this token pair.");
        setLoading(false);
        return;
      }

      const poolContract = new Contract(
        poolAddress,
        [
          "function liquidity() view returns (uint128)",
          "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
        ],
        provider
      );

      const [liquidity, slot0] = await Promise.all([
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

      if (!slot0 || liquidity === 0n || slot0.sqrtPriceX96 === 0n) {
        alert("The pool is uninitialized or lacks liquidity.");
        setLoading(false);
        return;
      }

      // Ensure tick is within Uniswap's acceptable range
      const tick = slot0.tick;
      if (tick < TickMath.MIN_TICK || tick > TickMath.MAX_TICK) {
        console.error("Tick value out of range:", tick);
        alert("Invalid pool data. The tick value is out of range.");
        setLoading(false);
        return;
      }

      const pool = new Pool(
        inputToken,
        outputToken,
        fee,
        slot0.sqrtPriceX96.toString(),
        liquidity.toString(),
        tick
      );

      console.log("Pool Instance:", pool);

      const route = new Route([pool], inputToken, outputToken);

      const amountIn = CurrencyAmount.fromRawAmount(
        inputToken,
        parseUnits(inputAmount, inputToken.decimals).toString()
      );

      const trade = await Trade.fromRoute(
        route,
        amountIn,
        TradeType.EXACT_INPUT
      );

      const slippageTolerance = new Percent(50, 10000);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      const methodParameters = SwapRouter.swapCallParameters([trade], {
        slippageTolerance,
        recipient: wallet.address,
        deadline,
      });

      await approveTokenIfNeeded(outputToken, methodParameters.to);

      const tx = {
        data: methodParameters.calldata,
        to: methodParameters.to,
        value: methodParameters.value === "0x" ? "0x0" : methodParameters.value,
        from: wallet.address,
        gasPrice: await provider.getGasPrice(),
        gasLimit: 200000n,
      };

      const transactionResponse = await signer.sendTransaction(tx);
      await transactionResponse.wait();

      const formattedOutput = formatUnits(
        trade.outputAmount.quotient.toString(),
        decimals
      );
      setOutputAmount(formattedOutput);
      alert(`Swap Successful! You received ${formattedOutput} ${symbol}`);
    } catch (error) {
      console.error("Swap error:", error);
      alert(`Swap failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="swap-container">
      <WalletRestorer username={username} />
      <h2>Swap ETH for Tokens on Base</h2>
      <div className="swap-input">
        <label>ETH Amount:</label>
        <input
          type="number"
          placeholder="Enter ETH amount"
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
      {outputAmount && <p>Estimated Output: {outputAmount}</p>}
    </div>
  );
};

export default Swap;
