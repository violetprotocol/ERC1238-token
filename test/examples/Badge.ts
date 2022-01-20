import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Badge } from "../../src/types/Badge";
import { expect } from "chai";
import { toBN } from "../utils/test-utils";

const BASE_URI = "https://token-cdn-domain/{id}.json";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Badge", function () {
  let badge: Badge;
  let admin: SignerWithAddress;
  let signer1: SignerWithAddress;
  let badgeRecipient: SignerWithAddress;

  before(async function () {
    const signers: SignerWithAddress[] = await ethers.getSigners();
    admin = signers[0];
    signer1 = signers[1];
    badgeRecipient = signers[2];
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
      await badge.connect(admin).mint(badgeRecipient.address, tokenId, tokenAmount, tokenURI, []);

      expect(await badge.balanceOf(badgeRecipient.address, tokenId)).to.eq(tokenAmount);
    });
  });
});
