// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1238/IERC1238Receiver.sol";
import "../ERC1238/extensions/IERC1238Holdable.sol";
import "../ERC1238/extensions/IERC1238Holder.sol";

import "./ERC1238HoldableMock.sol";

// This is a dummy example of a ERC1238Holder with arbitrary rules.
// It will reject non-transferable tokens if the token id is 0 in the case of a single token mint
// or if the first token id is 0 for a batch mint.
//
// It will also acknowledge and emit an event when tokens are burnt.
contract ERC1238HolderMock is IERC1238Receiver, IERC1238Holder {
    //  bytes4(keccak256("onERC1238Mint(address,uint256,uint256,bytes)"))
    bytes4 public constant ERC1238_ON_MINT = 0x45ed75d5;

    // bytes4(keccak256("onERC1238BatchMint(address,uint256[],uint256[],bytes)"))
    bytes4 public constant ERC1238_ON_BATCH_MINT = 0xc0bfec68;

    event TokenBurnt(uint256 id, uint256 amount);

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

    function entrust(
        address targetContract,
        address to,
        uint256 id,
        uint256 amount
    ) external {
        IERC1238Holdable(targetContract).entrust(to, id, amount);
    }

    function onBurn(uint256 id, uint256 amount) public override returns (bool) {
        emit TokenBurnt(id, amount);

        return true;
    }
}
