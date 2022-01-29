import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";

import type { ERC1238HoldableMock } from "../../../src/types/ERC1238HoldableMock";
import { ZERO_ADDRESS } from "../../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";

describe("ERC1238URIHoldable", function () {
  let erc1238Holdable: ERC1238HoldableMock;
  let admin: SignerWithAddress;
  let tokenOwner: SignerWithAddress;
  let tokenHolder1: SignerWithAddress;
  let tokenHolder2: SignerWithAddress;

  const tokenId = 888888;
  const mintAmount = 98765432;
  const data = "0x12345678";

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    tokenOwner = signers[1];
    tokenHolder1 = signers[2];
    tokenHolder2 = signers[3];
  });

  beforeEach(async function () {
    const ERC1238HoldableMockArtifact: Artifact = await artifacts.readArtifact("ERC1238HoldableMock");
    erc1238Holdable = <ERC1238HoldableMock>await waffle.deployContract(admin, ERC1238HoldableMockArtifact, [BASE_URI]);
  });

  describe("Minting", () => {
    it("should set the the token recipient as first holder", async () => {
      await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

      expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(mintAmount);
    });

    it("should update the held balance when minting multiple times", async () => {
      const firstAmount = 1000;
      const secondAmount = 200;
      await erc1238Holdable.mint(tokenOwner.address, tokenId, firstAmount, data);

      expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(firstAmount);

      await erc1238Holdable.mint(tokenOwner.address, tokenId, secondAmount, data);

      expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(firstAmount + secondAmount);
    });
  });

  describe("Escrow", () => {
    it("should not allow an escrow to the zero address", async () => {
      await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

      const tx = erc1238Holdable.connect(tokenOwner).entrust(ZERO_ADDRESS, tokenId, mintAmount);

      await expect(tx).to.be.revertedWith("ERC1238Holdable: transfer to the zero address");
    });

    context("Full Escrow", () => {
      it("should let a token owner put all their token in escrow", async () => {
        await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

        // tokenOwner entrusts tokenHolder1 with their tokens
        await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, mintAmount);

        // tokenOwner does not hold the tokens anymore
        expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(0);
        // tokenHolder1 does hold them
        expect(await erc1238Holdable.escrowedBalance(tokenHolder1.address, tokenId)).to.eq(mintAmount);
        // tokenOwner is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(mintAmount);
      });

      it("should let a holder transfer tokens to another holder", async () => {
        await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

        // tokenOwner entrusts tokenHolder1 with their tokens
        await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, mintAmount);
        // tokenHolder1 entrusts tokenHolder2 with these same tokens belonging to tokenOwner
        await erc1238Holdable.connect(tokenHolder1).entrust(tokenHolder2.address, tokenId, mintAmount);

        // tokenOwner does not hold the tokens anymore
        expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(0);
        // tokenHolder1 does not hold them
        expect(await erc1238Holdable.escrowedBalance(tokenHolder1.address, tokenId)).to.eq(0);
        // tokenHolder2 does hold them
        expect(await erc1238Holdable.escrowedBalance(tokenHolder2.address, tokenId)).to.eq(mintAmount);
        // tokenOwner is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(mintAmount);
      });

      it("should let a holder transfer tokens back to their owner", async () => {
        await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

        // tokenOwner entrusts tokenHolder1 with their tokens
        await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, mintAmount);
        // tokenHolder1 transfers them back to tokenOwner
        await erc1238Holdable.connect(tokenHolder1).entrust(tokenOwner.address, tokenId, mintAmount);

        // tokenHolder1 does not hold the tokens anymore
        expect(await erc1238Holdable.escrowedBalance(tokenHolder1.address, tokenId)).to.eq(0);
        // tokenOwner does hold them
        expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(mintAmount);
        // tokenOwner is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(mintAmount);
      });
    });

    context("Partial Escrow", () => {
      const escrowedAmount = mintAmount - 1000;
      it("should let a token owner put all their token in escrow", async () => {
        await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

        // tokenOwner entrusts tokenHolder1 with some of their tokens
        await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, escrowedAmount);

        // tokenOwner holds the remaining amount of tokens
        expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(mintAmount - escrowedAmount);
        // tokenHolder1 holds the escrowed amount
        expect(await erc1238Holdable.escrowedBalance(tokenHolder1.address, tokenId)).to.eq(escrowedAmount);
        // tokenOwner is still the owner of all the tokens
        expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(mintAmount);
      });

      it("should let a token holder transfer the escrowed amount", async () => {
        await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);

        // tokenOwner entrusts tokenHolder1 with some their tokens
        await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, escrowedAmount);
        // tokenHolder1 entrusts tokenHolder2 with these tokens
        await erc1238Holdable.connect(tokenHolder1).entrust(tokenHolder2.address, tokenId, escrowedAmount);

        // tokenOwner holds the remaining amount of tokens
        expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(mintAmount - escrowedAmount);
        // tokenHolder1 does not hold any tokens
        expect(await erc1238Holdable.escrowedBalance(tokenHolder1.address, tokenId)).to.eq(0);
        // tokenHolder2 does hold some of them
        expect(await erc1238Holdable.escrowedBalance(tokenHolder2.address, tokenId)).to.eq(escrowedAmount);
        // tokenOwner is still the owner of these tokens
        expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(mintAmount);
      });
    });
  });

  describe("Burning", () => {
    beforeEach(async () => {
      await erc1238Holdable.mint(tokenOwner.address, tokenId, mintAmount, data);
    });

    it("should let a token owner burn all of their tokens", async () => {
      await erc1238Holdable.connect(tokenOwner).burn(tokenOwner.address, tokenId, mintAmount);

      expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(0);
      expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(0);
    });

    it("should let a token owner burn some of their tokens", async () => {
      const amountToBurn = mintAmount - 1000;
      await erc1238Holdable.connect(tokenOwner).burn(tokenOwner.address, tokenId, amountToBurn);

      expect(await erc1238Holdable.escrowedBalance(tokenOwner.address, tokenId)).to.eq(mintAmount - amountToBurn);
      expect(await erc1238Holdable.balanceOf(tokenOwner.address, tokenId)).to.eq(mintAmount - amountToBurn);
    });

    it("should not give a token holder the right to burn tokens", async () => {
      await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, mintAmount);

      await expect(
        erc1238Holdable.connect(tokenHolder1).burn(tokenOwner.address, tokenId, mintAmount),
      ).to.be.revertedWith("ERC1238Holdable: Unauthorized to burn tokens");
    });

    it("should not let a token owner burn tokens they do not hold", async () => {
      const escrowedAmount = 2000;

      await erc1238Holdable.connect(tokenOwner).entrust(tokenHolder1.address, tokenId, escrowedAmount);

      const amountHeldByOwner = mintAmount - escrowedAmount;

      await expect(
        erc1238Holdable.connect(tokenOwner).burn(tokenOwner.address, tokenId, amountHeldByOwner + 1),
      ).to.be.revertedWith("ERC1238Holdable: Amount to burn exceeds amount held");
    });
  });
});
