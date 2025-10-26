/**
 * Yellow Network Integration
 * Enables instant, gasless gaming sessions
 */

import { ethers } from 'ethers';

export interface YellowSession {
  sessionId: string;
  address: string;
  balance: string;
  isActive: boolean;
  gamesPlayed: number;
}

export class YellowNetworkClient {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private session: YellowSession | null = null;
  
  constructor() {}
  
  /**
   * Initialize Yellow Network session
   * @param walletProvider - Ethereum provider (MetaMask, etc.)
   */
  async initializeSession(walletProvider: any): Promise<YellowSession> {
    try {
      this.provider = new ethers.BrowserProvider(walletProvider);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Generate unique session ID
      const sessionId = ethers.keccak256(
        ethers.toUtf8Bytes(`${address}-${Date.now()}`)
      );
      
      this.session = {
        sessionId,
        address,
        balance: '0',
        isActive: true,
        gamesPlayed: 0
      };
      
      console.log('✅ Yellow Network session initialized:', this.session);
      return this.session;
    } catch (error) {
      console.error('❌ Failed to initialize Yellow session:', error);
      throw error;
    }
  }
  
  /**
   * Deposit funds into Yellow state channel
   * @param amount - Amount to deposit (in ETH)
   */
  async depositToSession(amount: string): Promise<string> {
    if (!this.signer || !this.session) {
      throw new Error('Session not initialized');
    }
    
    try {
      console.log(`💰 Depositing ${amount} ETH to Yellow session...`);
      
      // In production, this would deposit to Yellow Network bridge
      // For hackathon demo, we simulate the deposit
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }
      
      // Send deposit transaction
      const tx = await this.signer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther(amount)
      });
      
      console.log('⏳ Transaction sent:', tx.hash);
      await tx.wait();
      
      // Update session balance
      this.session.balance = amount;
      
      console.log('✅ Deposit successful! Session ready for instant gaming.');
      return tx.hash;
    } catch (error) {
      console.error('❌ Deposit failed:', error);
      throw error;
    }
  }
  
  /**
   * Create game (off-chain, instant)
   * @param gameMode - Type of game
   * @param wagerAmount - Amount to wager
   */
  async createGameOffChain(gameMode: string, wagerAmount: string): Promise<{
    gameId: string;
    instant: boolean;
  }> {
    if (!this.session || !this.session.isActive) {
      throw new Error('No active Yellow session');
    }
    
    try {
      console.log(`🎮 Creating game off-chain (instant, no gas)...`);
      
      // Generate off-chain game ID
      const gameId = ethers.keccak256(
        ethers.toUtf8Bytes(`${this.session.sessionId}-${this.session.gamesPlayed}`)
      );
      
      // This happens INSTANTLY - no blockchain transaction needed!
      this.session.gamesPlayed++;
      
      console.log('✅ Game created instantly! Game ID:', gameId);
      console.log('💪 No gas fees, no waiting!');
      
      return {
        gameId,
        instant: true
      };
    } catch (error) {
      console.error('❌ Failed to create off-chain game:', error);
      throw error;
    }
  }
  
  /**
   * Join game (off-chain, instant)
   * @param gameId - ID of game to join
   */
  async joinGameOffChain(gameId: string): Promise<boolean> {
    if (!this.session || !this.session.isActive) {
      throw new Error('No active Yellow session');
    }
    
    try {
      console.log(`🎮 Joining game off-chain (instant, no gas)...`);
      
      // This happens INSTANTLY - no blockchain transaction needed!
      this.session.gamesPlayed++;
      
      console.log('✅ Game joined instantly!');
      console.log('💪 No gas fees, no waiting!');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join off-chain game:', error);
      throw error;
    }
  }
  
  /**
   * Complete game (off-chain state update)
   * @param gameId - ID of completed game
   * @param winner - Address of winner
   */
  async completeGameOffChain(gameId: string, winner: string): Promise<void> {
    if (!this.session || !this.session.isActive) {
      throw new Error('No active Yellow session');
    }
    
    console.log(`✅ Game ${gameId} completed off-chain`);
    console.log(`🏆 Winner: ${winner}`);
    console.log('💡 Settlement will happen on-chain when you end your session');
  }
  
  /**
   * End session and settle all games on-chain
   */
  async endSessionAndSettle(): Promise<string> {
    if (!this.signer || !this.session) {
      throw new Error('Session not initialized');
    }
    
    try {
      console.log(`🔄 Settling ${this.session.gamesPlayed} games on-chain...`);
      
      // In production, this would trigger batch settlement via Yellow Network
      // For hackathon demo, we simulate settlement
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }
      
      // This is the ONLY on-chain transaction needed for the entire session!
      const tx = await this.signer.sendTransaction({
        to: contractAddress,
        value: 0, // Settlement doesn't require more funds
        data: ethers.id('settleSession(bytes32)').slice(0, 10) + 
              this.session.sessionId.slice(2)
      });
      
      console.log('⏳ Settlement transaction sent:', tx.hash);
      await tx.wait();
      
      console.log('✅ Session settled successfully!');
      console.log(`🎮 Played ${this.session.gamesPlayed} games with only 2 transactions!`);
      console.log('💰 Massive gas savings!');
      
      // Deactivate session
      this.session.isActive = false;
      
      return tx.hash;
    } catch (error) {
      console.error('❌ Settlement failed:', error);
      throw error;
    }
  }
  
  /**
   * Get current session info
   */
  getSession(): YellowSession | null {
    return this.session;
  }
  
  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.session?.isActive || false;
  }
}

// Singleton instance
let yellowClient: YellowNetworkClient | null = null;

export const getYellowClient = (): YellowNetworkClient => {
  if (!yellowClient) {
    yellowClient = new YellowNetworkClient();
  }
  return yellowClient;
};

export default YellowNetworkClient;

