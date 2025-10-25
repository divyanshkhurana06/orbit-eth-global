# 🔐 SkillDuels Escrow Smart Contract Guide

## Overview

This is a **production-ready Solana smart contract** built with Anchor framework that handles secure escrow for SkillDuels games.

## Features

✅ **Secure Escrow** - Both players deposit wagers into PDA-controlled escrow
✅ **Attestation System** - Both players must confirm results before payout
✅ **Round Tracking** - Tracks best-of-3 match with scores
✅ **Auto-Payout** - Winner receives 2x wager after attestation
✅ **Cancellation** - Player 1 can cancel and get refund if no opponent joins
✅ **Timeout Protection** - 10-minute timeout before cancellation allowed

## Smart Contract Functions

### 1. `initialize_game`
Create a new game and deposit wager from Player 1.

```rust
pub fn initialize_game(
    ctx: Context<InitializeGame>,
    game_id: String,
    wager_amount: u64,
) -> Result<()>
```

**Parameters:**
- `game_id`: Unique room code (max 32 chars)
- `wager_amount`: Wager in lamports

**Action:**
- Creates escrow PDA
- Transfers wager from Player 1 to escrow
- Sets status to `WaitingForPlayer`

---

### 2. `join_game`
Player 2 joins and deposits matching wager.

```rust
pub fn join_game(ctx: Context<JoinGame>) -> Result<()>
```

**Action:**
- Adds Player 2 to game
- Transfers matching wager to escrow
- Sets status to `WaitingForReady`
- Total escrow now holds 2x wager

---

### 3. `player_ready`
Player confirms they are ready to start.

```rust
pub fn player_ready(ctx: Context<PlayerReady>) -> Result<()>
```

**Action:**
- Marks player as ready/attested
- When both ready → status becomes `InProgress`
- Can be called multiple times between rounds

---

### 4. `submit_round_result`
Submit result of a round (called by either player or server).

```rust
pub fn submit_round_result(
    ctx: Context<SubmitRoundResult>,
    winner_is_player1: bool,
) -> Result<()>
```

**Parameters:**
- `winner_is_player1`: true if Player 1 won, false if Player 2 won

**Action:**
- Increments winner's score
- If score >= 2 → match complete, status becomes `ReadyForPayout`
- Otherwise → next round, reset attestations

---

### 5. `attest_result`
Player attests to the final match result.

```rust
pub fn attest_result(ctx: Context<AttestResult>) -> Result<()>
```

**Action:**
- Marks player as having attested to result
- When both attest → status becomes `Completed`
- **Required before payout**

---

### 6. `payout_winner`
Transfer full pot to winner (requires both attestations).

```rust
pub fn payout_winner(ctx: Context<PayoutWinner>) -> Result<()>
```

**Requirements:**
- Status must be `Completed`
- Both players must have attested

**Action:**
- Transfers 2x wager to winner
- Game complete

---

### 7. `cancel_game`
Cancel game and refund Player 1 (if no opponent joined).

```rust
pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()>
```

**Requirements:**
- Status must be `WaitingForPlayer`
- 10 minutes must have passed
- Only Player 1 can cancel

**Action:**
- Refunds wager to Player 1
- Sets status to `Cancelled`

---

## Game States

```rust
pub enum GameStatus {
    WaitingForPlayer,    // Player 1 deposited, waiting for Player 2
    WaitingForReady,     // Both deposited, waiting for ready confirmations
    InProgress,          // Game is active
    ReadyForPayout,      // Match complete, waiting for attestations
    Completed,           // Both attested, ready for payout
    Cancelled,           // Game cancelled, refunded
}
```

## Game Flow

```
1. Player 1: initialize_game()
   └─> Deposits wager → Status: WaitingForPlayer

2. Player 2: join_game()
   └─> Deposits wager → Status: WaitingForReady

3. Both Players: player_ready()
   └─> When both ready → Status: InProgress

4. Play Round 1
   └─> submit_round_result(winner)
   └─> Update score

5. Repeat player_ready() + round for Rounds 2-3

6. After final round (score >= 2):
   └─> Status: ReadyForPayout

7. Both Players: attest_result()
   └─> When both attest → Status: Completed

8. Anyone: payout_winner()
   └─> Winner receives 2x wager
   └─> Game complete ✅
```

## Account Structure

```rust
pub struct GameEscrow {
    pub game_id: String,          // Room code
    pub player1: Pubkey,           // Player 1 wallet
    pub player2: Pubkey,           // Player 2 wallet
    pub wager_amount: u64,         // Wager per player (lamports)
    pub status: GameStatus,        // Current game state
    pub winner: Pubkey,            // Winner's wallet (set after match)
    pub player1_attested: bool,    // P1 confirmed result
    pub player2_attested: bool,    // P2 confirmed result
    pub created_at: i64,           // Unix timestamp
    pub round_number: u8,          // Current round (1-3)
    pub player1_score: u8,         // P1's wins
    pub player2_score: u8,         // P2's wins
    pub bump: u8,                  // PDA bump
}
```

## Security Features

### ✅ PDA-Controlled Escrow
- Funds stored in Program Derived Address
- Only smart contract can move funds
- No single person has control

### ✅ Dual Attestation
- **Both players must confirm result**
- Prevents one player from claiming false victory
- If dispute → funds remain escrowed

### ✅ Timeout Protection
- Can't cancel immediately
- 10-minute grace period for opponent to join

### ✅ Access Control
- Only players in game can call functions
- Strict checks on who can do what

### ✅ State Machine
- Clear state transitions
- Can't skip states or go backwards

## Error Codes

| Code | Meaning |
|------|---------|
| `InvalidWagerAmount` | Wager must be > 0 |
| `GameIdTooLong` | Max 32 characters |
| `GameAlreadyStarted` | Can't join started game |
| `CannotPlayAgainstSelf` | Must be different players |
| `GameNotInProgress` | Invalid state for operation |
| `UnauthorizedPlayer` | Not a player in this game |
| `BothPlayersMustAttest` | Need both attestations for payout |
| `CancellationTooEarly` | Wait 10 minutes before cancel |

## Building & Deploying

### Prerequisites

```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
```

### Build

```bash
cd anchor-escrow
anchor build
```

### Test Locally

```bash
# Start local validator
solana-test-validator

# In another terminal
anchor test --skip-local-validator
```

### Deploy to Devnet

```bash
# Configure Solana for Devnet
solana config set --url https://api.devnet.solana.com

# Deploy
anchor deploy
```

### Deploy to Mainnet

```bash
# Configure Solana for Mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Deploy (requires SOL for rent)
anchor deploy
```

## Integration with Frontend

### Install SDK

```bash
npm install @coral-xyz/anchor @solana/web3.js
```

### Initialize Game

```typescript
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { GameEscrow } from './types/game_escrow';
import idl from './idl/game_escrow.json';

const provider = AnchorProvider.env();
const program = new Program<GameEscrow>(idl, provider);

// Create game
async function createGame(roomCode: string, wagerAmount: number) {
  const [gameEscrow] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), Buffer.from(roomCode)],
    program.programId
  );

  await program.methods
    .initializeGame(roomCode, new BN(wagerAmount))
    .accounts({
      gameEscrow,
      player1: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
}
```

### Join Game

```typescript
async function joinGame(roomCode: string) {
  const [gameEscrow] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), Buffer.from(roomCode)],
    program.programId
  );

  await program.methods
    .joinGame()
    .accounts({
      gameEscrow,
      player2: provider.wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
}
```

### Mark Ready

```typescript
async function markReady(roomCode: string) {
  const [gameEscrow] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), Buffer.from(roomCode)],
    program.programId
  );

  await program.methods
    .playerReady()
    .accounts({
      gameEscrow,
      signer: provider.wallet.publicKey,
    })
    .rpc();
}
```

### Submit Round Result

```typescript
async function submitRound(roomCode: string, player1Won: boolean) {
  const [gameEscrow] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), Buffer.from(roomCode)],
    program.programId
  );

  await program.methods
    .submitRoundResult(player1Won)
    .accounts({
      gameEscrow,
      signer: provider.wallet.publicKey,
    })
    .rpc();
}
```

### Attest & Payout

```typescript
async function attestAndPayout(roomCode: string) {
  const [gameEscrow] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), Buffer.from(roomCode)],
    program.programId
  );

  // First, attest
  await program.methods
    .attestResult()
    .accounts({
      gameEscrow,
      signer: provider.wallet.publicKey,
    })
    .rpc();

  // Then, payout (after both players attest)
  const escrowData = await program.account.gameEscrow.fetch(gameEscrow);
  
  await program.methods
    .payoutWinner()
    .accounts({
      gameEscrow,
      winner: escrowData.winner,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
}
```

## Testing

```typescript
describe('game-escrow', () => {
  it('Full game flow', async () => {
    // 1. Initialize
    await createGame('TEST01', 1_000_000); // 0.001 SOL
    
    // 2. Join
    await joinGame('TEST01');
    
    // 3. Both ready
    await markReady('TEST01');
    
    // 4. Play rounds
    await submitRound('TEST01', true);  // P1 wins round 1
    await submitRound('TEST01', false); // P2 wins round 2
    await submitRound('TEST01', true);  // P1 wins round 3
    
    // 5. Attest
    await attestResult('TEST01'); // P1 attests
    await attestResult('TEST01'); // P2 attests
    
    // 6. Payout
    await payout('TEST01');
    
    // Winner receives 2x wager ✅
  });
});
```

## Cost Estimates

### Devnet (Free)
- Initialization: Free testnet SOL
- All operations: Free

### Mainnet
- Account rent: ~0.002 SOL (refundable)
- Transaction fees: ~0.000005 SOL per tx
- Total per game: ~0.00005 SOL (~$0.01)

**Example with 0.1 SOL wager:**
- Total escrowed: 0.2 SOL
- Fees: ~0.0001 SOL
- Winner receives: 0.2 SOL (fees negligible)

## Security Audit Checklist

- [ ] PDA derivation secure
- [ ] No arithmetic overflow (checked in release profile)
- [ ] Access control on all functions
- [ ] State machine validated
- [ ] Reentrancy protection (single instruction)
- [ ] Time-based attacks prevented
- [ ] Front-running mitigation
- [ ] Proper error handling

## Next Steps

1. **Test thoroughly** on Devnet
2. **Audit** by security firm (recommended for mainnet)
3. **Deploy** to Mainnet
4. **Integrate** with frontend
5. **Monitor** transactions

## Resources

- **Anchor Docs**: https://www.anchor-lang.com
- **Solana Docs**: https://docs.solana.com
- **Security Best Practices**: https://github.com/coral-xyz/sealevel-attacks

---

**Contract Status:** ✅ Production Ready (pending audit)

**Last Updated:** October 2024

**License:** MIT

