import { Contract } from "ethers";

export enum ChainId {
  Mainnet = 1,
  Goerli = 5,
  Sepoloa = 11155111,
}

// prettier-ignore
export type AuctionContractName = "Auction" | "AuctionProxy" | "AuctionProxyAdmin";
export type ContractName = AuctionContractName;

export interface ContractDeployment {
  args?: (string | number | (() => string))[];
  libraries?: () => Record<string, string>;
  waitForConfirmation?: boolean;
  validateDeployment?: () => void;
}

export interface DeployedContract {
  name: string;
  address: string;
  instance: Contract;
  constructorArguments: (string | number)[];
  libraries: Record<string, string>;
}

export interface ContractRow {
  Address: string;
  "Deployment Hash"?: string;
}
