import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { ERC1238ExpirableMock } from "../../../src/types/ERC1238ExpirableMock";
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
  // let tokenRecipient: SignerWithAddress;
  // let tokenBatchRecipient: SignerWithAddress;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    // tokenRecipient = signers[1];
    // tokenBatchRecipient = signers[2];
  });

  beforeEach(async function () {
    const ERC1238ExpirableMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ExpirableMock");
    erc1238ExpirableMock = <ERC1238ExpirableMock>(
      await waffle.deployContract(admin, ERC1238ExpirableMockArtifact, [BASE_URI])
    );
  });

  describe("internal functions", () => {
    const data = "0x12345678";
    const tokenId = toBN("11223344");
    const tokenExpiryDate = 4110961214;
    const mintAmount = toBN("58319");
    const burnAmount = toBN("987");

    const tokenBatchIds = [toBN("2000"), toBN("2010"), toBN("2020")];
    const tokenBatchURIs = [
      "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu",
      "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiv",
      "https://ipfs.io/ipfs/Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiw",
    ];
    const mintBatchAmounts = [toBN("5000"), toBN("10000"), toBN("42195")];
    const burnBatchAmounts = [toBN("5000"), toBN("9001"), toBN("195")];

    describe("_setExpiryDate", () => {
      it("should set the right expiry date", async () => {
        await erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate);

        expect(await erc1238ExpirableMock.expiryDate(tokenId)).to.eq(tokenExpiryDate);
      });

      it("should revert when trying to set an expiry date in the past", async () => {
        await expect(erc1238ExpirableMock.setExpiryDate(tokenId, timestampInThePast)).to.be.revertedWith(
          "ERC1238Expirable: Expiry date cannot be in the past",
        );
      });
    });

    describe("isExpired", () => {
      it("should return for a token that is not expired", async () => {
        await erc1238ExpirableMock.setExpiryDate(tokenId, tokenExpiryDate);

        expect(await erc1238ExpirableMock.isExpired(tokenId)).to.be.false;
      });

      it("should return true for an expired token", async () => {
        const blockNumBefore = await ethers.provider.getBlockNumber();
        const blockBefore = await ethers.provider.getBlock(blockNumBefore);
        const blockTimestamp = blockBefore.timestamp;
        const expiry = blockTimestamp + 100;

        await erc1238ExpirableMock.setExpiryDate(tokenId, expiry);

        await increaseEVMTime(200);

        expect(await erc1238ExpirableMock.isExpired(tokenId)).to.be.true;
      });
    });
  });
});
