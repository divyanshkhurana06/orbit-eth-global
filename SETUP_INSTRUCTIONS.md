# 🚀 Orbit Hackathon Setup Instructions

## Step 1: Deploy Smart Contracts

### Install Dependencies
```bash
cd contracts
npm install
```

### Create .env file
```bash
# contracts/.env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ETHERSCAN_API_KEY=your_etherscan_key
BASESCAN_API_KEY=your_basescan_key
```

### Deploy to Testnet
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# OR Deploy to Base Sepolia (recommended for low gas)
npx hardhat run scripts/deploy.js --network baseSepolia

# Save the contract address!
```

---

## Step 2: Setup Blockscout Explorer

### A) Create Account & Request Credits
1. Go to https://deploy.blockscout.com/
2. Create account with your email
3. Join ETHGlobal Discord → Blockscout channel
4. Share your email → Request hackathon credits

### B) Deploy Custom Explorer
1. Click "Add Instance"
2. Fill in details:
   - **Name:** Orbit Gaming
   - **Subdomain:** orbit (will be orbit.blockscout.com)
   - **Network:** Base Sepolia (or your deployed network)
   - **RPC URL:** https://sepolia.base.org
   - **Chain ID:** 84532
   
3. Click "Deploy" → Wait 5 minutes
4. Your explorer is live! 🎉

### C) Verify Your Contract
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

Then view it on your custom explorer!

---

## Step 3: Integrate Yellow Network SDK

### Install Yellow SDK
```bash
cd /path/to/orbit
npm install @yellow-network/sdk
```

### Update .env
```bash
# Add to your main .env
NEXT_PUBLIC_YELLOW_API_KEY=your_yellow_api_key
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # from Step 1
NEXT_PUBLIC_CHAIN_ID=84532
```

### Test Yellow Integration
```bash
npm run dev
# Try creating a game session
# Should be instant with no gas prompts!
```

---

## Step 4: Setup ASI Alliance Agents

### Install Fetch.ai uAgents
```bash
pip install uagents fetchai
```

### Create Referee Agent
The agent code is in `agents/orbit_referee.py`

### Register on Agentverse
1. Go to https://agentverse.ai/
2. Create account
3. Click "Add Agent"
4. Upload `orbit_referee.py`
5. Set environment variables:
   - CONTRACT_ADDRESS
   - RPC_URL
   - PRIVATE_KEY (for referee wallet)

### Test Agent
```bash
cd agents
python orbit_referee.py
# Should see: "OrbitReferee agent started"
```

---

## Step 5: Integrate Blockscout SDK

### Install SDK
```bash
npm install @blockscout/sdk
```

### Add to Frontend
The integration code is in `lib/blockscout.ts`

### Test SDK
1. Start your app: `npm run dev`
2. Play a game
3. After game ends → Click "View Transaction"
4. Should open your custom Blockscout explorer!

---

## Step 6: Final Testing

### Test Complete Flow
1. **Connect Wallet** → Should create Yellow session
2. **Create Game** → Instant (off-chain)
3. **Play Game** → AI referee monitors
4. **Game Ends** → Agent submits result
5. **View Transaction** → Opens Blockscout explorer
6. **Settlement** → Winnings paid

### Verify All Integrations
- [ ] Yellow session active (check console)
- [ ] Games are instant (no MetaMask popups)
- [ ] Referee agent logged game
- [ ] Transaction appears on Blockscout
- [ ] Contract verified on explorer

---

## Step 7: Create Demo Video

### Record 3 Separate Videos (2-3 min each)

**Video 1: Yellow Network**
- Show creating session with 0.1 ETH deposit
- Play 3 games back-to-back
- Emphasize NO GAS PROMPTS
- Show final settlement

**Video 2: Blockscout**
- Show custom Orbit explorer
- Play a game
- Show SDK transaction viewer in app
- Click to open explorer
- Show verified contract

**Video 3: ASI Alliance**
- Show agent monitoring game
- Game completes → Agent determines winner
- Open ASI:One chat
- Ask agent "Why did I lose?"
- Agent explains with reasoning

---

## Step 8: Submit Projects

### Yellow Network Submission
1. Go to ETHGlobal project page
2. Select "Yellow Network" track
3. Add links:
   - Demo video
   - GitHub repo
   - Live app URL
4. Write description emphasizing:
   - Session-based gaming
   - Instant transactions
   - No gas fees per game

### Blockscout Submission
1. Select "Blockscout" tracks (both if applicable)
2. Add links:
   - Your custom explorer URL
   - Demo video
   - GitHub with SDK integration
3. Emphasize:
   - Custom branded explorer
   - SDK integration in app
   - Transaction transparency

### ASI Alliance Submission
1. Select "ASI Alliance" track
2. Add links:
   - Agentverse agent URL
   - Demo video
   - GitHub repo
3. Emphasize:
   - AI referee automation
   - Human-agent chat
   - Multi-agent coordination

---

## 📋 Submission Checklist

### Required Materials
- [x] Smart contracts deployed & verified
- [ ] Yellow SDK integrated
- [ ] Blockscout explorer deployed
- [ ] Blockscout SDK integrated
- [ ] AI agents deployed on Agentverse
- [ ] Demo videos (3x)
- [ ] GitHub repo public
- [ ] README with setup instructions
- [ ] Live deployed app

### Documentation
- [ ] HACKATHON_INTEGRATION_PLAN.md
- [ ] README.md with all features
- [ ] Architecture diagram
- [ ] API documentation
- [ ] Agent interaction examples

---

## 🎯 Quick Start (5 Minutes)

If you want to test everything quickly:

```bash
# 1. Deploy contract
cd contracts && npm install && npx hardhat run scripts/deploy.js --network baseSepolia

# 2. Update .env with contract address
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=<YOUR_ADDRESS>" >> .env

# 3. Start app
cd .. && npm run dev

# 4. Start referee agent
cd agents && python orbit_referee.py

# 5. Open http://localhost:3000 and play!
```

---

## 🆘 Troubleshooting

### Yellow Network
**Q: Session not creating**
A: Check API key in .env, try refreshing page

**Q: Still seeing MetaMask popups**
A: Make sure session is active (check browser console)

### Blockscout
**Q: Explorer not deploying**
A: Request credits in Discord, wait 5-10 minutes

**Q: Contract not verified**
A: Run verify command again, check network matches

### ASI Alliance
**Q: Agent not responding**
A: Check Agentverse logs, verify API keys

**Q: Agent can't submit to contract**
A: Fund referee wallet with testnet ETH

---

## 💰 Get Testnet Funds

### Base Sepolia Faucet
https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Sepolia Faucet
https://sepoliafaucet.com/

### Arbitrum Sepolia
https://faucet.quicknode.com/arbitrum/sepolia

---

## 📞 Need Help?

- **Yellow Network:** Discord channel
- **Blockscout:** Discord channel  
- **ASI Alliance:** Discord channel
- **General:** Your team or ETHGlobal mentors

---

## 🏆 Let's Win This! 

Follow these steps carefully, test everything, and you'll have a winning submission! 💪

