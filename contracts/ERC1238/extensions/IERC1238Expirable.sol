// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../IERC1238.sol";

/**
 * @dev Interface for ERC1238 tokens with an expiry date.
 * The dates are stored as unix timestamps in seconds.
 */
interface IERC1238Expirable is IERC1238 {
    /**
     * @dev Returns the expiry date for tokens with a given `id`.
     */
    function expiryDate(uint256 id) external view returns (uint256);

    /**
     * @dev Returns whether tokens are expired by comparing their expiry date with `block.timestamp`.
     */
    function isExpired(uint256 id) external view returns (bool);
}
