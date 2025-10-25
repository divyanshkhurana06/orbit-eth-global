# 🚀 SkillDuels - Setup Guide

This guide will help you get SkillDuels running locally in under 5 minutes!

## Prerequisites Checklist

- ✅ Node.js 18 or higher installed
- ✅ A modern browser (Chrome, Firefox, or Edge recommended)
- ✅ Webcam connected and working
- ✅ (Optional) Phantom wallet extension installed

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js for the frontend
- Socket.io for multiplayer
- MediaPipe for AI hand tracking
- Solana wallet adapters

### 2. Start the Application

**Option A: Start Everything at Once (Recommended)**
```bash
npm run dev:all
```

This runs both the Next.js frontend and Socket.io server concurrently.

**Option B: Start Separately**
```bash
# Terminal 1
npm run dev

# Terminal 2  
npm run server
```

### 3. Open the App

Navigate to **http://localhost:3000** in your browser.

## First Time Setup

### Testing Without Wallet

You can test the game immediately without connecting a wallet:

1. Enter a username (e.g., "Player1")
2. Click "Create Game"
3. Copy the room code shown
4. Open a new browser window/tab (or use incognito)
5. Enter a different username (e.g., "Player2")
6. Paste the room code and click "Join Game"

Now you have a 2-player match ready!

### Setting Up Solana Wallet (Optional)

1. **Install Phantom Wallet**
   - Go to https://phantom.app/
   - Install the browser extension
   - Create a new wallet or import existing

2. **Get Devnet SOL (Free Test Tokens)**
   - Switch Phantom to "Devnet" in settings
   - Visit https://solfaucet.com/
   - Enter your wallet address
   - Receive free devnet SOL for testing

3. **Connect in SkillDuels**
   - Click "Connect Wallet" button
   - Approve the connection in Phantom
   - Your balance will appear in the header

## Troubleshooting

### Camera Permission Denied

If you see a "Camera access denied" error:

1. Check browser address bar for permission prompt
2. Click the camera icon and allow access
3. Refresh the page
4. On Mac: System Preferences → Security & Privacy → Camera → Enable for your browser

### Port Already in Use

If port 3000 or 3001 is already in use:

**Change Next.js Port:**
```bash
PORT=3002 npm run dev
```

**Change Socket.io Port:**
Edit `server.js` line 41:
```javascript
const PORT = process.env.PORT || 3002;
```

### Wallet Not Connecting

1. Ensure Phantom extension is installed and unlocked
2. Try disconnecting and reconnecting
3. Check if you're on the correct network (Devnet)
4. Clear browser cache and restart

### MediaPipe Loading Slowly

MediaPipe models are loaded from CDN on first use. This can take a few seconds. Subsequent loads will be faster due to browser caching.

## Game Controls

### Hand Raise Game

1. **Countdown**: Wait for 3-2-1 countdown
2. **Get Ready**: Screen will show "Get Ready..."
3. **GO Signal**: When you see "RAISE YOUR HAND! ✋"
4. **React**: Raise your hand as fast as possible
5. **Winner**: Fastest player wins the round

### Tips for Best Detection

- Ensure good lighting
- Keep your hand in frame
- Raise hand decisively (not gradually)
- Position camera at chest/face level

## Development Tips

### Hot Reload

Both Next.js and the Socket.io server support hot reload:
- Edit any `.tsx` file → Frontend reloads automatically
- Edit `server.js` → Restart with Ctrl+C and `npm run server`

### Testing Multiplayer Solo

Use two browser windows:
- Regular window as Player 1
- Incognito/Private window as Player 2

This simulates two different users on the same machine.

### Viewing Console Logs

**Frontend logs:**
- Open browser DevTools (F12)
- Check Console tab

**Backend logs:**
- Check the terminal where `npm run server` is running

## Project Structure Quick Reference

```
Key Files:
├── app/page.tsx              → Lobby UI
├── app/game/page.tsx         → Game Room
├── components/
│   ├── HandRaiseGame.tsx    → Main game logic + MediaPipe
│   ├── VideoChat.tsx        → WebRTC implementation
│   └── WalletButton.tsx     → Solana wallet UI
├── server.js                → Socket.io multiplayer server
└── lib/wager.ts            → Wager/escrow logic
```

## Next Steps

Once everything is running:

1. ✅ Test the lobby and room creation
2. ✅ Try a multiplayer match
3. ✅ Experiment with emoji reactions
4. ✅ Connect wallet and test wager flow
5. ✅ Build new game modes!

## Need Help?

Common issues:
- **"Module not found"** → Run `npm install` again
- **Blank screen** → Check browser console for errors
- **Camera not detected** → Grant permissions and use HTTPS in production

## Production Deployment

### Vercel (Recommended for Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Backend Deployment

For Socket.io server, use:
- Render.com
- Railway.app
- DigitalOcean

Remember to:
1. Update CORS settings in `server.js`
2. Set production Solana RPC endpoint
3. Use environment variables for secrets

---

**Ready to play?** Start the servers and visit http://localhost:3000! 🎮

