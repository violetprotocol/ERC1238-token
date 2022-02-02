// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";
import "./IERC1238URIStorage.sol";

/**
 * @dev Proposal for ERC1238 token with storage based token URI management.
 */
abstract contract ERC1238URIStorage is IERC1238URIStorage, ERC1238 {
    // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    /**
     * @dev See {IERC1238URIStorage-tokenURI}.
     */
    function tokenURI(uint256 id) public view virtual override returns (string memory) {
        string memory _tokenURI = _tokenURIs[id];

        // Returns the token URI if there is a specific one set that overrides the base URI
        if (_isTokenURISet(id)) {
            return _tokenURI;
        }

        string memory base = _baseURI();

        return base;
    }

    /**
     * @dev Sets `_tokenURI` as the token URI for the tokens of type `id`.
     *
     */
    function _setTokenURI(uint256 id, string memory _tokenURI) internal virtual {
        _tokenURIs[id] = _tokenURI;

        emit URI(id, _tokenURI);
    }

    /**
     * @dev Deletes the tokenURI for the tokens of type `id`.
     *
     * Requirements:
     *  - A token URI must be set.
     *
     *  Possible improvement:
     *  - The URI can only be deleted if all tokens of type `id` have been burned.
     */
    function _deleteTokenURI(uint256 id) internal virtual {
        if (_isTokenURISet(id)) {
            delete _tokenURIs[id];
        }
    }

    /**
     * @dev Returns whether a tokenURI is set or not for a specific `id` token type.
     *
     */
    function _isTokenURISet(uint256 id) private view returns (bool) {
        return bytes(_tokenURIs[id]).length > 0;
    }

    /**
     * @dev Creates `amount` tokens of token type `id` and URI `uri`, and assigns them to `to`.
     *
     * Emits a {MintSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1238Receiver-onERC1238Mint} and return the
     * acceptance magic value.
     */
    function _mintWithURI(
        address to,
        uint256 id,
        uint256 amount,
        string memory uri,
        bytes memory data
    ) internal virtual {
        _mint(to, id, amount, data);
        _setTokenURI(id, uri);
    }

    function _mintBatchWithURI(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        string[] memory uris,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1238: mint to the zero address");
        require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");
        require(ids.length == uris.length, "ERC1238: ids and URIs length mismatch");

        address minter = msg.sender;

        for (uint256 i = 0; i < ids.length; i++) {
            _beforeMint(minter, to, ids[i], amounts[i], data);

            _setTokenURI(ids[i], uris[i]);

            _balances[ids[i]][to] += amounts[i];
        }

        emit MintBatch(minter, to, ids, amounts);

        _doSafeBatchMintAcceptanceCheck(minter, to, ids, amounts, data);
    }

    /**
     * @dev Destroys `id` and deletes its associated URI.
     *
     * Requirements:
     *  - A token URI must be set.
     *  - All tokens of this type must have been burned.
     */
    function _burnAndDeleteURI(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        super._burn(from, id, amount);

        _deleteTokenURI(id);
    }

    function _burnBatchAndDeleteURIs(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual {
        require(from != address(0), "ERC1238: burn from the zero address");
        require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");

        address burner = msg.sender;

        for (uint256 i = 0; i < ids.length; i++) {
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
