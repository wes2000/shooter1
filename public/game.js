// ========================
// CONSTANTS
// ========================
const MAP_W = 2000, MAP_H = 2000;
const PLAYER_R = 18;
const BULLET_R = 4;
const RESPAWN_TIME = 3000;
const TICK_RATE = 60;
const PICKUP_RADIUS = 22;
const PICKUP_RESPAWN = 20000;
const EXPLOSION_RADIUS = 60, EXPLOSION_DMG = 20, EXPLOSION_DURATION = 400;
const TURRET_R = 12, TURRET_RANGE = 300, TURRET_FIRE_RATE = 1000, TURRET_DURATION = 10000, TURRET_HP = 50;
const SHIELD_DURATION = 5000;
const DASH_DIST = 150, DASH_INVULN = 200;
const CLOAK_DURATION = 4000;
const COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#00cec9','#fd79a8','#6c5ce7'];

// ========================
// CLASSES
// ========================
const CLASS_DEFS = {
  tank:     { name: 'Tank',     hp: 150, speed: 3.2, ability: 'Shield Wall', cooldown: 15000 },
  scout:    { name: 'Scout',    hp: 75,  speed: 5.5, ability: 'Dash',        cooldown: 8000 },
  engineer: { name: 'Engineer', hp: 100, speed: 4.0, ability: 'Turret',      cooldown: 20000 },
  ghost:    { name: 'Ghost',    hp: 85,  speed: 4.5, ability: 'Cloak',       cooldown: 12000 },
};

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
  turret: {
    name: 'Turret', clip: 999, reloadTime: 0, cooldown: 1000,
    damage: 10, speed: 10, lifetime: 1500, bounces: 0,
    spread: 0.04, projectiles: 1, bulletColor: '#ff9f43',
    infinite: true, reserveAmmo: 0,
  },
};

// ========================
// BUFF SYSTEM
// ========================
const BASE_SPEED_MULT = 0.80;    // -20% baseline movement speed nerf
const BASE_FIRERATE_MULT = 0.75; // -25% baseline fire rate nerf (cooldowns are longer)
const BUFF_PICK_COUNT = 3;

const BUFF_DEFS = {
  // === OFFENSIVE BUFFS ===
  quick_draw:        { name: 'Quick Draw',        type: 'offensive', desc: '+15% fire rate' },
  lead_boots:        { name: 'Lead Boots',         type: 'offensive', desc: '+12% move speed' },
  heavy_rounds:      { name: 'Heavy Rounds',       type: 'offensive', desc: '+20% bullet damage' },
  hollow_points:     { name: 'Hollow Points',      type: 'offensive', desc: 'Bullets slow enemies 30% for 1.5s' },
  chain_lightning:   { name: 'Chain Lightning',    type: 'offensive', desc: 'Hit sparks to 1 nearby enemy (8 dmg)' },
  vampiric_rounds:   { name: 'Vampiric Rounds',    type: 'offensive', desc: 'Heal 15% of damage dealt' },
  expanded_mags:     { name: 'Expanded Mags',      type: 'offensive', desc: '+50% magazine size' },
  fast_hands:        { name: 'Fast Hands',         type: 'offensive', desc: '-25% reload time' },
  ricochet_master:   { name: 'Ricochet Master',    type: 'offensive', desc: 'Bullets +1 wall bounce' },
  shrapnel:          { name: 'Shrapnel',           type: 'offensive', desc: 'Bullets explode on final impact (15dmg, 40px)' },
  hot_streak:        { name: 'Hot Streak',         type: 'offensive', desc: '3 kills w/o dying = +30% damage' },
  tracker_rounds:    { name: 'Tracker Rounds',     type: 'offensive', desc: 'Hit enemies visible through walls 3s' },
  adrenaline_rush:   { name: 'Adrenaline Rush',    type: 'offensive', desc: 'On kill: +40% speed, +25% fire rate 4s' },
  double_tap:        { name: 'Double Tap',         type: 'offensive', desc: '15% chance to fire a second bullet' },
  overcharge:        { name: 'Overcharge',         type: 'offensive', desc: 'Ability cooldown -20%' },
  gunslinger:        { name: 'Gunslinger',         type: 'offensive', desc: '+25% bullet speed' },
  bleed_out:         { name: 'Bleed Out',          type: 'offensive', desc: 'Bullets apply 4 dmg/s bleed for 3s' },
  scavenger:         { name: 'Scavenger',          type: 'offensive', desc: 'Kills drop health pack (25HP) + ammo' },
  glass_cannon:      { name: 'Glass Cannon',       type: 'offensive', desc: '+35% damage, -15 max HP' },
  ability_amplifier: { name: 'Ability Amplifier',  type: 'offensive', desc: 'Enhances your class ability' },
  // === DEFENSIVE BUFFS ===
  thick_skin:        { name: 'Thick Skin',         type: 'defensive', desc: '+20 max HP' },
  quick_feet:        { name: 'Quick Feet',         type: 'defensive', desc: '+12% move speed' },
  regeneration:      { name: 'Regeneration',       type: 'defensive', desc: 'Heal 2 HP/sec passively' },
  energy_shield:     { name: 'Energy Shield',      type: 'defensive', desc: '25 HP shield, regens after 5s' },
  blast_resistant:   { name: 'Blast Resistant',    type: 'defensive', desc: '-30% explosion damage' },
  second_wind:       { name: 'Second Wind',        type: 'defensive', desc: 'Survive fatal hit once/life (1 HP + 3s invuln)' },
  dodge_roll:        { name: 'Dodge Roll',         type: 'defensive', desc: '12% chance to dodge bullets' },
  momentum:          { name: 'Momentum',           type: 'defensive', desc: '4s no damage = +25% move speed' },
  thorn_armor:       { name: 'Thorn Armor',        type: 'defensive', desc: 'Reflect 20% damage to shooter' },
  iron_boots:        { name: 'Iron Boots',         type: 'defensive', desc: 'Immune to slow effects' },
  last_stand:        { name: 'Last Stand',         type: 'defensive', desc: 'Below 30% HP = +20% dmg, +15% fire rate' },
  spawn_shield:      { name: 'Spawn Shield',       type: 'defensive', desc: '2.5s invuln after respawn' },
  medics_instinct:   { name: "Medic's Instinct",   type: 'defensive', desc: 'Health pickups +50% healing & radius' },
  fortify:           { name: 'Fortify',            type: 'defensive', desc: 'Stand still 1s = 25% damage reduction' },
  juggernaut:        { name: 'Juggernaut',         type: 'defensive', desc: '+30 max HP, -8% move speed' },
  ability_recharge:  { name: 'Ability Recharge',   type: 'defensive', desc: 'Ability cooldown -20%' },
  evasion_streak:    { name: 'Evasion Streak',     type: 'defensive', desc: '+3%/sec speed w/o damage (cap +30%)' },
  phoenix_aura:      { name: 'Phoenix Aura',       type: 'defensive', desc: 'Respawn 40% faster' },
  bullet_sponge:     { name: 'Bullet Sponge',      type: 'defensive', desc: 'Consecutive hits deal 10% less (max -40%)' },
  field_medic:       { name: 'Field Medic',        type: 'defensive', desc: 'On respawn, heal nearby allies 30 HP' },
};

const OFFENSIVE_BUFF_IDS = Object.keys(BUFF_DEFS).filter(k => BUFF_DEFS[k].type === 'offensive');
const DEFENSIVE_BUFF_IDS = Object.keys(BUFF_DEFS).filter(k => BUFF_DEFS[k].type === 'defensive');
const SHRAPNEL_RADIUS = 40, SHRAPNEL_DMG = 15;
const CHAIN_LIGHTNING_RANGE = 120, CHAIN_LIGHTNING_DMG = 8;

function generateBuffChoices(isOffensive) {
  const pool = isOffensive ? [...OFFENSIVE_BUFF_IDS] : [...DEFENSIVE_BUFF_IDS];
  const choices = [];
  for (let i = 0; i < BUFF_PICK_COUNT && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }
  return choices;
}

function applyBuff(p, buffId) {
  if (!BUFF_DEFS[buffId]) return;
  if (!p.buffs[buffId]) p.buffs[buffId] = 0;
  p.buffs[buffId]++;
  // Immediate effects for HP-changing buffs
  if (buffId === 'thick_skin') { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp); }
  if (buffId === 'juggernaut') { p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp); }
  if (buffId === 'glass_cannon') { p.maxHp = Math.max(10, p.maxHp - 15); p.hp = Math.min(p.hp, p.maxHp); }
  if (buffId === 'energy_shield') { p.shieldHp += 25; p.shieldMax += 25; }
}

function getBuffStats(p) {
  const b = p.buffs;
  const now = Date.now();
  // Speed
  let speedMult = BASE_SPEED_MULT;
  speedMult *= Math.pow(1.12, (b.lead_boots || 0) + (b.quick_feet || 0));
  if (b.juggernaut) speedMult *= Math.pow(0.92, b.juggernaut);
  if (b.momentum && p.lastDamageTaken && (now - p.lastDamageTaken > 4000)) speedMult *= 1 + 0.25 * b.momentum;
  if (b.evasion_streak && p.lastDamageTaken) {
    const secsSafe = (now - p.lastDamageTaken) / 1000;
    speedMult *= 1 + Math.min(0.30 * b.evasion_streak, secsSafe * 0.03 * b.evasion_streak);
  }
  if (p.adrenalineEnd && now < p.adrenalineEnd) speedMult *= 1.40;
  // Fire rate
  let fireRateMult = BASE_FIRERATE_MULT;
  if (b.quick_draw) fireRateMult *= Math.pow(1.15, b.quick_draw);
  if (p.adrenalineEnd && now < p.adrenalineEnd) fireRateMult *= 1.25;
  if (b.last_stand && p.hp <= p.maxHp * 0.30) fireRateMult *= 1 + 0.15 * b.last_stand;
  // Damage
  let damageMult = 1.0;
  if (b.heavy_rounds) damageMult *= Math.pow(1.20, b.heavy_rounds);
  if (b.glass_cannon) damageMult *= Math.pow(1.35, b.glass_cannon);
  if (b.hot_streak && p.killsThisLife >= 3) damageMult *= 1 + 0.30 * b.hot_streak;
  if (b.last_stand && p.hp <= p.maxHp * 0.30) damageMult *= 1 + 0.20 * b.last_stand;
  // Reload
  let reloadMult = 1.0;
  if (b.fast_hands) reloadMult *= Math.pow(0.75, b.fast_hands);
  // Clip
  let clipMult = 1.0;
  if (b.expanded_mags) clipMult *= Math.pow(1.50, b.expanded_mags);
  // Ability CD
  let abilityCdMult = 1.0;
  if (b.overcharge) abilityCdMult *= Math.pow(0.80, b.overcharge);
  if (b.ability_recharge) abilityCdMult *= Math.pow(0.80, b.ability_recharge);
  // Bullet speed
  let bulletSpeedMult = 1.0;
  if (b.gunslinger) bulletSpeedMult *= Math.pow(1.25, b.gunslinger);
  // Extra bounces
  let extraBounces = (b.ricochet_master || 0);
  // Damage reduction
  let dmgReduction = 0;
  if (b.fortify && p.lastMoveTime && (now - p.lastMoveTime > 1000)) dmgReduction += 0.25 * b.fortify;
  // Slow factor (from being hit by hollow points)
  let slowFactor = 1.0;
  if (p.slowEnd && now < p.slowEnd && !(b.iron_boots)) slowFactor = 0.70;

  return { speedMult: speedMult * slowFactor, fireRateMult, damageMult, reloadMult, clipMult, abilityCdMult, bulletSpeedMult, extraBounces, dmgReduction };
}

function getRespawnTime(p) {
  let t = RESPAWN_TIME;
  if (p.buffs.phoenix_aura) t *= Math.pow(0.60, p.buffs.phoenix_aura);
  return Math.max(500, t);
}

// ========================
// MAP: WALLS
// ========================
const WALLS = [
  { x: 960, y: 900, w: 80, h: 200 },
  { x: 900, y: 960, w: 200, h: 80 },
  { x: 300, y: 300, w: 90, h: 20 }, { x: 300, y: 300, w: 20, h: 90 },
  { x: 1610, y: 300, w: 90, h: 20 }, { x: 1680, y: 300, w: 20, h: 90 },
  { x: 300, y: 1680, w: 90, h: 20 }, { x: 300, y: 1610, w: 20, h: 90 },
  { x: 1610, y: 1680, w: 90, h: 20 }, { x: 1680, y: 1610, w: 20, h: 90 },
  { x: 550, y: 550, w: 50, h: 50 }, { x: 1400, y: 550, w: 50, h: 50 },
  { x: 550, y: 1400, w: 50, h: 50 }, { x: 1400, y: 1400, w: 50, h: 50 },
  { x: 400, y: 730, w: 120, h: 20 }, { x: 1480, y: 730, w: 120, h: 20 },
  { x: 400, y: 1250, w: 120, h: 20 }, { x: 1480, y: 1250, w: 120, h: 20 },
  { x: 700, y: 400, w: 20, h: 100 }, { x: 1280, y: 400, w: 20, h: 100 },
  { x: 700, y: 1500, w: 20, h: 100 }, { x: 1280, y: 1500, w: 20, h: 100 },
  { x: 100, y: 920, w: 20, h: 160 }, { x: 1880, y: 920, w: 20, h: 160 },
  { x: 920, y: 100, w: 160, h: 20 }, { x: 920, y: 1880, w: 160, h: 20 },
  { x: 400, y: 1000, w: 100, h: 20 }, { x: 1500, y: 980, w: 100, h: 20 },
  { x: 980, y: 400, w: 20, h: 100 }, { x: 1000, y: 1500, w: 20, h: 100 },
];

// ========================
// MAP: PICKUP SPAWN POINTS
// ========================
const PICKUP_DEFS = [
  { x: 1000, y: 1000, type: 'health' },
  { x: 250, y: 1000, type: 'health' }, { x: 1750, y: 1000, type: 'health' },
  { x: 1000, y: 250, type: 'health' }, { x: 1000, y: 1750, type: 'health' },
  { x: 450, y: 450, type: 'shotgun' }, { x: 1550, y: 450, type: 'smg' },
  { x: 450, y: 1550, type: 'sniper' }, { x: 1550, y: 1550, type: 'shotgun' },
  { x: 750, y: 750, type: 'piercing' }, { x: 1250, y: 750, type: 'explosive' },
  { x: 750, y: 1250, type: 'explosive' }, { x: 1250, y: 1250, type: 'piercing' },
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
const abilityNameEl = $('abilityName');
const abilityCdFillEl = $('abilityCdFill');
const abilityDisplayEl = $('abilityDisplay');

// ========================
// STATE
// ========================
let myName = 'Player';
let myPlayerId = null;
let isHost = false;
let roomCode = '';
let peer = null;
let currentScreen = 'start';
let selectedClass = 'tank';

let hostConns = {};
let lobbyPlayers = {};
let nextPlayerId = 1;
let gameState = null;
let gameLoopInterval = null;
let hostConn = null;

let snapshot = null;
let keys = { up: false, down: false, left: false, right: false };
let mouseX = 0, mouseY = 0, mouseDown = false;
let camera = { x: 0, y: 0 };
let inputInterval = null;
let gameRunning = false;
let killNotifications = [];
let buffPickerChoices = null; // client-side: array of buff IDs to display

// ========================
// HELPERS
// ========================
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function generateRoomCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let r = '';
  for (let i = 0; i < 4; i++) r += c[Math.floor(Math.random() * c.length)]; return r;
}
function showScreen(name) { for (const k in screens) screens[k].classList.remove('active'); screens[name].classList.add('active'); currentScreen = name; }
function setStatus(el, msg, err) { el.textContent = msg; el.className = 'status-msg' + (err ? ' error' : ''); }
function circleRectOverlap(cx, cy, r, w) { const nx = Math.max(w.x, Math.min(cx, w.x+w.w)), ny = Math.max(w.y, Math.min(cy, w.y+w.h)), dx = cx-nx, dy = cy-ny; return dx*dx+dy*dy < r*r; }
function pointInRect(px, py, w) { return px >= w.x && px <= w.x+w.w && py >= w.y && py <= w.y+w.h; }

function getAllWalls() {
  if (!gameState || !gameState.shieldWalls.length) return WALLS;
  return WALLS.concat(gameState.shieldWalls);
}

function safeSpawnPos() {
  const walls = gameState ? getAllWalls() : WALLS;
  for (let i = 0; i < 100; i++) {
    const x = 120 + Math.random() * (MAP_W - 240), y = 120 + Math.random() * (MAP_H - 240);
    let ok = true;
    for (const w of walls) { if (circleRectOverlap(x, y, PLAYER_R + 10, w)) { ok = false; break; } }
    if (ok) return { x, y };
  }
  return { x: MAP_W / 2, y: MAP_H / 2 };
}

// ========================
// PEER SETUP
// ========================
const PEER_CONFIG = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };

// ========================
// HOST: CREATE ROOM
// ========================
function createRoom() {
  roomCode = generateRoomCode();
  peer = new Peer('shooter1-' + roomCode, PEER_CONFIG);

  peer.on('open', () => {
    isHost = true;
    myPlayerId = '0';
    lobbyPlayers = { '0': { name: myName, ready: true, playerClass: selectedClass } };
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
        lobbyPlayers[pid] = { name: String(data.name).slice(0, 16) || 'Player', ready: false, playerClass: 'tank' };
        hostConns[pid] = conn;
        conn.send({ type: 'joined', yourId: pid });
        broadcastLobbyState();
        updateRoomDisplay();
      }
      if (data.type === 'ready' && pid && lobbyPlayers[pid]) {
        lobbyPlayers[pid].ready = !lobbyPlayers[pid].ready;
        broadcastLobbyState(); updateRoomDisplay();
      }
      if (data.type === 'selectClass' && pid && lobbyPlayers[pid] && CLASS_DEFS[data.cls]) {
        lobbyPlayers[pid].playerClass = data.cls;
        broadcastLobbyState(); updateRoomDisplay();
      }
      if (data.type === 'input' && pid && gameState && gameState.players[pid]) {
        const p = gameState.players[pid];
        if (data.keys) { p.input.up = !!data.keys.up; p.input.down = !!data.keys.down; p.input.left = !!data.keys.left; p.input.right = !!data.keys.right; }
        if (typeof data.angle === 'number') p.angle = data.angle;
        if (typeof data.shooting === 'boolean') p.shooting = data.shooting;
      }
      if (data.type === 'reload' && pid && gameState && gameState.players[pid]) tryReload(gameState.players[pid], Date.now());
      if (data.type === 'ability' && pid && gameState && gameState.players[pid]) activateAbility(gameState.players[pid], pid, Date.now());
      if (data.type === 'selectBuff' && pid && gameState) handleSelectBuff(pid, data.buffId);
    });
    conn.on('close', () => {
      if (pid) {
        delete lobbyPlayers[pid]; delete hostConns[pid];
        if (gameState) {
          if (gameState.players[pid]) delete gameState.players[pid];
          gameState.turrets = gameState.turrets.filter(t => t.ownerId !== pid);
          gameState.shieldWalls = gameState.shieldWalls.filter(s => s.ownerId !== pid);
        }
        broadcastLobbyState(); updateRoomDisplay();
      }
    });
  });

  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') { peer.destroy(); createRoom(); }
    else setStatus(roomStatus, 'Error: ' + err.message, true);
  });
}

function broadcastLobbyState() {
  const state = { type: 'lobbyState', roomCode, players: {}, hostId: '0' };
  for (const [id, p] of Object.entries(lobbyPlayers)) {
    state.players[id] = { name: p.name, ready: p.ready, isHost: id === '0', playerClass: p.playerClass };
  }
  for (const conn of Object.values(hostConns)) { try { conn.send(state); } catch(e) {} }
}

// ========================
// CLIENT: JOIN ROOM
// ========================
function joinRoom(code) {
  code = code.toUpperCase().trim();
  if (code.length !== 4) { setStatus(joinStatus, 'Enter a 4-letter code', true); return; }
  setStatus(joinStatus, 'Connecting...'); $('connectBtn').disabled = true;
  peer = new Peer(undefined, PEER_CONFIG);

  peer.on('open', () => {
    hostConn = peer.connect('shooter1-' + code, { reliable: true });
    hostConn.on('open', () => { hostConn.send({ type: 'join', name: myName }); });
    hostConn.on('data', (data) => {
      if (!data || !data.type) return;
      if (data.type === 'joined') {
        myPlayerId = data.yourId; roomCode = code; roomCodeEl.textContent = code;
        $('startGameBtn').style.display = 'none'; showScreen('room');
      }
      if (data.type === 'lobbyState') {
        lobbyPlayers = {};
        for (const [id, p] of Object.entries(data.players)) lobbyPlayers[id] = p;
        updateRoomDisplay();
      }
      if (data.type === 'gameStarted') startGameClient();
      if (data.type === 'state') {
        snapshot = { players: data.players, bullets: data.bullets, pickups: data.pickups, explosions: data.explosions, turrets: data.turrets, shieldWalls: data.shieldWalls };
        if (data.killEvents) {
          for (const ev of data.killEvents) {
            killNotifications.push({ text: `${ev.killer} killed ${ev.victim}`, time: Date.now(), isMyKill: ev.killerId === myPlayerId });
          }
        }
        // Check for buff selection from host
        if (myPlayerId && data.players[myPlayerId]) {
          const me = data.players[myPlayerId];
          buffPickerChoices = me.buffChoices || null;
        }
      }
    });
    hostConn.on('close', () => { if (gameRunning || currentScreen === 'room') { cleanupGame(); showScreen('start'); alert('Host disconnected'); } });
    hostConn.on('error', () => { setStatus(joinStatus, 'Connection lost', true); });
  });

  peer.on('error', (err) => {
    $('connectBtn').disabled = false;
    setStatus(joinStatus, err.type === 'peer-unavailable' ? 'Room not found' : 'Error: ' + err.message, true);
  });
}

// ========================
// LOBBY DISPLAY
// ========================
function updateRoomDisplay() {
  playerListEl.innerHTML = Object.entries(lobbyPlayers).map(([id, p]) => {
    const cls = CLASS_DEFS[p.playerClass || 'tank'];
    return `<div class="player-entry">
      <span>
        <span class="pname">${escapeHtml(p.name)}</span>
        <span class="class-badge">${cls.name}</span>
        ${(p.isHost || id === '0') ? '<span class="host-tag">HOST</span>' : ''}
      </span>
      <span class="ready-tag ${p.ready ? 'yes' : 'no'}">${p.ready ? 'Ready' : 'Not Ready'}</span>
    </div>`;
  }).join('');
}

// ========================
// GAME SIMULATION (Host only)
// ========================
function initPlayer(id, x, y, colorIdx) {
  const cls = CLASS_DEFS[lobbyPlayers[id].playerClass || 'tank'];
  return {
    x, y, angle: 0, hp: cls.hp, maxHp: cls.hp, speed: cls.speed,
    alive: true, name: lobbyPlayers[id].name,
    color: COLORS[colorIdx % COLORS.length],
    playerClass: lobbyPlayers[id].playerClass || 'tank',
    kills: 0, deaths: 0,
    input: { up: false, down: false, left: false, right: false },
    shooting: false, lastShotTime: 0, respawnTimer: 0,
    weapon: 'pistol', ammo: WEAPONS.pistol.clip, reserveAmmo: Infinity,
    reloading: false, reloadStart: 0, ammoMod: null,
    abilityCdStart: -99999,
    cloaked: false, cloakEnd: 0,
    dashing: false, dashEnd: 0,
    // Buff system
    buffs: {},
    killsThisLife: 0,
    gotKillThisLife: false,
    pendingBuffChoices: null,
    // Buff tracking state
    lastDamageTaken: 0,
    lastMoveTime: 0,
    shieldHp: 0, shieldMax: 0, shieldRegenTime: 0,
    secondWindUsed: false,
    adrenalineEnd: 0,
    spawnShieldEnd: 0,
    slowEnd: 0,
    bleedEffects: [],
    trackedUntil: 0,
    consecutiveHitCount: 0,
    consecutiveHitTimer: 0,
    lastRegenTick: 0,
  };
}

function createGameState() {
  // Add a bot to lobby
  lobbyPlayers['bot1'] = { name: 'BOT', ready: true, playerClass: 'tank' };
  const state = {
    players: {}, bullets: [], bulletIdCounter: 0,
    pickups: PICKUP_DEFS.map((d, i) => ({ id: i, x: d.x, y: d.y, type: d.type, active: true, respawnTime: 0 })),
    explosions: [], killEvents: [],
    turrets: [], turretIdCounter: 0,
    shieldWalls: [], shieldWallIdCounter: 0,
  };
  const ids = Object.keys(lobbyPlayers);
  ids.forEach((id, i) => {
    const a = (2 * Math.PI * i) / ids.length;
    state.players[id] = initPlayer(id, MAP_W/2 + Math.cos(a)*300, MAP_H/2 + Math.sin(a)*300, i);
  });
  // Mark bot
  state.players['bot1'].isBot = true;
  return state;
}

function updateBots(now) {
  for (const id in gameState.players) {
    const bot = gameState.players[id];
    if (!bot.isBot || !bot.alive) {
      // Bot auto-picks a buff when pending
      if (bot && bot.isBot && !bot.alive && Array.isArray(bot.pendingBuffChoices)) {
        const pick = bot.pendingBuffChoices[Math.floor(Math.random() * bot.pendingBuffChoices.length)];
        handleSelectBuff(id, pick);
      }
      continue;
    }
    // Find nearest player
    let nearest = null, nearDist = Infinity;
    for (const pid in gameState.players) {
      if (pid === id) continue;
      const p = gameState.players[pid];
      if (!p.alive || p.cloaked) continue;
      const d = Math.sqrt((p.x - bot.x)**2 + (p.y - bot.y)**2);
      if (d < nearDist) { nearDist = d; nearest = p; }
    }
    // Aim + shoot at nearest, don't move
    bot.input = { up: false, down: false, left: false, right: false };
    if (nearest && nearDist < 500) {
      bot.angle = Math.atan2(nearest.y - bot.y, nearest.x - bot.x);
      bot.shooting = true;
    } else {
      bot.shooting = false;
    }
    // Auto-reload
    if (bot.ammo <= 0 && !bot.reloading) tryReload(bot, now);
  }
}

function tryReload(p, now) {
  if (p.reloading || !p.alive) return;
  const wep = WEAPONS[p.weapon];
  if (p.ammo >= wep.clip) return;
  if (!wep.infinite && p.reserveAmmo <= 0) return;
  p.reloading = true; p.reloadStart = now;
}

function activateAbility(p, id, now) {
  const cls = CLASS_DEFS[p.playerClass];
  const bs = getBuffStats(p);
  const effectiveCd = cls.cooldown * bs.abilityCdMult;
  if (!p.alive || now - p.abilityCdStart < effectiveCd) return;
  p.abilityCdStart = now;
  const ampStacks = p.buffs.ability_amplifier || 0;

  switch (p.playerClass) {
    case 'tank': {
      const dist = 55;
      const cx = p.x + Math.cos(p.angle) * dist, cy = p.y + Math.sin(p.angle) * dist;
      const horiz = Math.abs(Math.cos(p.angle)) >= Math.abs(Math.sin(p.angle));
      const baseSize = 100 + ampStacks * 30;
      const ww = horiz ? 16 : baseSize, wh = horiz ? baseSize : 16;
      const dur = SHIELD_DURATION + ampStacks * 2000;
      gameState.shieldWalls.push({
        id: gameState.shieldWallIdCounter++,
        x: Math.max(0, Math.min(MAP_W - ww, cx - ww/2)),
        y: Math.max(0, Math.min(MAP_H - wh, cy - wh/2)),
        w: ww, h: wh, ownerId: id, createdAt: now, duration: dur,
      });
      break;
    }
    case 'scout': {
      const dashDist = DASH_DIST + ampStacks * 50;
      const dashInvuln = DASH_INVULN + ampStacks * 300;
      const steps = 15, stepD = dashDist / steps;
      const walls = getAllWalls();
      for (let s = 0; s < steps; s++) {
        const tx = p.x + Math.cos(p.angle) * stepD, ty = p.y + Math.sin(p.angle) * stepD;
        let blocked = false;
        for (const w of walls) { if (circleRectOverlap(tx, ty, PLAYER_R, w)) { blocked = true; break; } }
        if (blocked) break;
        p.x = tx; p.y = ty;
      }
      p.x = Math.max(PLAYER_R, Math.min(MAP_W - PLAYER_R, p.x));
      p.y = Math.max(PLAYER_R, Math.min(MAP_H - PLAYER_R, p.y));
      p.dashing = true; p.dashEnd = now + dashInvuln;
      break;
    }
    case 'engineer': {
      const turretHp = TURRET_HP + ampStacks * 25;
      const turretDur = TURRET_DURATION + ampStacks * 5000;
      gameState.turrets = gameState.turrets.filter(t => t.ownerId !== id);
      gameState.turrets.push({
        id: gameState.turretIdCounter++,
        x: p.x, y: p.y, hp: turretHp, maxHp: turretHp,
        ownerId: id, ownerColor: p.color,
        angle: p.angle, lastShotTime: 0, createdAt: now, duration: turretDur,
      });
      break;
    }
    case 'ghost': {
      const cloakDur = CLOAK_DURATION + ampStacks * 2000;
      p.cloaked = true; p.cloakEnd = now + cloakDur;
      break;
    }
  }
}

function resolvePlayerWalls(p) {
  const walls = getAllWalls();
  for (const wall of walls) {
    const nx = Math.max(wall.x, Math.min(p.x, wall.x+wall.w));
    const ny = Math.max(wall.y, Math.min(p.y, wall.y+wall.h));
    const dx = p.x-nx, dy = p.y-ny;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < PLAYER_R && dist > 0.001) {
      const ov = PLAYER_R - dist;
      p.x += (dx/dist)*ov; p.y += (dy/dist)*ov;
    } else if (dist < 0.001) {
      const tL = p.x-wall.x, tR = wall.x+wall.w-p.x, tT = p.y-wall.y, tB = wall.y+wall.h-p.y;
      const m = Math.min(tL, tR, tT, tB);
      if (m===tL) p.x=wall.x-PLAYER_R; else if (m===tR) p.x=wall.x+wall.w+PLAYER_R;
      else if (m===tT) p.y=wall.y-PLAYER_R; else p.y=wall.y+wall.h+PLAYER_R;
    }
  }
}

function triggerExplosion(x, y, ownerId, now, radius, dmg) {
  radius = radius || EXPLOSION_RADIUS;
  dmg = dmg || EXPLOSION_DMG;
  gameState.explosions.push({ x, y, time: now });
  for (const pid in gameState.players) {
    const p = gameState.players[pid];
    if (!p.alive) continue;
    if (p.dashing && now < p.dashEnd) continue;
    if (p.spawnShieldEnd && now < p.spawnShieldEnd) continue;
    const dx = p.x-x, dy = p.y-y, dist = Math.sqrt(dx*dx+dy*dy);
    if (dist < radius) {
      let rawDmg = Math.round(dmg * (1 - dist/radius));
      if (p.buffs.blast_resistant) rawDmg = Math.round(rawDmg * Math.pow(0.70, p.buffs.blast_resistant));
      const bs = getBuffStats(p);
      rawDmg = Math.round(rawDmg * (1 - bs.dmgReduction));
      applyDamageToPlayer(p, pid, rawDmg, ownerId, 'explosive', now);
    }
  }
}

function applyDamageToPlayer(p, pid, damage, attackerId, weapon, now) {
  if (!p.alive) return;
  // Dodge Roll check
  if (p.buffs.dodge_roll && weapon !== 'explosive') {
    const dodgeChance = 1 - Math.pow(0.88, p.buffs.dodge_roll);
    if (Math.random() < dodgeChance) return;
  }
  // Bullet Sponge - consecutive hits deal less
  if (p.buffs.bullet_sponge && attackerId) {
    if (p.consecutiveHitTimer && now - p.consecutiveHitTimer < 2000) {
      p.consecutiveHitCount = Math.min(4 * p.buffs.bullet_sponge, p.consecutiveHitCount + 1);
    } else {
      p.consecutiveHitCount = 0;
    }
    p.consecutiveHitTimer = now;
    damage = Math.round(damage * (1 - p.consecutiveHitCount * 0.10));
  }
  // Energy Shield absorbs first
  if (p.shieldHp > 0) {
    const absorbed = Math.min(p.shieldHp, damage);
    p.shieldHp -= absorbed;
    damage -= absorbed;
    p.shieldRegenTime = now + 5000;
  }
  p.hp -= damage;
  p.lastDamageTaken = now;
  // Thorn Armor - reflect damage
  if (p.buffs.thorn_armor && attackerId && gameState.players[attackerId] && attackerId !== pid) {
    const reflect = Math.round(damage * 0.20 * p.buffs.thorn_armor);
    if (reflect > 0) {
      const attacker = gameState.players[attackerId];
      attacker.hp -= reflect;
      if (attacker.hp <= 0 && attacker.alive) killPlayer(attacker, attackerId, pid, 'thorns', now);
    }
  }
  // Second Wind - survive fatal hit
  if (p.hp <= 0 && p.alive && p.buffs.second_wind && !p.secondWindUsed) {
    p.hp = 1;
    p.secondWindUsed = true;
    p.spawnShieldEnd = now + 3000;
    return;
  }
  if (p.hp <= 0 && p.alive) {
    killPlayer(p, pid, attackerId, weapon, now);
  }
}

function killPlayer(p, pid, killerId, weapon, now) {
  p.alive = false; p.deaths++;
  p.gotKillThisLife = p.killsThisLife > 0;
  p.killsThisLife = 0;
  p.respawnTimer = now + getRespawnTime(p);
  p.cloaked = false; p.dashing = false;
  p.secondWindUsed = false;
  p.slowEnd = 0;
  p.bleedEffects = [];
  p.consecutiveHitCount = 0;
  resetPlayerWeapon(p);
  if (killerId && gameState.players[killerId] && killerId !== pid) {
    const killer = gameState.players[killerId];
    killer.kills++;
    killer.killsThisLife++;
    gameState.killEvents.push({ killerId, killer: killer.name, victim: p.name, weapon });
    // Adrenaline Rush
    if (killer.buffs.adrenaline_rush) {
      killer.adrenalineEnd = now + 4000 * killer.buffs.adrenaline_rush;
    }
    // Vampiric Rounds bonus on kill (none - vampiric is on-hit only)
    // Scavenger - drop health pack
    if (killer.buffs.scavenger) {
      const healAmt = 25 * killer.buffs.scavenger;
      gameState.pickups.push({
        id: gameState.pickups.length + 1000 + Math.floor(Math.random()*9000),
        x: p.x, y: p.y, type: 'health', active: true, respawnTime: 0,
        scavengerHeal: healAmt, scavengerExpire: now + 10000,
      });
    }
  }
}

function resetPlayerWeapon(p) {
  p.weapon = 'pistol'; p.ammo = WEAPONS.pistol.clip; p.reserveAmmo = Infinity;
  p.reloading = false; p.ammoMod = null;
}

function applyPickup(p, pickup) {
  switch (pickup.type) {
    case 'health': p.hp = Math.min(p.maxHp, p.hp + (pickup.scavengerHeal || 50)); break;
    case 'shotgun': case 'smg': case 'sniper':
      if (p.weapon === pickup.type) { p.reserveAmmo = WEAPONS[pickup.type].reserveAmmo; }
      else { p.weapon = pickup.type; p.ammo = WEAPONS[pickup.type].clip; p.reserveAmmo = WEAPONS[pickup.type].reserveAmmo; p.reloading = false; p.ammoMod = null; }
      break;
    case 'piercing': case 'explosive': p.ammoMod = pickup.type; break;
  }
}

function updateGame() {
  const now = Date.now();
  gameState.killEvents = [];
  gameState.explosions = gameState.explosions.filter(e => now - e.time < EXPLOSION_DURATION);

  // Expire shield walls
  gameState.shieldWalls = gameState.shieldWalls.filter(sw => now - sw.createdAt < sw.duration);

  // Respawn pickups
  for (const pk of gameState.pickups) { if (!pk.active && now >= pk.respawnTime) pk.active = true; }

  // Update turrets
  for (let i = gameState.turrets.length - 1; i >= 0; i--) {
    const t = gameState.turrets[i];
    if (now - t.createdAt > t.duration || t.hp <= 0) { gameState.turrets.splice(i, 1); continue; }
    let nearest = null, nearDist = TURRET_RANGE;
    for (const [pid, pp] of Object.entries(gameState.players)) {
      if (pid === t.ownerId || !pp.alive || pp.cloaked) continue;
      const d = Math.sqrt((pp.x-t.x)**2 + (pp.y-t.y)**2);
      if (d < nearDist) { nearDist = d; nearest = pp; }
    }
    if (nearest) {
      t.angle = Math.atan2(nearest.y - t.y, nearest.x - t.x);
      if (now - t.lastShotTime > TURRET_FIRE_RATE) {
        t.lastShotTime = now;
        const sa = t.angle + (Math.random()-0.5) * 0.04;
        gameState.bullets.push({
          id: gameState.bulletIdCounter++, ownerId: t.ownerId,
          x: t.x + Math.cos(t.angle)*15, y: t.y + Math.sin(t.angle)*15,
          vx: Math.cos(sa)*WEAPONS.turret.speed, vy: Math.sin(sa)*WEAPONS.turret.speed,
          createdAt: now, weapon: 'turret', bounces: 0, pierce: false, ammoMod: null, hitPlayers: [],
        });
      }
    }
  }

  // Update players
  for (const id in gameState.players) {
    const p = gameState.players[id];
    if (!p.alive) {
      if (p.respawnTimer && now >= p.respawnTimer && !p.pendingBuffChoices) {
        // Timer expired — generate buff choices instead of respawning
        p.pendingBuffChoices = generateBuffChoices(p.gotKillThisLife);
        p.respawnTimer = 0;
      }
      // If buff has been selected (pendingBuffChoices cleared by selectBuff handler), respawn
      if (p.pendingBuffChoices === 'done') {
        const sp = safeSpawnPos();
        p.x = sp.x; p.y = sp.y; p.hp = p.maxHp; p.alive = true;
        p.pendingBuffChoices = null;
        resetPlayerWeapon(p);
        p.cloaked = false; p.dashing = false;
        p.secondWindUsed = false;
        p.abilityCdStart = -99999;
        p.slowEnd = 0; p.bleedEffects = [];
        p.consecutiveHitCount = 0;
        // Spawn Shield
        if (p.buffs.spawn_shield) p.spawnShieldEnd = now + 2500 * p.buffs.spawn_shield;
        // Field Medic - heal nearby allies
        if (p.buffs.field_medic) {
          const healAmt = 30 * p.buffs.field_medic;
          for (const oid in gameState.players) {
            if (oid === id) continue;
            const op = gameState.players[oid];
            if (!op.alive) continue;
            const d = Math.sqrt((op.x - p.x)**2 + (op.y - p.y)**2);
            if (d < 200) op.hp = Math.min(op.maxHp, op.hp + healAmt);
          }
        }
        // Shield regen on spawn
        if (p.shieldMax > 0) { p.shieldHp = p.shieldMax; p.shieldRegenTime = 0; }
      }
      continue;
    }

    // Compute buff stats for this player
    const bs = getBuffStats(p);

    // Expire cloak
    if (p.cloaked && now >= p.cloakEnd) p.cloaked = false;
    // Expire dash invuln
    if (p.dashing && now >= p.dashEnd) p.dashing = false;

    // Reload
    if (p.reloading) {
      const rwep = WEAPONS[p.weapon];
      const effectiveReloadTime = rwep.reloadTime * bs.reloadMult;
      if (now - p.reloadStart >= effectiveReloadTime) {
        p.reloading = false;
        const effectiveClipR = Math.round(rwep.clip * bs.clipMult);
        if (rwep.infinite) { p.ammo = effectiveClipR; }
        else { const n = Math.min(effectiveClipR - p.ammo, p.reserveAmmo); p.ammo += n; p.reserveAmmo -= n; }
        p.ammoMod = null;
      }
    }

    // Movement
    let dx = 0, dy = 0;
    if (p.input.up) dy -= 1; if (p.input.down) dy += 1;
    if (p.input.left) dx -= 1; if (p.input.right) dx += 1;
    if (dx || dy) {
      const len = Math.sqrt(dx*dx + dy*dy);
      const effectiveSpeed = p.speed * bs.speedMult;
      dx = (dx/len) * effectiveSpeed; dy = (dy/len) * effectiveSpeed;
      p.x += dx; p.y += dy;
      p.lastMoveTime = now;
    }
    resolvePlayerWalls(p);
    p.x = Math.max(PLAYER_R, Math.min(MAP_W - PLAYER_R, p.x));
    p.y = Math.max(PLAYER_R, Math.min(MAP_H - PLAYER_R, p.y));

    // Shooting (breaks cloak)
    const wep = WEAPONS[p.weapon];
    const effectiveCooldown = wep.cooldown / bs.fireRateMult;
    const effectiveClip = Math.round(wep.clip * bs.clipMult);
    if (p.shooting && !p.reloading && p.ammo > 0 && now - p.lastShotTime >= effectiveCooldown) {
      if (p.cloaked) p.cloaked = false;
      p.lastShotTime = now;
      const bulletSpeed = wep.speed * bs.bulletSpeedMult;
      const bulletBounces = wep.bounces + bs.extraBounces;
      const hasShrapnel = !!(p.buffs.shrapnel);
      const shotsToFire = 1 + ((p.buffs.double_tap && Math.random() < 0.15 * p.buffs.double_tap) ? 1 : 0);
      for (let shot = 0; shot < shotsToFire && p.ammo > 0; shot++) {
        for (let j = 0; j < wep.projectiles; j++) {
          const sa = p.angle + (wep.spread > 0 ? (Math.random()-0.5)*wep.spread*2 : 0);
          gameState.bullets.push({
            id: gameState.bulletIdCounter++, ownerId: id,
            x: p.x + Math.cos(p.angle)*(PLAYER_R+8), y: p.y + Math.sin(p.angle)*(PLAYER_R+8),
            vx: Math.cos(sa)*bulletSpeed, vy: Math.sin(sa)*bulletSpeed,
            createdAt: now, weapon: p.weapon, bounces: bulletBounces,
            pierce: !!wep.pierce || p.ammoMod === 'piercing', ammoMod: p.ammoMod, hitPlayers: [],
            shrapnel: hasShrapnel,
          });
        }
        if (shot === 0) p.ammo--;
      }
      if (p.ammo <= 0) {
        if (wep.infinite || p.reserveAmmo > 0) { p.reloading = true; p.reloadStart = now; }
        else resetPlayerWeapon(p);
      }
    }

    // Pickup collection
    for (let pki = gameState.pickups.length - 1; pki >= 0; pki--) {
      const pk = gameState.pickups[pki];
      if (!pk.active) continue;
      // Remove expired scavenger pickups
      if (pk.scavengerExpire && now > pk.scavengerExpire) {
        gameState.pickups.splice(pki, 1); continue;
      }
      const pickupRange = PICKUP_RADIUS + PLAYER_R + (pk.type === 'health' && p.buffs.medics_instinct ? PICKUP_RADIUS * 0.5 * p.buffs.medics_instinct : 0);
      if (Math.sqrt((p.x-pk.x)**2 + (p.y-pk.y)**2) < pickupRange) {
        if (pk.type === 'health' && p.buffs.medics_instinct) {
          const healAmt = pk.scavengerHeal || 50;
          p.hp = Math.min(p.maxHp, p.hp + Math.round(healAmt * (1 + 0.50 * p.buffs.medics_instinct)));
        } else {
          applyPickup(p, pk);
        }
        if (pk.scavengerExpire) { gameState.pickups.splice(pki, 1); }
        else { pk.active = false; pk.respawnTime = now + PICKUP_RESPAWN; }
        break;
      }
    }

    // === PASSIVE BUFF EFFECTS ===
    // Regeneration
    if (p.buffs.regeneration && p.hp < p.maxHp) {
      if (!p.lastRegenTick || now - p.lastRegenTick >= 1000) {
        p.hp = Math.min(p.maxHp, p.hp + 2 * p.buffs.regeneration);
        p.lastRegenTick = now;
      }
    }
    // Energy Shield regen
    if (p.shieldMax > 0 && p.shieldHp < p.shieldMax) {
      if (p.shieldRegenTime && now >= p.shieldRegenTime) {
        p.shieldHp = Math.min(p.shieldMax, p.shieldHp + 1);
      }
    }
    // Bleed effects
    for (let bi = p.bleedEffects.length - 1; bi >= 0; bi--) {
      const bleed = p.bleedEffects[bi];
      if (now > bleed.endTime) { p.bleedEffects.splice(bi, 1); continue; }
      if (!bleed.lastTick || now - bleed.lastTick >= 1000) {
        p.hp -= bleed.dps;
        bleed.lastTick = now;
        if (p.hp <= 0 && p.alive) killPlayer(p, id, bleed.attackerId, 'bleed', now);
      }
    }
    // Spawn shield expire
    if (p.spawnShieldEnd && now >= p.spawnShieldEnd) p.spawnShieldEnd = 0;
    // Hollow Points slow expire handled in getBuffStats
  }

  // Update bullets
  const allWalls = getAllWalls();
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const b = gameState.bullets[i];
    b.x += b.vx; b.y += b.vy;

    if (b.x < 0 || b.x > MAP_W || b.y < 0 || b.y > MAP_H || now - b.createdAt > WEAPONS[b.weapon].lifetime) {
      gameState.bullets.splice(i, 1); continue;
    }

    // Wall collision
    let hitWall = false;
    for (const wall of allWalls) {
      if (pointInRect(b.x, b.y, wall)) {
        if (b.bounces > 0) {
          b.bounces--;
          const oL = b.x-wall.x, oR = wall.x+wall.w-b.x, oT = b.y-wall.y, oB = wall.y+wall.h-b.y;
          const m = Math.min(oL, oR, oT, oB);
          if (m===oL||m===oR) { b.vx=-b.vx; b.x = m===oL ? wall.x-1 : wall.x+wall.w+1; }
          else { b.vy=-b.vy; b.y = m===oT ? wall.y-1 : wall.y+wall.h+1; }
        } else {
          if (b.ammoMod === 'explosive') triggerExplosion(b.x, b.y, b.ownerId, now);
          if (b.shrapnel) triggerExplosion(b.x, b.y, b.ownerId, now, SHRAPNEL_RADIUS, SHRAPNEL_DMG);
          gameState.bullets.splice(i, 1); hitWall = true;
        }
        break;
      }
    }
    if (hitWall) continue;

    // Player collision
    let removed = false;
    for (const pid in gameState.players) {
      if (pid === b.ownerId || b.hitPlayers.includes(pid)) continue;
      const p = gameState.players[pid];
      if (!p.alive) continue;
      if (p.dashing && now < p.dashEnd) continue;
      if (p.spawnShieldEnd && now < p.spawnShieldEnd) continue;
      if (Math.sqrt((p.x-b.x)**2 + (p.y-b.y)**2) < PLAYER_R + BULLET_R) {
        const owner = gameState.players[b.ownerId];
        const ownerBs = owner ? getBuffStats(owner) : { damageMult: 1.0 };
        let rawDmg = Math.round(WEAPONS[b.weapon].damage * ownerBs.damageMult);
        const bs2 = getBuffStats(p);
        rawDmg = Math.round(rawDmg * (1 - bs2.dmgReduction));
        if (b.ammoMod === 'explosive') triggerExplosion(b.x, b.y, b.ownerId, now);
        // On-hit buff effects from shooter
        if (owner) {
          // Vampiric Rounds
          if (owner.buffs.vampiric_rounds) {
            const heal = Math.round(rawDmg * 0.15 * owner.buffs.vampiric_rounds);
            owner.hp = Math.min(owner.maxHp, owner.hp + heal);
          }
          // Hollow Points - slow
          if (owner.buffs.hollow_points) {
            p.slowEnd = now + 1500 * owner.buffs.hollow_points;
          }
          // Tracker Rounds
          if (owner.buffs.tracker_rounds) {
            p.trackedUntil = now + 3000 * owner.buffs.tracker_rounds;
          }
          // Bleed Out
          if (owner.buffs.bleed_out) {
            p.bleedEffects.push({
              dps: 4 * owner.buffs.bleed_out,
              endTime: now + 3000,
              attackerId: b.ownerId,
              lastTick: 0,
            });
          }
          // Chain Lightning
          if (owner.buffs.chain_lightning) {
            let sparks = owner.buffs.chain_lightning;
            const hitSet = new Set([pid, b.ownerId]);
            for (const eid in gameState.players) {
              if (sparks <= 0) break;
              if (hitSet.has(eid)) continue;
              const ep = gameState.players[eid];
              if (!ep.alive) continue;
              const d = Math.sqrt((ep.x - p.x)**2 + (ep.y - p.y)**2);
              if (d < CHAIN_LIGHTNING_RANGE) {
                applyDamageToPlayer(ep, eid, CHAIN_LIGHTNING_DMG, b.ownerId, 'chain_lightning', now);
                hitSet.add(eid);
                sparks--;
              }
            }
          }
        }
        applyDamageToPlayer(p, pid, rawDmg, b.ownerId, b.weapon, now);
        if (b.pierce) { b.hitPlayers.push(pid); } else { gameState.bullets.splice(i, 1); removed = true; }
        break;
      }
    }
    if (removed) continue;

    // Turret collision
    for (const t of gameState.turrets) {
      if (b.ownerId === t.ownerId) continue;
      if (Math.sqrt((t.x-b.x)**2 + (t.y-b.y)**2) < TURRET_R + BULLET_R) {
        t.hp -= WEAPONS[b.weapon].damage;
        if (b.ammoMod === 'explosive') triggerExplosion(b.x, b.y, b.ownerId, now);
        if (!b.pierce) { gameState.bullets.splice(i, 1); removed = true; }
        break;
      }
    }
  }
}

function handleSelectBuff(pid, buffId) {
  if (!gameState || !gameState.players[pid]) return;
  const p = gameState.players[pid];
  if (!Array.isArray(p.pendingBuffChoices) || !p.pendingBuffChoices.includes(buffId)) return;
  applyBuff(p, buffId);
  p.pendingBuffChoices = 'done'; // signal to respawn on next tick
}

function getSnapshot() {
  const now = Date.now();
  const players = {};
  for (const [id, p] of Object.entries(gameState.players)) {
    const cls = CLASS_DEFS[p.playerClass];
    const bs = getBuffStats(p);
    const effectiveCd = cls.cooldown * bs.abilityCdMult;
    const cdElapsed = now - p.abilityCdStart;
    players[id] = {
      x: p.x, y: p.y, angle: p.angle,
      hp: p.hp, maxHp: p.maxHp, alive: p.alive,
      name: p.name, color: p.color,
      playerClass: p.playerClass,
      kills: p.kills, deaths: p.deaths,
      weapon: p.weapon, ammo: p.ammo,
      reserveAmmo: p.reserveAmmo === Infinity ? -1 : p.reserveAmmo,
      reloading: p.reloading,
      reloadPct: p.reloading ? Math.min(1, (now - p.reloadStart) / (WEAPONS[p.weapon].reloadTime * bs.reloadMult)) : 0,
      ammoMod: p.ammoMod,
      abilityReady: cdElapsed >= effectiveCd,
      abilityCdPct: Math.min(1, cdElapsed / effectiveCd),
      cloaked: p.cloaked,
      dashing: p.dashing,
      // Buff data
      buffs: { ...p.buffs },
      buffChoices: Array.isArray(p.pendingBuffChoices) ? p.pendingBuffChoices : null,
      buffChoicesOffensive: p.gotKillThisLife,
      shieldHp: p.shieldHp,
      shieldMax: p.shieldMax,
      spawnShielded: p.spawnShieldEnd && now < p.spawnShieldEnd,
      tracked: p.trackedUntil && now < p.trackedUntil,
    };
  }
  return {
    players,
    bullets: gameState.bullets.map(b => ({ id: b.id, x: b.x, y: b.y, ownerId: b.ownerId, weapon: b.weapon, ammoMod: b.ammoMod })),
    pickups: gameState.pickups.map(p => ({ id: p.id, x: p.x, y: p.y, type: p.type, active: p.active })),
    explosions: gameState.explosions.map(e => ({ x: e.x, y: e.y, age: now - e.time })),
    turrets: gameState.turrets.map(t => ({ id: t.id, x: t.x, y: t.y, hp: t.hp, maxHp: t.maxHp, ownerId: t.ownerId, ownerColor: t.ownerColor, angle: t.angle })),
    shieldWalls: gameState.shieldWalls.map(s => ({ id: s.id, x: s.x, y: s.y, w: s.w, h: s.h, ownerId: s.ownerId })),
    killEvents: gameState.killEvents,
  };
}

// ========================
// GAME START / STOP
// ========================
function startGameHost() {
  gameState = createGameState();
  gameRunning = true; killNotifications = [];
  for (const conn of Object.values(hostConns)) { try { conn.send({ type: 'gameStarted' }); } catch(e) {} }

  gameLoopInterval = setInterval(() => {
    const me = gameState.players['0'];
    if (me) {
      me.input = { ...keys };
      me.angle = Math.atan2(mouseY - canvas.height/2, mouseX - canvas.width/2);
      me.shooting = mouseDown;
    }
    updateBots(Date.now());
    updateGame();
    snapshot = getSnapshot();
    // Host buff picker state
    if (snapshot.players['0']) {
      buffPickerChoices = snapshot.players['0'].buffChoices || null;
    }
    if (snapshot.killEvents) {
      for (const ev of snapshot.killEvents) killNotifications.push({ text: `${ev.killer} killed ${ev.victim}`, time: Date.now(), isMyKill: ev.killerId === '0' });
    }
    const msg = { type: 'state', ...snapshot };
    for (const conn of Object.values(hostConns)) { try { conn.send(msg); } catch(e) {} }
  }, 1000 / TICK_RATE);

  showScreen('game'); resizeCanvas(); requestAnimationFrame(renderLoop);
}

function startGameClient() {
  gameRunning = true; killNotifications = [];
  inputInterval = setInterval(() => {
    if (!hostConn || !hostConn.open) return;
    hostConn.send({ type: 'input', keys: { ...keys }, angle: Math.atan2(mouseY - canvas.height/2, mouseX - canvas.width/2), shooting: mouseDown });
  }, 1000 / TICK_RATE);
  showScreen('game'); resizeCanvas(); requestAnimationFrame(renderLoop);
}

function cleanupGame() {
  gameRunning = false;
  if (gameLoopInterval) { clearInterval(gameLoopInterval); gameLoopInterval = null; }
  if (inputInterval) { clearInterval(inputInterval); inputInterval = null; }
  for (const conn of Object.values(hostConns)) { try { conn.close(); } catch(e) {} }
  if (hostConn) { try { hostConn.close(); } catch(e) {} }
  if (peer) { try { peer.destroy(); } catch(e) {} }
  hostConns = {}; lobbyPlayers = {}; gameState = null; snapshot = null;
  hostConn = null; peer = null; myPlayerId = null; isHost = false; nextPlayerId = 1;
  keys = { up: false, down: false, left: false, right: false }; mouseDown = false;
  killNotifications = [];
  buffPickerChoices = null;
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
      if (isHost && gameState) { const me = gameState.players['0']; if (me && me.alive) tryReload(me, Date.now()); }
      else if (hostConn && hostConn.open) hostConn.send({ type: 'reload' });
      break;
    case ' ':
      e.preventDefault();
      if (isHost && gameState) { const me = gameState.players['0']; if (me) activateAbility(me, '0', Date.now()); }
      else if (hostConn && hostConn.open) hostConn.send({ type: 'ability' });
      break;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w': keys.up = false; break; case 's': keys.down = false; break;
    case 'a': keys.left = false; break; case 'd': keys.right = false; break;
  }
});
window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mousedown', (e) => { if (currentScreen === 'game' && e.button === 0 && !buffPickerChoices) mouseDown = true; });
window.addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });
window.addEventListener('contextmenu', (e) => { if (currentScreen === 'game') e.preventDefault(); });

// ========================
// RENDERING
// ========================
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; mmCanvas.width = 140; mmCanvas.height = 140; }
window.addEventListener('resize', resizeCanvas);

function renderLoop() { if (!gameRunning) return; render(); renderMinimap(); renderHUD(); requestAnimationFrame(renderLoop); }

function render() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!snapshot) return;
  const me = snapshot.players[myPlayerId];
  if (!me) return;
  camera.x = me.x - W/2; camera.y = me.y - H/2;

  ctx.fillStyle = '#111122'; ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#1a1a35'; ctx.lineWidth = 1;
  for (let x = -(camera.x % 50); x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = -(camera.y % 50); y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
  ctx.strokeRect(-camera.x, -camera.y, MAP_W, MAP_H);

  // Walls
  for (const wall of WALLS) {
    const wx = wall.x - camera.x, wy = wall.y - camera.y;
    if (wx+wall.w < -10 || wx > W+10 || wy+wall.h < -10 || wy > H+10) continue;
    ctx.fillStyle = '#2a2a45'; ctx.fillRect(wx, wy, wall.w, wall.h);
    ctx.strokeStyle = '#3d3d5c'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, wall.w, wall.h);
  }

  // Shield walls
  if (snapshot.shieldWalls) {
    for (const sw of snapshot.shieldWalls) {
      const sx = sw.x - camera.x, sy = sw.y - camera.y;
      if (sx+sw.w < -10 || sx > W+10 || sy+sw.h < -10 || sy > H+10) continue;
      const pulse = 0.3 + Math.sin(Date.now()/200) * 0.1;
      ctx.fillStyle = `rgba(52, 152, 219, ${pulse})`;
      ctx.fillRect(sx, sy, sw.w, sw.h);
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
      ctx.lineWidth = 2; ctx.strokeRect(sx, sy, sw.w, sw.h);
    }
  }

  // Pickups
  if (snapshot.pickups) {
    const bobT = Date.now() / 300;
    for (const pk of snapshot.pickups) {
      if (!pk.active) continue;
      const sx = pk.x - camera.x, sy = pk.y - camera.y + Math.sin(bobT + pk.id) * 3;
      if (sx < -30 || sx > W+30 || sy < -30 || sy > H+30) continue;
      renderPickup(sx, sy, pk.type);
    }
  }

  // Explosions
  if (snapshot.explosions) {
    for (const e of snapshot.explosions) {
      const sx = e.x - camera.x, sy = e.y - camera.y;
      if (sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const pct = Math.min(1, e.age / EXPLOSION_DURATION);
      const r = 10 + 50 * pct, a = (1-pct) * 0.6;
      ctx.fillStyle = `rgba(255,150,0,${a})`; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = `rgba(255,220,50,${a})`; ctx.lineWidth = 2; ctx.stroke();
      if (e.age < 100) { ctx.fillStyle = `rgba(255,255,200,${(1-e.age/100)*0.7})`; ctx.beginPath(); ctx.arc(sx, sy, 15, 0, Math.PI*2); ctx.fill(); }
    }
  }

  // Turrets
  if (snapshot.turrets) {
    for (const t of snapshot.turrets) {
      const sx = t.x - camera.x, sy = t.y - camera.y;
      if (sx < -30 || sx > W+30 || sy < -30 || sy > H+30) continue;
      ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(sx, sy, TURRET_R, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = t.ownerColor || '#ff9f43'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = t.ownerColor || '#ff9f43'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(t.angle)*18, sy + Math.sin(t.angle)*18); ctx.stroke();
      const hp = t.hp / t.maxHp;
      ctx.fillStyle = '#333'; ctx.fillRect(sx-12, sy-18, 24, 3);
      ctx.fillStyle = hp > 0.5 ? '#2ecc71' : '#e74c3c'; ctx.fillRect(sx-12, sy-18, 24*hp, 3);
    }
  }

  // Bullets
  for (const b of snapshot.bullets) {
    const sx = b.x - camera.x, sy = b.y - camera.y;
    if (sx < -10 || sx > W+10 || sy < -10 || sy > H+10) continue;
    const st = getBulletStyle(b);
    ctx.fillStyle = st.color; ctx.shadowColor = st.color; ctx.shadowBlur = st.glow;
    ctx.beginPath(); ctx.arc(sx, sy, st.radius, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
  }

  // Players
  const myData = snapshot.players[myPlayerId];
  for (const [id, p] of Object.entries(snapshot.players)) {
    if (!p.alive) {
      // Tracker Rounds: show tracked dead? No - skip dead players
      continue;
    }
    const sx = p.x - camera.x, sy = p.y - camera.y;
    const isMe = id === myPlayerId;
    const offScreen = sx < -50 || sx > W+50 || sy < -50 || sy > H+50;

    // Tracker Rounds: render through walls if tracked and off-screen or behind walls
    if (!isMe && p.tracked && myData && myData.buffs && myData.buffs.tracker_rounds) {
      // Always render tracked enemies even if off-screen, as an indicator
      if (offScreen) {
        // Draw directional indicator at edge of screen
        const dx = p.x - (myData.x || 0), dy = p.y - (myData.y || 0);
        const angle = Math.atan2(dy, dx);
        const edgeX = W/2 + Math.cos(angle) * (W/2 - 40);
        const edgeY = H/2 + Math.sin(angle) * (H/2 - 40);
        ctx.fillStyle = 'rgba(155, 89, 182, 0.6)';
        ctx.beginPath(); ctx.arc(edgeX, edgeY, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.name, edgeX, edgeY - 10);
        continue;
      }
    } else if (offScreen) {
      continue;
    }

    // Cloak handling
    if (p.cloaked) {
      ctx.globalAlpha = isMe ? 0.3 : 0.05;
      if (!isMe && ctx.globalAlpha < 0.06) { ctx.globalAlpha = 1; continue; }
    }

    // Spawn shield glow
    if (p.spawnShielded) {
      ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
      ctx.beginPath(); ctx.arc(sx, sy, PLAYER_R + 8, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, PLAYER_R + 8, 0, Math.PI*2); ctx.stroke();
    }

    // Dash visual
    if (p.dashing) {
      ctx.globalAlpha = Math.max(ctx.globalAlpha, 0.4);
      ctx.strokeStyle = p.color; ctx.lineWidth = 1;
      for (let d = 1; d <= 3; d++) {
        ctx.globalAlpha *= 0.5;
        ctx.beginPath(); ctx.arc(sx - Math.cos(p.angle)*d*12, sy - Math.sin(p.angle)*d*12, PLAYER_R, 0, Math.PI*2); ctx.stroke();
      }
      ctx.globalAlpha = p.cloaked ? (isMe ? 0.3 : 0.05) : 1;
    }

    // Energy Shield visual
    if (p.shieldHp > 0 && p.shieldMax > 0) {
      const shieldPct = p.shieldHp / p.shieldMax;
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.3 + shieldPct * 0.4})`;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, PLAYER_R + 5, 0, Math.PI*2); ctx.stroke();
    }

    // Body
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(sx, sy, PLAYER_R, 0, Math.PI*2); ctx.fill();
    if (isMe) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, PLAYER_R+2, 0, Math.PI*2); ctx.stroke(); }

    // Gun barrel
    const wepColors = { pistol: '#ccc', shotgun: '#ff6b35', smg: '#ffd700', sniper: '#00ffff', turret: '#ff9f43' };
    ctx.strokeStyle = wepColors[p.weapon] || '#ccc';
    ctx.lineWidth = p.weapon === 'sniper' ? 3 : 5; ctx.lineCap = 'round';
    const bLen = p.weapon === 'sniper' ? PLAYER_R+18 : PLAYER_R+12;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(p.angle)*bLen, sy + Math.sin(p.angle)*bLen); ctx.stroke();

    // Name + class
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.name, sx, sy - PLAYER_R - 14);
    ctx.fillStyle = '#888'; ctx.font = '9px sans-serif';
    ctx.fillText(CLASS_DEFS[p.playerClass].name, sx, sy - PLAYER_R - 4);

    // Health bar (others)
    if (!isMe) {
      const bw = 36, bh = 4, bx = sx-bw/2, by = sy + PLAYER_R + 6;
      ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
      const hp = Math.max(0, p.hp / p.maxHp);
      ctx.fillStyle = hp > 0.5 ? '#2ecc71' : hp > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(bx, by, bw*hp, bh);
      // Shield bar (others)
      if (p.shieldMax > 0) {
        ctx.fillStyle = '#222'; ctx.fillRect(bx, by + bh + 1, bw, 2);
        ctx.fillStyle = '#00d4ff'; ctx.fillRect(bx, by + bh + 1, bw * (p.shieldHp / p.shieldMax), 2);
      }
    }

    ctx.globalAlpha = 1;
  }
}

function getBulletStyle(b) {
  const owner = snapshot.players[b.ownerId];
  let color = owner ? owner.color : '#fff', radius = 4, glow = 8;
  if (b.ammoMod === 'explosive') { color = '#ff4444'; glow = 12; }
  else if (b.ammoMod === 'piercing') { color = '#a855f7'; glow = 10; }
  const wep = WEAPONS[b.weapon];
  if (wep && wep.bulletColor && !b.ammoMod) color = wep.bulletColor;
  if (b.weapon === 'sniper') { radius = 5; glow = 14; }
  else if (b.weapon === 'shotgun') { radius = 3; }
  else if (b.weapon === 'turret') { radius = 3; glow = 6; }
  return { color, radius, glow };
}

const PICKUP_COLORS = { health: '#2ecc71', shotgun: '#ff6b35', smg: '#ffd700', sniper: '#00ffff', piercing: '#a855f7', explosive: '#ff4444' };

function renderPickup(sx, sy, type) {
  const color = PICKUP_COLORS[type] || '#fff';
  ctx.globalAlpha = 0.25; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
  if (type === 'health') {
    ctx.fillStyle = color; ctx.fillRect(sx-7, sy-2, 14, 4); ctx.fillRect(sx-2, sy-7, 4, 14);
  } else if (type === 'piercing' || type === 'explosive') {
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(sx, sy-10); ctx.lineTo(sx+8, sy); ctx.lineTo(sx, sy+10); ctx.lineTo(sx-8, sy);
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(type === 'piercing' ? 'P' : 'E', sx, sy);
  } else {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(type[0].toUpperCase(), sx, sy);
  }
}

function renderMinimap() {
  const mw = mmCanvas.width, mh = mmCanvas.height;
  mmCtx.clearRect(0, 0, mw, mh);
  mmCtx.fillStyle = 'rgba(10,10,26,0.8)'; mmCtx.fillRect(0, 0, mw, mh);
  if (!snapshot) return;
  const sx = mw/MAP_W, sy = mh/MAP_H;

  mmCtx.fillStyle = '#2a2a45';
  for (const w of WALLS) mmCtx.fillRect(w.x*sx, w.y*sy, Math.max(2, w.w*sx), Math.max(2, w.h*sy));

  // Shield walls on minimap
  if (snapshot.shieldWalls) {
    mmCtx.fillStyle = 'rgba(52,152,219,0.6)';
    for (const sw of snapshot.shieldWalls) mmCtx.fillRect(sw.x*sx, sw.y*sy, Math.max(2, sw.w*sx), Math.max(2, sw.h*sy));
  }

  // Turrets on minimap
  if (snapshot.turrets) {
    for (const t of snapshot.turrets) {
      mmCtx.fillStyle = t.ownerColor || '#ff9f43';
      mmCtx.fillRect(t.x*sx-2, t.y*sy-2, 4, 4);
    }
  }

  if (snapshot.pickups) {
    for (const pk of snapshot.pickups) {
      if (!pk.active) continue;
      mmCtx.fillStyle = PICKUP_COLORS[pk.type] || '#fff';
      mmCtx.fillRect(pk.x*sx-1, pk.y*sy-1, 3, 3);
    }
  }

  for (const [id, p] of Object.entries(snapshot.players)) {
    if (!p.alive || (p.cloaked && id !== myPlayerId)) continue;
    mmCtx.fillStyle = id === myPlayerId ? '#fff' : p.color;
    mmCtx.beginPath(); mmCtx.arc(p.x*sx, p.y*sy, id === myPlayerId ? 3 : 2, 0, Math.PI*2); mmCtx.fill();
  }

  mmCtx.strokeStyle = '#555'; mmCtx.lineWidth = 1;
  mmCtx.strokeRect(camera.x*sx, camera.y*sy, canvas.width*sx, canvas.height*sy);
}

function selectBuff(buffId) {
  if (isHost) {
    handleSelectBuff('0', buffId);
  } else if (hostConn && hostConn.open) {
    hostConn.send({ type: 'selectBuff', buffId });
  }
  buffPickerChoices = null;
}

let _lastBuffPickerKey = null;
function renderBuffPicker() {
  const el = $('buffSelection');
  if (!buffPickerChoices || !snapshot || !snapshot.players[myPlayerId]) {
    el.style.display = 'none';
    _lastBuffPickerKey = null;
    return;
  }
  const me = snapshot.players[myPlayerId];
  if (me.alive) { el.style.display = 'none'; _lastBuffPickerKey = null; return; }

  // Only rebuild DOM when choices change
  const key = buffPickerChoices.join(',');
  if (key === _lastBuffPickerKey) { el.style.display = 'flex'; return; }
  _lastBuffPickerKey = key;

  el.style.display = 'flex';
  const isOffensive = me.buffChoicesOffensive;
  const subtitle = isOffensive ? 'OFFENSIVE POWER' : 'DEFENSIVE POWER';
  const subtitleColor = isOffensive ? '#e74c3c' : '#3498db';

  let cardsHtml = `<div class="buff-title">CHOOSE A BUFF</div>`;
  cardsHtml += `<div class="buff-subtitle" style="color:${subtitleColor}">${subtitle}</div>`;
  cardsHtml += `<div class="buff-cards">`;
  for (const buffId of buffPickerChoices) {
    const def = BUFF_DEFS[buffId];
    if (!def) continue;
    const stacks = (me.buffs && me.buffs[buffId]) || 0;
    const stackBadge = stacks > 0 ? `<div class="buff-stack-badge">x${stacks + 1}</div>` : '';
    const borderColor = isOffensive ? '#e74c3c' : '#3498db';
    cardsHtml += `<div class="buff-card" data-buff="${buffId}" style="border-color:${borderColor}">
      ${stackBadge}
      <div class="buff-card-name">${escapeHtml(def.name)}</div>
      <div class="buff-card-desc">${escapeHtml(def.desc)}</div>
      ${stacks > 0 ? `<div class="buff-card-stacked">OWNED x${stacks}</div>` : ''}
    </div>`;
  }
  cardsHtml += `</div>`;
  el.innerHTML = cardsHtml;

  // Attach click handlers after DOM is built
  el.querySelectorAll('.buff-card').forEach(card => {
    card.addEventListener('click', () => {
      selectBuff(card.dataset.buff);
    });
  });
}

function renderBuffBar() {
  const el = $('buffBar');
  if (!snapshot || !snapshot.players[myPlayerId]) { el.style.display = 'none'; return; }
  const me = snapshot.players[myPlayerId];
  if (!me.buffs || Object.keys(me.buffs).length === 0) { el.style.display = 'none'; return; }

  el.style.display = 'flex';
  let html = '';
  for (const [buffId, count] of Object.entries(me.buffs)) {
    if (!count || !BUFF_DEFS[buffId]) continue;
    const def = BUFF_DEFS[buffId];
    const isOff = def.type === 'offensive';
    const color = isOff ? '#e74c3c' : '#3498db';
    html += `<div class="buff-icon" style="border-color:${color}" title="${def.name}: ${def.desc}">
      <span class="buff-icon-letter" style="color:${color}">${def.name[0]}</span>
      ${count > 1 ? `<span class="buff-icon-count">${count}</span>` : ''}
    </div>`;
  }
  el.innerHTML = html;
}

function renderHUD() {
  if (!snapshot) return;
  const me = snapshot.players[myPlayerId];
  if (!me) return;

  const hpPct = Math.max(0, me.hp / me.maxHp);
  healthFill.style.width = (hpPct*100) + '%';
  healthFill.style.background = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';

  // Shield bar
  const shieldBarEl = $('shieldBar');
  if (me.shieldMax > 0) {
    shieldBarEl.style.display = 'block';
    $('shieldFill').style.width = ((me.shieldHp / me.shieldMax) * 100) + '%';
  } else {
    shieldBarEl.style.display = 'none';
  }

  // Death overlay vs buff picker
  if (!me.alive) {
    if (buffPickerChoices) {
      deathOverlay.style.display = 'none';
      renderBuffPicker();
    } else {
      deathOverlay.style.display = 'block';
      $('buffSelection').style.display = 'none';
    }
  } else {
    deathOverlay.style.display = 'none';
    $('buffSelection').style.display = 'none';
  }

  const wep = WEAPONS[me.weapon];
  weaponNameEl.textContent = wep.name;
  weaponNameEl.style.color = wep.bulletColor || '#ccc';
  ammoCountEl.textContent = `${me.ammo} / ${me.reserveAmmo === -1 ? '\u221E' : me.reserveAmmo}`;
  if (me.ammoMod) { ammoModEl.textContent = me.ammoMod.toUpperCase(); ammoModEl.style.color = me.ammoMod === 'piercing' ? '#a855f7' : '#ff4444'; }
  else ammoModEl.textContent = '';

  if (me.reloading) { reloadBarEl.style.display = 'block'; reloadFillEl.style.width = (me.reloadPct*100)+'%'; }
  else reloadBarEl.style.display = 'none';

  // Ability
  const cls = CLASS_DEFS[me.playerClass];
  abilityNameEl.textContent = cls.ability;
  abilityCdFillEl.style.width = (me.abilityCdPct * 100) + '%';
  abilityDisplayEl.className = me.abilityReady ? 'ready' : 'cooldown';
  abilityCdFillEl.style.background = me.abilityReady ? '#3498db' : '#555';

  // Buff bar
  renderBuffBar();

  // Scoreboard
  const sorted = Object.entries(snapshot.players).sort(([,a],[,b]) => b.kills-a.kills || a.deaths-b.deaths);
  scoreboardEl.innerHTML = `<div class="sb-header">Scoreboard</div>` +
    sorted.map(([id, p]) => {
      const buffCount = p.buffs ? Object.values(p.buffs).reduce((a,b)=>a+b,0) : 0;
      return `<div class="sb-row" style="${id===myPlayerId?'color:#fff;font-weight:600':''}">
      <span class="sb-name" style="color:${p.color}">${escapeHtml(p.name)}${buffCount ? ` <span style="color:#888;font-size:10px">[${buffCount}]</span>` : ''}</span>
      <span class="sb-kd">${p.kills}K / ${p.deaths}D</span>
    </div>`;
    }).join('');

  const now = Date.now();
  killNotifications = killNotifications.filter(n => now - n.time < 3500);
  killFeedEl.innerHTML = killNotifications.map(n => {
    const age = now - n.time, op = age > 2500 ? 1-(age-2500)/1000 : 1;
    return `<div class="kill-msg${n.isMyKill?' my-kill':''}" style="opacity:${op.toFixed(2)}">${escapeHtml(n.text)}</div>`;
  }).join('');
}

// ========================
// UI EVENT LISTENERS
// ========================
$('createBtn').addEventListener('click', () => { myName = nameInput.value.trim() || 'Player'; createRoom(); });
$('joinBtn').addEventListener('click', () => { myName = nameInput.value.trim() || 'Player'; setStatus(joinStatus, ''); $('connectBtn').disabled = false; showScreen('join'); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('createBtn').click(); });
$('connectBtn').addEventListener('click', () => { joinRoom(codeInput.value); });
codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('connectBtn').click(); });
$('joinBack').addEventListener('click', () => { if (peer) { try { peer.destroy(); } catch(e) {} peer = null; } showScreen('start'); });

$('readyBtn').addEventListener('click', () => {
  if (isHost) { lobbyPlayers['0'].ready = !lobbyPlayers['0'].ready; broadcastLobbyState(); updateRoomDisplay(); }
  else if (hostConn && hostConn.open) hostConn.send({ type: 'ready' });
});
$('startGameBtn').addEventListener('click', () => { if (isHost && Object.keys(lobbyPlayers).length >= 1) startGameHost(); });
$('leaveLobbyBtn').addEventListener('click', () => { cleanupGame(); showScreen('start'); });
$('leaveBtn').addEventListener('click', () => { cleanupGame(); showScreen('start'); });

// Class selector
document.querySelectorAll('.class-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedClass = card.dataset.class;
    if (isHost) {
      lobbyPlayers['0'].playerClass = selectedClass;
      broadcastLobbyState(); updateRoomDisplay();
    } else if (hostConn && hostConn.open) {
      hostConn.send({ type: 'selectClass', cls: selectedClass });
    }
  });
});
