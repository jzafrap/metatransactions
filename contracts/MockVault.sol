pragma solidity ^0.5.0;

//Simple smart contract for testing metatransactions
contract MockVault {

	uint public counter;

	constructor() public { }

	function () external payable {
		revert("fn: fallback, msg: fallback function not allowed");
	}

	function count() public returns (bool) {
		counter += 1;
		return true;
	}
	
	//For testing parameter passing on call
	function increment(uint incr) public returns (bool) {
		counter += incr;
		return true;
	}
}