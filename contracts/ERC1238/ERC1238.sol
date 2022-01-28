// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC1238.sol";
import "./IERC1238Receiver.sol";
import "../utils/AddressMinimal.sol";

struct TokenCollection {
    bool fungible;
    mapping(address => uint256) fungibleBalances;
    mapping(uint256 => address) nonFungibleOwnership;
}

/**
 * @dev Implementation proposal for Non-Transferable Token (NTT/Badge)
 * See https://github.com/ethereum/EIPs/issues/1238
 */
contract ERC1238 is IERC1238 {
    using Address for address;

    // Mapping from token collection id to Token Collection
    mapping(uint256 => TokenCollection) internal _tokenCollections;

    // TODO: Add a mapping returning the number of tokens in circulation by token type?

    // Used as the URI by default for all token types by relying on ID substitution, e.g. https://token-cdn-domain/{id}.json
    string private baseURI;

    /**
     * @dev See {_setURI}.
     */
    constructor(string memory baseURI_) {
        _setBaseURI(baseURI_);
    }

    // TODO: Add support for ERC165
    // function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
    //     return
    //
    // }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function _baseURI() internal view virtual returns (string memory) {
        return baseURI;
    }

    /**
     * @dev See {IERC1238-balanceOf}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOfCollection(address account, uint256 tokenCollectionId)
        public
        view
        virtual
        override
        returns (uint256)
    {
        require(account != address(0), "ERC1238: balance query for the zero address");
        TokenCollection storage token = _tokenCollections[tokenCollectionId];

        return token.fungibleBalances[account];
    }

    function ownerOf(
        address account,
        uint256 tokenCollectionId,
        uint256 tokenId
    ) public view virtual override returns (address) {
        require(account != address(0), "ERC1238: balance query for the zero address");
        TokenCollection storage token = _tokenCollections[tokenCollectionId];
        require(token.fungible == false, "ERC1238: ownership query for fungible tokens");

        return token.nonFungibleOwnership[tokenId];
    }

    /**
     * @dev See {IERC1238-balanceOfBatch}.
     *
     * Requirements:
     *
     * - `accounts` and `ids` must have the same length.
     */
    function balanceOfBatch(address[] memory accounts, uint256[] memory tokenCollectionIds)
        public
        view
        virtual
        override
        returns (uint256[] memory)
    {
        require(accounts.length == tokenCollectionIds.length, "ERC1238: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOfCollection(accounts[i], tokenCollectionIds[i]);
        }

        return batchBalances;
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1238#metadata[defined in the EIP].
     *
     * By this mechanism, any occurrence of the `\{id\}` substring in either the
     * URI or any of the amounts in the JSON file at said URI will be replaced by
     * clients with the token type ID.
     *
     * For example, the `https://token-cdn-domain/\{id\}.json` URI would be
     * interpreted by clients as
     * `https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
     * for token type ID 0x4cce0.
     *
     * See {uri}.
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function _setBaseURI(string memory newBaseURI) internal virtual {
        baseURI = newBaseURI;
    }

    function _markTokensAsFungible(uint256 tokenCollectionId) internal {
        TokenCollection storage token = _tokenCollections[tokenCollectionId];

        token.fungible = true;
    }

    function _mintFungible(
        address to,
        uint256 tokenCollectionId,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1238: mint to the zero address");

        address minter = msg.sender;

        _beforeMint(minter, to, tokenCollectionId, amount, data);

        TokenCollection storage token = _tokenCollections[tokenCollectionId];

        require(token.fungible == true, "Using mintNonFungible for a fungible token");

        token.fungibleBalances[to] += amount;

        emit MintSingle(minter, to, tokenCollectionId, amount);

        _doSafeMintAcceptanceCheck(minter, to, tokenCollectionId, amount, data);
    }

    function _mintNonFungible(
        address to,
        uint256 tokenCollectionId,
        uint256 id,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1238: mint to the zero address");

        address minter = msg.sender;

        _beforeMint(minter, to, tokenCollectionId, 1, data);

        TokenCollection storage token = _tokenCollections[tokenCollectionId];

        require(token.fungible == false, "Using mintNonFungible for a fungible token");
        require(token.nonFungibleOwnership[id] == address(0x0), "Token already minted");

        token.nonFungibleOwnership[id] = to;
        token.fungibleBalances[to]++;

        emit MintSingle(minter, to, tokenCollectionId, 1);

        _doSafeMintAcceptanceCheck(minter, to, tokenCollectionId, 1, data);
    }

    /**
     * @dev [Batched] version of {_mint}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1238Receiver-onERC1238BatchMint} and return the
     * acceptance magic value.
     */
    function _mintBatch(
        address to,
        uint256[] memory tokenCollectionIds,
        bool[] memory isFungible,
        uint256[] memory amounts,
        uint256[] memory ids,
        bytes memory data
    ) internal virtual {
        require(to != address(0), "ERC1238: mint to the zero address");
        require(tokenCollectionIds.length == amounts.length, "ERC1238: ids and amounts length mismatch");

        address minter = msg.sender;

        for (uint256 i = 0; i < tokenCollectionIds.length; i++) {
            if (isFungible[i]) {
                _mintFungible(to, tokenCollectionIds[i], amounts[i], data);
            } else {
                _mintNonFungible(to, tokenCollectionIds[i], ids[i], data);
            }
        }

        emit MintBatch(minter, to, tokenCollectionIds, amounts);
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `from`
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     */
    function _burnFungible(
        address from,
        uint256 tokenCollectionId,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC1238: burn from the zero address");

        address burner = msg.sender;

        // _beforeBurn(burner, from, id, amount);

        TokenCollection storage tokenCollection = _tokenCollections[tokenCollectionId];

        uint256 fromBalance = tokenCollection.fungibleBalances[from];
        require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
        unchecked {
            tokenCollection.fungibleBalances[from] = fromBalance - amount;
        }

        // emit BurnSingle(burner, from, id, amount);
    }

    function _burnNonFungible(
        address from,
        uint256 tokenCollectionId,
        uint256 tokenId
    ) internal virtual {
        require(from != address(0), "ERC1238: burn from the zero address");

        address burner = msg.sender;

        // _beforeBurn(burner, from, id, amount);

        TokenCollection storage tokenCollection = _tokenCollections[tokenCollectionId];

        delete tokenCollection.nonFungibleOwnership[tokenId];

        // emit BurnSingle(burner, from, id, amount);
    }

    /**
     * @dev [Batched] version of {_burn}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     */
    // function _burnBatch(
    //     address from,
    //     uint256[] memory ids,
    //     uint256[] memory amounts
    // ) internal virtual {
    //     require(from != address(0), "ERC1238: burn from the zero address");
    //     require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");

    //     address burner = msg.sender;

    //     for (uint256 i = 0; i < ids.length; i++) {
    //         uint256 id = ids[i];
    //         uint256 amount = amounts[i];

    //         _beforeBurn(burner, from, id, amount);

    //         uint256 fromBalance = _balances[id][from];
    //         require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
    //         unchecked {
    //             _balances[id][from] = fromBalance - amount;
    //         }
    //     }

    //     emit BurnBatch(burner, from, ids, amounts);
    // }

    function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {}

    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {}

    function _doSafeMintAcceptanceCheck(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.isContract()) {
            try IERC1238Receiver(to).onERC1238Mint(minter, id, amount, data) returns (bytes4 response) {
                if (response != IERC1238Receiver.onERC1238Mint.selector) {
                    revert("ERC1238: ERC1238Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1238: transfer to non ERC1238Receiver implementer");
            }
        }
    }

    function _doSafeBatchMintAcceptanceCheck(
        address minter,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        if (to.isContract()) {
            try IERC1238Receiver(to).onERC1238BatchMint(minter, ids, amounts, data) returns (bytes4 response) {
                if (response != IERC1238Receiver.onERC1238BatchMint.selector) {
                    revert("ERC1238: ERC1238Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1238: transfer to non ERC1238Receiver implementer");
            }
        }
    }

    // Could have that in a library instead of redeploying it every time?
    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }
}
