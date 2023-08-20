# contract-samples-hardhat
Samples of contracts repository.

## Contracts
- [Auction](contracts/Auction.sol)
- [AuctionNFTBase](contracts/tokens/AuctionNFTBase.sol) (or use [AuctionNFTBaseUpgradeable](contracts/tokens/AuctionNFTBaseUpgradeable.sol) for upgradeable contract)

**Refer [addresses.json](addresses.json) for contracts' addresses**

# Flow of Auction
1. Deploy an auction smart contract
2. Deploy an NFT smart contract with setting an auction smart contract as a minter
  - Use or inherit `AuctionNFTBase` for NFT contract
3. Build a metadata server that returns NFT's metadata
4. Create an auction web app to show NFTs and let users bid
5. Create an auction
6. Users bid
7. Auction finishes when time comes
8. Owner settles auction to transfer NFT and ETH

**See [Auction Contract Specification](contracts/README.md) for speficiations and description of auction contract**

# Test
```sh
yarn test
```

# Script
## Environment Setup
Copy `.env.example` to `.env` and fill in fields

## Deploy

### Auction
- (Reccomended) deployment with `auto-deploy` configuration for an NFT auction contract, verify etherscan and write addresses to the `addresses.json`.
  - `auto-deploy` sets gas info automatically. Deployment without `auto-deploy` requires to configure gas info manually.

```sh
yarn task:deploy-and-configure --network [network] --auto-deploy

# ex.) for goerli
yarn task:deploy-and-configure --network goerli --auto-deploy
```

- deployment with manual configuration for an NFT auction contract, verify etherscan and write addresses to the `addresses.json`.

```sh
yarn task:deploy-and-configure --network [network]

# ex.) for goerli
yarn task:deploy-and-configure --network goerli
```

### AuctionNFTBase
Use Remix to deploy.

## Verify on block explorer
In case you only want to verify a contract for block explorer.

```sh
yarn task:verify --contract [path:contractName] [contractAddress] --network [network]

# ex.) contract on goerli
yarn task:verify --contract contracts/proxies/AuctionProxy.sol:AuctionProxy 0xF99a8b2DF498bc3ea2044f1943C210A4fd946b2E --network goerli
```
