import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import { ethers, upgrades } from "hardhat";
import { Block } from "@ethersproject/abstract-provider";
import { BigNumber, constants } from "ethers";

import { Auction, AuctionNFTBase, ERC721Mock } from "../typechain";

const { expect } = chai;

describe("Auction", () => {
  // contracts
  let auction: Auction;
  let nft: AuctionNFTBase;
  let nft2: ERC721Mock;

  // accounts
  let deployer: SignerWithAddress;
  let bidderA: SignerWithAddress;
  let bidderB: SignerWithAddress;
  let bidderC: SignerWithAddress;

  // test metadata
  let snapshotId: number;
  let latestBlockNum;
  let latestBlock: Block;

  const oneMin = 60;
  const oneHour = oneMin * 60;
  const oneDay = oneHour * 24;

  // auction info
  let auctionId: BigNumber;
  let startAt: number;
  let finishAt: number;
  let tokenIdStart: number = 1;
  let tokenIdEnd: number = 100;
  let startingPrice = 10000;

  let noBidsAuctionId: BigNumber;

  async function deploy(deployer?: SignerWithAddress) {
    const auctionHouseFactory = await ethers.getContractFactory(
      "Auction",
      deployer
    );

    return upgrades.deployProxy(auctionHouseFactory, []) as Promise<Auction>;
  }

  before(async () => {
    // prepare accounts
    [deployer, bidderA, bidderB, bidderC] = await ethers.getSigners();

    // deploy contracts
    auction = await deploy(deployer);

    const NFT = await ethers.getContractFactory("AuctionNFTBase");
    nft = await NFT.deploy(
      "AuctionNFTBase",
      "NFT",
      "http://localhost/metadata/",
      auction.address
    );

    const NFT2 = await ethers.getContractFactory("ERC721Mock");
    nft2 = await NFT2.deploy(
      "AuctionNFTBase",
      "NFT",
      "http://localhost/metadata/"
    );

    latestBlockNum = await ethers.provider.getBlockNumber();
    latestBlock = await ethers.provider.getBlock(latestBlockNum);
    startAt = latestBlock.timestamp + oneMin;
    finishAt = latestBlock.timestamp + oneDay;
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });

  // =============================================================
  //                          initialize
  // =============================================================
  it("should revert initialize if a second initialization is attempted", async () => {
    const tx = auction.initialize();

    await expect(tx).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );
  });

  // =============================================================
  //                         createAuction
  // =============================================================
  it("should revert if a caller is not the owner", async () => {
    const tx = auction
      .connect(bidderA)
      .createAuction(
        nft.address,
        tokenIdStart,
        tokenIdEnd,
        startAt,
        finishAt,
        startingPrice
      );
    await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should revert createAuction if nft address is zero", async () => {
    const tx = auction.createAuction(
      constants.AddressZero,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith("Auction token can't be zero");
  });

  it("should revert createAuction if nft address is EOA", async () => {
    const tx = auction.createAuction(
      bidderA.address,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith(
      "function returned an unexpected amount of data"
    );
  });

  it("should revert createAuction if nft address does not have supportsInterface of `IAuctionNFT`", async () => {
    const tx = auction.createAuction(
      auction.address,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith(
      "function selector was not recognized and there's no fallback function"
    );
  });

  it("should revert createAuction if nft address does not support interface id of `IAuctionNFT`", async () => {
    const tx = auction.createAuction(
      nft2.address,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith(
      "NFT must have IAuctionNFT supportsInterface"
    );
  });

  it("should revert createAuction if tokenIdEnd is smaller than tokenIdStart", async () => {
    const start = 1;
    const end = 0;
    const tx = auction.createAuction(
      constants.AddressZero,
      start,
      end,
      startAt,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith("Auction token can't be zero");
  });

  it("should revert createAuction if startAt is before block.timestamp", async () => {
    const start = latestBlock.timestamp - oneMin;
    const tx = auction.createAuction(
      nft.address,
      tokenIdStart,
      tokenIdEnd,
      start,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith(
      "startAt must be equal or after block.timestamp"
    );
  });

  it("should revert if startAt is after than finishAt", async () => {
    const start = startAt + oneHour;
    const end = startAt;

    const tx = auction.createAuction(
      nft.address,
      tokenIdStart,
      tokenIdEnd,
      start,
      end,
      startingPrice
    );
    await expect(tx).to.be.revertedWith("finishAt must be after startAt");
  });

  it("should revert createAuction if nft is already minted", async () => {
    await nft.mint(deployer.address, tokenIdStart);

    const tx = auction.createAuction(
      nft.address,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );
    await expect(tx).to.be.revertedWith("Token already minted");
  });

  it("should create auction and increase auctionId", async () => {
    const beforeAuctionId = await auction.getCurrentAuctionId();

    await auction.createAuction(
      nft.address,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );

    const currentAuctionId = await auction.getCurrentAuctionId();
    expect(Number(currentAuctionId)).to.be.greaterThan(Number(beforeAuctionId));
  });

  it("should create auction and emit `CreatedAuction`", async () => {
    const beforeAuctionId = await auction.getCurrentAuctionId();

    const tx = auction.createAuction(
      nft.address,
      tokenIdStart,
      tokenIdEnd,
      startAt,
      finishAt,
      startingPrice
    );

    await expect(tx)
      .to.emit(auction, "CreatedAuction")
      .withArgs(
        beforeAuctionId.add(1),
        nft.address,
        tokenIdStart,
        tokenIdEnd,
        startAt,
        finishAt,
        startingPrice
      );
  });

  describe("when auction exists and will start soon", async () => {
    before(async () => {
      await auction.createAuction(
        nft.address,
        tokenIdStart,
        tokenIdEnd,
        startAt + oneHour,
        finishAt,
        startingPrice
      );
    });

    // =============================================================
    //                         cancelAuction
    // =============================================================
    it("should revert cancelAuction if a caller is not the owner", async () => {
      auctionId = await auction.getCurrentAuctionId();
      const tx = auction.connect(bidderA).cancelAuction(auctionId);
      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert cancelAuction if auction does not exist", async () => {
      const tx = auction.cancelAuction(auctionId.add(1));
      await expect(tx).to.be.revertedWith("Auction does not exist");
    });

    it("should cancelAuction and delete the auction", async () => {
      await auction.cancelAuction(auctionId);
      const auc = auction.getLatestAuction();
      await expect((await auc).startAt).to.be.equal(0);
    });

    it("should cancelAuction and emit `CanceledAuction`", async () => {
      const tx = auction.cancelAuction(auctionId);
      await expect(tx)
        .to.emit(auction, "CanceledAuction")
        .withArgs(auctionId, nft.address, tokenIdStart, tokenIdEnd);
    });

    // =============================================================
    //                              bid
    // =============================================================
    it("should revert bid if auction has not started", async () => {
      const tx = auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });
      await expect(tx).to.be.revertedWith("Not during auction");
    });
  });

  describe("when auction is open", async () => {
    before(async () => {
      await auction.createAuction(
        nft.address,
        tokenIdStart,
        tokenIdEnd,
        startAt,
        finishAt,
        startingPrice
      );

      await ethers.provider.send("evm_increaseTime", [oneHour * 2]);
    });

    // =============================================================
    //                         cancelAuction
    // =============================================================
    it("should revert cancelAuction if auction has started", async () => {
      auctionId = await auction.getCurrentAuctionId();
      const tx = auction.cancelAuction(auctionId);
      await expect(tx).to.be.revertedWith("Auction has started");
    });

    // =============================================================
    //                              bid
    // =============================================================
    it("should revert bid if auction does not exist", async () => {
      const tx = auction
        .connect(bidderA)
        .bid(auctionId.add(1), tokenIdStart, { value: startingPrice });
      await expect(tx).to.be.revertedWith("Auction does not exist");
    });

    it("should revert bid if an NFT is not on auction (below tokenIdStart)", async () => {
      auctionId = await auction.getCurrentAuctionId();
      const tx = auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart - 1, { value: startingPrice });
      await expect(tx).to.be.revertedWith("Invalid tokenId to bid");
    });

    it("should revert bid if an NFT is not on auction (over tokenIdEnd)", async () => {
      const tx = auction
        .connect(bidderA)
        .bid(auctionId, tokenIdEnd + 1, { value: startingPrice });
      await expect(tx).to.be.revertedWith("Invalid tokenId to bid");
    });

    it("should revert bid if bid value is under startingPrice", async () => {
      const tx = auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice - 1 });
      await expect(tx).to.be.revertedWith("Must bid at least starting price");
    });

    it("should revert bid if bid value is not over current bid", async () => {
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });
      const tx = auction
        .connect(bidderB)
        .bid(auctionId, tokenIdStart, { value: startingPrice });
      await expect(tx).to.be.revertedWith("Must bid at least current bid");
    });

    it("should bid if bid value is the same value as startingPrice", async () => {
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });
      const bid = await auction.getCurrentBid(auctionId, tokenIdStart);
      await expect(bid.price).to.be.equal(startingPrice);
    });

    it("should bid and emit if bid value is the same value as startingPrice", async () => {
      const tx = auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });
      await expect(tx)
        .to.emit(auction, "CreatedBid")
        .withArgs(nft.address, tokenIdStart, startingPrice, bidderA.address);
    });

    it("should bid if bid value is over the current bid and previous bidder should receive the bid back", async () => {
      // bid by A
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });

      // bid by B
      const balanceA = await bidderA.getBalance();
      await auction
        .connect(bidderB)
        .bid(auctionId, tokenIdStart, { value: startingPrice * 2 });
      const bid = await auction.getCurrentBid(auctionId, tokenIdStart);
      await expect(bid.price).to.be.equal(startingPrice * 2);
      // bid returned to A
      await expect(await bidderA.getBalance()).to.be.equal(
        BigNumber.from(balanceA.add(startingPrice))
      );
    });

    it("should bid if bid value is over the current bid and previous bidder should receive the bid back", async () => {
      // bid by A
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });

      // bid by B
      const balanceA = await bidderA.getBalance();
      await auction
        .connect(bidderB)
        .bid(auctionId, tokenIdStart, { value: startingPrice * 2 });
      const bid = await auction.getCurrentBid(auctionId, tokenIdStart);
      await expect(bid.price).to.be.equal(startingPrice * 2);
      // bid returned to A
      await expect(await bidderA.getBalance()).to.be.equal(
        BigNumber.from(balanceA.add(startingPrice))
      );
    });

    it("should bid for multiple tokens if bid value is over the current bid and previous bidder should receive the bid back", async () => {
      // bid by A
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });

      const tokenId = tokenIdStart + 1;
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenId, { value: startingPrice });

      // bid by B
      let balanceA = await bidderA.getBalance();
      await auction
        .connect(bidderB)
        .bid(auctionId, tokenIdStart, { value: startingPrice * 2 });
      const bid = await auction.getCurrentBid(auctionId, tokenIdStart);
      await expect(bid.price).to.be.equal(startingPrice * 2);
      // bid returned to A
      await expect(await bidderA.getBalance()).to.be.equal(
        BigNumber.from(balanceA.add(startingPrice))
      );

      // bid by C
      balanceA = await bidderA.getBalance();
      const balanceB = await bidderB.getBalance();

      await auction
        .connect(bidderC)
        .bid(auctionId, tokenIdStart, { value: startingPrice * 3 });
      await auction
        .connect(bidderC)
        .bid(auctionId, tokenId, { value: startingPrice * 2 });

      // bid returned to A
      await expect(await bidderA.getBalance()).to.be.equal(
        BigNumber.from(balanceA.add(startingPrice))
      );

      // bid returned to B
      await expect(await bidderB.getBalance()).to.be.equal(
        BigNumber.from(balanceB.add(startingPrice * 2))
      );
    });

    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================
    it("should getLatestAuction if auction exists", async () => {
      const auc = await auction.getLatestAuction();
      await expect(auc.token).to.be.equal(nft.address);
      await expect(auc.tokenIdStart).to.be.equal(tokenIdStart);
      await expect(auc.tokenIdEnd).to.be.equal(tokenIdEnd);
      await expect(auc.startAt).to.be.equal(startAt);
      await expect(auc.finishAt).to.be.equal(finishAt);
      await expect(auc.startingPrice).to.be.equal(startingPrice);
    });

    it("should getAuction if auction exists", async () => {
      const auc = await auction.getAuction(await auction.getCurrentAuctionId());
      await expect(auc.token).to.be.equal(nft.address);
      await expect(auc.tokenIdStart).to.be.equal(tokenIdStart);
      await expect(auc.tokenIdEnd).to.be.equal(tokenIdEnd);
      await expect(auc.startAt).to.be.equal(startAt);
      await expect(auc.finishAt).to.be.equal(finishAt);
      await expect(auc.startingPrice).to.be.equal(startingPrice);
    });

    // =============================================================
    //                         createAuction
    // =============================================================
    it("should createAuction when there is an auction", async () => {
      const beforeAuctionId = await auction.getCurrentAuctionId();
      const start = tokenIdEnd + 1;
      const end = tokenIdEnd + 100;
      startAt += oneHour * 3;
      finishAt += oneHour * 3;
      await auction.createAuction(
        nft.address,
        start,
        end,
        startAt,
        finishAt,
        startingPrice
      );
      const afterAuctionId = await auction.getCurrentAuctionId();
      await expect(afterAuctionId.toNumber()).to.be.greaterThan(
        beforeAuctionId.toNumber()
      );
    });

    // =============================================================
    //                         settleAuction
    // =============================================================
    it("should revert settleAuction if a caller is not the owner", async () => {
      auctionId = await auction.getCurrentAuctionId();
      const tx = auction.connect(bidderA).settleAuction(auctionId);
      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert settleAuction when auction has not finished yet", async () => {
      const tx = auction.settleAuction(auctionId);
      await expect(tx).to.be.revertedWith("Auction has not finished yet");
    });
  });

  describe("when auction finished", async () => {
    before(async () => {
      tokenIdStart += 100;
      tokenIdEnd += 100;
      const tokenId = tokenIdStart + 1;

      // create auction to test settleAuction without bids
      const start = tokenIdEnd + 1;
      const end = tokenIdEnd + 100;
      await auction.createAuction(
        nft.address,
        start,
        end,
        startAt,
        finishAt,
        startingPrice
      );
      noBidsAuctionId = await auction.getCurrentAuctionId();

      // create auction to test settleAuction with bids
      await auction.createAuction(
        nft.address,
        tokenIdStart,
        tokenIdEnd,
        startAt,
        finishAt,
        startingPrice
      );

      auctionId = await auction.getCurrentAuctionId();
      await ethers.provider.send("evm_increaseTime", [oneHour * 3]);

      // bid for tokenId = 100
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenIdStart, { value: startingPrice });

      await auction
        .connect(bidderB)
        .bid(auctionId, tokenIdStart, { value: startingPrice * 2 });

      await auction
        .connect(bidderC)
        .bid(auctionId, tokenIdStart, { value: startingPrice * 3 });

      // bid for tokenId = 101
      await auction
        .connect(bidderA)
        .bid(auctionId, tokenId, { value: startingPrice });

      await auction
        .connect(bidderB)
        .bid(auctionId, tokenId, { value: startingPrice * 5 });

      // warp after auction has finished
      await ethers.provider.send("evm_increaseTime", [oneDay + oneHour]);
      auctionId = await auction.getCurrentAuctionId();
    });

    // =============================================================
    //                         getBids
    // =============================================================
    it("should get bids for a multi-bid NFT auction", async () => {
      const bids = await auction.getBids(auctionId, tokenIdStart);
      await expect(bids.length).to.be.equal(3);
      await expect(bids[0].price).to.be.equal(startingPrice);
      await expect(bids[1].price).to.be.equal(startingPrice * 2);
      await expect(bids[2].price).to.be.equal(startingPrice * 3);
    });

    // =============================================================
    //                         settleAuction
    // =============================================================
    const wonBidPrice100 = startingPrice * 3;
    const wonBidPrice101 = startingPrice * 5;

    it("should revert if auction does not exist", async () => {
      const tx = auction.settleAuction(auctionId.add(1));
      await expect(tx).to.be.revertedWith("Auction does not exist");
    });

    it("should settleAuction even if auction has no bids", async () => {
      const start = tokenIdEnd + 1;
      const end = tokenIdEnd + 100;
      const tx = auction.settleAuction(noBidsAuctionId);
      await expect(tx)
        .to.emit(auction, "SettledEntireAuction")
        .withArgs(
          noBidsAuctionId,
          nft.address,
          start,
          end,
          startAt,
          finishAt,
          0
        );
    });

    it("should settleAuction and delete the auction", async () => {
      await auction.settleAuction(auctionId);
      await expect((await auction.getAuction(auctionId)).startAt).to.be.equal(
        0
      );
    });

    it("should settleAuction and the owner should receive proceeds", async () => {
      const beforeOwnerBalance = await deployer.getBalance();
      const receipt = await (await auction.settleAuction(auctionId)).wait();
      const afterOwnerBalance = await deployer.getBalance();
      const gasSpent = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      await expect(afterOwnerBalance).to.be.equal(
        beforeOwnerBalance.add(wonBidPrice100 + wonBidPrice101).sub(gasSpent)
      );
    });

    it("should settleAuction and mint NFTs to the winner", async () => {
      await auction.settleAuction(auctionId);
      await expect(await nft.ownerOf(tokenIdStart)).to.be.equal(
        bidderC.address
      );
      await expect(await nft.ownerOf(tokenIdStart + 1)).to.be.equal(
        bidderB.address
      );
    });

    it("should settleAuction and emit `SettledAuction`", async () => {
      const wonBidPrice100 = startingPrice * 3;
      const wonBidPrice101 = startingPrice * 5;
      const tx = await auction.settleAuction(auctionId);
      await expect(tx)
        .to.emit(auction, "SettledAuction")
        .withArgs(auctionId, nft.address, tokenIdStart, wonBidPrice100);
      await expect(tx)
        .to.emit(auction, "SettledAuction")
        .withArgs(auctionId, nft.address, tokenIdStart + 1, wonBidPrice101);
    });

    it("should settleAuction and emit `SettledEntireAuction`", async () => {
      const proceeds = wonBidPrice100 + wonBidPrice101;
      const tx = await auction.settleAuction(auctionId);
      await expect(tx)
        .to.emit(auction, "SettledEntireAuction")
        .withArgs(
          auctionId,
          nft.address,
          tokenIdStart,
          tokenIdEnd,
          startAt,
          finishAt,
          proceeds
        );
    });
  });
});
