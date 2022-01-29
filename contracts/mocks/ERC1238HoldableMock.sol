// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";
import "../ERC1238/extensions/ERC1238Holdable.sol";

/**
 * @dev Mock contract for ERC1238 tokens using ERC1238Holdable extension
 */
contract ERC1238HoldableMock is ERC1238, ERC1238Holdable {
    constructor(string memory uri) ERC1238(uri) {}

    function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1238, ERC1238Holdable) {
        super._beforeMint(minter, to, id, amount, data);
    }

    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1238, ERC1238Holdable) {
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

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address owner,
        uint256 id,
        uint256 amount
    ) public {
        _burn(owner, id, amount);
    }

    function burnBatch(
        address owner,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        _burnBatch(owner, ids, amounts);
    }

    function entrust(
        address to,
        uint256 id,
        uint256 amount
    ) public override {
        _entrust(to, id, amount);
    }
}
