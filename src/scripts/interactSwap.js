const { TokenAmount } = require("@uniswap/sdk");
const { ethers } = require("hardhat");

const swap_router = process.env.SEPOLIA_SWAP_ROUTER;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the swap contract using the account:",
    deployer.address
  );

  //const amountIn = ethers.parseEther("0.01");
  const amountIn = ethers.parseUnits("0.0000000001", 18);

  const tokenAmount = ethers.parseUnits("10", 18);

  const tokenAddress = "0x94365bBf2E8F026279c22E8D94b534F8b3C58d8b";

  const swapAddress = "0x589641815aEffF68191223f44489089AcAFF08c4";

  const Swapper = await ethers.getContractFactory("VortexSwapper");

  const swapper = await Swapper.attach(swapAddress);

  /* console.log("Swapping ETH for Tokens");
  const swaptx = await swapper.swapWETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
    gasLimit: 1000000,
  });
  await swaptx.wait();
  console.log("Swap done!"); */

  // Create an instance of the token contract
  const tokenAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
  ];
  const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, deployer);

  console.log(
    `Approving ${tokenAmount.toString()} tokens for the swap contract...`
  );

  // Approve the swap contract to spend the tokens
  const approveTx = await tokenContract
    .connect(deployer)
    .approve(swapAddress, tokenAmount);
  await approveTx.wait();

  console.log("Approval successful!");

  console.log("Swapping Tokens for ETH");
  try {
    const swaptxx = await swapper.swapTokensforWETH(tokenAmount, tokenAddress, {
      gasLimit: 1000000,
    });
    await swaptxx.wait();
    console.log("Swap done!");
  } catch (error) {
    console.error("Swap failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
