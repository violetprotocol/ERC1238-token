import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, ethers, Signature } from "ethers";

// Must match the domain of ERC1238Approval.sol
const getDomain = (chainId: number, verifyingContract: string) => ({
  name: "ERC1238 Mint Approval",
  version: "1",
  chainId,
  verifyingContract,
});

const MintApprovaltypes = {
  MintApproval: [
    { name: "recipient", type: "address" },
    { name: "id", type: "uint256" },
    { name: "amount", type: "uint256" },
  ],
};
const MintBatchApprovalTypes = {
  MintBatchApproval: [
    { name: "recipient", type: "address" },
    { name: "ids", type: "uint256[]" },
    { name: "amounts", type: "uint256[]" },
  ],
};

// TODO: These types should come from typechain but are not exported for some reason
type MintApprovalStruct = {
  recipient: string;
  id: BigNumberish;
  amount: BigNumberish;
};

type MintBatchApprovalStruct = {
  recipient: string;
  ids: BigNumberish[];
  amounts: BigNumberish[];
};

export const getMintApprovalSignature = async ({
  signer,
  erc1238ContractAddress,
  chainId,
  id,
  amount,
}: {
  signer: SignerWithAddress;
  erc1238ContractAddress: string;
  chainId: number;
  id: BigNumberish;
  amount: BigNumberish;
}): Promise<Signature & { fullSignature: string }> => {
  const domain = getDomain(chainId, erc1238ContractAddress);

  const value: MintApprovalStruct = {
    recipient: signer.address,
    id,
    amount,
  };

  let sig: string;
  try {
    sig = await signer._signTypedData(domain, MintApprovaltypes, value);
  } catch (err) {
    console.error(err);
    throw err;
  }

  return { fullSignature: sig, ...ethers.utils.splitSignature(sig) };
};

export const getMintBatchApprovalSignature = async ({
  signer,
  erc1238ContractAddress,
  chainId,
  ids,
  amounts,
}: {
  signer: SignerWithAddress;
  erc1238ContractAddress: string;
  chainId: number;
  ids: BigNumberish[];
  amounts: BigNumberish[];
}): Promise<Signature & { fullSignature: string }> => {
  const domain = getDomain(chainId, erc1238ContractAddress);

  const value: MintBatchApprovalStruct = {
    recipient: signer.address,
    ids,
    amounts,
  };

  const sig = await signer._signTypedData(domain, MintBatchApprovalTypes, value);

  return { fullSignature: sig, ...ethers.utils.splitSignature(sig) };
};
