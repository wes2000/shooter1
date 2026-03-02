// ========================
// CONSTANTS
// ========================
const MAP_W = 2000, MAP_H = 2000;
const PLAYER_R = 18, PLAYER_SPEED = 4;
const BULLET_R = 4;
const MAX_HP = 100, RESPAWN_TIME = 3000;
const TICK_RATE = 60;
const PICKUP_RADIUS = 22;
const PICKUP_RESPAWN = 20000;
const EXPLOSION_RADIUS = 60, EXPLOSION_DMG = 20, EXPLOSION_DURATION = 400;
const COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#00cec9','#fd79a8','#6c5ce7'];

// ========================
// WEAPONS
// ========================
const WEAPONS = {
  pistol: {
    name: 'Pistol', clip: 12, reloadTime: 1200, cooldown: 180,
    damage: 20, speed: 12, lifetime: 1500, bounces: 1,
    spread: 0, projectiles: 1, bulletColor: null,
    infinite: true, reserveAmmo: 0,
  },
  shotgun: {
    name: 'Shotgun', clip: 6, reloadTime: 1500, cooldown: 600,
    damage: 14, speed: 10, lifetime: 600, bounces: 0,
    spread: 0.26, projectiles: 5, bulletColor: '#ff6b35',
    infinite: false, reserveAmmo: 18,
  },
  smg: {
    name: 'SMG', clip: 30, reloadTime: 1800, cooldown: 75,
    damage: 10, speed: 14, lifetime: 1000, bounces: 0,
    spread: 0.05, projectiles: 1, bulletColor: '#ffd700',
    infinite: false, reserveAmmo: 90,
  },
  sniper: {
    name: 'Sniper', clip: 5, reloadTime: 2200, cooldown: 900,
    damage: 65, speed: 25, lifetime: 2500, bounces: 0,
    spread: 0, projectiles: 1, bulletColor: '#00ffff',
    infinite: false, reserveAmmo: 10, pierce: true,
  },
};

// ========================
// MAP: WALLS
// ========================
const WALLS = [
  // Center cross
  { x: 960, y: 900, w: 80, h: 200 },
  { x: 900, y: 960, w: 200, h: 80 },
  // Top-left L
  { x: 300, y: 300, w: 90, h: 20 },
  { x: 300, y: 300, w: 20, h: 90 },
  // Top-right L
  { x: 1610, y: 300, w: 90, h: 20 },
  { x: 1680, y: 300, w: 20, h: 90 },
  // Bottom-left L
  { x: 300, y: 1680, w: 90, h: 20 },
  { x: 300, y: 1610, w: 20, h: 90 },
  // Bottom-right L
  { x: 1610, y: 1680, w: 90, h: 20 },
  { x: 1680, y: 1610, w: 20, h: 90 },
  // Quadrant boxes
  { x: 550, y: 550, w: 50, h: 50 },
  { x: 1400, y: 550, w: 50, h: 50 },
  { x: 550, y: 1400, w: 50, h: 50 },
  { x: 1400, y: 1400, w: 50, h: 50 },
  // Horizontal covers
  { x: 400, y: 730, w: 120, h: 20 },
  { x: 1480, y: 730, w: 120, h: 20 },
  { x: 400, y: 1250, w: 120, h: 20 },
  { x: 1480, y: 1250, w: 120, h: 20 },
  // Vertical side covers
  { x: 700, y: 400, w: 20, h: 100 },
  { x: 1280, y: 400, w: 20, h: 100 },
  { x: 700, y: 1500, w: 20, h: 100 },
  { x: 1280, y: 1500, w: 20, h: 100 },
  // Side bunkers
  { x: 100, y: 920, w: 20, h: 160 },
  { x: 1880, y: 920, w: 20, h: 160 },
  { x: 920, y: 100, w: 160, h: 20 },
  { x: 920, y: 1880, w: 160, h: 20 },
  // Mid-lane covers
  { x: 400, y: 1000, w: 100, h: 20 },
  { x: 1500, y: 980, w: 100, h: 20 },
  { x: 980, y: 400, w: 20, h: 100 },
  { x: 1000, y: 1500, w: 20, h: 100 },
];

// ========================
// MAP: PICKUP SPAWN POINTS
// ========================
const PICKUP_DEFS = [
  // Health packs (green +)
  { x: 1000, y: 1000, type: 'health' },
  { x: 250, y: 1000, type: 'health' },
  { x: 1750, y: 1000, type: 'health' },
  { x: 1000, y: 250, type: 'health' },
  { x: 1000, y: 1750, type: 'health' },
  // Weapons
  { x: 450, y: 450, type: 'shotgun' },
  { x: 1550, y: 450, type: 'smg' },
  { x: 450, y: 1550, type: 'sniper' },
  { x: 1550, y: 1550, type: 'shotgun' },
  // Ammo mods
  { x: 750, y: 750, type: 'piercing' },
  { x: 1250, y: 750, type: 'explosive' },
  { x: 750, y: 1250, type: 'explosive' },
  { x: 1250, y: 1250, type: 'piercing' },
];

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
const killFeedEl = $('killFeed');
const weaponNameEl = $('weaponName');
const ammoCountEl = $('ammoCount');
const ammoModEl = $('ammoMod');
const reloadBarEl = $('reloadBar');
const reloadFillEl = $('reloadFill');

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
let hostConns = {};
let lobbyPlayers = {};
let nextPlayerId = 1;
let gameState = null;
let gameLoopInterval = null;

// Client state
let hostConn = null;

// Shared
let snapshot = null;
let keys = { up: false, down: false, left: false, right: false };
let mouseX = 0, mouseY = 0, mouseDown = false;
let camera = { x: 0, y: 0 };
let inputInterval = null;
let gameRunning = false;
let killNotifications = [];

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

function circleRectOverlap(cx, cy, r, wall) {
  const nx = Math.max(wall.x, Math.min(cx, wall.x + wall.w));
  const ny = Math.max(wall.y, Math.min(cy, wall.y + wall.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function pointInRect(px, py, wall) {
  return px >= wall.x && px <= wall.x + wall.w && py >= wall.y && py <= wall.y + wall.h;
}

function safeSpawnPos() {
  for (let i = 0; i < 100; i++) {
    const x = 120 + Math.random() * (MAP_W - 240);
    const y = 120 + Math.random() * (MAP_H - 240);
    let ok = true;
    for (const w of WALLS) {
      if (circleRectOverlap(x, y, PLAYER_R + 10, w)) { ok = false; break; }
    }
    if (ok) return { x, y };
  }
  return { x: MAP_W / 2, y: MAP_H / 2 };
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
  peer = new Peer('shooter1-' + roomCode, PEER_CONFIG);

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

      if (data.type === 'reload' && pid && gameState && gameState.players[pid]) {
        tryReload(gameState.players[pid], Date.now());
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
      createRoom();
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
        snapshot = {
          players: data.players,
          bullets: data.bullets,
          pickups: data.pickups,
          explosions: data.explosions,
        };
        // Process kill events
        if (data.killEvents) {
          for (const ev of data.killEvents) {
            killNotifications.push({
              text: `${ev.killer} killed ${ev.victim}`,
              time: Date.now(),
              isMyKill: ev.killerId === myPlayerId,
            });
          }
        }
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
function initPlayer(id, x, y, colorIdx) {
  return {
    x, y, angle: 0, hp: MAX_HP, alive: true,
    name: lobbyPlayers[id].name,
    color: COLORS[colorIdx % COLORS.length],
    kills: 0, deaths: 0,
    input: { up: false, down: false, left: false, right: false },
    shooting: false, lastShotTime: 0, respawnTimer: 0,
    weapon: 'pistol',
    ammo: WEAPONS.pistol.clip,
    reserveAmmo: Infinity,
    reloading: false,
    reloadStart: 0,
    ammoMod: null,
  };
}

function createGameState() {
  const state = {
    players: {},
    bullets: [],
    bulletIdCounter: 0,
    pickups: PICKUP_DEFS.map((def, i) => ({ id: i, x: def.x, y: def.y, type: def.type, active: true, respawnTime: 0 })),
    explosions: [],
    killEvents: [],
  };
  const ids = Object.keys(lobbyPlayers);
  ids.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / ids.length;
    const sx = MAP_W / 2 + Math.cos(angle) * 300;
    const sy = MAP_H / 2 + Math.sin(angle) * 300;
    state.players[id] = initPlayer(id, sx, sy, i);
  });
  return state;
}

function tryReload(p, now) {
  if (p.reloading || !p.alive) return;
  const wep = WEAPONS[p.weapon];
  if (p.ammo >= wep.clip) return;
  if (!wep.infinite && p.reserveAmmo <= 0) return;
  p.reloading = true;
  p.reloadStart = now;
}

function resolvePlayerWalls(p) {
  for (const wall of WALLS) {
    const nx = Math.max(wall.x, Math.min(p.x, wall.x + wall.w));
    const ny = Math.max(wall.y, Math.min(p.y, wall.y + wall.h));
    const dx = p.x - nx, dy = p.y - ny;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < PLAYER_R && dist > 0.001) {
      const overlap = PLAYER_R - dist;
      p.x += (dx / dist) * overlap;
      p.y += (dy / dist) * overlap;
    } else if (dist < 0.001) {
      // Player center inside wall — push to nearest edge
      const toLeft = p.x - wall.x;
      const toRight = (wall.x + wall.w) - p.x;
      const toTop = p.y - wall.y;
      const toBottom = (wall.y + wall.h) - p.y;
      const minD = Math.min(toLeft, toRight, toTop, toBottom);
      if (minD === toLeft) p.x = wall.x - PLAYER_R;
      else if (minD === toRight) p.x = wall.x + wall.w + PLAYER_R;
      else if (minD === toTop) p.y = wall.y - PLAYER_R;
      else p.y = wall.y + wall.h + PLAYER_R;
    }
  }
}

function triggerExplosion(x, y, ownerId, now) {
  gameState.explosions.push({ x, y, time: now });
  for (const pid in gameState.players) {
    const p = gameState.players[pid];
    if (!p.alive) continue;
    const dx = p.x - x, dy = p.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < EXPLOSION_RADIUS) {
      const dmg = Math.round(EXPLOSION_DMG * (1 - dist / EXPLOSION_RADIUS));
      p.hp -= dmg;
      if (p.hp <= 0 && p.alive) {
        p.alive = false;
        p.deaths++;
        p.respawnTimer = now + RESPAWN_TIME;
        resetPlayerWeapon(p);
        if (ownerId && gameState.players[ownerId] && ownerId !== pid) {
          gameState.players[ownerId].kills++;
          gameState.killEvents.push({
            killerId: ownerId,
            killer: gameState.players[ownerId].name,
            victim: p.name,
            weapon: 'explosive',
          });
        }
      }
    }
  }
}

function resetPlayerWeapon(p) {
  p.weapon = 'pistol';
  p.ammo = WEAPONS.pistol.clip;
  p.reserveAmmo = Infinity;
  p.reloading = false;
  p.ammoMod = null;
}

function applyPickup(p, pickup) {
  switch (pickup.type) {
    case 'health':
      p.hp = Math.min(MAX_HP, p.hp + 50);
      break;
    case 'shotgun': case 'smg': case 'sniper':
      if (p.weapon === pickup.type) {
        p.reserveAmmo = WEAPONS[pickup.type].reserveAmmo;
      } else {
        p.weapon = pickup.type;
        p.ammo = WEAPONS[pickup.type].clip;
        p.reserveAmmo = WEAPONS[pickup.type].reserveAmmo;
        p.reloading = false;
        p.ammoMod = null;
      }
      break;
    case 'piercing': case 'explosive':
      p.ammoMod = pickup.type;
      break;
  }
}

function updateGame() {
  const now = Date.now();
  gameState.killEvents = [];

  // Clean old explosions
  gameState.explosions = gameState.explosions.filter(e => now - e.time < EXPLOSION_DURATION);

  // Respawn pickups
  for (const pk of gameState.pickups) {
    if (!pk.active && now >= pk.respawnTime) pk.active = true;
  }

  // Update players
  for (const id in gameState.players) {
    const p = gameState.players[id];
    if (!p.alive) {
      if (p.respawnTimer && now >= p.respawnTimer) {
        const sp = safeSpawnPos();
        p.x = sp.x; p.y = sp.y;
        p.hp = MAX_HP; p.alive = true; p.respawnTimer = 0;
        resetPlayerWeapon(p);
      }
      continue;
    }

    // Reload
    if (p.reloading) {
      const wep = WEAPONS[p.weapon];
      if (now - p.reloadStart >= wep.reloadTime) {
        p.reloading = false;
        if (wep.infinite) {
          p.ammo = wep.clip;
        } else {
          const needed = wep.clip - p.ammo;
          const avail = Math.min(needed, p.reserveAmmo);
          p.ammo += avail;
          p.reserveAmmo -= avail;
        }
        p.ammoMod = null; // mod expires on reload
      }
    }

    // Movement
    let dx = 0, dy = 0;
    if (p.input.up) dy -= 1;
    if (p.input.down) dy += 1;
    if (p.input.left) dx -= 1;
    if (p.input.right) dx += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / len) * PLAYER_SPEED;
      dy = (dy / len) * PLAYER_SPEED;
      p.x += dx;
      p.y += dy;
    }
    // Wall collision
    resolvePlayerWalls(p);
    // Map bounds
    p.x = Math.max(PLAYER_R, Math.min(MAP_W - PLAYER_R, p.x));
    p.y = Math.max(PLAYER_R, Math.min(MAP_H - PLAYER_R, p.y));

    // Shooting
    const wep = WEAPONS[p.weapon];
    if (p.shooting && !p.reloading && p.ammo > 0 && now - p.lastShotTime >= wep.cooldown) {
      p.lastShotTime = now;
      for (let j = 0; j < wep.projectiles; j++) {
        const spreadAngle = p.angle + (wep.spread > 0 ? (Math.random() - 0.5) * wep.spread * 2 : 0);
        gameState.bullets.push({
          id: gameState.bulletIdCounter++,
          ownerId: id,
          x: p.x + Math.cos(p.angle) * (PLAYER_R + 8),
          y: p.y + Math.sin(p.angle) * (PLAYER_R + 8),
          vx: Math.cos(spreadAngle) * wep.speed,
          vy: Math.sin(spreadAngle) * wep.speed,
          createdAt: now,
          weapon: p.weapon,
          bounces: wep.bounces,
          pierce: !!wep.pierce || p.ammoMod === 'piercing',
          ammoMod: p.ammoMod,
          hitPlayers: [],
        });
      }
      p.ammo--;
      if (p.ammo <= 0) {
        if (wep.infinite || p.reserveAmmo > 0) {
          p.reloading = true;
          p.reloadStart = now;
        } else {
          resetPlayerWeapon(p);
        }
      }
    }

    // Pickup collection
    for (const pk of gameState.pickups) {
      if (!pk.active) continue;
      const pdx = p.x - pk.x, pdy = p.y - pk.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < PICKUP_RADIUS + PLAYER_R) {
        applyPickup(p, pk);
        pk.active = false;
        pk.respawnTime = now + PICKUP_RESPAWN;
        break;
      }
    }
  }

  // Update bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const b = gameState.bullets[i];
    b.x += b.vx;
    b.y += b.vy;

    // Out of bounds / lifetime
    if (b.x < 0 || b.x > MAP_W || b.y < 0 || b.y > MAP_H || now - b.createdAt > WEAPONS[b.weapon].lifetime) {
      gameState.bullets.splice(i, 1);
      continue;
    }

    // Wall collision
    let hitWall = false;
    for (const wall of WALLS) {
      if (pointInRect(b.x, b.y, wall)) {
        if (b.bounces > 0) {
          b.bounces--;
          const oL = b.x - wall.x, oR = (wall.x + wall.w) - b.x;
          const oT = b.y - wall.y, oB = (wall.y + wall.h) - b.y;
          const minO = Math.min(oL, oR, oT, oB);
          if (minO === oL || minO === oR) {
            b.vx = -b.vx;
            b.x = minO === oL ? wall.x - 1 : wall.x + wall.w + 1;
          } else {
            b.vy = -b.vy;
            b.y = minO === oT ? wall.y - 1 : wall.y + wall.h + 1;
          }
        } else {
          if (b.ammoMod === 'explosive') triggerExplosion(b.x, b.y, b.ownerId, now);
          gameState.bullets.splice(i, 1);
          hitWall = true;
        }
        break;
      }
    }
    if (hitWall) continue;

    // Player collision
    let removed = false;
    for (const pid in gameState.players) {
      if (pid === b.ownerId) continue;
      if (b.hitPlayers.includes(pid)) continue;
      const p = gameState.players[pid];
      if (!p.alive) continue;
      const ddx = p.x - b.x, ddy = p.y - b.y;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < PLAYER_R + BULLET_R) {
        const wep = WEAPONS[b.weapon];
        p.hp -= wep.damage;
        if (b.ammoMod === 'explosive') {
          triggerExplosion(b.x, b.y, b.ownerId, now);
        }
        if (p.hp <= 0 && p.alive) {
          p.alive = false;
          p.deaths++;
          p.respawnTimer = now + RESPAWN_TIME;
          resetPlayerWeapon(p);
          if (gameState.players[b.ownerId]) {
            gameState.players[b.ownerId].kills++;
            gameState.killEvents.push({
              killerId: b.ownerId,
              killer: gameState.players[b.ownerId].name,
              victim: p.name,
              weapon: b.weapon,
            });
          }
        }
        if (b.pierce) {
          b.hitPlayers.push(pid);
        } else {
          gameState.bullets.splice(i, 1);
          removed = true;
        }
        break;
      }
    }
    if (removed) continue;
  }
}

function getSnapshot() {
  const now = Date.now();
  const players = {};
  for (const [id, p] of Object.entries(gameState.players)) {
    players[id] = {
      x: p.x, y: p.y, angle: p.angle,
      hp: p.hp, alive: p.alive,
      name: p.name, color: p.color,
      kills: p.kills, deaths: p.deaths,
      weapon: p.weapon,
      ammo: p.ammo,
      reserveAmmo: p.reserveAmmo === Infinity ? -1 : p.reserveAmmo,
      reloading: p.reloading,
      reloadPct: p.reloading ? Math.min(1, (now - p.reloadStart) / WEAPONS[p.weapon].reloadTime) : 0,
      ammoMod: p.ammoMod,
    };
  }
  return {
    players,
    bullets: gameState.bullets.map(b => ({ id: b.id, x: b.x, y: b.y, ownerId: b.ownerId, weapon: b.weapon, ammoMod: b.ammoMod })),
    pickups: gameState.pickups.map(p => ({ id: p.id, x: p.x, y: p.y, type: p.type, active: p.active })),
    explosions: gameState.explosions.map(e => ({ x: e.x, y: e.y, age: now - e.time })),
    killEvents: gameState.killEvents,
  };
}

// ========================
// GAME START / STOP
// ========================
function startGameHost() {
  gameState = createGameState();
  gameRunning = true;
  killNotifications = [];

  for (const conn of Object.values(hostConns)) {
    try { conn.send({ type: 'gameStarted' }); } catch(e) {}
  }

  gameLoopInterval = setInterval(() => {
    const me = gameState.players['0'];
    if (me) {
      me.input = { ...keys };
      me.angle = Math.atan2(mouseY - canvas.height / 2, mouseX - canvas.width / 2);
      me.shooting = mouseDown;
    }

    updateGame();
    snapshot = getSnapshot();

    // Host processes kill events locally
    if (snapshot.killEvents) {
      for (const ev of snapshot.killEvents) {
        killNotifications.push({ text: `${ev.killer} killed ${ev.victim}`, time: Date.now(), isMyKill: ev.killerId === '0' });
      }
    }

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
  killNotifications = [];

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
  hostConns = {}; lobbyPlayers = {};
  gameState = null; snapshot = null;
  hostConn = null; peer = null;
  myPlayerId = null; isHost = false; nextPlayerId = 1;
  keys = { up: false, down: false, left: false, right: false };
  mouseDown = false;
  killNotifications = [];
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
    case 'r':
      if (isHost && gameState) {
        const me = gameState.players['0'];
        if (me && me.alive) tryReload(me, Date.now());
      } else if (hostConn && hostConn.open) {
        hostConn.send({ type: 'reload' });
      }
      break;
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

  // Walls
  for (const wall of WALLS) {
    const wx = wall.x - camera.x, wy = wall.y - camera.y;
    if (wx + wall.w < -10 || wx > W + 10 || wy + wall.h < -10 || wy > H + 10) continue;
    ctx.fillStyle = '#2a2a45';
    ctx.fillRect(wx, wy, wall.w, wall.h);
    ctx.strokeStyle = '#3d3d5c';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, wall.w, wall.h);
  }

  // Pickups
  if (snapshot.pickups) {
    const bobT = Date.now() / 300;
    for (const pk of snapshot.pickups) {
      if (!pk.active) continue;
      const sx = pk.x - camera.x, sy = pk.y - camera.y + Math.sin(bobT + pk.id) * 3;
      if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;
      renderPickup(sx, sy, pk.type);
    }
  }

  // Explosions
  if (snapshot.explosions) {
    for (const e of snapshot.explosions) {
      const sx = e.x - camera.x, sy = e.y - camera.y;
      if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) continue;
      const pct = Math.min(1, e.age / EXPLOSION_DURATION);
      const radius = 10 + 50 * pct;
      const alpha = (1 - pct) * 0.6;
      ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 220, 50, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (e.age < 100) {
        ctx.fillStyle = `rgba(255, 255, 200, ${(1 - e.age / 100) * 0.7})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Bullets
  for (const b of snapshot.bullets) {
    const sx = b.x - camera.x, sy = b.y - camera.y;
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
    const style = getBulletStyle(b);
    ctx.fillStyle = style.color;
    ctx.shadowColor = style.color;
    ctx.shadowBlur = style.glow;
    ctx.beginPath();
    ctx.arc(sx, sy, style.radius, 0, Math.PI * 2);
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

    // Gun barrel — color varies by weapon
    const wepColors = { pistol: '#ccc', shotgun: '#ff6b35', smg: '#ffd700', sniper: '#00ffff' };
    ctx.strokeStyle = wepColors[p.weapon] || '#ccc';
    ctx.lineWidth = p.weapon === 'sniper' ? 3 : 5;
    ctx.lineCap = 'round';
    const barrelLen = p.weapon === 'sniper' ? PLAYER_R + 18 : PLAYER_R + 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(p.angle) * barrelLen, sy + Math.sin(p.angle) * barrelLen);
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
      const hpPct = Math.max(0, p.hp / MAX_HP);
      ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(bx, by, bw * hpPct, bh);
    }
  }
}

function getBulletStyle(b) {
  const owner = snapshot.players[b.ownerId];
  let color = owner ? owner.color : '#fff';
  let radius = 4, glow = 8;

  if (b.ammoMod === 'explosive') { color = '#ff4444'; glow = 12; }
  else if (b.ammoMod === 'piercing') { color = '#a855f7'; glow = 10; }

  const wep = WEAPONS[b.weapon];
  if (wep && wep.bulletColor && !b.ammoMod) color = wep.bulletColor;

  if (b.weapon === 'sniper') { radius = 5; glow = 14; }
  else if (b.weapon === 'shotgun') { radius = 3; }

  return { color, radius, glow };
}

const PICKUP_COLORS = { health: '#2ecc71', shotgun: '#ff6b35', smg: '#ffd700', sniper: '#00ffff', piercing: '#a855f7', explosive: '#ff4444' };

function renderPickup(sx, sy, type) {
  const color = PICKUP_COLORS[type] || '#fff';

  // Glow
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (type === 'health') {
    ctx.fillStyle = color;
    ctx.fillRect(sx - 7, sy - 2, 14, 4);
    ctx.fillRect(sx - 2, sy - 7, 4, 14);
  } else if (type === 'piercing' || type === 'explosive') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 10);
    ctx.lineTo(sx + 8, sy);
    ctx.lineTo(sx, sy + 10);
    ctx.lineTo(sx - 8, sy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type === 'piercing' ? 'P' : 'E', sx, sy);
  } else {
    // Weapon circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type[0].toUpperCase(), sx, sy);
  }
}

function renderMinimap() {
  const mw = mmCanvas.width, mh = mmCanvas.height;
  mmCtx.clearRect(0, 0, mw, mh);
  mmCtx.fillStyle = 'rgba(10,10,26,0.8)';
  mmCtx.fillRect(0, 0, mw, mh);
  if (!snapshot) return;

  const sx = mw / MAP_W, sy = mh / MAP_H;

  // Walls on minimap
  mmCtx.fillStyle = '#2a2a45';
  for (const wall of WALLS) {
    mmCtx.fillRect(wall.x * sx, wall.y * sy, Math.max(2, wall.w * sx), Math.max(2, wall.h * sy));
  }

  // Pickups on minimap
  if (snapshot.pickups) {
    for (const pk of snapshot.pickups) {
      if (!pk.active) continue;
      mmCtx.fillStyle = PICKUP_COLORS[pk.type] || '#fff';
      mmCtx.fillRect(pk.x * sx - 1, pk.y * sy - 1, 3, 3);
    }
  }

  // Players
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

  // Health bar
  const hpPct = Math.max(0, me.hp / MAX_HP);
  healthFill.style.width = (hpPct * 100) + '%';
  healthFill.style.background = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
  deathOverlay.style.display = me.alive ? 'none' : 'block';

  // Weapon / Ammo display
  const wep = WEAPONS[me.weapon];
  weaponNameEl.textContent = wep.name;
  weaponNameEl.style.color = wep.bulletColor || '#ccc';
  const reserve = me.reserveAmmo === -1 ? '\u221E' : me.reserveAmmo;
  ammoCountEl.textContent = `${me.ammo} / ${reserve}`;
  if (me.ammoMod) {
    ammoModEl.textContent = me.ammoMod === 'piercing' ? 'PIERCING' : 'EXPLOSIVE';
    ammoModEl.style.color = me.ammoMod === 'piercing' ? '#a855f7' : '#ff4444';
  } else {
    ammoModEl.textContent = '';
  }

  // Reload bar
  if (me.reloading) {
    reloadBarEl.style.display = 'block';
    reloadFillEl.style.width = (me.reloadPct * 100) + '%';
  } else {
    reloadBarEl.style.display = 'none';
  }

  // Scoreboard
  const sorted = Object.entries(snapshot.players).sort(([,a],[,b]) => b.kills - a.kills || a.deaths - b.deaths);
  scoreboardEl.innerHTML = `<div class="sb-header">Scoreboard</div>` +
    sorted.map(([id, p]) => `
      <div class="sb-row" style="${id === myPlayerId ? 'color:#fff;font-weight:600' : ''}">
        <span class="sb-name" style="color:${p.color}">${escapeHtml(p.name)}</span>
        <span class="sb-kd">${p.kills}K / ${p.deaths}D</span>
      </div>
    `).join('');

  // Kill feed
  const now = Date.now();
  killNotifications = killNotifications.filter(n => now - n.time < 3500);
  killFeedEl.innerHTML = killNotifications.map(n => {
    const age = now - n.time;
    const opacity = age > 2500 ? 1 - (age - 2500) / 1000 : 1;
    return `<div class="kill-msg${n.isMyKill ? ' my-kill' : ''}" style="opacity:${opacity.toFixed(2)}">${escapeHtml(n.text)}</div>`;
  }).join('');
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
