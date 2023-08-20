import { task, types } from "hardhat/config";
import { printContractsTable } from "./utils";

task("deploy-and-configure", "Deploy and configure all contracts")
  .addFlag("autoDeploy", "Deploy all contracts without user interaction")
  .setAction(async (args, { run }) => {
    // Deploy auction contracts and return deployment information
    const contracts = await run("deploy", args);

    // Verify the contracts on Etherscan
    await run("verify-etherscan", {
      contracts,
    });

    // Write addresses to `addresses.json`
    await run("update-addresses", {
      contracts,
    });

    printContractsTable(contracts);
    console.log("Deployment Complete.");
  });
