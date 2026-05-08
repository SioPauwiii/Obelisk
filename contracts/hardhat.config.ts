import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY ?? "";
const SNOWTRACE_API_KEY  = process.env.SNOWTRACE_API_KEY  ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    fuji: {
      url: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: MINTER_PRIVATE_KEY ? [MINTER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: SNOWTRACE_API_KEY,
    },
  },
  paths: {
    sources: "./src",   // only scan src/ — avoids node_modules .sol files
  },
};

export default config;
