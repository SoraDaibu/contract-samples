// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

interface IAuction {
    // =============================================================
    //                           STRUCTS
    // =============================================================

    /**
    * @dev auction struct
    * @param token token contract address that is being auctioned
    * @param tokenIdStart start tokenId of auction
    * @param tokenIdEnd end tokenId of auction
    * @param startAt the time when auction starts
    * @param finishAt the time when auction finishes
    * @param startingPrice the minimal price for first bid
    */
    struct Auction {
        address token;
        uint256 tokenIdStart;
        uint256 tokenIdEnd;
        uint256 startAt;
        uint256 finishAt;
        uint256 startingPrice;
    }

    /**
    * @dev bid struct
    * @param price bid price
    * @param bidder an account address of bidder
    */
    struct Bid {
        uint256 price;
        address bidder;
    }

    // =============================================================
    //                           EVENTS
    // =============================================================
    /**
     * @dev event of order generation
     * @param auctionId auction id
     * @param token token address to auction
     * @param tokenIdStart start tokenId of auction
     * @param tokenIdEnd end tokenId of auction
     * @param startAt auction start date time
     * @param finishAt auction finish date time
     * @param startingPrice the minimal price of the first bid
     */
    event CreatedAuction(
        uint256 auctionId,
        address token,
        uint256 tokenIdStart,
        uint256 tokenIdEnd,
        uint256 startAt,
        uint256 finishAt,
        uint256 startingPrice
    );

    /**
     * @dev event of canceling auction
     * @param auctionId auction id
     * @param token token address to auction
     * @param tokenIdStart start tokenId of auction
     * @param tokenIdEnd end tokenId of auction
     */
    event CanceledAuction(
        uint256 auctionId,
        address token,
        uint256 tokenIdStart,
        uint256 tokenIdEnd
    );

    /**
     * @dev event of bid
     * @param token token address to auction
     * @param tokenId token id to auction
     * @param bidPrice bid price
     * @param bidder bid address
     */
    event CreatedBid(
        address indexed token,
        uint256 indexed tokenId,
        uint256 bidPrice,
        address bidder
    );

    /**
     * @dev event of settling auction
     * @param auctionId auction id
     * @param token token address to auction
     * @param tokenId tokenId of auction
     * @param wonPrice won price for the auctioned NFT
     */
    event SettledAuction(
        uint256 auctionId,
        address indexed token,
        uint256 indexed tokenId,
        uint256 wonPrice
    );

    /**
     * @dev event of settling entire auction
     * @param auctionId auction id
     * @param token token address to auction
     * @param tokenIdStart start tokenId of auction
     * @param tokenIdEnd end tokenId of auction
     * @param startAt auction start date time
     * @param finishAt auction finish date time
     * @param proceeds proceeds of auction
     */
    event SettledEntireAuction(
        uint256 auctionId,
        address token,
        uint256 tokenIdStart,
        uint256 tokenIdEnd,
        uint256 startAt,
        uint256 finishAt,
        uint256 proceeds
    );

    /// @dev function to create an auction for multiple NFTs
    function createAuction (
        address token, uint256 tokenIdStart, uint256 tokenIdEnd,
        uint256 startAt, uint256 finishAt, uint256 startingPrice
    ) external;

    /// @dev function to cancel an auction. can only call before the auction starts
    function cancelAuction(uint256 auctionId) external;

    /// @dev function to bid for an auction. can only call while the auction is open
    function bid(uint256 auctionId, uint256 tokenId) external payable;

    /// @dev function to settle an auction, mint NFTs and transfer ETH
    function settleAuction(uint256 auctionId) external;

    /// @dev function to get the latest auction
    function getLatestAuction() external returns(Auction memory);

    /// @dev function to get an auction by auctionId
    function getAuction(uint256 auctionId) external returns(Auction memory);

    /// @dev function to get an auctionId
    function getCurrentAuctionId() external returns(uint256);

    /// @dev function to get a current bid for the auction of the NFT
    function getCurrentBid(uint256 auctionId, uint256 tokenId) external returns(Bid memory);

    /// @dev function to get bids for the auction of the NFT
    function getBids(uint256 auctionId, uint256 tokenId) external returns(Bid[] memory);
}
