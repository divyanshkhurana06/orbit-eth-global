const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active rooms
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create or join room
  socket.on('join-room', ({ roomCode, username, isHost }) => {
    socket.join(roomCode);
    
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        players: [],
        gameState: 'waiting',
        scores: {}
      });
    }

    const room = rooms.get(roomCode);
    const playerInfo = {
      id: socket.id,
      username,
      isHost
    };

    room.players.push(playerInfo);
    room.scores[socket.id] = 0;

    console.log(`${username} joined room ${roomCode}`);

    // Notify room
    io.to(roomCode).emit('player-joined', {
      player: playerInfo,
      players: room.players,
      totalPlayers: room.players.length
    });

    // If 2 players, start game
    if (room.players.length === 2) {
      room.gameState = 'ready';
      io.to(roomCode).emit('room-ready', {
        players: room.players
      });
    }
  });

  // Start game
  socket.on('start-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.gameState = 'playing';
      io.to(roomCode).emit('game-started');
    }
  });

  // Update game state
  socket.on('game-update', ({ roomCode, type, data }) => {
    socket.to(roomCode).emit('opponent-update', { type, data });
  });

  // Hand raised
  socket.on('hand-raised', ({ roomCode, reactionTime }) => {
    const room = rooms.get(roomCode);
    if (room) {
      socket.to(roomCode).emit('opponent-hand-raised', { reactionTime });
    }
  });

  // Round winner
  socket.on('round-winner', ({ roomCode, winnerId }) => {
    const room = rooms.get(roomCode);
    if (room && room.scores[winnerId] !== undefined) {
      room.scores[winnerId]++;
      io.to(roomCode).emit('score-update', {
        scores: room.scores
      });
    }
  });

  // Send emoji
  socket.on('send-emoji', ({ roomCode, emoji, username }) => {
    socket.to(roomCode).emit('emoji-received', { emoji, username });
  });

  // Game end
  socket.on('game-end', ({ roomCode, winnerId }) => {
    const room = rooms.get(roomCode);
    if (room) {
      const winner = room.players.find(p => p.id === winnerId);
      io.to(roomCode).emit('game-finished', {
        winner,
        scores: room.scores
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove player from all rooms
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        delete room.scores[socket.id];
        
        io.to(roomCode).emit('player-left', {
          playerId: socket.id,
          players: room.players
        });

        // Clean up empty rooms
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🎮 SkillDuels Server running on port ${PORT}`);
});

