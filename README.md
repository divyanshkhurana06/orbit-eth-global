# 🕹️ SkillDuels (OrbitPlay)

**Tagline:** "Play. Compete. Earn."

A platform where users can join 1v1 camera-based skill games, wager crypto tokens, and earn based on their wins — all while being able to voice chat, send emojis, and build their gaming rep.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![Solana](https://img.shields.io/badge/Solana-Web3-purple)
![MediaPipe](https://img.shields.io/badge/MediaPipe-AI-green)

## 🎮 Features

- **Real-time Multiplayer**: 1v1 matches with WebRTC video/audio
- **AI Gesture Detection**: MediaPipe Hands for accurate hand tracking
- **Crypto Wagering**: Solana integration for token-based betting
- **Multiple Game Modes**: Hand Raise, Tennis, Table Tennis, and more
- **Social Features**: Emoji reactions, voice chat, live scoreboard
- **Beautiful UI**: Modern, neon-style gaming interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Phantom or Solflare wallet for crypto integration
- Webcam for gesture detection

### Installation

```bash
# Clone the repository
cd orbit

# Install dependencies
npm install

# Run both Next.js and Socket.io server
npm run dev:all
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Socket.io Server**: http://localhost:3001

### Running Separately

```bash
# Terminal 1 - Next.js frontend
npm run dev

# Terminal 2 - Socket.io server
npm run server
```

## 🎯 How to Play

1. **Connect Your Wallet** (Optional for MVP)
   - Click "Connect Wallet" in the header
   - Select Phantom or Solflare
   - Approve connection

2. **Create or Join a Room**
   - Enter your username
   - Click "Create Game" to host a new room
   - Or enter a room code and click "Join Game"

3. **Set Your Wager**
   - Once matched with an opponent, set your SOL wager amount
   - Both players must agree

4. **Play the Game**
   - Follow on-screen instructions for each game mode
   - In "Hand Raise" mode, raise your hand as fast as possible when prompted
   - Fastest reaction wins the round

5. **Win and Earn**
   - Best of 3 rounds wins the match
   - Winner takes the pot automatically

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| AI Vision | MediaPipe Hands, TensorFlow.js |
| Real-time | Socket.io, WebRTC |
| Blockchain | Solana Web3.js, Wallet Adapters |
| Server | Express, Node.js |

## 📁 Project Structure

```
orbit/
├── app/
│   ├── page.tsx          # Lobby page
│   ├── game/
│   │   └── page.tsx      # Game room page
│   ├── layout.tsx        # Root layout with WalletProvider
│   └── globals.css       # Global styles
├── components/
│   ├── HandRaiseGame.tsx # Main game component with MediaPipe
│   ├── VideoChat.tsx     # WebRTC video/audio
│   ├── GameUI.tsx        # Emoji reactions & stats
│   ├── WalletProvider.tsx # Solana wallet context
│   └── WalletButton.tsx  # Wallet connection UI
├── lib/
│   └── wager.ts          # Wager management service
├── server.js             # Socket.io multiplayer server
└── package.json
```

## 🎮 Game Modes

### Hand Raise (MVP) ✋
React as fast as possible when prompted. AI detects when you raise your hand.

### Coming Soon
- **Tennis** 🎾 - Swing tracking
- **Table Tennis** 🏓 - Fast-paced paddle detection
- **Rock Paper Scissors** ✊ - Gesture-based classic

## 🔧 Configuration

### Solana Network
Currently configured for **Devnet**. Change in `components/WalletProvider.tsx`:

```typescript
const network = WalletAdapterNetwork.Mainnet; // or Devnet
```

### Socket.io Server Port
Change in `server.js`:

```javascript
const PORT = process.env.PORT || 3001;
```

## 🛠️ Development

### Adding New Game Modes

1. Create a new component in `components/` (e.g., `TennisGame.tsx`)
2. Implement MediaPipe gesture detection logic
3. Add to game selection in `app/game/page.tsx`
4. Update Socket.io events in `server.js`

### Testing MediaPipe

The hand detection uses MediaPipe's pre-trained models from CDN:
```
https://cdn.jsdelivr.net/npm/@mediapipe/hands/
```

For offline development, you can download models locally.

## 🐛 Troubleshooting

### Camera Not Working
- Ensure browser has camera permissions
- Use HTTPS in production (WebRTC requirement)
- Check if camera is already in use

### Wallet Connection Issues
- Make sure Phantom/Solflare extension is installed
- Check if you're on the correct network (Devnet/Mainnet)
- Clear browser cache and reconnect

### Socket.io Connection Failed
- Ensure the server is running on port 3001
- Check firewall settings
- Verify CORS configuration in `server.js`

## 📈 Roadmap

### Phase 1 - MVP ✅
- [x] Lobby with room creation/joining
- [x] Hand Raise game with MediaPipe
- [x] WebRTC video/audio
- [x] Socket.io multiplayer
- [x] Wallet connection
- [x] Mock wager system

### Phase 2 - Prototype (1 Week)
- [ ] Real on-chain token staking
- [ ] Additional game modes (Tennis, Table Tennis)
- [ ] Leaderboard
- [ ] Match history

### Phase 3 - Alpha (1 Month)
- [ ] Tournament system
- [ ] NFT profile badges
- [ ] Spectator mode
- [ ] Mobile responsive design

### Phase 4 - Beta/Launch
- [ ] Cross-chain support (Polygon, Ethereum)
- [ ] Community tournaments
- [ ] Premium rooms
- [ ] Streaming integration

## 🤝 Contributing

This is a hackathon project! Contributions are welcome.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or building your own games!

## 🙏 Acknowledgments

- MediaPipe for incredible hand tracking
- Solana for fast, cheap transactions
- Next.js team for the amazing framework
- The Web3 gaming community

## 💬 Contact

Built with ❤️ for hackathons and the future of skill-based gaming.

---

**Ready to duel?** 🕹️ Connect your wallet and show off your skills!
