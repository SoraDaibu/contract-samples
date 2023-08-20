// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { IERC721Enumerable } from '@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol';

interface IAuctionNFT is IERC721Enumerable {
    function mint(address, uint256) external;
}
