const hre = require("hardhat");
const { network } = require("hardhat");
const { hexValue } = require("@ethersproject/bytes");
const { parseEther } = require("@ethersproject/units");

const HOST_ADDR = "0x3E14dC1b13c488a8d5D310918780c983bD5982E7"; // polygon mainnet host addr
const HOST_ABI = ["function getGovernance() external view returns (address)"];

function getHost(hostAddr, providerOrSigner) {
  const hostInstance = new ethers.Contract(hostAddr, HOST_ABI, providerOrSigner);

  return hostInstance;
}

const GOV_II_ABI = [
  "function setConfig(address host, address superToken, bytes32 key, uint256 value) external",
  "function setAppRegistrationKey(address host, address deployer, string memory registrationKey, uint256 expirationTs) external",
  "function getConfigAsUint256(address host, address superToken, bytes32 key) external view returns (uint256 value)",
  "function verifyAppRegistrationKey(address host, address deployer, string memory registrationKey) external view returns (bool validNow, uint256 expirationTs)",
  "function owner() public view returns (address)",
  "function isAuthorizedAppFactory(address host, address factory) external view returns (bool)",
  "function authorizeAppFactory(address host, address factory) external",
];

function getGovernance(govAddr, providerOrSigner) {
  const govInstance = new ethers.Contract(govAddr, GOV_II_ABI, providerOrSigner);

  return govInstance;
}

async function impersonate(addr) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [addr],
  });

  await network.provider.send("hardhat_setBalance", [addr, hexValue(parseEther("1000000"))]);

  return await ethers.getSigner(addr);
}

async function registerFactory(hostAddr, sfGovIIAddr, sfGovOwnerAddr, factoryAddr) {
  console.log("register factory");

  // impersonate the contract owner so we can modify things (also funds it with some balance)
  const govOwnerSigner = await impersonate(sfGovOwnerAddr);
  console.log("gov owner signer", ethers.Signer.isSigner(govOwnerSigner));

  // get the superfluid governance instance
  const sfGovInstance = new ethers.Contract(sfGovIIAddr, GOV_II_ABI, govOwnerSigner);
  console.log("governance instance address", sfGovInstance.address);

  // authorize the factory to do deployments
  console.log("authorizing...", hostAddr, factoryAddr);
  let tx = await sfGovInstance.authorizeAppFactory(hostAddr, factoryAddr);
  await tx.wait();
  console.log("authorization tx finished", tx.value);

  // verify
  let authorized = await sfGovInstance.isAuthorizedAppFactory(hostAddr, factoryAddr);
  console.log("is authorized?", authorized);

  return authorized;
}

// ----------------------------------------------------------------------------
// THE MAINOOOOOOOOOOOOR
// ----------------------------------------------------------------------------

// npx hardhat node --fork <rpc>
// npx hardhat run --network localhost scripts/deploy-my-super-app-factory.js
async function main() {
  const network = await hre.ethers.provider.getNetwork();
  console.log("in network", network.name, network.chainId);

  const signer = await hre.ethers.provider.getSigner();
  const signerAddr = await signer.getAddress();
  console.log("deploying with signer", await signer.getAddress());

  // NOTE: you could bypass this  by grabbing the gov and gov owner addresses from e.g. <ether>scan
  // and hardcoding it here, but then you'll be out of date if they change
  const hostInstance = getHost(HOST_ADDR, signer);
  const govAddr = await hostInstance.getGovernance();
  const govInstance = getGovernance(govAddr, signer);
  const govOwnerAddr = await govInstance.owner();

  console.log("--------------------------------------------------------------------------");
  console.log("DEPLOY THE SUPER APP CONTRACT");
  console.log("--------------------------------------------------------------------------");
  const mySuperAppDeployer = await hre.ethers.getContractFactory("MySuperApp");
  const mySuperApp = await mySuperAppDeployer.deploy();
  await mySuperApp.deployed();
  console.log("deployed MySuperApp template to", mySuperApp.address);

  console.log("--------------------------------------------------------------------------");
  console.log("DEPLOY THE SUPER FACTORY CONTRACT");
  console.log("--------------------------------------------------------------------------");
  const MySuperFactoryDeployer = await hre.ethers.getContractFactory("MySuperFactory");
  const mySuperFactory = await MySuperFactoryDeployer.deploy(mySuperApp.address);
  await mySuperFactory.deployed();
  console.log("deployed MySuperFactory to", mySuperFactory.address);

  console.log("--------------------------------------------------------------------------");
  console.log("AUTHORIZING SUPER FACTORY TO REGISTER APPS");
  console.log("--------------------------------------------------------------------------");
  const factoryRegistered = await registerFactory(HOST_ADDR, govAddr, govOwnerAddr, mySuperFactory.address);
  console.log("factory registered", factoryRegistered);

  console.log("--------------------------------------------------------------------------");
  console.log("INSTANTIATE A CONTRACT");
  console.log("--------------------------------------------------------------------------");
  let tx = await mySuperFactory.createMySuperAppInstance(
    HOST_ADDR, // host
    270582939649, // config word
    "App1" // super app name
  );
  await tx.wait();
  const app1Addr = await mySuperFactory.deployedSuperApps("App1");
  console.log("created a my super app contract", app1Addr);

  tx = await mySuperFactory.createMySuperAppInstance(
    HOST_ADDR, // host
    270582939649, // config word
    "App2" // super app name
  );
  await tx.wait();
  const app2Addr = await mySuperFactory.deployedSuperApps("App2");
  console.log("created a my super app contract", app2Addr);

  console.log("--------------------------------------------------------------------------");
  console.log("DO SOMETHING");
  console.log("--------------------------------------------------------------------------");
  const MY_SUPER_APP_ABI = [
    "function myVar() public view returns (uint256)",
    "function doSomething() external returns (bool)",
  ]; // I'm too lazy to copy files around

  const app1 = new ethers.Contract(app1Addr, MY_SUPER_APP_ABI, signer);
  const app2 = new ethers.Contract(app2Addr, MY_SUPER_APP_ABI, signer);
  console.log("calling app1.doSomething()", await (await app1.doSomething()).wait());

  console.log("app1.myVar", await app1.myVar());
  console.log("app2.myVar", await app2.myVar());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
