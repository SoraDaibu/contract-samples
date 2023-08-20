import promptjs from "prompt";
import { ContractName, ContractRow, DeployedContract } from "../types";

promptjs.colors = false;
promptjs.message = "> ";
promptjs.delimiter = "";

export function printContractsTable(
  contracts: Record<ContractName, DeployedContract>
) {
  console.table(
    Object.values<DeployedContract>(contracts).reduce(
      (acc: Record<string, ContractRow>, contract: DeployedContract) => {
        acc[contract.name] = {
          Address: contract.address,
        };
        if (contract.instance?.deployTransaction) {
          acc[contract.name]["Deployment Hash"] =
            contract.instance.deployTransaction.hash;
        }
        return acc;
      },
      {}
    )
  );
}
