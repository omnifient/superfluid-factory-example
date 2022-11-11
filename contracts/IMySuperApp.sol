// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ISuperfluid, ISuperApp} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

interface IMySuperApp is ISuperApp {
    function initialize(ISuperfluid host) external;

    function doSomething() external returns (bool);
}
