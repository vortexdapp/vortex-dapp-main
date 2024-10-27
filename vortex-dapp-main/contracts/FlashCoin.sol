// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FlashCoin is ERC20 {
    mapping(address => uint256) private _temporaryBalances;
    mapping(address => uint256) private _expiryTimes;
    address public owner;

    event FlashCoinSent(address indexed recipient, uint256 amount, uint256 expiryTime);
    event FlashCoinExpired(address indexed recipient, uint256 amount);

    uint256 public constant EXPIRY_DURATION = 5 minutes; // Customize the expiry time as needed

    // Updated constructor to accept name and symbol as arguments
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 61792161263 * 10 ** decimals()); // Mint initial supply to the contract owner
        owner = msg.sender;
    }

    // Function to create temporary flash balance for a user
    function sendFlashCoins(address recipient, uint256 amount) external {
        require(balanceOf(owner) >= amount, "Not enough FlashCoin in owner's account");

        // Transfer flash balance to recipient and set expiry time
        _temporaryBalances[recipient] += amount;
        _expiryTimes[recipient] = block.timestamp + EXPIRY_DURATION;

        emit FlashCoinSent(recipient, amount, _expiryTimes[recipient]);
    }

    // Function to view temporary balance for display purposes
    function flashBalanceOf(address account) external view returns (uint256) {
        if (_expiryTimes[account] > block.timestamp) {
            return _temporaryBalances[account];
        } else {
            return 0;
        }
    }

    // Internal function to clear expired balances
    function _clearExpiredBalances(address account) internal {
        if (_expiryTimes[account] <= block.timestamp && _temporaryBalances[account] > 0) {
            emit FlashCoinExpired(account, _temporaryBalances[account]);
            _temporaryBalances[account] = 0;
        }
    }

    // Override balanceOf to include temporary flash balances
    function balanceOf(address account) public view override returns (uint256) {
        uint256 baseBalance = super.balanceOf(account);
        uint256 flashBalance = (block.timestamp < _expiryTimes[account]) ? _temporaryBalances[account] : 0;
        return baseBalance + flashBalance;
    }

    // Manually trigger expiry checks (or set up automated expiry via a contract call)
    function expireFlashCoins(address account) external {
        _clearExpiredBalances(account);
    }
}
