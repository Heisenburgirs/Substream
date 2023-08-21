// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

error SubstreamNFT_TransferIsNotAllowed();

/**
 * @author Superfluid Finance
 * @notice Non-mintable NFT contract that is owned by a user as long as they have a positive flow rate
 * @dev Mirrors the Superfluid Checkout-Builder interface
 */
contract SubstreamNFT is ERC721, Ownable {

    using SuperTokenV1Library for ISuperToken;

    mapping(uint256 => string) private _tokenURIs;

    // Map tokenIDs to its owner to retrieve all tokendIDs given address owns
    mapping(address => uint256[]) private _ownedTokens;

    address public superApp;

    uint256 private currentTokenId;

    modifier onlySuperApp() {
        require(msg.sender == superApp, "Not authorized");
        _;
    }

    // Set NFT Name  
    constructor() ERC721("Substream", "SUBS") {} 

    function mint(address recipient, string memory tokenURIValue) external onlySuperApp {
        _mint(recipient, currentTokenId);
        _tokenURIs[currentTokenId] = tokenURIValue;

        _ownedTokens[recipient].push(currentTokenId);  // Add the tokenId to the recipient's tokens

        currentTokenId++; 
    }

    // Function to set the superApp, only callable by the owner of the contract
    function setSuperApp(address _superApp) external onlyOwner {
        superApp = _superApp;
    }

    function burn(uint256 tokenId) external onlySuperApp {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        address owner = ownerOf(tokenId);
        _removeOwnedToken(owner, tokenId);  // Remove the tokenId from the owner's tokens
        
        delete _tokenURIs[tokenId]; 
        _burn(tokenId);
    }

    // Internal function to remove a token from an owner's list
    function _removeOwnedToken(address owner, uint256 tokenId) internal {
        uint256 lastTokenIndex = _ownedTokens[owner].length - 1;
        uint256 tokenIndex = 0;

        // Find the index of the token to remove
        for (uint256 i = 0; i <= lastTokenIndex; i++) {
            if (_ownedTokens[owner][i] == tokenId) {
                tokenIndex = i;
                break;
            }
        }

        // If the token to remove is not the last token in the array,
        // replace the token to remove with the last token.
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[owner][lastTokenIndex];
            _ownedTokens[owner][tokenIndex] = lastTokenId;
        }

        // Remove the last token now
        _ownedTokens[owner].pop();
    }

    /**
    * @notice Overridden tokenURI, returning the URI associated with a tokenId
    * @param tokenId - The unique identifier for the NFT
    * @dev See {IERC721-tokenURI}.
    * @return A string containing the tokenURI of the given tokenId
    */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Retrieve list of tokenIDs given address owns
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    /**
     * @notice This NFT is not transferable
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(address, address, uint256) public pure override {
        revert SubstreamNFT_TransferIsNotAllowed();
    }

    /**
     * @notice This NFT is not transferable
     * @dev See {IERC721-safeTransferFrom}
     */
    function safeTransferFrom(address, address, uint256) public pure override {
        revert SubstreamNFT_TransferIsNotAllowed();
    }

    /**
     * @notice This NFT is not transferable
     * @dev See {IERC721-safeTransferFrom}
     */
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert SubstreamNFT_TransferIsNotAllowed();
    }
}