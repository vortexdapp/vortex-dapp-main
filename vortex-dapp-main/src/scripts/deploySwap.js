const { ethers, run } = require("hardhat");

async function main() {
  const uniswapV3Factory_address = process.env.SEPOLIA_UNISWAP_FACTORY;
  const positionManager_address = process.env.SEPOLIA_POSITION_MANAGER;
  const swap_router = process.env.SEPOLIA_SWAP_ROUTER;
  const WETH_address = process.env.SEPOLIA_WETH;
  const quoter = process.env.SEPOLIA_QUOTER;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const ContractFactory = await ethers.getContractFactory("Swap");

  const contract = await ContractFactory.deploy(
    positionManager_address,
    WETH_address,
    uniswapV3Factory_address,
    swap_router,
    quoter
  );
  const SwapperAddress = contract.target;
  console.log("Swapper address:", contract.target);

  /* console.log("Distributor Contract deployed to:", contract.target);
  try {
    await run("verify:verify", {
      address: contract.target,
      constructorArguments: [],
    });
    console.log("Contract verified on Etherscan");
  } catch (error) {
    console.error("Verification failed:", error);
  } */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
