import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";

import type { ERC1238StakableMock } from "../../../src/types/ERC1238StakableMock";
import { toBN } from "../../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";

describe("ERC1238URIStakable", function () {
  let erc1238Stakable: ERC1238StakableMock;
  let admin: SignerWithAddress;
  let tokenHolder: SignerWithAddress;
  let stakeholder: SignerWithAddress;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    tokenHolder = signers[1];
    stakeholder = signers[2];
  });

  beforeEach(async function () {
    const ERC1238StakableMockArtifact: Artifact = await artifacts.readArtifact("ERC1238StakableMock");
    erc1238Stakable = <ERC1238StakableMock>await waffle.deployContract(admin, ERC1238StakableMockArtifact, [BASE_URI]);
  });

  describe("Staking", () => {
    const fungibleTokenId = 1;
    const amountMintedFungible = toBN("1000");
    const nftID = 2;
    const amountMintedNonFungible = 1;

    beforeEach(async () => {
      // mint fungible tokens
      await erc1238Stakable.connect(admin).mint(tokenHolder.address, fungibleTokenId, amountMintedFungible, []);
      // mint an NFT
      await erc1238Stakable.connect(admin).mint(tokenHolder.address, nftID, amountMintedNonFungible, []);
    });

    it("should let a token owner increase a stake", async () => {
      await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, nftID, 1);

      expect(await erc1238Stakable.stakeOf(tokenHolder.address, nftID, stakeholder.address)).to.eq(1);
    });

    it("should let a stakeholder burn a staked NFT", async () => {
      // Given
      expect(await erc1238Stakable.balanceOf(tokenHolder.address, nftID)).to.eq(amountMintedNonFungible);

      // When
      await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, nftID, 1);

      await erc1238Stakable.connect(stakeholder).burn(tokenHolder.address, nftID, 1);

      // Expect
      expect(await erc1238Stakable.balanceOf(tokenHolder.address, nftID)).to.eq(0);
    });

    it("should let a stakeholder burn up to the amount of fungible tokens staked", async () => {
      // Given
      const stakedAmount = toBN("500");

      expect(await erc1238Stakable.balanceOf(tokenHolder.address, fungibleTokenId)).to.eq(amountMintedFungible);

      // When
      await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, fungibleTokenId, stakedAmount);

      await erc1238Stakable.connect(stakeholder).burn(tokenHolder.address, fungibleTokenId, stakedAmount);

      // Expect
      expect(await erc1238Stakable.balanceOf(tokenHolder.address, fungibleTokenId)).to.eq(
        amountMintedFungible.sub(stakedAmount),
      );
    });

    it("should not let a stakeholder burn more that the staked amount", async () => {
      const stakedAmount = toBN("500");
      const burnAmount = stakedAmount.add(toBN("1"));

      await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, fungibleTokenId, stakedAmount);

      await expect(
        erc1238Stakable.connect(stakeholder).burn(tokenHolder.address, fungibleTokenId, burnAmount),
      ).to.be.revertedWith("ERC1238Stakable: Unauthorized to burn tokens");
    });

    it("should let a token owner burn tokens before staking", async () => {
      // Given
      expect(await erc1238Stakable.balanceOf(tokenHolder.address, fungibleTokenId)).to.eq(amountMintedFungible);

      // When
      await erc1238Stakable.connect(tokenHolder).burn(tokenHolder.address, fungibleTokenId, amountMintedFungible);

      // Expect
      expect(await erc1238Stakable.balanceOf(tokenHolder.address, fungibleTokenId)).to.eq(0);
    });

    it("should let a token owner burn tokens after staking", async () => {
      // Given
      const stakedAmount = toBN("800");

      expect(await erc1238Stakable.balanceOf(tokenHolder.address, fungibleTokenId)).to.eq(amountMintedFungible);

      // When
      await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, fungibleTokenId, stakedAmount);

      await erc1238Stakable.connect(tokenHolder).burn(tokenHolder.address, fungibleTokenId, stakedAmount);

      // Expect
      expect(await erc1238Stakable.balanceOf(tokenHolder.address, fungibleTokenId)).to.eq(
        amountMintedFungible.sub(stakedAmount),
      );
      // "Burn" allowance is the same
      expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(
        stakedAmount,
      );
    });

    context("Decrease Stake", () => {
      it("should let a stakeholder decrease a stake", async () => {
        const stakedAmount = toBN("800");
        const amountToUnstake = toBN("300");

        await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, fungibleTokenId, stakedAmount);

        expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(
          stakedAmount,
        );

        await erc1238Stakable.connect(stakeholder).decreaseStake(tokenHolder.address, fungibleTokenId, amountToUnstake);

        expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(
          stakedAmount.sub(amountToUnstake),
        );
      });

      it("should let a stakeholder fully unstake", async () => {
        const stakedAmount = toBN("800");
        const amountToUnstake = stakedAmount;

        await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, fungibleTokenId, stakedAmount);

        expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(
          stakedAmount,
        );

        await erc1238Stakable.connect(stakeholder).decreaseStake(tokenHolder.address, fungibleTokenId, amountToUnstake);

        expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(0);
      });

      it("should not let a token owner unstake", async () => {
        const stakedAmount = toBN("600");
        await erc1238Stakable.connect(tokenHolder).increaseStake(stakeholder.address, fungibleTokenId, stakedAmount);

        expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(
          stakedAmount,
        );

        await expect(
          erc1238Stakable.connect(tokenHolder).decreaseStake(tokenHolder.address, fungibleTokenId, stakedAmount),
        ).to.be.revertedWith("ERC1238Stakable: cannot decrease more than current stake");

        expect(await erc1238Stakable.stakeOf(tokenHolder.address, fungibleTokenId, stakeholder.address)).to.eq(
          stakedAmount,
        );
      });
    });
  });
});