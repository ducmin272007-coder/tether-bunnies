/**
 * Tether Bunnies: Co-op Chaos & Party Stacking - Game Server
 * Supports up to 10 players, 20Hz Anti-Bufferbloat position batching,
 * room management, host migration, custom level sharing, and static file serving.
 */
'use strict';

const path = require('path');
const http = require('http');
const os = require('os');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const BROADCAST_HZ = 20;
const MAX_PLAYERS = 10;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, perMessageDeflate: false });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size }));

const rooms = new Map();

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
  for (let i = 0; i < MAX_PLAYERS; i++) {
    if (!used.has(i)) return i;
  }
  return -1;
}

function rosterOf(room) {
  const host = room.players.get(room.hostId);
  return {
    code: room.code,
    mode: room.mode || 'coop',
    host: host ? host.slot : 0,
    lv: room.lv,
    players: [...room.players.values()]
      .sort((a, b) => a.slot - b.slot)
      .map((p) => ({ s: p.slot, n: p.name, skin: p.skin || 'classic' })),
  };
}

function broadcastRoster(room) {
  io.to(room.code).emit('roster', rosterOf(room));
}

function attach(socket, room, name, skin) {
  const slot = freeSlot(room);
  if (slot < 0) return -1;
  room.players.set(socket.id, { slot, name: cleanName(name, slot), skin: skin || 'classic', socket });
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
    const mode = (data && data.mode) || 'coop';
    const room = {
      code,
      mode,
      players: new Map(),
      hostId: null,
      lv: 0,
      positions: new Map(),
      lastPositionsSent: new Map(),
    };
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
    cb({ ok: true, code, slot, host: host ? host.slot : 0, lv: room.lv, mode: room.mode });
    broadcastRoster(room);
  });

  socket.on('pos', (pkt) => {
    const code = socket.data.code;
    if (!code) return;
    const room = rooms.get(code);
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
    if (e.t === 'lvl' && (socket.id === room.hostId || room.mode === 'solo')) {
      room.lv = e.n | 0;
    }
    io.to(code).emit('ev', e);
  });

  socket.on('skin', (skin) => {
    const code = socket.data.code;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (!p) return;
    p.skin = String(skin || 'classic');
    broadcastRoster(room);
  });

  socket.on('p', (cb) => {
    if (typeof cb === 'function') cb();
  });

  socket.on('disconnect', () => {
    const code = socket.data.code;
    const room = rooms.get(code);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (p) room.positions.delete(p.slot);
    room.players.delete(socket.id);
    if (room.players.size === 0) {
      rooms.delete(code);
      return;
    }
    if (room.hostId === socket.id) {
      room.hostId = room.players.keys().next().value;
    }
    broadcastRoster(room);
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.positions.size === 0) continue;
    const batch = Array.from(room.positions.values());
    io.to(room.code).emit('ps', batch);
  }
}, 1000 / BROADCAST_HZ);

server.listen(PORT, () => {
  console.log('  ==================================================');
  console.log('    Tether Bunnies: Co-op Chaos & Party Stacking');
  console.log('    Broadcast Rate: ' + BROADCAST_HZ + 'Hz (Anti-Bufferbloat Mode)');
  console.log('    Max Players:    ' + MAX_PLAYERS);
  console.log('  ==================================================');
  console.log('  Local:   http://localhost:' + PORT);
});
