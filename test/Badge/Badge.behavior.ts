import { expect } from "chai";

export function shouldBehaveLikeBadge(): void {
  it("should return the right owner address", async function () {
    expect(await this.Badge.connect(this.signers.admin).owner()).to.equal(this.signers.admin.address);
  });
}
