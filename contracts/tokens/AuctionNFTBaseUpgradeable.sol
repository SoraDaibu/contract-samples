// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ERC721Upgradeable } from '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import { IERC721Upgradeable } from '@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol';
import { ERC721EnumerableUpgradeable } from '@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol';
import { IAuctionNFT } from './IAuctionNFT.sol';

contract AuctionNFTBaseUpgradeable is ERC721EnumerableUpgradeable, OwnableUpgradeable {
    address public minter;
    string public baseURI;

    function initialize (string memory name, string memory symbol, string memory baseURI_, address _minter) external {
        __ERC721_init(name, symbol);

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
    function ownerOf(uint256 tokenId) public view override(ERC721Upgradeable, IERC721Upgradeable) returns (address) {
        address owner = _ownerOf(tokenId);
        return owner;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721EnumerableUpgradeable) returns (bool) {
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
