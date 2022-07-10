// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";
import "./IERC1238Holdable.sol";
import "./IERC1238Holder.sol";

/**
 * @dev Proposal for ERC1238 tokens extension that allow addresses
 * to hold tokens on behalf of others.
 */
abstract contract ERC1238Holdable is IERC1238Holdable, ERC1238 {
    using Address for address;

    // Mapping holder => id => balance
    mapping(address => mapping(uint256 => uint256)) private _heldBalances;

    function heldBalance(address holder, uint256 id) public view override returns (uint256) {
        return _heldBalances[holder][id];
    }

    /**
     * @dev Hooks into the minting flow to set the token recipient as first holder
     * by default when tokens are minted.
     */
    function _beforeMint(
        address,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory
    ) internal virtual override {
        _heldBalances[to][id] += amount;
    }

    /**
     * @dev Burns `amount` of tokens that are held by `holder` and owned by `from`.
     * If `holder` is a smart contract and inherits {IERC1238Holder}, it notifies it to give it a chance to
     * react to the burn and handle the operation how it sees fit.
     *
     * Requirements:
     * - `holder` should hold at least the `amount` of tokens with the `id` passed
     */
    function _burnHeldTokens(
        address burner,
        address holder,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(_heldBalances[holder][id] >= amount, "ERC1238Holdable: Amount to burn exceeds amount held");

        if (holder.isContract()) {
            try IERC1238Holder(holder).onBurn(id, amount) returns (bool isBurnAcknowledged) {
                if (!isBurnAcknowledged) emit BurnAcknowledgmentFailed(holder, burner, from, id, amount);
            } catch {
                emit BurnAcknowledgmentFailed(holder, burner, from, id, amount);
            }
        }

        super._burn(from, id, amount);

        _heldBalances[holder][id] -= amount;
    }

    /**
     * @dev Lets sender entrusts `to` with `amount`
     * of tokens which gets transferred between their respective heldBalances
     */
    function _entrust(
        address to,
        uint256 id,
        uint256 amount
    ) internal virtual {
        address from = msg.sender;

        uint256 fromBalance = _heldBalances[from][id];
        require(fromBalance >= amount, "ERC1238Holdable: amount exceeds balance held");

        _heldBalances[from][id] -= amount;
        _heldBalances[to][id] += amount;

        emit Entrust(from, to, id, amount);
    }

    // TODO: Add a function to provide a safer alternative which
    // makes sure the recipient is a IERC1238Holder contract (same as idea as in IERC1238Receiver)
}
