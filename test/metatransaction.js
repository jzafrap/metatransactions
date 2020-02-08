const EthCrypto = require('eth-crypto');
const MetaTransactionsProvider = artifacts.require('./MetaTransactionsProvider.sol')
const MockVault = artifacts.require('./MockVault.sol')
const BigNumber = web3.utils.BN

let instances
contract('Testing MetaTransactions', function (accounts) {
  
	const [MetaTransactionProxyOwner] = accounts
	// no ETH
	const [, sender] = accounts
	//const senderPrivate= '0x6bf410ff825d07346c110c5836b33ec76e7d1ee051283937392180b732aa3aff' //Ganache-cli
	const senderPrivate= '0xaf6af8eb2a03f169ca1668af85f71429a937d45db6e74e7c469ed24a53691444' //Ganache
	// will pay the blockchain fees in behalf of the sender
	const [, , miner] = accounts
	// whoever
	const [, , , whoever] = accounts
  
   
  
	it('common contracts deployed', async () => {
		instances = {}
		
		instances.MetaTransactionsProvider = await MetaTransactionsProvider.new({ from: sender})
		instances.MockVaultContract = await MockVault.new({ from: whoever })
		console.log("instances.MetaTransactionsProvider:"+instances.MetaTransactionsProvider.address);
	})

	describe('Test MetaTransactionsProvider.prefixedHash method', async () => {
		it('javascript and solidity hashes are the same', async function () {
      
			// SENDER TX NONCE FIELD (TAKEN FROM PROXY NONCE COUNTER)
			const senderBouncerNonce=parseInt(await instances.MetaTransactionsProvider.nonceTracker.call(sender, {from: whoever}));
      
			const messageHash = EthCrypto.hash.keccak256([
				{
					type:'string',
					value:'Signed for MetaTransaction'
				},
				{
					type:'address',
					value:instances.MetaTransactionsProvider.address
				}
				,{
					type:'address',
					value:instances.MockVaultContract.address
				},
				,{
					type:'uint256',
					value:senderBouncerNonce
				}
			]);
	  
			//Compare hashes
			const expectedHash = await instances.MetaTransactionsProvider.prefixedHash(sender,instances.MockVaultContract.address);
			
			assert.isTrue(messageHash === expectedHash, 'Incorrect hashes verification');
		})
	})
  
  
	describe('Test MetaTransactionsProvider.isSignatureValid method', async () => {
		it('Sign can be validated', async function () {
      
			console.log("This code is equivalent to javascript verifySignature()");
			// SENDER TX NONCE FIELD (TAKEN FROM PROXY NONCE COUNTER)
			const senderBouncerNonce=parseInt(await instances.MetaTransactionsProvider.nonceTracker.call(sender, {from: whoever}));
      
			const messageHash = EthCrypto.hash.keccak256([
				{
					type:'string',
					value:'Signed for MetaTransaction'
				},
				{
					type:'address',
					value:instances.MetaTransactionsProvider.address
				}
				,{
					type:'address',
					value:instances.MockVaultContract.address
				},
				,{
					type:'uint256',
					value:senderBouncerNonce
				}
			]);

			const signature = EthCrypto.sign(
				senderPrivate, 
				messageHash
			);
			console.log("signature:"+signature);
			const vrs = EthCrypto.vrs.fromString(signature);
			const signed = await instances.MetaTransactionsProvider.isSignatureValid(sender,instances.MockVaultContract.address , vrs.v, vrs.r, vrs.s);
			assert.isTrue(signed, 'Incorrect signature verification');

		})
	})
  
 
  
	describe('Test MetaTransactionsProvider.callViaProxyDelegated method', () => {
		let MetaTransactionProxyInstance
		let MockVaultContract

		beforeEach(async () => {
			// deploy contracts
			MetaTransactionProxyInstance = instances.MetaTransactionsProvider//await MetaTransactionsProvider.new({ from: MetaTransactionProxyOwner })
			MockVaultContract = instances.MockVaultContract //await MockVault.new({ from: whoever })
    
		})


		describe('MetaTransactionProvider example', async () => {
			describe('Simple contract interation using MetaTransactionProvider contract', async () => {
        
			it('Should be possible to increment the counter of the MockVaultContract contract without paying any fee by the sender', async () => {
         
				const initialSenderETHBalance = await web3.eth.getBalance(sender)
				const initialMinerETHBalance = await web3.eth.getBalance(miner)
				const initialCounter = await MockVaultContract.counter.call({ from: sender })


				// create the sender transaction to be sent by the proxy

       
				// SENDER TX DATA FIELD
				const countDataTransactionField = MockVaultContract
					.contract
					.methods
					.count().encodeABI()

				// SENDER TX VALUE FIELD
				const senderTransactionValue = new BigNumber('0')

				// SENDER TX NONCE FIELD (TAKEN FROM PROXY NONCE COUNTER)
				const senderBouncerNonce = parseInt(await MetaTransactionProxyInstance.nonceTracker.call(sender, {from: whoever}));

				console.log("senderBouncerNonce:"+senderBouncerNonce);
			
				const messageHash = EthCrypto.hash.keccak256(
				[
					{
						type:'string',
						value:'Signed for MetaTransaction'
					},
					{
						type:'address',
						value:MetaTransactionProxyInstance.address
					}
					,{
						type:'address',
						value:MockVaultContract.address
					},
					,{
						type:'uint256',
						value:senderBouncerNonce
					}
				]);
			
				
				const signature = EthCrypto.sign(senderPrivate, messageHash);
						
				const vrs = EthCrypto.vrs.fromString(signature);

				console.log("CALLING PARAMS:");
				console.log("sender:"+sender);
				console.log("MockValutContract.address:"+MockVaultContract.address);
				console.log("countDataTransactionField:"+countDataTransactionField);
				console.log("v:"+vrs.v);
				console.log("r:"+vrs.r);
				console.log("s:"+vrs.s);

			
				const forwardGasEstimation = new BigNumber(
					await MetaTransactionProxyInstance.callViaProxyDelegated.estimateGas(
						sender,
						MockVaultContract.address,
						countDataTransactionField,
						vrs.v, vrs.r, vrs.s,
						{from: miner}			  
					)
				)
			  
				console.log("callViaProxyDelegated GasEstimation:"+forwardGasEstimation);
			  
				const result =  await MetaTransactionProxyInstance.callViaProxyDelegated(
					sender,
					MockVaultContract.address,
					countDataTransactionField,
					vrs.v, vrs.r, vrs.s,
					{from: miner}			  
				)
				console.log("result of call:"+result);

				const finalSenderETHBalance = await web3.eth.getBalance(sender)
				const finalMinerETHBalance = await web3.eth.getBalance(miner)
			  
				console.log("sender initial ETH Balance:"+initialSenderETHBalance+", final ETH Balance:"+finalSenderETHBalance);
				console.log("miner initial ETH Balance:"+initialMinerETHBalance+", final ETH Balance:"+finalMinerETHBalance);
			  
				expect(finalSenderETHBalance).to.equal(initialSenderETHBalance)

				const finalCounter = await MockVaultContract.counter.call({ from: sender })
				console.log("finalCounter:"+finalCounter);
				
				expect(finalCounter.toString()).to.equal(initialCounter.add(new BigNumber('1')).toString())			
			})
		
			it('Should be possible to increment the counter of the MockVaultContract another time without paying any fee by the sender', async () => {
         
				const initialSenderETHBalance = await web3.eth.getBalance(sender)
				const initialMinerETHBalance = await web3.eth.getBalance(miner)
				const initialCounter = await MockVaultContract.counter.call({ from: sender })


				// create the sender transaction to be sent by the proxy

       
				// SENDER TX DATA FIELD
				const countDataTransactionField = MockVaultContract
					.contract
					.methods
					.count().encodeABI()

				// SENDER TX VALUE FIELD
				const senderTransactionValue = new BigNumber('0')

				// SENDER TX NONCE FIELD (TAKEN FROM PROXY NONCE COUNTER)
				const senderBouncerNonce = parseInt(await MetaTransactionProxyInstance.nonceTracker.call(sender, {from: whoever}));

				console.log("senderBouncerNonce:"+senderBouncerNonce);
			
				const messageHash = EthCrypto.hash.keccak256(
				[
					{
						type:'string',
						value:'Signed for MetaTransaction'
					},
					{
						type:'address',
						value:MetaTransactionProxyInstance.address
					}
					,{
						type:'address',
						value:MockVaultContract.address
					},
					,{
						type:'uint256',
						value:senderBouncerNonce
					}
				]);
			
				const signature = EthCrypto.sign(senderPrivate, messageHash);	
				const vrs = EthCrypto.vrs.fromString(signature);

				console.log("CALLING PARAMS:");
				console.log("sender:"+sender);
				console.log("MockValutContract.address:"+MockVaultContract.address);
				console.log("countDataTransactionField:"+countDataTransactionField);
				console.log("v:"+vrs.v);
				console.log("r:"+vrs.r);
				console.log("s:"+vrs.s);

			
				const forwardGasEstimation = new BigNumber(
					await MetaTransactionProxyInstance.callViaProxyDelegated.estimateGas(
						sender,
						MockVaultContract.address,
						countDataTransactionField,
						vrs.v, vrs.r, vrs.s,
						{from: miner}			  
					)
				)
			  
				console.log("callViaProxyDelegated GasEstimation:"+forwardGasEstimation);
			  
				const result =  await MetaTransactionProxyInstance.callViaProxyDelegated(
					sender,
					MockVaultContract.address,
					countDataTransactionField,
					vrs.v, vrs.r, vrs.s,
					{from: miner}			  
				)
				console.log("result of call:"+result);

				const finalSenderETHBalance = await web3.eth.getBalance(sender)
				const finalMinerETHBalance = await web3.eth.getBalance(miner)
			  
				console.log("sender initial ETH Balance:"+initialSenderETHBalance+", final ETH Balance:"+finalSenderETHBalance);
				console.log("miner initial ETH Balance:"+initialMinerETHBalance+", final ETH Balance:"+finalMinerETHBalance);
			  
				expect(finalSenderETHBalance).to.equal(initialSenderETHBalance)

				const finalCounter = await MockVaultContract.counter.call({ from: sender })
				console.log("finalCounter:"+finalCounter);
				
				expect(finalCounter.toString()).to.equal(initialCounter.add(new BigNumber('1')).toString())
				
			})

			it('Should be possible to increment the counter of the MockVaultContract passing a parameter without paying any fee by the sender', async () => {
         
				const initialSenderETHBalance = await web3.eth.getBalance(sender)
				const initialMinerETHBalance = await web3.eth.getBalance(miner)
				const initialCounter = await MockVaultContract.counter.call({ from: sender })

				const incrementBy = 5;
				// create the sender transaction to be sent by the proxy

       
				// SENDER TX DATA FIELD
				const countDataTransactionField = MockVaultContract
					.contract
					.methods
					.increment(incrementBy).encodeABI()

				// SENDER TX VALUE FIELD
				const senderTransactionValue = new BigNumber('0')

				// SENDER TX NONCE FIELD (TAKEN FROM PROXY NONCE COUNTER)
				const senderBouncerNonce = parseInt(await MetaTransactionProxyInstance.nonceTracker.call(sender, {from: whoever}));

				console.log("senderBouncerNonce:"+senderBouncerNonce);
			
				const messageHash = EthCrypto.hash.keccak256(
				[
					{
						type:'string',
						value:'Signed for MetaTransaction'
					},
					{
						type:'address',
						value:MetaTransactionProxyInstance.address
					}
					,{
						type:'address',
						value:MockVaultContract.address
					},
					,{
						type:'uint256',
						value:senderBouncerNonce
					}
				]);
			
				const signature = EthCrypto.sign(senderPrivate, messageHash);	
				const vrs = EthCrypto.vrs.fromString(signature);

				console.log("CALLING PARAMS:");
				console.log("sender:"+sender);
				console.log("MockValutContract.address:"+MockVaultContract.address);
				console.log("countDataTransactionField:"+countDataTransactionField);
				console.log("v:"+vrs.v);
				console.log("r:"+vrs.r);
				console.log("s:"+vrs.s);

			
				const forwardGasEstimation = new BigNumber(
					await MetaTransactionProxyInstance.callViaProxyDelegated.estimateGas(
						sender,
						MockVaultContract.address,
						countDataTransactionField,
						vrs.v, vrs.r, vrs.s,
						{from: miner}			  
					)
				)
			  
				console.log("callViaProxyDelegated GasEstimation:"+forwardGasEstimation);
			  
				const result =  await MetaTransactionProxyInstance.callViaProxyDelegated(
					sender,
					MockVaultContract.address,
					countDataTransactionField,
					vrs.v, vrs.r, vrs.s,
					{from: miner}			  
				)
				console.log("result of call:"+result);

				const finalSenderETHBalance = await web3.eth.getBalance(sender)
				const finalMinerETHBalance = await web3.eth.getBalance(miner)
			  
				console.log("sender initial ETH Balance:"+initialSenderETHBalance+", final ETH Balance:"+finalSenderETHBalance);
				console.log("miner initial ETH Balance:"+initialMinerETHBalance+", final ETH Balance:"+finalMinerETHBalance);
			  
				expect(finalSenderETHBalance).to.equal(initialSenderETHBalance)

				const finalCounter = await MockVaultContract.counter.call({ from: sender })
				console.log("finalCounter:"+finalCounter);
				
				expect(finalCounter.toString()).to.equal(initialCounter.add(new BigNumber(incrementBy)).toString())
				
			})


		})
    })
	  
  })

  
})
