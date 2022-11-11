require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // forking: {
      //   url: process.env.NODE_URL_POLYGON_MAINNET,
      //   blockNumber: 33317730,
      // },
      mining: {
        auto: false,
        interval: 1000,
      },
    },
  },
};
