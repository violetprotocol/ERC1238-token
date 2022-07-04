import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import { chainIds } from "../../hardhat.config";
import type { ERC1238Mock } from "../../src/types/ERC1238Mock";
import type { ERC1238ReceiverMock } from "../../src/types/ERC1238ReceiverMock";
import { getMintApprovalSignature, getMintBatchApprovalSignature } from "../../src/utils/ERC1238Approval";
import {
  invalidSignatureS,
  invalidSignatureV,
  shouldSupportInterfaces,
  toBN,
  TOKEN_ID_ZERO,
  ZERO_ADDRESS,
} from "../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";
const twoDaysInSeconds = 172800;

// TODO: add tests for _mintBundle
describe("ERC1238", function () {
  const chainId = chainIds.hardhat;
  let erc1238Mock: ERC1238Mock;
  let admin: SignerWithAddress;
  let tokenRecipient: SignerWithAddress;
  let tokenBatchRecipient: SignerWithAddress;
  let smartContractRecipient1: ERC1238ReceiverMock;
  let smartContractRecipient2: ERC1238ReceiverMock;

  let approvalExpiry: BigNumber;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    tokenRecipient = signers[1];
    tokenBatchRecipient = signers[2];
  });

  beforeEach(async function () {
    const ERC1238MockArtifact: Artifact = await artifacts.readArtifact("ERC1238Mock");
    erc1238Mock = <ERC1238Mock>await waffle.deployContract(admin, ERC1238MockArtifact, [BASE_URI]);
    const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
    smartContractRecipient1 = <ERC1238ReceiverMock>(
      await waffle.deployContract(tokenRecipient, ERC1238ReceiverMockArtifact)
    );
    smartContractRecipient2 = <ERC1238ReceiverMock>(
      await waffle.deployContract(tokenRecipient, ERC1238ReceiverMockArtifact)
    );
  });

  describe("ERC165", () => {
    it("should support the IERC1238 interface", async () => {
      const supported = await shouldSupportInterfaces(erc1238Mock, ["IERC165", "IERC1238"]);

      expect(supported).to.eq(true);
    });

    it("should support the IERC1238Receiver interface", async () => {
      const supported = await shouldSupportInterfaces(smartContractRecipient1, ["IERC1238Receiver"]);

      expect(supported).to.eq(true);
    });
  });

  describe("public functions", () => {
    const data = "0x111111";

    const tokenBatchIds1 = [toBN("1000"), toBN("1010"), toBN("1020")];
    const tokenBatchIds2 = [toBN("900"), toBN("901"), toBN("902")];
    const batchIds = [tokenBatchIds1, tokenBatchIds2];

    const mintBatchAmounts1 = [toBN("5000"), toBN("10000"), toBN("42195")];
    const mintBatchAmounts2 = [toBN("3"), toBN("1"), toBN("7022")];
    const batchAmounts = [mintBatchAmounts1, mintBatchAmounts2];

    describe("balanceOfBundle", () => {
      it("should return the right balances", async () => {
        await erc1238Mock.mintBatchToContract(smartContractRecipient1.address, tokenBatchIds1, mintBatchAmounts1, data);
        await erc1238Mock.mintBatchToContract(smartContractRecipient2.address, tokenBatchIds2, mintBatchAmounts2, data);

        const bundleBalances = await erc1238Mock.balanceOfBundle(
          [smartContractRecipient1.address, smartContractRecipient2.address],
          batchIds,
        );

        bundleBalances.forEach((bundleBalance, i) => {
          bundleBalance.forEach((balance, j) => {
            expect(balance).to.eq(batchAmounts[i][j]);
          });
        });
      });
    });
  });

  describe("internal functions", () => {
    const data = "0x12345678";
    const tokenId = toBN("11223344");
    const mintAmount = toBN("58319");
    const burnAmount = toBN("987");

    const tokenBatchIds = [toBN("2000"), toBN("2010"), toBN("2020")];
    const mintBatchAmounts = [toBN("5000"), toBN("10000"), toBN("42195")];
    const burnBatchAmounts = [toBN("5000"), toBN("9001"), toBN("195")];

    /*
     * MINTING
     */

    describe("_mintToEOA", () => {
      let v: number;
      let r: string;
      let s: string;
      beforeEach(async () => {
        const dateNow = Math.floor(Date.now() / 1000);
        approvalExpiry = BigNumber.from(dateNow + twoDaysInSeconds);

        ({ v, r, s } = await getMintApprovalSignature({
          signer: tokenRecipient,
          erc1238ContractAddress: erc1238Mock.address,
          chainId,
          id: tokenId,
          amount: mintAmount,
          approvalExpiry,
        }));
      });

      it("should revert if the signer does not match the one in the approval message", async () => {
        await expect(
          erc1238Mock.connect(admin).mintToEOA(ZERO_ADDRESS, tokenId, mintAmount, v, r, s, approvalExpiry, data),
        ).to.be.revertedWith("ERC1238: Approval verification failed");
      });

      it("should revert with an invalid signature", async () => {
        const bytes32Zero = "0x0000000000000000000000000000000000000000000000000000000000000000";
        await expect(
          erc1238Mock
            .connect(admin)
            .mintToEOA(ZERO_ADDRESS, tokenId, mintAmount, 27, bytes32Zero, bytes32Zero, approvalExpiry, data),
        ).to.be.revertedWith("ECDSA: invalid signature");
      });

      it("should revert if signature v is invalid", async () => {
        await expect(
          erc1238Mock.mintToEOA(
            tokenRecipient.address,
            tokenId,
            mintAmount,
            invalidSignatureV,
            r,
            s,
            approvalExpiry,
            data,
          ),
        ).to.be.revertedWith("ECDSA: invalid signature 'v' value");
      });

      it("should revert if signature s is invalid", async () => {
        await expect(
          erc1238Mock.mintToEOA(
            tokenRecipient.address,
            tokenId,
            mintAmount,
            v,
            r,
            invalidSignatureS,
            approvalExpiry,
            data,
          ),
        ).to.be.revertedWith("ECDSA: invalid signature 's' value");
      });

      it("should revert with an expired signature", async () => {
        // Approval expiry time in the past
        const expiredTime = approvalExpiry.sub(twoDaysInSeconds);

        await expect(
          erc1238Mock.connect(admin).mintToEOA(tokenRecipient.address, tokenId, mintAmount, v, r, s, expiredTime, data),
        ).to.be.revertedWith("ERC1238: provided approval expiry time cannot be in the past");
      });

      it("should revert with a signature already used before", async () => {
        await expect(erc1238Mock.mintToEOA(tokenRecipient.address, tokenId, mintAmount, v, r, s, approvalExpiry, data))
          .to.not.be.reverted;

        await expect(
          erc1238Mock.mintToEOA(tokenRecipient.address, tokenId, mintAmount, v, r, s, approvalExpiry, data),
        ).to.be.revertedWith("ERC1238: Approval hash already used");
      });

      it("should credit the amount of tokens", async () => {
        await erc1238Mock.mintToEOA(tokenRecipient.address, tokenId, mintAmount, v, r, s, approvalExpiry, data);

        const balance = await erc1238Mock.balanceOf(tokenRecipient.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should emit a MintSingle event", async () => {
        await expect(erc1238Mock.mintToEOA(tokenRecipient.address, tokenId, mintAmount, v, r, s, approvalExpiry, data))
          .to.emit(erc1238Mock, "MintSingle")
          .withArgs(admin.address, tokenRecipient.address, tokenId, mintAmount);
      });
    });

    describe("_mintToContract", () => {
      it("should credit the amount of tokens", async () => {
        await erc1238Mock.mintToContract(smartContractRecipient1.address, tokenId, mintAmount, data);

        const balance = await erc1238Mock.balanceOf(smartContractRecipient1.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should revert if the recipient is not a contract", async () => {
        await expect(
          erc1238Mock.mintToContract(tokenRecipient.address, TOKEN_ID_ZERO, mintAmount, data),
        ).to.be.revertedWith("ERC1238: Recipient is not a contract");
      });

      it("should revert if the smart contract does not accept the tokens", async () => {
        // ERC1238ReceiverMock is set to reject tokens with id 0
        await expect(
          erc1238Mock.mintToContract(smartContractRecipient1.address, TOKEN_ID_ZERO, mintAmount, data),
        ).to.be.revertedWith("ERC1238: ERC1238Receiver rejected tokens");
      });
    });

    describe("_mintBatchToEOA", () => {
      let v: number;
      let r: string;
      let s: string;

      beforeEach(async () => {
        const dateNow = Math.floor(Date.now() / 1000);
        approvalExpiry = BigNumber.from(dateNow + twoDaysInSeconds);

        ({ v, r, s } = await getMintBatchApprovalSignature({
          signer: tokenBatchRecipient,
          erc1238ContractAddress: erc1238Mock.address,
          chainId,
          ids: tokenBatchIds,
          amounts: mintBatchAmounts,
          approvalExpiry,
        }));
      });

      it("should revert with an invalid signature", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatchToEOA(ZERO_ADDRESS, tokenBatchIds, mintBatchAmounts, v, r, s, approvalExpiry, data),
        ).to.be.revertedWith("ERC1238: Approval verification failed");
      });

      it("should revert with an expired signature", async () => {
        // Approval expiry time in the past
        const expiredTime = approvalExpiry.sub(twoDaysInSeconds);

        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatchToEOA(tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts, v, r, s, expiredTime, data),
        ).to.be.revertedWith("ERC1238: provided approval expiry time cannot be in the past");
      });

      it("should revert with a signature already used before", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatchToEOA(
              tokenBatchRecipient.address,
              tokenBatchIds,
              mintBatchAmounts,
              v,
              r,
              s,
              approvalExpiry,
              data,
            ),
        ).to.not.be.reverted;

        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatchToEOA(
              tokenBatchRecipient.address,
              tokenBatchIds,
              mintBatchAmounts,
              v,
              r,
              s,
              approvalExpiry,
              data,
            ),
        ).to.be.revertedWith("ERC1238: Approval hash already used");
      });

      it("should revert if the length of inputs do not match", async () => {
        ({ v, r, s } = await getMintBatchApprovalSignature({
          signer: tokenBatchRecipient,
          erc1238ContractAddress: erc1238Mock.address,
          chainId,
          ids: tokenBatchIds.slice(1),
          amounts: mintBatchAmounts,
          approvalExpiry,
        }));

        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatchToEOA(
              tokenBatchRecipient.address,
              tokenBatchIds.slice(1),
              mintBatchAmounts,
              v,
              r,
              s,
              approvalExpiry,
              data,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should credit the minted tokens", async () => {
        await erc1238Mock
          .connect(admin)
          .mintBatchToEOA(tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts, v, r, s, approvalExpiry, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await erc1238Mock.balanceOf(tokenBatchRecipient.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          erc1238Mock.mintBatchToEOA(
            tokenBatchRecipient.address,
            tokenBatchIds,
            mintBatchAmounts,
            v,
            r,
            s,
            approvalExpiry,
            data,
          ),
        )
          .to.emit(erc1238Mock, "MintBatch")
          .withArgs(admin.address, tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    describe("_mintBatchToContract", () => {
      it("should revert if the length of inputs do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds.slice(1), mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert if the recipient is not a contract", async () => {
        await expect(
          erc1238Mock.mintBatchToContract(tokenRecipient.address, tokenBatchIds, mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: Recipient is not a contract");
      });

      it("should credit the minted tokens", async () => {
        await erc1238Mock
          .connect(admin)
          .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await erc1238Mock.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          erc1238Mock.mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data),
        )
          .to.emit(erc1238Mock, "MintBatch")
          .withArgs(admin.address, smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    /*
     * BURNING
     */

    describe("_burn", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(erc1238Mock.connect(admin).burn(ZERO_ADDRESS, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn from the zero address",
        );
      });

      it("should revert when burning a non-existent token id", async () => {
        await expect(erc1238Mock.connect(admin).burn(tokenRecipient.address, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn amount exceeds balance",
        );
      });

      it("should revert when burning more than available balance", async () => {
        const amountToMint = burnAmount.sub(1);
        await erc1238Mock.mintToContract(smartContractRecipient1.address, tokenId, amountToMint, data);

        await expect(
          erc1238Mock.connect(admin).burn(smartContractRecipient1.address, tokenId, burnAmount),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should burn the right amount of tokens", async () => {
        const amountToMint = burnAmount.add(1);

        await erc1238Mock.mintToContract(smartContractRecipient1.address, tokenId, amountToMint, data);

        await erc1238Mock.connect(admin).burn(smartContractRecipient1.address, tokenId, burnAmount);

        expect(await erc1238Mock.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(1);
      });

      it("should emit a BurnSingle event", async () => {
        await erc1238Mock.mintToContract(smartContractRecipient1.address, tokenId, burnAmount, data);

        await expect(erc1238Mock.burn(smartContractRecipient1.address, tokenId, burnAmount))
          .to.emit(erc1238Mock, "BurnSingle")
          .withArgs(admin.address, smartContractRecipient1.address, tokenId, burnAmount);
      });
    });

    describe("_burnBatch", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(
          erc1238Mock.connect(admin).burnBatch(ZERO_ADDRESS, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          erc1238Mock.connect(admin).burnBatch(tokenBatchRecipient.address, tokenBatchIds.slice(1), burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          erc1238Mock.connect(admin).burnBatch(tokenBatchRecipient.address, tokenBatchIds, burnBatchAmounts.slice(1)),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert when burning a non-existent token id", async () => {
        await erc1238Mock
          .connect(admin)
          .mintBatchToContract(
            smartContractRecipient1.address,
            tokenBatchIds.slice(1),
            burnBatchAmounts.slice(1),
            data,
          );

        await expect(
          erc1238Mock.connect(admin).burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should properly burn tokens", async () => {
        await erc1238Mock
          .connect(admin)
          .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

        await erc1238Mock.connect(admin).burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts);

        tokenBatchIds.forEach(async (tokenId, i) =>
          expect(await erc1238Mock.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(
            mintBatchAmounts[i].sub(burnBatchAmounts[i]),
          ),
        );
      });

      it("should emit a BurnBatch event", async () => {
        await erc1238Mock.mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

        await expect(erc1238Mock.burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts))
          .to.emit(erc1238Mock, "BurnBatch")
          .withArgs(admin.address, smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts);
      });
    });

    /*
     * URI
     */

    describe("URI", () => {
      it("should set the base URI during construction", async () => {
        expect(await erc1238Mock.baseURI()).to.eq(BASE_URI);
      });

      it("should set a new base URI", async () => {
        const newBaseURI = "https://token-cdn-domain/v2/{id}.json";

        await erc1238Mock.setBaseURI(newBaseURI);

        expect(await erc1238Mock.baseURI()).to.eq(newBaseURI);
      });

      it("should set an empty base URI", async () => {
        await erc1238Mock.setBaseURI("");

        expect(await erc1238Mock.baseURI()).to.eq("");
      });
    });
  });
});
