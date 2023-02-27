// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";
import "../ERC1238/extensions/ERC1238Expirable.sol";
import "../utils/AddressMinimal.sol";

contract ERC1238ExpirableMock is ERC1238, ERC1238Expirable {
    using Address for address;

    constructor(string memory uri) ERC1238(uri) {}

    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 expiryDate,
        bytes memory data
    ) external {
        _mintToEOA(to, id, amount, v, r, s, data);
        _setExpiryDate(id, expiryDate);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        uint256 expiryDate,
        bytes memory data
    ) external {
        _mintToContract(to, id, amount, data);
        _setExpiryDate(id, expiryDate);
    }

    function mintBundle(
        address[] memory to,
        uint256[][] memory ids,
        uint256[][] memory amounts,
        uint256[][] memory expiryDates,
        bytes[] memory data
    ) external {
        for (uint256 i = 0; i < to.length; i++) {
            _setBatchExpiryDates(ids[i], expiryDates[i]);

            if (to[i].isContract()) {
                _mintBatchToContract(to[i], ids[i], amounts[i], data[i]);
            } else {
                (bytes32 r, bytes32 s, uint8 v) = splitSignature(data[i]);
                _mintBatchToEOA(to[i], ids[i], amounts[i], v, r, s, data[i]);
            }
        }
    }
}
