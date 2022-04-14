// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC1238.sol";

/**
 * @dev Proposal of an interface for ERC1238 tokens that can be held by another address than
 * than their owner or staked in a smart contract.
 */
interface IERC1238Holdable is IERC1238 {
    /**
     * @dev Event emitted when `from` entrusts `to` with `amount` of tokens with token `id`.
     */
    event Entrust(address from, address to, uint256 indexed id, uint256 amount);

    /**
     * @dev Returns the balance of a token holder for a given `id`.
     */
    function heldBalance(address holder, uint256 id) external view returns (uint256);

    function entrust(
        address to,
        uint256 id,
        uint256 amount
    ) external;
}
