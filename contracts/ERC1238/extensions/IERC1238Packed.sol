// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IERC1238.sol";

/**
 * @dev 
 */
interface IERC1238Packed is IERC1238 {

    /**
    * @dev Returns the balance of an address for a specific baseId
    */
    function balanceFromBaseId(address account, uint48 baseId) external view returns (uint256);

}