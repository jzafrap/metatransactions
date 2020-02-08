const Migrations = artifacts.require("Migrations");
const MetaTransactionsProvider = artifacts.require('./MetaTransactionsProvider.sol');
const MockVault = artifacts.require('./MockVault.sol');

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(MetaTransactionsProvider);
  deployer.deploy(MockVault);
  
};
