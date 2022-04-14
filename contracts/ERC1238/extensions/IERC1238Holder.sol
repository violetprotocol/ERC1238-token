// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC1238.sol";
import "../IERC1238Receiver.sol";

/**
 * @dev Interface proposal for contracts that need to hold ERC1238 tokens.
 */
interface IERC1238Holder is IERC1238Receiver {
    /**
     * @dev This function is called when tokens with id `id` are burnt.
     */
    function onBurnAcknowledged(uint256 id, uint256 amount) external returns (bool);
}
