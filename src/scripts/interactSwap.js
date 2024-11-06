const { ethers } = require("hardhat");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Interacting with the swap contract using the account:",
    deployer.address
  );

  // Total rewards in wei (0.01 ETH) converted to BigInt
  const amountIn = ethers.parseEther("0.01");

  tokenAddress = "0x94365bBf2E8F026279c22E8D94b534F8b3C58d8b";

  const swapAddress = "0xe0Bc1dd812B54Fe35a3404F405aE9564F65D08cf";
  const Swapper = await ethers.getContractFactory("Swap");
  const swapper = await Swapper.attach(swapAddress);

  const swaptx = await swapper.swapWETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
    gasLimit: 1000000,
  });
  await swaptx.wait();
  console.log("Swap done!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
