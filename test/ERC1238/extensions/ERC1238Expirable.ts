import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { ERC1238ExpirableMock } from "../../../src/types/ERC1238ExpirableMock";
import { ERC1238ReceiverMock } from "../../../src/types/ERC1238ReceiverMock";
import { toBN } from "../../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";
const timestampInThePast = 955288375;

const increaseEVMTime = async (time: number) => {
  await ethers.provider.send("evm_increaseTime", [time]);
  await ethers.provider.send("evm_mine", []);
};

describe("ERC1238Expirable", function () {
  let erc1238ExpirableMock: ERC1238ExpirableMock;
  let admin: SignerWithAddress;
  let contractRecipient: ERC1238ReceiverMock;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
  });

  beforeEach(async function () {
    const ERC1238ExpirableMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ExpirableMock");
    erc1238ExpirableMock = <ERC1238ExpirableMock>(
      await waffle.deployContract(admin, ERC1238ExpirableMockArtifact, [BASE_URI])
    );

    const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
    contractRecipient = <ERC1238ReceiverMock>await waffle.deployContract(admin, ERC1238ReceiverMockArtifact);
  });

  describe("Expirable extension", () => {
    const data = "0x12345678";
    const tokenId = toBN("11223344");
    const tokenExpiryDate = 4110961214;
    const mintAmount = toBN("58319");

    const tokenBatchIds = [toBN("2000"), toBN("2010"), toBN("2020")];
    const tokenBatchExpiryDates = [4110961215, 4110961216, 4110961217];

    describe("setExpiryDate", () => {
      it("should set the right expiry date", async () => {
        await erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate);

        expect(await erc1238ExpirableMock.expiryDate(tokenId)).to.eq(tokenExpiryDate);
      });

      it("should revert when trying to set an expiry date in the past", async () => {
        await expect(erc1238ExpirableMock.setExpiryDate(tokenId, timestampInThePast)).to.be.revertedWith(
          "ERC1238Expirable: Expiry date cannot be in the past",
        );
      });

      it("should revert when trying to set an expiry date which is earlier than the currently set date", async () => {
        await erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate);

        await expect(erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate - 100)).to.be.revertedWith(
          "ERC1238Expirable: Expiry date can only be extended",
        );
      });
    });

    describe("setBatchExpiryDates", () => {
      it("should set the right expiry dates", async () => {
        await erc1238ExpirableMock.setBatchExpiryDates(tokenBatchIds, tokenBatchExpiryDates);

        tokenBatchIds.forEach(async (id, index) => {
          expect(await erc1238ExpirableMock.expiryDate(id)).to.eq(tokenBatchExpiryDates[index]);
        });
      });

      it("should revert if the ids and dates length do not match", async () => {
        await expect(
          erc1238ExpirableMock.setBatchExpiryDates(tokenBatchIds, tokenBatchExpiryDates.slice(1)),
        ).to.be.revertedWith("ERC1238Expirable: Ids and token URIs length mismatch");
      });

      it("should revert if a date shortens the expiry", async () => {
        await erc1238ExpirableMock.setBatchExpiryDates(tokenBatchIds, tokenBatchExpiryDates);

        const newDates = [tokenBatchExpiryDates[0] - 1, ...tokenBatchExpiryDates.slice(1)];

        await expect(erc1238ExpirableMock.setBatchExpiryDates(tokenBatchIds, newDates)).to.be.revertedWith(
          "ERC1238Expirable: Expiry date can only be extended",
        );
      });
    });

    describe("isExpired", () => {
      it("should revert if no expiry date was set", async () => {
        await expect(erc1238ExpirableMock.isExpired(0)).to.be.revertedWith("ERC1238Expirable: No expiry date set");
      });

      it("should return false for a token that is not expired", async () => {
        await erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate);

        expect(await erc1238ExpirableMock.isExpired(tokenId)).to.be.false;
      });

      it("should return true for an expired token", async () => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const blockTimestamp = blockBefore.timestamp;
        // Setting the expiry 100 secs from now
        const expiry = blockTimestamp + 100;

        await erc1238ExpirableMock.setExpiryDate(tokenId, expiry);

        // Increasing time by 200 seconds, so the token should be expired
        await increaseEVMTime(200);

        expect(await erc1238ExpirableMock.isExpired(tokenId)).to.be.true;
      });
    });

    describe("expiryDate", () => {
      it("should revert if no expiry date was set", async () => {
        await expect(erc1238ExpirableMock.expiryDate(0)).to.be.revertedWith("ERC1238Expirable: No expiry date set");
      });

      it("should return the right expiry date", async () => {
        await erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate);

        expect(await erc1238ExpirableMock.expiryDate(tokenId)).to.eq(tokenExpiryDate);
      });
    });

    describe("Minting", () => {
      it("should mint and set the right expiryDate", async () => {
        await erc1238ExpirableMock.mintToContract(
          contractRecipient.address,
          tokenId,
          mintAmount,
          tokenExpiryDate,
          data,
        );

        expect(await erc1238ExpirableMock.expiryDate(tokenId)).to.eq(tokenExpiryDate);
      });
    });
  });
});
