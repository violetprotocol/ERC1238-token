// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238.sol";
import "./IERC1238Packed.sol";

/**
 * @dev
 */
abstract contract ERC1238Packed is IERC1238Packed, ERC1238 {

   mapping(address => mapping(uint48 => uint256)) internal _baseIdBalances;

   
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

     function _beforeBurn(
        address,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual override { 
       uint48 baseId = uint48(id >> 208);

        _baseIdBalances[from][baseId] -= amount;
    }


    function balanceFromBaseId(address account, uint48 baseId) public override view returns (uint256) {
     return _baseIdBalances[account][baseId];
    }

    function getConstructedTokenID(uint48 baseId, address account, uint48 counter) public pure returns (uint256) {
      return uint256(counter) | (uint256(uint160(account)) << 48) | (uint256(baseId) << 208);
    }

}