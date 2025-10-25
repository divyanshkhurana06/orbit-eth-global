# ⚡ SkillDuels - Quick Start Guide

Get SkillDuels running in **5 minutes!**

## 🎯 Prerequisites

- ✅ Node.js 18+ installed → [Download here](https://nodejs.org/)
- ✅ Modern browser (Chrome/Firefox/Edge)
- ✅ Working webcam
- ✅ (Optional) Phantom wallet → [Get it here](https://phantom.app/)

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd orbit
npm install
```

Wait for all packages to download (~2 minutes).

### 2. Start the Application

```bash
npm run dev:all
```

This starts:
- **Frontend** on http://localhost:3000
- **Socket.io Server** on http://localhost:3001

### 3. Test the Game

**Open Two Browser Windows:**

**Window 1 (Player 1):**
1. Go to http://localhost:3000
2. Enter username: `Player1`
3. Click **"Create Game"**
4. **Copy the room code** (e.g., "ABC123")

**Window 2 (Player 2):**
1. Open http://localhost:3000 in **incognito/private mode**
2. Enter username: `Player2`
3. Paste the room code
4. Click **"Join Game"**

**Both Players:**
- Allow camera/microphone permissions
- Set wager amount (e.g., 0.1 SOL)
- Click **"Start Game"**
- Play the Hand Raise game!

## 🎮 How to Play

### Hand Raise Challenge

1. **Wait** for countdown (3, 2, 1...)
2. **Get Ready** message appears
3. **"RAISE YOUR HAND! ✋"** appears
4. **Raise your hand** as fast as possible!
5. **Winner** is determined by fastest reaction time

**Tips:**
- Keep hand visible in frame
- Ensure good lighting
- Raise hand decisively (not gradually)
- Position camera at chest/face level

## 🎯 Key Features to Test

### ✅ Lobby
- Room creation
- Room joining
- Username validation

### ✅ Game Room
- Video chat (see opponent)
- Emoji reactions (click emojis)
- Mute/unmute
- Video on/off

### ✅ Hand Detection
- AI tracks your hand in real-time
- Green dots show detected landmarks
- Reaction time measured in milliseconds

### ✅ Scoring
- Best of 3 rounds
- Live scoreboard
- Win/loss screens
- Wager payout display

### ✅ Wallet (Optional)
- Click "Connect Wallet"
- Connect Phantom
- See SOL balance
- (Mock wagers in MVP)

## 🔧 Troubleshooting

### Camera Not Working
```
Error: Camera access denied
```
**Fix:**
- Click camera icon in browser address bar
- Allow permissions
- Refresh page
- On Mac: System Preferences → Security → Camera

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Fix:**
```bash
# Use different port
PORT=3002 npm run dev
```

### Socket.io Not Connecting
```
Error: WebSocket connection failed
```
**Fix:**
- Ensure server is running: `npm run server`
- Check terminal for errors
- Try `http://localhost:3001` in browser

### MediaPipe Loading Slowly
```
Camera feed blank for 10+ seconds
```
**Fix:**
- Wait for models to download (first time only)
- Check internet connection
- Models cache in browser after first load

### Wallet Won't Connect
```
Error: Wallet connection failed
```
**Fix:**
- Install Phantom extension
- Unlock wallet
- Switch to Devnet in settings
- Clear browser cache

## 📱 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | ✅ Full support | Best performance |
| Firefox 88+ | ✅ Full support | Good performance |
| Edge 90+ | ✅ Full support | Good performance |
| Safari 14+ | ⚠️ Limited | WebRTC issues on Mac |
| Mobile | ❌ Not optimized | Desktop only for MVP |

## 🎨 UI Tour

### Lobby Page
- **Header**: Logo + Connect Wallet button
- **Hero**: Tagline "Play. Compete. Earn."
- **Cards**: Create Room (purple) & Join Room (blue)
- **Game Modes**: 4 mini-games showcase
- **Features**: Camera, Crypto, Voice chat icons

### Game Room
- **Header**: Room code + Score + Wager
- **Left Side**: Hand detection canvas
- **Right Side**: Video chat + Emoji reactions + Stats
- **Instructions**: How to play box

## 🧪 Development Commands

```bash
# Start frontend only
npm run dev

# Start backend only
npm run server

# Start both (recommended)
npm run dev:all

# Build for production
npm run build

# Run production build
npm start
```

## 📦 What's Included

```
✅ Next.js 16 (React 19)
✅ Tailwind CSS 4
✅ Socket.io (multiplayer)
✅ MediaPipe Hands (AI)
✅ Solana Web3 (crypto)
✅ WebRTC (video/audio)
✅ TypeScript
✅ Express server
```

## 🎯 Next Steps

1. ✅ Test all features
2. ✅ Try multiplayer with friend
3. ✅ Connect real Solana wallet
4. ✅ Get devnet SOL (free) → [solfaucet.com](https://solfaucet.com)
5. ✅ Deploy to Vercel (see DEPLOYMENT.md)

## 💡 Pro Tips

### Faster Development
```bash
# Auto-restart on file changes
npm run dev:all
# Edit any file → hot reload!
```

### Testing Multiplayer Solo
- Use regular + incognito windows
- Simulates 2 different users
- No need for 2 computers

### Viewing Logs
**Frontend:**
- F12 → Console tab

**Backend:**
- Check terminal running `npm run server`

### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Build fails | `rm -rf .next && npm run build` |
| Port busy | Change port in package.json |
| Camera black | Grant permissions + HTTPS |
| Wallet error | Install Phantom + unlock |
| Slow detection | Better lighting + positioning |

## 🌐 Deployment (Quick)

### Deploy to Vercel (Frontend)
```bash
npm i -g vercel
vercel --prod
```

### Deploy to Render (Backend)
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub
4. Deploy `server.js`

See **DEPLOYMENT.md** for full guide.

## 📚 Documentation

- **README.md** - Project overview
- **FEATURES.md** - Complete feature list
- **SETUP.md** - Detailed setup guide
- **DEPLOYMENT.md** - Production deployment
- **QUICKSTART.md** - This file!

## 🎮 Game Modes (Coming Soon)

- ✅ **Hand Raise** - Ready to play!
- 🚧 **Tennis** - Phase 2
- 🚧 **Table Tennis** - Phase 2
- 🚧 **Rock Paper Scissors** - Phase 2

## 🤝 Need Help?

**Check:**
1. Browser console (F12)
2. Server terminal logs
3. README.md troubleshooting
4. GitHub issues

**Common Questions:**

**Q: Do I need real crypto to test?**
A: No! Use Devnet (fake SOL). Get free tokens at solfaucet.com

**Q: Can I play solo?**
A: Yes! Use 2 browser windows (normal + incognito)

**Q: Why is MediaPipe slow?**
A: First load downloads models (~3MB). Subsequent loads are cached.

**Q: Mobile support?**
A: Not in MVP. Desktop only for now.

**Q: Multiplayer not working?**
A: Ensure Socket.io server is running on port 3001.

## ✅ Verification Checklist

Before considering setup complete:

- [ ] Frontend loads at localhost:3000
- [ ] Can create room
- [ ] Can join room with code
- [ ] Camera activates
- [ ] Hand detection shows green dots
- [ ] Can play full game
- [ ] Score updates correctly
- [ ] Emoji reactions work
- [ ] Video chat visible
- [ ] Audio toggle works
- [ ] Wallet connects (optional)

## 🎉 You're Ready!

If you've completed the checklist above, you're all set!

**Start playing:**
```bash
npm run dev:all
```

**Then visit:** http://localhost:3000

---

**Need more details?** Check the full documentation in README.md

**Ready to deploy?** See DEPLOYMENT.md

**Want to contribute?** PRs welcome! 🚀

