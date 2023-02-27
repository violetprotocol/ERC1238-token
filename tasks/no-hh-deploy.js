require("dotenv").config();
const { ethers } = require("ethers");
const { abi: badgeAbi, bytecode: badgeBytecode } = require("../artifacts/contracts/examples/Badge.sol/Badge.json");

const privateKey = process.env.PRIVATE_KEY;
const infuraAPIKey = process.env.INFURA_API_KEY;
const providerUrl = "https://polygon-mumbai.infura.io/v3/" + infuraAPIKey;

async function deployContract() {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const factory = new ethers.ContractFactory(badgeAbi, badgeBytecode, wallet);

  const addressArg = "0xc2b60CfFe4f20b2046C951CDEB459aF897cff571";
  const stringArg = "QmZ8U6ZfhbCpsfHK7MscsnYUEdQ2T4xmgHs1sX4gA4ZB4K";

  const contract = await factory.deploy(addressArg, stringArg);
  console.log("Contract address: ", contract.address);
}

deployContract();
