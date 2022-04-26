export const IERC1238 = [
  "balanceOf(address,uint256)",
  "balanceOfBatch(address,uint256[])",
  "balanceOfBundle(address[],uint256[][])",
];

export const IERC1238Receiver = [
  "onERC1238Mint(address,uint256,uint256,bytes)",
  "onERC1238BatchMint(address,uint256[],uint256[],bytes)",
];

export const IERC1238Collection = ["balanceFromBaseId(address,uint48)", "getConstructedTokenID(uint48,address,uint48)"];

export const IERC1238URIStorage = ["tokenURI(uint256)"];

export const IERC165 = ["supportsInterface(bytes4)"];
