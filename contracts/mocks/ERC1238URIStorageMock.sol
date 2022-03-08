// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";
import "../ERC1238/extensions/ERC1238URIStorage.sol";

contract ERC1238URIStorageMock is ERC1238, ERC1238URIStorage {
    constructor(string memory uri) ERC1238(uri) {}

    function setTokenURI(uint256 id, string memory _tokenURI) external {
        _setTokenURI(id, _tokenURI);
    }

    function deleteTokenURI(uint256 id) external {
        _deleteTokenURI(id);
    }

    function mintWithURI(
        address to,
        uint256 id,
        uint256 amount,
        string memory uri,
        bytes memory data
    ) external {
        _mintWithURI(to, id, amount, uri, data);
    }

    function mintBatchWithURI(
        address[] memory to,
        uint256[] memory ids,
        uint256[] memory amounts,
        string[] memory uris,
        bytes memory data
    ) external {
        _mintBatchWithURI(to, ids, amounts, uris, data);
    }

    function burnAndDeleteURI(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        _burnAndDeleteURI(from, id, amount);
    }

    function burnBatchAndDeleteURIs(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external {
        _burnBatchAndDeleteURIs(from, ids, amounts);
    }
}
