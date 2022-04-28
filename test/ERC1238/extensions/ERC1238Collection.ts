import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { ERC1238CollectionMock } from "../../../src/types/ERC1238CollectionMock";
import { ERC1238ReceiverMock } from "../../../src/types/ERC1238ReceiverMock";
import { shouldSupportInterfaces, toBN, ZERO_ADDRESS } from "../../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";

// TODO: Add equivalent tests for EOAs
describe("ERC1238Collection", function () {
  let erc1238Collection: ERC1238CollectionMock;
  let smartContractRecipient1: ERC1238ReceiverMock;
  let admin: SignerWithAddress;
  // let tokenRecipient: SignerWithAddress;
  // let tokenBatchRecipient: SignerWithAddress;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
  });

  beforeEach(async function () {
    const erc1238CollectionArtifact: Artifact = await artifacts.readArtifact("ERC1238CollectionMock");
    erc1238Collection = <ERC1238CollectionMock>(
      await waffle.deployContract(admin, erc1238CollectionArtifact, [BASE_URI])
    );
    const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
    smartContractRecipient1 = <ERC1238ReceiverMock>await waffle.deployContract(admin, ERC1238ReceiverMockArtifact);
  });

  describe("ERC165", () => {
    it("should support the right interfaces", async () => {
      const supported = await shouldSupportInterfaces(erc1238Collection, ["IERC165", "IERC1238", "IERC1238Collection"]);

      expect(supported).to.eq(true);
    });
  });

  describe("internal functions", () => {
    const data = "0x12345678";
    const tokenId = toBN("11223344");
    const mintAmount = toBN("58319");
    const burnAmount = toBN("987");

    const baseId_1 = toBN("777", 0);
    const baseId_2 = toBN("888", 0);

    const counter_0 = 0;
    const counter_1 = 1;

    let tokenBatchIds: BigNumber[];
    const mintBatchAmounts = [toBN("5000"), toBN("10000"), toBN("42195"), toBN("9876")];
    const burnBatchAmounts = [toBN("5000"), toBN("9001"), toBN("195"), toBN("999")];

    /*
     * MINTING
     */

    describe("_mint", () => {
      const baseId = 999;
      const counter_0 = 0;
      const counter_1 = 1;
      describe("Base Id for NFTs", () => {
        const NFT_AMOUNT = 1;
        it("should credit the right balance of tokens from a base id", async () => {
          const tokenId = await erc1238Collection.getConstructedTokenID(
            baseId,
            smartContractRecipient1.address,
            counter_0,
          );

          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, NFT_AMOUNT, []);

          expect(await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId)).to.eq(NFT_AMOUNT);
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(NFT_AMOUNT);
        });

        it("should aggregate balances of different NFTs with the same base id", async () => {
          const tokenId_0 = await erc1238Collection.getConstructedTokenID(
            baseId,
            smartContractRecipient1.address,
            counter_0,
          );
          const tokenId_1 = await erc1238Collection.getConstructedTokenID(
            baseId,
            smartContractRecipient1.address,
            counter_1,
          );

          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId_0, NFT_AMOUNT, []);
          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId_1, NFT_AMOUNT, []);

          expect(await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId)).to.eq(
            NFT_AMOUNT * 2,
          );
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId_0)).to.eq(NFT_AMOUNT);
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId_1)).to.eq(NFT_AMOUNT);
        });
      });

      describe("Base Id for FTs", () => {
        const FT_AMOUNT = 92837465;
        const FT_AMOUNT_1 = 123456;
        it("should credit the right balance of tokens from a base id", async () => {
          const tokenId = await erc1238Collection.getConstructedTokenID(
            baseId,
            smartContractRecipient1.address,
            counter_0,
          );

          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, FT_AMOUNT, []);

          expect(await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId)).to.eq(FT_AMOUNT);
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(FT_AMOUNT);
        });

        it("should aggregate balances of different FTs with the same base id", async () => {
          const baseId = 999;
          const counter_0 = 0;
          const counter_1 = 1;

          const tokenId_0 = await erc1238Collection.getConstructedTokenID(
            baseId,
            smartContractRecipient1.address,
            counter_0,
          );
          const tokenId_1 = await erc1238Collection.getConstructedTokenID(
            baseId,
            smartContractRecipient1.address,
            counter_1,
          );

          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId_0, FT_AMOUNT, []);
          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId_1, FT_AMOUNT_1, []);

          expect(await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId)).to.eq(
            FT_AMOUNT + FT_AMOUNT_1,
          );
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId_0)).to.eq(FT_AMOUNT);
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId_1)).to.eq(FT_AMOUNT_1);
        });
      });

      it("should revert with the zero address as recipient", async () => {
        await expect(
          erc1238Collection.connect(admin).mintToContract(ZERO_ADDRESS, tokenId, mintAmount, data),
        ).to.be.revertedWith("ERC1238: Recipient is not a contract");
      });

      it("should credit the amount of tokens", async () => {
        await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, mintAmount, data);

        const balance = await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should emit a MintSingle event", async () => {
        await expect(erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, mintAmount, data))
          .to.emit(erc1238Collection, "MintSingle")
          .withArgs(admin.address, smartContractRecipient1.address, tokenId, mintAmount);
      });
    });

    describe("_mintBatch", () => {
      before(async () => {
        const tokenId_0 = await erc1238Collection.getConstructedTokenID(
          baseId_1,
          smartContractRecipient1.address,
          counter_0,
        );
        const tokenId_1 = await erc1238Collection.getConstructedTokenID(
          baseId_1,
          smartContractRecipient1.address,
          counter_1,
        );
        const tokenId_2 = await erc1238Collection.getConstructedTokenID(
          baseId_2,
          smartContractRecipient1.address,
          counter_0,
        );
        const tokenId_3 = await erc1238Collection.getConstructedTokenID(
          baseId_2,
          smartContractRecipient1.address,
          counter_1,
        );

        tokenBatchIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
      });
      describe("Base ID", () => {
        it("should credit the right base ids", async () => {
          await erc1238Collection
            .connect(admin)
            .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

          const balanceOfBaseId1 = await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId_1);
          const balanceOfBaseId2 = await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId_2);

          expect(balanceOfBaseId1).to.eq(mintBatchAmounts[0].add(mintBatchAmounts[1]));
          expect(balanceOfBaseId2).to.eq(mintBatchAmounts[2].add(mintBatchAmounts[3]));
        });
      });

      it("should revert with the zero address", async () => {
        await expect(
          erc1238Collection.connect(admin).mintBatchToContract(ZERO_ADDRESS, tokenBatchIds, mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: Recipient is not a contract");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          erc1238Collection
            .connect(admin)
            .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds.slice(1), mintBatchAmounts, data),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          erc1238Collection
            .connect(admin)
            .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts.slice(1), data),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should credit the minted tokens", async () => {
        await erc1238Collection
          .connect(admin)
          .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(
            mintBatchAmounts[index],
          ),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          erc1238Collection.mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data),
        )
          .to.emit(erc1238Collection, "MintBatch")
          .withArgs(admin.address, smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    /*
     * BURNING
     */
    describe("Burning", () => {
      describe("_burn", () => {
        describe("baseId", () => {
          it("should decrease the base Id balance", async () => {
            const baseId = 999;
            const counter = 42;
            const mintAmount = toBN("50");
            const burnAmount = toBN("25");

            const tokenId = await erc1238Collection.getConstructedTokenID(
              baseId,
              smartContractRecipient1.address,
              counter,
            );

            await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, mintAmount, []);

            await erc1238Collection.burn(smartContractRecipient1.address, tokenId, burnAmount);

            expect(await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId)).to.eq(
              mintAmount.sub(burnAmount),
            );
          });
        });

        it("should revert when burning the zero account's token", async () => {
          await expect(erc1238Collection.connect(admin).burn(ZERO_ADDRESS, tokenId, burnAmount)).to.be.revertedWith(
            "ERC1238: burn from the zero address",
          );
        });

        it("should revert when burning a non-existent token id", async () => {
          await expect(
            erc1238Collection.connect(admin).burn(smartContractRecipient1.address, tokenId, burnAmount),
          ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
        });

        it("should revert when burning more than available balance", async () => {
          const amountToMint = burnAmount.sub(1);
          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, amountToMint, data);

          await expect(
            erc1238Collection.connect(admin).burn(smartContractRecipient1.address, tokenId, burnAmount),
          ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
        });

        it("should burn the right amount of tokens", async () => {
          const amountToMint = burnAmount.add(1);

          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, amountToMint, data);

          await erc1238Collection.connect(admin).burn(smartContractRecipient1.address, tokenId, burnAmount);

          expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(1);
        });

        it("should emit a BurnSingle event", async () => {
          await erc1238Collection.mintToContract(smartContractRecipient1.address, tokenId, burnAmount, data);

          await expect(erc1238Collection.burn(smartContractRecipient1.address, tokenId, burnAmount))
            .to.emit(erc1238Collection, "BurnSingle")
            .withArgs(admin.address, smartContractRecipient1.address, tokenId, burnAmount);
        });
      });

      describe("_burnBatch", () => {
        before(async () => {
          const tokenId_0 = await erc1238Collection.getConstructedTokenID(
            baseId_1,
            smartContractRecipient1.address,
            counter_0,
          );
          const tokenId_1 = await erc1238Collection.getConstructedTokenID(
            baseId_1,
            smartContractRecipient1.address,
            counter_1,
          );

          const tokenId_2 = await erc1238Collection.getConstructedTokenID(
            baseId_2,
            smartContractRecipient1.address,
            counter_0,
          );
          const tokenId_3 = await erc1238Collection.getConstructedTokenID(
            baseId_2,
            smartContractRecipient1.address,
            counter_1,
          );

          tokenBatchIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
        });

        describe("baseId", () => {
          it("should properly decrease the baseId balances", async () => {
            await erc1238Collection
              .connect(admin)
              .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

            await erc1238Collection
              .connect(admin)
              .burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts);

            const baseId1Balance = await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId_1);
            const baseId2Balance = await erc1238Collection.balanceFromBaseId(smartContractRecipient1.address, baseId_2);

            const remainingAmounts = tokenBatchIds.map((_, index) =>
              mintBatchAmounts[index].sub(burnBatchAmounts[index]),
            );

            expect(baseId1Balance).to.eq(remainingAmounts[0].add(remainingAmounts[1]));
            expect(baseId2Balance).to.eq(remainingAmounts[2].add(remainingAmounts[3]));
          });
        });
        it("should revert when burning the zero account's token", async () => {
          await expect(
            erc1238Collection.connect(admin).burnBatch(ZERO_ADDRESS, tokenBatchIds, burnBatchAmounts),
          ).to.be.revertedWith("ERC1238: burn from the zero address");
        });

        it("should revert if the length of inputs do not match", async () => {
          await expect(
            erc1238Collection
              .connect(admin)
              .burnBatch(smartContractRecipient1.address, tokenBatchIds.slice(1), burnBatchAmounts),
          ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

          await expect(
            erc1238Collection
              .connect(admin)
              .burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts.slice(1)),
          ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
        });

        it("should revert when burning a non-existent token id", async () => {
          await erc1238Collection
            .connect(admin)
            .mintBatchToContract(
              smartContractRecipient1.address,
              tokenBatchIds.slice(1),
              burnBatchAmounts.slice(1),
              data,
            );

          await expect(
            erc1238Collection
              .connect(admin)
              .burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts),
          ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
        });

        it("should properly burn tokens", async () => {
          await erc1238Collection
            .connect(admin)
            .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

          await erc1238Collection
            .connect(admin)
            .burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts);

          tokenBatchIds.forEach(async (tokenId, i) =>
            expect(await erc1238Collection.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(
              mintBatchAmounts[i].sub(burnBatchAmounts[i]),
            ),
          );
        });

        it("should emit a BurnBatch event", async () => {
          await erc1238Collection.mintBatchToContract(
            smartContractRecipient1.address,
            tokenBatchIds,
            mintBatchAmounts,
            data,
          );

          await expect(erc1238Collection.burnBatch(smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts))
            .to.emit(erc1238Collection, "BurnBatch")
            .withArgs(admin.address, smartContractRecipient1.address, tokenBatchIds, burnBatchAmounts);
        });
      });
    });
  });
});
