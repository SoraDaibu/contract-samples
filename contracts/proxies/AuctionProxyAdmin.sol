// SPDX-License-Identifier: Unlicense
/// @title Auction proxy admin

pragma solidity ^0.8.19;

import { ProxyAdmin } from '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol';

contract AuctionProxyAdmin is ProxyAdmin {
  constructor() ProxyAdmin() {}
}
