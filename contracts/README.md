# Description for specifications of contracts

## Auction
[Auction](Auction.sol) is an initial NFT offering auction contract with proxy which has an upgradeable feature (ERC1967).

[Auction](Auction.sol) offers features to
1. create auction for multiple tokens of an NFT contract, which can only be called by the contract owner
2. cancel auction for the auction that has not started yet, which can only be called by the contract owner
3. bid for NFT to win and get the NFT
4. settle auction to mint NFTs to winners and send native tokens to the contract owner, which can only be called by the contract owner

**Note**
- Each auction can have one NFT contract.
- When users bid, native token will be locked into the auction contract.
- When highest bid is updated, the previous bid will be retuned.
