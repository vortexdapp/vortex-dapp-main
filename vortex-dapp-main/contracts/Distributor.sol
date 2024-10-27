// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract RewardDistributor {

    address public owner;
    uint256 public constant totalSupply = 1000000000 * 10**18; // Constant to save gas

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function distributeRewards(address[] calldata _holders, uint256[] calldata _balances) public payable {
        //require(msg.sender == owner, "Only owner can distribute rewards");
        require(_holders.length == _balances.length, "Mismatch between holders and balances");

        uint256 totalRewards = msg.value;           // Total ETH available for distribution

        for (uint i = 0; i < _holders.length; i++) {
            uint256 reward = (totalRewards * (_balances[i])) / totalSupply; // Calculate reward based on balance
            if (reward > 0) {
                (bool success, ) = _holders[i].call{value: reward}("");
                require(success, "Transfer failed");
            }
        }
    }
}
