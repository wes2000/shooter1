const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game constants
const TICK_RATE = 60;
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;
const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 4;
const BULLET_SPEED = 12;
const BULLET_RADIUS = 4;
const BULLET_LIFETIME = 1500; // ms
const MAX_HP = 100;
const BULLET_DAMAGE = 20;
const SHOOT_COOLDOWN = 150; // ms
const RESPAWN_TIME = 3000; // ms

// Lobbies: { id: { name, host, players: { socketId: { name, ready } }, inGame, gameState } }
const lobbies = {};
let lobbyIdCounter = 1;

function generateColor() {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e67e22', '#00cec9',
    '#fd79a8', '#6c5ce7', '#fab1a0', '#55efc4'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createGameState(lobby) {
  const state = {
    players: {},
    bullets: [],
    bulletIdCounter: 0,
  };

  const playerIds = Object.keys(lobby.players);
  playerIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / playerIds.length;
    const spawnRadius = 300;
    state.players[id] = {
      x: MAP_WIDTH / 2 + Math.cos(angle) * spawnRadius,
      y: MAP_HEIGHT / 2 + Math.sin(angle) * spawnRadius,
      angle: 0,
      hp: MAX_HP,
      alive: true,
      name: lobby.players[id].name,
      color: generateColor(),
      kills: 0,
      deaths: 0,
      input: { up: false, down: false, left: false, right: false },
      shooting: false,
      lastShotTime: 0,
      respawnTimer: 0,
    };
  });

  return state;
}

function respawnPlayer(player) {
  player.x = 100 + Math.random() * (MAP_WIDTH - 200);
  player.y = 100 + Math.random() * (MAP_HEIGHT - 200);
  player.hp = MAX_HP;
  player.alive = true;
  player.respawnTimer = 0;
}

function updateGame(lobby) {
  const state = lobby.gameState;
  const now = Date.now();

  // Update players
  for (const id in state.players) {
    const p = state.players[id];

    if (!p.alive) {
      if (p.respawnTimer && now >= p.respawnTimer) {
        respawnPlayer(p);
      }
      continue;
    }

    // Movement
    let dx = 0, dy = 0;
    if (p.input.up) dy -= 1;
    if (p.input.down) dy += 1;
    if (p.input.left) dx -= 1;
    if (p.input.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / len) * PLAYER_SPEED;
      dy = (dy / len) * PLAYER_SPEED;
      p.x = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, p.x + dx));
      p.y = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, p.y + dy));
    }

    // Shooting
    if (p.shooting && now - p.lastShotTime >= SHOOT_COOLDOWN) {
      p.lastShotTime = now;
      state.bullets.push({
        id: state.bulletIdCounter++,
        ownerId: id,
        x: p.x + Math.cos(p.angle) * (PLAYER_RADIUS + 8),
        y: p.y + Math.sin(p.angle) * (PLAYER_RADIUS + 8),
        vx: Math.cos(p.angle) * BULLET_SPEED,
        vy: Math.sin(p.angle) * BULLET_SPEED,
        createdAt: now,
      });
    }
  }

  // Update bullets
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // Remove if out of bounds or expired
    if (b.x < 0 || b.x > MAP_WIDTH || b.y < 0 || b.y > MAP_HEIGHT || now - b.createdAt > BULLET_LIFETIME) {
      state.bullets.splice(i, 1);
      continue;
    }

    // Check collisions with players
    for (const id in state.players) {
      if (id === b.ownerId) continue;
      const p = state.players[id];
      if (!p.alive) continue;

      const dx = p.x - b.x;
      const dy = p.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < PLAYER_RADIUS + BULLET_RADIUS) {
        p.hp -= BULLET_DAMAGE;
        state.bullets.splice(i, 1);

        if (p.hp <= 0) {
          p.alive = false;
          p.deaths++;
          p.respawnTimer = now + RESPAWN_TIME;

          if (state.players[b.ownerId]) {
            state.players[b.ownerId].kills++;
          }
        }
        break;
      }
    }
  }
}

function getGameSnapshot(state) {
  const players = {};
  for (const id in state.players) {
    const p = state.players[id];
    players[id] = {
      x: p.x, y: p.y, angle: p.angle,
      hp: p.hp, alive: p.alive,
      name: p.name, color: p.color,
      kills: p.kills, deaths: p.deaths,
    };
  }
  return {
    players,
    bullets: state.bullets.map(b => ({ id: b.id, x: b.x, y: b.y, ownerId: b.ownerId })),
  };
}

function getLobbyList() {
  return Object.values(lobbies).map(l => ({
    id: l.id,
    name: l.name,
    playerCount: Object.keys(l.players).length,
    inGame: l.inGame,
  }));
}

function broadcastLobbyList() {
  io.emit('lobbyList', getLobbyList());
}

function broadcastLobbyState(lobby) {
  const players = {};
  for (const id in lobby.players) {
    players[id] = { name: lobby.players[id].name, ready: lobby.players[id].ready };
  }
  for (const id in lobby.players) {
    io.to(id).emit('lobbyState', { id: lobby.id, name: lobby.name, host: lobby.host, players, yourId: id });
  }
}

io.on('connection', (socket) => {
  let currentLobby = null;
  let playerName = 'Player';

  socket.emit('lobbyList', getLobbyList());

  socket.on('setName', (name) => {
    playerName = String(name).slice(0, 16) || 'Player';
  });

  socket.on('createLobby', (lobbyName) => {
    if (currentLobby) return;
    const id = lobbyIdCounter++;
    const name = String(lobbyName).slice(0, 24) || `Lobby ${id}`;
    lobbies[id] = {
      id,
      name,
      host: socket.id,
      players: { [socket.id]: { name: playerName, ready: false } },
      inGame: false,
      gameState: null,
      gameLoop: null,
    };
    currentLobby = lobbies[id];
    broadcastLobbyState(currentLobby);
    broadcastLobbyList();
  });

  socket.on('joinLobby', (lobbyId) => {
    if (currentLobby) return;
    const lobby = lobbies[lobbyId];
    if (!lobby || lobby.inGame) return;
    if (Object.keys(lobby.players).length >= 8) return;
    lobby.players[socket.id] = { name: playerName, ready: false };
    currentLobby = lobby;
    broadcastLobbyState(lobby);
    broadcastLobbyList();
  });

  socket.on('toggleReady', () => {
    if (!currentLobby || currentLobby.inGame) return;
    const p = currentLobby.players[socket.id];
    if (p) {
      p.ready = !p.ready;
      broadcastLobbyState(currentLobby);
    }
  });

  socket.on('startGame', () => {
    if (!currentLobby) return;
    if (currentLobby.host !== socket.id) return;
    if (Object.keys(currentLobby.players).length < 1) return;

    currentLobby.inGame = true;
    currentLobby.gameState = createGameState(currentLobby);

    // Notify all players
    for (const pid in currentLobby.players) {
      io.to(pid).emit('gameStarted', { yourId: pid });
    }

    // Start game loop
    const lobby = currentLobby;
    lobby.gameLoop = setInterval(() => {
      updateGame(lobby);
      const snapshot = getGameSnapshot(lobby.gameState);
      for (const pid in lobby.players) {
        io.to(pid).emit('gameState', snapshot);
      }
    }, 1000 / TICK_RATE);

    broadcastLobbyList();
  });

  socket.on('playerInput', (input) => {
    if (!currentLobby || !currentLobby.inGame || !currentLobby.gameState) return;
    const p = currentLobby.gameState.players[socket.id];
    if (!p) return;
    if (input.keys) {
      p.input.up = !!input.keys.up;
      p.input.down = !!input.keys.down;
      p.input.left = !!input.keys.left;
      p.input.right = !!input.keys.right;
    }
    if (typeof input.angle === 'number') {
      p.angle = input.angle;
    }
    if (typeof input.shooting === 'boolean') {
      p.shooting = input.shooting;
    }
  });

  socket.on('leaveLobby', () => {
    leaveLobby(socket);
  });

  socket.on('disconnect', () => {
    leaveLobby(socket);
  });

  function leaveLobby(sock) {
    if (!currentLobby) return;
    const lobby = currentLobby;
    currentLobby = null;

    delete lobby.players[sock.id];

    if (lobby.gameState && lobby.gameState.players[sock.id]) {
      delete lobby.gameState.players[sock.id];
    }

    const remaining = Object.keys(lobby.players);
    if (remaining.length === 0) {
      // Destroy lobby
      if (lobby.gameLoop) clearInterval(lobby.gameLoop);
      delete lobbies[lobby.id];
    } else {
      // Transfer host if needed
      if (lobby.host === sock.id) {
        lobby.host = remaining[0];
      }
      broadcastLobbyState(lobby);
    }
    broadcastLobbyList();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
