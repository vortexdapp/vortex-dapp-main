// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "contracts/Staking.sol";
import "contracts/Token.sol";

contract FactoryHelper {
    address public weth;
    address public deadAddress = 0x000000000000000000000000000000000000dEaD;
    INonfungiblePositionManager public positionManager;
    IUniswapV3Factory public uniswapFactory;
    ISwapRouter public swapRouter;
    IQuoterV2 public quoter;
    FactoryHelper public factoryHelper;
    ILiquidityLocker public locker;
    address public owner;
    address public factoryAddress;
    address public nftAddress;
    address public lockerAddress;
    address public teamWallet;
    
    event LiquidityEvent(address indexed token, uint256 tokenId, string eventType, uint256 amount0, uint256 amount1);
    event TokensSwapped(uint256 amountOut);

    constructor(address _factoryAddress, address _positionManager, address _weth, address _uniswapFactory, address _swapRouter, address _lockerAddress, address _teamWallet, address _quoterAddress) {
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
        factoryAddress = _factoryAddress;

    }

    function getEstimatedAmountOut(
    address tokenIn, 
    address tokenOut, 
    uint256 amountIn
) public returns (uint256 amountOut) {

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

    
    function swapETHforTokens(uint256 amountIn, address tokenAddress) external payable returns (uint256 amountOut) {
        
    uint256 estimatedAmountOut = getEstimatedAmountOut(weth, tokenAddress, amountIn);
    uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance
    
    IERC20(weth).approve(address(swapRouter), amountIn);

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

    // Function to execute swap
    function executeSwap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 amountOutMinimum, 
        address recipient
    ) external payable returns (uint256 amountOut) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: 10000,
            recipient: recipient,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);
        emit TokensSwapped(amountOut);
        return amountOut;
    }

    // Function to handle liquidity removal
    function removeLiquidity(uint256 tokenId, uint128 liquidityToRemove) external returns (uint256, uint256) {
        positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: tokenId,
                liquidity: liquidityToRemove,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );

        return positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: msg.sender,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
    }

    // Additional helper functions related to swaps and liquidity management can be added here...

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


    // Calls UniV3 function to create and initialize a pool of a given token 
     function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint160 sqrtPriceX96
    ) external returns (address pool) {
        pool = positionManager.createAndInitializePoolIfNecessary(token0, token1, 10000, sqrtPriceX96);
        return pool;
    }


    /* function addLiquidityHelper(address token0, address token1, uint256 token0amount, uint256 token1amount) external returns (address poolAddress, uint256 tokenId) {
    // Calculate sqrtPriceX96 considering both tokens have 18 decimals
    uint256 priceRatio = (token1amount * 1e18) / token0amount;
    uint256 sqrtPriceRatio = sqrt(priceRatio);
    uint160 sqrtPrice_X96 = uint160((sqrtPriceRatio * 2**96) / 1e9);

    // Ensure the pool is created and initialized
    poolAddress = createAndInitializePoolIfNecessary(token0, token1, sqrtPrice_X96);

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
    
        

    return (poolAddress, tokenId);
} */



    function getTWAPPrice(address poolAddress, uint32 twapInterval) public view returns (uint256 price) {
    IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);

    // Allocate memory for the array with two elements
    //uint32[] memory secondsAgos;
    uint32[] memory secondsAgos = new uint32[](2);

    secondsAgos[0] = twapInterval;  // Time period over which TWAP is calculated (e.g., 1800 seconds = 30 minutes)
    secondsAgos[1] = 0;  // Current time

    // Fetch the tick cumulative values at these timestamps
    (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);
    // Calculate the time-weighted average tick over the twapInterval
    int56 timeWeightedAverageTick = (tickCumulatives[1] - tickCumulatives[0]) / int56(int32(twapInterval));

    // Convert the average tick to a price (sqrtPriceX96)
    uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(int24(timeWeightedAverageTick));

    // Calculate the price from sqrtPriceX96
    price = (uint256(sqrtPriceX96) ** 2 * 10 ** 18) / (2 ** 192);

    return price;
}




}


interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}


interface ILiquidityLocker {
    function lockLiquidity(address _nftAddress, uint256 _tokenId, uint256 _duration, address factory) external returns (uint256 lockId);
    function unlockLiquidity(uint256 _lockId, address factory) external;
    function collectFees(uint256 tokenId, address factory) external returns(uint256 amount0, uint256 amount1);
}

