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
        uint256 i = 0;

        // Use a while loop instead of for
        while (i < _holders.length) {
            uint256 reward = (totalRewards * _balances[i]) / totalSupply;
            if (reward > 0) {
                bool success = payable(_holders[i]).send(reward);
                require(success, "Transfer failed");
            }
            i++;
        }
    }
}
