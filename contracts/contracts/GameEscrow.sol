// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./OrbitWinnerNFT.sol";

/**
 * @title GameEscrow
 * @dev Escrow contract for 1v1 skill-based games with Yellow Network integration
 * @notice This contract holds wagers and distributes winnings after game completion
 * 
 * YELLOW NETWORK INTEGRATION:
 * - Players deposit once into Yellow state channel
 * - Game happens off-chain (instant, no gas)
 * - Winner determined by referee agent
 * - Settlement happens on-chain via this contract
 */
contract GameEscrow is ReentrancyGuard, Ownable {
    
    // ============ STATE VARIABLES ============
    
    struct Game {
        address player1;
        address player2;
        uint256 wagerAmount;
        address wagerToken; // address(0) for native token
        GameMode gameMode;
        GameStatus status;
        address winner;
        uint256 createdAt;
        uint256 completedAt;
        bytes32 gameDataHash; // Hash of game results for verification
    }
    
    enum GameMode {
        PUSHUP_BATTLE,
        ROCK_PAPER_SCISSORS,
        TABLE_TENNIS
    }
    
    enum GameStatus {
        WAITING,      // Waiting for player 2
        ACTIVE,       // Both players joined, game in progress
        COMPLETED,    // Game finished, winner declared
        CANCELLED,    // Game cancelled
        DISPUTED      // Game result disputed
    }
    
    // Game ID counter
    uint256 public gameIdCounter;
    
    // Mapping of game ID to Game struct
    mapping(uint256 => Game) public games;
    
    // Mapping of player address to active game IDs
    mapping(address => uint256[]) public playerGames;
    
    // Authorized referees (AI agents or oracle addresses)
    mapping(address => bool) public authorizedReferees;
    
    // Platform fee (in basis points, e.g., 250 = 2.5%)
    uint256 public platformFeeBps = 250;
    
    // Accumulated platform fees
    mapping(address => uint256) public accumulatedFees;
    
    // Yellow Network integration
    address public yellowNetworkBridge;
    
    // NFT contract for winner certificates
    OrbitWinnerNFT public winnerNFT;
    
    // ============ EVENTS ============
    
    event GameCreated(
        uint256 indexed gameId,
        address indexed player1,
        uint256 wagerAmount,
        address wagerToken,
        GameMode gameMode
    );
    
    event GameJoined(
        uint256 indexed gameId,
        address indexed player2
    );
    
    event GameCompleted(
        uint256 indexed gameId,
        address indexed winner,
        uint256 winnings,
        uint256 platformFee
    );
    
    event GameCancelled(
        uint256 indexed gameId,
        address indexed player
    );
    
    event GameDisputed(
        uint256 indexed gameId,
        address indexed disputedBy
    );
    
    event RefereeAuthorized(address indexed referee);
    event RefereeRevoked(address indexed referee);
    event YellowBridgeUpdated(address indexed newBridge);
    
    // ============ MODIFIERS ============
    
    modifier onlyReferee() {
        require(authorizedReferees[msg.sender], "Not authorized referee");
        _;
    }
    
    modifier gameExists(uint256 gameId) {
        require(gameId < gameIdCounter, "Game does not exist");
        _;
    }
    
    modifier onlyGamePlayer(uint256 gameId) {
        require(
            games[gameId].player1 == msg.sender || 
            games[gameId].player2 == msg.sender,
            "Not a game player"
        );
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() Ownable(msg.sender) {
        // Owner is automatically authorized as referee
        authorizedReferees[msg.sender] = true;
        
        // Deploy winner NFT contract
        winnerNFT = new OrbitWinnerNFT();
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @notice Create a new game with a wager
     * @param wagerAmount Amount to wager
     * @param wagerToken Token address (address(0) for native token)
     * @param gameMode Type of game to play
     */
    function createGame(
        uint256 wagerAmount,
        address wagerToken,
        GameMode gameMode
    ) external payable nonReentrant returns (uint256) {
        require(wagerAmount > 0, "Wager must be > 0");
        
        // Handle payment
        if (wagerToken == address(0)) {
            require(msg.value == wagerAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "Do not send ETH with token wager");
            IERC20(wagerToken).transferFrom(msg.sender, address(this), wagerAmount);
        }
        
        // Create game
        uint256 gameId = gameIdCounter++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            wagerAmount: wagerAmount,
            wagerToken: wagerToken,
            gameMode: gameMode,
            status: GameStatus.WAITING,
            winner: address(0),
            createdAt: block.timestamp,
            completedAt: 0,
            gameDataHash: bytes32(0)
        });
        
        playerGames[msg.sender].push(gameId);
        
        emit GameCreated(gameId, msg.sender, wagerAmount, wagerToken, gameMode);
        
        return gameId;
    }
    
    /**
     * @notice Join an existing game
     * @param gameId ID of the game to join
     */
    function joinGame(uint256 gameId) external payable nonReentrant gameExists(gameId) {
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.WAITING, "Game not available");
        require(game.player2 == address(0), "Game already full");
        require(msg.sender != game.player1, "Cannot play against yourself");
        
        // Handle payment
        if (game.wagerToken == address(0)) {
            require(msg.value == game.wagerAmount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "Do not send ETH with token wager");
            IERC20(game.wagerToken).transferFrom(msg.sender, address(this), game.wagerAmount);
        }
        
        // Update game
        game.player2 = msg.sender;
        game.status = GameStatus.ACTIVE;
        
        playerGames[msg.sender].push(gameId);
        
        emit GameJoined(gameId, msg.sender);
    }
    
    /**
     * @notice Complete a game and declare winner (called by authorized referee)
     * @param gameId ID of the game
     * @param winner Address of the winner
     * @param gameDataHash Hash of game results for verification
     */
    function completeGame(
        uint256 gameId,
        address winner,
        bytes32 gameDataHash
    ) external onlyReferee gameExists(gameId) nonReentrant {
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(
            winner == game.player1 || winner == game.player2,
            "Winner must be a player"
        );
        
        // Update game state
        game.status = GameStatus.COMPLETED;
        game.winner = winner;
        game.completedAt = block.timestamp;
        game.gameDataHash = gameDataHash;
        
        // Calculate winnings and fees
        uint256 totalPot = game.wagerAmount * 2;
        uint256 platformFee = (totalPot * platformFeeBps) / 10000;
        uint256 winnings = totalPot - platformFee;
        
        // Accumulate platform fee
        accumulatedFees[game.wagerToken] += platformFee;
        
        // Transfer winnings to winner
        if (game.wagerToken == address(0)) {
            (bool success, ) = winner.call{value: winnings}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(game.wagerToken).transfer(winner, winnings);
        }
        
        // Mint winner NFT
        string memory gameModeStr = _gameModeToString(game.gameMode);
        winnerNFT.mintWinnerNFT(
            winner,
            winner == game.player1 ? game.player2 : game.player1,
            gameModeStr,
            game.wagerAmount,
            string(abi.encodePacked("orbit-winner-", Strings.toString(gameId)))
        );
        
        emit GameCompleted(gameId, winner, winnings, platformFee);
    }
    
    /**
     * @notice Cancel a game before it starts (only if no player 2)
     * @param gameId ID of the game to cancel
     */
    function cancelGame(uint256 gameId) 
        external 
        gameExists(gameId) 
        onlyGamePlayer(gameId) 
        nonReentrant 
    {
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.WAITING, "Cannot cancel active game");
        require(game.player2 == address(0), "Player 2 already joined");
        
        game.status = GameStatus.CANCELLED;
        
        // Refund player 1
        if (game.wagerToken == address(0)) {
            (bool success, ) = game.player1.call{value: game.wagerAmount}("");
            require(success, "ETH refund failed");
        } else {
            IERC20(game.wagerToken).transfer(game.player1, game.wagerAmount);
        }
        
        emit GameCancelled(gameId, msg.sender);
    }
    
    /**
     * @notice Dispute a game result
     * @param gameId ID of the game to dispute
     */
    function disputeGame(uint256 gameId) 
        external 
        gameExists(gameId) 
        onlyGamePlayer(gameId) 
    {
        Game storage game = games[gameId];
        
        require(
            game.status == GameStatus.ACTIVE || game.status == GameStatus.COMPLETED,
            "Cannot dispute this game"
        );
        
        game.status = GameStatus.DISPUTED;
        
        emit GameDisputed(gameId, msg.sender);
    }
    
    /**
     * @notice Resolve a disputed game (owner only)
     * @param gameId ID of the game
     * @param resolution 0 = refund both, 1 = player1 wins, 2 = player2 wins
     */
    function resolveDispute(
        uint256 gameId,
        uint8 resolution
    ) external onlyOwner gameExists(gameId) nonReentrant {
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.DISPUTED, "Game not disputed");
        require(resolution <= 2, "Invalid resolution");
        
        game.status = GameStatus.COMPLETED;
        game.completedAt = block.timestamp;
        
        if (resolution == 0) {
            // Refund both players
            if (game.wagerToken == address(0)) {
                (bool s1, ) = game.player1.call{value: game.wagerAmount}("");
                (bool s2, ) = game.player2.call{value: game.wagerAmount}("");
                require(s1 && s2, "ETH refund failed");
            } else {
                IERC20(game.wagerToken).transfer(game.player1, game.wagerAmount);
                IERC20(game.wagerToken).transfer(game.player2, game.wagerAmount);
            }
        } else {
            // Award to winner
            address winner = resolution == 1 ? game.player1 : game.player2;
            game.winner = winner;
            
            uint256 totalPot = game.wagerAmount * 2;
            uint256 platformFee = (totalPot * platformFeeBps) / 10000;
            uint256 winnings = totalPot - platformFee;
            
            accumulatedFees[game.wagerToken] += platformFee;
            
            if (game.wagerToken == address(0)) {
                (bool success, ) = winner.call{value: winnings}("");
                require(success, "ETH transfer failed");
            } else {
                IERC20(game.wagerToken).transfer(winner, winnings);
            }
            
            emit GameCompleted(gameId, winner, winnings, platformFee);
        }
    }
    
    // ============ YELLOW NETWORK INTEGRATION ============
    
    /**
     * @notice Create game session for Yellow Network off-chain processing
     * @param gameId ID of the game
     * @return sessionId Yellow Network session identifier
     */
    function createYellowSession(uint256 gameId) 
        external 
        gameExists(gameId) 
        returns (bytes32 sessionId) 
    {
        Game storage game = games[gameId];
        require(game.status == GameStatus.ACTIVE, "Game must be active");
        
        // Generate unique session ID
        sessionId = keccak256(abi.encodePacked(gameId, block.timestamp, msg.sender));
        
        // In production, this would interact with Yellow Network bridge
        // For now, we emit event that off-chain Yellow nodes can listen to
        
        return sessionId;
    }
    
    /**
     * @notice Set Yellow Network bridge address
     * @param bridge Address of Yellow Network bridge contract
     */
    function setYellowBridge(address bridge) external onlyOwner {
        yellowNetworkBridge = bridge;
        emit YellowBridgeUpdated(bridge);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @notice Authorize a referee address (for AI agents or oracles)
     * @param referee Address to authorize
     */
    function authorizeReferee(address referee) external onlyOwner {
        authorizedReferees[referee] = true;
        emit RefereeAuthorized(referee);
    }
    
    /**
     * @notice Revoke referee authorization
     * @param referee Address to revoke
     */
    function revokeReferee(address referee) external onlyOwner {
        authorizedReferees[referee] = false;
        emit RefereeRevoked(referee);
    }
    
    /**
     * @notice Update platform fee
     * @param newFeeBps New fee in basis points (max 10%)
     */
    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = newFeeBps;
    }
    
    /**
     * @notice Withdraw accumulated platform fees
     * @param token Token address (address(0) for native token)
     */
    function withdrawFees(address token) external onlyOwner nonReentrant {
        uint256 amount = accumulatedFees[token];
        require(amount > 0, "No fees to withdraw");
        
        accumulatedFees[token] = 0;
        
        if (token == address(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get game details
     * @param gameId ID of the game
     */
    function getGame(uint256 gameId) 
        external 
        view 
        gameExists(gameId) 
        returns (Game memory) 
    {
        return games[gameId];
    }
    
    /**
     * @notice Get all games for a player
     * @param player Address of the player
     */
    function getPlayerGames(address player) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return playerGames[player];
    }
    
    /**
     * @notice Get active games count
     */
    function getActiveGamesCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < gameIdCounter; i++) {
            if (games[i].status == GameStatus.ACTIVE) {
                count++;
            }
        }
    }
    
    // ============ HELPER FUNCTIONS ============
    
    /**
     * @notice Convert GameMode enum to string
     * @param gameMode GameMode enum value
     * @return String representation
     */
    function _gameModeToString(GameMode gameMode) private pure returns (string memory) {
        if (gameMode == GameMode.PUSHUP_BATTLE) return "Pushup Battle";
        if (gameMode == GameMode.ROCK_PAPER_SCISSORS) return "Rock Paper Scissors";
        if (gameMode == GameMode.TABLE_TENNIS) return "Table Tennis";
        return "Unknown";
    }
    
    // ============ RECEIVE FUNCTION ============
    
    receive() external payable {}
}

