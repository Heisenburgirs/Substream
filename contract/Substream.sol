// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import { ISuperfluid, ISuperToken, ISuperApp } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { SuperTokenV1Library } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import { SuperAppBaseFlow } from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBaseFlow.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import "./SubstreamNFT.sol";

contract Substream is Ownable, SuperAppBaseFlow {

    // SuperToken library setup
    using SuperTokenV1Library for ISuperToken;

    // Super token that may be streamed to this contract
    ISuperToken internal immutable _acceptedToken;

    // Structure to represent a whitelisted entity
    struct User {
        bool isWhitelisted;
        string[] discordServerIds; // Array of server IDs
    }
    
    mapping(address => User) public users;

    // Structure to represent a PaymentOption
    struct PaymentOption {
        ISuperToken incomingFlowToken;
        address recipient;
        address finalRecipient;
        int96 requiredFlowRate;
        string discordServerId;
        string uri;
    }


    // Mapping to associate Discord IDs with their addresses
    mapping(string => address) public discordIDToAddress;

    // Mapping Discord server ID to its associated PaymentOptions
    mapping(string => PaymentOption[]) private discordIdToPaymentOptions;

    // Global fee value
    uint256 public universalFee;

    // Reg key for testnet
    string reg = "";

    // SubstreamNFT
    SubstreamNFT public substreamNFT;

    constructor(ISuperfluid host, ISuperToken acceptedToken, SubstreamNFT _substreamNFT) SuperAppBaseFlow(host, true, true, true, reg) {
        _acceptedToken = acceptedToken;
        substreamNFT = _substreamNFT;
    }

    // Function to set the universal fee
    function setUniversalFee(uint256 _fee) external onlyOwner {
        universalFee = _fee;
    }

    // Check if a user is whitelisted
    function isWhitelisted(address _wallet) external view returns (bool) {
        return users[_wallet].isWhitelisted;
    }

    // Get the Discord server IDs associated with a user
    function getDiscordServerIds(address _wallet) external view returns (string[] memory) {
        return users[_wallet].discordServerIds;
    }

    // Function to add address to whitelist and associate owner Discord server IDs
    function addToWhitelist(address _wallet, string[] memory _discordIDs) external onlyOwner {
        // Check if the address is already whitelisted
        require(!users[_wallet].isWhitelisted, "Address is already whitelisted");
        
        users[_wallet].isWhitelisted = true;
        users[_wallet].discordServerIds = _discordIDs;

        for (uint i = 0; i < _discordIDs.length; i++) {
            discordIDToAddress[_discordIDs[i]] = _wallet;
        }
    }

    // Function to update the whitelisted user's Discord server IDs
    function updateWhitelistedUser(address _wallet, string[] memory updatedDiscordIDs) external onlyOwner {
        require(users[_wallet].isWhitelisted, "Address is not whitelisted");
        
        // Use two dynamic arrays for the makeshift mapping
        string[] memory keys = new string[](updatedDiscordIDs.length);
        bool[] memory values = new bool[](updatedDiscordIDs.length);
        
        for (uint i = 0; i < updatedDiscordIDs.length; i++) {
            keys[i] = updatedDiscordIDs[i];
            values[i] = true;
        }

        // Iterate over the current list
        string[] storage currentDiscordIDs = users[_wallet].discordServerIds;
        uint currentIndex = 0;
        while (currentIndex < currentDiscordIDs.length) {
            bool found;
            uint index;
            (found, index) = findKey(keys, currentDiscordIDs[currentIndex]);
            
            // If the ID is no longer in the updated list, remove it
            if (!found) {
                delete discordIDToAddress[currentDiscordIDs[currentIndex]];

                // Remove from array by swapping with the last element and then popping
                currentDiscordIDs[currentIndex] = currentDiscordIDs[currentDiscordIDs.length - 1];
                currentDiscordIDs.pop();
            } else {
                // Mark the ID as seen by setting its value to false
                values[index] = false;
                
                // Move to the next element
                currentIndex++;
            }
        }

        // Now, add any truly new IDs from the updated list
        for (uint i = 0; i < keys.length; i++) {
            if (values[i]) {
                users[_wallet].discordServerIds.push(keys[i]);
                discordIDToAddress[keys[i]] = _wallet;
            }
        }
    }

    // Utility function to find a key and retrieve its index
    function findKey(string[] memory keys, string memory key) internal pure returns (bool, uint) {
        for (uint i = 0; i < keys.length; i++) {
            if (keccak256(abi.encodePacked(keys[i])) == keccak256(abi.encodePacked(key))) {
                return (true, i);
            }
        }
        return (false, 0);
    }

    // Function to remove an address from the whitelist
    function removeFromWhitelist(address _wallet) external onlyOwner {
        require(users[_wallet].isWhitelisted, "Address is not whitelisted");
        
        string[] memory discordIDs = users[_wallet].discordServerIds;
        
        for (uint i = 0; i < discordIDs.length; i++) {
            delete discordIDToAddress[discordIDs[i]];
        }

        delete users[_wallet];
    }

    function createOrAddPaymentOptions(
        ISuperToken[] memory incomingFlowTokens,
        address recipient,
        int96[] memory requiredFlowRates,
        string memory discordServerId,
        address finalRecipient,
        string[] memory uris  // New argument for URIs
    ) external {
        require(users[msg.sender].isWhitelisted, "User is not whitelisted");
        require(discordIDToAddress[discordServerId] == msg.sender, "Not authorized");
        require(
            incomingFlowTokens.length == requiredFlowRates.length && 
            incomingFlowTokens.length == uris.length,  // Ensure uris array has same length
            "Array length mismatch"
        );

        for (uint256 i = 0; i < incomingFlowTokens.length; i++) {
            PaymentOption memory newPaymentOption = PaymentOption(
                incomingFlowTokens[i],
                recipient,
                finalRecipient,
                requiredFlowRates[i],
                discordServerId,
                uris[i]  // Set the URI for this payment option
            );

            discordIdToPaymentOptions[discordServerId].push(newPaymentOption);
        }
    }

    // To fetch payment options based directly on a Discord server ID:
    function getPaymentOptionsByDiscordId(string memory discordServerId) external view returns (PaymentOption[] memory) {
        return discordIdToPaymentOptions[discordServerId];
    }

    // Update single or multiple paymentOptions
    function updatePaymentOptions(
        string memory discordServerId,
        uint256[] memory indexes,
        ISuperToken[] memory incomingFlowTokens,
        address recipient,
        address finalRecipient,
        int96[] memory requiredFlowRates,
        string[] memory uris
    ) external {

        require(users[msg.sender].isWhitelisted, "User is not whitelisted");
        require(discordIDToAddress[discordServerId] == msg.sender, "Not authorized");

        PaymentOption[] storage userPaymentOptions = discordIdToPaymentOptions[discordServerId];

        // Check that all arrays have the same length
        require(
            indexes.length == incomingFlowTokens.length && 
            indexes.length == requiredFlowRates.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < indexes.length; i++) {
            require(indexes[i] < userPaymentOptions.length, "Invalid index at position: ");
            userPaymentOptions[indexes[i]] = PaymentOption(
                incomingFlowTokens[i],
                recipient,
                finalRecipient,
                requiredFlowRates[i],
                discordServerId,
                uris[i]  // Update the URI for this payment option
            );
        }
    }

    // Remove single or multiple payment options
    function removePaymentOptions(string memory discordServerId, uint256[] memory indices) external {
        require(users[msg.sender].isWhitelisted, "User is not whitelisted");
        require(discordIDToAddress[discordServerId] == msg.sender, "Not authorized");
        
        PaymentOption[] storage userPaymentOptions = discordIdToPaymentOptions[discordServerId];

        // For the sake of simplicity and not dealing with sorting issues, we will remove one by one
        for (uint256 j = 0; j < indices.length; j++) {
            require(indices[j] < userPaymentOptions.length, "Invalid index");
            
            for (uint256 i = indices[j]; i < userPaymentOptions.length - 1; i++) {
                userPaymentOptions[i] = userPaymentOptions[i + 1];
            }

            userPaymentOptions.pop();
        }
    }
}