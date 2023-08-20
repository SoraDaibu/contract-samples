// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { IERC165Upgradeable } from "@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IAuction } from "./IAuction.sol";
import { IAuctionNFT } from "./tokens/IAuctionNFT.sol";
import { EthTransfer } from "./tokens/EthTransfer.sol";

contract Auction is IAuction, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    // =============================================================
    //                           LIBRARIES
    // =============================================================
    using EthTransfer for address;

    // =============================================================
    //                           STORAGE
    // =============================================================
    /// @dev Map for auction id to corresponding auction.
    mapping (uint256 => Auction) private _auctions;
    /// @dev current auction id
    uint256 private _currentAuctionId;
    /// @dev Map bids to corresponding NFT.
    mapping (address => mapping (uint256 => Bid[])) private _bids;

    // =============================================================
    //                         MUTABLE FUNCTIONS
    // =============================================================
    function initialize() external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
    }

    function createAuction (
        address token, uint256 tokenIdStart, uint256 tokenIdEnd,
        uint256 startAt, uint256 finishAt, uint256 startingPrice
    ) external onlyOwner nonReentrant {
        require(token != address(0), "Auction token can't be zero");
        require(IERC165Upgradeable(token).supportsInterface(type(IAuctionNFT).interfaceId),
            "NFT must have IAuctionNFT supportsInterface");
        for (uint256 i = tokenIdStart; i <= tokenIdEnd; ++i) {
            require(IERC721(token).ownerOf(i) == address(0), "Token already minted");
        }
        _requireNFTsNotOnAuctions(token, tokenIdStart, tokenIdEnd);
        require(tokenIdStart <= tokenIdEnd, "tokenIdStart can't be lower than tokenIdEnd");
        require(startAt >= block.timestamp, "startAt must be equal or after block.timestamp");
        require(startAt < finishAt, "finishAt must be after startAt");

        ++_currentAuctionId;
        _auctions[_currentAuctionId] = Auction({
            token: token,
            tokenIdStart: tokenIdStart,
            tokenIdEnd: tokenIdEnd,
            startAt: startAt,
            finishAt: finishAt,
            startingPrice: startingPrice
        });
        emit CreatedAuction(_currentAuctionId, token, tokenIdStart, tokenIdEnd, startAt, finishAt, startingPrice);
    }

    function cancelAuction(uint256 auctionId) external onlyOwner nonReentrant {
        _requireAuctionExists(auctionId);
        Auction memory auction = _auctions[auctionId];
        require(auction.startAt > block.timestamp, "Auction has started");

        delete _auctions[auctionId];
        emit CanceledAuction(auctionId, auction.token, auction.tokenIdStart, auction.tokenIdEnd);
    }

    function bid(uint256 auctionId, uint256 tokenId) external payable nonReentrant {
        _requireAuctionExists(auctionId);
        Auction memory auction = _auctions[auctionId];
        require(_isOnAuction(auction, tokenId), "Invalid tokenId to bid");
        require(block.timestamp >= auction.startAt && block.timestamp < auction.finishAt, "Not during auction");
        require(msg.value >= auction.startingPrice, "Must bid at least starting price");

        uint256 length = _bids[auction.token][tokenId].length;
        // return bid
        if (length != 0) {
            Bid memory latestBid = _bids[auction.token][tokenId][length - 1];
            require(msg.value > latestBid.price, "Must bid at least current bid");
            latestBid.bidder.transferEth(latestBid.price);
        }

        _bids[auction.token][tokenId].push(Bid(msg.value, msg.sender));
        emit CreatedBid(auction.token, tokenId, msg.value, msg.sender);
    }

    function settleAuction(uint256 auctionId) external onlyOwner nonReentrant {
        _requireAuctionExists(auctionId);
        Auction memory auction = _auctions[auctionId];
        require(auction.finishAt <= block.timestamp, "Auction has not finished yet");

        uint256 proceeds;
        uint256 tokenAmount = auction.tokenIdEnd + 1 - auction.tokenIdStart;
        // transfer all ETH and NFT for the auction
        for (uint256 i; i < tokenAmount; ++i){
            uint256 tokenId = auction.tokenIdStart + i;
            if (_bidExists(auction.token, tokenId)) {
                // transfer ETH
                Bid memory latestBid = _bids[auction.token][tokenId][_bids[auction.token][tokenId].length - 1];
                owner().transferEth(latestBid.price);
                proceeds += latestBid.price;
                // mint NFT
                IAuctionNFT(auction.token).mint(latestBid.bidder, tokenId);
                emit SettledAuction(auctionId, auction.token, tokenId, latestBid.price);
            }
        }

        delete _auctions[auctionId];
        emit SettledEntireAuction(
            auctionId, auction.token, auction.tokenIdStart, auction.tokenIdEnd,
            auction.startAt, auction.finishAt, proceeds);
    }

    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================
    function getLatestAuction() external view returns(Auction memory) {
        return _auctions[_currentAuctionId];
    }

    function getAuction(uint256 auctionId) external view returns(Auction memory) {
        return _auctions[auctionId];
    }

    function getCurrentAuctionId() external view returns(uint256) {
        return _currentAuctionId;
    }

    function getCurrentBid(uint256 auctionId, uint256 tokenId) external view returns(Bid memory){
        address token = _auctions[auctionId].token;
        return _bids[token][tokenId][_bids[token][tokenId].length - 1];
    }

    function getBids(uint256 auctionId, uint256 tokenId) external view returns(Bid[] memory){
        address token = _auctions[auctionId].token;
        return _bids[token][tokenId];
    }

    function _auctionExists(uint256 auctionId) internal view returns(bool){
            return _auctions[auctionId].startAt != 0;
    }

    function _bidExists(address token, uint256 tokenId) internal view returns(bool){
            return _bids[token][tokenId].length > 0;
    }

    function _requireAuctionExists(uint256 auctionId) internal view {
        require(_auctionExists(auctionId), "Auction does not exist");
    }

    function _isOnAuction(Auction memory auction, uint256 tokenId) internal pure returns(bool){
        return tokenId >= auction.tokenIdStart && tokenId <= auction.tokenIdEnd;
    }

    function _requireNFTsNotOnAuctions(address token, uint256 tokenIdStart, uint256 tokenIdEnd) internal view {
        for (uint256 i = 1; i <= _currentAuctionId; ++i) {
            Auction memory auction = _auctions[i];
            if (token == auction.token) {
                require(!_isOnAuction(auction, tokenIdStart), "NFT is already on auction");
                require(!_isOnAuction(auction, tokenIdEnd), "NFT is already on auction");
            }
        }
    }
}
