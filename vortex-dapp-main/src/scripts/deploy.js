const { ethers } = require("hardhat");

async function main() {
  //Setting contract addresses
  const uniswapV3Factory_address = process.env.SEPOLIA_UNISWAP_FACTORY;
  const positionManager_address = process.env.SEPOLIA_POSITION_MANAGER;
  const swap_router = process.env.SEPOLIA_SWAP_ROUTER;
  const WETH_address = process.env.SEPOLIA_WETH;
  const teamWallet = process.env.TEAM_WALLET;
  const quoter = process.env.SEPOLIA_QUOTER;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const MyLocker = await ethers.getContractFactory("LiquidityLocker");
  const MyLockerDeployment = await MyLocker.deploy(positionManager_address);

  console.log("MyLocker address:", MyLockerDeployment.target);
  const lockerAddress = MyLockerDeployment.target;

  const MyFactory = await ethers.getContractFactory("MyFactory");
  const myFactory = await MyFactory.deploy(
    positionManager_address,
    WETH_address,
    uniswapV3Factory_address,
    swap_router,
    lockerAddress,
    teamWallet,
    quoter
  );
  const factoryAddress = myFactory.target;
  console.log("MyFactory address:", myFactory.target);

  const MyHelper = await ethers.getContractFactory("FactoryHelper");
  const MyHelperDeployment = await MyHelper.deploy(
    factoryAddress,
    positionManager_address,
    WETH_address,
    uniswapV3Factory_address,
    swap_router,
    lockerAddress,
    teamWallet,
    quoter
  );

  console.log("MyHelper address:", MyHelperDeployment.target);
  const helperAddress = MyHelperDeployment.target;

  // Deploy the SimpleStaking contract
  const SimpleStaking = await ethers.getContractFactory("SimpleStaking");
  const staking = await SimpleStaking.deploy(WETH_address, factoryAddress);

  const stakingAddress = staking.target;
  console.log("MyStaking address:", staking.target);

  // Deploy the Treasury contract
  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(factoryAddress);

  const treasuryAddress = treasury.target;
  console.log("MyTreasury address:", treasuryAddress);

  const factory = await MyFactory.attach(factoryAddress);
  const locker = await MyLocker.attach(lockerAddress);

  console.log(
    "Setting staking and treasury address in the factory contract..."
  );
  tx3 = await factory.setStakingAndTreasuryAddress(
    stakingAddress,
    treasuryAddress,
    helperAddress
  );
  await tx3.wait();
  console.log("Done!");

  console.log("Setting factory address in the locker contract...");
  tx2 = await locker.setFactoryAddress(factoryAddress);
  await tx2.wait();
  console.log("Done!");

  // Amount of WETH to send (in Wei)
  const amountInWei = ethers.parseUnits("0.00002", 18);

  // WETH ABI
  const WETHAbi = require("./WETHabi.json");

  // Get the WETH contract instance
  const WETH = new ethers.Contract(WETH_address, WETHAbi, deployer);

  // Check WETH balance of deployer
  const balance = await WETH.balanceOf(deployer.address);
  console.log(`Deployer WETH balance: ${ethers.formatUnits(balance, 18)} WETH`);

  // Approve the factory contract to spend WETH on behalf of deployer
  const approveTx = await WETH.approve(factoryAddress, amountInWei);
  await approveTx.wait();
  console.log(
    `Approved ${ethers.formatUnits(
      amountInWei,
      18
    )} WETH to the factory contract`
  );

  // Transfer WETH to the factory contract
  const transferTx = await WETH.transfer(factoryAddress, amountInWei);
  await transferTx.wait();
  console.log(
    `Transferred ${ethers.formatUnits(
      amountInWei,
      18
    )} WETH to the factory contract`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
