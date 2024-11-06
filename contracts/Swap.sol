// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";

contract Swap {
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

    // Function to approve another contract or address to manage a specific token
    function approveToken(address token, address spender, uint256 amount) internal {
    require(IERC20(token).approve(spender, amount), "Approval failed");
}

     // Function to find the optimal fee tier by checking available pools
    function getOptimalFee(address tokenIn, address tokenOut) public view returns (uint24) {
        for (uint256 i = 0; i < feeTiers.length; i++) {
            address pool = uniswapFactory.getPool(tokenIn, tokenOut, feeTiers[i]);
            if (pool != address(0)) {
                return feeTiers[i]; // Return the first available pool with liquidity
            }
        }
        revert("No pool available for the token pair with specified fee tiers.");
    }

    function getEstimatedAmountOut(
    address tokenIn, 
    address tokenOut, 
    uint256 amountIn
) public returns (uint256 amountOut) {

    uint24 optimalFee = getOptimalFee(tokenIn, tokenOut); // Get the optimal fee tier

    // Call quoteExactInputSingle from QuoterV2
    IQuoterV2.QuoteExactInputSingleParams memory params = IQuoterV2.QuoteExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: optimalFee,
        sqrtPriceLimitX96: 0
    });

    // Call the QuoterV2 to get the amountOut
    (amountOut,,,) = quoter.quoteExactInputSingle(params);

    return amountOut;
}


function swapWETHforTokens(uint256 amountIn, address tokenAddress) external payable returns (uint256 amountOut) {
    //uint256 estimatedAmountOut = getEstimatedAmountOut(weth, tokenAddress, amountIn);
    //uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance
    //IERC20(weth).approve(address(swapRouter), amountIn);
approveToken(weth, address(swapRouter), amountIn);

    //return executeSwap(weth, tokenAddress, amountIn, amountOutMinimum, msg.sender);
    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: weth,
            tokenOut: tokenAddress,
            fee: 10000,
            recipient: msg.sender,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        amountOut = swapRouter.exactInputSingle(params);

        return amountOut;

}


    function swapTokensForWETH(uint256 amountIn, address tokenAddress) external returns (uint256) {
    uint256 estimatedAmountOut = getEstimatedAmountOut(tokenAddress, weth, amountIn);
    uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance
    IERC20(tokenAddress).approve(address(swapRouter), amountIn);
    return executeSwap(tokenAddress, weth, amountIn, amountOutMinimum, msg.sender);

}


// Function to execute swap
    function executeSwap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 amountOutMinimum, 
        address recipient
    ) internal returns (uint256 amountOut) {
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
        //emit TokensSwapped(amountOut);
        return amountOut;
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