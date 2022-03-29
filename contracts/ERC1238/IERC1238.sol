// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Interface proposal for Badge tokens
 * See https://github.com/ethereum/EIPs/issues/1238
 */
interface IERC1238 {
    /**
     * @dev Emitted when `amount` tokens of token type `id` are minted to `to` by `minter`.
     */
    event MintSingle(address indexed minter, address indexed to, uint256 indexed id, uint256 amount);

    /**
     * @dev Equivalent to multiple {MintSingle} events, where `minter` and `to` is the same for all token types
     */
    event MintBatch(address indexed minter, address indexed to, uint256[] ids, uint256[] amounts);

    /**
     * @dev Emitted when `amount` tokens of token type `id` owned by `owner` are burned by `burner`.
     */
    event BurnSingle(address indexed burner, address indexed owner, uint256 indexed id, uint256 amount);

    /**
     * @dev Equivalent to multiple {BurnSingle} events, where `owner` and `burner` is the same for all token types
     */
    event BurnBatch(address indexed burner, address indexed owner, uint256[] ids, uint256[] amounts);

    /**
     * @dev Returns the amount of tokens of token type `id` owned by `account`.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) external view returns (uint256);

    /**
     * @dev [Batched] version of {balanceOf}.
     *
     * Requirements:
     *
     * - `accounts` and `ids` must have the same length.
     */
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory);

    /**
     * @dev Returns the hash of the mint approval message for a single token id and amount.
     * Before being signed by an EOA to approve token minting and express consent,
     * the hash returned by this function must be prefixed with "\x19Ethereum Signed Message:\n32"
     * and hashed again.
     *
     */
    function getMintApprovalMessageHash(
        address to,
        uint256 id,
        uint256 amount
    ) external view returns (bytes32);

    /**
     * @dev Returns the hash of the mint approval message for multiple ids and amounts.
     * Before being signed by an EOA to approve token minting and express consent,
     * the hash returned by this function must be prefixed with "\x19Ethereum Signed Message:\n32"
     * and hashed again.
     *
     */
    function getMintApprovalMessageHash(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external view returns (bytes32);
}
