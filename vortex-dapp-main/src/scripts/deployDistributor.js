const { ethers, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const tokenAddress = "0xE3Bb1E884Ee24aA5f0E399416da698Da43a2a476";

  const ContractFactory = await ethers.getContractFactory("RewardDistributor");

  // Deploy the contract with custom gas settings for BSC
  const contract = await ContractFactory.deploy({
    gasPrice: ethers.parseUnits("5", "gwei"), // Adjust gas price as needed
  });

  // Wait for deployment to finish
  await contract.wait();

  console.log("Distributor Contract deployed to:", contract.target);
  try {
    await run("verify:verify", {
      address: distributorAddress,
      constructorArguments: [tokenAddress],
    });
    console.log("Contract verified on Etherscan");
  } catch (error) {
    console.error("Verification failed:", error);
  }

  /* const MyFlashCoin = await ethers.getContractFactory("FlashCoin");
  const MyFlashCoinDeployment = await MyFlashCoin.deploy("Thether USD", "USDT");

  console.log("FlashCoin address:", MyFlashCoinDeployment.target);
  const flashAddress = MyFlashCoinDeployment.target; */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
