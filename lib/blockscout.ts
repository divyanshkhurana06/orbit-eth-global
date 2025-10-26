/**
 * Blockscout SDK Integration
 * Provides in-app transaction explorer and verification
 */

export interface BlockscoutConfig {
  explorerUrl: string;
  apiUrl: string;
  chainId: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: 'pending' | 'success' | 'failed';
  blockNumber?: number;
  timestamp?: number;
  gasUsed?: string;
}

export interface ContractInfo {
  address: string;
  name: string;
  verified: boolean;
  compiler?: string;
  optimization?: boolean;
}

export class BlockscoutClient {
  private config: BlockscoutConfig;
  
  constructor(chainId: number) {
    // Configure based on network
    this.config = this.getNetworkConfig(chainId);
    console.log('🔍 Blockscout initialized:', this.config);
  }
  
  private getNetworkConfig(chainId: number): BlockscoutConfig {
    // Map of chain IDs to Blockscout instances
    const configs: { [key: number]: BlockscoutConfig } = {
      // Base Sepolia
      84532: {
        explorerUrl: 'https://base-sepolia.blockscout.com',
        apiUrl: 'https://base-sepolia.blockscout.com/api',
        chainId: 84532
      },
      // Sepolia
      11155111: {
        explorerUrl: 'https://eth-sepolia.blockscout.com',
        apiUrl: 'https://eth-sepolia.blockscout.com/api',
        chainId: 11155111
      },
      // Custom Orbit explorer (if deployed)
      999999: {
        explorerUrl: process.env.NEXT_PUBLIC_BLOCKSCOUT_URL || 'https://orbit.blockscout.com',
        apiUrl: process.env.NEXT_PUBLIC_BLOCKSCOUT_API || 'https://orbit.blockscout.com/api',
        chainId: 999999
      }
    };
    
    return configs[chainId] || configs[84532]; // Default to Base Sepolia
  }
  
  /**
   * Get transaction details
   * @param txHash - Transaction hash
   */
  async getTransaction(txHash: string): Promise<Transaction> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}?module=transaction&action=gettxinfo&txhash=${txHash}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const tx = data.result;
        return {
          hash: txHash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          status: tx.isError === '0' ? 'success' : 'failed',
          blockNumber: parseInt(tx.blockNumber),
          timestamp: parseInt(tx.timeStamp),
          gasUsed: tx.gasUsed
        };
      }
      
      // If not found yet, it's pending
      return {
        hash: txHash,
        from: '',
        to: '',
        value: '0',
        status: 'pending'
      };
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      throw error;
    }
  }
  
  /**
   * Get contract information
   * @param address - Contract address
   */
  async getContractInfo(address: string): Promise<ContractInfo> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}?module=contract&action=getsourcecode&address=${address}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result && data.result.length > 0) {
        const contract = data.result[0];
        return {
          address,
          name: contract.ContractName || 'Unknown',
          verified: contract.SourceCode !== '',
          compiler: contract.CompilerVersion,
          optimization: contract.OptimizationUsed === '1'
        };
      }
      
      return {
        address,
        name: 'Unknown',
        verified: false
      };
    } catch (error) {
      console.error('Failed to fetch contract info:', error);
      throw error;
    }
  }
  
  /**
   * Get address transactions
   * @param address - Wallet address
   * @param limit - Number of transactions to fetch
   */
  async getAddressTransactions(address: string, limit: number = 10): Promise<Transaction[]> {
    try {
      const response = await fetch(
        `${this.config.apiUrl}?module=account&action=txlist&address=${address}&page=1&offset=${limit}&sort=desc`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        return data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          status: tx.isError === '0' ? 'success' : 'failed',
          blockNumber: parseInt(tx.blockNumber),
          timestamp: parseInt(tx.timeStamp),
          gasUsed: tx.gasUsed
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch address transactions:', error);
      return [];
    }
  }
  
  /**
   * Generate explorer URL for transaction
   * @param txHash - Transaction hash
   */
  getTransactionUrl(txHash: string): string {
    return `${this.config.explorerUrl}/tx/${txHash}`;
  }
  
  /**
   * Generate explorer URL for address
   * @param address - Wallet or contract address
   */
  getAddressUrl(address: string): string {
    return `${this.config.explorerUrl}/address/${address}`;
  }
  
  /**
   * Generate explorer URL for contract
   * @param address - Contract address
   */
  getContractUrl(address: string): string {
    return `${this.config.explorerUrl}/address/${address}#code`;
  }
  
  /**
   * Open transaction in new tab
   * @param txHash - Transaction hash
   */
  openTransaction(txHash: string): void {
    window.open(this.getTransactionUrl(txHash), '_blank');
  }
  
  /**
   * Open address in new tab
   * @param address - Address to view
   */
  openAddress(address: string): void {
    window.open(this.getAddressUrl(address), '_blank');
  }
  
  /**
   * Open contract in new tab
   * @param address - Contract address
   */
  openContract(address: string): void {
    window.open(this.getContractUrl(address), '_blank');
  }
}

// Singleton instance
let blockscoutClient: BlockscoutClient | null = null;

export const getBlockscoutClient = (chainId: number = 84532): BlockscoutClient => {
  if (!blockscoutClient || blockscoutClient['config'].chainId !== chainId) {
    blockscoutClient = new BlockscoutClient(chainId);
  }
  return blockscoutClient;
};

export default BlockscoutClient;

