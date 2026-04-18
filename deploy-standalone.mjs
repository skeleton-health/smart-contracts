import { ethers } from "ethers";
import fs from "fs";

async function main() {
  console.log("Deploying SkeletonRegistry...");

  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = await provider.getSigner(0);

  console.log("Deploying with account:", signer.address);

  // Read compiled contract
  const contractJSON = JSON.parse(
    fs.readFileSync("./artifacts/contracts/Skeleton.sol/SkeletonRegistry.json", "utf8")
  );

  const factory = new ethers.ContractFactory(contractJSON.abi, contractJSON.bytecode, signer);
  const skeleton = await factory.deploy();

  const receipt = await skeleton.deploymentTransaction()?.wait();
  const address = await skeleton.getAddress();

  console.log("\n✓ SkeletonRegistry deployed!");
  console.log("Address:", address);
  console.log("Transaction:", skeleton.deploymentTransaction()?.hash);

  // Save address to .env format
  const envContent = `CONTRACT_ADDRESS=${address}\nRPC_URL=http://127.0.0.1:8545\nIPFS_API_URL=http://127.0.0.1:5001\nPORT=5000\n`;
  fs.writeFileSync("../.env", envContent);

  console.log("\n✓ Saved to ../.env");
  console.log("Next: Setup IPFS and Backend API");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
