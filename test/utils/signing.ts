import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, ethers, Signature } from "ethers";
import { Badge } from "../../src/types/Badge";
import { ERC1238Mock } from "../../src/types/ERC1238Mock";

function isBigNumberish(bn: BigNumberish | BigNumberish[]): bn is BigNumberish {
  return !Array.isArray(bn);
}

export const getMintApprovalSignature = async ({
  signer,
  erc1238Contract,
  ids,
  amounts,
}: {
  signer: SignerWithAddress;
  erc1238Contract: ERC1238Mock | Badge;
  ids: BigNumberish | BigNumberish[];
  amounts: BigNumberish | BigNumberish[];
}): Promise<Signature & { fullSignature: string }> => {
  let hash;
  if (!isBigNumberish(ids) && !isBigNumberish(amounts)) {
    hash = await erc1238Contract["getMintApprovalMessageHash(address,uint256[],uint256[])"](
      signer.address,
      ids,
      amounts,
    );
  } else if (isBigNumberish(ids) && isBigNumberish(amounts)) {
    hash = await erc1238Contract["getMintApprovalMessageHash(address,uint256,uint256)"](signer.address, ids, amounts);
  } else {
    hash = "0x";
  }
  const bytesHash = ethers.utils.arrayify(hash);
  const sig = await signer.signMessage(bytesHash);

  return { fullSignature: sig, ...ethers.utils.splitSignature(sig) };
};
