// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "contracts/Staking.sol";


contract MyToken is ERC20 {

    uint256 public maxHolding;
    address swapRouter;
    address public factoryAddress;
    address public deadAddress = 0x000000000000000000000000000000000000dEaD;
    address positionManager;
    uint256 public MAX_WALLET_PERCENTAGE = 5;  // 5% max wallet
    uint256 public maxWalletAmount;
    bool public maxWalletEnabled = false;
    bool public launching = false;

    struct TokenList {
        address tokenAddress;
        bool maxWalletEnabled;
        address poolAddress;
    }

    TokenList[] public allTokens;

    mapping(address => uint256) private tokenIndex; // Maps tokenId to index in allTokens array
    mapping(address => uint256) private lastTxBlock; // Tracks the last block a wallet interacted
    mapping(bytes32 => bool) private processedTransactions; // Tracks processed transactions
    

function setLaunching(bool _launching) external onlyAuth {
    launching = _launching;
}


    modifier onlyAuth() {
        require(msg.sender == factoryAddress, "Caller is not authorized to enable max wallet");
        _;
    }

    constructor(string memory name, string memory symbol, uint256 totalSupply, address factory) ERC20(name, symbol) {
        
        maxHolding = (totalSupply * 10**18 * MAX_WALLET_PERCENTAGE) / 100; // 5% of total supply in wei

        factoryAddress = factory;

        // Initialize the token in the allTokens array
        allTokens.push(TokenList({
            tokenAddress: address(this),
            maxWalletEnabled: false,
            poolAddress: address(this)
        }));

        // Save the index of the new token details in the mapping
        tokenIndex[address(this)] = allTokens.length - 1;
        _mint(msg.sender, totalSupply * 10**18);
        
    }
    

    function enableMaxWalletLimit(address poolAddress) external onlyAuth{

        uint256 index = tokenIndex[address(this)];
        allTokens[index].maxWalletEnabled = true;
        allTokens[index].poolAddress = poolAddress;
        maxWalletAmount = (totalSupply() * MAX_WALLET_PERCENTAGE) / 100;
        maxWalletEnabled = true;
    }

mapping(uint256 => mapping(address => bool)) private blockProcessedTransactions;
    
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        
        uint256 index = tokenIndex[address(this)];

        // Skip checks for factory or during the launching phase
    if (launching || from == factoryAddress || to == factoryAddress) {
        super._update(from, to, value);
        return;
    }

         // Allow Uniswap router and the pool address to handle internal transfers
    if (msg.sender == swapRouter || msg.sender == allTokens[index].poolAddress) {
        super._update(from, to, value);
        return;
    }

    // Prevent bundled swaps by ensuring only one transfer per tx.origin per block
    if (tx.origin != from) {
        bytes32 txHash = keccak256(abi.encodePacked(tx.origin, block.number));
        require(!processedTransactions[txHash], "MyToken: Only one external transfer allowed per transaction");
        processedTransactions[txHash] = true;
    }

        // Check max holding limit for the recipient 
        if ( allTokens[index].maxWalletEnabled == true && to != factoryAddress && from != factoryAddress && to != deadAddress && to != address(this) && from != to && to != allTokens[index].poolAddress) {
            uint256 maxHoldings = (totalSupply() * MAX_WALLET_PERCENTAGE) / 100;
            uint256 toBalance = balanceOf(to);
            require( toBalance + value <= maxHoldings, "MyToken: Transfer amount exceeds the max holding limit");
        }

        super._update(from, to, value); 
    } 

    

    function resetProcessedTransactions() external {
        // Optional function to reset the mapping if needed for testing or specific scenarios
    }

}