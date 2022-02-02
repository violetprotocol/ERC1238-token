// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";
import "./IERC1238Holdable.sol";

/**
 * @dev Proposal for ERC1238 tokens extension that allow addresses
 * to hold tokens on behalf of others (escrow)
 */
abstract contract ERC1238Holdable is IERC1238Holdable, ERC1238 {
    // Mapping holder => id => balance
    mapping(address => mapping(uint256 => uint256)) private _escrowedBalances;

    function escrowedBalance(address holder, uint256 id) public view override returns (uint256) {
        return _escrowedBalances[holder][id];
    }

    function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        // set the token recipient as first holder by default when tokens are minted
        _escrowedBalances[to][id] += amount;
    }

    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual override {
        require(burner == from, "ERC1238Holdable: Unauthorized to burn tokens");
        require(_escrowedBalances[burner][id] >= amount, "ERC1238Holdable: Amount to burn exceeds amount held");

        _escrowedBalances[burner][id] -= amount;
    }

    /**
     * @dev Lets sender entrusts `to` with `amount`
     * of tokens which gets transferred between their respective escrowedBalances
     *
     */
    function _entrust(
        address to,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(to != address(0), "ERC1238Holdable: transfer to the zero address");

        address from = msg.sender;

        uint256 fromBalance = _escrowedBalances[from][id];
        require(fromBalance >= amount, "ERC1238Holdable: amount exceeds balance held");

        _escrowedBalances[from][id] -= amount;
        _escrowedBalances[to][id] += amount;

        emit Entrust(from, to, id, amount);
    }
}
