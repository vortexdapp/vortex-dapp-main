// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract LiquidityLocker is ERC721Holder {
    struct Lock {
        uint256 tokenId;
        bool isLocked;
        uint256 lockID;
        uint256 unlockTime;
    }

    address public owner;
    mapping(uint256 => Lock) public locks;
    uint256 public nextLockId = 0;
    INonfungiblePositionManager public positionManager;
    address nftAddress;
    address public factoryAddress;

    event LiquidityLocked(uint256 indexed lockId, address indexed tokenAddress, uint256 tokenId, uint256 unlockTime);
    event LiquidityUnlocked(uint256 indexed lockId, address indexed tokenAddress, uint256 tokenId);
    event FeesCollected(uint256, uint256, uint256);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyAuth() {
        require(msg.sender == owner || msg.sender == factoryAddress, "Caller is not authorized");
        _;
    }

    // Set the factory address
    function setFactoryAddress(address _factoryAddress) external onlyOwner {
        factoryAddress = _factoryAddress;
    }

    constructor(address _positionManager) {
        owner = msg.sender; // Set the owner to the deployer of the contract
        positionManager = INonfungiblePositionManager(_positionManager);
        nftAddress = _positionManager;
        
    }


    // Locks the liquidity NFT
    function lockLiquidity(address _nftAddress, uint256 _tokenId, uint256 _duration, address factory) external onlyAuth returns (uint256 lockId) {
        require(_nftAddress != address(0), "Invalid NFT address");

        // Transfer the NFT from the sender to this contract
        IERC721(_nftAddress).transferFrom(factory, address(this), _tokenId);

        uint256 unlockTime = block.timestamp + _duration;

        lockId = nextLockId++;

        locks[lockId] = Lock({
            tokenId: _tokenId,
            isLocked: true,
            lockID: lockId,
            unlockTime: unlockTime
        });

        emit LiquidityLocked(lockId, _nftAddress, _tokenId, unlockTime);

        return lockId;
    }

    // Unlocks the liquidity NFT (if lock time has passed)
    function unlockLiquidity(uint256 _lockId, address factory) external onlyAuth {
        Lock storage lock = locks[_lockId];
        require(block.timestamp >= lock.unlockTime, "Liquidity is still locked");

        uint256 token_Id = lock.tokenId;

        // Transfer the NFT back to the owner
        IERC721(nftAddress).transferFrom(address(this), factory, token_Id);

        delete locks[_lockId]; // Clean up the storage

        emit LiquidityUnlocked(_lockId, nftAddress, token_Id);

    }

    // Function to approve the factory contract to manage the locked NFT
    function approveFactory(address factory, uint256 tokenId) external onlyOwner{
        IERC721(nftAddress).approve(factory, tokenId);
    }

// Function to collect fees from the locked NFT
    function collectFees(uint256 tokenId, address factory) external onlyAuth returns (uint256 amount0, uint256 amount1) {
        INonfungiblePositionManager.CollectParams memory params =
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: factory,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });

        (amount0, amount1) = positionManager.collect(params);

        emit FeesCollected(tokenId, amount0, amount1);

        return (amount0, amount1);
    }


    // Utility function to change ownership
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
}
