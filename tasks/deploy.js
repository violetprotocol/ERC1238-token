// Import the necessary libraries
const { ethers } = require("hardhat");

// Define the deployment function
async function main() {
  // Get the accounts to deploy from
  const accounts = await ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }

  // Set the constructor arguments
  const addressArg = "0x0e21c1982BeeEF2e25A9D4d51baeaB686207Afcf";
  const stringArg = "QmZ8U6ZfhbCpsfHK7MscsnYUEdQ2T4xmgHs1sX4gA4ZB4K";

  // Get the current gas price
  const gasPrice = await ethers.provider.getGasPrice();
  const gasPrice2 = gasPrice.toNumber();
  //   console.log("GAS PRICE");
  //   console.log(gasPrice2);

  // Estimate the gas usage for the contract deployment
  const Badge = await ethers.getContractFactory("Badge");
  const estimatedGas = await ethers.provider.estimateGas(Badge.getDeployTransaction(addressArg, stringArg));

  // Deploy the contract with constructor arguments and estimated gas limit and price
  const gasLimit = estimatedGas.toNumber();
  //console.log("ESTIMATED GAS");
  //console.log(gasLimit);
  const badgeWithGas = await Badge.deploy(addressArg, stringArg, { gasLimit: gasLimit, gasPrice: gasPrice2 });

  // Wait for the contract to be deployed
  await badgeWithGas.deployed();

  console.log("Badge deployed to:", badgeWithGas.address);
}

// Run the deployment function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/*
// Import the necessary libraries
const { ethers } = require("hardhat");

// Define the deployment function
async function main() {
  // Get the accounts to deploy from
  const accounts = await ethers.getSigners();

  // Set the constructor arguments
  const addressArg = "0xc2b60CfFe4f20b2046C951CDEB459aF897cff571";
  const stringArg = "asodfonasdoinasdf";

  // Get the current gas price
  const gasPrice = await ethers.provider.getGasPrice();
  console.log("GAS PRICE");
  console.log(gasPrice);

  // Estimate the gas usage for the contract deployment
  const Badge = await ethers.getContractFactory("Badge");
  const estimatedGas = await Badge.estimateGas(addressArg, stringArg);
  console.log("ESTIMATED GAS");
  console.log(estimatedGas);

  // Deploy the contract with constructor arguments and estimated gas limit and price
  const gasLimit = estimatedGas.toNumber();
  const badgeWithGas = await Badge.deploy(addressArg, stringArg, { gasLimit, gasPrice });

  // Wait for the contract to be deployed
  await badgeWithGas.deployed();

  console.log("Badge deployed to:", badgeWithGas.address);
}

// Run the deployment function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
*/
