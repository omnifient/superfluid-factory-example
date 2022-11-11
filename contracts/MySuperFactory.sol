// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";
import {SuperAppDefinitions, ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "hardhat/console.sol";

import "./IMySuperApp.sol";

contract MySuperFactory {
    address public mySuperAppAddr;
    mapping(string => address) public deployedSuperApps;

    constructor(address _mySuperAppAddr) {
        mySuperAppAddr = _mySuperAppAddr;
    }

    function createMySuperAppInstance(
        ISuperfluid _host,
        uint256 configWord,
        string memory _superAppName
    ) external returns (address deployedAddr) {
        console.log("creating the MySuperApp instance");
        // we're using the app name for the salt, so we want to disallow creating 2 instances with the same salt
        require(
            deployedSuperApps[_superAppName] == address(0),
            "SUPER_APP_EXISTS"
        );

        // create salt and use the create2 for deploying the clone
        bytes32 salt = keccak256(abi.encodePacked(_superAppName));
        deployedAddr = Clones.cloneDeterministic(mySuperAppAddr, salt);

        // configWord =
        //     SuperAppDefinitions.APP_LEVEL_FINAL |
        //     SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
        //     SuperAppDefinitions.AFTER_AGREEMENT_CREATED_NOOP |
        //     SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
        //     SuperAppDefinitions.AFTER_AGREEMENT_UPDATED_NOOP |
        //     SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP |
        //     SuperAppDefinitions.AFTER_AGREEMENT_TERMINATED_NOOP;
        console.log("config word", configWord);

        // store the new instance, and register it on superfluid
        deployedSuperApps[_superAppName] = deployedAddr;
        ISuperfluid(_host).registerAppByFactory(
            ISuperApp(deployedAddr),
            configWord
        );

        // initialize the instance here (not required to be done here)
        // but you probably want to avoid letting this leak
        IMySuperApp(deployedAddr).initialize(_host);
    }
}
