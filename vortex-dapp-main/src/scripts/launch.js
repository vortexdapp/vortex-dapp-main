//const { SwapRouter } = require("@uniswap/v3-sdk");

async function getLatestEvent(token, eventName) {
  // Get the filter for the TokenDeployed event
  const filter = token.filters[eventName]();

  // Query the filter for events emitted by the token contract
  const events = await token.queryFilter(filter);

  // Find the TokenDeployed event emitted by the token contract
  const latestEvent = events[events.length - 1]; // Get the latest event

  return latestEvent;
}

// Babylonian method for square root calculation using BigInt
function sqrt(value) {
  if (value < 0n) {
    throw new Error("Square root of negative numbers is not supported");
  }
  if (value === 0n) return 0n;
  let z = value;
  let x = value / 2n + 1n;
  while (x < z) {
    z = x;
    x = (value / x + x) / 2n;
  }
  return z;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace these with your desired token name, symbol, and total supply
  const tokenName = "CatCoin";
  const tokenSymbol = "CAT";
  const tokenSupply = "100";

  // Replace this with the address of the deployed factory contract

  const lockerAddress = "0x85388e4c51b835737128Ca723d3d6cC32128F344";
  const factoryAddress = "0xd433dC3B5698039d9506EcBc366dEb8D118F2094";
  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const LiquidityLocker = await ethers.getContractFactory("LiquidityLocker");
  const locker = await LiquidityLocker.attach(lockerAddress);

  // Amount of ETH to swap
  const amountIn = ethers.parseUnits("0.0000000001", 18);

  const liquidityAmount = ethers.parseUnits("0.0000012", 18);

  const launchPrice = ethers.parseUnits("0.00002", 18);

  // Call the deployToken function of the factory contract
  const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply);
  await tx.wait();
  console.log("Token deployed successfully!");

  const tokenDeployedEvent = await getLatestEvent(factory, "TokenDeployed");

  const tokenAddress = tokenDeployedEvent.args[0];
  console.log("Token Address: ", tokenAddress);

  console.log("Adding initial liquidity, swapping and locking");
  const txtest = await factory.addLiquidityLockSwap(
    tokenAddress,
    amountIn,
    false,
    {
      value: amountIn + liquidityAmount + launchPrice,
      gasLimit: 9000000,
    }
  );
  await txtest.wait();
  console.log("Success!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
