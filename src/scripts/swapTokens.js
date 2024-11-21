async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0x68547a2Edde5b4177Dd89e1Df08b34031bfe0610";

  const tokenAddress = "0xec08Ae6AEFcB3cEd7261B5957dfD70bd3be701c4";

  const abi = require("../abis/ISwapRouter.json");

  const WETH_address = process.env.SEPOLIA_WETH;
  const swapRouterAddress = process.env.SEPOLIA_SWAP_ROUTER;

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const swapRouter = new ethers.Contract(swapRouterAddress, abi, deployer);

  // Amount of ETH to swap
  const amountIn = ethers.parseUnits("0.0000001", 18); // 0.01 ETH
  // Amount of Tokens to swap
  const amountIn2 = ethers.parseUnits("3", 18); // 0.01 ETH

  /* console.log("Checking price and MC...");
  const [allTokens, allActiveTokens, fees] = await factory.getMetrics();
  //await tx3.wait();
  console.log("Number of launches: ", allTokens);
  console.log("Number of active tokens: ", allActiveTokens);
  console.log("Fees collected: ", fees); */

  //-----------------------------------------------------------------------------------------

  /* console.log("Buying with factory function...");
  tx1 = await factory.swapETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
  });
  receipt = await tx1.wait();
  console.log("Swap performed successfully!"); */

  //-----------------------------------------------------------------------------------------

  console.log("Retrieving user provided liquidity...");
  tx10 = await factory.removeUserLiquidity(26620, 0);
  receipt = await tx10.wait();
  console.log("Liquidity retrieved successfully!");

  //-----------------------------------------------------------------------------------------

  /* // Approve the SwapRouter to spend your tokens
  console.log("Approving the SwapRouter to spend tokens...");
  const tokenContract = await ethers.getContractAt(
    "IERC20",
    tokenAddress,
    deployer
  );
  const approveTx = await tokenContract.approve(swapRouterAddress, amountIn2);
  await approveTx.wait();
  console.log("Tokens approved for SwapRouter.");

  // Swap parameters
  const params2 = {
    tokenIn: tokenAddress,
    tokenOut: WETH_address,
    fee: 10000, // Assuming 1% fee tier
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
    amountIn: amountIn2,
    amountOutMinimum: 0, // Set to 0 for simplicity, you may want to set a minimum amount out to avoid front-running
    sqrtPriceLimitX96: 0, // No price limit
  };

  // Perform the swap
  console.log("Performing the swap from Tokens to ETH...");
  const tx2 = await swapRouter.exactInputSingle(params2);
  await tx2.wait();
  console.log("Swap performed successfully!"); */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
