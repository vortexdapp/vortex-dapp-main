// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";
import "contracts/Staking.sol";
import "contracts/Token.sol";
import "contracts/FactoryExtra.sol";


contract MyFactory {

    uint256 public tokenCount = 0;
    uint256 public activeTokenCount = 0;
    uint256 public totalFees = 0;
    address public weth;
    address public deadAddress = 0x000000000000000000000000000000000000dEaD;
    INonfungiblePositionManager public positionManager;
    IUniswapV3Factory public uniswapFactory;
    ISwapRouter public swapRouter;
    IQuoterV2 public quoter;
    FactoryHelper public factoryHelper;
    ILiquidityLocker public locker;
    address public owner;
    address payable public stakingAddress;
    address public lockerAddress;
    address nftAddress;
    uint256 totalWethCollected;
    address teamWallet;
    uint256 rewardAmount;
    address treasuryAddress;
    address helperAddress;
    uint256 wethProvided = 0.000005 ether;
    uint256 priceToLaunch = 0.00002 ether;
    uint256 public lockTime1 = 5; //7 days; 
    uint256 public lockTime2 = 5; //30 days; 
    uint256 public maxZeroFeeDays = 2; 

    // Struct with each token's details 
    struct TokenDetails {
        address tokenAddress;
        address poolAddress;
        address tokenCreator;
        uint256 timeStamp;
        uint256 tokenId;
        bool liquidityRemoved;
        uint256 zerofeedays;
        bool isInactive;
        uint256 feeFromSwap;
        uint256 lockId;
        bool isLocked;
        uint256 unlockTime;
        bool isDEAD;
        bool maxWalletEnabled;
        bool userLiquidity;
    }

    TokenDetails[] public allTokens;

    mapping(uint256 => uint256) private tokenIndex; // Maps tokenId to index in allTokens array

    // Declaring Events
    event TokenDeployed(address indexed tokenAddress);
    event PoolCreated(address indexed token0, address indexed poolAddress);
    event PoolInitialized(address indexed poolAddress, uint160 sqrtPriceX96);
    event TokenApproved(address indexed tokenAddress, address indexed poolAddress);
    event LiquidityAdded(uint256 tokenId);
    event LiquidityRemoved(address indexed token, uint256 tokenId, uint256 amount0, uint256 amount1);
    event LiquidityAdditionFailed(address indexed token, address indexed pool, uint256 tokenAmount, uint256 wethAmount, string error);
    event FeesCollected(uint256 tokenId, uint256 amount0, uint256 amount1);
    event SwappedToWETH(address indexed token, uint256 amountIn, uint256 amountOut);
    event ZeroFeesDays(uint256 tokenId, bool isTokenDead);
    event ResetFeesDays(uint256 tokenId, bool isTokenDead);
    event TokensSwapped(uint256 amount);
    event VortexEvent(uint256 rewardAmount);
    event TokenLaunched(address pool, address token, uint256 tokenID, uint256 lockID);
    
    // Functions with this modifier can only be called by the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // Functions with this modifier can only be called by the owner, factory contract or staking contract
    modifier onlyAuth() {
        require(msg.sender == owner || msg.sender == address(this) || msg.sender == stakingAddress, "Caller is not authorized");
        _;
    }

    constructor(address _positionManager, address _weth, address _uniswapFactory, address _swapRouter, address _lockerAddress, address _teamWallet, address _quoterAddress) {
        positionManager = INonfungiblePositionManager(_positionManager);
        uniswapFactory = IUniswapV3Factory(_uniswapFactory);
        swapRouter = ISwapRouter(_swapRouter);
        locker = ILiquidityLocker(_lockerAddress);
        nftAddress = _positionManager;
        weth = _weth;
        owner = msg.sender;  
        lockerAddress = _lockerAddress;
        teamWallet = _teamWallet;
        quoter = IQuoterV2(_quoterAddress);
    }



    // Returns token details
    function getAllTokens() public view returns (address[] memory addresses, address[] memory tokenCreators, address[] memory poolAddresses, uint256[] memory tokenIds, uint256[] memory timestamps, bool[] memory liquidityRemovedStatus, uint256[] memory zerofeesdays, bool[] memory inactive, uint256[] memory feefromswap, uint256[] memory lockIds, bool[] memory isTokenLocked, uint256[] memory unlockTimes, bool[] memory isDead, bool[] memory maxWallet, bool[] memory isUserLiquidity) {
    addresses = new address[](allTokens.length);
    poolAddresses = new address[](allTokens.length); 
    tokenCreators = new address[](allTokens.length); 
    tokenIds = new uint256[](allTokens.length);
    timestamps = new uint256[](allTokens.length);
    liquidityRemovedStatus = new bool[](allTokens.length);
    zerofeesdays = new uint256[](allTokens.length);
    inactive = new bool[](allTokens.length);
    feefromswap = new uint256[](allTokens.length);
    lockIds = new uint256[](allTokens.length);
    isTokenLocked = new bool[](allTokens.length);
    unlockTimes = new uint256[](allTokens.length);
    isDead = new bool[](allTokens.length);
    maxWallet = new bool[](allTokens.length);
    isUserLiquidity = new bool[](allTokens.length);

    for (uint i = 0; i < allTokens.length; i++) {
        addresses[i] = allTokens[i].tokenAddress;
        poolAddresses[i] = allTokens[i].poolAddress;
        tokenCreators[i] = allTokens[i].tokenCreator;
        tokenIds[i] = allTokens[i].tokenId;
        timestamps[i] = allTokens[i].timeStamp;
        liquidityRemovedStatus[i] = allTokens[i].liquidityRemoved;
        zerofeesdays[i] = allTokens[i].zerofeedays;
        inactive[i] = allTokens[i].isInactive;
        feefromswap[i] = allTokens[i].feeFromSwap;
        lockIds[i] = allTokens[i].lockId;
        isTokenLocked[i] = allTokens[i].isLocked;
        unlockTimes[i] = allTokens[i].unlockTime;
        isDead[i] = allTokens[i].isDEAD;
        maxWallet[i] = allTokens[i].maxWalletEnabled;
        isUserLiquidity[i] = allTokens[i].userLiquidity;
    }
    return (addresses, poolAddresses, tokenCreators, tokenIds, timestamps, liquidityRemovedStatus, zerofeesdays, inactive, feefromswap, lockIds, isTokenLocked, unlockTimes, isDead, maxWallet, isUserLiquidity);
}


    // Deploys a token with a given name, symbol and total supply
    function deployToken( string calldata _name, string calldata _symbol, uint256 _supply) public returns (address) {

        // The token is minted to the factory contract
        MyToken token = new MyToken(_name, _symbol, _supply, address(this)); 
        address tokenAddress = address(token);
        
        emit TokenDeployed(tokenAddress);
        
        return tokenAddress;
    }

    


    // Function to get the pool address for a pool that's already been created and initialized
    function get_Pool(address tokenA, address tokenB, uint24 fee) external view returns (address pool) {
        pool = uniswapFactory.getPool(tokenA, tokenB, fee);
    }


    // Fallback function to receive Ether
    fallback() external payable {
        
    }

    // Receive function to handle incoming Ether
    receive() external payable {
        
    }

    // Function to approve another contract or address to manage a specific token
    function approveToken(address token, address spender, uint256 amount) internal {
    require(IERC20(token).approve(spender, amount), "Approval failed");
}

    // Function to approve another contract or address to manage a specific NFT
    function approveNFT(uint256 tokenId, address spender) internal {
        IERC721(nftAddress).approve(spender, tokenId);
    }

    // Set Staking and Treasury addresses in the factory
    function setStakingAndTreasuryAddress(address payable _stakingAddress, address _treasuryAddress, address _helperAddress) external onlyOwner {
        stakingAddress = _stakingAddress;
        treasuryAddress = _treasuryAddress;
        helperAddress = _helperAddress;
        factoryHelper = FactoryHelper(_helperAddress);
        
    }


    function getEstimatedAmountOut(
    address tokenIn, 
    address tokenOut, 
    uint256 amountIn
) internal returns (uint256 amountOut) {

    // Call quoteExactInputSingle from QuoterV2
    IQuoterV2.QuoteExactInputSingleParams memory params = IQuoterV2.QuoteExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: 10000,
        sqrtPriceLimitX96: 0
    });

    // Call the QuoterV2 to get the amountOut
    (amountOut,,,) = quoter.quoteExactInputSingle(params);

    return amountOut;
}

    
    function swapETHforTokens(uint256 amountIn, address tokenAddress) internal returns (uint256 amountOut) {
        // Wrap ETH to WETH

    uint256 estimatedAmountOut = getEstimatedAmountOut(weth, tokenAddress, amountIn);
    uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance
    approveToken(weth, address(swapRouter), amountIn);
    //approveToken(weth, address(factoryHelper), amountIn);
    //return factoryHelper.executeSwap(weth, tokenAddress, amountIn, amountOutMinimum, msg.sender);
    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: weth,
            tokenOut: tokenAddress,
            fee: 10000,
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle{value: amountIn}(params);

        return amountOut;
}

function swapTokensForWETH(uint256 amountIn, address tokenAddress) internal returns (uint256) {
    uint256 estimatedAmountOut = getEstimatedAmountOut(tokenAddress, weth, amountIn);
    uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance
    approveToken(tokenAddress, address(swapRouter), amountIn);
    return factoryHelper.executeSwap(tokenAddress, weth, amountIn, amountOutMinimum, address(this));
}

    // Function to transfer WETH from the deployer to the factory contract
    function transferWETHToFactory(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");

        // Check if the msg.sender has enough WETH balance
        uint256 senderBalance = IERC20(weth).balanceOf(msg.sender);
        require(senderBalance >= amount, "Insufficient WETH balance");

        // Approve the factory contract to spend WETH
        require(IERC20(weth).approve(address(this), amount), "Approval failed");

        // Transfer WETH from the owner to the factory contract
        require(IERC20(weth).transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }


    // Function that adds the initial liquidity to each token      bool userLiquidity, uint256 userLiquidityAmount
    function addLiquidityLockSwap(uint256 amountToBuy, bool userProvidedLiquidity, string calldata _name, string calldata _symbol, uint256 _supply) external payable returns (address poolAddress, address tokenAddress, uint256 tokenId, uint256 lockID) {

    require(msg.value >= priceToLaunch, "Insufficient ETH sent. Required: 0.00015 ETH"); 
    
    tokenAddress = deployToken(_name, _symbol, _supply);
    
    uint256 providedLiquidity = wethProvided;

    uint256 tokenBalance = IERC20(tokenAddress).balanceOf(address(this));

    if(userProvidedLiquidity == false) {

    // Check if the factory contract has enough WETH
    uint256 wethBalance = IERC20(weth).balanceOf(address(this));

    require(wethBalance >= wethProvided, "Not enough WETH in the factory contract");
    
    }

    if(userProvidedLiquidity == true) {

    require(msg.value > 0, "Must send ETH to convert");

    providedLiquidity = msg.value - amountToBuy - priceToLaunch;

    IWETH(weth).deposit{value: providedLiquidity}();
    
    }

    address token0;
    address token1;
    uint256 token0amount;
    uint256 token1amount;

    if (tokenAddress < weth) {
        token0 = tokenAddress;
        token1 = weth;
        token0amount = tokenBalance;
        token1amount = providedLiquidity;
    } else {
        token0 = weth;
        token1 = tokenAddress;
        token0amount = providedLiquidity;
        token1amount = tokenBalance;
    }



    uint256 priceRatio = (token1amount * 1e18) / token0amount;
    uint256 sqrtPriceRatio = sqrt(priceRatio);
    uint160 sqrtPrice_X96 = uint160((sqrtPriceRatio * 2**96) / 1e9);

    // Ensure the pool is created and initialized
    poolAddress = factoryHelper.createAndInitializePoolIfNecessary(token0, token1, sqrtPrice_X96);

    // Check and set approvals
    TransferHelper.safeApprove(token0, address(positionManager), token0amount);
    TransferHelper.safeApprove(token1, address(positionManager), token1amount);

    // Adding initial liquidity
    INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
        token0: token0,
        token1: token1,
        fee: 10000,
        tickLower: -887200,
        tickUpper: 887200,
        amount0Desired: token0amount,
        amount1Desired: token1amount,
        amount0Min: 0,
        amount1Min: 0,
        recipient: address(this),
        deadline: block.timestamp + 5 minutes
    });

        // Try minting liquidity and handle failure
        (tokenId, , , ) = positionManager.mint(params);

        // Approve the locker contract to manage the liquidity NFT
        IERC721(address(positionManager)).approve(lockerAddress, tokenId);

        // Lock the liquidity NFT
        lockID = ILiquidityLocker(lockerAddress).lockLiquidity(address(positionManager), tokenId, lockTime1, address(this));

    // Store the token details in the array
    allTokens.push(TokenDetails({
        tokenAddress: tokenAddress, 
        poolAddress: poolAddress,
        tokenCreator: msg.sender,  
        tokenId: tokenId,
        timeStamp: block.timestamp,
        liquidityRemoved: false,
        zerofeedays: 0,
        isInactive: false,
        feeFromSwap: 0,
        lockId: lockID,
        isLocked: true,
        unlockTime: block.timestamp + lockTime1,
        isDEAD: false,
        maxWalletEnabled: true,
        userLiquidity: userProvidedLiquidity
    }));

    // Save the index of the new token details in the mapping
    tokenIndex[tokenId] = allTokens.length - 1;

    // Save the token count
    tokenCount++;
    activeTokenCount++;

    // Set max wallet to 5%
    enableMaxWalletLimit(tokenAddress, tokenId);

    uint256 fee = 0;

    // If the user chooses to buy tokens when launching
    if(amountToBuy > 0){

        uint256 taxAmount = (amountToBuy * 3) / 100;
        uint256 amountToSwap = amountToBuy - taxAmount;

        payable(teamWallet).transfer(taxAmount);

        swapETHforTokens(amountToSwap, tokenAddress);

        fee = amountToBuy * 1 / 100;
    }

    emit TokenLaunched(poolAddress, tokenAddress, tokenId, lockID);

    return (poolAddress, tokenAddress, tokenId, lockID);
    }


// Counts how many consecutive days with no volume 
function updateNoFeeDays(uint256 tokenId) internal { 

    uint256 index = tokenIndex[tokenId]; 

    // When the count reaches 15 consecutive days the token is marked as innactive
    if( allTokens[index].zerofeedays >=  maxZeroFeeDays){ 
        allTokens[index].isInactive = true;
    }

    emit ZeroFeesDays(tokenId, allTokens[index].isInactive);

    allTokens[index].zerofeedays++;
}

// If the token has volume, reset the count
function resetNoFeeDays(uint256 tokenId) internal { 

    uint256 index = tokenIndex[tokenId]; // Get the index from mapping
    allTokens[index].zerofeedays=0;

    emit ResetFeesDays(allTokens[index].zerofeedays, allTokens[index].isInactive );
    
}

    // Collect fees for all tokens that are locked
    function collectFromLockerAndSwap(uint256 tokenId, address tokenAddress) external onlyOwner {
        
        uint256 totalWethCollectedLocal = 0;
        rewardAmount = 0;
        uint256 index = tokenIndex[tokenId]; 

            // Collect fees from the locker
            (uint256 amount0, uint256 amount1) = ILiquidityLocker(lockerAddress).collectFees(tokenId, address(this));
            emit FeesCollected(tokenId, amount0, amount1);

            // Determine token0 and token1
            address token0;
            address token1;

            if (tokenAddress < weth) {
                token0 = tokenAddress;
                token1 = weth;
                if (amount0 > 0) {
                    uint256 ethReceived = swapTokensForWETH(amount0, tokenAddress);
                    rewardAmount = ethReceived + amount1;
                    totalWethCollectedLocal += rewardAmount;

                    if (amount0 <= allTokens[index].feeFromSwap){
                    updateNoFeeDays(tokenId);}
                    else {
                    resetNoFeeDays(tokenId);}

                    // Save the fee generated by the factory swap
                    allTokens[index].feeFromSwap = amount0 * 1 / 100;
                    
                } else {
                    rewardAmount += amount1;
                    totalWethCollectedLocal += rewardAmount;
                    if(amount1 > 0){
                        resetNoFeeDays(tokenId);
                        } else {
                        updateNoFeeDays(tokenId);
                        }
                }
                    
            } else {
                token0 = weth;
                token1 = tokenAddress;
                if (amount1 > 0) {
                    uint256 ethReceived = swapTokensForWETH(amount1, tokenAddress);
                    rewardAmount = ethReceived + amount0;
                    totalWethCollectedLocal += rewardAmount;

                    if (amount1 <= allTokens[index].feeFromSwap){
                    updateNoFeeDays(tokenId);}
                    else {
                    resetNoFeeDays(tokenId);}

                    // Save the fee generated by the factory swap
                    allTokens[index].feeFromSwap = amount1 * 1 / 100;
                    
                } else{
                        rewardAmount += amount0;
                        totalWethCollectedLocal += rewardAmount;
                        if(amount0 > 0){
                        resetNoFeeDays(tokenId);
                        } else {
                        updateNoFeeDays(tokenId);
                        }
                }

            }

            emit VortexEvent(totalWethCollectedLocal);
            
           // Distribute collected fees 
           if (totalWethCollectedLocal > 0){

            uint256 devAmount = (totalWethCollectedLocal * 20) / 100;
            IWETH(weth).withdraw(devAmount);
        
            uint256 restAmount = (totalWethCollectedLocal * 80) / 100;
            address devAddress = allTokens[index].tokenCreator;
            // send a part of the fees to the token creator
            (bool sentToCreator, ) = devAddress.call{value: devAmount}("");
            require(sentToCreator, "Failed to send ETH to team wallet");
            distributeFees(restAmount);

           }
        
        totalWethCollected += totalWethCollectedLocal;
    }


    // Events to emit after successful payouts
    event RewardsSent(address indexed stakingAddress, uint256 amount);
    event TreasuryFunded(address indexed treasuryAddress, uint256 amount);
    event TeamFunded(address indexed teamWallet, uint256 amount);

    // Function to distribute the fees 
    function distributeFees(uint256 totalFeesCollected) internal {

    require(IERC20(weth).balanceOf(address(this)) >= totalFeesCollected, "Insuficient balance on the factory");

    // Unwrap WETH to ETH
    IWETH(weth).withdraw(totalFeesCollected);

    // Calculate distribution amounts
    uint256 liquidityAmount = totalFeesCollected / 8 * 15;
    uint256 stakersAmount = totalFeesCollected / 8 * 25;
    uint256 treasuryAmount = totalFeesCollected / 8 * 2;
    uint256 teamAmount = totalFeesCollected / 8 * 2;

    // Send to the token's liquidity
    // addLiquidity(tokenAddress, liquidityAmount)();

    // Send to staking contract by calling addRewards function
    SimpleStaking(stakingAddress).addRewards{value: stakersAmount}();

    // Send to the treasury 
    (bool sentToTreasury, ) = treasuryAddress.call{value: treasuryAmount}("");
    require(sentToTreasury, "Failed to send ETH to treasury contract");

    // Send to the team 
    (bool sentToTeam, ) = teamWallet.call{value: teamAmount}("");
    require(sentToTeam, "Failed to send ETH to team wallet");

}

// Relock liquidity for 1 month
function relock(uint256 _tokenId, uint256 _lockID) external onlyAuth returns(uint256 lockID){

    uint256 index = tokenIndex[_tokenId];

    // Unlock first
    ILiquidityLocker(lockerAddress).unlockLiquidity( _lockID, address(this));

    // Approve the locker to manage the NFT
    approveNFT(_tokenId, lockerAddress);

    uint256 _duration = lockTime2;
    
    lockID = ILiquidityLocker(lockerAddress).lockLiquidity(address(positionManager), _tokenId, _duration, address(this));

    allTokens[index].lockId = lockID;
    allTokens[index].isLocked = true;
    allTokens[index].unlockTime = block.timestamp + lockTime2;
    
    return lockID;
}


// Save the lockID in the token struct
function storeLockID(uint256 tokenId, uint256 _lockId, bool locked, uint256 unlockDate) internal {

    uint256 index = tokenIndex[tokenId]; // Get the index from mapping
    allTokens[index].lockId = _lockId;
    allTokens[index].isLocked = locked;
    allTokens[index].unlockTime = unlockDate;

}


// Babylonian method for calculating the square root
function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
        z = y;
        uint256 x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    } else if (y != 0) {
        z = 1;
    }
}


    // Function to remove liquidity
    function removeLiquidity(uint256 tokenId, uint128 liquidityToRemove) internal returns (uint256 collectedAmount0, uint256 collectedAmount1) {

        uint256 index = tokenIndex[tokenId]; 
        require(!allTokens[index].liquidityRemoved, "Liquidity already removed");

        // Collect the tokens from the position
        //(collectedAmount0, collectedAmount1) = factoryHelper.removeLiquidity(tokenId, liquidityToRemove);

        // Decrease liquidity
        positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidityToRemove,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );

        // Collect the tokens from the position
        (collectedAmount0, collectedAmount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        allTokens[index].liquidityRemoved = true; // Update the liquidity removed status
        emit LiquidityRemoved(
            msg.sender,
            tokenId,
            collectedAmount0,
            collectedAmount1
        );

        tryToSendFunds();
        return (collectedAmount0, collectedAmount1);
         
    }

    // Function to remove the user provided initial liquidity 
    function removeUserLiquidity(uint256 tokenId, uint256 lockId) external {

        uint256 index = tokenIndex[tokenId]; 
        address tokenOwner = allTokens[index].tokenCreator;
        // only the token creator can remove liquidity
        require(msg.sender == tokenOwner, "Caller is not the token creator");

        uint256 currentTime = block.timestamp;
        require( currentTime > allTokens[index].unlockTime, "Please wait for unlockTime");

        // If 7 days have passed since launch unlock the liquidity
        ILiquidityLocker lockerContract = ILiquidityLocker(lockerAddress);
        lockerContract.unlockLiquidity(lockId, address(this));

        storeLockID(tokenId, lockId, false, 0);

        // Fetch the position details
        (,, address token0, address token1, , , , uint128 liquidity, , , ,) = positionManager.positions(tokenId);

        uint128 liquidityAmount = liquidity;

        (uint collectedAmount0, uint collectedAmount1) = removeLiquidity(tokenId, liquidityAmount);

        IERC20(token0).transfer(msg.sender, collectedAmount0);

        IERC20(token1).transfer(msg.sender, collectedAmount1);
    }

    // Function to remove the provided initial liquidity (one week after launch)
    function removeInitialLiquidity(uint256 tokenId, uint256 lockId) external onlyAuth {

        // If 7 days have passed since launch unlock the liquidity
        ILiquidityLocker lockerContract = ILiquidityLocker(lockerAddress);
        lockerContract.unlockLiquidity(lockId, address(this));

        uint256 wethAmountToRemove = wethProvided; 

        storeLockID(tokenId, lockId, false, 0);

        // Fetch the position details
        (,, address token0, address token1, uint24 fee, , , uint128 liquidity, , , ,) = positionManager.positions(tokenId);

        address poolAddress = uniswapFactory.getPool(token0, token1, fee);

        // Use the TWAP to calculate the price
        uint32 twapInterval = 3;  // Set TWAP period (e.g., 30 minutes)
        uint256 price = factoryHelper.getTWAPPrice(poolAddress, twapInterval); 

         /* // Fetch pool state (price, liquidity, etc.)
        IUniswapV3Pool poolContract = IUniswapV3Pool(poolAddress);
        (uint160 sqrtPriceX96,,,,,,) = poolContract.slot0();
        uint256 price = (uint256(sqrtPriceX96) ** 2 * 10 ** 18) / (2 ** 192); */

        // Calculate the corresponding amount of tokens to remove
        uint256 tokensToRemove = (wethAmountToRemove * 10 ** 18) / price;

            // Calculate the liquidity to remove 
        uint128 liquidityToRemove = uint128(sqrt(wethAmountToRemove * tokensToRemove));

        uint128 liquidityToRemoveSafe = liquidityToRemove > liquidity ? liquidity : liquidityToRemove;

        (uint256 amount0, uint256 amount1) = removeLiquidity(tokenId, liquidityToRemoveSafe);


        if(token0 == weth ){
            IERC20(token1).transfer(deadAddress, amount1);

        }

        else if(token1 == weth){
            IERC20(token0).transfer(deadAddress, amount0);
        } 

        
        // Approve the locker to manage the NFT
        approveNFT(tokenId, lockerAddress);

        // Lock the liquidity again (now for 1 month)
        uint256 duration = lockTime2;
        uint256 newLockId = locker.lockLiquidity(address(positionManager), tokenId, duration, address(this));
        uint256 unlockDate = block.timestamp + lockTime2;

        storeLockID(tokenId, newLockId, true, unlockDate);

    }

    // Remove remaining liquidity when a token dies (no trading volume for 15 consecutive days)
    function removeDeadLiquidity(uint256 tokenId, uint256 lockId) external onlyOwner {

        // Unlock the liquidity
        ILiquidityLocker lockercontract = ILiquidityLocker(lockerAddress);
        lockercontract.unlockLiquidity(lockId, address(this));

        // Fetch the position details
        (, , address token0, address token1, , , , uint128 liquidity, , , ,) = positionManager.positions(tokenId);

        // Remove all remaining liquidity
        (uint256 amount0, uint256 amount1) = removeLiquidity(tokenId, liquidity);

            if(token0 == weth){

                require(IERC20(token1).approve(address(this), amount1), "Approval failed");

                IERC20(token1).transferFrom(address(this), deadAddress, amount1);

            } else {

                require(IERC20(token0).approve(address(this), amount0), "Approval failed");

                IERC20(token0).transferFrom(address(this), deadAddress, amount0);
            }

        uint256 index = tokenIndex[tokenId];
        activeTokenCount--;
        allTokens[index].isDEAD = true;

    }


    // Function to enable the max wallet limit 
    function enableMaxWalletLimit(address tokenAddress, uint256 tokenId) internal {
        
        uint256 index = tokenIndex[tokenId];
        address pool_Address = allTokens[index].poolAddress;
        MyToken(tokenAddress).enableMaxWalletLimit(pool_Address);

    }

    // Function to get the platform metrics
    function getMetrics() external view returns(uint256 alltokens, uint256 allactivetokens, uint256 fees) {

        uint numberOfTokensLaunched = tokenCount;
        uint activeTokens = activeTokenCount;
        uint _fees = totalWethCollected;

        return (numberOfTokensLaunched, activeTokens, _fees);
    }


    // Function to collect fees
    function collectFees(uint256 token_Id) internal onlyAuth returns (uint256 amount0, uint256 amount1){
        INonfungiblePositionManager.CollectParams memory params =
            INonfungiblePositionManager.CollectParams({
                tokenId: token_Id,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (amount0, amount1) = positionManager.collect(params);

        emit FeesCollected(token_Id, amount0, amount1);

        return (amount0, amount1);
        
    }

    // Add rewards to the staking contract
    function callAddRewards (uint256 amount ) external payable onlyOwner {

        require(msg.value > 0, "No rewards to add");
        approveToken(weth, stakingAddress, amount);

        SimpleStaking(stakingAddress).addRewards{value: amount}();
        
    }


    uint256 public pendingFunds; 
    event FundsRequested(uint256 amountNeeded);
    event FundsSent(uint256 amount);

    //function called by the staking pool to ask factory for funds to process pending unstaking
    function notifyFundsNeeded(uint256 amount) external {
        require(msg.sender == stakingAddress, "Only staking contract can notify.");
        pendingFunds += amount;
        emit FundsRequested(amount);
        tryToSendFunds();
    }

    // if the factory has funds not being lent, sent to unstakers
    function tryToSendFunds() public onlyAuth {
        uint256 availableWETH = IERC20(weth).balanceOf(address(this));
            if (availableWETH >= pendingFunds && pendingFunds > 0) {
                IERC20(weth).transfer(stakingAddress, pendingFunds);
                ISimpleStaking(stakingAddress).notifyFundsReceived(pendingFunds);
                emit FundsSent(pendingFunds);
                pendingFunds = 0;
            }
    }

    //if factory has funds, and is requested by the staking pool 
    function provideFundsIfNeeded(address _stakingContract, uint256 amountRequested) external onlyAuth {
        uint256 availableWETH = IWETH(weth).balanceOf(address(this));
            if (availableWETH >= amountRequested) {
                IWETH(weth).transfer(_stakingContract, amountRequested);
                ISimpleStaking(payable(_stakingContract)).notifyFundsReceived(amountRequested);
            }
    }

}


interface ISimpleStaking {
    function notifyFundsReceived(uint256 amount) external;
}


