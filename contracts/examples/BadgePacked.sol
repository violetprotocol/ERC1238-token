// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ERC1238/extensions/ERC1238Packed.sol";

contract BadgePacked is ERC1238, ERC1238Packed {

  address private _owner;

  constructor(address owner_, string memory baseURI_) ERC1238(baseURI_) {
    _owner = owner_;
  }

  modifier onlyOwner() {
      require(msg.sender == _owner, "Not owner");
      _;
  }

  function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override(ERC1238, ERC1238Packed) {
        return super._beforeMint(minter, to, id, amount, data);
  }

   function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal override(ERC1238, ERC1238Packed) { 
       return super._beforeBurn(burner, from, id, amount);
    }

  function setOwner(address newOwner) external onlyOwner {
     require(newOwner != address(0), "Invalid address for new owner");
        _owner = newOwner;
  }

  function setBaseURI(string memory newBaseURI) external onlyOwner {
    _setBaseURI(newBaseURI);
  }

  function mint(
      address to,
      uint256 id,
      uint256 amount,
      bytes memory data
  ) external onlyOwner {
      _mint(to, id, amount, data);
  }


  function mintBatch(
     address to,
      uint256[] memory ids,
      uint256[] memory amounts,
      bytes memory data
  ) external onlyOwner {
     _mintBatch(to, ids, amounts, data);
  }


  function burn(
      address from,
      uint256 id,
      uint256 amount
  ) external onlyOwner {
      _burn(from, id, amount);
  }


  function burnBatch(
      address from,
      uint256[] memory ids,
      uint256[] memory amounts
  ) external onlyOwner {
      _burnBatch(from, ids, amounts);
  }

}