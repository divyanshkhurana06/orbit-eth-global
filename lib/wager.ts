import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WagerInfo {
  amount: number;
  escrowWallet: string;
  players: string[];
  status: 'pending' | 'active' | 'completed';
}

// Mock wager storage (in production, this would be on-chain)
const activeWagers = new Map<string, WagerInfo>();

export class WagerService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com');
  }

  async createWager(roomCode: string, amount: number, playerWallet: string): Promise<WagerInfo> {
    // In production, this would create an escrow account on-chain
    const wagerInfo: WagerInfo = {
      amount,
      escrowWallet: 'ESCROW_' + roomCode, // Mock escrow address
      players: [playerWallet],
      status: 'pending'
    };

    activeWagers.set(roomCode, wagerInfo);
    return wagerInfo;
  }

  async joinWager(roomCode: string, playerWallet: string): Promise<WagerInfo | null> {
    const wager = activeWagers.get(roomCode);
    if (!wager) return null;

    wager.players.push(playerWallet);
    wager.status = 'active';
    activeWagers.set(roomCode, wager);

    return wager;
  }

  async payoutWinner(roomCode: string, winnerWallet: string): Promise<boolean> {
    const wager = activeWagers.get(roomCode);
    if (!wager) return false;

    // In production, this would transfer SOL from escrow to winner
    console.log(`Paying out ${wager.amount * 2} SOL to ${winnerWallet}`);
    
    wager.status = 'completed';
    activeWagers.set(roomCode, wager);

    return true;
  }

  getWager(roomCode: string): WagerInfo | null {
    return activeWagers.get(roomCode) || null;
  }

  // Mock transaction creation for demo
  async createWagerTransaction(
    fromPubkey: PublicKey,
    amount: number,
    escrowPubkey: PublicKey
  ): Promise<Transaction> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: escrowPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    return transaction;
  }
}

export const wagerService = new WagerService();

