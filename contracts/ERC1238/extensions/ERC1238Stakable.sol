// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";

/**
 * @dev Proposal for ERC1238 tokens extension that make them 'stakable'
 */
abstract contract ERC1238Stakable is ERC1238 {
    // Mapping owner => token id => stakeholder => stake size
    mapping(address => mapping(uint256 => mapping(address => uint256))) private _stakes;

    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal view virtual override {
        require(burner == from || _stakes[from][id][burner] >= amount, "ERC1238Stakable: Unauthorized to burn tokens");
    }

    /**
     * @dev Allows token owners to put their tokens at stake
     *
     * Calling this function again with the same stakeholder and id
     * overrides the previous given allowance
     *
     * Requirements:
     *
     *
     */
    function _increaseStake(
        address stakeholder,
        uint256 id,
        uint256 amount
    ) internal {
        _stakes[msg.sender][id][stakeholder] += amount;
    }

    function _decreaseStake(
        address owner,
        uint256 id,
        uint256 amount
    ) internal {
        uint256 authorization = _stakes[owner][id][msg.sender];

        require(authorization >= amount, "ERC1238Stakable: cannot decrease more than current stake");
        unchecked {
            _stakes[owner][id][msg.sender] = authorization - amount;
        }
    }

    function stakeOf(
        address owner,
        uint256 id,
        address stakeholder
    ) public view returns (uint256) {
        return _stakes[owner][id][stakeholder];
    }
}
