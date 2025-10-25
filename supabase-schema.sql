-- Orbit Database Schema
-- Run this in your Supabase SQL Editor

-- Users Table
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

-- Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  player1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES users(id),
  game_mode VARCHAR(50) NOT NULL,
  wager_amount DECIMAL(10, 4) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'waiting',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_matches_room ON matches(room_code);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

-- RLS Policies for friendships table
CREATE POLICY "Friendships are viewable by involved users" ON friendships FOR SELECT USING (true);
CREATE POLICY "Users can create friendships" ON friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update friendships" ON friendships FOR UPDATE USING (true);
CREATE POLICY "Users can delete friendships" ON friendships FOR DELETE USING (true);

-- RLS Policies for matches table
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Users can create matches" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update matches" ON matches FOR UPDATE USING (true);

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  username VARCHAR,
  total_matches INTEGER,
  wins INTEGER,
  losses INTEGER,
  win_rate DECIMAL,
  total_earned DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.username,
    u.total_matches,
    u.wins,
    u.losses,
    CASE 
      WHEN u.total_matches > 0 THEN ROUND((u.wins::DECIMAL / u.total_matches::DECIMAL) * 100, 2)
      ELSE 0
    END as win_rate,
    u.total_earned
  FROM users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  username VARCHAR,
  wins INTEGER,
  total_matches INTEGER,
  win_rate DECIMAL,
  total_earned DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY u.wins DESC, u.total_earned DESC) as rank,
    u.username,
    u.wins,
    u.total_matches,
    CASE 
      WHEN u.total_matches > 0 THEN ROUND((u.wins::DECIMAL / u.total_matches::DECIMAL) * 100, 2)
      ELSE 0
    END as win_rate,
    u.total_earned
  FROM users u
  WHERE u.total_matches > 0
  ORDER BY u.wins DESC, u.total_earned DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

