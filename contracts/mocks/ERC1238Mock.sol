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

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        _mint(to, id, amount, data);
    }

    function mintBatch(
        address[] memory to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        _mintBatch(to, ids, amounts, data);
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
        address[] memory owners,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        _burnBatch(owners, ids, amounts);
    }

    function burnBatch(
        address owner,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        _burnBatch(owner, ids, amounts);
    }
}
