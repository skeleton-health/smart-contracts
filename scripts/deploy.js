import { ethers } from "ethers";

async function main() {
  console.log("Deploying SkeletonRegistry...");

  // Use ethers directly with hardhat provider
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = (await provider.getSigner(0));

  // Load contract ABI and bytecode
  const SkeletonABI = require('../artifacts/contracts/Skeleton.sol/SkeletonRegistry.json').abi;
  const SkeletonBytecode = require('../artifacts/contracts/Skeleton.sol/SkeletonRegistry.json').bytecode;

  const factory = new ethers.ContractFactory(SkeletonABI, SkeletonBytecode, signer);
  const skeleton = await factory.deploy();

  await skeleton.waitForDeployment();

  const address = await skeleton.getAddress();
  console.log("✓ SkeletonRegistry deployed to:", address);
  console.log("\nSave this address in your .env file:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
