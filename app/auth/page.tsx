'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useUserStore } from '@/lib/store';
import { userOperations } from '@/lib/supabase';
import { MouseMoveEffect } from '@/components/MouseMoveEffect';

export default function AuthPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const { user, setUser, isAuthenticated } = useUserStore();
  
  const [step, setStep] = useState<'wallet' | 'username'>('wallet');
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [error, setError] = useState('');

  // Check if wallet already has an account
  useEffect(() => {
    if (connected && publicKey) {
      checkExistingUser();
    }
  }, [connected, publicKey]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/lobby');
    }
  }, [isAuthenticated, user, router]);

  const checkExistingUser = async () => {
    if (!publicKey) return;
    
    const existingUser = await userOperations.getUserByWallet(publicKey.toString());
    
    if (existingUser) {
      // User already exists, log them in
      setUser(existingUser);
      await userOperations.updateUserStatus(existingUser.id, 'online');
      router.push('/lobby');
    } else {
      // New user, proceed to username selection
      setStep('username');
    }
  };

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    const available = await userOperations.isUsernameAvailable(value);
    setUsernameAvailable(available);
    setIsCheckingUsername(false);
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric and underscores
    const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(sanitized);
    
    // Debounce username check
    if (sanitized.length >= 3) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleCreateAccount = async () => {
    if (!publicKey || !username || !usernameAvailable) return;

    setIsCreatingUser(true);
    setError('');

    try {
      const newUser = await userOperations.createUser(username, publicKey.toString());
      
      if (newUser) {
        setUser(newUser);
        await userOperations.updateUserStatus(newUser.id, 'online');
        router.push('/lobby');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-6 relative">
      <MouseMoveEffect />
      <div className="max-w-md w-full relative z-40">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="text-7xl mb-4">
              🌐
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Orbit</h1>
          <p className="text-slate-400">Let's get you started</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'wallet' ? 'text-blue-400' : 'text-green-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'wallet' ? 'border-blue-400 bg-blue-400/10' : 'border-green-400 bg-green-400/10'
            }`}>
              {step === 'wallet' ? '1' : '✓'}
            </div>
            <span className="text-sm font-semibold">Connect Wallet</span>
          </div>
          <div className="h-px w-8 bg-slate-700"></div>
          <div className={`flex items-center gap-2 ${step === 'username' ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'username' ? 'border-blue-400 bg-blue-400/10' : 'border-slate-700'
            }`}>
              2
            </div>
            <span className="text-sm font-semibold">Choose Username</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          {step === 'wallet' ? (
            <>
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-slate-400 mb-6">
                Connect your Solana wallet to get started. We support Phantom, Solflare, and more.
              </p>
              
              <div className="space-y-4">
                <WalletMultiButton className="!w-full !bg-gradient-to-r !from-cyan-600 !to-blue-600 hover:!from-cyan-700 hover:!to-blue-700 !rounded-xl !py-4 !font-bold !text-lg !transition" />
                
                {connected && publicKey && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Wallet Connected</span>
                    </div>
                    <div className="text-slate-300 font-mono text-xs break-all">
                      {publicKey.toString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-slate-400">
                <p className="font-semibold text-blue-400 mb-2">Why do I need a wallet?</p>
                <ul className="space-y-1 text-xs">
                  <li>• Secure your account and earnings</li>
                  <li>• Participate in crypto wagering</li>
                  <li>• Own your gaming identity</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Choose Your Username</h2>
              <p className="text-slate-400 mb-6">
                Pick a unique username that represents you in the arena.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="Enter username"
                      maxLength={20}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg outline-none focus:border-blue-500 transition pr-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? (
                        <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                      ) : usernameAvailable === true ? (
                        <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : usernameAvailable === false ? (
                        <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </div>
                  </div>
                  {username.length > 0 && username.length < 3 && (
                    <p className="mt-2 text-sm text-slate-400">
                      Username must be at least 3 characters
                    </p>
                  )}
                  {usernameAvailable === false && (
                    <p className="mt-2 text-sm text-red-400">
                      This username is already taken
                    </p>
                  )}
                  {usernameAvailable === true && (
                    <p className="mt-2 text-sm text-green-400">
                      Great! This username is available
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreateAccount}
                  disabled={!usernameAvailable || isCreatingUser}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingUser ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg text-sm text-slate-400">
                <p className="font-semibold text-blue-400 mb-2">Username Guidelines:</p>
                <ul className="space-y-1 text-xs">
                  <li>• 3-20 characters long</li>
                  <li>• Letters, numbers, and underscores only</li>
                  <li>• Must be unique (we'll check)</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full text-center text-slate-400 hover:text-white transition"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

