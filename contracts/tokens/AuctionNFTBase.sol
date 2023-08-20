// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { IERC721 } from '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import { ERC721Enumerable } from '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import { IAuctionNFT } from './IAuctionNFT.sol';

contract AuctionNFTBase is ERC721Enumerable, Ownable {
    address public minter;
    string public baseURI;

    constructor(string memory name_, string memory symbol_, string memory baseURI_, address _minter) ERC721(name_, symbol_)  {
        baseURI = baseURI_;
        minter = _minter;
    }

    modifier onlyMinter() {
        require(_msgSender() == minter, "Sender is not the minter");
        _;
    }

    /**
     * @dev Mint an NFT
     * @param to account to receive an NFT
     * @param tokenId tokenId to mint
     */
    function mint(address to, uint256 tokenId) external virtual {
        _safeMint(to, tokenId);
    }

    /**
     * @dev Get owner of NFT. This does not revert when there is no owner.
     * @param tokenId tokenId of NFT
     */
    function ownerOf(uint256 tokenId) public view override(ERC721, IERC721) returns (address) {
        address owner = _ownerOf(tokenId);
        return owner;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable) returns (bool) {
        return interfaceId == type(IAuctionNFT).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Set BaseURI
     * @param uri uri string
     */
    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    /**
     * @dev Return base uri
     * @return returns saved base uri
     */
    function _baseURI() internal view override returns(string memory) {
        return baseURI;
    }

    /**
     * @dev Set minter for the contract
     * @param _minter an account that can mint
    */
    function setMinter(address _minter) public onlyOwner {
        minter = _minter;
    }
}
