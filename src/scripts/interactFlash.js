const { ethers } = require("hardhat");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Interacting with the reward distributor contract using the account:",
    deployer.address
  );

  // Total rewards in wei (0.01 ETH) converted to BigInt
  const totalReward = BigInt(ethers.parseEther("0.01").toString());

  const flashAddress = "0xC69eBA3157aAfed70f4fbebb09176Efac9590849";
  const FlashCoin = await ethers.getContractFactory("FlashCoin");
  const flash = await FlashCoin.attach(distributorAddress);

  // Total supply in wei (assuming the total supply is 1 billion tokens)
  const totalSupply = BigInt(ethers.parseUnits("1000000000", 18).toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
