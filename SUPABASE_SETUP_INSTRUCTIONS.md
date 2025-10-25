# 🚀 Supabase Setup - FIXED Instructions

## The Error You Got

`ERROR: 25006: cannot execute CREATE TABLE in a read-only transaction`

This happens because Supabase might be running your SQL in the wrong mode. Here's the fix:

## ✅ Step-by-Step Setup (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `orbit-gaming`
   - Database Password: (save this!)
   - Region: Select closest to you
4. Click "Create new project"
5. ⏱️ Wait 2-3 minutes for initialization

### 2. Run the SQL Schema (IMPORTANT - Follow Exactly!)

**Option A: Using New Query (Recommended)**

1. In left sidebar, click **"SQL Editor"**
2. Click the **"New Query"** button (top right)
3. Delete any placeholder text
4. Open `supabase-schema-fixed.sql` from your project
5. Copy ALL the contents
6. Paste into the SQL editor
7. Click **"RUN"** button (bottom right) or press `Ctrl+Enter`
8. You should see: ✅ "Success. No rows returned"

**Option B: If Option A Fails**

Run each table separately:

```sql
-- Run this first
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  wallet_address VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_earned DECIMAL(10, 4) DEFAULT 0,
  avatar TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Click RUN, then run the next table:

```sql
-- Run this second
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

Click RUN, then run:

```sql
-- Run this third
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  game_mode VARCHAR(50) NOT NULL,
  wager_amount DECIMAL(10, 4) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0
);
```

### 3. Verify Tables Created

1. In left sidebar, click **"Table Editor"**
2. You should see 3 tables:
   - ✅ users
   - ✅ friendships
   - ✅ matches

If you see all 3, you're good! 🎉

### 4. Disable RLS (For Development)

By default, Supabase enables Row Level Security which will block all access. For development, let's disable it:

1. Go back to **SQL Editor**
2. Click **"New Query"**
3. Paste this:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
```

4. Click **RUN**

⚠️ **Note**: This is ONLY for development. Enable RLS before production!

### 5. Get Your API Keys

1. Click **⚙️ Project Settings** (bottom left)
2. Click **"API"** in the settings menu
3. Find these two values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc... (long string)
```

### 6. Configure Your App

1. In your project root, create `.env.local`:

```bash
# Copy these from Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Socket server
SOCKET_SERVER_URL=http://localhost:3001

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

2. Replace with YOUR actual values!

### 7. Restart Everything

```bash
# Stop any running servers (Ctrl+C)

# Start fresh
npm run dev
```

Then in a NEW terminal:

```bash
node server.js
```

### 8. Test It!

1. Open http://localhost:3000
2. Click "Get Started"
3. Connect wallet
4. Try username: `alice123`
5. Should say: ✅ "Great! This username is available"

## 🐛 Troubleshooting

### Still Getting "Username Already Taken"?

**Check 1: Tables exist?**
- Go to Table Editor
- See users, friendships, matches tables?
- If NO → re-run the SQL

**Check 2: RLS disabled?**
```sql
-- Run in SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**Check 3: API keys correct?**
- Compare `.env.local` with Supabase Project Settings → API
- No extra spaces!
- Restart dev server after changing

**Check 4: Browser console**
- Press F12
- Look for red errors
- Share error messages if stuck

### Error: "relation 'users' does not exist"

The SQL didn't run properly. Try:

1. SQL Editor → "New Query"
2. Run just this:

```sql
SELECT * FROM users;
```

If error → tables not created, re-run creation SQL
If works → tables exist, check API keys

### Error: "new row violates row-level security"

RLS is still enabled:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
```

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] 3 tables visible in Table Editor
- [ ] RLS disabled for all tables
- [ ] API keys in `.env.local`
- [ ] Dev server restarted
- [ ] Can create username without error

## 🆘 Still Stuck?

Share this info:

1. Screenshot of Table Editor (showing tables)
2. Browser console errors (F12)
3. Terminal errors from `npm run dev`

---

**Once working, you'll have:**
- ✅ Username uniqueness checks
- ✅ User authentication
- ✅ Friends system ready
- ✅ Match history tracking
- ✅ All data persisted in cloud database

Let's get this working! 🚀

