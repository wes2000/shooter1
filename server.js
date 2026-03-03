const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========================
// PUBLIC GAME REGISTRY
// ========================
const games = new Map();
const STALE_TIMEOUT = 30000; // 30s without heartbeat = stale

// Cleanup stale games every 10s
setInterval(() => {
  const now = Date.now();
  for (const [code, game] of games) {
    if (now - game.lastHeartbeat > STALE_TIMEOUT) {
      games.delete(code);
    }
  }
}, 10000);

// List all public games
app.get('/api/games', (req, res) => {
  const list = [];
  for (const [code, game] of games) {
    list.push({
      code,
      hostName: game.hostName,
      playerCount: game.playerCount,
      maxPlayers: game.maxPlayers,
      status: game.status,
      createdAt: game.createdAt,
    });
  }
  res.json(list);
});

// Register a public game
app.post('/api/games', (req, res) => {
  const { code, hostName, playerCount, maxPlayers } = req.body;
  if (!code || !hostName) return res.status(400).json({ error: 'Missing code or hostName' });
  games.set(code, {
    hostName: String(hostName).slice(0, 16),
    playerCount: playerCount || 1,
    maxPlayers: maxPlayers || 10,
    status: 'lobby',
    createdAt: Date.now(),
    lastHeartbeat: Date.now(),
  });
  res.json({ ok: true });
});

// Update a public game
app.patch('/api/games/:code', (req, res) => {
  const game = games.get(req.params.code);
  if (!game) return res.status(404).json({ error: 'Not found' });
  if (req.body.playerCount !== undefined) game.playerCount = req.body.playerCount;
  if (req.body.status) game.status = req.body.status;
  game.lastHeartbeat = Date.now();
  res.json({ ok: true });
});

// Heartbeat
app.post('/api/games/:code/heartbeat', (req, res) => {
  const game = games.get(req.params.code);
  if (!game) return res.status(404).json({ error: 'Not found' });
  game.lastHeartbeat = Date.now();
  res.json({ ok: true });
});

// Remove a public game
app.delete('/api/games/:code', (req, res) => {
  games.delete(req.params.code);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
