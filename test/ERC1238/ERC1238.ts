import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { ERC1238Mock } from "../../src/types/ERC1238Mock";
import { toBN, ZERO_ADDRESS } from "../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";

describe("ERC1238", function () {
  let erc1238Mock: ERC1238Mock;
  let admin: SignerWithAddress;
  let tokenRecipient: SignerWithAddress;
  let tokenBatchRecipient1: SignerWithAddress;
  let tokenBatchRecipient2: SignerWithAddress;
  let tokenBatchRecipients: string[];

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    tokenRecipient = signers[1];
    tokenBatchRecipient1 = signers[2];
    tokenBatchRecipient2 = signers[3];

    tokenBatchRecipients = [tokenBatchRecipient1.address, tokenBatchRecipient1.address, tokenBatchRecipient2.address];
  });

  beforeEach(async function () {
    const ERC1238MockArtifact: Artifact = await artifacts.readArtifact("ERC1238Mock");
    erc1238Mock = <ERC1238Mock>await waffle.deployContract(admin, ERC1238MockArtifact, [BASE_URI]);
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

    describe("_mintBatch - SINGLE recipient", () => {
      it("should revert with the zero address", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address,uint256[],uint256[],bytes)"](ZERO_ADDRESS, tokenBatchIds, mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: mint to the zero address");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address,uint256[],uint256[],bytes)"](
              tokenBatchRecipient1.address,
              tokenBatchIds.slice(1),
              mintBatchAmounts,
              data,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address,uint256[],uint256[],bytes)"](
              tokenBatchRecipient1.address,
              tokenBatchIds,
              mintBatchAmounts.slice(1),
              data,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should credit the minted tokens", async () => {
        await erc1238Mock
          .connect(admin)
          ["mintBatch(address,uint256[],uint256[],bytes)"](
            tokenBatchRecipient1.address,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          );

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await erc1238Mock.balanceOf(tokenBatchRecipient1.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          erc1238Mock["mintBatch(address,uint256[],uint256[],bytes)"](
            tokenBatchRecipient1.address,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          ),
        )
          .to.emit(erc1238Mock, "MintBatch(address,address,uint256[],uint256[])")
          .withArgs(admin.address, tokenBatchRecipient1.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    describe("_mintBatch - MULTIPLE recipients", () => {
      it("should revert with the zero address", async () => {
        const recipients = [ZERO_ADDRESS, tokenBatchRecipient1.address, tokenBatchRecipient2.address];
        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address[],uint256[],uint256[],bytes)"](recipients, tokenBatchIds, mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: mint to the zero address");
      });

      it("should revert if the length of ids and amounts do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address[],uint256[],uint256[],bytes)"](
              tokenBatchRecipients,
              tokenBatchIds,
              mintBatchAmounts.slice(1),
              data,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert if the length of ids and recipients do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address[],uint256[],uint256[],bytes)"](
              tokenBatchRecipients,
              tokenBatchIds.slice(1),
              mintBatchAmounts,
              data,
            ),
        ).to.be.revertedWith("ERC1238: to and ids length mismatch");

        await expect(
          erc1238Mock
            .connect(admin)
            ["mintBatch(address[],uint256[],uint256[],bytes)"](
              tokenBatchRecipients.slice(1),
              tokenBatchIds,
              mintBatchAmounts,
              data,
            ),
        ).to.be.revertedWith("ERC1238: to and ids length mismatch");
      });

      it("should credit the minted tokens", async () => {
        await erc1238Mock
          .connect(admin)
          ["mintBatch(address[],uint256[],uint256[],bytes)"](
            tokenBatchRecipients,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          );

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await erc1238Mock.balanceOf(tokenBatchRecipients[index], tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          erc1238Mock["mintBatch(address[],uint256[],uint256[],bytes)"](
            tokenBatchRecipients,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          ),
        )
          .to.emit(erc1238Mock, "MintBatch(address,address[],uint256[],uint256[])")
          .withArgs(admin.address, tokenBatchRecipients, tokenBatchIds, mintBatchAmounts);
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

    describe("_burnBatch - SINGLE recipient", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address,uint256[],uint256[])"](ZERO_ADDRESS, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address,uint256[],uint256[])"](
              tokenBatchRecipient1.address,
              tokenBatchIds.slice(1),
              burnBatchAmounts,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address,uint256[],uint256[])"](
              tokenBatchRecipient1.address,
              tokenBatchIds,
              burnBatchAmounts.slice(1),
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert when burning a non-existent token id", async () => {
        await erc1238Mock
          .connect(admin)
          ["mintBatch(address,uint256[],uint256[],bytes)"](
            tokenBatchRecipient1.address,
            tokenBatchIds.slice(1),
            burnBatchAmounts.slice(1),
            data,
          );

        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address,uint256[],uint256[])"](tokenRecipient.address, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should properly burn tokens", async () => {
        await erc1238Mock
          .connect(admin)
          ["mintBatch(address,uint256[],uint256[],bytes)"](
            tokenBatchRecipient1.address,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          );

        await erc1238Mock
          .connect(admin)
          ["burnBatch(address,uint256[],uint256[])"](tokenBatchRecipient1.address, tokenBatchIds, burnBatchAmounts);

        tokenBatchIds.forEach(async (tokenId, i) =>
          expect(await erc1238Mock.balanceOf(tokenBatchRecipient1.address, tokenId)).to.eq(
            mintBatchAmounts[i].sub(burnBatchAmounts[i]),
          ),
        );
      });

      it("should emit a BurnBatch event", async () => {
        await erc1238Mock["mintBatch(address,uint256[],uint256[],bytes)"](
          tokenBatchRecipient1.address,
          tokenBatchIds,
          mintBatchAmounts,
          data,
        );

        await expect(
          erc1238Mock["burnBatch(address,uint256[],uint256[])"](
            tokenBatchRecipient1.address,
            tokenBatchIds,
            burnBatchAmounts,
          ),
        )
          .to.emit(erc1238Mock, "BurnBatch(address,address,uint256[],uint256[])")
          .withArgs(admin.address, tokenBatchRecipient1.address, tokenBatchIds, burnBatchAmounts);
      });
    });

    describe("_burnBatch - MULTIPLE recipients", () => {
      it("should revert when burning the zero account's token", async () => {
        const recipients = [ZERO_ADDRESS, tokenBatchRecipient1.address, tokenBatchRecipient2.address];
        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address[],uint256[],uint256[])"](recipients, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert if the length of ids and amounts do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address[],uint256[],uint256[])"](
              tokenBatchRecipients,
              tokenBatchIds,
              burnBatchAmounts.slice(1),
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert if the length of ids and recipients do not match", async () => {
        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address[],uint256[],uint256[])"](
              tokenBatchRecipients,
              tokenBatchIds.slice(1),
              burnBatchAmounts,
            ),
        ).to.be.revertedWith("ERC1238: from and ids length mismatch");

        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address[],uint256[],uint256[])"](
              tokenBatchRecipients.slice(1),
              tokenBatchIds,
              burnBatchAmounts,
            ),
        ).to.be.revertedWith("ERC1238: from and ids length mismatch");
      });

      it("should revert when burning a non-existent token id", async () => {
        await erc1238Mock
          .connect(admin)
          ["mintBatch(address[],uint256[],uint256[],bytes)"](
            tokenBatchRecipients.slice(1),
            tokenBatchIds.slice(1),
            burnBatchAmounts.slice(1),
            data,
          );

        await expect(
          erc1238Mock
            .connect(admin)
            ["burnBatch(address[],uint256[],uint256[])"](tokenBatchRecipients, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should properly burn tokens", async () => {
        await erc1238Mock
          .connect(admin)
          ["mintBatch(address[],uint256[],uint256[],bytes)"](
            tokenBatchRecipients,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          );

        await erc1238Mock
          .connect(admin)
          ["burnBatch(address[],uint256[],uint256[])"](tokenBatchRecipients, tokenBatchIds, burnBatchAmounts);

        tokenBatchIds.forEach(async (tokenId, i) =>
          expect(await erc1238Mock.balanceOf(tokenRecipient.address, tokenId)).to.eq(
            mintBatchAmounts[i].sub(burnBatchAmounts[i]),
          ),
        );
      });

      it("should emit a BurnBatch event", async () => {
        await erc1238Mock["mintBatch(address[],uint256[],uint256[],bytes)"](
          tokenBatchRecipients,
          tokenBatchIds,
          mintBatchAmounts,
          data,
        );

        await expect(
          erc1238Mock["burnBatch(address[],uint256[],uint256[])"](
            tokenBatchRecipients,
            tokenBatchIds,
            burnBatchAmounts,
          ),
        )
          .to.emit(erc1238Mock, "BurnBatch(address,address[],uint256[],uint256[])")
          .withArgs(admin.address, tokenBatchRecipients, tokenBatchIds, burnBatchAmounts);
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
