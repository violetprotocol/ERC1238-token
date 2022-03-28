// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC1238.sol";
import "./IERC1238Receiver.sol";
import "../utils/AddressMinimal.sol";

/**
 * @dev Implementation proposal for non-transferable (Badge) tokens
 * See https://github.com/ethereum/EIPs/issues/1238
 */
contract ERC1238 is IERC1238 {
    using Address for address;

    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) internal _balances;

    // Used as the URI by default for all token types by relying on ID substitution,
    // e.g. https://token-cdn-domain/{id}.json
    string private baseURI;

    /**
     * @dev Initializes the contract by setting a `baseURI`.
     * See {_setBaseURI}
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
     * @dev This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism as in EIP-1155:
     * https://eips.ethereum.org/EIPS/eip-1155#metadata
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
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        require(account != address(0), "ERC1238: balance query for the zero address");
        return _balances[id][account];
    }

    /**
     * @dev See {IERC1238-balanceOfBatch}.
     *
     * Requirements:
     *
     * - `accounts` and `ids` must have the same length.
     */
    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
        public
        view
        virtual
        override
        returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "ERC1238: accounts and ids length mismatch");

        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism as in EIP-1155
     * https://eips.ethereum.org/EIPS/eip-1155#metadata
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
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function _setBaseURI(string memory newBaseURI) internal virtual {
        baseURI = newBaseURI;
    }

    function _mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes memory data
    ) internal virtual {
        bytes32 mintHash = keccak256(abi.encode(to, id, amount, block.chainid, address(this)));
        _verifyMintingApproval(to, mintHash, v, r, s);

        _mint(to, id, amount, data);
    }

    function _mintBatchToEOA(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        uint8 v,
        bytes32 r,
        bytes32 s,
        bytes memory data
    ) internal virtual {
        bytes32 mintHash = keccak256(abi.encode(to, ids, amounts, block.chainid, address(this)));
        _verifyMintingApproval(to, mintHash, v, r, s);

        _mintBatch(to, ids, amounts, data);
    }

    function _mintToSmartContract(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        require(to.isContract(), "ERC1238: Recipient is not a contract");

        _mint(to, id, amount, data);

        _doSafeMintAcceptanceCheck(msg.sender, to, id, amount, data);
    }

    function _mintBatchToSmartContract(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {
        require(to.isContract(), "ERC1238: Recipient is not a contract");

        _mintBatch(to, ids, amounts, data);

        _doSafeBatchMintAcceptanceCheck(msg.sender, to, ids, amounts, data);
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {MintSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1238Receiver-onERC1238Mint} and return the
     * acceptance magic value.
     *
     * Emits a {MintSingle} event.
     */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        require(to != address(0), "ERC1238: mint to the zero address");

        address minter = msg.sender;

        _beforeMint(minter, to, id, amount, data);

        _balances[id][to] += amount;
        emit MintSingle(minter, to, id, amount);
    }

    /**
     * @dev [Batched] version of {_mint}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1238Receiver-onERC1238BatchMint} and return the
     * acceptance magic value.
     *
     * Emits a {MintBatch} event.
     */
    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        require(to != address(0), "ERC1238: mint to the zero address");
        require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");

        address minter = msg.sender;

        for (uint256 i = 0; i < ids.length; i++) {
            _beforeMint(minter, to, ids[i], amounts[i], data);

            _balances[ids[i]][to] += amounts[i];
        }

        emit MintBatch(minter, to, ids, amounts);
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `from`
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     *
     * Emits a {BurnSingle} event.
     */
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC1238: burn from the zero address");

        address burner = msg.sender;

        _beforeBurn(burner, from, id, amount);

        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
        unchecked {
            _balances[id][from] = fromBalance - amount;
        }

        emit BurnSingle(burner, from, id, amount);
    }

    /**
     * @dev [Batched] version of {_burn}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     *
     * Emits a {BurnBatch} event.
     */
    function _burnBatch(
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
        }

        emit BurnBatch(burner, from, ids, amounts);
    }

    /**
     * @dev Hook that is called before an `amount` of tokens are minted.
     *
     * Calling conditions:
     * - `minter` and `to` cannot be the zero address
     *
     */
    function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {}

    /**
     * @dev Hook that is called before an `amount` of tokens are burned.
     *
     * Calling conditions:
     * - `minter` and `to` cannot be the zero address
     *
     */
    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {}

    function _verifyMintingApproval(
        address to,
        bytes32 mintHash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private pure {
        require(to == ecrecover(mintHash, v, r, s), "ERC1238: Invalid signature for minting approval");
    }

    function _doSafeMintAcceptanceCheck(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
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

    function _doSafeBatchMintAcceptanceCheck(
        address minter,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
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

    // Could have that in a library instead of redeploying it every time?
    function _asSingletonArray(uint256 element) private pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }
}
