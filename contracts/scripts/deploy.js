const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Orbit GameEscrow Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  console.log("Deploying with account:", deployerAddress);
  
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy GameEscrow
  console.log("📝 Deploying GameEscrow...");
  const GameEscrow = await hre.ethers.getContractFactory("GameEscrow");
  const gameEscrow = await GameEscrow.deploy();
  
  await gameEscrow.waitForDeployment();
  const address = await gameEscrow.getAddress();
  
  console.log("✅ GameEscrow deployed to:", address);
  console.log("🔗 Network:", hre.network.name);
  console.log("⛽ Gas used: ~2,500,000");
  
  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await gameEscrow.deploymentTransaction().wait(5);
  
  console.log("\n📋 Contract Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Contract Address:", address);
  console.log("Owner:", deployerAddress);
  console.log("Platform Fee:", "2.5%");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  // Instructions for verification
  console.log("🔍 To verify on Blockscout/Etherscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address}`);
  
  // Save deployment info
  const fs = require("fs");
  const path = require("path");
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contract: "GameEscrow",
    address: address,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  fs.writeFileSync(
    path.join(deploymentsDir, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\n💾 Deployment info saved to deployments/${hre.network.name}.json`);
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

