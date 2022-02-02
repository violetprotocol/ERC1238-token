// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";
import "../ERC1238/extensions/ERC1238Stakable.sol";

/**
 * @dev Mock contract for ERC1238 tokens using ERC1238Stakable extension rendering them 'stakable'
 */
contract ERC1238StakableMock is ERC1238, ERC1238Stakable {
    constructor(string memory uri) ERC1238(uri) {}

    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1238, ERC1238Stakable) {
        super._beforeBurn(burner, from, id, amount);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        _mint(to, id, amount, data);
    }

    function burn(
        address owner,
        uint256 id,
        uint256 amount
    ) public {
        _burn(owner, id, amount);
    }

    function increaseStake(
        address stakeholder,
        uint256 id,
        uint256 amount
    ) external {
        _increaseStake(stakeholder, id, amount);
    }

    function decreaseStake(
        address owner,
        uint256 id,
        uint256 amount
    ) external {
        _decreaseStake(owner, id, amount);
    }
}
