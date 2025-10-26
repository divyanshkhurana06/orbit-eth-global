// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title OrbitWinnerNFT
 * @dev NFT contract for minting winner certificates
 * @notice Mints NFTs to game winners with metadata
 */
contract OrbitWinnerNFT is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    
    struct WinnerData {
        address winner;
        address opponent;
        string gameMode;
        uint256 wagerAmount;
        uint256 timestamp;
        string gameScreenshot; // IPFS hash or URL
    }
    
    mapping(uint256 => WinnerData) public winnerData;
    
    event WinnerNFTMinted(
        uint256 indexed tokenId,
        address indexed winner,
        string gameMode,
        uint256 wagerAmount
    );
    
    constructor() ERC721("Orbit Winner", "ORBIT-WIN") Ownable(msg.sender) {
        _baseTokenURI = "https://orbit.app/api/nft/";
    }
    
    /**
     * @notice Mint NFT to game winner
     * @param winner Address of the winner
     * @param opponent Address of the opponent
     * @param gameMode Type of game won
     * @param wagerAmount Amount wagered
     * @param screenshotHash IPFS hash or URL of winning screenshot
     */
    function mintWinnerNFT(
        address winner,
        address opponent,
        string memory gameMode,
        uint256 wagerAmount,
        string memory screenshotHash
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        winnerData[tokenId] = WinnerData({
            winner: winner,
            opponent: opponent,
            gameMode: gameMode,
            wagerAmount: wagerAmount,
            timestamp: block.timestamp,
            gameScreenshot: screenshotHash
        });
        
        _safeMint(winner, tokenId);
        
        emit WinnerNFTMinted(tokenId, winner, gameMode, wagerAmount);
        
        return tokenId;
    }
    
    /**
     * @notice Get winner data for a token
     * @param tokenId Token ID
     * @return WinnerData struct
     */
    function getWinnerData(uint256 tokenId) external view returns (WinnerData memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return winnerData[tokenId];
    }
    
    /**
     * @notice Get token URI for metadata
     * @param tokenId Token ID
     * @return Token metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        WinnerData memory data = winnerData[tokenId];
        
        return string(abi.encodePacked(
            _baseTokenURI,
            tokenId.toString(),
            "?winner=", _addressToString(data.winner),
            "&opponent=", _addressToString(data.opponent),
            "&game=", data.gameMode,
            "&wager=", data.wagerAmount.toString(),
            "&timestamp=", data.timestamp.toString(),
            "&screenshot=", data.gameScreenshot
        ));
    }
    
    /**
     * @notice Set base token URI
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    /**
     * @notice Convert address to string
     * @param addr Address to convert
     * @return String representation
     */
    function _addressToString(address addr) private pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    /**
     * @notice Get total supply
     * @return Total number of NFTs minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}

