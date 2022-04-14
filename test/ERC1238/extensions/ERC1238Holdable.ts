import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { ERC1238HoldableMock } from "../../../src/types/ERC1238HoldableMock";
import type { ERC1238ReceiverHoldableMock } from "../../../src/types/ERC1238ReceiverHoldableMock";
import { ZERO_ADDRESS } from "../../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";

describe("ERC1238URIHoldable", function () {
  let erc1238Holdable: ERC1238HoldableMock;
  let admin: SignerWithAddress;
  let tokenOwnerContract: ERC1238ReceiverHoldableMock;
  // let tokenOwnerContract2: ERC1238ReceiverHoldableMock;
  let eoa1: SignerWithAddress;
  let eoa2: SignerWithAddress;

  const tokenId = 888888;
  const mintAmount = 98765432;
  const data = "0x12345678";

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    eoa1 = signers[1];
    eoa2 = signers[2];
  });

  beforeEach(async function () {
    const ERC1238HoldableMockArtifact: Artifact = await artifacts.readArtifact("ERC1238HoldableMock");
    erc1238Holdable = <ERC1238HoldableMock>await waffle.deployContract(admin, ERC1238HoldableMockArtifact, [BASE_URI]);

    const ERC1238ReceiverHoldableMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverHoldableMock");
    tokenOwnerContract = <ERC1238ReceiverHoldableMock>(
      await waffle.deployContract(admin, ERC1238ReceiverHoldableMockArtifact)
    );
  });

  describe("Minting", () => {
    it("should set the token recipient as first holder", async () => {
      await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

      expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
    });

    it("should update the balance held when minting multiple times", async () => {
      const firstAmount = 1000;
      const secondAmount = 200;
      await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, firstAmount, data);

      expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(firstAmount);

      await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, secondAmount, data);

      expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(firstAmount + secondAmount);
    });
  });

  describe("Holding", () => {
    it("should allow locking tokens forever at the zero address", async () => {
      await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

      await tokenOwnerContract.entrust(erc1238Holdable.address, ZERO_ADDRESS, tokenId, mintAmount);

      expect(await erc1238Holdable.heldBalance(ZERO_ADDRESS, tokenId)).to.eq(mintAmount);
    });

    context("Staking all tokens", () => {
      it("should let a token owner stake all of their tokens", async () => {
        await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

        // tokenOwnerContract entrusts eoa1 with their tokens
        await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, mintAmount);

        // tokenOwnerContract does not hold the tokens anymore
        expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(0);
        // eoa1 does hold them
        expect(await erc1238Holdable.heldBalance(eoa1.address, tokenId)).to.eq(mintAmount);

        // tokenOwnerContract is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
      });

      it("should let a holder transfer tokens to another holder", async () => {
        await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

        // tokenOwnerContract entrusts eoa1 with their tokens
        await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, mintAmount);
        // eoa1 entrusts eoa2 with these same tokens belonging to tokenOwnerContract
        await erc1238Holdable.connect(eoa1).entrust(eoa2.address, tokenId, mintAmount);

        // tokenOwnerContract does not hold the tokens anymore
        expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(0);
        // eoa1 does not hold them
        expect(await erc1238Holdable.heldBalance(eoa1.address, tokenId)).to.eq(0);
        // eoa2 does hold them
        expect(await erc1238Holdable.heldBalance(eoa2.address, tokenId)).to.eq(mintAmount);
        // tokenOwnerContract is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
      });

      it("should let a holder transfer tokens back to their owner", async () => {
        await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

        // tokenOwnerContract entrusts eoa1 with their tokens
        await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, mintAmount);
        // eoa1 transfers them back to tokenOwnerContract
        await erc1238Holdable.connect(eoa1).entrust(tokenOwnerContract.address, tokenId, mintAmount);

        // eoa1 does not hold the tokens anymore
        expect(await erc1238Holdable.heldBalance(eoa1.address, tokenId)).to.eq(0);
        // tokenOwnerContract does hold them
        expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
        // tokenOwnerContract is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
      });
    });

    context("Partial Staking", () => {
      const stakedAmount = mintAmount - 1000;
      it("should let a token owner put some of their token at stake", async () => {
        await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

        // tokenOwnerContract entrusts eoa1 with some of their tokens
        await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, stakedAmount);

        // tokenOwnerContract holds the remaining amount of tokens
        expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(mintAmount - stakedAmount);
        // eoa1 holds the staked amount
        expect(await erc1238Holdable.heldBalance(eoa1.address, tokenId)).to.eq(stakedAmount);
        // tokenOwnerContract is still the owner of all the tokens
        expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
      });

      it("should let a token holder transfer the staked amount", async () => {
        await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);

        // tokenOwnerContract entrusts eoa1 with some their tokens
        await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, stakedAmount);
        // eoa1 entrusts eoa2 with these tokens
        await erc1238Holdable.connect(eoa1).entrust(eoa2.address, tokenId, stakedAmount);

        // tokenOwnerContract holds the remaining amount of tokens
        expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(mintAmount - stakedAmount);
        // eoa1 does not hold any tokens
        expect(await erc1238Holdable.heldBalance(eoa1.address, tokenId)).to.eq(0);
        // eoa2 does hold some of them
        expect(await erc1238Holdable.heldBalance(eoa2.address, tokenId)).to.eq(stakedAmount);
        // tokenOwnerContract is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount);
      });
    });
  });

  describe("Burning", () => {
    beforeEach(async () => {
      await erc1238Holdable.mintToContract(tokenOwnerContract.address, tokenId, mintAmount, data);
    });

    it("should let a token owner burn all of their tokens", async () => {
      await tokenOwnerContract.burnHeldTokens(erc1238Holdable.address, tokenOwnerContract.address, tokenId, mintAmount);

      expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(0);
      expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(0);
    });

    it("should let a token owner burn some of their tokens", async () => {
      const amountToBurn = mintAmount - 1000;

      await tokenOwnerContract.burnHeldTokens(
        erc1238Holdable.address,
        tokenOwnerContract.address,
        tokenId,
        amountToBurn,
      );

      expect(await erc1238Holdable.heldBalance(tokenOwnerContract.address, tokenId)).to.eq(mintAmount - amountToBurn);
      expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount - amountToBurn);
    });

    it("should let tokens held by an EOA be burnt", async () => {
      const amountToBurn = mintAmount - 100;

      await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, amountToBurn);

      await erc1238Holdable.burnHeldTokens(eoa1.address, tokenOwnerContract.address, tokenId, amountToBurn);

      expect(await erc1238Holdable.heldBalance(eoa1.address, tokenId)).to.eq(0);
      expect(await erc1238Holdable.balanceOf(tokenOwnerContract.address, tokenId)).to.eq(mintAmount - amountToBurn);
    });

    it("should revert when trying to burn more tokens that what the holder passed holds", async () => {
      const stakedAmount = mintAmount;

      await tokenOwnerContract.entrust(erc1238Holdable.address, eoa1.address, tokenId, stakedAmount);

      await expect(
        erc1238Holdable.burnHeldTokens(eoa1.address, tokenOwnerContract.address, tokenId, stakedAmount + 1),
      ).to.be.revertedWith("ERC1238Holdable: Amount to burn exceeds amount held");
    });
  });
});
