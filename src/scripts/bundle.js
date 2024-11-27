const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.ALCHEMY_SEPOLIA_ENDPOINT
  );

  const swapRouterAddress = process.env.SEPOLIA_SWAP_ROUTER; // Uniswap V3 Router
  const bundleSwapperAddress = "0x36F73982613602C88074Ae8b9C9529DcDd4C8150"; // Replace with deployed contract address
  const tokenAddress = "0x05226ce26c94495f4917229070d74829d7B08A80"; // Replace with your token
  const wethAddress = process.env.SEPOLIA_WETH; // WETH address

  const bundleSwapperABI = [
    "function bundleSwap(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) calldata params1, tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) calldata params2) external payable",
  ];

  const bundleSwapper = new ethers.Contract(
    bundleSwapperAddress,
    bundleSwapperABI,
    provider
  );

  const signer = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
  const contractWithSigner = bundleSwapper.connect(signer);

  const totalAmountIn = ethers.parseUnits("0.00000002", 18);
  const amountIn = ethers.parseUnits("0.00000001", 18); // Amount of WETH for each swap
  const feeTier = 10000; // Uniswap v3 Fee tier: 1%
  const sqrtPriceLimitX96 = 0; // No price limit

  const params1 = {
    tokenIn: wethAddress,
    tokenOut: tokenAddress,
    fee: feeTier,
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0, // Accept any amount
    sqrtPriceLimitX96: sqrtPriceLimitX96,
  };

  const params2 = {
    tokenIn: wethAddress,
    tokenOut: tokenAddress,
    fee: feeTier,
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0, // Accept any amount
    sqrtPriceLimitX96: sqrtPriceLimitX96,
  };

  console.log("Sending bundled swap transaction...");
  const tx = await contractWithSigner.bundleSwap(params1, params2, {
    value: totalAmountIn, // Total ETH sent for both swaps
    gasLimit: 500000, // Set an appropriate gas limit
  });

  console.log("Waiting for transaction confirmation...");
  const receipt = await tx.wait();
  console.log("Bundled swap transaction confirmed:", receipt.transactionHash);
}

main().catch((error) => {
  console.error("Error in script:", error);
  process.exit(1);
});
