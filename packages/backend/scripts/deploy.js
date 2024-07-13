const { ethers } = require('hardhat');

async function main() {
  const SafeCity = await ethers.getContractFactory('SafeCity');
  const safeCity = await SafeCity.deploy(
    // Sepolia
    "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0", // router address - Check to get the router address for your supported network https://docs.chain.link/chainlink-functions/supported-networks
    "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000", // donID - Check to get the donID for your supported network https://docs.chain.link/chainlink-functions/supported-networks
    3107 // subscription ID
  );
  await safeCity.waitForDeployment();

  console.log("SafeCity deployed to:", await safeCity.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
