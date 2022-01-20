import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import type { Badge } from "../../src/types/Badge";
import { Signers } from "../types";
import { shouldBehaveLikeBadge } from "./Badge.behavior";

const BASE_URI = "https://token-cdn-domain/{id}.json";

describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers: SignerWithAddress[] = await ethers.getSigners();
    this.signers.admin = signers[0];
  });

  describe("Badge", function () {
    beforeEach(async function () {
      const BadgeArtifact: Artifact = await artifacts.readArtifact("Badge");
      this.Badge = <Badge>(
        await waffle.deployContract(this.signers.admin, BadgeArtifact, [this.signers.admin.address, BASE_URI])
      );
    });

    shouldBehaveLikeBadge();
  });
});
