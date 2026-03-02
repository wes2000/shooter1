// ========================
// CONSTANTS
// ========================
const MAP_W = 2000, MAP_H = 2000;
const PLAYER_R = 18, PLAYER_SPEED = 4;
const BULLET_R = 4, BULLET_SPEED = 12, BULLET_LIFETIME = 1500, BULLET_DMG = 20;
const SHOOT_CD = 150, MAX_HP = 100, RESPAWN_TIME = 3000;
const TICK_RATE = 60;
const COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#00cec9','#fd79a8','#6c5ce7'];

// ========================
// DOM REFERENCES
// ========================
const $ = (id) => document.getElementById(id);
const screens = { start: $('startScreen'), join: $('joinScreen'), room: $('roomScreen'), game: $('gameScreen') };
const nameInput = $('nameInput');
const codeInput = $('codeInput');
const roomCodeEl = $('roomCode');
const playerListEl = $('playerList');
const joinStatus = $('joinStatus');
const roomStatus = $('roomStatus');
const canvas = $('gameCanvas');
const ctx = canvas.getContext('2d');
const mmCanvas = $('minimap');
const mmCtx = mmCanvas.getContext('2d');
const healthFill = $('healthFill');
const scoreboardEl = $('scoreboard');
const deathOverlay = $('deathOverlay');

// ========================
// STATE
// ========================
let myName = 'Player';
let myPlayerId = null;
let isHost = false;
let roomCode = '';
let peer = null;
let currentScreen = 'start';

// Host state
let hostConns = {};        // playerId -> PeerJS DataConnection
let lobbyPlayers = {};     // playerId -> { name, ready }
let nextPlayerId = 1;
let gameState = null;
let gameLoopInterval = null;

// Client state
let hostConn = null;

// Shared
let snapshot = null;       // latest rendered game state
let keys = { up: false, down: false, left: false, right: false };
let mouseX = 0, mouseY = 0, mouseDown = false;
let camera = { x: 0, y: 0 };
let inputInterval = null;
let gameRunning = false;

// ========================
// HELPERS
// ========================
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function showScreen(name) {
  for (const k in screens) screens[k].classList.remove('active');
  screens[name].classList.add('active');
  currentScreen = name;
}

function setStatus(el, msg, isError) {
  el.textContent = msg;
  el.className = 'status-msg' + (isError ? ' error' : '');
}

// ========================
// PEER SETUP
// ========================
const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }
};

// ========================
// HOST: CREATE ROOM
// ========================
function createRoom() {
  roomCode = generateRoomCode();
  const peerId = 'shooter1-' + roomCode;

  peer = new Peer(peerId, PEER_CONFIG);

  peer.on('open', () => {
    isHost = true;
    myPlayerId = '0';
    lobbyPlayers = { '0': { name: myName, ready: true } };
    roomCodeEl.textContent = roomCode;
    $('startGameBtn').style.display = 'inline-block';
    updateRoomDisplay();
    showScreen('room');
    setStatus(roomStatus, '');
  });

  peer.on('connection', (conn) => {
    let pid = null;

    conn.on('data', (data) => {
      if (!data || !data.type) return;

      if (data.type === 'join' && !pid) {
        pid = String(nextPlayerId++);
        lobbyPlayers[pid] = { name: String(data.name).slice(0, 16) || 'Player', ready: false };
        hostConns[pid] = conn;
        conn.send({ type: 'joined', yourId: pid });
        broadcastLobbyState();
        updateRoomDisplay();
      }

      if (data.type === 'ready' && pid && lobbyPlayers[pid]) {
        lobbyPlayers[pid].ready = !lobbyPlayers[pid].ready;
        broadcastLobbyState();
        updateRoomDisplay();
      }

      if (data.type === 'input' && pid && gameState && gameState.players[pid]) {
        const p = gameState.players[pid];
        if (data.keys) {
          p.input.up = !!data.keys.up;
          p.input.down = !!data.keys.down;
          p.input.left = !!data.keys.left;
          p.input.right = !!data.keys.right;
        }
        if (typeof data.angle === 'number') p.angle = data.angle;
        if (typeof data.shooting === 'boolean') p.shooting = data.shooting;
      }
    });

    conn.on('close', () => {
      if (pid) {
        delete lobbyPlayers[pid];
        delete hostConns[pid];
        if (gameState && gameState.players[pid]) delete gameState.players[pid];
        broadcastLobbyState();
        updateRoomDisplay();
      }
    });
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      peer.destroy();
      createRoom(); // retry with different code
    } else {
      setStatus(roomStatus, 'Error: ' + err.message, true);
    }
  });
}

function broadcastLobbyState() {
  const state = { type: 'lobbyState', roomCode, players: {}, hostId: '0' };
  for (const [id, p] of Object.entries(lobbyPlayers)) {
    state.players[id] = { name: p.name, ready: p.ready, isHost: id === '0' };
  }
  for (const conn of Object.values(hostConns)) {
    try { conn.send(state); } catch(e) {}
  }
}

// ========================
// CLIENT: JOIN ROOM
// ========================
function joinRoom(code) {
  code = code.toUpperCase().trim();
  if (code.length !== 4) {
    setStatus(joinStatus, 'Enter a 4-letter code', true);
    return;
  }

  setStatus(joinStatus, 'Connecting...');
  $('connectBtn').disabled = true;

  peer = new Peer(undefined, PEER_CONFIG);

  peer.on('open', () => {
    hostConn = peer.connect('shooter1-' + code, { reliable: true });

    hostConn.on('open', () => {
      hostConn.send({ type: 'join', name: myName });
    });

    hostConn.on('data', (data) => {
      if (!data || !data.type) return;

      if (data.type === 'joined') {
        myPlayerId = data.yourId;
        roomCode = code;
        roomCodeEl.textContent = code;
        $('startGameBtn').style.display = 'none';
        showScreen('room');
      }

      if (data.type === 'lobbyState') {
        lobbyPlayers = {};
        for (const [id, p] of Object.entries(data.players)) {
          lobbyPlayers[id] = p;
        }
        updateRoomDisplay();
      }

      if (data.type === 'gameStarted') {
        startGameClient();
      }

      if (data.type === 'state') {
        snapshot = { players: data.players, bullets: data.bullets };
      }
    });

    hostConn.on('close', () => {
      if (gameRunning || currentScreen === 'room') {
        cleanupGame();
        showScreen('start');
        alert('Host disconnected');
      }
    });

    hostConn.on('error', () => {
      setStatus(joinStatus, 'Connection lost', true);
    });
  });

  peer.on('error', (err) => {
    $('connectBtn').disabled = false;
    if (err.type === 'peer-unavailable') {
      setStatus(joinStatus, 'Room not found', true);
    } else {
      setStatus(joinStatus, 'Error: ' + err.message, true);
    }
  });
}

// ========================
// LOBBY DISPLAY
// ========================
function updateRoomDisplay() {
  playerListEl.innerHTML = Object.entries(lobbyPlayers).map(([id, p]) => `
    <div class="player-entry">
      <span>
        <span class="pname">${escapeHtml(p.name)}</span>
        ${(p.isHost || id === '0') ? '<span class="host-tag">HOST</span>' : ''}
      </span>
      <span class="ready-tag ${p.ready ? 'yes' : 'no'}">${p.ready ? 'Ready' : 'Not Ready'}</span>
    </div>
  `).join('');
}

// ========================
// GAME SIMULATION (Host only)
// ========================
function createGameState() {
  const state = { players: {}, bullets: [], bulletIdCounter: 0 };
  const ids = Object.keys(lobbyPlayers);
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / ids.length;
    state.players[id] = {
      x: MAP_W / 2 + Math.cos(angle) * 300,
      y: MAP_H / 2 + Math.sin(angle) * 300,
      angle: 0, hp: MAX_HP, alive: true,
      name: lobbyPlayers[id].name,
      color: COLORS[i % COLORS.length],
      kills: 0, deaths: 0,
      input: { up: false, down: false, left: false, right: false },
      shooting: false, lastShotTime: 0, respawnTimer: 0,
    };
  });
  return state;
}

function updateGame() {
  const now = Date.now();
  for (const id in gameState.players) {
    const p = gameState.players[id];
    if (!p.alive) {
      if (p.respawnTimer && now >= p.respawnTimer) {
        p.x = 100 + Math.random() * (MAP_W - 200);
        p.y = 100 + Math.random() * (MAP_H - 200);
        p.hp = MAX_HP; p.alive = true; p.respawnTimer = 0;
      }
      continue;
    }

    let dx = 0, dy = 0;
    if (p.input.up) dy -= 1;
    if (p.input.down) dy += 1;
    if (p.input.left) dx -= 1;
    if (p.input.right) dx += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / len) * PLAYER_SPEED;
      dy = (dy / len) * PLAYER_SPEED;
      p.x = Math.max(PLAYER_R, Math.min(MAP_W - PLAYER_R, p.x + dx));
      p.y = Math.max(PLAYER_R, Math.min(MAP_H - PLAYER_R, p.y + dy));
    }

    if (p.shooting && now - p.lastShotTime >= SHOOT_CD) {
      p.lastShotTime = now;
      gameState.bullets.push({
        id: gameState.bulletIdCounter++,
        ownerId: id,
        x: p.x + Math.cos(p.angle) * (PLAYER_R + 8),
        y: p.y + Math.sin(p.angle) * (PLAYER_R + 8),
        vx: Math.cos(p.angle) * BULLET_SPEED,
        vy: Math.sin(p.angle) * BULLET_SPEED,
        createdAt: now,
      });
    }
  }

  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const b = gameState.bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < 0 || b.x > MAP_W || b.y < 0 || b.y > MAP_H || now - b.createdAt > BULLET_LIFETIME) {
      gameState.bullets.splice(i, 1);
      continue;
    }
    for (const id in gameState.players) {
      if (id === b.ownerId) continue;
      const p = gameState.players[id];
      if (!p.alive) continue;
      const ddx = p.x - b.x, ddy = p.y - b.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < PLAYER_R + BULLET_R) {
        p.hp -= BULLET_DMG;
        gameState.bullets.splice(i, 1);
        if (p.hp <= 0) {
          p.alive = false;
          p.deaths++;
          p.respawnTimer = now + RESPAWN_TIME;
          if (gameState.players[b.ownerId]) gameState.players[b.ownerId].kills++;
        }
        break;
      }
    }
  }
}

function getSnapshot() {
  const players = {};
  for (const [id, p] of Object.entries(gameState.players)) {
    players[id] = {
      x: p.x, y: p.y, angle: p.angle,
      hp: p.hp, alive: p.alive,
      name: p.name, color: p.color,
      kills: p.kills, deaths: p.deaths,
    };
  }
  return {
    players,
    bullets: gameState.bullets.map(b => ({ id: b.id, x: b.x, y: b.y, ownerId: b.ownerId })),
  };
}

// ========================
// GAME START / STOP
// ========================
function startGameHost() {
  gameState = createGameState();
  gameRunning = true;

  // Notify all clients
  for (const [pid, conn] of Object.entries(hostConns)) {
    try { conn.send({ type: 'gameStarted' }); } catch(e) {}
  }

  // Game simulation loop
  gameLoopInterval = setInterval(() => {
    // Host's own input
    const me = gameState.players['0'];
    if (me) {
      me.input = { ...keys };
      me.angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
      me.shooting = mouseDown;
    }

    updateGame();
    snapshot = getSnapshot();

    // Broadcast to clients
    const msg = { type: 'state', ...snapshot };
    for (const conn of Object.values(hostConns)) {
      try { conn.send(msg); } catch(e) {}
    }
  }, 1000 / TICK_RATE);

  showScreen('game');
  resizeCanvas();
  requestAnimationFrame(renderLoop);
}

function startGameClient() {
  gameRunning = true;

  // Send input to host
  inputInterval = setInterval(() => {
    if (!hostConn || !hostConn.open) return;
    hostConn.send({
      type: 'input',
      keys: { ...keys },
      angle: Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2),
      shooting: mouseDown,
    });
  }, 1000 / TICK_RATE);

  showScreen('game');
  resizeCanvas();
  requestAnimationFrame(renderLoop);
}

function cleanupGame() {
  gameRunning = false;
  if (gameLoopInterval) { clearInterval(gameLoopInterval); gameLoopInterval = null; }
  if (inputInterval) { clearInterval(inputInterval); inputInterval = null; }
  for (const conn of Object.values(hostConns)) { try { conn.close(); } catch(e) {} }
  if (hostConn) { try { hostConn.close(); } catch(e) {} }
  if (peer) { try { peer.destroy(); } catch(e) {} }
  hostConns = {};
  lobbyPlayers = {};
  gameState = null;
  snapshot = null;
  hostConn = null;
  peer = null;
  myPlayerId = null;
  isHost = false;
  nextPlayerId = 1;
  keys = { up: false, down: false, left: false, right: false };
  mouseDown = false;
}

// ========================
// INPUT
// ========================
window.addEventListener('keydown', (e) => {
  if (currentScreen !== 'game') return;
  switch (e.key.toLowerCase()) {
    case 'w': keys.up = true; break;
    case 's': keys.down = true; break;
    case 'a': keys.left = true; break;
    case 'd': keys.right = true; break;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.up = false; break;
    case 's': keys.down = false; break;
    case 'a': keys.left = false; break;
    case 'd': keys.right = false; break;
  }
});

window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mousedown', (e) => { if (currentScreen === 'game' && e.button === 0) mouseDown = true; });
window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });
window.addEventListener('contextmenu', (e) => { if (currentScreen === 'game') e.preventDefault(); });

// ========================
// RENDERING
// ========================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  mmCanvas.width = 140;
  mmCanvas.height = 140;
}
window.addEventListener('resize', resizeCanvas);

function renderLoop() {
  if (!gameRunning) return;
  render();
  renderMinimap();
  renderHUD();
  requestAnimationFrame(renderLoop);
}

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!snapshot) return;

  const me = snapshot.players[myPlayerId];
  if (!me) return;

  camera.x = me.x - W / 2;
  camera.y = me.y - H / 2;

  // Background
  ctx.fillStyle = '#111122';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#1a1a35';
  ctx.lineWidth = 1;
  const gs = 50;
  for (let x = -(camera.x % gs); x < W; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -(camera.y % gs); y < H; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Map border
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.strokeRect(-camera.x, -camera.y, MAP_W, MAP_H);

  // Bullets
  for (const b of snapshot.bullets) {
    const sx = b.x - camera.x, sy = b.y - camera.y;
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
    const owner = snapshot.players[b.ownerId];
    ctx.fillStyle = owner ? owner.color : '#fff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Players
  for (const [id, p] of Object.entries(snapshot.players)) {
    if (!p.alive) continue;
    const sx = p.x - camera.x, sy = p.y - camera.y;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;
    const isMe = id === myPlayerId;

    // Body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();

    if (isMe) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, PLAYER_R + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Gun barrel
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(p.angle) * (PLAYER_R + 12), sy + Math.sin(p.angle) * (PLAYER_R + 12));
    ctx.stroke();

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, sx, sy - PLAYER_R - 10);

    // Health bar (others)
    if (!isMe) {
      const bw = 36, bh = 4, bx = sx - bw / 2, by = sy - PLAYER_R - 6;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, bh);
      const pct = Math.max(0, p.hp / MAX_HP);
      ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(bx, by, bw * pct, bh);
    }
  }
}

function renderMinimap() {
  const mw = mmCanvas.width, mh = mmCanvas.height;
  mmCtx.clearRect(0, 0, mw, mh);
  mmCtx.fillStyle = 'rgba(10,10,26,0.8)';
  mmCtx.fillRect(0, 0, mw, mh);
  if (!snapshot) return;

  const sx = mw / MAP_W, sy = mh / MAP_H;
  for (const [id, p] of Object.entries(snapshot.players)) {
    if (!p.alive) continue;
    mmCtx.fillStyle = id === myPlayerId ? '#fff' : p.color;
    mmCtx.beginPath();
    mmCtx.arc(p.x * sx, p.y * sy, id === myPlayerId ? 3 : 2, 0, Math.PI * 2);
    mmCtx.fill();
  }

  mmCtx.strokeStyle = '#555';
  mmCtx.lineWidth = 1;
  mmCtx.strokeRect(camera.x * sx, camera.y * sy, canvas.width * sx, canvas.height * sy);
}

function renderHUD() {
  if (!snapshot) return;
  const me = snapshot.players[myPlayerId];
  if (!me) return;

  const pct = Math.max(0, me.hp / MAX_HP);
  healthFill.style.width = (pct * 100) + '%';
  healthFill.style.background = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
  deathOverlay.style.display = me.alive ? 'none' : 'block';

  const sorted = Object.entries(snapshot.players).sort(([,a],[,b]) => b.kills - a.kills || a.deaths - b.deaths);
  scoreboardEl.innerHTML = `<div class="sb-header">Scoreboard</div>` +
    sorted.map(([id, p]) => `
      <div class="sb-row" style="${id === myPlayerId ? 'color:#fff;font-weight:600' : ''}">
        <span class="sb-name" style="color:${p.color}">${escapeHtml(p.name)}</span>
        <span class="sb-kd">${p.kills}K / ${p.deaths}D</span>
      </div>
    `).join('');
}

// ========================
// UI EVENT LISTENERS
// ========================
$('createBtn').addEventListener('click', () => {
  myName = nameInput.value.trim() || 'Player';
  createRoom();
});

$('joinBtn').addEventListener('click', () => {
  myName = nameInput.value.trim() || 'Player';
  setStatus(joinStatus, '');
  $('connectBtn').disabled = false;
  showScreen('join');
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('createBtn').click();
});

$('connectBtn').addEventListener('click', () => {
  joinRoom(codeInput.value);
});

codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('connectBtn').click();
});

$('joinBack').addEventListener('click', () => {
  if (peer) { try { peer.destroy(); } catch(e) {} peer = null; }
  showScreen('start');
});

$('readyBtn').addEventListener('click', () => {
  if (isHost) {
    lobbyPlayers['0'].ready = !lobbyPlayers['0'].ready;
    broadcastLobbyState();
    updateRoomDisplay();
  } else if (hostConn && hostConn.open) {
    hostConn.send({ type: 'ready' });
  }
});

$('startGameBtn').addEventListener('click', () => {
  if (!isHost) return;
  if (Object.keys(lobbyPlayers).length < 1) return;
  startGameHost();
});

$('leaveLobbyBtn').addEventListener('click', () => {
  cleanupGame();
  showScreen('start');
});

$('leaveBtn').addEventListener('click', () => {
  cleanupGame();
  showScreen('start');
});
