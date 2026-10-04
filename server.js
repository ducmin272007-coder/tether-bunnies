/**
 * Tether Bunnies v8 - Game Server
 *  - Socket.IO rooms (up to 10 players) with 20Hz position batching
 *  - Express JSON API: 6-char cloud-sync saves (persistent JSON file), admin auth
 *  - In-memory rate limiting
 *
 * Environment variables:
 *   PORT        HTTP port (default 3000)
 *   ADMIN_KEY   admin password. If unset, a random one is generated and printed at startup.
 *   DATA_DIR    where saves.json lives (default ./data). On Render's free plan the disk is
 *               ephemeral, so mount a persistent disk and point DATA_DIR at it to keep saves.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const BROADCAST_HZ = 20;
const MAX_PLAYERS = 10;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SAVE_FILE = path.join(DATA_DIR, 'saves.json');
const MAX_SAVES = 50000;
const MAX_KEYS = 200;
const MAX_VALUE_LEN = 400000;
const MAX_SAVE_BYTES = 1500000;

let ADMIN_KEY = process.env.ADMIN_KEY || '';
let adminKeyGenerated = false;
if (!ADMIN_KEY) { ADMIN_KEY = crypto.randomBytes(6).toString('hex'); adminKeyGenerated = true; }

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, perMessageDeflate: false, pingInterval: 10000, pingTimeout: 30000, maxHttpBufferSize: 2e6 });

app.use(express.json({ limit: '2mb' }));
app.use((err, req, res, next) => {            // malformed / oversized JSON
  if (err) return res.status(400).json({ ok: false, error: 'bad_request' });
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));

const rooms = new Map();
const saves = new Map();     // CODE -> { rev, data, updated }
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size, saves: saves.size }));

// ---------------------------------------------------------------- rate limiting
const buckets = new Map();   // key -> { n, reset }
function hit(key, limit, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n++;
  return b.n <= limit;
}
function peek(key) {
  const b = buckets.get(key);
  return b && Date.now() <= b.reset ? b.n : 0;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k); }, 60000).unref();

function limiter(name, limit, windowMs) {
  return (req, res, next) => {
    if (!hit(name + ':' + req.ip, limit, windowMs)) return res.status(429).json({ ok: false, error: 'rate_limited' });
    next();
  };
}

// ---------------------------------------------------------------- persistent saves
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(SAVE_FILE)) {
    const raw = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
    Object.keys(raw || {}).forEach((c) => { if (/^[A-Z0-9]{6}$/.test(c) && raw[c] && typeof raw[c].data === 'object') saves.set(c, raw[c]); });
  }
} catch (e) { console.warn('  [saves] could not load ' + SAVE_FILE + ': ' + e.message); }

let saveTimer = null, saving = false, saveAgain = false;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(flush, 800);
}
function flush() {
  saveTimer = null;
  if (saving) { saveAgain = true; return; }
  saving = true;
  const obj = {}; saves.forEach((v, k) => { obj[k] = v; });
  const tmp = SAVE_FILE + '.tmp';
  fs.writeFile(tmp, JSON.stringify(obj), (err) => {
    if (err) { saving = false; console.warn('  [saves] write failed: ' + err.message); return; }
    fs.rename(tmp, SAVE_FILE, (err2) => {
      saving = false;
      if (err2) console.warn('  [saves] rename failed: ' + err2.message);
      if (saveAgain) { saveAgain = false; persist(); }
    });
  });
}
function flushSync() {
  try { const obj = {}; saves.forEach((v, k) => { obj[k] = v; }); fs.writeFileSync(SAVE_FILE, JSON.stringify(obj)); } catch (e) {}
}
process.on('SIGTERM', () => { flushSync(); process.exit(0); });
process.on('SIGINT', () => { flushSync(); process.exit(0); });

function cleanCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function validCode(c) { return typeof c === 'string' && /^[A-Z0-9]{6}$/.test(c); }

function cleanData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const keys = Object.keys(d);
  if (keys.length > MAX_KEYS) return null;
  const out = {}; let total = 0;
  for (const k of keys) {
    if (!/^tb_[A-Za-z0-9_\-]+$/.test(k)) continue;
    const v = String(d[k]);
    if (v.length > MAX_VALUE_LEN) continue;
    total += v.length + k.length;
    if (total > MAX_SAVE_BYTES) return null;
    out[k] = v;
  }
  return out;
}

const syncLimit = limiter('sync', 120, 60000);
const createLimit = limiter('create', 20, 60000);

app.post('/api/sync/create', createLimit, (req, res) => {
  const code = cleanCode(req.body && req.body.code);
  if (!validCode(code)) return res.status(400).json({ ok: false, error: 'bad_code' });
  const data = cleanData(req.body.data);
  if (!data) return res.status(400).json({ ok: false, error: 'bad_data' });
  if (saves.has(code)) return res.status(409).json({ ok: false, error: 'taken' });
  if (saves.size >= MAX_SAVES) return res.status(503).json({ ok: false, error: 'full' });
  saves.set(code, { rev: 1, data, updated: Date.now() });
  persist();
  res.json({ ok: true, code, rev: 1 });
});

app.get('/api/sync/:code/meta', syncLimit, (req, res) => {
  const code = cleanCode(req.params.code);
  const s = validCode(code) && saves.get(code);
  if (!s) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, rev: s.rev, updated: s.updated });
});

app.get('/api/sync/:code', syncLimit, (req, res) => {
  const code = cleanCode(req.params.code);
  const s = validCode(code) && saves.get(code);
  if (!s) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, rev: s.rev, data: s.data, updated: s.updated });
});

app.post('/api/sync/push', syncLimit, (req, res) => {
  const b = req.body || {};
  const code = cleanCode(b.code);
  if (!validCode(code)) return res.status(400).json({ ok: false, error: 'bad_code' });
  const s = saves.get(code);
  if (!s) return res.status(404).json({ ok: false, error: 'not_found' });
  const data = cleanData(b.data);
  if (!data) return res.status(400).json({ ok: false, error: 'bad_data' });
  if (!b.force && (b.rev | 0) !== s.rev) return res.status(409).json({ ok: false, error: 'conflict', rev: s.rev });
  s.rev += 1; s.data = data; s.updated = Date.now();
  persist();
  res.json({ ok: true, rev: s.rev });
});

// ---------------------------------------------------------------- admin auth
const ADMIN_FAIL_LIMIT = 5, ADMIN_WINDOW = 5 * 60 * 1000, TOKEN_TTL = 12 * 60 * 60 * 1000;
const adminTokens = new Map();   // token -> expiry

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

app.post('/api/admin/login', (req, res) => {
  const fkey = 'adminfail:' + req.ip;
  if (peek(fkey) >= ADMIN_FAIL_LIMIT) return res.status(429).json({ ok: false, error: 'rate_limited' });
  const key = req.body && typeof req.body.key === 'string' ? req.body.key : '';
  if (!key || !safeEqual(key, ADMIN_KEY)) {
    hit(fkey, ADMIN_FAIL_LIMIT, ADMIN_WINDOW);
    return res.status(401).json({ ok: false, error: 'bad_key' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  adminTokens.set(token, Date.now() + TOKEN_TTL);
  res.json({ ok: true, token });
});

app.post('/api/admin/verify', limiter('verify', 30, 60000), (req, res) => {
  const t = req.body && typeof req.body.token === 'string' ? req.body.token : '';
  const exp = adminTokens.get(t);
  if (!exp || Date.now() > exp) { adminTokens.delete(t); return res.status(401).json({ ok: false }); }
  res.json({ ok: true });
});
setInterval(() => { const now = Date.now(); for (const [t, e] of adminTokens) if (now > e) adminTokens.delete(t); }, 600000).unref();

// ---------------------------------------------------------------- rooms / sockets
function genCode() {
  for (let attempt = 0; attempt < 1000; attempt++) {
    let c = '';
    for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
  return String(Date.now()).slice(-4);
}

function cleanName(n, slot) {
  const s = String(n || '').replace(/[<>&"']/g, '').trim().slice(0, 12);
  const defaults = ['Bunny', 'Aqua', 'Sunny', 'Mint', 'Berry', 'Flame', 'Cyan', 'Ruby', 'Sage', 'Amber'];
  return s || defaults[slot % defaults.length] || 'Bunny';
}

function freeSlot(room) {
  const used = new Set([...room.players.values()].map((p) => p.slot));
  for (let i = 0; i < MAX_PLAYERS; i++) if (!used.has(i)) return i;
  return -1;
}

function rosterOf(room) {
  const host = room.players.get(room.hostId);
  return {
    code: room.code,
    mode: room.mode || 'coop',
    host: host ? host.slot : 0,
    lv: room.lv,
    pn: room.pn || 0,
    players: [...room.players.values()]
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({ s: p.slot, n: p.name, skin: p.skin || 'classic' })),
  };
}

function broadcastRoster(room) { io.to(room.code).emit('roster', rosterOf(room)); }

function cleanSkin(s) { return String(s || 'classic').replace(/[^a-z0-9_]/gi, '').slice(0, 24) || 'classic'; }

function attach(socket, room, name, skin) {
  if (room.reap) { clearTimeout(room.reap); room.reap = null; }
  const slot = freeSlot(room);
  if (slot < 0) return -1;
  room.players.set(socket.id, { slot, name: cleanName(name, slot), skin: cleanSkin(skin), socket });
  if (!room.hostId) room.hostId = socket.id;
  socket.join(room.code);
  socket.data.code = room.code;
  return slot;
}

io.on('connection', (socket) => {
  socket.on('create', (data, cb) => {
    if (typeof cb !== 'function') return;
    if (socket.data.code) return cb({ ok: false, error: 'Already in a room.' });
    const code = genCode();
    const mode = (data && data.mode) === 'party' ? 'party' : 'coop';
    const room = { code, mode, players: new Map(), hostId: null, lv: 0, pn: 0, positions: new Map() };
    rooms.set(code, room);
    const slot = attach(socket, room, data && data.name, data && data.skin);
    cb({ ok: true, code, slot, host: slot, mode });
    broadcastRoster(room);
  });

  socket.on('join', (data, cb) => {
    if (typeof cb !== 'function') return;
    if (socket.data.code) return cb({ ok: false, error: 'Already in a room.' });
    const code = String((data && data.code) || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return cb({ ok: false, error: 'Room "' + code + '" was not found.' });
    const slot = attach(socket, room, data && data.name, data && data.skin);
    if (slot < 0) return cb({ ok: false, error: 'Room is full (max 10 bunnies).' });
    const host = room.players.get(room.hostId);
    cb({ ok: true, code, slot, host: host ? host.slot : 0, lv: room.lv, pn: room.pn || 0, mode: room.mode });
    broadcastRoster(room);
  });

  socket.on('pos', (pkt) => {
    const room = rooms.get(socket.data.code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p || !Array.isArray(pkt)) return;
    room.positions.set(p.slot, [p.slot, pkt[0], pkt[1], pkt[2], pkt[3], pkt[4] || 0]);
  });

  socket.on('ev', (e) => {
    const code = socket.data.code;
    if (!code || !e || typeof e !== 'object') return;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    e.s = p.slot;
    if (e.t === 'lvl' || e.t === 'restart' || e.t === 'custom_lvl' || e.t === 'pcount') {
      if (socket.id !== room.hostId) return;          // host only
      if (e.t === 'lvl') room.lv = e.n | 0;
    }
    // v11: the host fixes the party size N (1..10); late joiners receive it in the join reply / roster
    if (room.mode === 'party') {
      const pn = e.t === 'pcount' ? e.n : ((e.t === 'lvl' || e.t === 'restart') ? e.pn : 0);
      if (pn !== 0 && pn !== undefined) {
        room.pn = Math.max(1, Math.min(MAX_PLAYERS, pn | 0));
        e.pn = room.pn; if (e.t === 'pcount') e.n = room.pn;
      }
    }
    // v11 troll traps: accept only well-formed trap events, relayed to everybody else
    if (e.t === 'trap') {
      const okA = ['fire', 'hit', 'done', 'reset', 'flee', 'fix'];
      if (!Number.isInteger(e.i) || e.i < 0 || e.i > 64 || okA.indexOf(e.a) < 0) return;
      if (typeof e.v !== 'number' || !isFinite(e.v)) e.v = 0;
      if ((e.a === 'done' || e.a === 'reset') && socket.id !== room.hostId) return;   // only the host judges the saw arena
    }
    socket.to(code).emit('ev', e);
  });

  socket.on('skin', (skin) => {
    const room = rooms.get(socket.data.code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.skin = cleanSkin(skin);
    broadcastRoster(room);
  });

  socket.on('rename', (name) => {
    const room = rooms.get(socket.data.code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.name = cleanName(name, p.slot);
    broadcastRoster(room);
  });

  socket.on('p', (cb) => { if (typeof cb === 'function') cb(); });

  socket.on('disconnect', () => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (p) room.positions.delete(p.slot);
    room.players.delete(socket.id);
    if (room.players.size === 0) {
      room.hostId = null;
      room.reap = setTimeout(() => { if (room.players.size === 0) rooms.delete(code); }, 45000);
      return;
    }
    if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
    broadcastRoster(room);
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.positions.size === 0) continue;
    io.to(room.code).emit('ps', Array.from(room.positions.values()));
  }
}, 1000 / BROADCAST_HZ);

server.listen(PORT, () => {
  console.log('  ==================================================');
  console.log('    Tether Bunnies v8: Co-op Chaos & Party Stacking');
  console.log('    Broadcast Rate: ' + BROADCAST_HZ + 'Hz   Max Players: ' + MAX_PLAYERS);
  console.log('    Saves: ' + saves.size + ' loaded from ' + SAVE_FILE);
  if (adminKeyGenerated) console.log('    ADMIN_KEY not set -> temporary admin password: ' + ADMIN_KEY);
  else console.log('    Admin password: from ADMIN_KEY env var');
  console.log('  ==================================================');
  console.log('  Local:   http://localhost:' + PORT);
});
