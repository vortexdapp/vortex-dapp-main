// Importing ethers from Hardhat environment
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed factory contract
  const factoryContractAddress = process.env.REACT_APP_FACTORY_SEPOLIA_CA;

  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = process.env.REACT_APP_STAKING_SEPOLIA_CA;
  const treasuryAddress = "0xf821FdA1935174f232bf00a06eff6b3d8c51Eb7f";
  const  helperAddress="0x91B087f73c377d1744E1FeFAC67ABce89f5dBCF7"
  // Get signer information from the default account
  const [signer] = await ethers.getSigners();

  // Create a contract instance connected to the signer
  const FactoryContract = await ethers.getContractFactory("MyFactory");
  const factory = FactoryContract.attach(factoryContractAddress).connect(
    signer
  );

  // Call the setStakingPoolAddress function
  const transactionResponse = await factory.setStakingAndTreasuryAddress(
    stakingContractAddress,
    treasuryAddress,
    helperAddress
  );
  console.log("Waiting for transaction to be mined...");
  await transactionResponse.wait();

  console.log(`Staking pool address updated to: ${stakingContractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
