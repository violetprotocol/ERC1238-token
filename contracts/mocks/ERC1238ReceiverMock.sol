// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/IERC1238Receiver.sol";

contract ERC1238ReceiverMock is IERC1238Receiver {
    //  bytes4(keccak256("onERC1238Mint(address,uint256,uint256,bytes)"))
    bytes4 public constant ERC1238_ON_MINT = 0x45ed75d5;

    // bytes4(keccak256("onERC1238BatchMint(address,uint256[],uint256[],bytes)"))
    bytes4 public constant ERC1238_ON_BATCH_MINT = 0xc0bfec68;

    function onERC1238Mint(
        address,
        uint256 id,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        if (id == 0) {
            return bytes4(0);
        }

        return ERC1238_ON_MINT;
    }

    function onERC1238BatchMint(
        address,
        uint256[] calldata ids,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        if (ids[0] == 0) {
            return bytes4(0);
        }

        return ERC1238_ON_BATCH_MINT;
    }
}
