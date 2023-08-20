import { task, types } from "hardhat/config";
import { ContractName, DeployedContract } from "./types";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

task("update-addresses", "Write the deployed addresses to addresses.json")
  .addParam(
    "contracts",
    "Contract objects from the deployment",
    undefined,
    types.json
  )
  .setAction(
    async (
      {
        contracts,
      }: {
        contracts: Record<ContractName, DeployedContract>;
      },
      { ethers }
    ) => {
      const { name: _, chainId } = await ethers.provider.getNetwork();

      // Update addresses.json
      const addressesPath = join(__dirname, "../addresses.json");
      const addresses = JSON.parse(readFileSync(addressesPath, "utf8"));
      addresses[chainId] = {
        Auction: contracts.Auction.address,
        AuctionProxy: contracts.AuctionProxy.address,
        AuctionProxyAdmin: contracts.AuctionProxyAdmin.address,
      };
      writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));

      console.log("Addresses written to addresses.json.");
    }
  );
