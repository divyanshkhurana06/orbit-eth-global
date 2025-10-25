import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface User {
  id: string;
  username: string;
  wallet_address: string;
  created_at: string;
  total_matches: number;
  wins: number;
  losses: number;
  total_earned: number;
  avatar?: string;
  status?: 'online' | 'offline' | 'in-game';
  last_seen?: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface Match {
  id: string;
  room_code: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  game_mode: string;
  wager_amount: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  player1_score: number;
  player2_score: number;
}

// User Operations
export const userOperations = {
  // Check if username is available
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    // Username is available if no data found (returns null)
    // If there's an error other than "not found", log it
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking username:', error);
    }
    
    return data === null;
  },

  // Create new user
  async createUser(username: string, walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          wallet_address: walletAddress,
          total_matches: 0,
          wins: 0,
          losses: 0,
          total_earned: 0,
          status: 'online'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data;
  },

  // Get user by wallet address
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  },

  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  // Update user status
  async updateUserStatus(userId: string, status: 'online' | 'offline' | 'in-game'): Promise<void> {
    await supabase
      .from('users')
      .update({ status, last_seen: new Date().toISOString() })
      .eq('id', userId);
  },

  // Update user stats after match
  async updateUserStats(userId: string, won: boolean, earnedAmount: number): Promise<void> {
    const { data: user } = await supabase
      .from('users')
      .select('total_matches, wins, losses, total_earned')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          total_matches: user.total_matches + 1,
          wins: won ? user.wins + 1 : user.wins,
          losses: won ? user.losses : user.losses + 1,
          total_earned: user.total_earned + earnedAmount
        })
        .eq('id', userId);
    }
  }
};

// Friends Operations
export const friendOperations = {
  // Send friend request
  async sendFriendRequest(userId: string, friendUsername: string): Promise<boolean> {
    const friend = await userOperations.getUserByUsername(friendUsername);
    if (!friend) return false;

    const { error } = await supabase
      .from('friendships')
      .insert([
        {
          user_id: userId,
          friend_id: friend.id,
          status: 'pending'
        }
      ]);

    return !error;
  },

  // Accept friend request
  async acceptFriendRequest(friendshipId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    return !error;
  },

  // Get user's friends
  async getFriends(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        friend:users!friendships_friend_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error || !data) return [];

    return data.map((item: any) => item.friend);
  },

  // Get pending friend requests
  async getPendingRequests(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user:users!friendships_user_id_fkey(*)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error || !data) return [];

    return data;
  },

  // Remove friend
  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    return !error;
  }
};

// Match Operations
export const matchOperations = {
  // Create new match
  async createMatch(roomCode: string, player1Id: string, gameMode: string, wagerAmount: number): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          room_code: roomCode,
          player1_id: player1Id,
          game_mode: gameMode,
          wager_amount: wagerAmount,
          status: 'waiting',
          player1_score: 0,
          player2_score: 0
        }
      ])
      .select()
      .single();

    if (error) return null;
    return data;
  },

  // Join match
  async joinMatch(roomCode: string, player2Id: string): Promise<boolean> {
    const { error } = await supabase
      .from('matches')
      .update({
        player2_id: player2Id,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('room_code', roomCode)
      .eq('status', 'waiting');

    return !error;
  },

  // Complete match
  async completeMatch(roomCode: string, winnerId: string, player1Score: number, player2Score: number): Promise<boolean> {
    const { error } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        player1_score: player1Score,
        player2_score: player2Score,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('room_code', roomCode);

    return !error;
  }
};

