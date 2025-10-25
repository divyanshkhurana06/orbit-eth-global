'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function WalletButton() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (publicKey && connected) {
      // Fetch wallet balance
      const connection = new Connection('https://api.devnet.solana.com');
      connection.getBalance(publicKey).then((bal) => {
        setBalance(bal / LAMPORTS_PER_SOL);
      });
    } else {
      setBalance(null);
    }
  }, [publicKey, connected]);

  return (
    <div className="flex items-center gap-3">
      {connected && balance !== null && (
        <div className="px-4 py-2 bg-purple-900/50 rounded-lg border border-purple-500/30">
          <div className="text-xs text-gray-400">Balance</div>
          <div className="font-bold text-yellow-400">
            {balance.toFixed(2)} SOL
          </div>
        </div>
      )}
      <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !px-4 !py-2 !font-bold !transition" />
    </div>
  );
}

