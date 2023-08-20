//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Mock is ERC721Enumerable, Ownable {
    string public baseURI;

    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) Ownable() {
        baseURI = baseURI_;
    }

    /**
     * @dev set BaseURI
     * @param uri uri string
     */
    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    /**
     * @dev return base uri
     * @return returns saved base uri
     */
    function _baseURI() internal view override returns(string memory) {
        return baseURI;
    }

    /**
     * @dev mint all tokens at one time
     * @param totalSupply token count
     */
    function mintAll(uint256 totalSupply) public onlyOwner {
        for (uint256 i = 1; i <= totalSupply; i++) {
            _mint(msg.sender, i-1);
        }
    }
}
