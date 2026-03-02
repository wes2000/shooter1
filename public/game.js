const socket = io();

// --- DOM Elements ---
const screens = {
  start: document.getElementById('startScreen'),
  browser: document.getElementById('lobbyBrowser'),
  room: document.getElementById('lobbyRoom'),
  game: document.getElementById('gameScreen'),
};

const nameInput = document.getElementById('nameInput');
const playBtn = document.getElementById('playBtn');
const lobbyNameInput = document.getElementById('lobbyNameInput');
const createLobbyBtn = document.getElementById('createLobbyBtn');
const lobbyListContainer = document.getElementById('lobbyListContainer');
const backToStart = document.getElementById('backToStart');
const roomName = document.getElementById('roomName');
const roomId = document.getElementById('roomId');
const playerList = document.getElementById('playerList');
const readyBtn = document.getElementById('readyBtn');
const startGameBtn = document.getElementById('startGameBtn');
const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const healthFill = document.getElementById('healthFill');
const scoreboard = document.getElementById('scoreboard');
const deathOverlay = document.getElementById('deathOverlay');
const leaveBtn = document.getElementById('leaveBtn');

// --- State ---
let myId = null;
let currentScreen = 'start';
let gameState = null;
let lobbyData = null;
let keys = { up: false, down: false, left: false, right: false };
let mouseX = 0, mouseY = 0;
let mouseDown = false;
let camera = { x: 0, y: 0 };

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;
const PLAYER_RADIUS = 18;

// --- Screen Management ---
function showScreen(name) {
  for (const key in screens) {
    screens[key].classList.remove('active');
  }
  screens[name].classList.add('active');
  currentScreen = name;
}

// --- Start Screen ---
playBtn.addEventListener('click', () => {
  const name = nameInput.value.trim() || 'Player';
  socket.emit('setName', name);
  showScreen('browser');
});
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') playBtn.click();
});

// --- Lobby Browser ---
backToStart.addEventListener('click', () => showScreen('start'));

createLobbyBtn.addEventListener('click', () => {
  const name = lobbyNameInput.value.trim() || 'My Lobby';
  socket.emit('createLobby', name);
  lobbyNameInput.value = '';
});

socket.on('lobbyList', (lobbies) => {
  if (lobbies.length === 0) {
    lobbyListContainer.innerHTML = '<div class="no-lobbies">No lobbies yet. Create one!</div>';
    return;
  }
  lobbyListContainer.innerHTML = lobbies.map(l => `
    <div class="lobby-item" data-id="${l.id}">
      <div class="info">
        <span class="name">${escapeHtml(l.name)}</span>
        <span class="count">${l.playerCount}/8 players${l.inGame ? ' — In Game' : ''}</span>
      </div>
      ${!l.inGame ? `<button class="btn btn-primary join-btn" data-id="${l.id}">Join</button>` : '<span style="color:#888;font-size:12px">In Progress</span>'}
    </div>
  `).join('');

  lobbyListContainer.querySelectorAll('.join-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      socket.emit('joinLobby', parseInt(btn.dataset.id));
    });
  });
});

// --- Lobby Room ---
socket.on('lobbyState', (data) => {
  lobbyData = data;
  if (currentScreen === 'browser' || currentScreen === 'start') {
    showScreen('room');
  }
  roomName.textContent = data.name;
  roomId.textContent = `Lobby #${data.id}`;

  const isHost = data.host === data.yourId;
  startGameBtn.style.display = isHost ? 'inline-block' : 'none';

  playerList.innerHTML = Object.entries(data.players).map(([id, p]) => `
    <div class="player-entry">
      <span>
        <span class="pname">${escapeHtml(p.name)}</span>
        ${id === data.host ? '<span class="host-tag">HOST</span>' : ''}
      </span>
      <span class="ready-tag ${p.ready ? 'yes' : 'no'}">${p.ready ? 'Ready' : 'Not Ready'}</span>
    </div>
  `).join('');
});

readyBtn.addEventListener('click', () => socket.emit('toggleReady'));
startGameBtn.addEventListener('click', () => socket.emit('startGame'));
leaveLobbyBtn.addEventListener('click', () => {
  socket.emit('leaveLobby');
  lobbyData = null;
  showScreen('browser');
});

// --- Game ---
socket.on('gameStarted', (data) => {
  myId = data.yourId;
  showScreen('game');
  resizeCanvas();
  requestAnimationFrame(gameLoop);
});

socket.on('gameState', (state) => {
  gameState = state;
});

leaveBtn.addEventListener('click', () => {
  socket.emit('leaveLobby');
  gameState = null;
  lobbyData = null;
  showScreen('browser');
});

// --- Input ---
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

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

window.addEventListener('mousedown', (e) => {
  if (currentScreen !== 'game') return;
  if (e.button === 0) mouseDown = true;
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) mouseDown = false;
});

window.addEventListener('contextmenu', (e) => {
  if (currentScreen === 'game') e.preventDefault();
});

// Send input to server
setInterval(() => {
  if (currentScreen !== 'game' || !gameState) return;
  const me = gameState.players[myId];
  if (!me) return;

  // Calculate angle from player screen pos to mouse
  const screenX = me.x - camera.x;
  const screenY = me.y - camera.y;
  const angle = Math.atan2(mouseY - screenY, mouseX - screenX);

  socket.emit('playerInput', {
    keys,
    angle,
    shooting: mouseDown,
  });
}, 1000 / 60);

// --- Rendering ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  minimapCanvas.width = 140;
  minimapCanvas.height = 140;
}
window.addEventListener('resize', resizeCanvas);

function gameLoop() {
  if (currentScreen !== 'game') return;

  render();
  renderMinimap();
  renderHUD();
  requestAnimationFrame(gameLoop);
}

function render() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  if (!gameState) return;
  const me = gameState.players[myId];
  if (!me) return;

  // Camera follows player
  camera.x = me.x - W / 2;
  camera.y = me.y - H / 2;

  // Draw background
  ctx.fillStyle = '#111122';
  ctx.fillRect(0, 0, W, H);

  // Draw grid
  ctx.strokeStyle = '#1a1a35';
  ctx.lineWidth = 1;
  const gridSize = 50;
  const startX = -(camera.x % gridSize);
  const startY = -(camera.y % gridSize);
  for (let x = startX; x < W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = startY; y < H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Draw map border
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.strokeRect(-camera.x, -camera.y, MAP_WIDTH, MAP_HEIGHT);

  // Draw bullets
  for (const b of gameState.bullets) {
    const sx = b.x - camera.x;
    const sy = b.y - camera.y;
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;

    // Bullet owner color
    const owner = gameState.players[b.ownerId];
    ctx.fillStyle = owner ? owner.color : '#fff';
    ctx.shadowColor = owner ? owner.color : '#fff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw players
  for (const [id, p] of Object.entries(gameState.players)) {
    if (!p.alive) continue;
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue;

    const isMe = id === myId;

    // Body
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Outline for self
    if (isMe) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, PLAYER_RADIUS + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Gun barrel
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(
      sx + Math.cos(p.angle) * (PLAYER_RADIUS + 12),
      sy + Math.sin(p.angle) * (PLAYER_RADIUS + 12)
    );
    ctx.stroke();

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, sx, sy - PLAYER_RADIUS - 10);

    // Health bar above player
    if (!isMe) {
      const barW = 36;
      const barH = 4;
      const barX = sx - barW / 2;
      const barY = sy - PLAYER_RADIUS - 6;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      const hpPct = Math.max(0, p.hp / 100);
      ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
    }
  }
}

function renderMinimap() {
  const mw = minimapCanvas.width;
  const mh = minimapCanvas.height;
  minimapCtx.clearRect(0, 0, mw, mh);
  minimapCtx.fillStyle = 'rgba(10,10,26,0.8)';
  minimapCtx.fillRect(0, 0, mw, mh);

  if (!gameState) return;

  const scaleX = mw / MAP_WIDTH;
  const scaleY = mh / MAP_HEIGHT;

  // Draw all players
  for (const [id, p] of Object.entries(gameState.players)) {
    if (!p.alive) continue;
    const mx = p.x * scaleX;
    const my = p.y * scaleY;
    minimapCtx.fillStyle = id === myId ? '#fff' : p.color;
    minimapCtx.beginPath();
    minimapCtx.arc(mx, my, id === myId ? 3 : 2, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // Draw viewport rect
  minimapCtx.strokeStyle = '#555';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(
    camera.x * scaleX,
    camera.y * scaleY,
    canvas.width * scaleX,
    canvas.height * scaleY
  );
}

function renderHUD() {
  if (!gameState) return;
  const me = gameState.players[myId];
  if (!me) return;

  // Health bar
  const hpPct = Math.max(0, me.hp / 100);
  healthFill.style.width = (hpPct * 100) + '%';
  healthFill.style.background = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';

  // Death overlay
  deathOverlay.style.display = me.alive ? 'none' : 'block';

  // Scoreboard
  const sorted = Object.entries(gameState.players)
    .sort(([, a], [, b]) => b.kills - a.kills || a.deaths - b.deaths);
  scoreboard.innerHTML = `
    <div class="sb-header">Scoreboard</div>
    ${sorted.map(([id, p]) => `
      <div class="sb-row" style="${id === myId ? 'color:#fff;font-weight:600' : ''}">
        <span class="sb-name" style="color:${p.color}">${escapeHtml(p.name)}</span>
        <span class="sb-kd">${p.kills}K / ${p.deaths}D</span>
      </div>
    `).join('')}
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
