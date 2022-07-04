// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/ERC1238.sol";
import "../ERC1238/extensions/ERC1238URIStorage.sol";
import "../utils/AddressMinimal.sol";

contract ERC1238URIStorageMock is ERC1238, ERC1238URIStorage {
    using Address for address;

    constructor(string memory uri) ERC1238(uri) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1238, ERC1238URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setTokenURI(uint256 id, string calldata _tokenURI) external {
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
        uint256 approvalExpiry,
        string calldata uri,
        bytes calldata data
    ) external {
        _mintToEOA(to, id, amount, v, r, s, approvalExpiry, data);
        _setTokenURI(id, uri);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string calldata uri,
        bytes calldata data
    ) external {
        _mintToContract(to, id, amount, data);
        _setTokenURI(id, uri);
    }

    function mintBundle(
        address[] calldata to,
        uint256[][] calldata ids,
        uint256[][] calldata amounts,
        string[][] calldata uris,
        MintApprovalSignature[] calldata mintApprovalSignatures,
        bytes[] calldata data
    ) external {
        uint256 toLength = to.length;
        for (uint256 i = 0; i < toLength; i++) {
            _setBatchTokenURI(ids[i], uris[i]);

            if (to[i].isContract()) {
                _mintBatchToContract(to[i], ids[i], amounts[i], data[i]);
            } else {
                MintApprovalSignature calldata signature = mintApprovalSignatures[i];

                _mintBatchToEOA(
                    to[i],
                    ids[i],
                    amounts[i],
                    signature.v,
                    signature.r,
                    signature.s,
                    signature.approvalExpiry,
                    data[i]
                );
            }
        }
    }

    function burnAndDeleteURI(
        address from,
        uint256 id,
        uint256 amount
    ) external {
        super._burn(from, id, amount);

        _deleteTokenURI(id);
    }

    function burnBatchAndDeleteURIs(
        address from,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external {
        require(from != address(0), "ERC1238: burn from the zero address");

        uint256 idsLength = ids.length;
        require(idsLength == amounts.length, "ERC1238: ids and amounts length mismatch");

        address burner = msg.sender;

        for (uint256 i = 0; i < idsLength; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            _beforeBurn(burner, from, id, amount);

            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
            unchecked {
                _balances[id][from] = fromBalance - amount;
            }

            _deleteTokenURI(id);
        }

        emit BurnBatch(burner, from, ids, amounts);
    }
}
