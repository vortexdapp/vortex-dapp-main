// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";
import '@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol';
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";


contract VortexSwapper {
uint256 public tokenCount = 0;
    uint256 public activeTokenCount = 0;
    uint256 public totalFees = 0;
    address public weth;
    address public deadAddress = 0x000000000000000000000000000000000000dEaD;
    INonfungiblePositionManager public positionManager;
    IUniswapV3Factory public uniswapFactory;
    ISwapRouter public swapRouter;
    IQuoterV2 public quoter;
    address public owner;

    // Available Uniswap fee tiers
    uint24[3] public feeTiers = [500, 3000, 10000];

constructor(address _positionManager, address _weth, address _uniswapFactory, address _swapRouter, address _quoterAddress) {
        positionManager = INonfungiblePositionManager(_positionManager);
        uniswapFactory = IUniswapV3Factory(_uniswapFactory);
        swapRouter = ISwapRouter(_swapRouter);
        quoter = IQuoterV2(_quoterAddress);
        weth = _weth;
        owner = msg.sender;  
        
    }


    // Fallback function to receive Ether
    fallback() external payable {
        
    }

    // Receive function to handle incoming Ether
    receive() external payable {
        
    }

    // Function to approve another contract or address to manage a specific token
    function approveToken(address token, address spender, uint256 amount) public {
    require(IERC20(token).approve(spender, amount), "Approval failed");
}


// Function to get the pool address for a pool that's already been created and initialized
    function get_Pool(address tokenA, address tokenB, uint24 fee) public view returns (address pool) {
        pool = uniswapFactory.getPool(tokenA, tokenB, fee);
    }
    

     // Function to find the optimal fee tier by checking available pools
    function getOptimalFee(address tokenIn, address tokenOut) public view returns (uint24) {
        for (uint256 i = 0; i < feeTiers.length; i++) {
            address pool = uniswapFactory.getPool(tokenIn, tokenOut, feeTiers[i]);
            if (pool != address(0)) {
                return feeTiers[i]; // Return the first available pool with liquidity
            }
        }
        return 0;
    }

    function getEstimatedAmountOut(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) public returns (uint256 amountOut) {
    // Ensure the pool exists
    address pool = uniswapFactory.getPool(tokenIn, tokenOut, 10000);
    require(pool != address(0), "Pool does not exist");

    // Check liquidity
    IUniswapV3Pool uniswapPool = IUniswapV3Pool(pool);
    require(uniswapPool.liquidity() > 0, "No liquidity in the pool");

    // Prepare the parameters for `quoteExactInputSingle`
    IQuoterV2.QuoteExactInputSingleParams memory params = IQuoterV2.QuoteExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: 10000,
        sqrtPriceLimitX96: 0 // No price limit
    });

    try quoter.quoteExactInputSingle(params) returns (
        uint256 outAmount,
        uint160 afterSqrtPriceX96,
        uint32 initializedTicksCrossed,
        uint256 gasEstimate
    ) {
        return outAmount; // Return only the `amountOut` value
    } catch {
        revert("Quoter call failed or no available liquidity for the pair");
    }
}



event SwapEvent(address token, uint256 price, uint256 amountOut);

function swapWETHforTokens(uint256 amountIn, address tokenAddress) public payable returns (uint256 amountOut) {

    address poolAddress = get_Pool(weth, tokenAddress, 10000);
    require(poolAddress != address(0), "Pool not found");

    uint32 twapInterval = 60;  // Set TWAP period (e.g., 30 seconds)
    uint256 price = getTWAPPrice(poolAddress, twapInterval);
    require(price != 0, "Price not valid"); 

    // Estimate output amount and apply slippage
    uint256 estimatedAmountOut = (amountIn * price);
    uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance

    emit SwapEvent(tokenAddress, price, amountOutMinimum); 
    
    IERC20(weth).approve(address(swapRouter), amountIn);

    //return executeSwap(weth, tokenAddress, amountIn, amountOutMinimum, msg.sender);
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

event PriceEvent(uint256 price);

function getTWAPPrice(address poolAddress, uint32 twapInterval) public view returns (uint256 price) {
    IUniswapV3Pool pool = IUniswapV3Pool(poolAddress);

    // Allocate memory for the array with two elements
    //uint32[] memory secondsAgos;
    uint32[] memory secondsAgos = new uint32[](2);

    secondsAgos[0] = twapInterval;  // Time period over which TWAP is calculated (e.g., 1800 seconds = 30 minutes)
    secondsAgos[1] = 0;  // Current time

    // Fetch the cumulative tick values at these time points
    (int56[] memory tickCumulatives, ) = pool.observe(secondsAgos);

    uint160 sqrtPriceX96_slot0;
    uint160 sqrtPriceX96_twap;
    int24 twapTick;

    //if (tickCumulatives[1] == tickCumulatives[0]) {
        // No trades occurred during the interval, fallback to the current pool tick
        (sqrtPriceX96_slot0, , , , , , ) = pool.slot0();
        
    //} else {
        // Calculate the time-weighted average tick over the interval
        int56 tickDifference = tickCumulatives[1] - tickCumulatives[0];
        int56 timeWeightedAverageTick = tickDifference / int56(uint56(twapInterval));
        twapTick = int24(timeWeightedAverageTick); // Convert to int24 for TickMath
        sqrtPriceX96_twap = TickMath.getSqrtRatioAtTick(twapTick);
    //}

    // Compute price based on sqrtPriceX96
    // Price = (sqrtPriceX96)^2 / (2^192)
    uint256 numerator_slot0 = uint256(sqrtPriceX96_slot0) * uint256(sqrtPriceX96_slot0);
    uint256 numerator_twap = uint256(sqrtPriceX96_twap) * uint256(sqrtPriceX96_twap);
    uint256 denominator = 2 ** 192;

    uint256 slot0_price =  denominator/ numerator_slot0;
    uint256 twap_price =  denominator/ numerator_twap; 


    if (twap_price == 0) {

        //emit PriceEvent(slot0_price);
        return slot0_price;

    } else {

        //emit PriceEvent(twap_price);
        return twap_price;

    }

    
}



function swapTokensforWETH(uint256 amountIn, address tokenAddress) public returns (uint256 amountOut) {

    require(amountIn > 0, "Amount must be greater than zero");

    TransferHelper.safeTransferFrom(tokenAddress, msg.sender, address(this), amountIn);

    // Verify the token balance of the sender
    uint256 tokenBalance = IERC20(tokenAddress).balanceOf(msg.sender);
    require(tokenBalance >= amountIn, "Insufficient token balance");

    // Approve the router to spend tokens
    require(IERC20(tokenAddress).approve(address(swapRouter), amountIn), "Approval failed");

    // Check if the pool exists (optional but recommended)
    address poolAddress = get_Pool(tokenAddress, weth, 10000);
    require(poolAddress != address(0), "Pool not found");

    //return executeSwap(weth, tokenAddress, amountIn, amountOutMinimum, msg.sender);
    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenAddress,
            tokenOut: weth,
            fee: 10000,
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);

        return amountOut;

}

function bundleSwap(
        ISwapRouter.ExactInputSingleParams calldata params1,
        ISwapRouter.ExactInputSingleParams calldata params2
    ) external payable {
        // First swap
        ISwapRouter(swapRouter).exactInputSingle{value: params1.amountIn}(params1);

        // Second swap
        ISwapRouter(swapRouter).exactInputSingle{value: params2.amountIn}(params2);
    }

    


}

interface ISwapRouter is IUniswapV3SwapCallback {
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