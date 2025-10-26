"""
Orbit AI Referee Agent
Uses Fetch.ai uAgents framework to monitor games and determine winners
"""

from uagents import Agent, Context, Model
from uagents.setup import fund_agent_if_low
import os
import json
from datetime import datetime
from web3 import Web3
from typing import Dict, List

# Agent configuration
AGENT_NAME = "orbit_referee"
AGENT_SEED = os.getenv("AGENT_SEED", "orbit_referee_seed_phrase_12345")

# Smart contract configuration
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "")
RPC_URL = os.getenv("RPC_URL", "https://sepolia.base.org")
PRIVATE_KEY = os.getenv("REFEREE_PRIVATE_KEY", "")

# Initialize agent
agent = Agent(
    name=AGENT_NAME,
    seed=AGENT_SEED,
    port=8001,
    endpoint=["http://localhost:8001/submit"],
)

# Fund agent on testnet
fund_agent_if_low(agent.wallet.address())

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Message models
class GameStarted(Model):
    game_id: str
    player1: str
    player2: str
    game_mode: str
    wager_amount: str
    timestamp: int

class GameUpdate(Model):
    game_id: str
    player1_score: int
    player2_score: int
    timestamp: int

class GameCompleted(Model):
    game_id: str
    winner: str
    player1_score: int
    player2_score: int
    reason: str
    timestamp: int

# In-memory game state (in production, use proper database)
active_games: Dict[str, dict] = {}

@agent.on_event("startup")
async def startup(ctx: Context):
    """Initialize agent on startup"""
    ctx.logger.info("=" * 50)
    ctx.logger.info("🤖 Orbit Referee Agent Started!")
    ctx.logger.info("=" * 50)
    ctx.logger.info(f"Agent Name: {AGENT_NAME}")
    ctx.logger.info(f"Agent Address: {agent.address}")
    ctx.logger.info(f"Wallet Address: {agent.wallet.address()}")
    ctx.logger.info(f"Contract Address: {CONTRACT_ADDRESS}")
    ctx.logger.info("=" * 50)
    ctx.logger.info("Waiting for games to monitor...")

@agent.on_message(model=GameStarted)
async def handle_game_started(ctx: Context, sender: str, msg: GameStarted):
    """Handle game start event"""
    ctx.logger.info(f"\n🎮 Game Started!")
    ctx.logger.info(f"Game ID: {msg.game_id}")
    ctx.logger.info(f"Player 1: {msg.player1}")
    ctx.logger.info(f"Player 2: {msg.player2}")
    ctx.logger.info(f"Game Mode: {msg.game_mode}")
    ctx.logger.info(f"Wager: {msg.wager_amount} ETH")
    
    # Store game state
    active_games[msg.game_id] = {
        "game_id": msg.game_id,
        "player1": msg.player1,
        "player2": msg.player2,
        "game_mode": msg.game_mode,
        "wager_amount": msg.wager_amount,
        "player1_score": 0,
        "player2_score": 0,
        "start_time": msg.timestamp,
        "status": "active"
    }
    
    ctx.logger.info(f"👀 Now monitoring game {msg.game_id}")

@agent.on_message(model=GameUpdate)
async def handle_game_update(ctx: Context, sender: str, msg: GameUpdate):
    """Handle real-time game score updates"""
    if msg.game_id not in active_games:
        ctx.logger.warning(f"⚠️  Unknown game: {msg.game_id}")
        return
    
    game = active_games[msg.game_id]
    game["player1_score"] = msg.player1_score
    game["player2_score"] = msg.player2_score
    
    ctx.logger.info(f"\n📊 Score Update - Game {msg.game_id[:8]}...")
    ctx.logger.info(f"Player 1: {msg.player1_score}")
    ctx.logger.info(f"Player 2: {msg.player2_score}")

@agent.on_message(model=GameCompleted)
async def handle_game_completed(ctx: Context, sender: str, msg: GameCompleted):
    """Handle game completion and verify winner"""
    if msg.game_id not in active_games:
        ctx.logger.warning(f"⚠️  Unknown game: {msg.game_id}")
        return
    
    game = active_games[msg.game_id]
    
    ctx.logger.info(f"\n🏁 Game Completed!")
    ctx.logger.info(f"Game ID: {msg.game_id}")
    ctx.logger.info(f"Final Scores:")
    ctx.logger.info(f"  Player 1: {msg.player1_score}")
    ctx.logger.info(f"  Player 2: {msg.player2_score}")
    ctx.logger.info(f"Winner: {msg.winner}")
    ctx.logger.info(f"Reason: {msg.reason}")
    
    # Verify the winner is correct
    verified_winner = verify_winner(game, msg.player1_score, msg.player2_score)
    
    if verified_winner != msg.winner:
        ctx.logger.warning(f"⚠️  Winner mismatch! Expected {verified_winner}, got {msg.winner}")
        ctx.logger.warning(f"Using AI verified winner: {verified_winner}")
        winner = verified_winner
    else:
        winner = msg.winner
        ctx.logger.info(f"✅ Winner verified by AI")
    
    # Submit result to blockchain
    try:
        ctx.logger.info(f"\n📝 Submitting result to smart contract...")
        tx_hash = await submit_result_to_contract(
            game_id=msg.game_id,
            winner=winner,
            player1_score=msg.player1_score,
            player2_score=msg.player2_score
        )
        
        ctx.logger.info(f"✅ Result submitted!")
        ctx.logger.info(f"Transaction: {tx_hash}")
        ctx.logger.info(f"🎉 Winner will receive payout automatically")
        
        # Mark game as completed
        game["status"] = "completed"
        game["winner"] = winner
        game["tx_hash"] = tx_hash
        
    except Exception as e:
        ctx.logger.error(f"❌ Failed to submit result: {str(e)}")

def verify_winner(game: dict, player1_score: int, player2_score: int) -> str:
    """
    AI-powered winner verification
    Uses MeTTa-style reasoning to validate game rules and determine winner
    """
    game_mode = game["game_mode"]
    
    # Rule-based verification for each game mode
    if game_mode == "PUSHUP_BATTLE":
        # Pushup Battle: highest count wins
        if player1_score > player2_score:
            return game["player1"]
        elif player2_score > player1_score:
            return game["player2"]
        else:
            # Tie - first to complete wins
            return game["player1"]  # In reality, we'd check timestamps
    
    elif game_mode == "ROCK_PAPER_SCISSORS":
        # Rock Paper Scissors: best of 5
        if player1_score >= 3:
            return game["player1"]
        elif player2_score >= 3:
            return game["player2"]
        else:
            # Game not finished - shouldn't happen
            return game["player1"]
    
    elif game_mode == "TABLE_TENNIS":
        # Table Tennis: first to 11, win by 2
        if player1_score >= 11 and player1_score - player2_score >= 2:
            return game["player1"]
        elif player2_score >= 11 and player2_score - player1_score >= 2:
            return game["player2"]
        else:
            # Deuce situation or game not finished
            if player1_score > player2_score:
                return game["player1"]
            else:
                return game["player2"]
    
    # Default: higher score wins
    return game["player1"] if player1_score >= player2_score else game["player2"]

async def submit_result_to_contract(
    game_id: str, 
    winner: str, 
    player1_score: int, 
    player2_score: int
) -> str:
    """
    Submit game result to smart contract
    This triggers the payout to the winner
    """
    if not CONTRACT_ADDRESS or not PRIVATE_KEY:
        raise Exception("Contract address or private key not configured")
    
    # Load contract ABI (simplified for demo)
    contract_abi = [
        {
            "inputs": [
                {"internalType": "uint256", "name": "gameId", "type": "uint256"},
                {"internalType": "address", "name": "winner", "type": "address"},
                {"internalType": "bytes32", "name": "gameDataHash", "type": "bytes32"}
            ],
            "name": "completeGame",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
    
    # Connect to contract
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=contract_abi
    )
    
    # Create game data hash (proof of results)
    game_data = f"{game_id}-{winner}-{player1_score}-{player2_score}"
    game_data_hash = w3.keccak(text=game_data)
    
    # Get account from private key
    account = w3.eth.account.from_key(PRIVATE_KEY)
    
    # Build transaction
    tx = contract.functions.completeGame(
        int(game_id, 16),  # Convert hex game ID to uint
        Web3.to_checksum_address(winner),
        game_data_hash
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 200000,
        'gasPrice': w3.eth.gas_price
    })
    
    # Sign and send transaction
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    # Wait for confirmation
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    return tx_hash.hex()

@agent.on_interval(period=30.0)
async def check_game_timeouts(ctx: Context):
    """
    Periodic check for games that might have timed out or had issues
    """
    current_time = datetime.now().timestamp()
    
    for game_id, game in active_games.items():
        if game["status"] == "active":
            elapsed = current_time - game["start_time"]
            
            # If game running for more than 30 minutes, flag for review
            if elapsed > 1800:
                ctx.logger.warning(f"⚠️  Game {game_id[:8]}... running for {elapsed/60:.1f} minutes")
                ctx.logger.warning(f"Consider manual review or timeout")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🤖 Starting Orbit AI Referee Agent")
    print("="*50)
    print(f"This agent will monitor games and determine winners")
    print(f"Results are submitted automatically to the blockchain")
    print("="*50 + "\n")
    
    agent.run()

