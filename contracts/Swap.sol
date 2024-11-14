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

    uint24 optimalFee = getOptimalFee(tokenIn, tokenOut); // Get the optimal fee tier

    require(optimalFee > 0, "No valid pool found for the token pair");

    // Call quoteExactInputSingle from QuoterV2
    IQuoterV2.QuoteExactInputSingleParams memory params = IQuoterV2.QuoteExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amountIn,
        fee: optimalFee,
        sqrtPriceLimitX96: 0
    });

    try quoter.quoteExactInputSingle(params) returns (uint256 outAmount, uint160, uint32, uint256) {
    amountOut = outAmount;
} catch {
    revert("Quoter call failed or no available liquidity for the pair");
}


    return amountOut;
}


function swapWETHforTokens(uint256 amountIn, address tokenAddress) public payable returns (uint256 amountOut) {

     uint256 estimatedAmountOut = getEstimatedAmountOut(weth, tokenAddress, amountIn);
    uint256 amountOutMinimum = estimatedAmountOut * 95 / 100; // 5% slippage tolerance
    /*
    uint24 optimalFee = getOptimalFee(weth, tokenAddress);
    require(optimalFee > 0, "No valid pool found for the token pair"); */

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


function externalFunction(uint256 amountIn, address tokenAddress) public returns (uint256 ethReceived) {
        ethReceived = swapTokensforWETH(amountIn, tokenAddress);
    } 

function swapTokensforWETH(uint256 amountIn, address tokenAddress) public returns (uint256 amountOut) {

    require(amountIn > 0, "Amount must be greater than zero");

    TransferHelper.safeTransferFrom(tokenAddress, msg.sender, address(this), amountIn);

    require(IERC20(tokenAddress).approve(address(swapRouter), amountIn), "Approval failed");

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