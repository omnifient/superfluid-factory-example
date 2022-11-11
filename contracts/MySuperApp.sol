// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {SuperAppDefinitions, ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./IMySuperApp.sol";

contract MySuperApp is IMySuperApp, Initializable, SuperAppBase {
    uint256 public myVar;

    constructor() {}

    function initialize(ISuperfluid host) external initializer {
        // initialize your SuperApp
    }

    function doSomething() external returns (bool) {
        // some internal logic
        myVar = 123;

        return true;
    }
}
