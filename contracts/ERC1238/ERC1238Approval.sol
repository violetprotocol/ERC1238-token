// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
}

struct MintBatchApproval {
    address recipient;
    uint256[] ids;
    uint256[] amounts;
}

struct MintApproval {
    address recipient;
    uint256 id;
    uint256 amount;
}

contract ERC1238Approval {
    bytes32 private constant EIP712DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    bytes32 private constant MINT_APPROVAL_TYPEHASH =
        keccak256("MintApproval(address recipient,uint256 id,uint256 amount)");

    bytes32 private constant MINT_BATCH_APPROVAL_TYPEHASH =
        keccak256("MintBatchApproval(address recipient,uint256[] ids,uint256[] amounts)");

    bytes32 public DOMAIN_SEPARATOR;

    constructor() {
        EIP712Domain memory eip712Domain = EIP712Domain({
            name: "ERC1238 Mint Approval",
            version: "1",
            chainId: block.chainid,
            verifyingContract: address(this)
        });

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712DOMAIN_TYPEHASH,
                keccak256(bytes(eip712Domain.name)),
                keccak256(bytes(eip712Domain.version)),
                eip712Domain.chainId,
                eip712Domain.verifyingContract
            )
        );
    }

    function getMintApprovalMessageHash(
        address recipient,
        uint256 id,
        uint256 amount
    ) internal pure returns (bytes32) {
        MintApproval memory mintApproval = MintApproval({ recipient: recipient, id: id, amount: amount });
        return
            keccak256(abi.encode(MINT_APPROVAL_TYPEHASH, mintApproval.recipient, mintApproval.id, mintApproval.amount));
    }

    function getMintBatchApprovalMessageHash(
        address recipient,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal pure returns (bytes32) {
        MintBatchApproval memory mintBatchApproval = MintBatchApproval({
            recipient: recipient,
            ids: ids,
            amounts: amounts
        });

        return
            keccak256(
                abi.encode(
                    MINT_BATCH_APPROVAL_TYPEHASH,
                    mintBatchApproval.recipient,
                    keccak256(abi.encodePacked(mintBatchApproval.ids)),
                    keccak256(abi.encodePacked(mintBatchApproval.amounts))
                )
            );
    }

    function _verifyMintingApproval(
        address recipient,
        bytes32 mintApprovalHash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view {
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, mintApprovalHash));

        require(ecrecover(digest, v, r, s) == recipient, "ERC1238: Approval verification failed");
    }
}
