# 🌐 Orbit - AI-Powered Web3 Gaming Platform

> Camera-based 1v1 skill games with crypto wagers, voice chat, and winner NFTs

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.0.9-yellow)](https://hardhat.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-AI-orange)](https://mediapipe.dev/)
[![Base](https://img.shields.io/badge/Base-Sepolia-blue)](https://base.org/)

## 🎮 Overview

**Orbit** is a revolutionary Web3 gaming platform that combines AI-powered gesture recognition with blockchain technology to create immersive 1v1 skill-based games. Players compete in real-time using their camera for gesture detection, with crypto wagers and instant NFT rewards for winners.

### ✨ Key Features

- 🤖 **AI-Powered Games**: MediaPipe hand tracking and pose detection
- 🎥 **Real-time Multiplayer**: WebRTC video chat and Socket.io synchronization  
- 💰 **Crypto Integration**: Solidity smart contracts for escrow and wagers
- 🏆 **Winner NFTs**: Automatic ERC721 certificate minting
- 🤖 **AI Referee**: Fetch.ai uAgents for automated verification
- 🎨 **Professional UI**: Modern 3-column layout design

## 🎯 Available Games

### 🏋️ Pushup Battle
- **AI Model**: MediaPipe Pose
- **Objective**: First to complete target pushups wins
- **Features**: Real-time counting, goal selection, multiplayer sync

### ✊ Rock Paper Scissors  
- **AI Model**: MediaPipe Hands
- **Objective**: Best of 5 rounds
- **Features**: Hand gesture detection, round tracking, winner animations

### 🏓 Table Tennis
- **AI Model**: MediaPipe Hands  
- **Objective**: First to 11 points, win by 2
- **Features**: Hand-controlled paddles, ball physics, official rules

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 16** with TypeScript
- **Tailwind CSS** for styling
- **MediaPipe** for AI/computer vision
- **WebRTC** for video/audio
- **Socket.io** for real-time sync
- **Ethers.js v6** for blockchain

### Smart Contracts
- **Solidity** on Base Sepolia
- **Hardhat 3** for development
- **OpenZeppelin** security standards
- **GameEscrow.sol**: Wager escrow & payouts
- **OrbitWinnerNFT.sol**: Winner certificates

### AI & Computer Vision
- **MediaPipe Hands**: Gesture detection
- **MediaPipe Pose**: Body tracking
- **TensorFlow.js**: Object detection
- **Custom physics engines**

### Blockchain Integration
- **Yellow Network**: Gasless transactions
- **Blockscout**: Transaction explorer
- **Base Sepolia**: EVM testnet
- **Fetch.ai**: AI referee agents

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- Camera access

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/orbit.git
cd orbit

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev

# Start Socket.io server (in another terminal)
npm run server
```

### Environment Setup

```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Socket.io Server
SOCKET_SERVER_URL=http://localhost:3001

# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x85761DB340EF99E060B6c5db6218dFDD503780c3
NEXT_PUBLIC_WINNER_NFT_ADDRESS=0x258007af6A45b09D1026DB6c4aE7ab9E9aE8A519
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 🎮 How to Play

1. **Connect Wallet**: Link your MetaMask or Phantom wallet
2. **Set Username**: Choose a unique username
3. **Create/Join Room**: Host a game or join with a room code
4. **Select Game Mode**: Choose from available games
5. **Ready Up**: Both players confirm readiness
6. **Play**: Use camera gestures to compete
7. **Win**: Get crypto rewards and NFT certificate!

## 🏆 ETHGlobal Hackathon Integrations

### 🥇 Blockscout ($10,000 Prize Pool)
- ✅ **SDK Integration**: Transaction explorer integration with custom configuration
- ✅ **Autoscout Usage**: Ready for self-service explorer launchpad
- ✅ **MCP Integration**: AI-powered blockchain data analysis
- ✅ **Transaction Verification**: Contract verification on Base Sepolia
- **Prize Tracks**: Best use of Autoscout, SDK integration, MCP usage

### 🥇 Artificial Superintelligence Alliance ($10,000 Prize Pool)
- ✅ **Fetch.ai uAgents**: AI referee agent for automated game verification
- ✅ **MeTTa Reasoning**: Structured knowledge for winner validation
- ✅ **Agentverse Integration**: AI agent deployment and orchestration
- ✅ **Human-Agent Interaction**: Seamless AI-powered game management
- **Prize Tracks**: Human-agent interaction, Agentverse launch, multi-agent systems

### 🥉 Hardhat ($5,000 Prize Pool)
- ✅ **Hardhat 3.0.9**: Latest version with full development environment
- ✅ **Smart Contract Deployment**: Deployed on Base Sepolia testnet
- ✅ **Development Workflow**: Complete compilation, testing, and deployment pipeline
- ✅ **Contract Verification**: Etherscan/BaseScan integration ready
- **Prize Tracks**: Hardhat 3 usage, development workflow optimization

## 📁 Project Structure

```
orbit/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentication
│   ├── lobby/             # Game lobby
│   └── game/              # Game interface
├── components/             # React components
│   ├── PushupBattleGame.tsx
│   ├── RockPaperScissorsGame.tsx
│   ├── TableTennisGame.tsx
│   ├── VideoChat.tsx
│   └── ChatBox.tsx
├── contracts/              # Smart contracts
│   ├── contracts/
│   │   ├── GameEscrow.sol
│   │   └── OrbitWinnerNFT.sol
│   ├── scripts/
│   └── hardhat.config.js
├── lib/                    # Utilities
│   ├── gameContract.ts     # Blockchain integration
│   ├── yellowNetwork.ts    # Yellow Network SDK
│   └── blockscout.ts       # Blockscout integration
├── agents/                 # AI agents
│   └── orbit_referee.py    # Fetch.ai referee agent
└── server.js              # Socket.io server
```

## 🔧 Development

### Smart Contract Development

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Verify contracts
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Socket.io Server

```bash
# Start Socket.io server
npm run server
```

## 🎯 Game Modes

### Pushup Battle
- Players select target count (10-100)
- Goal is average of both selections
- MediaPipe Pose tracks pushup movements
- First to reach goal wins

### Rock Paper Scissors
- MediaPipe Hands detects gestures
- Best of 5 rounds
- Real-time gesture recognition
- Winner animations

### Table Tennis
- Hand-controlled paddles
- Official scoring rules (first to 11, win by 2)
- Ball physics with collision detection
- Responsive canvas rendering

## 🔗 Contract Addresses

**Base Sepolia Network:**
- **GameEscrow**: `0x85761DB340EF99E060B6c5db6218dFDD503780c3`
- **OrbitWinnerNFT**: `0x258007af6A45b09D1026DB6c4aE7ab9E9aE8A519`

## 🌐 Explorer Links

- **BaseScan**: [View on BaseScan](https://basescan.org/address/0x85761DB340EF99E060B6c5db6218dFDD503780c3)
- **Blockscout**: [View on Blockscout](https://base-sepolia.blockscout.com/address/0x85761DB340EF99E060B6c5db6218dFDD503780c3)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **MediaPipe** for AI/computer vision capabilities
- **Hardhat** for smart contract development framework
- **Blockscout** for blockchain exploration and SDK
- **Fetch.ai** for AI agent framework and uAgents
- **Base** for EVM-compatible testnet
- **ETHGlobal** for hackathon platform and prizes

## 📞 Contact

- **Project**: Orbit Web3 Gaming Platform
- **Hackathon**: ETHGlobal Online
- **Track**: Blockscout, ASI Alliance, Hardhat

---

**Built with ❤️ for the Web3 gaming revolution**