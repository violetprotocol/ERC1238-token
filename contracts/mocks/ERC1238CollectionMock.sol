// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1238/extensions/ERC1238Collection.sol";

contract ERC1238CollectionMock is ERC1238, ERC1238Collection {
    constructor(string memory baseURI_) ERC1238(baseURI_) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1238, ERC1238Collection)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1238, ERC1238Collection) {
        return super._beforeMint(minter, to, id, amount, data);
    }

    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1238, ERC1238Collection) {
        return super._beforeBurn(burner, from, id, amount);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external {
        _mintToContract(to, id, amount, data);
    }

    function mintBatchToContract(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external {
        _mintBatchToContract(to, ids, amounts, data);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        _burn(from, id, amount);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        _burnBatch(from, ids, amounts);
    }
}
