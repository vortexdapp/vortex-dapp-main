let totalWethCollected = 0n; // removeEarly

async function getLatestEvent(token, eventname) {
  // Get the filter for the specified event
  const filter = token.filters[eventname]();

  // Query the filter for events emitted by the contract
  const events = await token.queryFilter(filter);

  // Find the latest event
  const latestEvent = events[events.length - 1]; // Get the latest event

  return latestEvent;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0x7b9048C4DEb5d9bEE1d5320221759Ad901F416C6";

  const lockerAddress = "0x83F2dAdb04462B3f542c4Abf726B225c18B35c20";

  // Get the locker contract instance
  const Locker = await ethers.getContractFactory("LiquidityLocker");
  const locker = await Locker.attach(lockerAddress);

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  // Fetch all tokens and their timestamps
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
  console.log("Addresses: ", addresses);
  console.log("poolAddresses: ", poolAddresses);
  console.log("tokenCreators: ", tokenCreators);
  console.log("Token IDs: ", tokenIds);
  console.log("Timestamps: ", timestamps);
  console.log("liquidityRemovedStatus: ", liquidityRemovedStatus);
  console.log("zeroFeesDays: ", zeroFeesDays);
  console.log("isInactive: ", isInactive);
  console.log("lastFee: ", lastFee);
  console.log("lockID: ", lockID);
  console.log("isLocked: ", isLocked);
  console.log("unlockTime: ", unlockTime);
  console.log("isDead: ", isDead);
  console.log("maxWallet: ", maxWallet);
  console.log("isUserLiquidity: ", isUserLiquidity);

  // Loop through all tokens to check their launch time

  for (let i = 0; i < addresses.length; i++) {
    // check if it is locked

    if (isInactive[i] == false && isLocked[i] == true) {
      console.log("Collecting from the locker and swapping...");
      const tx = await factory.collectFromLockerAndSwap(
        tokenIds[i],
        addresses[i]
      );
      const receipt = await tx.wait();

      console.log("Success.");

      const vortexEvent = await getLatestEvent(factory, "VortexEvent");

      const WethCollected = vortexEvent.args[0];
      console.log("WethCollected", WethCollected);
      totalWethCollected = totalWethCollected + WethCollected;
    } else {
      console.log("Dead token");
    }
  }

  console.log("totalWethCollected = ", totalWethCollected);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

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
