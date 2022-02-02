// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";

/**
 * @dev Proposal for ERC1238 tokens extension that make them 'stakable'
 */
abstract contract ERC1238Stakable is ERC1238 {
    // Mapping owner => token id => stakeholder => stake size
    mapping(address => mapping(uint256 => mapping(address => uint256))) private _stakes;

    function stakeOf(
        address owner,
        uint256 id,
        address stakeholder
    ) public view returns (uint256) {
        return _stakes[owner][id][stakeholder];
    }

    /**
     * @dev Called before tokens are burned
     *
     * Requirements:
     * - `burner` and `from` are the same account OR
     * - `from` entrusted `burner` with at least `amount` of tokens with id `id`
     */
    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual override {
        if (burner != from) {
            require(_stakes[from][id][burner] >= amount, "ERC1238Stakable: Unauthorized to burn tokens");
            _decreaseStakeFrom(burner, from, id, amount);
        }
    }

    /**
     * @dev Allows token owners to put their tokens at stake
     *
     * Calling this function again with the same stakeholder and id
     * adds to the previous staked amount
     *
     */
    function _increaseStake(
        address stakeholder,
        uint256 id,
        uint256 amount
    ) internal {
        _stakes[msg.sender][id][stakeholder] += amount;
    }

    /**
     * @dev Lets sender (stakeholder) decrease a staked `amount` of
     * tokens with id `id` belonging to `owner`
     *
     * Requirements:
     *
     * - `amount` must be less that the current staked amount
     */
    function _decreaseStake(
        address owner,
        uint256 id,
        uint256 amount
    ) internal {
        _decreaseStakeFrom(msg.sender, owner, id, amount);
    }

    function _decreaseStakeFrom(
        address stakeholder,
        address owner,
        uint256 id,
        uint256 amount
    ) private {
        uint256 authorization = _stakes[owner][id][stakeholder];

        require(authorization >= amount, "ERC1238Stakable: cannot decrease more than current stake");
        unchecked {
            _stakes[owner][id][stakeholder] = authorization - amount;
        }
    }
}
