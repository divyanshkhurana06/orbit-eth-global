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
        scores: {},
        readyPlayers: new Set(),
        currentRound: 1,
        targetItem: null
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
  });

  // Player ready
  socket.on('player-ready', ({ roomCode, username }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.readyPlayers.add(socket.id);
    console.log(`${username} (${socket.id}) is ready in ${roomCode}`);

    // Broadcast to ENTIRE room including sender
    io.to(roomCode).emit('player-ready', {
      username,
      socketId: socket.id
    });

    // Check if both players are ready
    if (room.readyPlayers.size === 2) {
      room.gameState = 'ready';
      io.to(roomCode).emit('both-ready', {
        players: room.players
      });
      console.log(`Room ${roomCode} - both players ready!`);
    }
  });

  // Game mode selection
  socket.on('select-game-mode', ({ roomCode, gameMode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameMode = gameMode;
    console.log(`Game mode ${gameMode} selected in ${roomCode}`);
    
    // Broadcast to room
    io.to(roomCode).emit('game-mode-selected', {
      gameMode
    });
  });

  // Start game
  socket.on('start-game', ({ roomCode, targetItem, gameMode }) => {
    const room = rooms.get(roomCode);
    if (room && room.readyPlayers.size === 2) {
      room.gameState = 'playing';
      room.targetItem = targetItem;
      room.gameMode = gameMode || 'object-hunt';
      io.to(roomCode).emit('game-started', { targetItem, gameMode: room.gameMode });
      console.log(`Game started in ${roomCode} - Mode: ${room.gameMode}, Item: ${targetItem}`);
    }
  });

  // Object found
  socket.on('found-object', ({ roomCode, time }) => {
    socket.to(roomCode).emit('opponent-found-object', { time });
    console.log(`Player found object in ${time}ms`);
  });

  // Rock Paper Scissors choice
  socket.on('rps-choice', ({ roomCode, choice }) => {
    console.log(`RPS choice in ${roomCode}: ${choice}`);
    socket.to(roomCode).emit('rps-opponent-choice', { choice });
  });

  // Reflex game time
  socket.on('reflex-time', ({ roomCode, time }) => {
    console.log(`Reflex time in ${roomCode}: ${time}ms`);
    socket.to(roomCode).emit('reflex-opponent-time', { time });
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
  socket.on('round-winner', ({ roomCode, winnerId, times }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Increment winner's score
    if (winnerId && room.scores[winnerId] !== undefined) {
      room.scores[winnerId]++;
    }

    // Broadcast score update
    io.to(roomCode).emit('score-update', {
      scores: room.scores
    });

    console.log(`Round ${room.currentRound} complete. Scores:`, room.scores);

    // Check if match is complete (best of 3)
    const maxScore = Math.max(...Object.values(room.scores));
    const matchComplete = maxScore >= 2;

    if (matchComplete) {
      room.gameState = 'finished';
      io.to(roomCode).emit('round-complete', {
        scores: room.scores,
        matchComplete: true
      });
      console.log(`Match complete in ${roomCode}`);
    } else {
      // Next round
      room.currentRound++;
      room.readyPlayers.clear();
      room.gameState = 'ready_room';
      
      io.to(roomCode).emit('round-complete', {
        scores: room.scores,
        nextRound: room.currentRound,
        matchComplete: false
      });
      console.log(`Starting round ${room.currentRound} in ${roomCode}`);
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

