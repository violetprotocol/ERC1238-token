// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1238/extensions/ERC1238URIStorage.sol";
import "../utils/AddressMinimal.sol";

contract Badge is ERC1238, ERC1238URIStorage {
    using Address for address;
    address public owner;

    constructor(address owner_, string memory baseURI_) ERC1238(baseURI_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: sender is not the owner");
        _;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address for new owner");
        owner = newOwner;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _setBaseURI(newBaseURI);
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
    ) external onlyOwner {
        _mintToEOA(to, id, amount, v, r, s, data);
        _setTokenURI(id, uri);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string memory uri,
        bytes memory data
    ) external onlyOwner {
        _mintToContract(to, id, amount, data);
        _setTokenURI(id, uri);
    }

    function mintBundle(
        address[] memory to,
        uint256[][] memory ids,
        uint256[][] memory amounts,
        string[][] memory uris,
        bytes[] memory data
    ) external onlyOwner {
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

    function burn(
        address from,
        uint256 id,
        uint256 amount,
        bool deleteURI
    ) external onlyOwner {
        if (deleteURI) {
            _burnAndDeleteURI(from, id, amount);
        } else {
            _burn(from, id, amount);
        }
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts,
        bool deleteURI
    ) external onlyOwner {
        if (deleteURI) {
            _burnBatchAndDeleteURIs(from, ids, amounts);
        } else {
            _burnBatch(from, ids, amounts);
        }
    }
}
