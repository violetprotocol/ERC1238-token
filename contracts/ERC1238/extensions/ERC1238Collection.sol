// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";
import "./IERC1238Collection.sol";
import "../../utils/ERC165.sol";

/**
 * @dev See {IERC1238Collection}.
 * This contract keeps track of the balances of addresses for each baseId.
 * Values are packed the following way in the id:
 * [baseId (48 bits)][owner (160 bits)][counter (48 bits)]
 */
abstract contract ERC1238Collection is ERC165, IERC1238Collection, ERC1238 {
    // owner => baseId => balance
    mapping(address => mapping(uint48 => uint256)) internal _baseIdBalances;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1238, ERC165, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC1238Collection).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns an address' balance for a given `baseId`.
     */
    function balanceFromBaseId(address account, uint48 baseId) public view override returns (uint256) {
        return _baseIdBalances[account][baseId];
    }

    /**
     * @dev See {IERC1238Collection}-getConstructedTokenID.
     */
    function getConstructedTokenID(
        uint48 baseId,
        address account,
        uint48 counter
    ) public pure override returns (uint256) {
        return uint256(counter) | (uint256(uint160(account)) << 48) | (uint256(baseId) << 208);
    }

    /**
     * @dev Extracts the base Id from the tokens being minted and credits the base id balance of the token recipient.
     */
    function _beforeMint(
        address,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory
    ) internal virtual override {
        uint48 baseId = uint48(id >> 208);

        _baseIdBalances[to][baseId] += amount;
    }

    /**
     * @dev Extracts the base Id from the tokens being burnt and decreases the base id balance of the token recipient.
     */
    function _beforeBurn(
        address,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual override {
        uint48 baseId = uint48(id >> 208);

        uint256 baseIdBalance = _baseIdBalances[from][baseId];
        require(baseIdBalance >= amount, "ERC1238: burn amount exceeds base id balance");
        unchecked {
            _baseIdBalances[from][baseId] -= amount;
        }
    }
}
