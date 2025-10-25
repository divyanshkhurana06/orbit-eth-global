# 🗄️ Supabase Database Setup Guide

## Quick Setup (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: orbit-gaming
   - **Database Password**: (generate a strong one)
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

### 2. Run Database Schema

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your project
4. Paste into the SQL editor
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned"

### 3. Get API Keys

1. Click "Project Settings" (gear icon) in the left sidebar
2. Click "API" in the settings menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 4. Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Add your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Socket.io Server
SOCKET_SERVER_URL=http://localhost:3001

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

3. Replace `your-project-id` and `your-anon-key-here` with your actual values
4. **Important**: Never commit `.env.local` to git (it's already in .gitignore)

### 5. Verify Setup

Run this test:

```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. Click "Get Started"
3. Connect your wallet (Phantom)
4. Try creating a username
5. If it says "Great! This username is available" → ✅ Working!

## Troubleshooting

### Problem: "This username is already taken" for everything

**Cause**: Database not set up or wrong API keys

**Fix**:
1. Make sure you ran the SQL schema (step 2 above)
2. Verify your `.env.local` has correct values
3. Restart your dev server: `npm run dev`

### Problem: "Error checking username"

**Cause**: Database tables don't exist

**Fix**:
1. Go to Supabase SQL Editor
2. Re-run the `supabase-schema.sql` file
3. Check for any errors in the SQL execution

### Problem: Can't connect to Supabase

**Cause**: API keys incorrect or project not fully initialized

**Fix**:
1. Wait 5 minutes for Supabase project to fully initialize
2. Double-check Project URL and anon key
3. Make sure there are no extra spaces in `.env.local`

### Problem: "Row Level Security" errors

**Cause**: RLS policies not applied

**Fix**:
The SQL schema includes RLS policies. If you still get errors:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
```

Note: This disables security - only for development!

## Database Structure

### Tables Created:

#### `users`
- Stores user accounts
- Unique username and wallet address
- Tracks stats (matches, wins, losses, earnings)
- Status (online/offline/in-game)

#### `friendships`
- Connects users as friends
- Status: pending/accepted/blocked
- Bidirectional relationships

#### `matches`
- Stores game history
- Links players and winners
- Tracks scores and wager amounts

### Viewing Your Data

1. In Supabase, click "Table Editor"
2. Select a table (users, friendships, matches)
3. See all data in spreadsheet format
4. Can manually edit/delete rows

## Testing the Database

### Create Test User Manually

1. Go to Table Editor → users
2. Click "Insert row"
3. Fill in:
   - username: `testuser`
   - wallet_address: `test123`
   - Leave other fields default
4. Click "Save"

Now try logging in with a different username - it should work!

### Check Username Availability

Open browser console (F12) and run:

```javascript
// Should return true for available usernames
const available = await fetch('/api/check-username?username=newuser')
console.log(await available.json())
```

## Advanced: Supabase Features

### Real-time Updates (Optional)

Enable real-time for friends list:

```typescript
const subscription = supabase
  .channel('friends-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'friendships' },
    (payload) => {
      console.log('Friend status changed:', payload)
      // Refresh friends list
    }
  )
  .subscribe()
```

### Functions & Triggers

The schema includes SQL functions:
- `get_user_stats(user_id)` - Get formatted stats
- `get_leaderboard(limit)` - Top players

Use them like:

```typescript
const { data } = await supabase.rpc('get_leaderboard', { limit_count: 10 })
```

## Production Checklist

Before going live:

- [ ] Enable Row Level Security (RLS)
- [ ] Set up proper RLS policies
- [ ] Enable database backups
- [ ] Set up monitoring/alerts
- [ ] Use environment-specific projects (dev/prod)
- [ ] Enable 2FA on Supabase account
- [ ] Review and limit API access

## Costs

Supabase Free Tier includes:
- ✅ 500MB database
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

Perfect for getting started! 🚀

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Check browser console for errors (F12)

---

**Once setup is complete, you'll have:**
✅ Working user registration
✅ Username uniqueness checks
✅ Friends system
✅ Match history tracking
✅ All data persisted in Supabase

