/* import { request, gql } from "graphql-request";

const SUBGRAPH_URL =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"; */

const axios = require("axios");

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

  // Environment Variables
  const quoterAddress = process.env.SEPOLIA_QUOTER;
  const WETH_address = process.env.SEPOLIA_WETH;

  const factoryAddress = "0xFdb32ceC4c169b5eDb661b2F3010f4071E02c776";

  const swapperAddress = "0x5a41e64efAe1E4A1A68DB84993bB79ef2090d8C6";

  const tokenAddress = "0xfFA476B26874ec2428FB84F8f817d34B6575cA4e"; // Replace with your token

  const tokenPool = "0xe9853563AA349f81A0A2e08652a1fF698A8dB76f";

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

  const amountIn = ethers.parseUnits("0.0001", 18); // Amount of WETH to swap (1 WETH)
  const provider = new ethers.JsonRpcProvider(
    process.env.ALCHEMY_SEPOLIA_ENDPOINT
  );

  const provider_mainnet = new ethers.JsonRpcProvider(
    process.env.ALCHEMY_MAINNET_ENDPOINT
  );

  // Uniswap V3 factory address (mainnet, replace with testnet if needed)
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

  const poolABI = [
    "function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
    "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  ];

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

  const response = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const ethPriceUSD = response.data.ethereum.usd;
  console.log("ETH CoinGecko Price:", ethPriceUSD);

  // Connect to the swapper contract using its ABI and address
  const Swapper = await ethers.getContractFactory("VortexSwapper");
  const swapper = await Swapper.attach(swapperAddress);

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, deployer);

  const totalSupply = await tokenContract.totalSupply();
  console.log("Total Supply:", ethers.formatUnits(totalSupply, 18)); // Assuming 18 decimals

  //----------------------------------24h Volume-------------------------------------------------------

  /* // Event topic for the Swap event
  const swapTopic = ethers.id(
    "Swap(address,address,int256,int256,uint160,uint128,int24)"
  );

  // Get current block and calculate block range for 24 hours
  const currentBlock = await provider.getBlockNumber();
  const blocksPerDay = (24 * 60 * 60) / 12; // Approx. 12s per block
  const fromBlock = currentBlock - Math.floor(blocksPerDay);

  console.log(`Fetching logs from block ${fromBlock} to ${currentBlock}`);

  // Fetch logs
  const logs = await provider.getLogs({
    fromBlock: fromBlock,
    toBlock: "latest",
    address: tokenPool,
    topics: [swapTopic],
  });

  console.log(`Fetched ${logs.length} logs for the Swap event`);

  // Decode logs
  const iface = new ethers.Interface([
    "event Swap(address sender, address recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  ]);

  let volumeToken = 0;

  logs.forEach((log) => {
    const parsedLog = iface.parseLog(log);
    const amount0 = ethers.BigNumber.from(parsedLog.args.amount0);
    const amount1 = ethers.BigNumber.from(parsedLog.args.amount1);

    // Sum the appropriate token's volume (e.g., if your token is token0)
    volumeToken = volumeToken.add(amount0.abs());
  });

  console.log("24h Volume (Token):", ethers.formatUnits(volumeToken, 18)); */

  //-----------------------------------24H VOLUME: USING THE GRAPH------------------------------------------------------

  /* // Define the GraphQL query
  const query = gql`
    query Get24hVolume($poolAddress: String!, $startTime: Int!) {
      swaps(where: { pool: $poolAddress, timestamp_gt: $startTime }) {
        amount0
        amount1
      }
    }
  `;

  // Calculate the start time (24 hours ago)
  const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
  const startTime = now - 24 * 60 * 60; // 24 hours ago

  // Execute the query
  const graphResponse = await request(SUBGRAPH_URL, query, {
    poolAddress: poolAddress.toLowerCase(), // Ensure the address is in lowercase
    startTime: startTime,
  });

  // Sum up the volumes
  let totalAmount0 = 0;
  let totalAmount1 = 0;

  graphResponse.swaps.forEach((swap) => {
    totalAmount0 += parseFloat(swap.amount0);
    totalAmount1 += parseFloat(swap.amount1);
  });

  console.log("24h Volume (Token0):", totalAmount0);
  console.log("24h Volume (Token1):", totalAmount1); */

  //-----------------------------------------------------------------------------------------

  /* console.log("Buying with factory function...");
  tx3 = await factory.swapETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
    gasLimit: 3000000,
  });
  receipt = await tx3.wait();
  console.log("Swap performed successfully!"); */

  //-----------------------------------------------------------------------------------------

  console.log("Buying with swapper function...");
  tx2 = await swapper.swapWETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
    gasLimit: 3000000,
  });
  receipt = await tx2.wait();
  console.log("Swap performed successfully!");

  //-----------------------------------------------------------------------------------------

  /* console.log("Approving...");
  const tx = await tokenContract.approve(swapperAddress, amountIn);
  await tx.wait();
  console.log("Token approval successful!");

  //-----------------------------------------------------------------------------------------

  console.log("Selling with swapper function...");
  tx3 = await swapper.swapTokensforWETH(amountIn, tokenAddress, {
    gasLimit: 3000000,
  });
  receipt = await tx3.wait();
  console.log("Swap performed successfully!"); */

  //-----------------------------------------------------------------------------------------

  const tokenSwappedEvent = await getLatestEvent(swapper, "SwapEvent");
  const priceEvent = await getLatestEvent(swapper, "PriceEvent");

  const token_Address = tokenSwappedEvent.args[0];
  const price = tokenSwappedEvent.args[1];
  const amountOutMin = tokenSwappedEvent.args[2];

  console.log("token Address: ", token_Address);
  console.log("price: ", price);
  console.log("amountOutMin: ", amountOutMin);

  const price_slot0 = priceEvent.args[0];
  const price_twap = priceEvent.args[1];

  console.log("Price from Slot0: ", price_slot0);
  console.log("Price from TWAP: ", price_twap);

  const priceUSD = (1 / Number(price_twap)) * price_ETH_USDC;
  const marketcap = (Number(totalSupply) * priceUSD) / 1000000000000000000;

  console.log("Price in USD: ", priceUSD);
  console.log("MarketCap: ", marketcap);
}

main().catch((error) => {
  console.error("Main function error:", error);
});

/* console.log("Checking price and MC...");
  const [allTokens, allActiveTokens, fees] = await factory.getMetrics();
  //await tx3.wait();
  console.log("Number of launches: ", allTokens);
  console.log("Number of active tokens: ", allActiveTokens);
  console.log("Fees collected: ", fees); */

//-----------------------------------------------------------------------------------------

/* console.log("Retrieving user provided liquidity...");
  tx10 = await factory.removeUserLiquidity(26620, 0);
  receipt = await tx10.wait();
  console.log("Liquidity retrieved successfully!"); */
/* }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); */
