/**
 * Tether Bunnies: Co-op Chaos - Game Server (v3 High-Performance Netcode)
 *
 * Responsibilities:
 *  - Serves static assets and Matter.js from node_modules.
 *  - Authoritative room management: 4-letter alphanumeric codes, 1-4 player slots.
 *  - Supports both 'coop' (tethered multiplayer) and 'solo' (campaign practice) modes.
 *  - 20Hz Tick Broadcast (50ms interval) to completely eliminate Cloudflare Tunnel
 *    TCP bufferbloat and WebSocket queue latency spikes.
 *  - Relays ultra-compact flat integer array payloads (over 80% bandwidth reduction):
 *      p: [[slot, Math.round(x), Math.round(y), Math.round(vx*10), Math.round(vy*10), keysMask, stateFlags], ...]
 *  - Lightweight RTT ping-pong heartbeat probe.
 *  - Host migration and solo practice bot support.
 */
'use strict';

const path = require('path');
const http = require('http');
const os = require('os');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const TICK_HZ = 20; // 20Hz tick broadcast (50ms) to eliminate bufferbloat
const MAX_PLAYERS = 4;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, perMessageDeflate: false, pingInterval: 10000, pingTimeout: 30000 });

/** @type {Map<string, Room>} */
const rooms = new Map();

app.get('/vendor/matter.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'matter-js', 'build', 'matter.min.js'));
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size, tickHz: TICK_HZ }));

/**
 * @typedef {Object} Room
 * @property {string} code
 * @property {string} mode 'coop' | 'solo'
 * @property {Map<string,{slot:number,name:string,socket:any,bot?:boolean,skin?:string}>} players
 * @property {string|null} hostId
 * @property {number} lv
 * @property {object|null} snap
 * @property {boolean} dirty
 */

function genCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (!rooms.has(c)) return c;
  }
}

function cleanName(n, slot) {
  const s = String(n || '').replace(/[<>&"'`]/g, '').trim().slice(0, 12);
  return s || ['Bubblegum', 'Aqua', 'Sunny', 'Mint'][slot] || 'Bunny';
}

function freeSlot(room) {
  const used = new Set([...room.players.values()].map((p) => p.slot));
  for (let i = 0; i < MAX_PLAYERS; i++) if (!used.has(i)) return i;
  return -1;
}

function humans(room) {
  return [...room.players.entries()].filter(([, p]) => !p.bot);
}

function removeBot(room) {
  return room.players.delete('bot');
}

function rosterOf(room) {
  const host = room.players.get(room.hostId);
  return {
    code: room.code,
    mode: room.mode || 'coop',
    host: host ? host.slot : -1,
    lv: room.lv,
    players: [...room.players.values()]
      .sort((a, b) => a.slot - b.slot)
      .map((p) => (p.bot ? { s: p.slot, n: p.name, b: 1, skin: 'classic' } : { s: p.slot, n: p.name, skin: p.skin || 'classic' })),
  };
}

function broadcastRoster(room) {
  io.to(room.code).emit('roster', rosterOf(room));
}

function attach(socket, room, name, skin) {
  if (room.reap) { clearTimeout(room.reap); room.reap = null; }
  removeBot(room);
  const slot = freeSlot(room);
  if (slot < 0) return -1;
  room.players.set(socket.id, { slot, name: cleanName(name, slot), skin: skin || 'classic', socket });
  if (!room.hostId) room.hostId = socket.id;
  socket.join(room.code);
  socket.data.code = room.code;
  return slot;
}

io.on('connection', (socket) => {
  // Create Room
  socket.on('create', (data, cb) => {
    if (typeof cb !== 'function') return;
    if (socket.data.code) return cb({ ok: false, error: 'Already in a room.' });
    const code = genCode();
    const mode = (data && data.mode === 'solo') ? 'solo' : 'coop';
    const room = { code, mode, players: new Map(), hostId: null, lv: 0, snap: null, dirty: false };
    rooms.set(code, room);
    const slot = attach(socket, room, data && data.name, data && data.skin);
    cb({ ok: true, code, slot, mode, host: slot, lv: 0 });
    broadcastRoster(room);
  });

  // Join Room
  socket.on('join', (data, cb) => {
    if (typeof cb !== 'function') return;
    if (socket.data.code) return cb({ ok: false, error: 'Already in a room.' });
    const code = String((data && data.code) || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return cb({ ok: false, error: 'Room "' + code + '" not found.' });
    if (room.mode === 'solo' && humans(room).length >= 1) {
      return cb({ ok: false, error: 'Room is in Solo Mode.' });
    }
    const hadBot = room.players.has('bot');
    const slot = attach(socket, room, data && data.name, data && data.skin);
    if (slot < 0) {
      if (hadBot) broadcastRoster(room);
      return cb({ ok: false, error: 'Room is full (max 4 bunnies).' });
    }
    cb({ ok: true, code, slot, mode: room.mode, host: (room.players.get(room.hostId) || {}).slot, lv: room.lv | 0 });
    broadcastRoster(room);
  });

  // Change Skin
  socket.on('skin', (skin) => {
    const room = rooms.get(socket.data.code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (p) {
      p.skin = String(skin || 'classic').slice(0, 16);
      broadcastRoster(room);
    }
  });


  // ---- v5 client relay: client-authoritative positions + reliable events ----
  socket.on('pos', (a) => {
    const room = rooms.get(socket.data.code);
    if (!room || !Array.isArray(a) || a.length < 5) return;
    const me = room.players.get(socket.id);
    if (!me) return;
    if (!room.pos) room.pos = new Map();
    room.pos.set(me.slot, [me.slot, +a[0] || 0, +a[1] || 0, +a[2] || 0, +a[3] || 0, a[4] | 0]);
  });

  socket.on('ev', (e) => {
    const room = rooms.get(socket.data.code);
    if (!room || !e || typeof e !== 'object') return;
    const me = room.players.get(socket.id);
    if (!me) return;
    if (e.t === 'lvl') room.lv = e.n | 0;
    e.s = me.slot;
    socket.to(room.code).emit('ev', e);
  });

  // Input relay: Client -> Host
  socket.on('inp', (i) => {
    const room = rooms.get(socket.data.code);
    if (!room || !room.hostId || room.hostId === socket.id || !i) return;
    const me = room.players.get(socket.id);
    const host = room.players.get(room.hostId);
    if (!me || !host) return;
    // Relay raw run-length encoded input batch volatilely
    host.socket.volatile.emit('inp', { s: me.slot, q: i.q, b: i.b });
  });

  // Host commands (restart / goto level)
  socket.on('cmd', (c) => {
    const room = rooms.get(socket.data.code);
    if (!room || !room.hostId || room.hostId === socket.id || !c) return;
    const host = room.players.get(room.hostId);
    if (host) host.socket.emit('cmd', { t: String(c.t), n: Number(c.n) | 0 });
  });

  // RTT Ping Heartbeat Probe (every 2s from client)
  socket.on('p', (cb) => {
    if (typeof cb === 'function') cb();
  });

  // Solo practice bot toggle
  socket.on('bot', () => {
    const room = rooms.get(socket.data.code);
    if (!room) return;
    if (humans(room).length !== 1) return socket.emit('msg', 'Practice bot is only for solo players');
    if (room.players.has('bot')) {
      removeBot(room);
    } else {
      const slot = freeSlot(room);
      if (slot < 0) return;
      room.players.set('bot', { slot, name: 'Practice Bot', socket: null, bot: true, skin: 'classic' });
    }
    broadcastRoster(room);
  });

  // Snapshot from Host
  socket.on('snap', (s) => {
    const room = rooms.get(socket.data.code);
    if (!room || room.hostId !== socket.id || !s || typeof s !== 'object') return;
    room.lv = s.lv | 0;
    if (Array.isArray(s.ev) && s.ev.length) {
      const ev = s.ev.slice(0, 80);
      for (const [id, p] of room.players) {
        if (id !== room.hostId && !p.bot) p.socket.emit('ev', ev);
      }
    }
    delete s.ev;
    room.snap = s;
    room.dirty = true;
  });

  socket.on('disconnect', () => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room) return;
    const gone = room.players.get(socket.id);
    if (gone && room.pos) room.pos.delete(gone.slot);
    room.players.delete(socket.id);
    const hs = humans(room);
    if (hs.length === 0) {
      // keep the room alive 45s so a brief network blip can rejoin without losing progress
      room.hostId = null; room.snap = null;
      if (room.pos) room.pos.clear();
      room.reap = setTimeout(() => { if (humans(room).length === 0) rooms.delete(code); }, 45000);
      return;
    }
    if (hs.length > 1) removeBot(room);
    if (room.hostId === socket.id) {
      room.hostId = hs[0][0]; // Host migration
      room.snap = null;
    }
    broadcastRoster(room);
  });
});

// 20Hz Tick Broadcast Loop (50ms interval): Prevents WebSocket queue bufferbloat
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.pos && room.pos.size) {
      io.to(room.code).volatile.emit('ps', [...room.pos.values()]);
      room.pos.clear();
    }
    if (!room.dirty || !room.snap) continue;
    room.dirty = false;
    // Broadcast compact snapshot to non-host players
    for (const [id, p] of room.players) {
      if (id !== room.hostId && !p.bot) {
        p.socket.volatile.emit('state', room.snap);
      }
    }
  }
}, 1000 / TICK_HZ);

server.listen(PORT, () => {
  console.log('\n  ==================================================');
  console.log('    Tether Bunnies: Co-op Chaos & Solo Campaign');
  console.log('    Broadcast Rate: ' + TICK_HZ + 'Hz (Anti-Bufferbloat Mode)');
  console.log('  ==================================================');
  console.log('  Local:   http://localhost:' + PORT);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name]) {
      if (n.family === 'IPv4' && !n.internal) {
        console.log('  Network: http://' + n.address + ':' + PORT);
      }
    }
  }
  console.log('');
});

