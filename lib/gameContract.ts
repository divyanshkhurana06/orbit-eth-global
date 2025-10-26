import { ethers } from 'ethers';

// Contract ABI for GameEscrow
const GAME_ESCROW_ABI = [
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
  },
  {
    "inputs": [],
    "name": "gameIdCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "gameId", "type": "uint256"}],
    "name": "getGame",
    "outputs": [
      {
        "internalType": "struct GameEscrow.Game",
        "name": "",
        "type": "tuple",
        "components": [
          {"internalType": "address", "name": "player1", "type": "address"},
          {"internalType": "address", "name": "player2", "type": "address"},
          {"internalType": "uint256", "name": "wagerAmount", "type": "uint256"},
          {"internalType": "address", "name": "wagerToken", "type": "address"},
          {"internalType": "enum GameEscrow.GameMode", "name": "gameMode", "type": "uint8"},
          {"internalType": "enum GameEscrow.GameStatus", "name": "status", "type": "uint8"},
          {"internalType": "address", "name": "winner", "type": "address"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "uint256", "name": "completedAt", "type": "uint256"},
          {"internalType": "bytes32", "name": "gameDataHash", "type": "bytes32"}
        ]
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Winner NFT ABI
const WINNER_NFT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export class GameContractIntegration {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private gameEscrowContract: ethers.Contract | null = null;
  private winnerNFTContract: ethers.Contract | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const nftAddress = process.env.NEXT_PUBLIC_WINNER_NFT_ADDRESS;
        
        if (contractAddress && nftAddress) {
          this.gameEscrowContract = new ethers.Contract(contractAddress, GAME_ESCROW_ABI, this.signer);
          this.winnerNFTContract = new ethers.Contract(nftAddress, WINNER_NFT_ABI, this.provider);
          
          console.log('✅ Contracts initialized');
          console.log('GameEscrow:', contractAddress);
          console.log('WinnerNFT:', nftAddress);
        } else {
          console.warn('⚠️ Contract addresses not configured');
        }
      } catch (error) {
        console.error('❌ Failed to initialize provider:', error);
      }
    }
  }

  /**
   * Complete a game and mint NFT to winner
   * For demo purposes, we'll simulate the NFT minting since only contract owner can call completeGame
   */
  async completeGame(
    gameId: string,
    winner: 'player' | 'opponent',
    playerAddress: string,
    opponentAddress: string,
    gameMode: string,
    scores: { player: number; opponent: number }
  ): Promise<{ success: boolean; txHash?: string; nftTokenId?: string; error?: string }> {
    try {
      // Ensure contracts are initialized
      if (!this.gameEscrowContract || !this.signer || !this.winnerNFTContract) {
        console.log('🔄 Initializing contracts...');
        await this.initializeProvider();
        
        if (!this.gameEscrowContract || !this.signer || !this.winnerNFTContract) {
          throw new Error('Failed to initialize contracts. Please ensure wallet is connected.');
        }
      }

      console.log('🎮 Completing game on blockchain...');
      console.log('Game ID:', gameId);
      console.log('Winner:', winner);
      console.log('Player:', playerAddress);
      console.log('Opponent:', opponentAddress);
      console.log('Game Mode:', gameMode);
      console.log('Scores:', scores);

      // Determine winner address
      const winnerAddress = winner === 'player' ? playerAddress : opponentAddress;
      
      // For demo purposes, we'll simulate the NFT minting
      // In production, this would be called by an authorized referee/AI agent
      console.log('🎯 DEMO MODE: Simulating NFT minting...');
      
      // Get current total supply
      const totalSupply = await this.winnerNFTContract.totalSupply();
      const nftTokenId = totalSupply.toString();

      console.log('🏆 NFT would be minted! Token ID:', nftTokenId);
      console.log('🎉 Winner would receive NFT in wallet!');
      console.log('📝 In production, this would be handled by the AI referee agent');

      // Simulate success for demo
      return {
        success: true,
        txHash: '0x' + Math.random().toString(16).substr(2, 40), // Mock transaction hash
        nftTokenId
      };

    } catch (error: any) {
      console.error('❌ Failed to complete game:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get NFT details
   */
  async getNFTDetails(tokenId: string): Promise<{ tokenURI: string; owner: string } | null> {
    try {
      if (!this.winnerNFTContract) return null;

      const [tokenURI, owner] = await Promise.all([
        this.winnerNFTContract.tokenURI(tokenId),
        this.winnerNFTContract.ownerOf(tokenId)
      ]);

      return { tokenURI, owner };
    } catch (error) {
      console.error('Failed to get NFT details:', error);
      return null;
    }
  }

  /**
   * Get total NFTs minted
   */
  async getTotalNFTs(): Promise<number> {
    try {
      if (!this.winnerNFTContract) return 0;
      const totalSupply = await this.winnerNFTContract.totalSupply();
      return Number(totalSupply);
    } catch (error) {
      console.error('Failed to get total NFTs:', error);
      return 0;
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.signer !== null;
  }

  /**
   * Get connected wallet address
   */
  async getAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to get address:', error);
      return null;
    }
  }
}

// Export singleton instance
export const gameContract = new GameContractIntegration();
