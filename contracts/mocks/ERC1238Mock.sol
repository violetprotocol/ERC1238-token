// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";

/**
 * @title ERC1238Mock
 * This mock just publicizes internal functions for testing purposes
 */
contract ERC1238Mock is ERC1238 {
    constructor(string memory uri) ERC1238(uri) {}

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function setBaseURI(string memory newURI) public {
        _setBaseURI(newURI);
    }

    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes memory data
    ) external {
        _mintToEOA(to, id, amount, v, r, s, data);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external {
        _mintToContract(to, id, amount, data);
    }

    function mintBatchToEOA(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes memory data
    ) external {
        _mintBatchToEOA(to, ids, amounts, v, r, s, data);
    }

    function mintBatchToContract(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes memory data
    ) external {
        _mintBatchToContract(to, ids, amounts, data);
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
}
