# 🚀 Deployment Guide

This guide covers deploying SkillDuels to production.

## Architecture Overview

```
Frontend (Next.js)          Backend (Socket.io)         Blockchain (Solana)
┌─────────────┐            ┌──────────────┐           ┌───────────────┐
│   Vercel    │ ←─────→   │   Render     │ ←────→   │   Mainnet/    │
│   or        │   WebRTC   │   or         │  Web3    │   Devnet      │
│   Netlify   │            │   Railway    │           │               │
└─────────────┘            └──────────────┘           └───────────────┘
```

## Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

1. **Update Socket.io Connection**

Edit the game components to use environment variable:

```typescript
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
```

2. **Set Environment Variables**

Create `.env.production`:
```bash
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com
2. Connect your GitHub repository
3. Add environment variables in project settings
4. Deploy

### Step 3: Configure Domain

1. Add custom domain in Vercel dashboard
2. Update DNS records
3. Enable HTTPS (automatic with Vercel)

## Backend Deployment (Render)

### Step 1: Create render.yaml

```yaml
services:
  - type: web
    name: skillduels-server
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
```

### Step 2: Deploy

1. **Via Render Dashboard:**
   - Go to https://render.com
   - New → Web Service
   - Connect GitHub repo
   - Select `server.js` as entry point
   - Deploy

2. **Via CLI:**
```bash
# Install Render CLI
npm i -g @renderinc/cli

# Deploy
render deploy
```

### Step 3: Update CORS

Edit `server.js`:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://your-frontend.vercel.app'
    ],
    methods: ['GET', 'POST']
  }
});
```

## Alternative: Railway Deployment

### Backend on Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

**Or use Railway Dashboard:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Set start command: `node server.js`
5. Deploy

## Blockchain Deployment

### Phase 2: Smart Contract Deployment

When ready to deploy the Solana program:

1. **Build the Contract**
```bash
cd contracts
anchor build
```

2. **Deploy to Devnet**
```bash
anchor deploy --provider.cluster devnet
```

3. **Deploy to Mainnet**
```bash
anchor deploy --provider.cluster mainnet
```

4. **Update Program ID**
Update `lib/wager.ts` with the deployed program ID.

### Wallet Configuration

**Mainnet:**
```typescript
// components/WalletProvider.tsx
const network = WalletAdapterNetwork.Mainnet;
const endpoint = 'https://api.mainnet-beta.solana.com';
```

**Use Custom RPC for Better Performance:**
```typescript
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
  'https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY';
```

Recommended RPC providers:
- **Alchemy** - https://alchemy.com
- **QuickNode** - https://quicknode.com
- **GenesysGo** - https://genesysgo.com

## Environment Variables Reference

### Frontend (.env.production)
```bash
NEXT_PUBLIC_SOCKET_URL=https://api.skillduels.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_PROGRAM_ID=YourDeployedProgramID111111111111111
```

### Backend
```bash
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://skillduels.com,https://www.skillduels.com
```

## Performance Optimization

### 1. CDN for Static Assets

Use Vercel's built-in CDN or configure custom CDN:
```javascript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['cdn.skillduels.com'],
  },
  assetPrefix: process.env.CDN_URL,
};
```

### 2. Enable Compression

Backend already has compression. For frontend:
```javascript
// next.config.ts
const nextConfig = {
  compress: true,
  poweredByHeader: false,
};
```

### 3. Database for Leaderboards (Phase 2)

Use **Supabase** or **PlanetScale**:

```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);
```

## Monitoring & Analytics

### 1. Error Tracking

**Sentry:**
```bash
npm install @sentry/nextjs @sentry/node
```

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 2. Analytics

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 3. Server Monitoring

Use **Uptime Robot** or **BetterStack** to monitor:
- Frontend: https://skillduels.com
- Backend: https://api.skillduels.com/health
- Socket.io: WSS connection checks

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting on Socket.io
- [ ] Add input validation on all endpoints
- [ ] Enable CSP headers
- [ ] Use Solana program verification
- [ ] Implement transaction replay protection
- [ ] Add wallet signature verification

### Rate Limiting

Add to `server.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

## Scaling Considerations

### Horizontal Scaling

**Socket.io Clustering:**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Redis Setup:**
```bash
# Add to Render or Railway
# Or use Upstash Redis: https://upstash.com
```

### Load Balancing

Use a load balancer in front of multiple Socket.io instances:
- Railway: Automatic load balancing
- Render: Use Teams plan
- Manual: Nginx or Cloudflare Load Balancer

## Cost Estimation

### Hobby/MVP (Under 1000 users)
- **Frontend (Vercel)**: $0 (Hobby tier)
- **Backend (Render)**: $7/month (Free tier + $7 upgrade)
- **Solana Fees**: ~$0.00025 per transaction
- **Total**: ~$7-10/month

### Growth (1K-10K users)
- **Frontend (Vercel)**: $20/month (Pro tier)
- **Backend (Render)**: $25/month (Starter)
- **Database (Supabase)**: $25/month
- **RPC (Alchemy)**: $49/month
- **CDN**: $10/month
- **Total**: ~$130/month

### Scale (10K+ users)
- **Frontend**: $150/month
- **Backend Cluster**: $200/month
- **Database**: $100/month
- **RPC**: $200/month
- **CDN**: $50/month
- **Total**: ~$700/month

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend WebSocket connections working
- [ ] Wallet connection functional
- [ ] Camera permissions working (HTTPS)
- [ ] MediaPipe loading correctly
- [ ] Socket.io real-time sync working
- [ ] Mobile responsive (if implemented)
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] Domain configured with SSL
- [ ] Environment variables set correctly
- [ ] CORS configured properly

## Rollback Procedure

### Vercel
```bash
vercel rollback
```

### Render/Railway
Use dashboard to redeploy previous version or:
```bash
git revert HEAD
git push
```

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Solana Docs**: https://docs.solana.com
- **Socket.io Docs**: https://socket.io/docs

---

**Ready to deploy?** Follow the steps above and ship your game to production! 🚀

