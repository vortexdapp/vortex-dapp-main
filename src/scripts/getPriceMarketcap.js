async function getLatestEvent(token, eventName) {
  // Get the filter for the TokenDeployed event
  const filter = token.filters[eventName]();

  // Query the filter for events emitted by the token contract
  const events = await token.queryFilter(filter);

  // Find the TokenDeployed event emitted by the token contract
  const latestEvent = events[events.length - 1]; // Get the latest event

  return latestEvent;
}

async function main() {
  //const { ethers, artifacts } = require("hardhat");

  const [deployer] = await ethers.getSigners();

  const swapRouter = process.env.SEPOLIA_SWAP_ROUTER;

  const WETH_address = process.env.SEPOLIA_WETH;

  const swapperAddress = "0x5a41e64efAe1E4A1A68DB84993bB79ef2090d8C6";

  const tokenAddress = "0xfFA476B26874ec2428FB84F8f817d34B6575cA4e"; // Replace with your token

  const tokenPool = "0x418417d3be55fb4B6B7413f4Bc5386D8BfB4F5E2"; // Replace with your token pool

  // Your contract ABI
  const mySwapperABI = [
    "function getTWAPPrice(address poolAddress, uint32 twapInterval) public view returns (uint256)",
  ];

  // Minimal ABI for ERC20 tokens
  const ERC20ABI = [
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() public view returns (uint256)",
  ];

  const poolABI = [
    "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
    "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  ];

  const amountIn = ethers.parseUnits("0.0001", 18); // Amount of ETH to swap

  const provider = new ethers.JsonRpcProvider(
    process.env.ALCHEMY_SEPOLIA_ENDPOINT
  );

  const provider_mainnet = new ethers.JsonRpcProvider(
    process.env.ALCHEMY_MAINNET_ENDPOINT
  );

  // Instantiate the contract
  const swapperContract = new ethers.Contract(
    swapperAddress,
    mySwapperABI,
    provider
  );

  const twapInterval = 30;

  // Call the getTWAPPrice function
  const price = await swapperContract.getTWAPPrice(tokenPool, twapInterval);

  // Convert the price to a human-readable format if needed
  console.log("TWAP Price:", price);

  // Uniswap V3 factory address (mainnet)
  const UNISWAP_V3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  // Token addresses for WETH and USDC
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Replace with correct network WETH
  const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"; // Replace with correct network USDC
  const FEE_TIER = 3000;

  // Connect to the Uniswap V3 factory
  const uniswap = new ethers.Contract(
    UNISWAP_V3_FACTORY,
    [
      "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)",
    ],
    provider_mainnet
  );

  // Get the pool address
  const poolAddress = await uniswap.getPool(
    WETH_ADDRESS,
    USDC_ADDRESS,
    FEE_TIER
  );

  console.log("ETH-USDC Pool Address:", poolAddress);

  const poolContract = new ethers.Contract(
    poolAddress,
    poolABI,
    provider_mainnet
  );

  const slot0 = await poolContract.slot0();
  const sqrtPriceX96 = slot0[0];

  // Convert 2 ** 96 to BigInt for compatibility
  const Q96 = BigInt(2 ** 96);

  // Calculate price as a BigInt and then convert to a number for display
  price_ETH_USDC =
    1 / (Number(sqrtPriceX96 ** BigInt(2) / Q96 ** BigInt(2)) / 1e12);
  console.log("ETH/USD Price:", price_ETH_USDC);

  // Connect to the swapper contract using its ABI and address
  const Swapper = await ethers.getContractFactory("VortexSwapper");
  const swapper = await Swapper.attach(swapperAddress);

  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, deployer);

  const totalSupply = await tokenContract.totalSupply();
  console.log("Total Supply:", ethers.formatUnits(totalSupply, 18)); // Assuming 18 decimals

  //-----------------------------------------------------------------------------------------

  /* console.log("Buying with swapper function...");
    tx2 = await swapper.swapWETHforTokens(amountIn, tokenAddress, {
      value: amountIn,
      gasLimit: 3000000,
    });
    receipt = await tx2.wait();
    console.log("Swap performed successfully!"); */

  //-----------------------------------------------------------------------------------------

  const tokenSwappedEvent = await getLatestEvent(swapper, "SwapEvent");

  const tokenPrice = tokenSwappedEvent.args[1];
  console.log("Token Price: ", tokenPrice);

  const priceUSD = (1 / Number(tokenPrice)) * price_ETH_USDC;
  const marketcap = (Number(totalSupply) * priceUSD) / 1000000000000000000;

  console.log("Price in USD: ", priceUSD);
  console.log("MarketCap: ", marketcap);

  const newPriceUSD = (1 / Number(price)) * price_ETH_USDC;
  const newMarketcap =
    (Number(totalSupply) * newPriceUSD) / 1000000000000000000;

  console.log("Price in USD: ", newPriceUSD);
  console.log("MarketCap: ", newMarketcap);
}

main().catch((error) => {
  console.error("Main function error:", error);
});
