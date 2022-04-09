// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC1238.sol";

/**
 * @dev Extension that enables packing a `baseId` inside a token id.
 * This is useful to track a set of tokens belonging to the same collection
 * represented by a shared `baseId`.
 */
interface IERC1238Packed is IERC1238 {
    /**
     * @dev Returns the balance of an address for a specific baseId
     */
    function balanceFromBaseId(address account, uint48 baseId) external view returns (uint256);

    /**
     * @dev Returns a token id based on its sub-components
     */
    function getConstructedTokenID(
        uint48 baseId,
        address account,
        uint48 counter
    ) external pure returns (uint256);
}
