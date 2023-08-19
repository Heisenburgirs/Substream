// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import { ISuperfluid, ISuperToken, ISuperApp } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import { SuperAppBaseFlow } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBaseFlow.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";

error ExistentialNFTCloneFactory_ArgumentLengthMismatch();

contract Substream is Ownable, SuperAppBaseFlow {

    // SuperToken library setup
    using SuperTokenV1Library for ISuperToken;

    // Super token that may be streamed to this contract
    ISuperToken internal immutable _acceptedToken;

    // Structure to represent a whitelisted entity
    struct WhitelistInfo {
        address wallet;
        string discordID;
    }

    // Structure to represent a PaymentOption
    struct PaymentOption {
        ISuperToken incomingFlowToken;
        address recipient;
        int96 requiredFlowRate;
    }

    // Mapping to store address and Discord ID pairs for the whitelist
    mapping(address => WhitelistInfo) public whitelist;

    // Mapping to associate addresses with their Discord IDs
    mapping(address => string) public addressToDiscordID;

    // Mapping to associate addresses with their PaymentOptions
    mapping(address => PaymentOption[]) public paymentOptions;

    // Global fee value
    uint256 public universalFee;

    // Reg key for testnet
    string reg = "";

    constructor(ISuperfluid host, ISuperToken acceptedToken) SuperAppBaseFlow(host, true, true, true, reg) {
        _acceptedToken = acceptedToken;
    }

    // Function to get all payment options for a specific address
    function getPaymentOptionsForAddress(address user) external view returns (PaymentOption[] memory) {
        return paymentOptions[user];
    }

    // Function to set the universal fee
    function setUniversalFee(uint256 _fee) external onlyOwner {
        universalFee = _fee;
    }
    
    // Function to add an address to the whitelist and map it to a Discord ID
    function addToWhitelist(address _wallet, string memory _discordID) external onlyOwner {
        whitelist[_wallet] = WhitelistInfo(_wallet, _discordID);
        addressToDiscordID[_wallet] = _discordID;
    }

    // Function to remove an address from the whitelist
    function removeFromWhitelist(address _wallet) external onlyOwner {
        delete whitelist[_wallet];
        delete addressToDiscordID[_wallet];
    }

    // Function to create new PaymentOptions or add PaymentOptions for the sender
    function createOrAddPaymentOptions(
        ISuperToken[] memory incomingFlowTokens,
        address[] memory recipients,
        int96[] memory requiredFlowRates
    ) external {

        // Ensure the provided index is within the valid range
        require(
            incomingFlowTokens.length == recipients.length &&
            recipients.length == requiredFlowRates.length,
            "Array length mismatch"
        );

        // Retrieve the paymentOptions array for the caller's address
        PaymentOption[] storage userPaymentOptions = paymentOptions[msg.sender];

        // Create or add the payment option(s) accordingly
        for (uint256 i = 0; i < incomingFlowTokens.length; i++) {
            userPaymentOptions.push(PaymentOption(
                incomingFlowTokens[i],
                recipients[i],
                requiredFlowRates[i]
            ));
        }
    }

    // Function to update PaymentOptions for the sender
    function updatePaymentOptions(
        uint256[] memory indexes,
        ISuperToken[] memory incomingFlowTokens,
        address[] memory recipients,
        int96[] memory requiredFlowRates
    ) external {
        // Retrieve the paymentOptions array for the caller's address
        PaymentOption[] storage userPaymentOptions = paymentOptions[msg.sender];

        // Ensure the caller's address has existing payment options
        require(userPaymentOptions.length > 0, "Caller's address not found");

        // Ensure the provided index is within the valid range
        require(
            indexes.length == incomingFlowTokens.length &&
            indexes.length == recipients.length &&
            indexes.length == requiredFlowRates.length,
            "Array length mismatch"
        );

        // Update the payment option(s) accordingly
        for (uint256 i = 0; i < indexes.length; i++) {
            require(indexes[i] < userPaymentOptions.length, "Invalid index");
            userPaymentOptions[indexes[i]] = PaymentOption(
                incomingFlowTokens[i],
                recipients[i],
                requiredFlowRates[i]
            );
        }
    }

    // Function to remove a PaymentOption for the sender
    function removePaymentOption(uint256 index) external {
        // Retrieve the paymentOptions array for the caller's address
        PaymentOption[] storage userPaymentOptions = paymentOptions[msg.sender];

        // Ensure the caller's address has existing payment options
        require(userPaymentOptions.length > 0, "Caller's address not found");

        // Ensure the provided index is within the valid range
        require(index < userPaymentOptions.length, "Invalid index");

        // Remove the payment option at the specified index by shifting elements
        for (uint256 i = index; i < userPaymentOptions.length - 1; i++) {
            userPaymentOptions[i] = userPaymentOptions[i + 1];
        }

        // Remove the last (now duplicated) element by shortening the array length
        userPaymentOptions.pop();

        // If all payment options are removed, delete the entry from the mapping
        if (userPaymentOptions.length == 0) {
            delete paymentOptions[msg.sender];
        }
    }
}