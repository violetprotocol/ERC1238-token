import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { chainIds } from "../../hardhat.config";
import type { Badge } from "../../src/types/Badge";
import { ERC1238ReceiverMock } from "../../src/types/ERC1238ReceiverMock";
import { getMintBatchApprovalSignature } from "../../src/utils/ERC1238Approval";
import { toBN } from "../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// ~ WIP! ~
describe("Badge", function () {
  const chainId = chainIds.hardhat;
  let badge: Badge;
  let admin: SignerWithAddress;
  let signer1: SignerWithAddress;
  let eoaRecipient: SignerWithAddress;
  let contractRecipient: ERC1238ReceiverMock;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    signer1 = signers[1];
    eoaRecipient = signers[2];
    const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
    contractRecipient = <ERC1238ReceiverMock>await waffle.deployContract(eoaRecipient, ERC1238ReceiverMockArtifact);
  });

  beforeEach(async function () {
    const BadgeArtifact: Artifact = await artifacts.readArtifact("Badge");
    badge = <Badge>await waffle.deployContract(admin, BadgeArtifact, [admin.address, BASE_URI]);
  });

  describe("Ownership", () => {
    it("should return the right owner address", async function () {
      expect(await badge.connect(admin).owner()).to.equal(admin.address);
    });

    it("should change ownership", async () => {
      await badge.connect(admin).setOwner(signer1.address);

      expect(await badge.owner()).to.equal(signer1.address);
    });

    it("should not give ownership to the zero address", async () => {
      await expect(badge.connect(admin).setOwner(ZERO_ADDRESS)).to.be.revertedWith("Invalid address for new owner");
    });
  });

  describe("Single Mint", () => {
    it("should mint a token with a URI", async () => {
      const tokenId = toBN("1234");
      const tokenAmount = toBN("1");
      const tokenURI = "https://your-domain-name.com/credentials/tokens/1";
      await badge.connect(admin).mintToContract(contractRecipient.address, tokenId, tokenAmount, tokenURI, []);

      expect(await badge.balanceOf(contractRecipient.address, tokenId)).to.eq(tokenAmount);
      expect(await badge.tokenURI(tokenId)).to.eq(tokenURI);
    });
  });

  describe("Mint Bundle", () => {
    let to: string[];
    beforeEach(() => {
      to = [signer1.address, contractRecipient.address, eoaRecipient.address];
    });
    const tokenBatchIds = [toBN("2000"), toBN("2010"), toBN("2020")];
    const tokenBatchURIs = [
      "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu",
      "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiv",
      "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiw",
    ];
    const mintBatchAmounts = [toBN("5000"), toBN("10000"), toBN("42195")];

    const ids = [tokenBatchIds, tokenBatchIds, tokenBatchIds];
    const amounts = [mintBatchAmounts, mintBatchAmounts, mintBatchAmounts];
    const uris = [tokenBatchURIs, tokenBatchURIs, tokenBatchURIs];

    it("should mint a bundle to multiple addresses", async () => {
      const signatureFromSigner1 = await getMintBatchApprovalSignature({
        erc1238ContractAddress: badge.address,
        chainId,
        signer: signer1,
        ids: ids[0],
        amounts: amounts[0],
      });

      const signatureFromEoaRecipient = await getMintBatchApprovalSignature({
        erc1238ContractAddress: badge.address,
        chainId,
        signer: eoaRecipient,
        ids: ids[2],
        amounts: amounts[2],
      });

      const data = [signatureFromSigner1.fullSignature, [], signatureFromEoaRecipient.fullSignature];

      await badge.mintBundle(to, ids, amounts, uris, data);

      to.forEach(async (recipient, i) => {
        ids[i].forEach(async (id, j) => {
          expect(await badge.balanceOf(recipient, id)).to.eq(amounts[i][j]);
        });
      });

      ids.forEach(async (tokenBatchIds, i) =>
        tokenBatchIds.forEach(async (id, j) => {
          expect(await badge.tokenURI(id)).to.eq(uris[i][j]);
        }),
      );
    });

    it("should emit MintBatch events", async () => {
      const signatureFromSigner1 = await getMintBatchApprovalSignature({
        erc1238ContractAddress: badge.address,
        chainId,
        signer: signer1,
        ids: ids[0],
        amounts: amounts[0],
      });

      const signatureFromEoaRecipient = await getMintBatchApprovalSignature({
        erc1238ContractAddress: badge.address,
        chainId,
        signer: eoaRecipient,
        ids: ids[2],
        amounts: amounts[2],
      });

      const data = [signatureFromSigner1.fullSignature, [], signatureFromEoaRecipient.fullSignature];

      const tx = badge.mintBundle(to, ids, amounts, uris, data);

      await expect(tx).to.emit(badge, "MintBatch").withArgs(admin.address, to[0], ids[0], amounts[0]);
      await expect(tx).to.emit(badge, "MintBatch").withArgs(admin.address, to[1], ids[1], amounts[1]);
      await expect(tx).to.emit(badge, "MintBatch").withArgs(admin.address, to[2], ids[2], amounts[2]);
    });
  });
});
