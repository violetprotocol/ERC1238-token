import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";

import type { ERC1238Mock } from "../../src/types/ERC1238Mock";
import { toBN, ZERO_ADDRESS } from "../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";

describe("Unit tests", function () {
  let erc1238Mock: ERC1238Mock;
  let admin: SignerWithAddress;
  let tokenRecipient: SignerWithAddress;
  let tokenBatchRecipient: SignerWithAddress;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    tokenRecipient = signers[1];
    tokenBatchRecipient = signers[2];
  });

  beforeEach(async function () {
    const ERC1238MockArtifact: Artifact = await artifacts.readArtifact("ERC1238Mock");
    erc1238Mock = <ERC1238Mock>await waffle.deployContract(admin, ERC1238MockArtifact, [BASE_URI]);
  });

  describe("internal function", () => {
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

    describe("_mint", () => {
      it("should revert with the zero address as recipient", async () => {
        await expect(erc1238Mock.connect(admin).mint(ZERO_ADDRESS, tokenId, mintAmount, data)).to.be.revertedWith(
          "ERC1238: mint to the zero address",
        );
      });

      it("should credit the amount of tokens", async () => {
        await erc1238Mock.mint(tokenRecipient.address, tokenId, mintAmount, data);

        const balance = await erc1238Mock.balanceOf(tokenRecipient.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should emit a MintSingle event", async () => {
        await expect(erc1238Mock.mint(tokenRecipient.address, tokenId, mintAmount, data))
          .to.emit(erc1238Mock, "MintSingle")
          .withArgs(admin.address, tokenRecipient.address, tokenId, mintAmount);
      });
    });

    describe("_mintBatch", () => {
      it("should revert with the zero address", async () => {
        await expect(
          erc1238Mock.connect(admin).mintBatch(ZERO_ADDRESS, tokenBatchIds, mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: mint to the zero address");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatch(tokenBatchRecipient.address, tokenBatchIds.slice(1), mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          erc1238Mock
            .connect(admin)
            .mintBatch(tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts.slice(1), data),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should credit the minted tokens", async () => {
        await erc1238Mock.connect(admin).mintBatch(tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await erc1238Mock.balanceOf(tokenBatchRecipient.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(erc1238Mock.mintBatch(tokenRecipient.address, tokenBatchIds, mintBatchAmounts, data))
          .to.emit(erc1238Mock, "MintBatch")
          .withArgs(admin.address, tokenRecipient.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    /*
     * BURNING
     */

    describe("_burn", () => {
      it("should revert when buring the zero account's token", async () => {
        await expect(erc1238Mock.connect(admin).burn(ZERO_ADDRESS, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn from the zero address",
        );
      });

      it("should revert when buring a non-existent token id", async () => {
        await expect(erc1238Mock.connect(admin).burn(tokenRecipient.address, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn amount exceeds balance",
        );
      });

      it("should revert when buring more than available balance", async () => {
        const amountToMint = burnAmount.sub(1);
        await erc1238Mock.mint(tokenRecipient.address, tokenId, amountToMint, data);

        await expect(erc1238Mock.connect(admin).burn(tokenRecipient.address, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn amount exceeds balance",
        );
      });

      it("should burn the right amount of tokens", async () => {
        const amountToMint = burnAmount.add(1);

        await erc1238Mock.mint(tokenRecipient.address, tokenId, amountToMint, data);

        await erc1238Mock.connect(admin).burn(tokenRecipient.address, tokenId, burnAmount);

        expect(await erc1238Mock.balanceOf(tokenRecipient.address, tokenId)).to.eq(1);
      });

      it("should emit a BurnSingle event", async () => {
        await erc1238Mock.mint(tokenRecipient.address, tokenId, burnAmount, data);

        await expect(erc1238Mock.burn(tokenRecipient.address, tokenId, burnAmount))
          .to.emit(erc1238Mock, "BurnSingle")
          .withArgs(admin.address, tokenRecipient.address, tokenId, burnAmount);
      });
    });

    describe("_burnBatch", () => {
      it("should revert when buring the zero account's token", async () => {
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
          .mintBatch(tokenRecipient.address, tokenBatchIds.slice(1), burnBatchAmounts.slice(1), data);

        await expect(
          erc1238Mock.connect(admin).burnBatch(tokenRecipient.address, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should properly burn tokens", async () => {
        await erc1238Mock.connect(admin).mintBatch(tokenRecipient.address, tokenBatchIds, mintBatchAmounts, data);

        await erc1238Mock.connect(admin).burnBatch(tokenRecipient.address, tokenBatchIds, burnBatchAmounts);

        tokenBatchIds.forEach(async (tokenId, i) =>
          expect(await erc1238Mock.balanceOf(tokenRecipient.address, tokenId)).to.eq(
            mintBatchAmounts[i].sub(burnBatchAmounts[i]),
          ),
        );
      });

      it("should emit a BurnBatch event", async () => {
        await erc1238Mock.mintBatch(tokenRecipient.address, tokenBatchIds, mintBatchAmounts, data);

        await expect(erc1238Mock.burnBatch(tokenRecipient.address, tokenBatchIds, burnBatchAmounts))
          .to.emit(erc1238Mock, "BurnBatch")
          .withArgs(admin.address, tokenRecipient.address, tokenBatchIds, burnBatchAmounts);
      });
    });
  });
});
