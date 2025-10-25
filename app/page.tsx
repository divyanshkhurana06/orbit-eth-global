'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { MouseMoveEffect } from '@/components/MouseMoveEffect';

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to lobby
    if (isAuthenticated && user) {
      router.push('/lobby');
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, user, router]);

  const handleGetStarted = () => {
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative">
      <MouseMoveEffect />
      {/* Header */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-800' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg">
                O
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-50 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Orbit</h1>
              <p className="text-xs text-slate-400">Competitive Gaming Platform</p>
            </div>
          </div>
          
          <button
            onClick={handleGetStarted}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold transition transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400">
              🚀 Now in Beta
            </div>
            <h2 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Compete. Win. Earn.
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              The ultimate skill-based gaming platform where your abilities translate to real crypto rewards
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-lg transition transform hover:scale-105"
              >
                Start Playing Now
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-xl border-2 border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 font-bold text-lg transition"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { label: 'Active Players', value: '2,500+' },
              { label: 'Matches Played', value: '15,000+' },
              { label: 'Total Prizes', value: '$50,000+' },
              { label: 'Win Rate', value: '50%' }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="text-3xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">Why Choose Orbit?</h3>
            <p className="text-xl text-slate-400">Everything you need for competitive gaming</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎮',
                title: 'Skill-Based Games',
                description: 'Compete in various game modes that test your reflexes, memory, and coordination'
              },
              {
                icon: '💰',
                title: 'Crypto Rewards',
                description: 'Win real SOL tokens in every match. Your skills translate to actual earnings'
              },
              {
                icon: '🔒',
                title: 'Secure Escrow',
                description: 'Smart contracts ensure fair play and automatic payouts to winners'
              },
              {
                icon: '⚡',
                title: 'Instant Matches',
                description: 'Find opponents and start playing within seconds with our matchmaking system'
              },
              {
                icon: '👥',
                title: 'Social Features',
                description: 'Add friends, create teams, and compete in tournaments together'
              },
              {
                icon: '📊',
                title: 'Track Progress',
                description: 'Detailed stats, rankings, and achievements to monitor your improvement'
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-slate-800/50 border border-slate-700 hover:border-blue-500 rounded-2xl transition cursor-pointer">
                <div className="text-5xl mb-4 group-hover:scale-110 transition">{feature.icon}</div>
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h3>
            <p className="text-xl text-slate-400">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Connect & Create',
                description: 'Connect your Solana wallet and create your unique username'
              },
              {
                step: '02',
                title: 'Choose & Compete',
                description: 'Select a game mode, set your wager, and match with an opponent'
              },
              {
                step: '03',
                title: 'Win & Earn',
                description: 'Prove your skills and earn crypto rewards automatically'
              }
            ].map((item, i) => (
              <div key={i} className="relative p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl">
                <div className="text-6xl font-bold text-slate-800 mb-4">{item.step}</div>
                <h4 className="text-2xl font-bold mb-3">{item.title}</h4>
                <p className="text-slate-400">{item.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-4xl text-blue-500">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Winning?</h3>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of players competing for real crypto rewards
          </p>
          <button
            onClick={handleGetStarted}
            className="px-12 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-bold text-xl transition transform hover:scale-105 shadow-2xl"
          >
            Get Started Now
          </button>
          <p className="mt-6 text-sm text-slate-400">
            No credit card required • Free to join • Play immediately
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold">
                  O
                </div>
                <span className="text-xl font-bold">Orbit</span>
              </div>
              <p className="text-sm text-slate-400">
                The future of competitive gaming with blockchain technology
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Games</a></li>
                <li><a href="#" className="hover:text-white transition">Tournaments</a></li>
                <li><a href="#" className="hover:text-white transition">Leaderboard</a></li>
                <li><a href="#" className="hover:text-white transition">Rewards</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Fair Play</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
            <div>© 2024 Orbit. All rights reserved.</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">🐦 Twitter</a>
              <a href="#" className="hover:text-white transition">💬 Discord</a>
              <a href="#" className="hover:text-white transition">📘 Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
