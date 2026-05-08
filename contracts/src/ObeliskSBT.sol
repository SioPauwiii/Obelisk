// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ObeliskSBT
 * @notice Soulbound Token — non-transferable NFT minted when a post receives its first vouch.
 *         Each token is permanently tied to the recipient's wallet and cannot be moved.
 *
 * @dev Transfer lock is enforced by overriding _update:
 *      - Mint (from == address(0)) is allowed.
 *      - All other transfers revert.
 */
contract ObeliskSBT is ERC721, ERC721URIStorage, Ownable {
    // ─────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────

    uint256 private _nextTokenId;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    /// @notice Emitted when an SBT is minted.
    event SBTMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string  tokenURI,
        string  postId      // off-chain Supabase post UUID for indexing
    );

    // ─────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────

    constructor(address initialOwner)
        ERC721("Obelisk Humanity Archive", "OBSK")
        Ownable(initialOwner)
    {}

    // ─────────────────────────────────────────────
    // Mint — only callable by contract owner (server wallet)
    // ─────────────────────────────────────────────

    /**
     * @notice Mint a Soulbound Token to `to`.
     * @param to          Recipient wallet address (post author).
     * @param uri         IPFS metadata URI (uploaded to Lighthouse before calling).
     * @param postId      Obelisk post UUID — stored in the event for off-chain indexing.
     * @return tokenId    The newly minted token ID.
     */
    function safeMint(
        address to,
        string calldata uri,
        string calldata postId
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit SBTMinted(to, tokenId, uri, postId);
    }

    // ─────────────────────────────────────────────
    // Transfer Lock (Soulbound)
    // ─────────────────────────────────────────────

    /**
     * @dev Block all transfers. Only minting (from == address(0)) is permitted.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) {
            revert("ObeliskSBT: token is soulbound and cannot be transferred");
        }
        return super._update(to, tokenId, auth);
    }

    // ─────────────────────────────────────────────
    // Approve / Operator — disabled
    // ─────────────────────────────────────────────

    function approve(address, uint256) public pure override(ERC721, IERC721) {
        revert("ObeliskSBT: approvals are disabled for soulbound tokens");
    }

    function setApprovalForAll(address, bool) public pure override(ERC721, IERC721) {
        revert("ObeliskSBT: approvals are disabled for soulbound tokens");
    }

    // ─────────────────────────────────────────────
    // View helpers
    // ─────────────────────────────────────────────

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ─────────────────────────────────────────────
    // Required overrides (ERC721 + ERC721URIStorage)
    // ─────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
