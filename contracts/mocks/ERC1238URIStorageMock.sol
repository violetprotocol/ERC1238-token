// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";
import "../ERC1238/extensions/ERC1238URIStorage.sol";
import "../utils/AddressMinimal.sol";

contract ERC1238URIStorageMock is ERC1238, ERC1238URIStorage {
    using Address for address;

    constructor(string memory uri) ERC1238(uri) {}

    function setTokenURI(uint256 id, string memory _tokenURI) external {
        _setTokenURI(id, _tokenURI);
    }

    function deleteTokenURI(uint256 id) external {
        _deleteTokenURI(id);
    }

    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string memory uri,
        bytes memory data
    ) external {
        _mintToEOA(to, id, amount, v, r, s, data);
        _setTokenURI(id, uri);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string memory uri,
        bytes memory data
    ) external {
        _mintToContract(to, id, amount, data);
        _setTokenURI(id, uri);
    }

    function mintBundle(
        address[] memory to,
        uint256[][] memory ids,
        uint256[][] memory amounts,
        string[][] memory uris,
        bytes[] memory data
    ) external {
        for (uint256 i = 0; i < to.length; i++) {
            _setBatchTokenURI(ids[i], uris[i]);

            if (to[i].isContract()) {
                _mintBatchToContract(to[i], ids[i], amounts[i], data[i]);
            } else {
                (bytes32 r, bytes32 s, uint8 v) = splitSignature(data[i]);
                _mintBatchToEOA(to[i], ids[i], amounts[i], v, r, s, data[i]);
            }
        }
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
