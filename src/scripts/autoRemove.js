const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Removing liquidity with the account:", deployer.address);

  const factoryAddress = "0x5076e3B39115CE8BC528bAad2B4fe7Dc30cb5843";

  const lockerAddress = "0xf60AC5b48600b9e31bC87933331e79241157F2d0";

  const Factory = await hre.ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const LiquidityLocker = await ethers.getContractFactory("LiquidityLocker");
  const locker = await LiquidityLocker.attach(lockerAddress);

  const [
    addresses,
    poolAddresses,
    tokenCreators,
    tokenIds,
    timestamps,
    liquidityRemovedStatus,
    zeroFeesDays,
    isInactive,
    lastFee,
    lockID,
    isLocked,
    unlockTime,
    isDead,
    maxWallet,
    isUserLiquidity,
  ] = await factory.getAllTokens();

  // Print results
  console.log("Addresses:", addresses);
  console.log("poolAddresses: ", poolAddresses);
  console.log("tokenCreators: ", tokenCreators);
  console.log("Token IDs:", tokenIds);
  console.log("Timestamps:", timestamps);
  console.log("liquidityRemovedStatus:", liquidityRemovedStatus);
  console.log("lockID:", lockID);
  console.log("isLocked:", isLocked);
  console.log("unlockTime:", unlockTime);
  console.log("isDead:", isDead);
  console.log("maxWallet:", maxWallet);
  console.log("isUserLiquidity:", isUserLiquidity);

  const currentTime = Math.floor(Date.now() / 1000); // current time in seconds since Unix epoch

  // Loop through all tokens to check their launch time
  for (let i = 0; i < addresses.length; i++) {
    // Check if the token's initial liquidity has already been removed and if the locktime has passed

    if (
      !liquidityRemovedStatus[i] &&
      currentTime > unlockTime[i] &&
      isUserLiquidity[i] == false
    ) {
      console.log("Removing initial liquidity and relocking...");
      const tx = await factory.removeInitialLiquidity(tokenIds[i], lockID[i]); // Remove the initial liq provided and relock
      const receipt = await tx.wait();
      console.log("Success.");
    } else if (
      liquidityRemovedStatus[i] == true &&
      isInactive[i] == true &&
      currentTime > unlockTime[i] &&
      isDead[i] == false &&
      isUserLiquidity[i] == false
    ) {
      console.log("Removing all liquidity and marking token as dead...");
      const tx = await factory.removeDeadLiquidity(tokenIds[i], lockID[i]); // Remove the remaining liquidity when a token dies
      const receipt = await tx.wait();
      console.log("Success.");
    } else if (
      liquidityRemovedStatus[i] == true &&
      isInactive[i] == false &&
      currentTime > unlockTime[i] &&
      isDead[i] == false &&
      isUserLiquidity[i] == false
    ) {
      console.log("Relocking liquidity...");
      const tx = await factory.relock(tokenIds[i], lockID[i]); // Relock liquidity for 1 month
      const receipt = await tx.wait();
      console.log("Done");
    } else {
      console.log(
        `Token at address ${addresses[i]} with token ID ${tokenIds[i]} is still locked or dead.`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
