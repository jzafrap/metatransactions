# metatransactions
Test of metatransactions in ethereum network, using a proxy contract

Clone or download.
Node, npm, truffle and ganache is required.

1) Install eth-crypto dependency by executing:

npm install eth-crypto

3) Start ganache app 

4) For running the tests, Execute:

truffle test --network ganache

# Involved artifacts:

1) MetaTransactionProvider: is a smart contract that acts as a proxy, and provides some methods for signature verifying and execution of 
call to 3d party smart contract methods.

2) MockVault: is the smart contract which methods we want to call, without the caller have to pay the fees. It has two simple methods used in the tests.

3) Sender address: is the address that sign the message with the methods to be called in destination contract. This address will not pay the gas fees, but will be the "sender" of the transaction.

3) Miner addresss: is the address that pays the gas fees of the ethereum transaction.

# description

See test/metatransaction.js for explained unit tests.
See contracts/MetaTransactionProvider.sol for an explanation of proxy smart contract methods.


