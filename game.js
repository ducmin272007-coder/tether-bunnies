/**
 * Tether Bunnies: Co-op Chaos  --  v7 "PARTY & SKIES" client
 * ---------------------------------------------------------------------------
 *  MODES
 *   - SOLO HARDCORE : single player, no rope, fully offline (no server needed).
 *   - CO-OP CHAOS   : 2-4 players, elastic tether rope, head-stacking, buttons.
 *   - PARTY STACK   : 2-10 players, NO rope, head-stacking + 15% super jump.
 *
 *  NETCODE (client-authoritative, zero input lag)
 *   - Every client simulates ITS OWN bunny locally (0 ms delay).
 *   - Position packets are sent at 20 Hz:  socket.volatile.emit('pos', [x, y, vx*10, vy*10, flags])
 *   - Server relays batches:               socket.on('ps', [[slot, x, y, vx10, vy10, flags], ...])
 *   - Remote bunnies are smoothly lerped + velocity-extrapolated at 60 FPS.
 *   - World hazards (crushers, boulders, chasers) are deterministic functions of a
 *     shared level clock `lt`, re-synced by the lowest-slot player once per 1.5 s.
 *   - Reliable events via socket.emit('ev', {t:..}) -> relayed to the room with `s` = sender slot.
 *
 *  PERSISTENCE: localStorage (with in-memory fallback) -> unlocked levels, coins,
 *  skins, potions, best times, per-level collected coins.
 */
(() => {
'use strict';

// ============================================================================
// CONSTANTS
// ============================================================================
const COLORS = ['#FF8FA3', '#4EA8DE', '#FEE440', '#70E000', '#B5179E', '#F77F00', '#4CC9F0', '#E63946', '#2EC4B6', '#FFB703'];
const DARKS  = ['#D9566F', '#2478B0', '#C9A800', '#3C9E00', '#7209B7', '#D62828', '#0096C7', '#9D0208', '#0F9F90', '#FB8500'];
const PW = 28, PH = 36;            // player collider
const RUN = 5.0;                   // max run speed (px / step)
const GRAV = 0.58;
const JUMP = 11.8;
const MAXFALL = 15;
const TETHER = 200;                // rope rest length (px)
const STEP = 1 / 60;
const WORLD_H = 900;               // every level is 900 units tall
const GY = 700;                    // default ground height
const VIEW_H = 720;                // logical visible height
const VIEW_MIN_W = 760;            // logical minimum visible width (portrait phones)
const SEND_MS = 50;                // 20 Hz position packets
const SKIN_PRICE = { ninja: 20, king: 40, slime: 60 };
let PARTY_N = 4;   // v11: party size locked by the host at level start / restart

// ============================================================================
// v8 ADDITIONS  --  skin tiers, diamonds, temporary buffs, guest/admin roles
// ============================================================================
const DIA_RATE = 50;        // coins needed to convert into 1 diamond
const BUFF_CAP = 2;         // max unspent charges of each shop buff a player can carry
const DJ_SECONDS = 30;      // Double Jump potion duration (also ends on death / level end)

const Role = { admin: false, god: false, token: '', dbg: false };  // everybody starts as a GUEST
let storeHook = null;       // set at boot: called on every Store.set (drives cloud auto-sync)
let curEnv = null;          // environment of the equipped LEGENDARY skin (null = normal level scenery)
let curPassive = null;      // passive buff id of the equipped LEGENDARY skin
const envParts = [];        // ambient environment particles (embers / snow / stars)

const TIERS = {
  common:    { label: 'COMMON' },
  rare:      { label: 'RARE' },
  legendary: { label: 'LEGENDARY' },
};

const SKINS = {
  classic: { tier: 'common', name: 'Classic Pink', icon: '🐰', coins: 0, dia: 0 },
  ninja:   { tier: 'common', name: 'Cyber Ninja',  icon: '🥷', coins: 20, dia: 0 },
  cocoa:   { tier: 'common', name: 'Cocoa Bunny',  icon: '🍫', coins: 30, dia: 0 },
  king:    { tier: 'rare', name: 'King Bunny',    icon: '👑', coins: 40, dia: 2 },
  slime:   { tier: 'rare', name: 'Golden Slime',  icon: '✨', coins: 60, dia: 3 },
  crystal: { tier: 'rare', name: 'Crystal Bunny', icon: '🔮', coins: 50, dia: 4 },
  phoenix: {
    tier: 'legendary', name: 'Phoenix Bunny', icon: '🔥', coins: 0, dia: 10,
    env: { name: 'Ember Skies', desc: 'volcanic sky, lava rock, drifting embers', sky: 'ember', solidHue: 12, grassHue: 28, tint: 'rgba(255,80,10,.07)', fx: 'embers', rate: 16 },
    passive: { id: 'rebirth', name: 'Rebirth', desc: 'After a respawn you are invulnerable for 5s instead of 2.5s.' },
    trail: ['#ff6a1a', '#ffb347', '#ffe08a'],
  },
  aurora: {
    tier: 'legendary', name: 'Aurora Bunny', icon: '❄️', coins: 0, dia: 12,
    env: { name: 'Frozen Night', desc: 'icy sky, aurora ribbons, falling snow', sky: 'frost', solidHue: 200, grassHue: 172, tint: 'rgba(120,200,255,.06)', fx: 'snow', rate: 18 },
    passive: { id: 'featherfall', name: 'Featherfall', desc: 'Fall 30% slower and steer better in mid-air.' },
    trail: ['#9ff3e6', '#bde0fe', '#e0aaff', '#ffffff'],
  },
  cosmic: {
    tier: 'legendary', name: 'Cosmic Bunny', icon: '🌌', coins: 0, dia: 15,
    env: { name: 'Deep Space', desc: 'ringed planet, nebulae, twinkling stars', sky: 'cosmic', solidHue: 262, grassHue: 292, tint: 'rgba(150,100,255,.06)', fx: 'stars', rate: 12 },
    passive: { id: 'magnet', name: 'Star Magnet', desc: 'Collect coins, 💎 and the key from much farther away.' },
    trail: ['#c9b8ff', '#ffe9a8', '#8ecae6'],
  },
  mint:    { tier: 'common', name: 'Mint Bunny',  icon: '🍃', coins: 25, dia: 0 },
  panda:   { tier: 'rare', name: 'Panda Bunny', icon: '🐼', coins: 45, dia: 2 },
  ghost:   { tier: 'rare', name: 'Ghost Bunny', icon: '👻', coins: 50, dia: 3 },
  blossom: {
    tier: 'legendary', name: 'Blossom Bunny', icon: '🌸', coins: 0, dia: 11,
    env: { name: 'Cherry Dusk', desc: 'twilight sakura sky, distant mountain, drifting petals', sky: 'sakura', solidHue: 325, grassHue: 150, tint: 'rgba(255,150,200,.06)', fx: 'petals', rate: 14 },
    passive: { id: 'luck', name: 'Lucky Charm', desc: '20% chance every coin counts double.' },
    trail: ['#ffb3d1', '#ffe0ec', '#ffffff'],
  },
  ocean: {
    tier: 'legendary', name: 'Abyss Bunny', icon: '🌊', coins: 0, dia: 13,
    env: { name: 'Abyssal Reef', desc: 'sunlit deep sea, fish shoals, kelp, rising bubbles', sky: 'ocean', solidHue: 195, grassHue: 165, tint: 'rgba(0,110,200,.10)', fx: 'bubbles', rate: 14 },
    passive: { id: 'swift', name: 'Tidal Rush', desc: 'Run 12% faster.' },
    trail: ['#9ff3ff', '#c8f7ff', '#ffffff'],
  },
  thunder: {
    tier: 'legendary', name: 'Storm Bunny', icon: '⛈️', coins: 0, dia: 14,
    env: { name: 'Storm Front', desc: 'black clouds, pouring rain, lightning strikes', sky: 'storm', solidHue: 225, grassHue: 120, tint: 'rgba(40,50,100,.12)', fx: 'rain', rate: 70 },
    passive: { id: 'springlegs', name: 'Static Legs', desc: 'Jump 10% higher.' },
    trail: ['#ffe066', '#ffffff', '#a5c8ff'],
  },
  neon: {
    tier: 'legendary', name: 'Neon Bunny', icon: '🌃', coins: 0, dia: 16,
    env: { name: 'Neon Night', desc: 'synthwave sun, glowing skyline, rising sparks', sky: 'neon', solidHue: 285, grassHue: 320, tint: 'rgba(255,0,200,.05)', fx: 'sparks', rate: 20 },
    passive: { id: 'guard', name: 'Neon Guard', desc: 'Start every level and every respawn with a free Bubble Shield.' },
    trail: ['#ff2bd6', '#00ffe0', '#ffffff'],
  },
};

const SKIN_PAL = {
  cocoa:   { body: '#a9714b', edge: '#6b3f22', inner: '#f2c9a5', belly: 'rgba(255,240,220,.7)' },
  crystal: { body: '#bfe9ff', edge: '#4f9ccf', inner: '#e8f8ff', belly: 'rgba(255,255,255,.75)' },
  phoenix: { body: '#ff9a3c', edge: '#b3300f', inner: '#ffe08a', belly: 'rgba(255,230,160,.8)' },
  aurora:  { body: '#9ff3e6', edge: '#2a8f9c', inner: '#e6fff9', belly: 'rgba(255,255,255,.7)' },
  cosmic:  { body: '#5a3fc0', edge: '#1d0f5c', inner: '#c9b8ff', belly: 'rgba(190,170,255,.55)' },
  mint:    { body: '#9be3b4', edge: '#3c9a66', inner: '#e3fff0', belly: 'rgba(255,255,255,.7)' },
  panda:   { body: '#f6f6f6', edge: '#2b2b2b', inner: '#a8a8a8', belly: 'rgba(255,255,255,.9)' },
  ghost:   { body: '#eef2ff', edge: '#8aa0ff', inner: '#cdd6ff', belly: 'rgba(255,255,255,.85)' },
  blossom: { body: '#ffc2d9', edge: '#c2457a', inner: '#fff0f6', belly: 'rgba(255,255,255,.8)' },
  ocean:   { body: '#7fd3e8', edge: '#0f6e91', inner: '#d9f7ff', belly: 'rgba(255,255,255,.7)' },
  thunder: { body: '#ffe066', edge: '#7a5b00', inner: '#fff3b0', belly: 'rgba(255,255,255,.65)' },
  neon:    { body: '#2a0f4a', edge: '#ff2bd6', inner: '#00ffe0', belly: 'rgba(0,255,230,.35)' },
};

const BUFFS = {
  doublejump: { name: 'Double Jump',   icon: '🦘', price: 10, desc: 'One extra mid-air hop for ' + DJ_SECONDS + 's. Ends if you die or the level ends.' },
  shield:     { name: 'Bubble Shield', icon: '🛡️', price: 15, desc: 'Absorbs 1 hit (a pit fall returns you to checkpoint). Gone when the level ends.' },
  speed:      { name: 'Speed Boost',  icon: '👟', price: 12, dur: 20, desc: 'Run 30% faster for 20s. Ends if you die or the level ends.' },
  magnet:     { name: 'Coin Magnet',  icon: '🧲', price: 12, dur: 30, desc: 'Pull coins, 💎 and the key from far away for 30s.' },
  jumpboost:  { name: 'Jump Boost',   icon: '🚀', price: 14, dur: 25, desc: 'Jump 25% higher for 25s. Ends if you die or the level ends.' },
};
const BUFF_IDS = ['shield', 'doublejump', 'speed', 'magnet', 'jumpboost'];
const BUFF_KEYS = { Digit1: 'shield', Numpad1: 'shield', Digit2: 'doublejump', Numpad2: 'doublejump', Digit3: 'speed', Numpad3: 'speed', Digit4: 'magnet', Numpad4: 'magnet', Digit5: 'jumpboost', Numpad5: 'jumpboost' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const $ = (id) => document.getElementById(id);
const setText = (id, t) => { const e = $(id); if (e) e.textContent = t; };
const show = (id, on) => { const e = $(id); if (e) e.classList.toggle('hidden', !on); };

const canvas = $('game');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0, dpr = 1;
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && matchMedia('(pointer: coarse)').matches);

// ============================================================================
// PERSISTENT STORAGE  (survives refresh / closing CMD / restarting server)
// ============================================================================
const Store = (() => {
  const mem = {};
  let ok = true;
  try { localStorage.setItem('__tb', '1'); localStorage.removeItem('__tb'); } catch (e) { ok = false; }
  return {
    get(k, d) {
      try { if (ok) { const v = localStorage.getItem(k); if (v !== null) return v; } } catch (e) {}
      return (k in mem) ? mem[k] : d;
    },
    set(k, v) {
      v = String(v); mem[k] = v;
      try { if (ok) localStorage.setItem(k, v); } catch (e) {}
      if (storeHook) storeHook(k);
    },
    del(k) { delete mem[k]; try { if (ok) localStorage.removeItem(k); } catch (e) {} },
    keys() {
      const out = new Set(Object.keys(mem));
      try { if (ok) for (let i = 0; i < localStorage.length; i++) out.add(localStorage.key(i)); } catch (e) {}
      return [...out].filter((k) => /^tb_[A-Za-z0-9_\-]+$/.test(k));
    },
  };
})();

const Save = {
  realUnlocked(mode) { return Math.max(1, parseInt(Store.get('tb_unlocked_' + (mode || 'solo'), '1'), 10) || 1); },
  unlocked(mode) { return Role.admin ? 999 : this.realUnlocked(mode); },
  unlock(mode, n) { if (n > this.realUnlocked(mode)) Store.set('tb_unlocked_' + (mode || 'solo'), n); },
  customLevels() { try { const a = JSON.parse(Store.get('tb_custom_levels', '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
  saveCustomLevel(lvl) { const a = this.customLevels(); a.push(lvl); Store.set('tb_custom_levels', JSON.stringify(a)); },
  coins() { return Math.max(0, parseInt(Store.get('tb_coins', '0'), 10) || 0); },
  addCoins(n) { Store.set('tb_coins', this.coins() + n); refreshCoinUI(); },
  spend(n) { if (Role.admin) return true; const c = this.coins(); if (c < n) return false; Store.set('tb_coins', c - n); refreshCoinUI(); return true; },
  diamonds() { return Math.max(0, parseInt(Store.get('tb_diamonds', '0'), 10) || 0); },
  addDiamonds(n) { Store.set('tb_diamonds', this.diamonds() + n); refreshCoinUI(); },
  spendDiamonds(n) { if (Role.admin) return true; const d = this.diamonds(); if (d < n) return false; Store.set('tb_diamonds', d - n); refreshCoinUI(); return true; },
  skins() { try { const a = JSON.parse(Store.get('tb_skins', '["classic"]')); return Array.isArray(a) ? a : ['classic']; } catch (e) { return ['classic']; } },
  hasSkin(s) { return s === 'classic' || (Role.admin ? !!SKINS[s] : this.skins().includes(s)); },
  addSkin(s) { const a = this.skins(); if (!a.includes(s)) { a.push(s); Store.set('tb_skins', JSON.stringify(a)); } },
  equipped() { const s = Store.get('tb_equipped_skin', 'classic'); return this.hasSkin(s) ? s : 'classic'; },
  equip(s) { Store.set('tb_equipped_skin', s); },
  buff(b) { return Math.max(0, parseInt(Store.get('tb_buff_' + b, '0'), 10) || 0); },
  addBuff(b, n) { Store.set('tb_buff_' + b, Math.min(BUFF_CAP, this.buff(b) + n)); refreshBuffUI(); },
  useBuff(b) { const c = this.buff(b); if (c <= 0) return false; Store.set('tb_buff_' + b, c - 1); refreshBuffUI(); return true; },
  coinsGot(mode, lv) { try { const a = JSON.parse(Store.get('tb_cg_' + mode + '_' + lv, '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
  markCoin(mode, lv, i) { const a = this.coinsGot(mode, lv); if (!a.includes(i)) { a.push(i); Store.set('tb_cg_' + mode + '_' + lv, JSON.stringify(a)); } },
  best(mode, lv) { const v = parseFloat(Store.get('tb_best_' + mode + '_' + lv, '0')); return v > 0 ? v : 0; },
  setBest(mode, lv, t) { const b = this.best(mode, lv); if (!b || t < b) { Store.set('tb_best_' + mode + '_' + lv, t.toFixed(2)); return true; } return false; },
  cleared(mode, lv) { return this.realUnlocked(mode) > lv + 1 || this.best(mode, lv) > 0; },
};

function refreshCoinUI() {
  const c = Role.admin ? '∞' : Save.coins(), d = Role.admin ? '∞' : Save.diamonds();
  setText('lobbyCoins', c); setText('shopCoins', c); setText('hudCoins', '🪙 ' + c);
  setText('lobbyDiamonds', d); setText('shopDiamonds', d); setText('hudDiamonds', '💎 ' + d);
}

function refreshBuffUI() {
  const P = G && G.me;
  const act = [];
  if (P && P.shield) act.push('🛡️');
  if (P && P.dj) act.push('🦘 ' + (Role.admin ? '∞' : Math.max(1, Math.ceil(P.djT)) + 's'));
  ['speed', 'magnet', 'jumpboost'].forEach((id) => { if (P && P.timed && P.timed[id] > 0) act.push(BUFFS[id].icon + ' ' + (Role.admin ? '∞' : Math.ceil(P.timed[id]) + 's')); });
  const inv = BUFF_IDS.filter((id) => Save.buff(id) > 0).map((id) => BUFFS[id].icon + '×' + Save.buff(id));
  let str = '';
  if (act.length) str = act.join(' ') + ' ACTIVE';
  else if (Role.admin) str = '🛡️🦘👟🧲🚀 ∞ (1-5)';
  else if (inv.length) str = inv.join(' ') + ' (1-5)';
  const badge = $('buffBadge');
  if (badge) { badge.textContent = str; badge.classList.toggle('hidden', !str); }
  BUFF_IDS.forEach((id) => {
    const btn = $('tb_' + id); if (!btn) return;
    const n = Save.buff(id);
    const live = P && (id === 'shield' ? P.shield : id === 'doublejump' ? P.dj : (P.timed && P.timed[id] > 0));
    btn.classList.toggle('hidden', !(isTouchDevice && (Role.admin || n > 0 || live)));
    btn.innerHTML = BUFFS[id].icon + (Role.admin ? '' : '<small>×' + n + '</small>');
  });
}

// ============================================================================
// SOUND  (tiny WebAudio synth, no asset files)
// ============================================================================
const Snd = (() => {
  let ac = null, master = null;
  let muted = Store.get('tb_mute', '0') === '1';
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ac.destination);
    } catch (e) { ac = null; }
  }
  function tone(f, dur, type, vol, to, delay) {
    if (!ac) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    init,
    isMuted: () => muted,
    toggleMute() { muted = !muted; Store.set('tb_mute', muted ? '1' : '0'); if (master) master.gain.value = muted ? 0 : 0.5; return muted; },
    jump(s) { tone(280 + (s || 0) * 20, 0.2, 'sine', 0.2, 600); },
    djump() { tone(440, 0.2, 'triangle', 0.22, 900); },
    land() { tone(120, 0.07, 'sine', 0.1, 60); },
    plate(on) { tone(on ? 520 : 330, 0.07, 'square', 0.1, on ? 780 : 200); },
    gate(on) { tone(on ? 220 : 440, 0.3, 'triangle', 0.12, on ? 440 : 180); },
    key() { [988, 1319, 1568, 1976].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, null, i * 0.07)); },
    coin() { [1318, 1760, 2093].forEach((f, i) => tone(f, 0.16, 'sine', 0.18, null, i * 0.05)); },
    spring() { tone(170, 0.3, 'sine', 0.25, 820); },
    crumble() { tone(140, 0.18, 'sawtooth', 0.12, 70); },
    shake() { tone(90, 0.08, 'square', 0.05, 80); },
    slam() { tone(90, 0.3, 'sawtooth', 0.28, 38); },
    pop() { tone(500, 0.25, 'sine', 0.28, 200); },
    die() { tone(420, 0.45, 'sawtooth', 0.2, 60); },
    cp() { [660, 880].forEach((f, i) => tone(f, 0.15, 'triangle', 0.15, null, i * 0.08)); },
    grab() { tone(300, 0.1, 'triangle', 0.16, 460); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'square', 0.13, null, i * 0.1)); },
  };
})();

// ============================================================================
// PARTICLES
// ============================================================================
const parts = [];
function puff(x, y, n, col, spd) {
  for (let i = 0; i < n; i++) {
    const life = rnd(0.3, 0.65);
    parts.push({ t: 0, x: x + rnd(-8, 8), y, vx: rnd(-1.6, 1.6) * (spd || 1), vy: rnd(-1.4, -0.1) * (spd || 1), life, max: life, size: rnd(4, 9), col: col || '#fff', g: 0 });
  }
}
function sparkle(x, y, n, spread, col) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.283), sp = rnd(0.5, 4) * (spread || 1), life = rnd(0.5, 1.2);
    parts.push({ t: 1, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.5, life, max: life, size: rnd(4, 9), col: col || '#ffe066', g: 0.05, rot: rnd(0, 6) });
  }
}
function debris(x, y, w, h, n, col) {
  for (let i = 0; i < n; i++) {
    const life = rnd(0.6, 1.1);
    parts.push({ t: 2, x: x + rnd(0, w), y: y + rnd(0, h), vx: rnd(-1.5, 1.5), vy: rnd(-2, 1), life, max: life, size: rnd(4, 9), col: col || '#8d6e63', g: 0.35, rot: rnd(0, 6), vr: rnd(-0.3, 0.3) });
  }
}
function confetti(cx, cy, w, n) {
  const cols = ['#FF8FA3', '#4EA8DE', '#FEE440', '#70E000', '#c77dff', '#ff9e5e'];
  for (let i = 0; i < n; i++) {
    const life = rnd(2, 3.6);
    parts.push({ t: 2, x: cx + rnd(-w, w), y: cy + rnd(-60, 0), vx: rnd(-1.4, 1.4), vy: rnd(-5, 0), life, max: life, size: rnd(6, 11), col: cols[(Math.random() * cols.length) | 0], g: 0.1, rot: rnd(0, 6), vr: rnd(-0.2, 0.2) });
  }
}
function speedLine(x, y, dir, vert) {
  parts.push({ t: 3, x, y, vx: vert ? 0 : -dir * 3.5, vy: vert ? -6 : 0, life: 0.25, max: 0.25, size: rnd(5, 9), col: 'rgba(255,255,255,.85)', g: 0, rot: vert ? 1.5708 : 0 });
}
function updateParts(dt) {
  const k = dt * 60;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * k; p.y += p.vy * k; p.vy += p.g * k;
    if (p.vr) p.rot += p.vr * k;
  }
  if (parts.length > 400) parts.splice(0, parts.length - 400);
}
function drawParts() {
  for (const p of parts) {
    const a = clamp(p.life / p.max, 0, 1);
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * 1.6);
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.col;
    if (p.t === 0) { ctx.beginPath(); ctx.arc(0, 0, p.size * (1.6 - a * 0.6), 0, 6.3); ctx.fill(); }
    else if (p.t === 1) { ctx.rotate(p.rot); ctx.beginPath(); ctx.arc(0, 0, p.size * 0.5, 0, 6.3); ctx.fill(); }
    else if (p.t === 3) { ctx.rotate(p.rot); ctx.fillRect(-p.size * 1.6, -0.9, p.size * 3.2, 1.8); }
    else { ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
    ctx.restore();
  }
}

// ============================================================================
// LEVEL BUILDER  (levels are 3x-4x+ wider than the screen: 4300 - 7500 units)
// ============================================================================
class LB {
  constructor(name, hint, hue, coop) {
    this.name = name; this.hint = hint; this.hue = hue; this.coop = !!coop;
    this.x = 0; this.gy = GY; this.pid = 0;
    this.solids = []; this.spikes = []; this.crumbles = []; this.springs = []; this.crushers = [];
    this.boulders = []; this.sweepers = []; this.plates = []; this.gates = []; this.ropes = [];
    this.stalactites = []; this.meteors = []; this.risers = []; this.h = WORLD_H; this.wj = false;
    this.traps = []; this.exitOv = null;
    this.coins = []; this.flags = []; this.key = null;
    this.spawn = [80, GY - PH];
  }
  ground(len) { const x = this.x; this.solids.push([x, this.gy, len, WORLD_H - this.gy + 80]); this.x += len; return x; }
  gap(len) { this.spikes.push({ x: this.x, y: WORLD_H - 34, w: len, h: 34, dir: 'up' }); this.x += len; }
  step(dy) { this.gy -= dy; }
  coin(x, y) { this.coins.push({ x, y }); }
  flag(x) { this.flags.push({ x, y: this.gy }); }
  spikeUp(x, w) { this.spikes.push({ x, y: this.gy - 22, w, h: 22, dir: 'up' }); }
  finish(keyBack, keyUp) {
    // Checkpoint Sanitizer: eliminate flags placed within 650px of each other
    const cleanFlags = [];
    for (let i = 0; i < this.flags.length; i++) {
      const f = this.flags[i];
      const tooClose = cleanFlags.some(cf => Math.hypot(cf.x - f.x, cf.y - f.y) < 650);
      if (!tooClose) cleanFlags.push({ x: f.x, y: f.y, on: false });
    }
    const lv = {
      name: this.name, hint: this.hint, hue: this.hue, coop: this.coop, traps: this.traps,
      w: this.x, h: this.h, wj: this.wj, stalactites: this.stalactites, meteors: this.meteors, risers: this.risers, spawn: this.spawn,
      solids: this.solids, spikes: this.spikes, crumbles: this.crumbles, springs: this.springs,
      crushers: this.crushers, boulders: this.boulders, sweepers: this.sweepers,
      plates: this.plates, gates: this.gates, ropes: this.ropes,
      coins: this.coins.map((c, i) => ({ x: c.x, y: c.y, id: i })),
      flags: cleanFlags,
      key: this.key || { x: this.x - (keyBack || 520), y: this.gy - (keyUp || 56) },
      exit: this.exitOv ? Object.assign({}, this.exitOv) : { x: this.x - 150, y: this.gy - 74, w: 54, h: 74 },
    };
    if (G.mode === 'party') scaleHazards(lv, partyN());
    return lv;
  }
}

const seg = {
  run(b, len, o) {
    o = o || {};
    const x0 = b.ground(len);
    (o.spikes || []).forEach(([dx, w]) => b.spikeUp(x0 + dx, w));
    (o.coins || []).forEach(([dx, dy]) => b.coin(x0 + dx, b.gy + dy));
    if (o.flag) b.flag(x0 + 70);
    return x0;
  },
  fakes(b, n, o) {
    o = o || {};
    const w = o.w || 100, g = o.g || 112, x0 = b.x;
    const dys = o.dys || [-10, -50, -20, -70, -30, -60, -10, -40];
    const real = o.real || [];
    b.spikes.push({ x: x0, y: WORLD_H - 34, w: g + n * (w + g), h: 34, dir: 'up' });
    for (let i = 0; i < n; i++) {
      const px = x0 + g + i * (w + g), py = b.gy + dys[i % dys.length];
      if (real.includes(i)) b.solids.push([px, py, w, 20]);
      else b.crumbles.push({ x: px, y: py, w, h: 20, st: 0, t: 0, fy: 0 });
      if (o.coins && o.coins.includes(i)) b.coin(px + w / 2, py - 48);
    }
    b.x = x0 + g + n * (w + g);
  },
  springWall(b, o) {
    o = o || {};
    const h = o.h || 190;
    const x0 = b.ground(330);
    const spx = x0 + 190;
    b.springs.push({ x: spx, y: b.gy - 14, w: 56, h: 14, power: 17.5, sq: 0 });
    b.spikes.push({ x: spx - 16, y: b.gy - 14 - 276, w: 88, h: 26, dir: 'down' });
    b.coin(spx + 30, b.gy - 14 - 215);
    b.step(h);
    return x0;
  },
  boulders(b, len, o) {
    o = o || {};
    const x0 = b.ground(len);
    const specs = o.specs || [[60, len - 60, 3.4, 0]];
    specs.forEach(([a, z, sp, off]) => b.boulders.push({ x0: x0 + a, x1: x0 + z, y: b.gy, r: o.r || 28, speed: sp, off: off || 0, cx: x0 + a, rot: 0 }));
    (o.plats || []).forEach(([dx, dy, w]) => b.solids.push([x0 + dx, b.gy + dy, w, 18]));
    (o.coins || []).forEach(([dx, dy]) => b.coin(x0 + dx, b.gy + dy));
    if (o.flag) b.flag(x0 + 70);
    return x0;
  },
  crushers(b, n, o) {
    o = o || {};
    const sp = o.spacing || 250;
    const x0 = b.ground(n * sp + 300);
    for (let i = 0; i < n; i++) {
      const cx = x0 + 190 + i * sp;
      b.crushers.push({ x: cx, w: 76, h: 130, top: b.gy - 540, restB: b.gy - 80, downB: b.gy,
        period: o.period || 3.2, off: o.offs ? o.offs[i] : i * 0.9, cb: b.gy - 80, shake: 0 });
      if (o.coins && o.coins.includes(i)) b.coin(cx + 38, b.gy - 24);
    }
    if (o.flag) b.flag(x0 + 70);
    return x0;
  },
  sprint(b, run, hold, o) {
    o = o || {};
    const x0 = b.ground(run + 420);
    const id = 'p' + (b.pid++);
    b.plates.push({ id, x: x0 + 70, y: b.gy - 10, w: 60, h: 10, hold, t: 0, on: false });
    b.gates.push({ x: x0 + 70 + run, y: b.gy - 340, w: 26, h: 340, ctrl: [id], mode: 'any', open: false, inv: false });
    (o.spikes || []).forEach(([dx, w]) => b.spikeUp(x0 + dx, w));
    (o.coins || []).forEach(([dx, dy]) => b.coin(x0 + dx, b.gy + dy));
    if (o.boulder) b.boulders.push({ x0: x0 + 200, x1: x0 + 70 + run - 40, y: b.gy, r: 26, speed: o.boulder, off: 0, cx: 0, rot: 0 });
    if (o.flag) b.flag(x0 + 40);
    return x0;
  },
  coopDoor(b, o) {
    o = o || {};
    const x0 = b.ground(780);
    const a = 'p' + (b.pid++), c = 'p' + (b.pid++);
    b.plates.push({ id: a, x: x0 + 120, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
    b.plates.push({ id: c, x: x0 + 390, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
    b.gates.push({ x: x0 + 330, y: b.gy - 340, w: 26, h: 340, ctrl: [a, c], mode: 'any', open: false, inv: false });
    (o.coins || []).forEach(([dx, dy]) => b.coin(x0 + dx, b.gy + dy));
    if (o.flag) b.flag(x0 + 40);
    return x0;
  },
  stackWall(b) {
    const x0 = b.ground(520);
    const lowGy = b.gy, wallX = x0 + 520;
    b.step(150);
    const x1 = b.ground(520);
    const id = 'p' + (b.pid++);
    b.plates.push({ id, x: x1 + 40, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
    b.gates.push({ x: wallX - 120, y: lowGy - 75, w: 120, h: 75, ctrl: [id], mode: 'any', open: false, inv: true });
    b.coin(x1 + 70, b.gy - 80);
    return x0;
  },
  rope(b, o) {
    o = o || {};
    const G = 400, xa = b.x, gy = b.gy;
    const ax = xa + G / 2, ay = gy - 500;
    b.spikes.push({ x: xa, y: WORLD_H - 34, w: G, h: 34, dir: 'up' });
    const pads = b.coop ? [
      { x: xa - 96, y: gy - 10, w: 66, h: 10 },
      { x: xa + G + 30, y: gy - 10, w: 66, h: 10 },
    ] : [];
    b.ropes.push({ ax, ay, full: 560, short: 330, cur: b.coop ? 330 : 560, pads, holder: -1, hs: -1, anch: !b.coop });
    if (o.key !== false) b.key = { rope: b.ropes.length - 1, x: 0, y: 0 };
    b.coin(xa + 20, gy + 180); b.coin(xa + G - 20, gy + 180);
    b.x = xa + G;
  },
  chaser(b, speed, delay) { b.sweepers.push({ x: -520, w: 220, y: -200, h: 1300, speed, delay, cx: -520 }); },
};


// v9 & v10 Segment Helpers
seg.cave = function (b, len, o) {
  o = o || {};
  const n = b.solids.length;
  const x0 = seg.run(b, len, o);
  if (o.ice) b.solids[n].ice = true;
  (o.at || []).forEach((dx) => b.stalactites.push({ x: x0 + dx, y: b.gy - 320, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0 }));
  return x0;
};
seg.meteor = function (b, len, o) {
  o = o || {};
  const x0 = seg.run(b, len, o);
  const n = o.n || 1, per = o.period || 3.4;
  for (let i = 0; i < n; i++) {
    b.meteors.push({ id: b.meteors.length + 1, x0: x0 + 110, x1: x0 + len - 70, period: per, off: (o.off || 0) + i * per / n,
      vx: o.vx === undefined ? 2.2 : o.vx, vy: 7, topY: b.gy - 760, gy: b.gy, exK: -1 });
  }
  return x0;
};
seg.iceRun = function (b, len, o) {
  const n = b.solids.length;
  const x0 = seg.run(b, len, o);
  b.solids[n].ice = true;
  return x0;
};
seg.ice = function (b, n, o) {
  o = o || {};
  const w = o.w || 150, g = o.g || 100, x0 = b.x;
  const dys = o.dys || [-10, -35, -10, -45, -20, -55, -15, -40];
  b.spikes.push({ x: x0, y: WORLD_H - 34, w: g + n * (w + g), h: 34, dir: 'up' });
  for (let i = 0; i < n; i++) {
    const px = x0 + g + i * (w + g), py = b.gy + dys[i % dys.length];
    const r = [px, py, w, 24]; r.ice = true; b.solids.push(r);
    if (o.coins && o.coins.includes(i)) b.coin(px + w / 2, py - 48);
  }
  b.x = x0 + g + n * (w + g);
};

// HARDCORE ANTI-SOLO: Dual simultaneous plates
seg.coopDualHold = function (b, dist, o) {
  o = o || {};
  // BOTH plates sit BEFORE the gate (the old layout put plate 2 behind the closed gate = unreachable = soft-lock).
  // Two players stand on the two plates at the same time, the gate opens, then both sprint through
  // (each plate keeps the gate powered for a few seconds after you step off).
  const gapP = Math.min(dist, 320);
  const x0 = b.ground(dist + 520);
  const p1 = 'p' + (b.pid++), p2 = 'p' + (b.pid++);
  const px2 = x0 + 80 + gapP;
  b.plates.push({ id: p1, x: x0 + 80, y: b.gy - 10, w: 60, h: 10, hold: 3, t: 0, on: false });
  b.plates.push({ id: p2, x: px2, y: b.gy - 10, w: 60, h: 10, hold: 3, t: 0, on: false });
  b.gates.push({ x: px2 + 60 + 190, y: b.gy - 340, w: 28, h: 340, ctrl: [p1, p2], mode: 'all', open: false, inv: false });
  b.coin(px2 + 60 + 190 + 120, b.gy - 60);
  if (o.flag) b.flag(x0 + 40);
  return x0;
};

// Vertical Tower Builder for Summit ascents
function buildTower(o) {
  const W = o.W || 900;
  const make = (H) => {
    const b = new LB(o.name, o.hint, o.hue, false);
    b.h = H; b.wj = true; b.x = W;
    const y0 = H - 60;
    b.solids.push([0, 0, 40, H + 200]);
    b.solids.push([W - 40, 0, 40, H + 200]);
    b.solids.push([40, y0, W - 80, H - y0 + 200]);
    b.spawn = [120, y0 - PH];
    let cur = { x0: 40, x1: W - 40, y: y0 };
    let ci = 0;
    const R = () => hash1((o.seed || 1) * 17.3 + (ci++) * 3.1);
    const ledge = (rise, w, want, op) => {
      op = op || {};
      const gmax = op.gmax || 118;
      let x0 = want - w / 2;
      if (x0 > cur.x1 + gmax) x0 = cur.x1 + gmax;
      if (x0 + w < cur.x0 - gmax) x0 = cur.x0 - gmax - w;
      x0 = clamp(x0, 60, W - 60 - w);
      const y = cur.y - rise;
      if (op.crumble) b.crumbles.push({ x: x0, y, w, h: 20, st: 0, t: 0, fy: 0 });
      else { const r = [x0, y, w, 20]; if (op.ice) r.ice = true; b.solids.push(r); }
      cur = { x0, x1: x0 + w, y, cx: x0 + w / 2 };
      return cur;
    };
    const flagHere = () => { if (cur.x1 - cur.x0 >= 140) b.flags.push({ x: (cur.x0 + cur.x1) / 2, y: cur.y }); };
    const rooms = {
      L(n, op) {
        for (let i = 0; i < n; i++) {
          const want = W / 2 + (i % 2 ? 1 : -1) * (op.amp || 150) + (R() - 0.5) * 40;
          ledge(85, 150, want, { crumble: op.crumble && i % 2 === 1 && i < n - 1, ice: op.ice });
          if (i % 3 === 2) b.coin(cur.cx, cur.y - 60);
          if (op.drip && i >= 2 && i % 2 === 0 && i < n - 1) b.stalactites.push({ x: cur.cx - 17, y: cur.y + 20, w: 34, h: 56, st: 0, t: 0, fy: 0, vy: 0 });
        }
        flagHere();
      },
      S(n) {
        for (let i = 0; i < n; i++) {
          const cx = (cur.x0 + cur.x1) / 2;
          b.springs.push({ x: cx - 28, y: cur.y - 14, w: 56, h: 14, power: 17.5, sq: 0 });
          const dir = cx > W / 2 ? -1 : 1;
          ledge(215, 170, cx + dir * (205 + R() * 30), { gmax: 120 });
          if (i === 0 || i === n - 1) b.coin(cur.cx, cur.y - 70);
        }
        flagHere();
      },
      C(hops) {
        ledge(85, 170, W / 2 + (R() < 0.5 ? -1 : 1) * 110, {});
        const cx = clamp((cur.x0 + cur.x1) / 2, 215, W - 215);
        const lg = b.solids[b.solids.length - 1];
        lg[0] = cx - 85; cur.x0 = cx - 85; cur.x1 = cx + 85; cur.cx = cx;
        const Hr = 100 + hops * 85, y = cur.y;
        b.flags.push({ x: cx, y });
        b.solids.push([cx - 130, y - Hr, 60, Hr - 100]);
        b.solids.push([cx + 70, y - Hr, 60, Hr - 100]);
        b.coin(cx, y - 60 - Math.floor(hops / 2) * 85);
        b.coin(cx, y - 60 - hops * 85 + 40);
        cur = { x0: cx + 70, x1: cx + 130, y: y - Hr, cx: cx + 100 };
      },
    };
    for (const r of o.rooms) rooms[r[0]](r[1], r[2] || {});
    // Summit ledge: must NOT hang over the ledge below it (head-bonk = stuck). Add a stepping ledge if needed,
    // then start the summit 56px inside the previous ledge's edge so there is always standing room beside its face.
    {
      const FW = 540;
      const okR = (c) => c.x0 + 56 <= W - 60 - FW, okL = (c) => c.x1 - 56 - FW >= 60;
      let guard = 0;
      while ((cur.x1 - cur.x0 < 140 || (!okR(cur) && !okL(cur))) && guard++ < 3) {
        ledge(85, 150, cur.cx < W / 2 ? 235 : W - 235, {});
      }
      const pc = (cur.x0 + cur.x1) / 2;
      const fx = (okR(cur) && (!okL(cur) || pc < W / 2)) ? cur.x0 + 56 : cur.x1 - 56 - FW;
      b.solids.push([fx, cur.y - 85, FW, 20]);
      cur = { x0: fx, x1: fx + FW, y: cur.y - 85, cx: fx + FW / 2 };
    }
    const sx = cur.x0, sy = cur.y;
    b.springs.push({ x: sx + 70, y: sy - 14, w: 56, h: 14, power: 17.5, sq: 0 });
    b.key = { x: sx + 98, y: sy - 215 };
    b.flags.push({ x: sx + 250, y: sy });
    b.coin(sx + 98, sy - 255); b.coin(sx + 300, sy - 60);
    const lv = b.finish(0, 0);
    lv.key = b.key;
    lv.exit = { x: sx + 540 - 110, y: sy - 74, w: 54, h: 74 };
    lv._ext = y0 - sy;
    if (o.riser) lv.risers.push({ y: H + 30, speed: o.riser.speed, delay: o.riser.delay || 8, kind: o.riser.kind || 'maw', cy: H + 30 });
    return lv;
  };
  const probe = make(6000);
  return make(probe._ext + 60 + 330);
}


// ============================================================================
// v11  PARTY SCALING + TROLL-TRAP SEGMENTS
// ============================================================================
const partyN = () => Math.max(1, Math.min(10, PARTY_N | 0));
const hazardK = (n) => 0.75 + 0.025 * Math.max(1, Math.min(10, n | 0));
// tallest wall a stack of N bunnies can still clear (head-boosted jump 165 - 25 safety, +36 per extra bunny, stack capped at 4)
const cliffCap = (n) => 36 * (Math.min(n, 4) - 1) + 165 - 25;

function scaleHazards(lv, n) {
  const f = hazardK(n);
  lv.hz = f; lv.pn = n;
  (lv.boulders || []).forEach((q) => { q.speed *= f; });
  (lv.crushers || []).forEach((q) => { q.period /= f; });
  (lv.meteors || []).forEach((q) => { q.period /= f; });
  (lv.sweepers || []).forEach((q) => { q.speed *= f; });
  (lv.risers || []).forEach((q) => { q.speed *= f; });
  (lv.traps || []).forEach((t) => { if (t.k === 'arena') t.hz = f; });
}

// N = 1: a plain staircase replaces the stacking wall so a lone bunny can still finish
seg.partyStairs = function (b, H) {
  const n = Math.max(2, Math.ceil(H / 66));
  const rise = Math.round(H / n);
  const x0 = b.ground(420);
  for (let i = 0; i < n; i++) { b.step(rise); b.ground(i === n - 1 ? 560 : 170); }
  b.coin(b.x - 470, b.gy - 80);
  return x0;
};

// Wall that needs a bunny tower. Height auto-shrinks with the party size; one bunny on top presses the plate, which raises stairs for everyone else.
seg.partyStackCliff = function (b, cliffH) {
  const n = partyN();
  const H = Math.max(60, Math.min(cliffH || 170, cliffCap(n)));
  if (n <= 1) return seg.partyStairs(b, H);
  const x0 = b.ground(560);
  const lowGy = b.gy, wallX = x0 + 560;
  b.step(H);
  const x1 = b.ground(560);
  const pid = 'p' + (b.pid++);
  b.plates.push({ id: pid, x: x1 + 60, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  const s1 = Math.round(H / 3), s2 = Math.round(2 * H / 3);
  b.gates.push({ x: wallX - 190, y: lowGy - s1, w: 100, h: s1, ctrl: [pid], mode: 'any', open: false, inv: true });
  b.gates.push({ x: wallX - 90, y: lowGy - s2, w: 90, h: s2, ctrl: [pid], mode: 'any', open: false, inv: true });
  b.coin(x1 + 90, b.gy - 80);
  return x0;
};

// min(req, N) pressure plates that must be powered together (mode 'count'); hold time grows for tiny parties
seg.partyPlates = function (b, req, o) {
  o = o || {};
  const n = partyN();
  const k = Math.max(1, Math.min(req || 2, n));
  const hold = (o.hold || 3.5) + (n <= 2 ? 1.5 : 0) + (k > 4 ? 0.5 : 0);
  const pitch = 84, lead = 90, tail = 220;
  const x0 = b.ground(lead + k * pitch + tail + 220);
  const ids = [];
  for (let i = 0; i < k; i++) {
    const id = 'p' + (b.pid++); ids.push(id);
    b.plates.push({ id, x: x0 + lead + i * pitch, y: b.gy - 10, w: 60, h: 10, hold, t: 0, on: false });
  }
  const gx = x0 + lead + k * pitch + tail;
  b.gates.push({ x: gx, y: b.gy - 340, w: 28, h: 340, ctrl: ids, mode: 'count', need: k, open: false, inv: false });
  b.coin(gx + 120, b.gy - 60);
  if (o.flag) b.flag(x0 + 40);
  return x0;
};

// three plates on three storeys
seg.partyTierPlates = function (b, o) {
  o = o || {};
  const n = partyN();
  const k = Math.max(1, Math.min(3, n));
  const hold = (o.hold || 5) + (n <= 2 ? 1.5 : 0);
  const x0 = b.ground(900);
  const ids = [];
  const tier = [[80, 0], [220, -80], [380, -160]];
  for (let i = 0; i < k; i++) {
    const id = 'p' + (b.pid++); ids.push(id);
    const [dx, dy] = tier[i];
    if (dy !== 0) b.solids.push([x0 + dx - 20, b.gy + dy, 100, 18]);
    b.plates.push({ id, x: x0 + dx, y: b.gy + dy - 10, w: 60, h: 10, hold, t: 0, on: false });
  }
  b.gates.push({ x: x0 + 620, y: b.gy - 340, w: 30, h: 340, ctrl: ids, mode: 'count', need: k, open: false, inv: false });
  b.coin(x0 + 410, b.gy - 220);
  if (o.flag) b.flag(x0 + 40);
  return x0;
};

// TROLL 1 - invisible spikes that only punish a mid-air jump or turning back, never plain walking
seg.antiBaitSpikes = function (b, len, o) {
  o = o || {};
  len = Math.max(560, len || 720);
  const x0 = b.ground(len);
  const idx = b.traps.length;
  for (let gx = x0 + 170; gx + 64 <= x0 + len - 110; gx += 128) {
    b.spikes.push({ x: gx, y: b.gy - 24, w: 64, h: 24, dir: 'up', hid: true, bt: idx, ph: 0, live: false });
  }
  b.traps.push({ k: 'bait', zx0: x0 + 120, zx1: x0 + len - 40, gy: b.gy, st: 0, t: 0 });
  (o.coins || []).forEach(([dx, dy]) => b.coin(x0 + dx, b.gy + dy));
  if (o.flag) b.flag(x0 + 40);
  return x0;
};

// TROLL 2 - a row of plates, only one is real; the fakes drop stalactites or reverse LEFT/RIGHT for 3 s
seg.fakePlates = function (b, n, o) {
  o = o || {};
  n = Math.max(3, Math.min(n || 4, 6));
  const pitch = 150, lead = 120, tail = 230, hold = 4.5;
  const x0 = b.ground(lead + n * pitch + tail + 200);
  const idx = b.traps.length;
  const real = 1 + ((n + idx + Math.floor(x0 / 100)) % (n - 1));
  const rid = 'p' + (b.pid++);
  const fakes = [];
  for (let i = 0; i < n; i++) {
    const px = x0 + lead + i * pitch, py = b.gy - 10;
    if (i === real) b.plates.push({ id: rid, x: px, y: py, w: 60, h: 10, hold, t: 0, on: false });
    else fakes.push({ x: px, y: py, w: 60, h: 10, hold: 0, t: 0, on: false, pr: false, used: false, v: ((i + idx) % 2 === 0) ? 'stalac' : 'rev' });
  }
  const gx = x0 + lead + n * pitch + tail;
  b.gates.push({ x: gx, y: b.gy - 340, w: 28, h: 340, ctrl: [rid], mode: 'any', open: false, inv: false });
  b.traps.push({ k: 'fake', plates: fakes });
  b.coin(gx + 120, b.gy - 60);
  if (o.flag) b.flag(x0 + 40);
  return x0;
};

// TROLL 3 - both doors lock, free-bouncing saws for 12-15 s. High shelves are the safe spots (stack up, or use the spring when N <= 2).
seg.sawArena = function (b, duration, count, o) {
  o = o || {};
  const n = partyN();
  duration = Math.max(12, Math.min(15, duration || 13));
  const cnt = Math.max(2, Math.min(4, count || 3, 2 + Math.floor((n - 1) / 3)));
  const LEAD = 120, RW = 900, TAIL = 120, SH = 168;
  const x0 = b.ground(LEAD + RW + TAIL);
  const ax0 = x0 + LEAD, ax1 = ax0 + RW, gy = b.gy, ceilY = gy - 440;
  const idx = b.traps.length;
  b.flag(x0 + 40);
  b.gates.push({ x: ax0 - 26, y: ceilY, w: 26, h: 440, ctrl: [], mode: 'any', open: false, inv: false, tr: idx, role: 'in' });
  b.gates.push({ x: ax1, y: ceilY, w: 26, h: 440, ctrl: [], mode: 'any', open: false, inv: false, tr: idx, role: 'out' });
  b.solids.push([ax0 - 26, ceilY - 40, RW + 52, 40]);
  b.solids.push([ax0, gy - SH, 160, 18]);
  b.solids.push([ax1 - 160, gy - SH, 160, 18]);
  if (n <= 2) b.springs.push({ x: ax0 + 196, y: gy - 14, w: 56, h: 14, power: 17.5, sq: 0 });
  const saws = [];
  for (let j = 0; j < cnt; j++) {
    const sd = 7.7 * j + 3.3 * idx + 0.013 * x0;
    saws.push({ r: 26, sx: +(2.1 + 1.5 * hash1(sd)).toFixed(2), sy: +(1.2 + 1.1 * hash1(sd + 9.1)).toFixed(2), ox: +(hash1(sd + 3.3) * 4).toFixed(2), oy: +(hash1(sd + 5.5) * 4).toFixed(2) });
  }
  b.traps.push({ k: 'arena', x0: ax0, x1: ax1, gy, ceilY, trig: ax0 + 220, dur: duration, saws, hz: 1, st: 0, t0: 0, empty: 0, shelfH: SH });
  b.coin(ax0 + 80, gy - SH - 50); b.coin(ax1 - 80, gy - SH - 50);
  return x0;
};

// TROLL 4 - the exit door runs away (or sinks and re-emerges across a spike pit) the moment a bunny gets within 120 px,
// unless the secret button on the high ledge was pressed first. MUST be the last segment of a level.
seg.trollDoor = function (b, o) {
  o = o || {};
  const mode = o.mode === 'sink' ? 'sink' : 'run';
  const x0 = b.ground(860);
  const gy = b.gy;
  b.key = { x: x0 + 300, y: gy - 56 };
  b.flag(x0 + 40);
  b.solids.push([x0 + 70, gy - 88, 104, 18]);
  const btn = { x: x0 + 100, y: gy - 88 - 10, w: 44, h: 10 };
  b.coin(x0 + 122, gy - 88 - 52);
  const decoy = { x: x0 + 690, y: gy - 74, w: 54, h: 74 };
  const GAP = 120;
  const hops = [[-34, 170], [-80, 140], [-30, 140], [-78, 160], [-40, 320]];
  let cx = b.x;
  b.spikes.push({ x: cx, y: WORLD_H - 34, w: hops.reduce((s, h) => s + h[1] + GAP, 0), h: 34, dir: 'up' });
  let lastTop = gy, lastX = cx;
  hops.forEach(([dy, w], i) => {
    cx += GAP;
    b.solids.push([cx, gy + dy, w, 20]);
    if (i === 0) b.flags.push({ x: cx + 85, y: gy + dy });
    if (i === 1 || i === 3) b.coin(cx + w / 2, gy + dy - 56);
    lastTop = gy + dy; lastX = cx; cx += w;
  });
  const dest = { x: lastX + 210, y: lastTop - 74 };
  b.x = cx + 80;
  b.exitOv = decoy;
  b.traps.push({ k: 'door', mode, btn, ex0: decoy.x, ey0: decoy.y, dx: dest.x, dy: dest.y, st: 0, t: 0, dur: mode === 'sink' ? 1.5 : 1.3 });
  return x0;
};

const LEVELS = { solo: [], coop: [], party: [] };
const S = LEVELS.solo, C = LEVELS.coop, PTY = LEVELS.party;

// SOLO LEVELS (10 STAGES)
S.push(() => {
  const b = new LB('Warm-Up Sprint', 'Fast parkour. Short gaps, spikes, and your first crumbling floor.', 200);
  seg.run(b, 720, { flag: true, coins: [[380, -60]] });
  b.gap(130);
  seg.run(b, 520, { spikes: [[210, 66]], coins: [[243, -120]] });
  b.gap(150);
  seg.run(b, 380);
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 600, { flag: true, spikes: [[170, 64], [360, 64]] });
  b.gap(150);
  seg.run(b, 420, { coins: [[210, -60]] });
  b.gap(160);
  seg.run(b, 560, { spikes: [[150, 60], [300, 60]] });
  seg.fakes(b, 4, { coins: [2] });
  seg.run(b, 900, { coins: [[500, -60]] });
  return b.finish(560, 56);
});

S.push(() => {
  const b = new LB('Crumble Canyon', 'Every pale platform lies. They collapse 0.4 s after you touch them!', 280);
  seg.run(b, 640, { flag: true });
  seg.fakes(b, 5, { coins: [2] });
  seg.run(b, 380, { flag: true });
  seg.fakes(b, 6, { real: [3], coins: [1, 4], dys: [-10, -60, -30, -80, -40, -70] });
  seg.run(b, 460, { spikes: [[200, 70]], coins: [[230, -120]] });
  seg.fakes(b, 7, { g: 120, w: 90, coins: [3], dys: [-20, -70, -30, -90, -50, -100, -60] });
  seg.run(b, 420, { flag: true });
  seg.fakes(b, 5, { real: [1, 3], dys: [-10, -80, -20, -90, -30] });
  seg.run(b, 900, { coins: [[400, -60]] });
  return b.finish(520, 56);
});

S.push(() => {
  const b = new LB('Troll Springs', 'Bounce up the walls - but hold RIGHT right away. Spikes love the ceiling.', 330);
  seg.run(b, 640, { flag: true, coins: [[330, -60]] });
  seg.springWall(b, { h: 130 });
  seg.run(b, 560, { flag: true, spikes: [[260, 70]], coins: [[300, -60]] });
  b.gap(140);
  seg.run(b, 300);
  seg.springWall(b, { h: 140 });
  seg.run(b, 460, { spikes: [[200, 64]] });
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 320, { flag: true });
  seg.springWall(b, { h: 140 });
  seg.run(b, 420, { coins: [[210, -60]] });
  b.gap(150);
  seg.run(b, 300);
  seg.springWall(b, { h: 140 });
  seg.run(b, 900, { coins: [[500, -60]] });
  return b.finish(540, 56);
});

S.push(() => {
  const b = new LB('Boulder Alley', 'Jump the rolling boulders! Refuge platforms are your friends.', 230);
  seg.run(b, 600, { flag: true });
  seg.boulders(b, 900, { specs: [[80, 840, 3.2, 0]], plats: [[430, -100, 120]], coins: [[490, -170]] });
  b.gap(130);
  seg.run(b, 380, { flag: true });
  seg.boulders(b, 1000, { specs: [[60, 940, 3.6, 0], [60, 940, 3.0, 4.5]], plats: [[250, -100, 110], [620, -100, 110]], coins: [[305, -170]] });
  seg.run(b, 360, { spikes: [[150, 64]] });
  seg.boulders(b, 1100, { r: 32, specs: [[60, 1040, 4.0, 0], [60, 1040, 3.4, 3], [60, 1040, 2.8, 7]], plats: [[300, -100, 110], [700, -100, 110]], coins: [[355, -180], [755, -180]], flag: true });
  seg.run(b, 800);
  return b.finish(500, 56);
});

S.push(() => {
  const b = new LB('Crusher Gauntlet', 'Falling crushers shake before they slam. Read the rhythm, then run!', 15);
  seg.run(b, 560, { flag: true });
  seg.crushers(b, 3, { spacing: 260, coins: [1] });
  b.gap(120);
  seg.run(b, 320, { flag: true });
  seg.crushers(b, 4, { spacing: 240, period: 2.8, coins: [2] });
  seg.run(b, 300, { spikes: [[120, 60]] });
  seg.fakes(b, 3, {});
  seg.run(b, 300, { flag: true });
  seg.crushers(b, 5, { spacing: 230, period: 2.6, offs: [0, 1.1, 0.4, 1.9, 0.8], coins: [3] });
  seg.run(b, 800);
  return b.finish(500, 56);
});

S.push(() => {
  const b = new LB('Sprint or Die', 'Step on the plate - the steel door closes in seconds. SPRINT!', 170);
  seg.run(b, 520, { flag: true });
  seg.sprint(b, 560, 2.7, { coins: [[400, -60]] });
  seg.run(b, 300, { flag: true });
  seg.sprint(b, 620, 2.8, { spikes: [[330, 60]], coins: [[360, -120]] });
  b.gap(140);
  seg.run(b, 340, { flag: true });
  seg.sprint(b, 700, 3.0, { spikes: [[260, 60], [480, 60]], boulder: 3.2, coins: [[290, -120]] });
  seg.fakes(b, 3, {});
  seg.run(b, 300, { flag: true });
  seg.sprint(b, 780, 3.2, { spikes: [[300, 60], [520, 64]], boulder: 3.6, coins: [[550, -120]] });
  seg.run(b, 700);
  return b.finish(500, 56);
});

S.push(() => {
  const b = new LB('Rope Swing', 'The key hangs on a rope over the chasm. Grab it, pump left/right, and swing across!', 260);
  seg.run(b, 680, { flag: true, coins: [[360, -60]] });
  seg.fakes(b, 4, { coins: [2] });
  seg.run(b, 460, { flag: true });
  seg.rope(b);
  seg.run(b, 560, { flag: true, spikes: [[240, 64]] });
  seg.springWall(b);
  seg.run(b, 380, { coins: [[190, -60]] });
  b.gap(150);
  seg.run(b, 380, { flag: true });
  seg.rope(b, { key: false });
  seg.run(b, 900, { coins: [[500, -60]] });
  return b.finish(480, 56);
});

S.push(() => {
  const b = new LB('Death Chase', 'A wall of doom chases you from the left. NEVER stop running!', 0);
  seg.chaser(b, 150, 3.0);
  seg.run(b, 700);
  b.gap(130);
  seg.run(b, 420, { spikes: [[200, 64]] });
  b.gap(150);
  seg.run(b, 360);
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 460, { spikes: [[150, 60], [300, 60]] });
  b.gap(150);
  seg.run(b, 360, { coins: [[180, -60]] });
  seg.springWall(b, { h: 190 });
  seg.run(b, 500);
  b.gap(160);
  seg.run(b, 400, { spikes: [[170, 64]] });
  seg.fakes(b, 4, { coins: [2] });
  seg.run(b, 460);
  b.gap(150);
  seg.run(b, 800);
  return b.finish(420, 56);
});

S.push(() => {
  const b = new LB('Troll Tower', 'Springs, crushers and boulders. Nothing here is honest.', 40);
  seg.run(b, 560, { flag: true });
  seg.springWall(b);
  seg.boulders(b, 800, { specs: [[60, 740, 3.4, 0]], plats: [[360, -100, 110]], coins: [[415, -170]] });
  seg.fakes(b, 4, { coins: [1] });
  seg.crushers(b, 3, { spacing: 250, coins: [0], flag: true });
  b.gap(140);
  seg.run(b, 300);
  seg.springWall(b, { h: 200 });
  seg.sprint(b, 560, 2.7, { spikes: [[300, 60]], coins: [[330, -120]] });
  seg.fakes(b, 5, { real: [2], coins: [3] });
  seg.run(b, 320, { flag: true });
  seg.boulders(b, 1000, { specs: [[60, 940, 3.8, 0], [60, 940, 3.2, 4]], plats: [[300, -100, 110], [640, -100, 110]], coins: [[355, -170]] });
  seg.run(b, 800);
  return b.finish(500, 56);
});

S.push(() => {
  const b = new LB('RAGE QUIT', 'Everything. At once. Good luck. (You will rage.)', 350);
  seg.chaser(b, 135, 4.0);
  seg.run(b, 620, { flag: true });
  seg.fakes(b, 4, { coins: [1] });
  seg.run(b, 360, { spikes: [[150, 60]] });
  seg.springWall(b);
  seg.crushers(b, 3, { spacing: 240, period: 2.7, coins: [1] });
  seg.fakes(b, 5, { real: [2], coins: [3] });
  seg.run(b, 300, { flag: true });
  seg.sprint(b, 600, 2.7, { spikes: [[320, 60]], boulder: 3.4, coins: [[350, -120]] });
  seg.rope(b);
  seg.run(b, 480, { flag: true });
  seg.springWall(b, { h: 200 });
  seg.boulders(b, 900, { specs: [[60, 840, 3.8, 0], [60, 840, 3.2, 3.5]], plats: [[330, -100, 110], [640, -100, 110]], coins: [[385, -170]] });
  seg.fakes(b, 5, { real: [1, 4], dys: [-10, -70, -30, -90, -50] });
  seg.run(b, 900, { coins: [[500, -60]] });
  return b.finish(460, 56);
});

// CO-OP LEVELS (8 STAGES)
C.push(() => {
  const b = new LB('First Tether', 'Stay together! Stack on heads to climb, then stand on the top plate for the stairs.', 200, true);
  seg.run(b, 760, { flag: true, coins: [[380, -60]] });
  b.gap(130);
  seg.run(b, 460, { coins: [[230, -110]], spikes: [[200, 60]] });
  seg.stackWall(b);
  seg.run(b, 420, { flag: true });
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 460, { flag: true });
  seg.coopDoor(b, { coins: [[240, -60]] });
  seg.run(b, 760, { coins: [[300, -60]] });
  return b.finish(520, 56);
});

C.push(() => {
  const b = new LB('Hold the Door', 'One holds the plate, the other runs. Then swap - the far plate holds it for the partner.', 170, true);
  seg.run(b, 640, { flag: true });
  seg.coopDoor(b, { flag: false, coins: [[560, -60]] });
  seg.run(b, 320, { flag: true });
  seg.sprint(b, 560, 3.2, { coins: [[400, -60]] });
  seg.run(b, 300, { flag: true });
  seg.coopDoor(b, { coins: [[250, -110]] });
  b.gap(140);
  seg.run(b, 340);
  seg.stackWall(b);
  seg.run(b, 400, { flag: true });
  seg.coopDoor(b, {});
  seg.run(b, 760, { coins: [[300, -60]] });
  return b.finish(500, 56);
});

C.push(() => {
  const b = new LB('Crumbling Duo', 'Fake floors everywhere! Dont dawdle - rope tension will drag you along.', 280, true);
  seg.run(b, 680, { flag: true });
  seg.fakes(b, 5, { coins: [2] });
  seg.run(b, 360, { flag: true });
  seg.fakes(b, 6, { real: [3], coins: [1, 4], dys: [-10, -60, -30, -80, -40, -70] });
  seg.run(b, 400, { flag: true, coins: [[200, -60]] });
  seg.stackWall(b);
  seg.fakes(b, 5, { dys: [-10, -70, -30, -90, -50], coins: [2] });
  seg.run(b, 420, { flag: true });
  seg.coopDoor(b, {});
  seg.run(b, 760);
  return b.finish(520, 56);
});

C.push(() => {
  const b = new LB('Pendulum Pit', 'One partner stands on the anchor pad to lower the rope. The other swings for the key!', 260, true);
  seg.run(b, 640, { flag: true, coins: [[330, -60]] });
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 420, { flag: true });
  seg.rope(b);
  seg.run(b, 520, { flag: true, spikes: [[260, 64]] });
  seg.stackWall(b);
  seg.run(b, 380, { flag: true });
  seg.coopDoor(b, { coins: [[250, -60]] });
  seg.run(b, 760);
  return b.finish(520, 56);
});

C.push(() => {
  const b = new LB('Crusher Duo', 'Crushers + troll springs. Keep the rope slack and the timing tight.', 15, true);
  seg.run(b, 600, { flag: true });
  seg.crushers(b, 3, { spacing: 260, coins: [1] });
  seg.springWall(b);
  seg.run(b, 460, { flag: true, spikes: [[240, 64]] });
  seg.coopDoor(b, {});
  seg.crushers(b, 4, { spacing: 240, period: 2.8, coins: [2], flag: true });
  seg.run(b, 300);
  seg.stackWall(b);
  seg.run(b, 800, { coins: [[400, -60]] });
  return b.finish(520, 56);
});

C.push(() => {
  const b = new LB('Boulder Brothers', 'Timed plates + rolling boulders. Teamwork under pressure!', 230, true);
  seg.run(b, 560, { flag: true });
  seg.boulders(b, 900, { specs: [[60, 840, 3.4, 0]], plats: [[380, -100, 130]], coins: [[445, -170]] });
  seg.sprint(b, 600, 3.0, { boulder: 3.2, coins: [[400, -60]] });
  seg.run(b, 300, { flag: true });
  seg.stackWall(b);
  seg.boulders(b, 1000, { specs: [[60, 940, 3.8, 0], [60, 940, 3.2, 4]], plats: [[300, -100, 120], [640, -100, 120]], coins: [[360, -170]], flag: true });
  seg.coopDoor(b, {});
  seg.run(b, 760);
  return b.finish(520, 56);
});

C.push(() => {
  const b = new LB('Troll Duo', 'Springs, a rope key and crumbling floors. Everything wants you apart.', 330, true);
  seg.run(b, 580, { flag: true });
  seg.springWall(b);
  seg.run(b, 420, { flag: true, coins: [[210, -60]] });
  seg.fakes(b, 4, { coins: [1] });
  seg.run(b, 400, { flag: true });
  seg.rope(b);
  seg.run(b, 480, { flag: true });
  seg.springWall(b, { h: 200 });
  seg.crushers(b, 3, { spacing: 250, coins: [1] });
  seg.coopDoor(b, { flag: false });
  seg.run(b, 760, { coins: [[300, -60]] });
  return b.finish(520, 56);
});

C.push(() => {
  const b = new LB('Grand Tether Finale', 'The ultimate co-op test. Rope, stacks, plates, crushers, boulders and trolls.', 48, true);
  seg.chaser(b, 120, 5.0);
  seg.run(b, 640, { flag: true });
  seg.fakes(b, 4, { coins: [1] });
  seg.run(b, 380, { flag: true });
  seg.springWall(b);
  seg.stackWall(b);
  seg.crushers(b, 3, { spacing: 250, period: 2.8, coins: [1], flag: true });
  seg.coopDoor(b, {});
  seg.run(b, 360, { flag: true });
  seg.rope(b);
  seg.run(b, 460, { flag: true });
  seg.boulders(b, 960, { specs: [[60, 900, 3.6, 0], [60, 900, 3.1, 4]], plats: [[320, -100, 120], [660, -100, 120]], coins: [[380, -170]] });
  seg.sprint(b, 600, 3.0, { spikes: [[320, 60]], coins: [[350, -120]] });
  seg.fakes(b, 5, { real: [2], coins: [3] });
  seg.run(b, 900, { coins: [[450, -60]] });
  return b.finish(480, 56);
});

// ============================================================================
// PARTY LEVELS (6 STAGES - NO TETHER, STACKING & MULTI-BUNNY TEAMWORK 2-10 PLAYERS)
// ============================================================================
PTY.push(() => {
  const b = new LB('Bunny Tower 101', 'Nhảy lên đầu đồng đội để xếp tháp thỏ leo lên vách cao dẫm nút hạ cầu!', 140, false);
  seg.run(b, 720, { flag: true, coins: [[360, -60]] });
  seg.partyStackCliff(b, 160);
  seg.run(b, 500, { flag: true });
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 800, { coins: [[300, -60]] });
  return b.finish(520, 56);
});

PTY.push(() => {
  const b = new LB('Cầu Bập Bênh Cân Não', 'Một bạn đứng giữ công tắc, bạn kia chạm công tắc hẹn giờ rồi lao qua cửa trước khi nó đóng!', 45, false);
  seg.run(b, 600, { flag: true });
  b.gap(120);
  seg.run(b, 340, { flag: true });
  seg.partyPlates(b, 2, { hold: 3 });
  seg.run(b, 400, { flag: true, spikes: [[180, 60]] });
  seg.fakes(b, 4, { coins: [2] });
  seg.run(b, 800);
  return b.finish(500, 56);
});

PTY.push(() => {
  const b = new LB('Công Tắc Tam Trọng', '3 công tắc ở 3 tầng, mỗi công tắc giữ 5 giây sau khi rời. Chạm đủ cả 3 rồi lao qua cửa sắt!', 210, false);
  seg.run(b, 640, { flag: true });
  seg.partyTierPlates(b, { hold: 5 });
  seg.run(b, 400, { flag: true });
  seg.crushers(b, 3, { spacing: 240, coins: [1] });
  seg.run(b, 800);
  return b.finish(520, 56);
});

PTY.push(() => {
  const b = new LB('Vách Núi 3 Tầng', 'Vách núi cao 175px! Phải xếp chồng 3-4 bạn thỏ thành tháp sống để với tới đỉnh!', 280, false);
  seg.run(b, 620, { flag: true });
  seg.partyStackCliff(b, 175);
  seg.run(b, 500, { flag: true });
  seg.boulders(b, 800, { specs: [[60, 740, 3.2, 0]], plats: [[340, -100, 120]], coins: [[400, -170]] });
  seg.run(b, 800);
  return b.finish(500, 56);
});

PTY.push(() => {
  const b = new LB('Lò Xo & Búa Ép Siêu Nảy', 'Độ nảy tối đa! Nhảy lên đầu đồng đội được nhân đôi lực bật cao qua hàng búa ép!', 330, false);
  seg.run(b, 580, { flag: true });
  seg.springWall(b, { h: 190 });
  seg.run(b, 420, { flag: true, coins: [[210, -60]] });
  seg.crushers(b, 4, { spacing: 250, period: 2.8, coins: [1, 2], flag: true });
  seg.fakes(b, 5, { real: [2], coins: [3] });
  seg.run(b, 400, { flag: true });
  seg.boulders(b, 900, { specs: [[60, 840, 3.6, 0]], plats: [[380, -100, 130]], coins: [[440, -170]] });
  seg.run(b, 800);
  return b.finish(500, 56);
});

PTY.push(() => {
  const b = new LB('Đại Tiệc Hỗn Loạn Roblox', 'Màn tiệc tổng hợp đỉnh cao: Xếp chồng tháp, sàn nứt và bức tường tử thần!', 355, false);
  seg.chaser(b, 110, 5.0);
  seg.run(b, 600, { flag: true });
  seg.fakes(b, 4, { coins: [1] });
  seg.partyStackCliff(b, 170);
  seg.crushers(b, 3, { spacing: 240, period: 2.7, coins: [1], flag: true });
  seg.boulders(b, 850, { specs: [[60, 800, 3.5, 0]], plats: [[320, -100, 110]], coins: [[370, -170]] });
  seg.fakes(b, 5, { real: [1, 4], dys: [-10, -70, -30, -90, -50] });
  seg.run(b, 900, { coins: [[500, -60]] });
  return b.finish(480, 56);
});


// ---------------------------------------------------------------------------
// SOLO LEVELS 11 - 50 (8 Towers + 32 Gauntlets)
// ---------------------------------------------------------------------------
const END = (b) => seg.run(b, 900, { coins: [[500, -60]] });
const MOD = {
  run: (b, d, k) => seg.run(b, 520 + (k % 3) * 60, { flag: k % 2 === 0, spikes: d > 0.2 ? [[200, 60]] : [], coins: [[260, -60]] }),
  gap: (b, d) => { b.gap(Math.round(120 + d * 40)); seg.run(b, 460, { spikes: d > 0.5 ? [[210, 60]] : [], flag: true }); },
  fakes: (b, d) => { seg.fakes(b, 3 + Math.floor(d * 3), { coins: [1] }); seg.run(b, 420, { flag: true }); },
  spring: (b) => { seg.springWall(b, { h: 170 }); seg.run(b, 420, { flag: true }); },
  boulder: (b, d) => seg.boulders(b, 820, { specs: [[60, 780, 3.2 + d * 0.9, 0]], plats: [[320, -100, 110]], coins: [[370, -170]], flag: true }),
  boulder2: (b, d) => seg.boulders(b, 900, { specs: [[60, 430, 3.5 + d * 0.8, 0], [470, 860, 3.5 + d * 0.8, 0.7]], plats: [[200, -100, 110], [640, -100, 110]], flag: true }),
  crush: (b, d) => seg.crushers(b, 3, { spacing: Math.round(250 - d * 20), period: +(3.0 - d * 0.4).toFixed(2), coins: [1], flag: true }),
  sprint: (b, d) => { seg.sprint(b, 560, 3.0, { coins: [[380, -60]], boulder: d > 0.4 ? 3.2 : 0 }); seg.run(b, 380, { flag: true }); },
  cave: (b) => seg.cave(b, 740, { at: [200, 400, 620], flag: true, coins: [[360, -60]] }),
  caveIce: (b) => seg.cave(b, 760, { ice: true, at: [220, 450, 650], flag: true, coins: [[360, -70]] }),
  ice: (b, d) => { seg.ice(b, 3 + (d > 0.5 ? 1 : 0), { coins: [1] }); seg.run(b, 420, { flag: true }); },
  iceRun: (b, d) => seg.iceRun(b, 580, { spikes: d > 0.3 ? [[270, 60]] : [], coins: [[260, -70]], flag: true }),
  meteor: (b, d) => seg.meteor(b, 780, { period: +(3.6 - d * 0.8).toFixed(2), coins: [[380, -60]], flag: true }),
  meteor2: (b, d) => seg.meteor(b, 860, { n: 2, period: +(4.4 - d * 0.8).toFixed(2), coins: [[430, -60]], flag: true }),
  rope: (b) => { seg.run(b, 520, { flag: true }); seg.rope(b, { key: false }); seg.run(b, 520, { flag: true, coins: [[240, -60]] }); },
};
const MIX = [
  [10, 'Stalactite Cave', 'Walk under a stalactite and it shakes, then drops. Keep moving!', 215, 'cave gap cave fakes cave'],
  [11, 'Frozen Lake', 'Ice is slippery! Build momentum early and plan every landing.', 195, 'ice iceRun gap iceRun ice iceRun'],
  [12, 'Meteor Meadow', 'Red rings on the ground warn of incoming meteors.', 20, 'meteor gap meteor fakes meteor'],
  [14, 'Boulder Canyon', 'Time the rolling boulders; hop their platforms.', 30, 'boulder gap boulder2 spring boulder'],
  [15, 'Crusher Row', 'Crushers on a slippery floor. Do not slide under one!', 260, 'run crush iceRun crush fakes crush'],
  [16, 'Plate Panic', 'Step on the plate, then sprint to the gate before it closes.', 150, 'run sprint run sprint crush'],
  [17, 'Slip & Drip', 'Icy cave floors and falling stalactites.', 205, 'caveIce gap caveIce iceRun caveIce'],
  [19, 'Meteor Marathon', 'Two meteor streams at once. Watch the sky, not just the floor.', 15, 'meteor2 gap meteor2 fakes meteor2 sprint'],
  [20, 'Void Maw I', 'The Void Maw is awake. Do not stop running!', 275, 'run gap fakes run gap spring', [105, 6]],
  [21, 'Glass Gauntlet', 'Crumbling glass over ice. Think before you jump.', 190, 'fakes ice fakes iceRun ice fakes'],
  [22, 'Rope Canyon', 'Swing across the canyons. Jump to grab the rope.', 120, 'rope gap rope fakes rope'],
  [24, 'Boulder Brothers', 'Double boulders. Find the rhythm.', 35, 'boulder2 gap boulder2 spring boulder2 boulder'],
  [25, 'Press Gang', 'Fast crushers, short spacing.', 280, 'crush gap crush fakes crush crush'],
  [26, 'Ice Cavern', 'Everything slips. Everything drips.', 200, 'caveIce ice caveIce ice caveIce iceRun'],
  [27, 'Meteor Storm', 'The sky is falling, and something is chasing you.', 10, 'meteor gap meteor2 fakes meteor', [110, 6]],
  [29, 'Plate Rush', 'Fast sprints with rolling boulders on your heels.', 160, 'sprint gap sprint crush sprint'],
  [30, 'Void Maw II', 'Faster, hungrier.', 270, 'run gap boulder fakes crush gap spring', [115, 6]],
  [31, 'Crystal Crossing', 'Ice platforms over a deep pit.', 185, 'ice gap ice fakes ice iceRun ice'],
  [32, 'Rolling Thunder', 'Boulders on the ground, meteors from above.', 25, 'boulder meteor boulder2 meteor gap meteor2'],
  [34, 'Pressure Cooker', 'Crushers and plate gates in one corridor.', 285, 'crush sprint crush gap sprint crush'],
  [35, 'Slide Show', 'Ice, ice and more ice.', 195, 'ice iceRun ice iceRun gap ice iceRun ice'],
  [36, 'Falling Sky', 'Meteors in the open, stalactites in the caves.', 12, 'meteor cave meteor2 caveIce meteor cave'],
  [37, 'Void Maw III', 'Maw, meteors and a long road.', 268, 'run meteor gap fakes meteor boulder gap spring', [120, 6]],
  [39, 'Everything Bagel', 'A little bit of everything.', 45, 'boulder cave crush ice meteor sprint fakes'],
  [40, 'Rope Ladder', 'Ropes, crumbling bridges and spikes.', 118, 'rope fakes gap rope boulder rope'],
  [41, 'Glacier Run', 'A very long ice sheet with surprises.', 188, 'iceRun ice caveIce iceRun ice iceRun ice'],
  [42, 'Boulder Run II', 'Faster boulders, higher stakes.', 40, 'boulder2 gap boulder2 spring boulder2 crush'],
  [44, 'Void Maw IV', 'It runs faster than ever. So must you.', 265, 'run gap fakes boulder gap crush spring fakes', [128, 5.5]],
  [45, 'Hell Gauntlet', 'Every trap in the book.', 5, 'boulder crush cave meteor2 ice sprint gap fakes crush'],
  [46, 'Meteor Mayhem', 'Meteor carpet bombing.', 8, 'meteor2 meteor2 gap meteor2 fakes meteor2 meteor2'],
  [47, 'Frozen Peaks', 'Ice caves and gauntlets near the summit.', 192, 'caveIce ice iceRun caveIce ice gap iceRun'],
  [49, 'GRAND FINALE', 'The Void Maw, meteors, boulders, ice and crushers. Good luck!', 280, 'run cave meteor gap crush ice boulder2 fakes sprint rope spring meteor2', [132, 5.5]],
];
const TOWERS = [
  [13, 'Spire of Springs', 'Climb! Bounce on springs, hop the ledges, grab the key in mid-air, reach the peak.', 205,
    [['L', 3], ['S', 2], ['L', 2]], { speed: 12, delay: 9 }, 11],
  [18, 'Chimney Climb', 'WALL-JUMP: press jump while sliding on a wall to kick off it.', 215,
    [['L', 3], ['C', 3], ['L', 2]], { speed: 14, delay: 9 }, 12],
  [23, 'Stalactite Shaft', 'The ceiling is crumbling. Do not linger under the stalactites.', 200,
    [['L', 5, { drip: 1 }], ['C', 3], ['L', 3, { drip: 1 }]], { speed: 15, delay: 8 }, 13],
  [28, 'Lava Lift', 'The lava is rising! Crumbling ledges, springs and chimneys.', 15,
    [['S', 2], ['L', 4, { crumble: 1 }], ['C', 3], ['S', 1]], { speed: 18, delay: 8, kind: 'lava' }, 14],
  [33, 'Vertigo', 'A long way up, a long way down.', 230,
    [['L', 4, { crumble: 1, drip: 1 }], ['S', 3], ['C', 3], ['L', 2]], { speed: 20, delay: 8 }, 15],
  [38, 'Maw Ascent', 'The Void Maw climbs after you. Do not look down.', 275,
    [['C', 3], ['L', 4, { drip: 1 }], ['S', 2], ['C', 3]], { speed: 23, delay: 7 }, 16],
  [43, 'Skyfall Tower', 'Lava below, stalactites above.', 8,
    [['L', 5, { crumble: 1, drip: 1 }], ['C', 3], ['S', 3], ['L', 3, { drip: 1 }]], { speed: 24, delay: 7, kind: 'lava' }, 17],
  [48, 'The Void Spire', 'The ultimate climb. Wall-jump, spring and sprint to the peak.', 285,
    [['L', 3, { crumble: 1 }], ['S', 2], ['C', 3], ['L', 3, { drip: 1 }]], { speed: 27, delay: 6 }, 18],
];
(() => {
  const defs = {};
  MIX.forEach((m) => { defs[m[0]] = () => {
    const d = (m[0] - 10) / 39;
    const b = new LB(m[1], m[2], m[3]);
    if (m[5]) seg.chaser(b, m[5][0], m[5][1]);
    seg.run(b, 700, { flag: true, coins: [[350, -60]] });
    m[4].split(' ').forEach((k, i) => MOD[k](b, d, i));
    END(b);
    return b.finish(480, 56);
  }; });
  TOWERS.forEach((t) => { defs[t[0]] = () => buildTower({ name: t[1], hint: t[2], hue: t[3], rooms: t[4], riser: t[5], seed: t[6] }); });
  for (let i = 10; i < 50; i++) S.push(defs[i]);
})();

// ---------------------------------------------------------------------------
// HARDCORE CO-OP EXPANSION: 25 TOTAL LEVELS
// ---------------------------------------------------------------------------
(() => {
  const coopTitles = [
    ['Synchro Gap', 'Both players must hold the two outer plates to lower the bridge!', 160],
    ['Tether Pendulum', 'Anchor on the cliff! Lower your teammate to grab the key in the pit.', 240],
    ['Double Trouble', 'Crushers on an icy floor with an elastic tether dragging both!', 30],
    ['Dual Relay Gate', 'Player 1 opens Chamber B. Player 2 enters and unlocks Chamber A.', 280],
    ['Abyssal Hoist', 'Spam jump on the ledge to hoist your fallen buddy out of the fissure!', 210],
    ['Twin Boulder Ballet', 'Two boulders, two platforms, synchronized hopping required.', 45],
    ['Frosty Bond', 'Extremely slippery ice. One bunny sliding pulls the other along.', 195],
    ['Meteor Crossing', 'Tethered together through a meteor storm. Keep the rope slack!', 15],
    ['The Chasm Leap', 'Swing across a 600px gap. Catch the far ledge and pull your friend.', 260],
    ['Dual Sprint Rush', 'Two separate sprint gates. Both must run and step at once!', 170],
    ['Stalactite Tango', 'Dodging falling spikes while tied together. Timing is everything.', 220],
    ['Synchronized Slam', '5 crushers, 2 bunnies. One mistake wipes both.', 350],
    ['Double Lava Chase', 'Rising lava beneath! Wall-jump and hoist each other to the peak.', 25],
    ['The Anchor Test', 'Heavy anchor mode: hold DOWN on the ledge so your buddy can swing.', 180],
    ['Relay Marathon', '3 consecutive relay lock chambers. True teamwork test.', 310],
    ['Void Maw Duo', 'The Void Maw is chasing both of you. Do not let the tether snag!', 275],
    ['ULTIMATE CO-OP MAW', 'The supreme test of 2-player synergy. Every hardcore puzzle combined.', 340]
  ];

  for (let i = 8; i < 25; i++) {
    const meta = coopTitles[i - 8];
    C.push(() => {
      const b = new LB(meta[0], meta[1], meta[2], true);
      seg.run(b, 720, { flag: true, coins: [[360, -60]] });
      seg.coopDualHold(b, 500, { flag: true });
      if (i % 2 === 0) seg.fakes(b, 4, { coins: [2] });
      else b.gap(140);
      seg.coopDoor(b, { coins: [[250, -60]], flag: true });
      if (i > 14) seg.cave(b, 680, { at: [200, 420], flag: true });
      if (i > 18) seg.boulders(b, 850, { specs: [[60, 800, 3.8, 0]], plats: [[350, -100, 110]], flag: true });
      seg.coopDualHold(b, 600, { flag: true });
      seg.run(b, 800, { coins: [[400, -60]] });
      return b.finish(520, 56);
    });
  }
})();

// ---------------------------------------------------------------------------
// HARDCORE PARTY EXPANSION: 25 TOTAL LEVELS
// ---------------------------------------------------------------------------
(() => {
  const partyTitles = [
    ['Three-Bunny Stack', 'Wall height 260px! Stack 3 bunnies high to reach the summit plate.', 210],
    ['Triple Pressure Gate', 'Three plates across the map must be held down AT THE SAME TIME!', 180],
    ['Pyramid Hop', 'Form a moving human ladder to hop across the massive spike gulf.', 330],
    ['Quad Lock Chamber', '4 players needed to press the 4 corner switches simultaneously.', 150],
    ['The Human Tower', 'A 280px cliff with spikes on both sides. Tower up or stay behind.', 260],
    ['Sinking Team Bridge', 'Platforms sink fast under weight. Relay jump across in order!', 40],
    ['Party Boulder Storm', 'Boulders roll while the whole squad must fit onto tiny platforms.', 220],
    ['Mega Stack Ascend', 'Wall-jump tower where you must stack on buddies to reach the wall grip.', 290],
    ['All For One Gate', 'All plates must be depressed. If even 1 player steps off, door closes.', 170],
    ['Chaos Spring Relay', 'Bounce off each others heads for the Super Jump boost over the wall.', 310],
    ['The Squad Gauntlet', 'Crushers, moving walls and 4-bunny stacking cliffs.', 350],
    ['Tower of Babel', 'A vertical spire where keys are only reachable by a 4-stack tower.', 275],
    ['Synchronized Leap', 'Everyone must jump at the exact same beat to trigger the spring.', 190],
    ['Void Maw Panic', 'The Maw is coming! Stack fast or get eaten from behind.', 15],
    ['The 10-Player Pyramid', 'Ultimate stacking challenge. Reach the golden key in the stratosphere.', 280],
    ['Pressure Relay IV', '4 separate rooms, each unlocking the next. Coordinate via chat!', 120],
    ['Lava Team Escape', 'Lava rises from the depths! Stack on moving platforms to survive.', 25],
    ['The Infinite Tower', 'Stack, jump, wall-kick and coordinate to the highest peak.', 240],
    ['CHAOS APOCALYPSE', 'The final Party stage. 10 players, maximum stacking, total teamwork.', 340]
  ];

  // v11: every stage mixes the scaling segments (stack wall / pressure plates / tiers) with the troll traps.
  const blocks = [
    (b, j) => seg.partyStackCliff(b, 225 + (j % 4) * 15),
    (b, j) => seg.partyPlates(b, 2 + (j % 3), { hold: 3.5 }),
    (b, j) => seg.partyTierPlates(b, { hold: 5 }),
    (b, j) => seg.antiBaitSpikes(b, 760, { flag: true, coins: [[300, -95], [520, -100]] }),
    (b, j) => seg.fakePlates(b, 4 + (j % 3), { flag: true }),
  ];
  const TROLL_DOOR = { 6: 'sink', 12: 'run', 18: 'sink' };     // j -> mode (door is always the last segment)
  const ARENA = { 2: [13, 3], 8: [14, 3], 14: [15, 4] };       // j -> [seconds, saws]
  const drop = (b) => { if (b.gy < 560) b.step(-(GY - b.gy)); };   // walk back down to the base height so ceilings stay inside the world
  for (let i = 6; i < 25; i++) {
    const meta = partyTitles[i - 6];
    const j = i - 6;
    PTY.push(() => {
      const b = new LB(meta[0], meta[1], meta[2], false);
      seg.run(b, 680, { flag: true, coins: [[340, -60]] });
      const kA = j % 5, kB = (j * 2 + 1) % 5 === kA ? (kA + 2) % 5 : (j * 2 + 1) % 5;
      blocks[kA](b, j);
      drop(b);
      if (i % 2 === 0) seg.fakes(b, 4, { coins: [2] });
      else b.gap(140);
      seg.run(b, 420, { flag: true });
      if (ARENA[j]) { drop(b); seg.sawArena(b, ARENA[j][0], ARENA[j][1]); drop(b); seg.run(b, 380, { flag: true }); }
      blocks[kB](b, j);
      drop(b);
      if (i > 12) seg.crushers(b, 3, { spacing: 250, period: 2.8, coins: [1], flag: true });
      if (i > 16) seg.boulders(b, 850, { specs: [[60, 800, 3.6, 0]], plats: [[350, -100, 110]], flag: true });
      if (TROLL_DOOR[j]) { drop(b); seg.run(b, 300, { flag: true }); seg.trollDoor(b, { mode: TROLL_DOOR[j] }); return b.finish(0, 0); }
      seg.run(b, 800, { coins: [[400, -60]] });
      return b.finish(500, 56);
    });
  }
})();

// ============================================================================
// AUTO LEVEL GENERATOR (PROCEDURAL GENERATOR)
// ============================================================================
function generateRandomLevel(mode, seed) {
  const s = seed || (Math.floor(Math.random() * 89999) + 10000);
  const hue = (s * 47) % 360;
  const isCoop = mode === 'coop';
  const isParty = mode === 'party';
  const b = new LB('Auto Map #' + s, 'Màn chơi tạo tự động ngẫu nhiên · ' + (isParty ? 'Party 2-10P' : isCoop ? 'Co-op' : 'Solo'), hue, isCoop);
  seg.run(b, 700, { flag: true, coins: [[350, -60]] });
  if (s % 2 === 0) {
    seg.fakes(b, 4, { coins: [2] });
    seg.run(b, 400, { flag: true });
  } else {
    b.gap(140);
    seg.run(b, 450, { flag: true, spikes: [[200, 60]] });
  }
  if (isParty) {
    seg.partyStackCliff(b, 160);
    seg.run(b, 400, { flag: true });
  } else {
    seg.springWall(b, { h: 190 });
    seg.run(b, 400, { flag: true });
  }
  if (s % 3 === 0) {
    seg.crushers(b, 3, { spacing: 250, period: 2.8, coins: [1] });
  } else {
    seg.boulders(b, 850, { specs: [[60, 800, 3.4, 0]], plats: [[350, -100, 120]], coins: [[400, -170]] });
  }
  seg.run(b, 400, { flag: true });
  if (s % 2 === 1) {
    seg.sprint(b, 560, 3.0, { coins: [[380, -60]] });
  } else {
    seg.fakes(b, 5, { real: [2], coins: [3] });
  }
  seg.run(b, 800, { coins: [[400, -60]] });
  return b.finish(480, 56);
}

// ============================================================================
// GAME STATE
// ============================================================================
const F_BOUT = 8, F_RIGHT = 1, F_GROUND = 2, F_DEAD = 4, F_ROPE = 16, F_SHIELD = 32, F_INV = 64, F_ANCH = 128;
const G = {
  mode: 'solo', lvIdx: 0, L: null, lt: 0, levelTime: 0,
  inGame: false, won: false, winT: 0, keyGot: false, deaths: 0, finalShown: false,
  me: null, myslot: 0, code: 'SOLO', myName: 'Bunny',
  remotes: new Map(), names: {}, skins: {}, roster: null, hostSlot: 0,
  cam: { x: 0, y: 0, z: 1, snap: true }, shake: 0, pingMs: 0,
  banner: 0, msg: '', alpha: 1, paused: false, boutique: false,
};

const input = { l: false, r: false, j: false, b: false, d: false };

function newPlayer(slot) {
  return {
    onIce: false, wallT: 0, wallDir: 0, wlock: 0, slot, x: 0, y: 0, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jbuf: 0,
    jPrev: false, bPrev: false, jumping: false, dead: false, deadT: 0, inv: 0,
    shield: curPassive === 'guard', dj: false, djT: 0, timed: { speed: 0, magnet: 0, jumpboost: 0 }, usedDJ: false, rope: null, ropeCd: 0, cp: { x: 0, y: 0 },
    anch: false, sq: 0, runT: 0, ride: null, wasGround: false, tetherGrace: 0, ear: 0, earV: 0,
  };
}

const rectsOverlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
const gateSolid = (g) => (g.inv ? g.act : !g.act);
const nearBuf = [];
function nearSolids(x, y, w, h) {
  const L = G.L; nearBuf.length = 0;
  for (let i = 0; i < L.solids.length; i++) { const s = L.solids[i]; if (rectsOverlap(x, y, w, h, s[0], s[1], s[2], s[3])) nearBuf.push(s); }
  for (let i = 0; i < L.crumbles.length; i++) { const c = L.crumbles[i]; if (c.st < 2 && rectsOverlap(x, y, w, h, c.x, c.y, c.w, c.h)) { c._r = c._r || [0, 0, 0, 0]; c._r[0] = c.x; c._r[1] = c.y; c._r[2] = c.w; c._r[3] = c.h; nearBuf.push(c._r); } }
  for (let i = 0; i < L.gates.length; i++) { const g = L.gates[i]; if (gateSolid(g) && rectsOverlap(x, y, w, h, g.x, g.y, g.w, g.h)) { g._r = g._r || [0, 0, 0, 0]; g._r[0] = g.x; g._r[1] = g.y; g._r[2] = g.w; g._r[3] = g.h; nearBuf.push(g._r); } }
  return nearBuf;
}

function ipos(e) {
  const a = G.alpha === undefined ? 1 : G.alpha;
  const px = e.px === undefined ? e.x : e.px, py = e.py === undefined ? e.y : e.py;
  if (Math.abs(e.x - px) > 120 || Math.abs(e.y - py) > 120) return { x: e.x, y: e.y };
  return { x: px + (e.x - px) * a, y: py + (e.y - py) * a };
}

function allBodies() {
  const a = [G.me];
  if (G.mode !== 'solo') for (const r of G.remotes.values()) if (!r.dead) a.push(r);
  return a;
}

function standsOn(b, r) {
  const feet = b.y + PH;
  return b.x + PW - 4 > r.x && b.x + 4 < r.x + r.w && feet >= r.y + 3 && feet <= r.y + r.h + 5;
}

function ropeBob(R) {
  let th;
  if (R.hs !== -1 && R.hb) return R.hb;
  th = 0.3 * Math.sin(G.lt * 1.7 + R.ax * 0.01);
  return { x: R.ax + R.cur * Math.sin(th), y: R.ay + R.cur * Math.cos(th), th };
}

function keyPos() {
  const k = G.L.key;
  if (k.rope !== undefined) { const b = ropeBob(G.L.ropes[k.rope]); return { x: b.x, y: b.y + 18 }; }
  return k;
}

function loadLevel(idx, customLevelObj) {
  if (!customLevelObj && G.mode === 'party' && isHostSlot()) { PARTY_N = Math.max(1, Math.min(10, presentCount())); }
  if (customLevelObj) {
    G.customData = JSON.stringify(customLevelObj);
    G.L = customLevelObj;
    G.lvIdx = -1;
  } else {
    const list = LEVELS[G.mode] || LEVELS.solo;
    idx = clamp(idx | 0, 0, list.length - 1);
    G.lvIdx = idx;
    G.L = list[idx]();
  }
  const L = G.L;
  L.stalactites = L.stalactites || []; L.meteors = L.meteors || []; L.risers = L.risers || [];
  L.stalactites.forEach((q) => { q.st = 0; q.t = 0; q.fy = 0; q.vy = 0; q.gnd = undefined; });
  L.meteors.forEach((f) => { f.exK = -1; });
  L.risers.forEach((r) => { if (r.y0 === undefined) r.y0 = r.y; r.y = r.y0; r.cy = r.y0; });
  L.traps = L.traps || [];
  resetTraps(L);
  L.sweepers.forEach((q) => { if (q._x0 === undefined) q._x0 = q.x; q.x = q._x0; q.cx = q.x; });
  if (G.mode !== 'solo' && !L._sharp) { L._sharp = 1; L.boulders.forEach((q) => { q.speed *= 1.12; }); L.crushers.forEach((q) => { q.period *= 0.92; }); }
  if (!L.skyTheme) {
    const off = { solo: 0, coop: 1, party: 2 }[G.mode] || 0;
    const key = G.lvIdx >= 0 ? G.lvIdx : String(L.name || '').split('').reduce((q, ch2) => q + ch2.charCodeAt(0), 0);
    L.skyTheme = SKY_THEMES[(key + off) % 4];
  }
  G.lt = 0; G.levelTime = 0; G.keyGot = false; G.won = false; G.winT = 0; G.deaths = 0; G.finalShown = false;
  const got = G.lvIdx >= 0 ? Save.coinsGot(G.mode, G.lvIdx) : [];
  L.coins.forEach((c) => { c.got = got.includes(c.id); c.pop = 0; });
  const dIdx = diamondIndex(G.mode, G.lvIdx, L.coins.length);
  if (dIdx >= 0) L.coins[dIdx].kind = 'diamond';
  L.plates.forEach((p) => { p.t = 0; p.on = false; p.pr = false; });
  L.gates.forEach((g) => { g.act = false; });
  L.ropes.forEach((r) => { r.hs = -1; r.hb = null; });
  L.key.got = false;
  const me = newPlayer(G.myslot);
  me.x = L.spawn[0] + (G.myslot % 10) * 26; me.y = L.spawn[1];
  me.cp = { x: me.x, y: me.y };
  G.me = me;
  for (const r of G.remotes.values()) { r.x = r.tx = L.spawn[0] + (r.slot % 10) * 26; r.y = r.ty = L.spawn[1]; r.vx = r.vy = 0; r.dead = false; r.ropeOn = false; r.recv = nowMs(); }
  G.cam.snap = true;
  parts.length = 0;
  document.body.classList.toggle('mode-coop', G.mode === 'coop');
  document.body.classList.toggle('mode-party', G.mode === 'party');
  setText('lvName', G.lvIdx >= 0 ? 'Lv ' + (G.lvIdx + 1) + ' · ' + L.name : L.name);
  setText('deaths', '💥 0');
  setText('modeBadge', G.mode === 'party' ? 'PARTY' : G.mode === 'coop' ? 'CO-OP' : 'SOLO');
  const ks = $('keyStat'); if (ks) { ks.textContent = '🔑 ✗'; ks.classList.remove('got'); }
  rebuildLevelSelect();
  refreshBuffUI();
  showBanner((G.lvIdx >= 0 ? 'LEVEL ' + (G.lvIdx + 1) + ': ' : '') + L.name.toUpperCase(), L.hint);
  const sel = $('lvSelect'); if (sel && G.lvIdx >= 0) sel.value = String(G.lvIdx);
  ensureRadarBtn();
  G.teamView = false;
  if (G.mode === 'party') hostLock();
  updateDiffBadge();
}

function nowMs() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); }

function showBanner(title, hint) {
  const b = $('banner'); if (!b) return;
  b.innerHTML = '<div class=\"b-title\"></div><div class=\"b-hint\"></div>';
  b.firstChild.textContent = title; b.lastChild.textContent = hint || '';
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
let toastTimer = 0;
function toast(msg) {
  const t = $('toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function crusherBottom(c, lt) {
  const P = c.period, ph = (((lt + c.off) % P) + P) % P / P;
  const rest = c.restB, down = c.downB;
  c.shake = 0;
  if (ph < 0.42) return rest;
  if (ph < 0.58) { c.shake = 1; return rest - 6; }
  if (ph < 0.63) { const t = (ph - 0.58) / 0.05; return lerp(rest - 6, down, t * t); }
  if (ph < 0.78) return down;
  const t = (ph - 0.78) / 0.22;
  return lerp(down, rest, t * t * (3 - 2 * t));
}

function pingPong(x0, x1, speed, off, lt) {
  const D = x1 - x0; if (D <= 0) return x0;
  const d = (lt + off) * speed * 60;
  const m = ((d % (2 * D)) + 2 * D) % (2 * D);
  return x0 + (m < D ? m : 2 * D - m);
}


// ============================================================================
// v11  PARTY HUD / TRAP RUNTIME / TEAM RADAR
// ============================================================================
const bunnyColor = (slot) => { const sk = G.skins[slot]; return (SKIN_PAL[sk] && SKIN_PAL[sk].body) || (sk === 'slime' ? '#ffd24d' : COLORS[slot % COLORS.length]); };
const presentCount = () => (G.mode === 'party' || G.mode === 'coop') ? 1 + G.remotes.size : 1;

function updateDiffBadge() {
  let el = $('diffBadge');
  if (!el) {
    const chip = $('lvChip'), mb = $('modeBadge');
    if (!chip || !mb) return;
    el = document.createElement('span'); el.id = 'diffBadge'; el.className = 'diff-badge hidden';
    chip.insertBefore(el, mb.nextSibling);
  }
  const rb = $('radarBtn');
  if (rb) rb.classList.toggle('hidden', G.mode !== 'party');
  if (G.mode !== 'party') { el.classList.add('hidden'); return; }
  const n = partyN(), pres = presentCount();
  el.classList.remove('hidden');
  el.textContent = 'Độ khó: x' + n + ' người' + (pres !== n ? ' ⚠' : '');
  el.title = pres !== n ? 'Đang có ' + pres + ' người nhưng màn được chốt cho ' + n + ' người. Chủ phòng bấm R để chốt lại.' : '';
  el.classList.toggle('warn', pres !== n);
}

// host fixes N when a level starts / restarts and tells everybody
function hostLock() {
  if (G.mode !== 'party' || !isHostSlot()) return;
  PARTY_N = Math.max(1, Math.min(10, presentCount()));
  netEv({ t: 'pcount', n: PARTY_N, lv: G.lvIdx });
}

function ensureRadarBtn() {
  if ($('radarBtn')) return;
  const host = document.querySelector('#touch .touch-actions') || $('touch');
  if (!host) return;
  const b = document.createElement('button');
  b.id = 'radarBtn'; b.className = 'tbtn radar-btn hidden'; b.dataset.k = 'tv'; b.textContent = '📡';
  b.title = 'Giữ để xem toàn đội (PC: giữ Tab)';
  host.appendChild(b);
}

function sawPos(t, j, tt) {
  const s = t.saws[j], hz = t.hz || 1;
  return {
    x: pingPong(t.x0 + s.r + 4, t.x1 - s.r - 4, s.sx * hz, s.ox, tt),
    y: pingPong(t.gy - 112, t.gy - s.r, s.sy * hz, s.oy, tt),
  };
}

function resetTraps(L) {
  L.stalactites = (L.stalactites || []).filter((q) => !q.dyn);
  for (const t of L.traps || []) {
    t.st = 0; t.t = 0; t.t0 = 0; t.empty = 0; t._sp = null;
    if (t.k === 'fake') t.plates.forEach((f) => { f.used = false; f.pr = false; f.on = false; });
    if (t.k === 'door') { const e = L.exit; e.x = t.ex0; e.y = t.ey0; e.lock = true; e.hide = false; e.clipY = undefined; e.legs = false; t.btnDown = false; }
  }
  (L.spikes || []).forEach((s) => { if (s.bt !== undefined) { s.hid = true; s.live = false; s.ph = 0; } });
}

function trapSend(i, a, v) {
  trapAct(i, a, v, G.myslot);
  if (isNet()) netEv({ t: 'trap', i, a, v: v === undefined ? 0 : v });
}

function trapAct(i, a, v, who) {
  const L = G.L; if (!L || !L.traps) return;
  const t = L.traps[i]; if (!t) return;
  const mine = who === G.myslot, nm = G.names[who] || 'Đồng đội';
  if (t.k === 'bait') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 0.42; Snd.shake(); G.shake = Math.max(G.shake, 3);
      toast(v === 1 ? '🪤 ' + nm + ' quay đầu đi lùi — gai trồi lên!' : '🪤 ' + nm + ' nhảy giữa không trung — gai phóng lên!');
    }
  } else if (t.k === 'fake') {
    const f = t.plates[v | 0];
    if (a === 'hit' && f && !f.used) {
      f.used = true; Snd.plate(true); G.shake = Math.max(G.shake, 7);
      if (f.v === 'stalac') {
        for (let q = 0; q < 3; q++) L.stalactites.push({ x: f.x + 30 + q * 80, y: f.y + 10 - 320, w: 34, h: 66, st: 1, t: 0.5 + q * 0.08, fy: 0, vy: 0, dyn: true });
        toast('⚠️ Nút phản bội! Trần nhà rung chuyển — thạch nhũ rơi!');
      } else if (mine) { G.me.rev = 3; toast('🔄 Nút phản bội! Trái/Phải bị đảo ngược 3 giây!'); }
    }
  } else if (t.k === 'door') {
    const e = L.exit;
    if (a === 'flee' && t.st === 0) { t.st = 1; t.t = 0; Snd.shake(); G.shake = Math.max(G.shake, 6); toast('🚪💨 Cửa thoát mọc chân chạy mất!'); }
    else if (a === 'fix') {
      if (t.st === 0) { t.st = 3; e.lock = false; e.x = t.ex0; e.y = t.ey0; Snd.key(); sparkle(e.x + e.w / 2, e.y + e.h / 2, 18, 1.4, '#ffd43b'); toast('🔓 Cửa thoát đã bị khóa chặt tại chỗ!'); }
    }
  } else if (t.k === 'arena') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t0 = +v || G.lt; t.empty = 0; Snd.shake(); G.shake = Math.max(G.shake, 6); toast('🪚 Cổng đóng! Né cưa ' + t.dur + 's hoặc leo lên góc trần!'); }
    else if (a === 'done' && t.st === 1) { t.st = 2; Snd.gate(true); toast('✅ Cửa mở! Sống sót qua phòng cưa!'); }
    else if (a === 'reset' && t.st === 1) { t.st = 0; t.empty = 0; toast('💀 Cả đội gục — phòng cưa reset!'); }
  }
}

function trapGateOpen(g) {
  const t = G.L.traps[g.tr]; if (!t) return true;
  const want = g.role === 'in' ? (t.st !== 1) : (t.st === 2);
  if (!want && g.act) {
    for (const b of allBodies()) if (rectsOverlap(b.x - 6, b.y - 6, PW + 12, PH + 12, g.x, g.y, g.w, g.h)) return true;
  }
  return want;
}

function updateTraps(bodies) {
  const L = G.L, me = G.me;
  const tr = L.traps; if (!tr || !tr.length) return;
  const host = isHostSlot();
  for (let i = 0; i < tr.length; i++) {
    const t = tr[i];
    if (t.k === 'bait') {
      const sp = t._sp || (t._sp = L.spikes.filter((s) => s.bt === i));
      if (t.st === 0) {
        if (!me.dead && !G.won) {
          const cx = me.x + PW / 2, feet = me.y + PH;
          const inside = cx > t.zx0 && cx < t.zx1 && Math.abs(feet - t.gy) < 170;
          if (inside) {
            const bt = (me.bt = me.bt || {});
            const s = (bt[i] = bt[i] || { armed: false, maxX: cx });
            const grounded = me.onGround && Math.abs(feet - t.gy) < 4;
            if (grounded) { s.armed = true; if (cx > s.maxX) s.maxX = cx; }
            else if (s.armed && feet < t.gy - 16) trapSend(i, 'fire', 0);
            if (t.st === 0 && grounded && s.armed && me.vx < -1.4 && cx < s.maxX - 60) trapSend(i, 'fire', 1);
          } else if (me.bt && me.bt[i]) { me.bt[i].armed = false; me.bt[i].maxX = cx; }
        }
      } else if (t.st === 1) {
        t.t -= STEP; sp.forEach((s) => { s.hid = false; s.ph = clamp(1 - t.t / 0.42, 0, 1) * 0.3; });
        if (t.t <= 0) { t.st = 2; t.t = 1.7; sp.forEach((s) => { s.live = true; }); Snd.slam(); }
      } else if (t.st === 2) {
        t.t -= STEP; sp.forEach((s) => { s.ph = Math.min(1, s.ph + 0.3); });
        if (t.t <= 0) { t.st = 3; t.t = 0.45; sp.forEach((s) => { s.live = false; }); }
      } else if (t.st === 3) {
        t.t -= STEP; sp.forEach((s) => { s.ph = Math.max(0, t.t / 0.45); });
        if (t.t <= 0) { t.st = 4; t.t = 1.0; sp.forEach((s) => { s.hid = true; s.ph = 0; }); }
      } else { t.t -= STEP; if (t.t <= 0) t.st = 0; }
    } else if (t.k === 'fake') {
      for (let j = 0; j < t.plates.length; j++) {
        const f = t.plates[j];
        let pr = false;
        for (const b of bodies) if (standsOn(b, f)) { pr = true; break; }
        f.pr = pr; f.on = pr;
        if (!f.used && !me.dead && !G.won && standsOn(me, f)) trapSend(i, 'hit', j);
      }
    } else if (t.k === 'door') {
      const e = L.exit;
      let down = false;
      for (const b of bodies) if (standsOn(b, t.btn)) { down = true; break; }
      if (down && !t.btnDown) Snd.plate(true);
      t.btnDown = down;
      if (t.st === 0) {
        e.lock = true;
        if (!me.dead && !G.won) {
          if (standsOn(me, t.btn)) trapSend(i, 'fix', 0);
          else if (Math.hypot(me.x + PW / 2 - (e.x + e.w / 2), me.y + PH / 2 - (e.y + e.h / 2)) < 120) trapSend(i, 'flee', 0);
        }
      } else if (t.st === 1) {
        t.t += STEP; const u = clamp(t.t / t.dur, 0, 1);
        e.lock = true;
        if (t.mode === 'run') {
          const k = u * u * (3 - 2 * u);
          e.x = lerp(t.ex0, t.dx, k);
          e.y = lerp(t.ey0, t.dy, k) - Math.abs(Math.sin(u * Math.PI * 7)) * 46 * Math.sin(u * Math.PI);
          e.legs = true;
        } else if (u < 0.4) { e.x = t.ex0; e.y = t.ey0 + e.h * (u / 0.4); e.clipY = t.ey0 + e.h; e.hide = false; }
        else if (u < 0.6) { e.hide = true; e.x = t.dx; e.y = t.dy + e.h; }
        else { const k = (u - 0.6) / 0.4; e.hide = false; e.x = t.dx; e.y = t.dy + e.h * (1 - k); e.clipY = t.dy + e.h; }
        if (u >= 1) {
          t.st = 2; e.x = t.dx; e.y = t.dy; e.lock = false; e.legs = false; e.hide = false; e.clipY = undefined;
          puff(e.x + e.w / 2, e.y + e.h, 14, '#fff', 1.6);
        }
      }
    } else if (t.k === 'arena') {
      if (t.st === 0) {
        if (!me.dead && !G.won) {
          const cx = me.x + PW / 2;
          if (cx > t.trig && cx < t.x1 - 120 && me.onGround && Math.abs(me.y + PH - t.gy) < 4) trapSend(i, 'fire', G.lt);
        }
      } else if (t.st === 1) {
        const tt = G.lt - t.t0;
        if (host) {
          let inside = 0;
          for (const b of bodies) {
            if (b.dead) continue;
            const cx = b.x + PW / 2;
            if (cx > t.x0 - 10 && cx < t.x1 + 10 && b.y + PH > t.gy - 240 && b.y < t.gy + 10) inside++;
          }
          if (tt > 1.2 && inside === 0) t.empty += STEP; else t.empty = 0;
          if (t.empty > 1.0) trapSend(i, 'reset', 0);
          else if (tt >= t.dur) trapSend(i, 'done', 0);
        }
      }
    }
  }
  // dynamic (fake-plate) stalactites vanish once they have landed and rested
  for (let q = L.stalactites.length - 1; q >= 0; q--) if (L.stalactites[q].dyn && L.stalactites[q].gone) L.stalactites.splice(q, 1);
}

// ---- team radar: off-screen arrows (screen space) --------------------------
function drawOffscreenRadar() {
  if (G.mode !== 'party' || !G.remotes.size || !G.me) return;
  const cam = G.cam, sc = cam.sc || 1;
  const W = cw, Hh = ch, pad = 34, top = 74;
  const hw = W / 2, hh = (Hh + top) / 2, cyc = top + (Hh - top) / 2;
  const mp = ipos(G.me);
  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    const rp = ipos(r);
    const sx = (rp.x + PW / 2 - cam.x) * sc, sy = (rp.y + PH / 2 - cam.y) * sc;
    if (sx >= pad && sx <= W - pad && sy >= top && sy <= Hh - pad) continue;
    const dx = sx - W / 2, dy = sy - cyc;
    const k = Math.min((hw - pad) / Math.max(1e-3, Math.abs(dx)), ((Hh - top) / 2 - pad) / Math.max(1e-3, Math.abs(dy)));
    const ax = W / 2 + dx * k, ay = cyc + dy * k;
    const ang = Math.atan2(dy, dx);
    const dist = Math.round(Math.hypot(rp.x - mp.x, rp.y - mp.y));
    const col = bunnyColor(r.slot);
    ctx.save();
    ctx.translate(ax, ay); ctx.rotate(ang);
    ctx.fillStyle = col; ctx.strokeStyle = '#2b1442'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-9, -9); ctx.lineTo(-4, 0); ctx.lineTo(-9, 9); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center';
    const label = (G.names[r.slot] || 'Bunny') + ' · ' + dist + 'px';
    const ly = ay + (ay < cyc ? 24 : -14), lx = clamp(ax, 60, W - 60);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.fillStyle = '#fff';
    ctx.strokeText(label, lx, ly); ctx.fillText(label, lx, ly);
    ctx.restore();
  }
}

// floating "wait for the squad" text over the exit (world space, no camera movement)
function drawExitWait() {
  if (G.mode !== 'party' || !G.keyGot || G.won || !G.me || G.me.dead) return;
  const e = G.L.exit, me = G.me;
  if (e.hide || !G.remotes.size) return;
  if (!rectsOverlap(me.x - 50, me.y - 50, PW + 100, PH + 100, e.x, e.y, e.w, e.h)) return;
  let at = 1, tot = 1, far = false;
  for (const r of G.remotes.values()) {
    tot++;
    if (!r.dead && rectsOverlap(r.x, r.y, PW, PH, e.x - 14, e.y - 14, e.w + 28, e.h + 28)) at++;
    else if (Math.hypot(r.x - e.x, r.y - e.y) > 1500) far = true;
  }
  if (!far || at >= tot) return;
  const txt = 'Đợi đồng đội (' + at + '/' + tot + ')';
  ctx.save();
  ctx.font = '800 16px sans-serif'; ctx.textAlign = 'center';
  const bob = Math.sin(G.lt * 4) * 3, x = e.x + e.w / 2, y = e.y - 70 + bob;
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,10,50,.85)'; ctx.fillStyle = '#ffe066';
  ctx.strokeText(txt, x, y); ctx.fillText(txt, x, y);
  ctx.restore();
}

function drawSaw(x, y, r, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 9);
  ctx.fillStyle = '#cfd8dc'; ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  const teeth = 12;
  for (let i = 0; i < teeth * 2; i++) {
    const a = i / (teeth * 2) * Math.PI * 2, rr2 = i % 2 ? r * 0.78 : r + 3;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr2, Math.sin(a) * rr2); else ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, 6.3); ctx.fill();
  ctx.restore();
}

function drawTraps(L) {
  for (const t of (L.traps || [])) {
    if (t.k === 'fake') for (const f of t.plates) drawPlate(f);
    else if (t.k === 'arena' && t.st === 1) {
      const tt = G.lt - t.t0;
      ctx.save(); ctx.fillStyle = 'rgba(255,60,60,' + (0.15 + 0.1 * Math.sin(G.lt * 8)) + ')';
      ctx.fillRect(t.x0, t.ceilY, t.x1 - t.x0, t.gy - t.ceilY); ctx.restore();
      for (let j = 0; j < t.saws.length; j++) { const p = sawPos(t, j, tt); drawSaw(p.x, p.y, t.saws[j].r, G.lt); }
      ctx.save(); ctx.font = '800 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3;
      const left = Math.max(0, Math.ceil(t.dur - tt));
      ctx.strokeText('⏱ ' + left + 's', (t.x0 + t.x1) / 2, t.ceilY + 28); ctx.fillText('⏱ ' + left + 's', (t.x0 + t.x1) / 2, t.ceilY + 28);
      ctx.restore();
    }
  }
}

function updateWorld() {
  const L = G.L, me = G.me;
  G.lt += STEP;
  if (!G.won) G.levelTime += STEP;
  const bodies = allBodies();

  for (const p of L.plates) {
    let pr = false;
    for (const b of bodies) if (standsOn(b, p)) { pr = true; break; }
    if (pr) p.t = p.hold; else if (p.t > 0) p.t -= STEP;
    const act = pr || p.t > 0;
    if (act !== p.on) Snd.plate(act);
    p.on = act; p.pr = pr;
  }

  for (const g of L.gates) {
    let act;
    if (g.tr !== undefined) act = trapGateOpen(g);
    else if (g.mode === 'all') act = g.ctrl.every((id) => L.plates.find((p) => p.id === id).on);
    else if (g.mode === 'count') act = g.ctrl.filter((id) => L.plates.find((p) => p.id === id).on).length >= Math.min(g.need || g.ctrl.length, g.ctrl.length);
    else act = g.ctrl.some((id) => L.plates.find((p) => p.id === id).on);
    if (act !== g.act) Snd.gate(act);
    g.act = act;
  }

  for (const c of L.crumbles) {
    if (c.st === 0) {
      for (const b of bodies) {
        const feet = b.y + PH;
        if (b.x + PW - 3 > c.x && b.x + 3 < c.x + c.w && feet >= c.y - 2 && feet <= c.y + 8) { c.st = 1; c.t = 0.4; Snd.shake(); break; }
      }
    } else if (c.st === 1) {
      c.t -= STEP;
      if (Math.random() < 0.3) debris(c.x, c.y + c.h, c.w, 2, 1, '#a1887f');
      if (c.t <= 0) { c.st = 2; c.t = 3.0; c.fy = 0; c.vy = 0; Snd.crumble(); debris(c.x, c.y, c.w, c.h, 10, '#8d6e63'); }
    } else {
      c.t -= STEP; c.vy = (c.vy || 0) + 0.5; c.fy += c.vy;
      if (c.t <= 0) { c.st = 0; c.fy = 0; puff(c.x + c.w / 2, c.y, 6, '#d7ccc8'); }
    }
  }

  for (const c of L.crushers) {
    const prev = c.cb; c.cb = crusherBottom(c, G.lt);
    if (prev < c.downB - 2 && c.cb >= c.downB - 2) { Snd.slam(); G.shake = Math.max(G.shake, 6); puff(c.x + c.w / 2, c.downB, 8, '#cfd8dc', 1.4); }
  }

  for (const b of L.boulders) {
    const prev = b.cx; b.cx = pingPong(b.x0, b.x1, b.speed, b.off, G.lt);
    b.rot += (b.cx - prev) / b.r;
  }

  for (const s of L.sweepers) s.cx = s.x + s.speed * Math.max(0, G.lt - s.delay);
  for (const r of (L.risers || [])) r.cy = r.y - r.speed * Math.max(0, G.lt - r.delay);
  updateStalactites(bodies);
  updateMeteors();
  updateTraps(bodies);

  L.ropes.forEach((R, i) => {
    let holder = -1, hb = null;
    if (me.rope && me.rope.i === i) { holder = me.slot; hb = { x: me.x + PW / 2, y: me.y + PH / 2 - 2, th: me.rope.th }; }
    else for (const r of G.remotes.values()) if (r.ropeOn && r.ropeId === i && !r.dead) { holder = r.slot; hb = { x: r.x + PW / 2, y: r.y + PH / 2 - 2, th: 0 }; }
    R.hs = holder; R.hb = hb;
    if (R.pads.length) {
      let a = false;
      for (const b of bodies) for (const p of R.pads) if (standsOn(b, p)) a = true;
      R.anch = a;
    } else R.anch = true;
    if (holder === -1) {
      const target = R.anch ? R.full : R.short;
      if (R.cur < target) R.cur = Math.min(target, R.cur + 3); else if (R.cur > target) R.cur = Math.max(target, R.cur - 3);
    }
  });

  for (const s of L.springs) if (s.sq > 0) s.sq = Math.max(0, s.sq - STEP * 5);

  if (!me.dead) {
    for (const f of L.flags) {
      if (!f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90) {
        f.on = true; me.cp = { x: f.x - PW / 2, y: f.y - PH }; Snd.cp(); sparkle(f.x, f.y - 50, 14, 1, '#7cf');
        toast('⚑ Checkpoint!');
        if (G.mode !== 'solo') netEv({ t: 'cp', x: Math.round(me.cp.x), y: Math.round(me.cp.y), fi: L.flags.indexOf(f), s: me.slot });
      } else if (f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90 && f.x - PW / 2 >= me.cp.x) {
        me.cp = { x: f.x - PW / 2, y: f.y - PH };
      }
    }
    const cx = me.x + PW / 2, cy = me.y + PH / 2;
    const mg = (curPassive === 'magnet' || timedOn(me, 'magnet')) ? 2.3 : 1;
    for (const c of L.coins) {
      if (c.pop > 0) c.pop -= STEP;
      if (c.got) continue;
      if (Math.abs(cx - c.x) < 24 * mg && Math.abs(cy - c.y) < 28 * mg) {
        c.got = true; c.pop = 0.5;
        const dia = c.kind === 'diamond';
        if (G.lvIdx >= 0) { Save.markCoin(G.mode, G.lvIdx, c.id); if (dia) Save.addDiamonds(1); else { Save.addCoins(1); if (curPassive === 'luck' && Math.random() < 0.2) { Save.addCoins(1); sparkle(c.x, c.y - 12, 6, 1, '#ffb3d1'); } } }
        if (dia) { Snd.key(); sparkle(c.x, c.y, 18, 1.4, '#7ee8ff'); toast('💎 Diamond found!'); }
        else { Snd.coin(); sparkle(c.x, c.y, 10, 1); }
      }
    }
    if (!G.keyGot) {
      const k = keyPos(), kg = mg > 1 ? 1.6 : 1;
      if (Math.abs(cx - k.x) < 30 * kg && Math.abs(cy - k.y) < 34 * kg) collectKey(true, me.slot);
    }
    exitCheck();
  }

  if (G.won) {
    G.winT += STEP;
    if (G.winT > 3.6 && !G.finalShown) advanceAfterWin();
  }
}

function collectKey(send, slot) {
  if (G.keyGot) return;
  G.keyGot = true; Snd.key();
  const k = keyPos(); sparkle(k.x, k.y, 24, 1.6);
  const ks = $('keyStat'); if (ks) { ks.textContent = '🔑 ✓'; ks.classList.add('got'); }
  toast(slot === G.myslot ? '🔑 Got the key! Reach the exit!' : '🔑 ' + (G.names[slot] || 'A bunny') + ' got the key!');
  if (send) netEv({ t: 'key' });
}

function exitCheck() {
  if (G.won || !G.keyGot) return;
  const e = G.L.exit, me = G.me;
  if (e.lock || e.hide) return;                       // v11 troll door: still running / sunk / not fixed
  if (!rectsOverlap(me.x, me.y, PW, PH, e.x, e.y, e.w, e.h)) return;
  if (G.mode !== 'solo') {
    const t = nowMs();
    for (const r of G.remotes.values()) {
      if (t - r.recv > 5000) continue;
      if (r.dead) continue;
      if (!rectsOverlap(r.x, r.y, PW, PH, e.x - 14, e.y - 14, e.w + 28, e.h + 28)) {
        if (!G._waitToast || t - G._waitToast > 2500) { G._waitToast = t; toast('Đang đợi tất cả đồng đội ở cửa thoát…'); }
        return;
      }
    }
  }
  triggerWin(true);
}

function triggerWin(send) {
  if (G.won) return;
  G.won = true; G.winT = 0;
  if (G.me) { G.me.shield = false; G.me.dj = false; G.me.djT = 0; if (G.me.timed) for (const id in G.me.timed) G.me.timed[id] = 0; refreshBuffUI(); }
  const L = G.L, e = L.exit;
  Snd.win(); confetti(e.x + e.w / 2, e.y, 160, 90);
  const first = !Save.cleared(G.mode, G.lvIdx);
  Save.unlock(G.mode, G.lvIdx + 2);
  const bonus = first ? 5 : 0;
  if (bonus) Save.addCoins(bonus);
  const newBest = Save.setBest(G.mode, G.lvIdx, G.levelTime);
  showBanner('LEVEL CLEAR!  ' + G.levelTime.toFixed(1) + 's' + (newBest ? '  ★ NEW BEST' : ''),
    (bonus ? '+' + bonus + ' 🪙 first-clear bonus  •  ' : '') + (G.lvIdx + 1 < LEVELS[G.mode].length ? 'Next level unlocked!' : 'You beat the whole campaign!'));
  rebuildLevelSelect();
  if (send) netEv({ t: 'win' });
}

function advanceAfterWin() {
  const list = LEVELS[G.mode] || LEVELS.solo;
  if (G.lvIdx < 0) {
    G.finalShown = true;
    toast('🎉 Hoàn thành màn tự tạo!');
    setTimeout(() => { if (isHostSlot()) { const nl = generateRandomLevel(G.mode); if (isNet()) netEv({ t: 'custom_lvl', data: nl }); loadLevel(-1, nl); } }, 3000);
    return;
  }
  const next = G.lvIdx + 1;
  if (next < list.length) {
    if (G.mode !== 'solo') {
      G.finalShown = true;
      if (isHostSlot()) { loadLevel(next); netEv({ t: 'lvl', n: next }); }
      else setTimeout(() => { if (G.won && G.lvIdx === next - 1) { loadLevel(next); } }, 2500);
    } else { G.finalShown = true; loadLevel(next); }
  } else {
    G.finalShown = true;
    setText('finalSub', 'All ' + list.length + ' levels cleared — legendary bunny! 🎉');
    show('final', true);
    setTimeout(() => {
      show('final', false);
      if (G.mode === 'solo') leaveToMenu(true); else loadLevel(0);
    }, 4200);
  }
}

const isHostSlot = () => (G.mode === 'solo') || (G.myslot === G.hostSlot);
const isNet = () => G.mode === 'coop' || G.mode === 'party';

function tpToCheckpoint(P) { P.x = P.cp.x; P.y = P.cp.y; P.vx = P.vy = 0; P.rope = null; G.cam.snap = true; }
function die(cause) {
  const P = G.me;
  if (P.dead || P.inv > 0 || G.won) return;
  if (G.boutique) { if (cause === 'fall' || cause === 'wall') tpToCheckpoint(P); return; }
  if (Role.admin && Role.god) {
    if (cause === 'fall' || cause === 'wall') { P.x = P.cp.x; P.y = P.cp.y; P.vx = P.vy = 0; G.cam.snap = true; }
    return;
  }
  if (P.shield) {
    P.shield = false; P.inv = 1.4; P.rope = null; Snd.pop(); sparkle(P.x + PW / 2, P.y + PH / 2, 16, 1.5, '#8ff');
    if (cause === 'fall') { tpToCheckpoint(P); toast('🛡️ Shield saved you from the pit!'); }
    else if (cause === 'wall') { tpToCheckpoint(P); rewindHunters(P); toast('🛡️ Shield saved you from the Void Maw!'); }
    else { P.vy = -8; toast('🛡️ Shield popped!'); }
    refreshBuffUI(); return;
  }
  P.dead = true; P.deadT = 0.75; P.rope = null; P.lastCause = cause;
  if (P.dj) { P.dj = false; P.djT = 0; toast('🦘 Double Jump ended (you died)'); }
  if (P.timed) { let any = false; for (const id in P.timed) { if (P.timed[id] > 0) any = true; P.timed[id] = 0; } if (any) toast('⏱️ Buff hết hiệu lực (bạn đã chết)'); }
  refreshBuffUI();
  G.deaths++; setText('deaths', '💥 ' + G.deaths);
  Snd.die(); G.shake = Math.max(G.shake, 8);
  sparkle(P.x + PW / 2, P.y + PH / 2, 22, 1.8, COLORS[P.slot % COLORS.length]);
  puff(P.x + PW / 2, P.y + PH, 8, '#fff', 1.2);
  netEv({ t: 'die', x: Math.round(P.x), y: Math.round(P.y) });
}

function respawn() {
  const P = G.me, L = G.L;
  const rx = P.cp.x, ry = P.cp.y;
  rewindHunters(P);
  P.x = rx; P.y = ry; P.vx = P.vy = 0; P.dead = false; P.rev = 0;
  P.inv = curPassive === 'rebirth' ? 5 : 2.5; // 2.5s invulnerability (5s with Phoenix passive)
  if (curPassive === 'guard' && !P.shield) { P.shield = true; refreshBuffUI(); }
  P.tetherGrace = 3.5; // 3.5s zero-tether pull on respawn!
  P.rope = null; P.ropeCd = 20; P.usedDJ = false;
  puff(P.x + PW / 2, P.y + PH, 12, '#fff');
  G.cam.snap = G.cam.snap || (Math.abs(G.cam.x - P.x) > 1400);
}

function timedOn(P, id) { return !!(P && P.timed && P.timed[id] > 0); }
function runMax(P) { return RUN * (curPassive === 'swift' ? 1.12 : 1) * (timedOn(P, 'speed') ? 1.3 : 1); }
function jumpMul(P) { return (curPassive === 'springlegs' ? 1.1 : 1) * (timedOn(P, 'jumpboost') ? 1.25 : 1); }

function useBuff(which) {
  const P = G.me;
  if (!P || P.dead || G.won) return;
  if (!P.timed) P.timed = { speed: 0, magnet: 0, jumpboost: 0 };
  const free = Role.admin;
  const have = (id) => free || Save.buff(id) > 0;
  const spend = (id) => { if (!free) Save.useBuff(id); };
  if (!which) {
    if (!P.shield && have('shield')) which = 'shield';
    else if (!P.dj && have('doublejump')) which = 'doublejump';
    else { if (!P.shield && !P.dj) toast('No charges - buy in the 🛍️ shop!'); refreshBuffUI(); return; }
  }
  const b = BUFFS[which]; if (!b) return;
  if (which === 'shield') {
    if (P.shield) toast('🛡️ Khiên đang bật rồi!');
    else if (!have('shield')) toast('Hết khiên 🛡️ - mua thêm ở 🛍️ shop!');
    else { spend('shield'); P.shield = true; toast('🛡️ Bubble Shield on!'); Snd.pop(); }
  } else if (which === 'doublejump') {
    if (P.dj) toast('🦘 Nhảy đôi đang bật rồi!');
    else if (!have('doublejump')) toast('Hết thuốc nhảy đôi 🦘 - mua thêm ở 🛍️ shop!');
    else { spend('doublejump'); P.dj = true; P.djT = DJ_SECONDS; P.usedDJ = false; toast('🦘 Double Jump on for ' + DJ_SECONDS + 's!'); Snd.djump(); }
  } else {
    if (P.timed[which] > 0) toast(b.icon + ' ' + b.name + ' đang bật rồi!');
    else if (!have(which)) toast('Hết ' + b.name + ' ' + b.icon + ' - mua thêm ở 🛍️ shop!');
    else {
      spend(which); P.timed[which] = free ? 9999 : b.dur;
      toast(b.icon + ' ' + b.name + ' on for ' + b.dur + 's!'); Snd.djump(); sparkle(P.x + PW / 2, P.y + PH / 2, 10, 1.2, '#fff3a0');
    }
  }
  refreshBuffUI();
}

function applyTether(P) {
  // Disable tether in Party mode or during respawn grace!
  if (G.mode !== 'coop' || P.anch || P.rope || G.remotes.size === 0 || (P.tetherGrace && P.tetherGrace > 0)) return;
  const slots = [P.slot];
  for (const r of G.remotes.values()) slots.push(r.slot);
  slots.sort((a, b) => a - b);
  const i = slots.indexOf(P.slot);
  const nb = [];
  if (i > 0) nb.push(slots[i - 1]);
  if (i < slots.length - 1) nb.push(slots[i + 1]);
  for (const s of nb) {
    const r = G.remotes.get(s);
    if (!r || r.dead || r.ropeOn || (r.tetherGrace && r.tetherGrace > 0)) continue;
    const dx = (r.x + PW / 2) - (P.x + PW / 2), dy = (r.y + PH / 2) - (P.y + PH / 2);
    const d = Math.hypot(dx, dy);
    if (d > TETHER) {
      const st = d - TETHER;
      // Cap pulling force smoothly so players aren't violently launched into pits
      const res = (P.onGround || input.d) ? 0.1 : 1;
      const f = Math.min(st * 0.008 + (st > 120 ? 0.2 : 0), 1.2) * res;
      P.vx += (dx / d) * f;
      P.vy += (dy / d) * f * (dy < 0 ? 0.7 : 0.25);
    }
  }
}

function tryGrabRope(P) {
  if (P.ropeCd > 0) { P.ropeCd--; return; }
  if (P.onGround || P.dead) return;
  const L = G.L;
  for (let i = 0; i < L.ropes.length; i++) {
    const R = L.ropes[i];
    if (R.hs !== -1 && R.hs !== P.slot) continue;
    const bob = ropeBob(R), cx = P.x + PW / 2, cy = P.y + PH / 2;
    if (Math.hypot(cx - bob.x, cy - bob.y) < 50) {
      const len = clamp(Math.hypot(cx - R.ax, cy - R.ay), 150, R.cur);
      const th = Math.atan2(cx - R.ax, cy - R.ay);
      const w = (P.vx * Math.cos(th) - P.vy * Math.sin(th)) / len;
      P.rope = { i, th, w: clamp(w, -0.05, 0.05), len };
      P.vx = P.vy = 0; Snd.grab(); sparkle(cx, cy, 6, 0.8);
      if (L.key.rope === i && !G.keyGot) collectKey(true, P.slot);
      return;
    }
  }
}

function stepRope(P, ax) {
  const R = G.L.ropes[P.rope.i], rp = P.rope;
  if (ax !== 0 && (Math.sign(rp.w) === ax || Math.abs(rp.w) < 0.004)) rp.w += ax * 0.0008;
  rp.w += -(0.85 / rp.len) * Math.sin(rp.th);
  rp.w *= 0.9992;
  rp.th = clamp(rp.th + rp.w, -1.3, 1.3);
  const cx = R.ax + rp.len * Math.sin(rp.th), cy = R.ay + rp.len * Math.cos(rp.th);
  P.x = cx - PW / 2; P.y = cy - PH / 2;
  P.vx = rp.len * rp.w * Math.cos(rp.th); P.vy = -rp.len * rp.w * Math.sin(rp.th);
  if (Math.abs(rp.w) > 0.002) P.face = rp.w > 0 ? 1 : -1;
  const hits = nearSolids(P.x, P.y, PW, PH);
  let release = hits.length > 0;
  if (hits.length) {
    const s = hits[0];
    const ox = Math.min(P.x + PW - s[0], s[0] + s[2] - P.x), oy = Math.min(P.y + PH - s[1], s[1] + s[3] - P.y);
    if (oy <= ox) { if (P.y + PH / 2 < s[1] + s[3] / 2) { P.y = s[1] - PH; P.vy = 0; } else { P.y = s[1] + s[3]; P.vy = 1; } }
    else if (P.x + PW / 2 < s[0] + s[2] / 2) { P.x = s[0] - PW; P.vx = 0; } else { P.x = s[0] + s[2]; P.vx = 0; }
  }
  if (P.jbuf > 0) { release = true; P.vy -= 3.5; P.vx *= 1.05; P.jbuf = 0; Snd.jump(P.slot); }
  if (release) { P.rope = null; P.ropeCd = 28; P.usedDJ = false; }
}

function hazardCheck(P) {
  const L = G.L;
  const hx = P.x + 4, hy = P.y + 5, hw = PW - 8, hh = PH - 8;
  for (const s of L.spikes) {
    if (s.hid) continue;
    let sy = s.dir === 'up' ? s.y + 7 : s.y, sh = s.h - 7;
    if (s.bt !== undefined) {                       // v11 bait spikes: only deadly once launched, hit-box follows the rise
      if (!s.live) continue;
      const k = clamp(s.ph, 0, 1); sy = s.y + s.h * (1 - k) + 7; sh = s.h * k - 7;
      if (sh <= 0) continue;
    }
    if (rectsOverlap(hx, hy, hw, hh, s.x + 3, sy, s.w - 6, sh)) return 'spikes';
  }
  for (const c of L.crushers) if (rectsOverlap(hx, hy, hw, hh, c.x + 2, c.cb - c.h, c.w - 4, c.h)) return 'crusher';
  for (const b of L.boulders) {
    const bx = b.cx, by = b.y - b.r;
    const nx = clamp(bx, hx, hx + hw), ny = clamp(by, hy, hy + hh);
    if (Math.hypot(bx - nx, by - ny) < b.r - 4) return 'boulder';
  }
  for (const s of L.sweepers) if (hx < s.cx + s.w - 10) return 'wall';
  for (const r of (L.risers || [])) if (hy + hh > r.cy + 6) return 'wall';
  for (const q of (L.stalactites || [])) if (q.st === 2 && rectsOverlap(hx, hy, hw, hh, q.x + 6, q.y + q.fy, q.w - 12, q.h)) return 'stalactite';
  for (const f of (L.meteors || [])) {
    const m = meteorAt(f, G.lt);
    if (m.fly) { if (circleHitsRect(m.x, m.y, 15, hx, hy, hw, hh)) return 'meteor'; }
    else if (m.age - m.T < 0.3 && circleHitsRect(m.ix, f.gy - 10, 42, hx, hy, hw, hh)) return 'meteor';
  }
  for (const t of (L.traps || [])) {
    if (t.k !== 'arena' || t.st !== 1) continue;
    const tt = G.lt - t.t0;
    for (let j = 0; j < t.saws.length; j++) { const p = sawPos(t, j, tt); if (circleHitsRect(p.x, p.y, t.saws[j].r - 3, hx, hy, hw, hh)) return 'saw'; }
  }
  if (P.y > (L.h || WORLD_H) + 90) return 'fall';
  return null;
}

function stepPlayer() {
  const P = G.me, L = G.L;
  P.px = P.x; P.py = P.y;
  springEars(P, P.vx, P.vy, P.face);
  if (P.dead) { P.deadT -= STEP; if (P.deadT <= 0) respawn(); return; }
  if (P.inv > 0) P.inv -= STEP;
  if (P.tetherGrace > 0) P.tetherGrace -= STEP;
  if (P.dj && !Role.admin) {
    const before = Math.ceil(P.djT); P.djT -= STEP;
    if (P.djT <= 0) { P.dj = false; P.djT = 0; toast('🦘 Double Jump expired'); refreshBuffUI(); }
    else if (Math.ceil(P.djT) !== before) refreshBuffUI();
  }
  if (P.timed && !Role.admin) {
    for (const id in P.timed) {
      if (P.timed[id] <= 0) continue;
      const before = Math.ceil(P.timed[id]); P.timed[id] -= STEP;
      if (P.timed[id] <= 0) { P.timed[id] = 0; toast(BUFFS[id].icon + ' ' + BUFFS[id].name + ' expired'); refreshBuffUI(); }
      else if (Math.ceil(P.timed[id]) !== before) refreshBuffUI();
    }
  }
  if (G.won) { P.vx *= 0.8; }
  let ax = G.won ? 0 : (input.r ? 1 : 0) - (input.l ? 1 : 0);
  if (P.rev > 0) { P.rev -= STEP; ax = -ax; }          // v11 fake plate: LEFT/RIGHT swapped

  if (input.j && !P.jPrev && !G.won) P.jbuf = 7;
  P.jPrev = input.j;
  if (input.b && !P.bPrev) useBuff();
  P.bPrev = input.b;
  if (P.rope) { stepRope(P, ax); if (P.jbuf > 0) P.jbuf--; P.anch = false; const h = hazardCheck(P); if (h) die(h); return; }

  if (P.wlock > 0) { P.wlock--; } else if (ax !== 0) {
    const acc = P.onGround ? (P.onIce ? 0.16 : 1.0) : (curPassive === 'featherfall' ? 0.85 : 0.65);
    const tgt = ax * runMax(P);
    P.vx += clamp(tgt - P.vx, -acc, acc);
    P.face = ax;
  } else P.vx *= P.onGround ? (P.onIce ? 0.985 : 0.72) : 0.95;
  if (Math.abs(P.vx) < 0.04) P.vx = 0;
  applyTether(P);

  { const rm = runMax(P); P.vx = clamp(P.vx, -rm - 4, rm + 4); }
  P.vy = Math.min(P.vy + GRAV, curPassive === 'featherfall' ? MAXFALL * 0.7 : MAXFALL);
  if (L.wj && !P.onGround) {
    const wl = nearSolids(P.x - 3, P.y + 6, 3, PH - 12).length > 0;
    const wr = wl ? false : nearSolids(P.x + PW, P.y + 6, 3, PH - 12).length > 0;
    if (wl || wr) {
      P.wallDir = wl ? -1 : 1; P.wallT = 7;
      if (P.vy > 2.4) { P.vy = 2.4; if (Math.random() < 0.3) puff(P.x + (wl ? 0 : PW), P.y + PH * 0.6, 1, '#e8e0d8', 0.4); }
    } else if (P.wallT > 0) P.wallT--;
  } else if (P.onGround) P.wallT = 0;

  if (P.onGround) { P.coyote = 6; P.usedDJ = false; } else if (P.coyote > 0) P.coyote--;
  if (P.jbuf === 7 && G.mode === 'coop' && (P.onGround || input.d)) {
    const hf = hangingFriend(P);
    if (hf) { P.jbuf = 0; doHoist(P, hf); }
  }
  if (P.jbuf > 0) {
    if (P.coyote > 0) {
      const isFromHead = !!P.ride;
      P.vy = (isFromHead ? -JUMP * 1.15 : -JUMP) * jumpMul(P); // 15% super jump boost off head!
      P.coyote = 0; P.jbuf = 0; P.jumping = true; P.onGround = false; P.sq = -0.25;
      Snd.jump(P.slot); puff(P.x + PW / 2, P.y + PH, isFromHead ? 6 : 4, isFromHead ? '#ffe066' : '#fff');
    } else if (L.wj && P.wallT > 0 && !P.onGround) {
      P.vy = -JUMP * 0.96 * jumpMul(P); P.vx = -P.wallDir * 6.4; P.wallT = 0; P.wlock = 9; P.face = -P.wallDir; P.jbuf = 0; P.jumping = true; P.usedDJ = false;
      Snd.jump(P.slot); puff(P.x + (P.wallDir > 0 ? PW : 0), P.y + PH * 0.6, 5, '#fff', 1);
    } else if (P.dj && !P.usedDJ && !P.onGround) {
      P.vy = -JUMP * 0.92 * jumpMul(P); P.usedDJ = true; P.jbuf = 0; P.jumping = true; Snd.djump(); sparkle(P.x + PW / 2, P.y + PH, 8, 1, '#9ef');
    } else P.jbuf--;
  }
  if (!input.j && P.jumping && P.vy < -4.2) { P.vy = -4.2; P.jumping = false; }
  if (P.vy >= 0) P.jumping = false;

  const feetStart = P.y + PH;
  const pre = nearSolids(P.x, P.y, PW, PH).slice();
  const px0 = P.x;
  P.x += P.vx;
  if (P.x < 0) { P.x = 0; P.vx = 0; }
  if (P.x > L.w - PW) { P.x = L.w - PW; P.vx = 0; }
  let hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    // a box / door that just appeared under our feet must LIFT us (Y phase), never shove us sideways into a pit
    if (pre.includes(s) && feetStart - s[1] <= 46 && feetStart > s[1]) continue;
    if (P.vx > 0) P.x = s[0] - PW;
    else if (P.vx < 0) P.x = s[0] + s[2];
    else P.x += (P.x + PW / 2 < s[0] + s[2] / 2) ? -1.5 : 1.5;
    P.vx = 0;
  }

  const feet0 = P.y + PH;
  P.y += P.vy;
  P.wasGround = P.onGround; P.onGround = false; P.onIce = false; P.ride = null; P.anch = false;
  hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (P.vy > 0) {
      P.y = s[1] - PH; P.onGround = true; P.onIce = !!s.ice;
    } else if (P.vy < 0) {
      P.y = s[1] + s[3];
    } else {
      // Platform appeared/solidified around player: ELEVATE to top surface! Never push through floor!
      if (feet0 <= s[1] + s[3] + 8) {
        P.y = s[1] - PH;
        P.onGround = true;
      } else {
        P.y = s[1] + s[3];
      }
    }
    P.vy = P.vy > 0 ? 0 : (P.vy < 0 ? 0 : P.vy);
  }

  if ((G.mode === 'coop' || G.mode === 'party') && !P.onGround && P.vy >= 0) {
    for (const r of G.remotes.values()) {
      if (r.dead || r.ropeOn) continue;
      const feet = P.y + PH, prevFeet = feet0;
      if (P.x + PW - 5 > r.x + 3 && P.x + 5 < r.x + PW - 3 && feet >= r.y - 2 && prevFeet <= r.y + 10) {
        P.y = r.y - PH;
        P.vy = 0;
        P.onGround = true;
        P.ride = r;
        P.x += r.dx || 0;
        if (nearSolids(P.x, P.y, PW, PH).length) P.x -= r.dx || 0;
        break;
      }
    }
  }

  for (const s of L.springs) {
    const feet = P.y + PH;
    if (P.vy >= 0 && P.x + PW - 3 > s.x && P.x + 3 < s.x + s.w && feet >= s.y - 4 && feet <= s.y + s.h + 3) {
      P.vy = -s.power; P.onGround = false; P.coyote = 0; P.jumping = false; s.sq = 1;
      Snd.spring(); puff(s.x + s.w / 2, s.y, 6, '#ffd54f'); P.sq = -0.35;
    }
  }

  if (P.onGround && !P.wasGround) { P.sq = 0.3; Snd.land(); puff(P.x + PW / 2, P.y + PH, 6, '#efe7df', 1.2); }
  P.sq *= 0.82;

  if (P.onGround) {
    for (const p of L.plates) if (standsOn(P, p)) P.anch = true;
    for (const R of L.ropes) for (const p of R.pads) if (standsOn(P, p)) P.anch = true;
  }
  if (P.onGround && Math.abs(P.vx) > 1) {
    P.runT += Math.abs(P.vx) * 0.06;
    const fast = Math.abs(P.vx) > 3.6;
    if (Math.random() < (fast ? 0.4 : 0.1)) puff(P.x + PW / 2 - P.face * 9, P.y + PH, 1, '#e8e0d8', 0.5);
    if (fast && Math.random() < 0.25) speedLine(P.x + PW / 2 - P.face * 18, P.y + PH * 0.3 + rnd(0, PH * 0.6), P.face, false);
  }
  if (!P.onGround && P.vy > 9 && Math.random() < 0.5) speedLine(P.x + rnd(0, PW), P.y - 6, 0, true);
  tryGrabRope(P);
  const h = hazardCheck(P);
  if (h) die(h);
}

// ============================================================================
// NETWORKING  (co-op only; solo never touches the server)
// ============================================================================
let socket = null, netLost = false, lastSend = 0, lastSentKey = '', lastClk = 0;

function packFlags(P) {
  let f = 0;
  if (P.face > 0) f |= F_RIGHT;
  if (P.onGround) f |= F_GROUND;
  if (P.dead) f |= F_DEAD;
  if (P.rope) f |= F_ROPE | (P.rope.i << 8);
  if (P.shield) f |= F_SHIELD;
  if (P.inv > 0) f |= F_INV;
  if (P.anch) f |= F_ANCH;
  if (G.boutique) f |= F_BOUT;
  return f;
}

function springEars(e, vx, vy, face) {
  const tgt = clamp(-vx * face * 0.06, -0.55, 0.45) + clamp(-vy * 0.03, -0.35, 0.3);
  e.earV = (e.earV || 0) * 0.82 + (tgt - (e.ear || 0)) * 0.16;
  e.ear = (e.ear || 0) + e.earV;
}

function newRemote(slot) {
  const L = G.L, sx = L ? L.spawn[0] + slot * 34 : 80, sy = L ? L.spawn[1] : GY - PH;
  return {
    slot, x: sx, y: sy, tx: sx, ty: sy, tvx: 0, tvy: 0, dx: 0, flags: F_RIGHT | F_GROUND, face: 1, dead: false,
    ropeOn: false, ropeId: 0, shield: false, anch: false, inv: false, onGround: true, recv: nowMs(), runT: 0, sq: 0,
  };
}

function applyRemoteFlags(r, f) {
  r.flags = f; r.face = (f & F_RIGHT) ? 1 : -1; r.onGround = !!(f & F_GROUND); r.dead = !!(f & F_DEAD);
  r.ropeOn = !!(f & F_ROPE); r.ropeId = f >> 8; r.shield = !!(f & F_SHIELD); r.inv = !!(f & F_INV); r.anch = !!(f & F_ANCH); r.bout = !!(f & F_BOUT);
}

function ensureSocket() {
  if (socket) return socket;
  if (typeof io !== 'function') return null;
  socket = io({ transports: ['websocket', 'polling'], reconnection: true });
  socket.on('roster', onRoster);
  socket.on('ps', onPositions);
  socket.on('ev', onNetEv);
  socket.on('disconnect', () => { if (G.inGame && isNet()) { netLost = true; toast('Connection lost - reconnecting…'); } });
  socket.on('connect', () => {
    if (!(netLost && G.inGame && isNet())) return;
    socket.emit('join', { code: G.code, name: G.myName, skin: Save.equipped() }, (res) => {
      if (res && res.ok) {
        netLost = false; G.myslot = res.slot; if (G.me) G.me.slot = res.slot;
        G.names[res.slot] = G.myName; G.hostSlot = res.host !== undefined ? res.host : res.slot;
        toast('✅ Reconnected!');
      } else { toast('Room was closed.'); setTimeout(() => { location.href = location.pathname; }, 1500); }
    });
  });
  return socket;
}

function netEv(o) {
  if (!isNet() || !socket || !socket.connected) return;
  o.lv = G.lvIdx;
  if (G.mode === 'party') o.pn = PARTY_N;
  socket.emit('ev', o);
}

function onPositions(arr) {
  if (!Array.isArray(arr) || !isNet()) return;
  const t = nowMs();
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    if (!Array.isArray(a) || a[0] === G.myslot) continue;
    let r = G.remotes.get(a[0]);
    if (!r) { r = newRemote(a[0]); G.remotes.set(a[0], r); }
    r.tx = a[1]; r.ty = a[2]; r.tvx = a[3] / 10; r.tvy = a[4] / 10;
    applyRemoteFlags(r, a[5] | 0);
    r.recv = t;
  }
}

function onNetEv(e) {
  if (!e || !G.inGame || !isNet()) return;
  switch (e.t) {
    case 'pcount':
      PARTY_N = Math.max(1, Math.min(10, e.n | 0));
      updateDiffBadge();
      break;
    case 'trap':
      if (e.lv === G.lvIdx) trapAct(e.i, e.a, e.v, e.s);
      break;
    case 'lvl':
      if (e.pn) PARTY_N = Math.max(1, Math.min(10, e.pn | 0));
      loadLevel(e.n);
      break;
    case 'cp':
      if (e.lv === G.lvIdx) {
        if (e.x >= G.me.cp.x) G.me.cp = { x: e.x, y: e.y };
        if (G.L && G.L.flags && G.L.flags[e.fi]) G.L.flags[e.fi].on = true;
        sparkle(e.x + PW / 2, e.y + PH / 2, 14, 1, '#7cf');
        toast('⚑ ' + (G.names[e.s] || 'Đồng đội') + ' đã mở Checkpoint!');
      }
      break;
    case 'restart':
      if (e.pn) PARTY_N = Math.max(1, Math.min(10, e.pn | 0));
      restartLevel();
      toast('🔄 Chủ phòng đã khởi động lại màn!');
      break;
    case 'custom_lvl':
      if (e.data) {
        loadLevel(-1, e.data);
        toast('🗺️ Đã tải màn chơi từ ' + (G.names[e.s] || 'Chủ phòng') + '!');
      }
      break;
    case 'hoist':
      if (e.lv === G.lvIdx && e.to === G.myslot && G.me && !G.me.dead) {
        const M = G.me;
        if (M.rope) M.rope.len = Math.max(150, M.rope.len - 7); else M.vy = Math.max(M.vy - 1.8, -9);
        sparkle(M.x + PW / 2, M.y + PH / 2, 4, 0.8, '#fff3a0');
      }
      break;
    case 'key': if (e.lv === G.lvIdx) collectKey(false, e.s); break;
    case 'keyst': if (e.lv === G.lvIdx && e.v && !G.keyGot) { G.keyGot = true; const ks = $('keyStat'); if (ks) { ks.textContent = '🔑 ✓'; ks.classList.add('got'); } } break;
    case 'win': if (e.lv === G.lvIdx) triggerWin(false); break;
    case 'die':
      if (e.lv === G.lvIdx) {
        const col = COLORS[(e.s | 0) % COLORS.length];
        sparkle(e.x + PW / 2, e.y + PH / 2, 18, 1.6, col);
        G.deaths++; setText('deaths', '💥 ' + G.deaths);
      }
      break;
    case 'clk':
      if (e.lv === G.lvIdx && e.s === G.hostSlot && e.s !== G.myslot) {
        const target = e.v + G.pingMs / 2000, diff = target - G.lt;
        if (Math.abs(diff) > 0.04) G.lt += diff * (Math.abs(diff) > 0.5 ? 1 : 0.5);
      }
      break;
    default: break;
  }
}

function onRoster(r) {
  if (!r) return;
  const prevCount = G.remotes.size;
  G.roster = r; G.hostSlot = r.host;
  const seen = new Set();
  r.players.forEach((p) => {
    G.names[p.s] = p.n; G.skins[p.s] = p.skin || 'classic'; seen.add(p.s);
    if (p.s === G.myslot) return;
    let rm = G.remotes.get(p.s);
    if (!rm) { rm = newRemote(p.s); G.remotes.set(p.s, rm); if (G.inGame) toast('🐰 ' + p.n + ' joined!'); }
  });
  for (const s of [...G.remotes.keys()]) {
    if (!seen.has(s)) { toast((G.names[s] || 'A bunny') + ' left'); G.remotes.delete(s); }
  }
  updatePlayerList();
  if (G.inGame && G.remotes.size > prevCount && G.keyGot) netEv({ t: 'keyst', v: 1 });
  if (G.inGame && G.mode === 'party') {
    // someone joined right at the start of a level: host re-locks N so the difficulty matches the real squad size
    if (isHostSlot() && G.remotes.size > prevCount && !G.keyGot && G.levelTime < 15 && G.me && G.L && G.me.x < G.L.spawn[0] + 320 && presentCount() !== PARTY_N) {
      restartLevel(); netEv({ t: 'restart' }); toast('🔄 Có người vào phòng — màn được chốt lại cho ' + PARTY_N + ' người!');
    }
    updateDiffBadge();
  }
}

function updatePlayerList() {
  const el = $('playerList'); if (!el) return;
  el.innerHTML = '';
  if (!isNet()) return;
  const slots = [G.myslot, ...G.remotes.keys()].sort((a, b) => a - b);
  slots.forEach((s) => {
    const d = document.createElement('div'); d.className = 'pchip';
    const i = document.createElement('i'); i.style.background = COLORS[s % COLORS.length];
    const sp = document.createElement('span'); sp.textContent = (G.names[s] || 'Bunny') + (s === G.myslot ? ' (you)' : '') + (s === G.hostSlot ? ' ★' : '');
    d.appendChild(i); d.appendChild(sp); el.appendChild(d);
  });
}

function sendPos(now) {
  if (!isNet() || !socket || !socket.connected || !G.me) return;
  const P = G.me;
  const pkt = [Math.round(P.x), Math.round(P.y), Math.round(P.vx * 10), Math.round(P.vy * 10), packFlags(P)];
  const key = pkt.join(',');
  if (now - lastSend < SEND_MS) return;
  if (key === lastSentKey && now - lastSend < 400) return;
  lastSend = now; lastSentKey = key;
  socket.volatile.emit('pos', pkt);
  if (G.remotes.size && isHostSlot() && now - lastClk > 1500) { lastClk = now; netEv({ t: 'clk', v: G.lt }); }
}

function stepRemotes() {
  const now = nowMs();
  const k = 1 - Math.exp(-STEP * 22);
  for (const r of G.remotes.values()) {
    const age = Math.min(0.12, Math.max(0, (now - r.recv) / 1000));
    const ex = r.tx + r.tvx * 60 * age;
    const ey = r.onGround ? r.ty : r.ty + clamp(r.tvy * 60 * age, -40, 40);
    const px = r.x; r.px = r.x; r.py = r.y;
    if (Math.abs(ex - r.x) > 380 || Math.abs(ey - r.y) > 380) { r.x = ex; r.y = ey; }
    else { r.x += (ex - r.x) * k; r.y += (ey - r.y) * k; }
    r.dx = r.x - px;
    springEars(r, r.tvx, r.tvy, r.face);
    if (r.onGround && Math.abs(r.dx) > 2.4 && Math.random() < 0.3) puff(r.x + PW / 2 - r.face * 9, r.y + PH, 1, '#e8e0d8', 0.5);
    r.runT += Math.abs(r.dx) * 0.06;
    r.sq *= 0.85;
  }
}

setInterval(() => {
  if (!socket || !socket.connected || !isNet()) return;
  const t = nowMs();
  socket.emit('p', () => {
    G.pingMs = Math.round(nowMs() - t);
    const e = $('ping');
    if (e) { e.textContent = G.pingMs + ' ms'; e.className = 'ping ' + (G.pingMs < 80 ? 'good' : G.pingMs < 180 ? 'mid' : 'bad'); }
  });
}, 2000);

// ============================================================================
// MENUS, LEVEL PICKER, SHOP, INPUT
// ============================================================================
const LV_META = {};
function levelMeta(mode) {
  if (!LV_META[mode]) LV_META[mode] = LEVELS[mode].map((f) => { const L = f(); return { name: L.name, w: L.w, h: L.h, tower: L.h > WORLD_H, coins: L.coins.length }; });
  return LV_META[mode];
}

function rebuildLevelSelect() {
  const sel = $('lvSelect'); if (!sel) return;
  const meta = levelMeta(G.mode), un = Save.unlocked(G.mode);
  sel.innerHTML = '';
  meta.forEach((m, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = (i + 1 > un ? '🔒 ' : '') + 'Lv ' + (i + 1) + ' - ' + m.name;
    if (i + 1 > un) o.disabled = true;
    sel.appendChild(o);
  });
  sel.value = String(G.lvIdx);
}

function buildPicker() {
  if ($('levelPicker')) return;
  const st = document.createElement('style');
  st.textContent = [
    '.lp-wrap{position:fixed;inset:0;z-index:25;display:flex;align-items:center;justify-content:center;padding:14px;overflow-y:auto;touch-action:pan-y;',
    'background:linear-gradient(160deg,#ffd1e3 0%,#ffe9d6 45%,#d8f3ff 100%)}',
    '.lp-card{width:min(760px,100%);background:var(--paper,#fff8fb);border:4px solid var(--ink,#5b3a5e);border-radius:26px;padding:16px 18px;box-shadow:var(--shadow,0 6px 0 rgba(0,0,0,.2))}',
    '.lp-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}',
    '.lp-title{flex:1;text-align:center;font:700 18px var(--font,sans-serif);color:var(--ink,#5b3a5e)}',
    '.lp-back,.lp-shop{font:700 14px var(--font,sans-serif);border:3px solid var(--ink,#5b3a5e);background:#fff;border-radius:12px;padding:6px 10px;cursor:pointer;color:var(--ink,#5b3a5e)}',
    '.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px}',
    '.lp-cell{position:relative;border:3px solid var(--ink,#5b3a5e);border-radius:16px;background:#ffe066;padding:8px 8px 10px;cursor:pointer;text-align:left;',
    'font-family:var(--font,sans-serif);color:var(--ink,#5b3a5e);box-shadow:0 4px 0 var(--ink,#5b3a5e);min-height:92px}',
    '.lp-cell:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#5b3a5e)}',
    '.lp-cell.cleared{background:#b2f2bb}.lp-cell.locked{background:#dee2e6;opacity:.65;cursor:not-allowed;box-shadow:none}',
    '.lp-num{font:700 22px var(--font,sans-serif)}.lp-name{font-size:12px;font-weight:600;line-height:1.15;margin-top:2px}',
    '.lp-meta{font-size:11px;opacity:.8;margin-top:4px}.lp-lock{position:absolute;right:8px;top:6px;font-size:18px}',
    '.lp-foot{margin-top:10px;font-size:12px;opacity:.7;text-align:center}',
  ].join('');
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'levelPicker'; el.className = 'lp-wrap hidden';
  el.innerHTML = '<div class=\"lp-card\"><div class=\"lp-head\"><button id=\"lpBack\" class=\"lp-back\">← Back</button>' +
    '<div id=\"lpTitle\" class=\"lp-title\"></div><button id=\"lpShop\" class=\"lp-shop\">🛍️ 🪙 <span id=\"lpCoins\">0</span></button></div>' +
    '<div id=\"lpGrid\" class=\"lp-grid\"></div><div class=\"lp-foot\">Beat a level to unlock the next one. Progress &amp; coins are saved in your browser.</div></div>';
  document.body.appendChild(el);
  $('lpBack').onclick = () => { show('levelPicker', false); show('lobby', true); };
  $('lpShop').onclick = () => openShop();
}

let lpPage = 0;
const LP_PER = 10;
function showPicker(mode) {
  buildPicker();
  const meta = levelMeta(mode), un = Save.unlocked(mode);
  const pages = Math.max(1, Math.ceil(meta.length / LP_PER));
  setText('lpTitle', mode === 'solo' ? '🌟 SOLO HARDCORE — ' + meta.length + ' levels' : mode === 'party' ? '🐰 PARTY STACKING — ' + meta.length + ' levels' : '🤝 CO-OP CHAOS — ' + meta.length + ' levels');
  setText('lpCoins', Save.coins());
  let nav = $('lpNav');
  if (!nav) {
    nav = document.createElement('div'); nav.id = 'lpNav'; nav.className = 'lp-nav';
    $('lpGrid').parentNode.insertBefore(nav, $('lpGrid'));
  }
  const draw = () => {
    lpPage = clamp(lpPage, 0, pages - 1);
    nav.innerHTML = '';
    const mk = (txt, fn, dis, cls) => { const b = document.createElement('button'); b.className = 'lp-pg ' + (cls || ''); b.textContent = txt; b.disabled = !!dis; b.onclick = fn; return b; };
    nav.appendChild(mk('‹', () => { lpPage--; draw(); }, lpPage === 0));
    for (let p = 0; p < pages; p++) nav.appendChild(mk(String(p * LP_PER + 1) + '-' + Math.min(meta.length, (p + 1) * LP_PER), () => { lpPage = p; draw(); }, false, p === lpPage ? 'on' : ''));
    nav.appendChild(mk('›', () => { lpPage++; draw(); }, lpPage === pages - 1));
    const grid = $('lpGrid'); grid.innerHTML = '';
    for (let i = lpPage * LP_PER; i < Math.min(meta.length, (lpPage + 1) * LP_PER); i++) {
      const m = meta[i], locked = i + 1 > un, cleared = Save.cleared(mode, i), best = Save.best(mode, i);
      const b = document.createElement('button');
      b.className = 'lp-cell' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '') + (m.tower ? ' tower' : '');
      b.innerHTML = '<div class="lp-num"></div><div class="lp-name"></div><div class="lp-meta"></div>' + (locked ? '<div class="lp-lock">🔒</div>' : cleared ? '<div class="lp-lock">⭐</div>' : '');
      b.children[0].textContent = String(i + 1) + (m.tower ? ' 🗼' : '');
      b.children[1].textContent = m.name;
      b.children[2].textContent = locked ? 'Beat level ' + i + ' first' : (best ? '⏱ ' + best.toFixed(1) + 's' : 'Not cleared') + ' · 🪙 ' + Save.coinsGot(mode, i).length + '/' + m.coins;
      b.onclick = () => { if (locked) { toast('🔒 Beat level ' + i + ' to unlock!'); return; } Snd.init(); show('levelPicker', false); beginGame(mode, i); };
      grid.appendChild(b);
    }
    const wrap = $('levelPicker'); if (wrap && wrap.scrollTo) wrap.scrollTo({ top: 0, behavior: 'smooth' });
  };
  let first = 0; while (first < meta.length - 1 && first + 1 <= un && Save.cleared(mode, first)) first++;
  lpPage = Math.floor(Math.min(first, un - 1 < 0 ? 0 : un - 1) / LP_PER);
  draw();
  show('lobby', false); show('levelPicker', true);
}

function beginGame(mode, idx) {
  G.mode = mode;
  G.inGame = true;
  show('lobby', false); show('levelPicker', false); show('hud', true); show('final', false);
  show('roomChip', mode !== 'solo'); show('botBtn', false);
  show('touch', isTouchDevice);
  const pb = $('ping'); if (pb) { pb.textContent = mode !== 'solo' ? '…' : 'Local'; pb.className = 'ping good'; }
  if (mode === 'solo') { G.myslot = 0; G.code = 'SOLO'; G.remotes.clear(); G.hostSlot = 0; }
  G.skins[G.myslot] = Save.equipped();
  G.names[G.myslot] = G.myName;
  resize();
  loadLevel(idx);
  updatePlayerList();
  refreshCoinUI();
}

function startSolo() { Snd.init(); G.mode = 'solo'; showPicker('solo'); }

function leaveToMenu(silent) {
  if (!silent && !confirm('Exit to main menu?')) return;
  if (isNet()) { location.href = location.pathname; return; }
  G.inGame = false; G.L = null; G.me = null;
  show('hud', false); show('touch', false); show('final', false); show('levelPicker', false); show('lobby', true);
  show('modeSelectView', true); show('coopLobbyView', false);
}

function setMsg(t) { setText('lobbyMsg', t || ''); }
function myNameValue() {
  const e = $('nameInput'); const v = (e && e.value.trim()) || Store.get('tb_name', '') || 'Bunny';
  Store.set('tb_name', v); return v.slice(0, 12);
}

function enterCoop(res, creator) {
  G.mode = (res.mode === 'party' || (!res.mode && G.lobbyMode === 'party')) ? 'party' : 'coop'; G.myslot = res.slot; G.code = res.code; G.myName = myNameValue();
  G.remotes.clear(); G.hostSlot = res.host !== undefined ? res.host : res.slot;
  if (res.pn) PARTY_N = Math.max(1, Math.min(10, res.pn | 0));
  setText('roomCode', res.code);
  try { history.replaceState(null, '', location.pathname + '?room=' + res.code); } catch (e) {}
  beginGame(G.mode, creator ? 0 : (res.lv | 0));
  if (creator) netEv({ t: 'lvl', n: 0 });
  toast('Room ' + res.code + ' - share the link!');
}

function doCreate() {
  Snd.init();
  const s = ensureSocket(); if (!s) { setMsg('Cannot reach the game server.'); return; }
  setMsg('Creating room…');
  s.emit('create', { name: myNameValue(), skin: Save.equipped(), mode: G.lobbyMode === 'party' ? 'party' : 'coop' }, (res) => {
    if (!res || !res.ok) { setMsg((res && res.error) || 'Could not create room.'); return; }
    enterCoop(res, true);
  });
}

function doJoin(codeArg) {
  Snd.init();
  const code = String(codeArg || ($('codeInput') && $('codeInput').value) || '').trim().toUpperCase();
  if (code.length !== 4) { setMsg('Enter the 4-letter room code.'); return; }
  const s = ensureSocket(); if (!s) { setMsg('Cannot reach the game server.'); return; }
  setMsg('Joining…');
  s.emit('join', { code, name: myNameValue(), skin: Save.equipped() }, (res) => {
    if (!res || !res.ok) { setMsg((res && res.error) || 'Could not join.'); return; }
    enterCoop(res, false);
  });
}

$('btnSolo').onclick = startSolo;
$('btnCoop').onclick = () => { Snd.init(); G.lobbyMode = 'coop'; setText('createBtn', '✨ Create Co-op Room'); show('modeSelectView', false); show('coopLobbyView', true); const n = $('nameInput'); if (n && !n.value) n.value = Store.get('tb_name', ''); };
$('btnBackToModes').onclick = () => { show('coopLobbyView', false); show('modeSelectView', true); setMsg(''); };
$('createBtn').onclick = doCreate;
$('joinBtn').onclick = () => doJoin();
$('codeInput').addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
$('codeInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') doJoin(); });
$('menuBtn').onclick = () => leaveToMenu(false);
$('copyBtn').onclick = () => {
  const link = location.origin + location.pathname + '?room=' + G.code;
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(() => toast('Invite link copied! 🔗'));
  else window.prompt('Copy invite link:', link);
};
$('restartBtn').onclick = () => { changeLevel(G.lvIdx < 0 ? -1 : G.lvIdx); $('restartBtn').blur(); };
$('muteBtn').onclick = () => { Snd.init(); $('muteBtn').textContent = Snd.toggleMute() ? '🔇' : '🔊'; $('muteBtn').blur(); };
$('muteBtn').textContent = Snd.isMuted() ? '🔇' : '🔊';
$('fsBtn').onclick = () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
  else (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
  $('fsBtn').blur();
};
$('lvSelect').onchange = (e) => { changeLevel(+e.target.value); e.target.blur(); };

function restartLevel() {
  if (G.lvIdx < 0 && G.customData) loadLevel(-1, JSON.parse(G.customData));
  else loadLevel(Math.max(0, G.lvIdx));
}

function changeLevel(n) {
  if (!G.inGame) return;
  if (isNet() && !isHostSlot()) { toast('⚠️ Chỉ Chủ phòng mới có quyền Reset!'); rebuildLevelSelect(); return; }
  if (n < 0) { restartLevel(); if (isNet()) netEv({ t: 'restart' }); return; }
  if (n + 1 > Save.unlocked(G.mode)) { toast('🔒 Locked - beat the previous level first'); rebuildLevelSelect(); return; }
  loadLevel(n);                                   // host builds first (locks party N) ...
  if (isNet()) netEv({ t: 'lvl', n });            // ... then tells everybody, event carries pn
}


const kb = { l: false, r: false, j: false, b: false, d: false }, tc = { l: false, r: false, j: false, b: false, d: false };
function recompute() { input.l = kb.l || tc.l; input.r = kb.r || tc.r; input.j = kb.j || tc.j; input.b = kb.b || tc.b; input.d = kb.d || tc.d; }
const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'j', KeyW: 'j', Space: 'j', KeyE: 'b', ArrowDown: 'd', KeyS: 'd' };
window.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  Snd.init();
  if (e.ctrlKey && e.shiftKey && e.altKey && e.code === 'KeyA') { e.preventDefault(); openAdminEntry(); return; }
  if (BUFF_KEYS[e.code] && G.inGame) { if (!e.repeat && G.me) useBuff(BUFF_KEYS[e.code]); e.preventDefault(); return; }
  if (e.code === 'Tab' && G.inGame && G.mode === 'party') { G.teamView = true; e.preventDefault(); return; }
  const k = KEYMAP[e.code];
  if (k && G.inGame) { kb[k] = true; recompute(); e.preventDefault(); }
  else if (e.code === 'KeyR' && !e.repeat && G.inGame) changeLevel(G.lvIdx < 0 ? -1 : G.lvIdx);
  else if (e.code === 'KeyM' && !e.repeat) $('muteBtn').click();
});
window.addEventListener('keyup', (e) => { if (e.code === 'Tab') { G.teamView = false; if (G.inGame && G.mode === 'party') e.preventDefault(); } const k = KEYMAP[e.code]; if (k) { kb[k] = false; recompute(); } });
window.addEventListener('blur', () => { G.teamView = false; kb.l = kb.r = kb.j = kb.b = kb.d = false; tc.l = tc.r = tc.j = tc.b = tc.d = false; recompute(); });

const touchBtns = [...document.querySelectorAll('.tbtn')];
let touchBuffDown = new Set();
function updateTouch(touches) {
  const act = { l: false, r: false, j: false, b: false, tv: false };
  const cur = new Set();
  for (const t of touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const b = el && el.closest ? el.closest('.tbtn') : null;
    if (b) { if (b.dataset.buff) cur.add(b.dataset.buff); else act[b.dataset.k] = true; }
  }
  touchBtns.forEach((b) => b.classList.toggle('down', b.dataset.buff ? cur.has(b.dataset.buff) : !!act[b.dataset.k]));
  cur.forEach((id) => { if (!touchBuffDown.has(id)) useBuff(id); });
  touchBuffDown = cur;
  tc.l = act.l; tc.r = act.r; tc.j = act.j; tc.b = act.b;
  G.teamView = !!act.tv && G.mode === 'party';
  const rbn = $('radarBtn'); if (rbn) rbn.classList.toggle('down', !!act.tv);
  recompute();
}

const touchEl = $('touch');
['touchstart', 'touchmove'].forEach((n) => touchEl.addEventListener(n, (e) => { e.preventDefault(); Snd.init(); updateTouch(e.touches); }, { passive: false }));
['touchend', 'touchcancel'].forEach((n) => touchEl.addEventListener(n, (e) => { e.preventDefault(); updateTouch(e.touches); }, { passive: false }));
touchBtns.forEach((btn) => {
  if (btn.dataset.buff) {
    btn.addEventListener('mousedown', (e) => { e.preventDefault(); useBuff(btn.dataset.buff); btn.classList.add('down'); });
    ['mouseup', 'mouseleave'].forEach((n) => btn.addEventListener(n, () => btn.classList.remove('down')));
    return;
  }
  const k = btn.dataset.k;
  btn.addEventListener('mousedown', (e) => { e.preventDefault(); tc[k] = true; btn.classList.add('down'); recompute(); });
  ['mouseup', 'mouseleave'].forEach((n) => btn.addEventListener(n, () => { tc[k] = false; btn.classList.remove('down'); recompute(); }));
});
(function bindRadarMouse() {   // desktop click-and-hold on the dynamic radar button
  document.addEventListener('mousedown', (e) => { if (e.target && e.target.id === 'radarBtn') { G.teamView = true; e.preventDefault(); } });
  document.addEventListener('mouseup', () => { G.teamView = false; });
})();

['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => document.addEventListener(n, (e) => e.preventDefault()));
document.addEventListener('touchmove', (e) => {
  if (!G.inGame) return;
  const t = e.target;
  if (t && t.closest && (t.closest('#shopModal') || t.closest('#levelPicker'))) return;
  e.preventDefault();
}, { passive: false });
if (isTouchDevice) document.body.classList.add('is-touch');

// ============================================================================
// CAMERA + RENDERING
// ============================================================================
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cw = window.innerWidth; ch = window.innerHeight;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

function baseScale() { return Math.min(ch / VIEW_H, cw / VIEW_MIN_W); }

function updateCamera(dt) {
  const L = G.L, me = G.me, cam = G.cam;
  if (!L || !me) return;
  const sc0 = baseScale();
  const mp = ipos(me);
  let fx = mp.x + PW / 2, fy = mp.y + PH / 2, spread = 0;
  const tv = G.mode === 'party' && !!G.teamView && G.remotes.size > 0;
  // CO-OP keeps the old "pull towards the group" camera. PARTY is 100% self-follow so the front runner is never held back.
  if (G.mode === 'coop' && G.remotes.size) {
    let sx = 0, sy = 0, n = 0;
    for (const r of G.remotes.values()) { if (r.dead) continue; const rp = ipos(r); sx += rp.x + PW / 2; sy += rp.y + PH / 2; n++; spread = Math.max(spread, Math.hypot(rp.x - mp.x, rp.y - mp.y)); }
    if (n) { fx = lerp(fx, sx / n, 0.35); fy = lerp(fy, sy / n, 0.35); }
  }
  let tz = 1;
  if (tv) {                                            // hold Tab / radar button: fit the whole squad on screen
    let x0 = mp.x, x1 = mp.x + PW, y0 = mp.y, y1 = mp.y + PH;
    for (const r of G.remotes.values()) { if (r.dead) continue; const rp = ipos(r); x0 = Math.min(x0, rp.x); x1 = Math.max(x1, rp.x + PW); y0 = Math.min(y0, rp.y); y1 = Math.max(y1, rp.y + PH); }
    tz = clamp(Math.min(cw / (x1 - x0 + 420), ch / (y1 - y0 + 360)) / sc0, 0.28, 1);
    fx = (x0 + x1) / 2; fy = (y0 + y1) / 2;
  } else if (G.mode === 'coop' && G.remotes.size) tz = clamp(1 - (spread - 420) / 1700, 0.78, 1);
  cam.z += (tz - cam.z) * (1 - Math.exp(-dt * (tv ? 6 : 2.5)));
  const sc = sc0 * cam.z;
  const vw = cw / sc, vh = ch / sc;
  const look = clamp(me.vx * 14, -90, 90);
  let tx, ty;
  if (tv) { tx = fx - vw / 2; ty = fy - vh / 2; }
  else {
    tx = fx + look - vw / 2;
    ty = fy - vh * 0.56;
    tx = clamp(tx, mp.x + PW / 2 - vw * 0.78, mp.x + PW / 2 - vw * 0.22);
    ty = clamp(ty, mp.y + PH / 2 - vh * 0.85, mp.y + PH / 2 - vh * 0.15);
  }
  tx = L.w <= vw ? (L.w - vw) / 2 : clamp(tx, 0, L.w - vw);
  ty = L.h <= vh ? (L.h - vh) / 2 : clamp(ty, 0, L.h - vh);
  if (cam.snap) { cam.x = tx; cam.y = ty; cam.snap = false; }
  else {
    const kx = tv ? 8 : 5.5, ky = tv ? 8 : 4.2;
    cam.x += (tx - cam.x) * (1 - Math.exp(-dt * kx));
    cam.y += (ty - cam.y) * (1 - Math.exp(-dt * ky));
  }
  cam.sc = sc; cam.vw = vw; cam.vh = vh;
}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

const clouds = Array.from({ length: 14 }, (_, i) => ({ x: i * 420 + rnd(0, 200), y: rnd(40, 330), s: rnd(0.7, 1.5), f: rnd(0.08, 0.25) }));
function drawCloud(x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, 6.3); ctx.arc(x + 30 * s, y - 12 * s, 32 * s, 0, 6.3); ctx.arc(x + 66 * s, y, 26 * s, 0, 6.3);
  ctx.rect(x, y - 2 * s, 66 * s, 26 * s); ctx.fill();
}

function hsl(h, s, l, a) { return 'hsla(' + (((h % 360) + 360) % 360) + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')'; }

const SKY_THEMES = ['meadow', 'sunset', 'aurora', 'galaxy'];
const SKY_CFG = {
  meadow: { stops: [[0, '#5cb8ff'], [0.55, '#b4e4ff'], [1, '#f3fcff']], hills: ['#c4ebc4', '#9ed9a6', '#7cc58a'], mote: 'rgba(255,255,255,.6)' },
  sunset: { stops: [[0, '#2a0f55'], [0.32, '#7b2d8e'], [0.58, '#ff5e9c'], [0.8, '#ff9a5a'], [1, '#ffd27a']], hills: ['#7a2f86', '#531f6b', '#341250'], mote: 'rgba(255,170,220,.6)' },
  aurora: { stops: [[0, '#020a1e'], [0.6, '#06304a'], [1, '#0b5a63']], hills: ['#0f4458', '#0a3044', '#06202f'], mote: 'rgba(140,255,230,.55)' },
  galaxy: { stops: [[0, '#030012'], [0.55, '#12063a'], [1, '#2c0f60']], hills: ['#221250', '#170c3a', '#0d0624'], mote: 'rgba(200,170,255,.6)' },
  ember:  { stops: [[0, '#1a0606'], [0.4, '#5c1408'], [0.75, '#c2410c'], [1, '#ffb347']], hills: ['#5a1d10', '#3b110a', '#220806'], mote: 'rgba(255,170,80,.7)' },
  frost:  { stops: [[0, '#0b2a4a'], [0.5, '#2d6a9f'], [1, '#d8f3ff']], hills: ['#a9d6ee', '#7fb7d9', '#5d98c0'], mote: 'rgba(255,255,255,.8)' },
  cosmic: { stops: [[0, '#02010d'], [0.5, '#150a42'], [1, '#3b1478']], hills: ['#2a1668', '#1c0e48', '#0f0730'], mote: 'rgba(255,230,160,.7)' },
  sakura: { stops: [[0, '#2b1442'], [0.45, '#b0488a'], [0.78, '#ff9fb0'], [1, '#ffd9b8']], hills: ['#8a3a6a', '#6a2a58', '#471a42'], mote: 'rgba(255,200,220,.8)' },
  ocean:  { stops: [[0, '#0aa6c9'], [0.5, '#0a63a8'], [1, '#062f63']], hills: ['#0b4a7a', '#073a66', '#052a4d'], mote: 'rgba(200,245,255,.7)' },
  storm:  { stops: [[0, '#0c0f1c'], [0.5, '#232b46'], [1, '#4a5678']], hills: ['#2a3350', '#1d2540', '#121830'], mote: 'rgba(180,200,255,.5)' },
  neon:   { stops: [[0, '#07021a'], [0.5, '#2b0b5e'], [1, '#d02a9a']], hills: ['#3a0f78', '#240a52', '#14052e'], mote: 'rgba(255,120,220,.7)' },
};
const effTheme = (L) => (curEnv ? curEnv.sky : (L.skyTheme || 'meadow'));
const STARS = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: 0.5 + Math.random() * 1.5, ph: Math.random() * 6.28, sp: 1 + Math.random() * 3, par: 0.01 + Math.random() * 0.05 }));
const hash1 = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

function drawStars(cam, T, strength) {
  for (const st of STARS) {
    const tw = 0.45 + 0.55 * Math.sin(T * st.sp + st.ph);
    const x = (((st.x * cw - cam.x * st.par) % cw) + cw) % cw, y = st.y * ch;
    ctx.globalAlpha = clamp(tw * strength, 0, 1);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, st.r, 0, 6.3); ctx.fill();
    if (st.r > 1.5) { ctx.fillRect(x - 3.5, y - 0.4, 7, 0.8); ctx.fillRect(x - 0.4, y - 3.5, 0.8, 7); }
  }
  ctx.globalAlpha = 1;
}

function drawShootingStars(T) {
  for (let j = 0; j < 2; j++) {
    const per = 4.5 + j * 2.3, tt = T + j * 3.1, k = Math.floor(tt / per), ph = tt - k * per, dur = 0.95;
    if (ph > dur || hash1(k + j * 97) < 0.3) continue;
    const u = ph / dur, sx = (0.25 + hash1(k * 3.7 + j) * 0.7) * cw, sy = (0.05 + hash1(k * 1.9 + j) * 0.3) * ch;
    const hx = sx - u * cw * 0.4, hy = sy + u * cw * 0.2, len = 130;
    const g = ctx.createLinearGradient(hx, hy, hx + len * 0.9, hy - len * 0.45);
    g.addColorStop(0, 'rgba(255,255,255,' + (1 - u).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + len * 0.9, hy - len * 0.45); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (1 - u).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, 6.3); ctx.fill();
  }
}

function drawSkyCloudLayer(L, cam, f, yBase, scale, col, count) {
  ctx.fillStyle = col;
  for (let i = 0; i < count; i++) {
    const c = clouds[(i * 3 + Math.round(f * 10)) % clouds.length];
    const span = L.w * f + cw + 700;
    const x = ((c.x * 1.3 + i * 531 - cam.x * f + G.lt * (4 + f * 30)) % span + span) % span - 250;
    drawCloud(x, yBase + (c.y % 90) * cam.sc * 0.5 + i * 7, c.s * scale * cam.sc);
  }
}

function drawSky(L, cam) {
  const theme = effTheme(L), cfg = SKY_CFG[theme], T = G.lt;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  cfg.stops.forEach((cs) => g.addColorStop(cs[0], cs[1]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (theme === 'meadow') {
    const sx = cw * 0.8 - cam.x * 0.012, sy = ch * 0.14;
    const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, ch * 0.6);
    rg.addColorStop(0, 'rgba(255,252,215,.95)'); rg.addColorStop(0.12, 'rgba(255,240,180,.55)'); rg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a1 = 1.75 + i * 0.17 + Math.sin(T * 0.25 + i) * 0.03, a2 = a1 + 0.07, len = ch * 1.5;
      const rgx = ctx.createLinearGradient(sx, sy, sx + Math.cos(a1) * len, sy + Math.sin(a1) * len);
      const al = 0.1 + 0.07 * Math.sin(T * 0.5 + i * 1.3);
      rgx.addColorStop(0, 'rgba(255,250,200,' + al.toFixed(3) + ')'); rgx.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = rgx; ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a1) * len, sy + Math.sin(a1) * len); ctx.lineTo(sx + Math.cos(a2) * len, sy + Math.sin(a2) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    drawSkyCloudLayer(L, cam, 0.06, ch * 0.08, 1.25, 'rgba(255,255,255,.55)', 4);
    drawSkyCloudLayer(L, cam, 0.16, ch * 0.2, 0.95, 'rgba(255,255,255,.8)', 5);
  } else if (theme === 'sunset') {
    const cx0 = cw * 0.5 - cam.x * 0.01, hy = ch * 0.64, r = Math.min(cw, ch) * 0.3;
    const glow = ctx.createRadialGradient(cx0, hy - r * 0.2, r * 0.4, cx0, hy - r * 0.2, r * 2.2);
    glow.addColorStop(0, 'rgba(255,90,170,.5)'); glow.addColorStop(1, 'rgba(255,90,170,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, cw, ch);
    ctx.save(); ctx.beginPath(); ctx.arc(cx0, hy - r * 0.35, r, 0, 6.3); ctx.clip();
    const sg = ctx.createLinearGradient(0, hy - r * 1.35, 0, hy + r * 0.65);
    sg.addColorStop(0, '#fff27a'); sg.addColorStop(0.5, '#ff9a4a'); sg.addColorStop(1, '#ff2a8a');
    ctx.fillStyle = sg; ctx.fillRect(cx0 - r, hy - r * 1.35, r * 2, r * 1.0);
    let yy = hy - r * 0.35, th = r * 0.2;
    for (let k = 0; k < 7; k++) { ctx.fillRect(cx0 - r, yy, r * 2, th); yy += th + r * (0.04 + k * 0.025); th *= 0.8; }
    ctx.restore();
    drawSkyCloudLayer(L, cam, 0.05, ch * 0.1, 1.4, 'rgba(255,130,200,.28)', 4);
    drawSkyCloudLayer(L, cam, 0.12, ch * 0.24, 1.1, 'rgba(255,160,210,.38)', 5);
    drawSkyCloudLayer(L, cam, 0.22, ch * 0.4, 0.9, 'rgba(255,200,230,.45)', 4);
  } else if (SKY_LEGEND[theme]) {
    drawLegendSky(theme, cam, T);
  } else {
    drawStars(cam, T, theme === 'galaxy' ? 1 : 0.7);
    if (theme === 'galaxy') {
      const neb = [[0.25, 0.3, 'rgba(150,60,255,.35)', 0.5], [0.7, 0.45, 'rgba(60,120,255,.3)', 0.55], [0.5, 0.15, 'rgba(255,80,200,.18)', 0.4]];
      neb.forEach((n, i) => {
        const nx = (((n[0] * cw - cam.x * 0.02 + Math.sin(T * 0.05 + i) * 40) % (cw * 1.4)) + cw * 1.4) % (cw * 1.4) - cw * 0.2, ny = n[1] * ch + Math.cos(T * 0.04 + i) * 20, nr = Math.max(cw, ch) * n[3];
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        ng.addColorStop(0, n[2]); ng.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ng; ctx.fillRect(0, 0, cw, ch);
      });
      drawShootingStars(T);
    } else {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let rb = 0; rb < 3; rb++) {
        const base = ch * (0.16 + rb * 0.09), top = ch * 0.05;
        const ag = ctx.createLinearGradient(0, top, 0, ch * 0.62);
        const c1 = rb === 1 ? '80,200,255' : '60,255,170';
        ag.addColorStop(0, 'rgba(' + c1 + ',0)'); ag.addColorStop(0.45, 'rgba(' + c1 + ',' + (0.42 - rb * 0.07).toFixed(2) + ')'); ag.addColorStop(1, 'rgba(' + c1 + ',0)');
        ctx.fillStyle = ag; ctx.beginPath();
        for (let x = 0; x <= cw + 12; x += 12) {
          const y = base + Math.sin(x * 0.007 + T * 0.45 + rb * 1.7 - cam.x * 0.0006) * ch * 0.06 + Math.sin(x * 0.019 - T * 0.8 + rb) * ch * 0.018;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        for (let x = cw + 12; x >= 0; x -= 12) {
          const y = base + ch * (0.22 + 0.05 * Math.sin(x * 0.01 + T * 0.3 + rb)) + Math.sin(x * 0.007 + T * 0.45 + rb * 1.7 - cam.x * 0.0006) * ch * 0.06;
          ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawBackground(L, cam) {
  if (!L.skyTheme) L.skyTheme = 'meadow';
  drawSky(L, cam);
  const cfg = SKY_CFG[effTheme(L)];
  for (let layer = 0; layer < 3; layer++) {
    const f = 0.12 + layer * 0.14, base = ch * (0.72 + layer * 0.08) - (cam.y * (0.1 + layer * 0.05)) * cam.sc;
    ctx.fillStyle = cfg.hills[layer];
    ctx.beginPath(); ctx.moveTo(0, ch);
    for (let sx = 0; sx <= cw + 40; sx += 24) {
      const wx = sx / cam.sc + cam.x * f;
      ctx.lineTo(sx, base - (Math.sin(wx * 0.004 + layer * 2) * 40 + Math.sin(wx * 0.011 + layer) * 18 + 60 - layer * 14) * cam.sc * 0.8);
    }
    ctx.lineTo(cw, ch); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = cfg.mote;
  for (let i = 0; i < 18; i++) {
    const mx = (((i * 377 + G.lt * (8 + (i % 4) * 5) - cam.x * 0.3) % cw) + cw) % cw;
    const my = (i * 131) % ch + Math.sin(G.lt * 0.8 + i) * 12;
    ctx.beginPath(); ctx.arc(mx, my, 1.5 + (i % 3), 0, 6.3); ctx.fill();
  }
}

function drawSolid(L, s) {
  if (s.ice) { drawIceSolid(L, s); return; }
  const x = s[0], y = s[1], w = s[2], h = s[3];
  const sh = curEnv ? curEnv.solidHue : L.hue + 25, gh = curEnv ? curEnv.grassHue : 105;
  const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
  gr.addColorStop(0, hsl(sh, 38, 58)); gr.addColorStop(1, hsl(sh, 38, 34));
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  for (let px = x + 18; px < x + w - 10; px += 56) ctx.fillRect(px, y + 30 + ((px * 7) % 40), 14, 5);
  ctx.fillStyle = 'rgba(0,0,0,.10)';
  for (let px = x + 40; px < x + w - 20; px += 90) ctx.fillRect(px, y + 70 + ((px * 5) % 60), 22, 6);
  ctx.fillStyle = hsl(gh, 52, 40); rr(x - 3, y - 5, w + 6, 19, 7); ctx.fill();
  ctx.fillStyle = hsl(gh, 60, 56); rr(x - 3, y - 5, w + 6, 9, 5); ctx.fill();
  ctx.fillStyle = hsl(gh, 62, 50);
  for (let px = x + 6; px < x + w - 4; px += 22) {
    const bh = 5 + ((px * 13) % 7);
    ctx.beginPath(); ctx.moveTo(px, y - 4); ctx.lineTo(px + 3, y - 4 - bh); ctx.lineTo(px + 6, y - 4); ctx.fill();
  }
  if (h > 100) {
    for (let px = x + 40; px < x + w - 20; px += 170 + ((px * 7) % 90)) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, y - 9, 3.2, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(px, y - 9, 1.5, 0, 6.3); ctx.fill();
    }
  }
}

function drawCrumble(c) {
  if (c.st === 2) {
    ctx.save(); ctx.globalAlpha = clamp(1 - c.fy / 260, 0, 1); ctx.translate(c.x + c.w / 2, c.y + c.fy);
    ctx.rotate(c.fy * 0.004); ctx.fillStyle = '#a1887f'; ctx.fillRect(-c.w / 2, 0, c.w, c.h); ctx.restore(); return;
  }
  const sh = c.st === 1 ? Math.sin(G.lt * 90) * 3 : 0;
  const x = c.x + sh, y = c.y + (c.st === 1 ? Math.abs(Math.sin(G.lt * 70)) * 1.5 : 0);
  ctx.fillStyle = c.st === 1 ? '#c58b6a' : '#d7b899'; rr(x, y, c.w, c.h, 6); ctx.fill();
  ctx.fillStyle = '#8d6e63'; ctx.fillRect(x + 6, y + c.h - 5, c.w - 12, 5);
  ctx.strokeStyle = 'rgba(93,64,55,.75)'; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(x + c.w * 0.3, y + 1); ctx.lineTo(x + c.w * 0.38, y + c.h * 0.55); ctx.lineTo(x + c.w * 0.3, y + c.h);
  ctx.moveTo(x + c.w * 0.68, y + 1); ctx.lineTo(x + c.w * 0.6, y + c.h * 0.5); ctx.lineTo(x + c.w * 0.7, y + c.h); ctx.stroke();
  ctx.fillStyle = '#7bc96f'; rr(x - 1, y - 3, c.w + 2, 7, 4); ctx.fill();
}

function drawSpikes(s) {
  if (s.hid) return;
  if (s.bt !== undefined) {                                    // bait spikes erupt from the floor
    const k = clamp(s.ph, 0, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(s.x - 2, s.y - 4, s.w + 4, s.h + 4); ctx.clip();
    ctx.translate(0, s.h * (1 - k) + 1);
    drawSpikesRaw(s); ctx.restore(); return;
  }
  drawSpikesRaw(s);
}

function drawSpikesRaw(s) {
  const n = Math.max(1, Math.round(s.w / 22)), tw = s.w / n;
  ctx.fillStyle = '#cfd8dc'; ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const x = s.x + i * tw;
    ctx.beginPath();
    if (s.dir === 'up') { ctx.moveTo(x, s.y + s.h); ctx.lineTo(x + tw / 2, s.y); ctx.lineTo(x + tw, s.y + s.h); }
    else { ctx.moveTo(x, s.y); ctx.lineTo(x + tw / 2, s.y + s.h); ctx.lineTo(x + tw, s.y); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (s.dir === 'down') { ctx.fillStyle = '#546e7a'; ctx.fillRect(s.x - 2, s.y - 6, s.w + 4, 8); }
}

function drawSpring(s) {
  const sq = s.sq, h = s.h * (1 - 0.5 * sq), y = s.y + s.h - h;
  ctx.fillStyle = '#ffd54f'; rr(s.x, y, s.w, 6, 3); ctx.fill();
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i < 4; i++) { const yy = y + 6 + (h - 6) * (i / 3); ctx.moveTo(s.x + 8, yy); ctx.lineTo(s.x + s.w - 8, yy + (i % 2 ? -2 : 2)); }
  ctx.stroke();
  ctx.fillStyle = '#e65100'; ctx.fillRect(s.x + 4, s.y + s.h - 3, s.w - 8, 3);
}

function drawCrusher(c, cb) {
  const sx = c.shake ? Math.sin(G.lt * 120) * 3 : 0;
  ctx.strokeStyle = '#78909c'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(c.x + c.w / 2 + sx, c.top); ctx.lineTo(c.x + c.w / 2 + sx, cb - c.h); ctx.stroke();
  const x = c.x + sx, y = cb - c.h;
  ctx.fillStyle = c.shake ? '#e57373' : '#90a4ae'; rr(x, y, c.w, c.h - 18, 8); ctx.fill();
  ctx.strokeStyle = '#455a64'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#cfd8dc';
  const n = 4, tw = c.w / n;
  for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.moveTo(x + i * tw, y + c.h - 18); ctx.lineTo(x + i * tw + tw / 2, y + c.h); ctx.lineTo(x + (i + 1) * tw, y + c.h - 18); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(x + c.w * 0.3, y + 32, 6, 0, 6.3); ctx.arc(x + c.w * 0.7, y + 32, 6, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#263238'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + c.w * 0.2, y + 22); ctx.lineTo(x + c.w * 0.4, y + 27); ctx.moveTo(x + c.w * 0.8, y + 22); ctx.lineTo(x + c.w * 0.6, y + 27); ctx.stroke();
}

function drawBoulder(b, bcx, brot) {
  ctx.save(); ctx.translate(bcx, b.y - b.r); ctx.rotate(brot);
  ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath(); ctx.arc(-b.r * 0.35, -b.r * 0.25, b.r * 0.25, 0, 6.3); ctx.arc(b.r * 0.3, b.r * 0.3, b.r * 0.2, 0, 6.3); ctx.arc(b.r * 0.2, -b.r * 0.4, b.r * 0.14, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#3e2723'; ctx.beginPath(); ctx.moveTo(-b.r * 0.6, b.r * 0.1); ctx.lineTo(0, -b.r * 0.1); ctx.lineTo(b.r * 0.5, b.r * 0.55); ctx.stroke();
  ctx.restore();
}



// ============================================================================
// v9 & v10 ENGINE: smart pause, boutique shield, Void Maw rewinding, hoisting,
//                 stalactites, meteors, ice, wall-jump, juicy art
// ============================================================================
const MODAL_IDS = ['shopModal', 'settingsModal', 'nickModal', 'syncModal', 'adminModal'];
function modalOpen() {
  for (let i = 0; i < MODAL_IDS.length; i++) { const e = document.getElementById(MODAL_IDS[i]); if (e && !e.classList.contains('hidden')) return true; }
  return false;
}

function rewindHunters(P) {
  const L = G.L;
  for (const s of L.sweepers) {
    const tgt = P.cp.x - 320;
    if (s.cx > tgt) { s.x = tgt; s.cx = tgt; s.delay = G.lt + 2.5; }
  }
  for (const r of (L.risers || [])) {
    if (r.y0 === undefined) r.y0 = r.y;
    const tgt = Math.min(r.y0, P.cp.y + PH + 380);
    if (r.cy < tgt) { r.y = tgt; r.cy = tgt; r.delay = G.lt + 2.5; }
  }
}

function groundBelow(x0, x1, y) {
  let best = (G.L.h || WORLD_H) + 200;
  for (const s of G.L.solids) if (s[0] < x1 && s[0] + s[2] > x0 && s[1] >= y - 2 && s[1] < best) best = s[1];
  return best;
}

function updateStalactites(bodies) {
  const L = G.L;
  for (const s of (L.stalactites || [])) {
    if (s.st === 0) {
      for (const b of bodies) {
        const cx = b.x + PW / 2;
        if (cx > s.x - 56 && cx < s.x + s.w + 56 && b.y > s.y + s.h * 0.5 && b.y < s.y + s.h + 520) { s.st = 1; s.t = 0.4; Snd.shake(); break; }
      }
    } else if (s.st === 1) {
      s.t -= STEP;
      if (Math.random() < 0.6) puff(s.x + rnd(-4, s.w + 4), s.y + s.h * 0.5, 1, '#bcaaa4', 0.5);
      if (s.t <= 0) { s.st = 2; s.vy = 2; s.fy = 0; if (s.gnd === undefined) s.gnd = groundBelow(s.x, s.x + s.w, s.y + s.h); }
    } else if (s.st === 2) {
      s.vy = Math.min(s.vy + 0.9, 20); s.fy += s.vy;
      if (s.y + s.h + s.fy >= s.gnd) {
        s.fy = Math.max(0, s.gnd - s.y - s.h); s.st = 3; s.t = 3.2;
        debris(s.x - 8, s.gnd - 8, s.w + 16, 8, 12, '#8d7b73'); puff(s.x + s.w / 2, s.gnd, 8, '#d7ccc8', 1.4);
        G.shake = Math.max(G.shake, 4); Snd.crumble();
      }
    } else { s.t -= STEP; if (s.t <= 0) { s.st = 0; s.fy = 0; s.vy = 0; if (s.dyn) s.gone = true; } }
  }
}

function meteorGeom(f, k) {
  const T = (f.gy - f.topY) / (f.vy * 60);
  const ix = f.x0 + hash1(k * 7.31 + f.id * 13.7) * (f.x1 - f.x0);
  return { sx: ix - f.vx * 60 * T, sy: f.topY, T, ix };
}
function meteorAt(f, lt) {
  const t = lt + f.off, k = Math.floor(t / f.period), age = t - k * f.period, g = meteorGeom(f, k);
  const a = Math.min(age, g.T);
  g.k = k; g.age = age; g.x = g.sx + f.vx * 60 * a; g.y = g.sy + f.vy * 60 * a; g.fly = age < g.T;
  return g;
}
function updateMeteors() {
  const cam = G.cam, mid = cam.x + (cam.vw || 800) / 2, rng = (cam.vw || 800) * 0.9;
  for (const f of (G.L.meteors || [])) {
    const m = meteorAt(f, G.lt);
    if (m.fly) {
      if (Math.abs(m.x - mid) < rng) {
        puff(m.x - f.vx * 5, m.y - f.vy * 5, 1, Math.random() < 0.5 ? '#ff9f43' : '#6d6d6d', 0.6);
        if (Math.random() < 0.5) sparkle(m.x - f.vx * 8, m.y - f.vy * 8, 1, 0.4, '#ffd43b');
      }
    } else if (f.exK !== m.k) {
      f.exK = m.k;
      if (m.age - m.T < 0.3) {
        debris(m.ix - 20, f.gy - 10, 40, 10, 14, '#ff8a3d'); puff(m.ix, f.gy - 6, 14, '#ffb74d', 2.2); sparkle(m.ix, f.gy - 14, 16, 2.2, '#ffd43b');
        if (Math.abs(m.ix - mid) < rng) { G.shake = Math.max(G.shake, 7); Snd.slam(); }
      }
    }
  }
}
function circleHitsRect(cx, cy, r, hx, hy, hw, hh) {
  return Math.hypot(cx - clamp(cx, hx, hx + hw), cy - clamp(cy, hy, hy + hh)) < r;
}

function hangingFriend(P) {
  let best = null, bd = 1e9;
  for (const r of G.remotes.values()) {
    if (r.dead || (r.onGround && !r.ropeOn) || r.y < P.y + 30) continue;
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    if (d > TETHER + 90 || d < TETHER * 0.5) continue;
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}
function doHoist(P, r) {
  netEv({ t: 'hoist', to: r.slot, s: P.slot });
  Snd.grab(); sparkle(P.x + PW / 2, P.y + PH * 0.4, 5, 0.8, '#fff3a0');
  for (let i = 1; i <= 3; i++) sparkle(lerp(P.x + PW / 2, r.x + PW / 2, i / 4), lerp(P.y + PH / 2, r.y + PH / 2, i / 4), 1, 0.3, '#ffe066');
  P.sq = 0.2;
}

function star4(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
  ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r); ctx.fill(); ctx.restore();
}

function drawKeyIcon(x, y, t) {
  const cy = y + Math.sin(t * 2.4) * 4;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gl = ctx.createRadialGradient(x, cy, 2, x, cy, 52);
  gl.addColorStop(0, 'rgba(255,230,120,.55)'); gl.addColorStop(1, 'rgba(255,200,60,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, cy, 52, 0, 6.3); ctx.fill();
  for (let i = 0; i < 2; i++) {
    const ph = (t * 0.7 + i * 0.5) % 1;
    ctx.strokeStyle = 'rgba(255,236,150,' + (0.7 * (1 - ph)) + ')'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x, cy, 16 + ph * 30, 0, 6.3); ctx.stroke();
  }
  ctx.fillStyle = '#fff6b0';
  for (let i = 0; i < 5; i++) { const a = t * 1.8 + i * 1.2566; star4(x + Math.cos(a) * 28, cy + Math.sin(a) * 16, 3.5 + Math.sin(t * 5 + i) * 1.2, a * 2); }
  ctx.restore();
  ctx.save(); ctx.translate(x, cy);
  ctx.scale(0.62 + 0.38 * Math.abs(Math.cos(t * 1.5)), 1);
  ctx.fillStyle = '#ffd43b'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(-6, 0, 9, 0, 6.3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8e1'; ctx.beginPath(); ctx.arc(-6, 0, 3.5, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#ffd43b'; ctx.fillRect(1, -3, 17, 6); ctx.strokeRect(1, -3, 17, 6); ctx.fillRect(12, 3, 4, 7); ctx.fillRect(7, 3, 3, 5);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-10, -6, 3, 4);
  ctx.restore();
  if (!G.paused && Math.random() < 0.22) sparkle(x + rnd(-20, 20), cy + rnd(-20, 20), 1, 0.35, '#ffe98a');
}

function drawExit(L) {
  const e = L.exit; if (e.hide) return;
  ctx.save();
  if (e.clipY !== undefined) { ctx.beginPath(); ctx.rect(e.x - 70, e.y - 140, e.w + 140, e.clipY - (e.y - 140)); ctx.clip(); }
  drawExitBody(L);
  if (e.legs) {
    const ph = G.lt * 26, cx = e.x + e.w / 2;
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let k = -1; k <= 1; k += 2) {
      const sw = Math.sin(ph + (k > 0 ? Math.PI : 0)) * 9;
      ctx.beginPath(); ctx.moveTo(cx + k * 12, e.y + e.h); ctx.lineTo(cx + k * 12 + sw, e.y + e.h + 14); ctx.stroke();
      ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.ellipse(cx + k * 12 + sw + 3, e.y + e.h + 15, 7, 3.5, 0, 0, 6.3); ctx.fill();
    }
  }
  ctx.restore();
}

function drawExitBody(L) {
  const e = L.exit, open = G.keyGot, t = G.lt, cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (open) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(cx, cy, 6, cx, cy, 90 + Math.sin(t * 3) * 8);
    gl.addColorStop(0, 'rgba(160,120,255,.45)'); gl.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, 100, 0, 6.3); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#5d4037'; ctx.fillRect(e.x - 16, e.y + e.h - 6, e.w + 32, 10);
  ctx.fillStyle = '#8d6e63'; rr(e.x - 12, e.y - 14, 14, e.h + 14, 4); ctx.fill(); rr(e.x + e.w - 2, e.y - 14, 14, e.h + 14, 4); ctx.fill();
  ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.moveTo(e.x - 12, e.y + 10); ctx.quadraticCurveTo(cx, e.y - 44, e.x + e.w + 12, e.y + 10); ctx.lineTo(e.x + e.w + 12, e.y - 4); ctx.quadraticCurveTo(cx, e.y - 56, e.x - 12, e.y - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = open ? '#ffd43b' : '#a1887f'; ctx.beginPath(); ctx.arc(cx, e.y - 28, 6, 0, 6.3); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.moveTo(e.x, e.y + e.h); ctx.lineTo(e.x, e.y + 14); ctx.quadraticCurveTo(cx, e.y - 24, e.x + e.w, e.y + 14); ctx.lineTo(e.x + e.w, e.y + e.h); ctx.closePath(); ctx.clip();
  if (open) {
    const bg = ctx.createRadialGradient(cx, cy, 2, cx, cy, e.h * 0.7);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.35, '#b39bff'); bg.addColorStop(1, '#2a1a6e');
    ctx.fillStyle = bg; ctx.fillRect(e.x, e.y - 30, e.w, e.h + 40);
    ctx.translate(cx, cy); ctx.scale(1, e.h / e.w * 0.95);
    for (let i = 0; i < 7; i++) {
      ctx.save(); ctx.rotate(t * (1.6 + i * 0.35) * (i % 2 ? -1 : 1));
      ctx.strokeStyle = 'hsla(' + (250 + i * 18) + ',90%,' + (70 + i * 3) + '%,' + (0.85 - i * 0.07) + ')'; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(0, 0, 5 + i * 5.5, 0, Math.PI * 1.35); ctx.stroke(); ctx.restore();
    }
  } else {
    ctx.fillStyle = '#263238'; ctx.fillRect(e.x, e.y - 30, e.w, e.h + 40);
    ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 4; i++) ctx.fillRect(e.x + 6 + i * 12, e.y + 10, 2, e.h);
  }
  ctx.restore();
  if (open) {
    if (!G.paused && Math.random() < 0.35) sparkle(cx + rnd(-e.w, e.w), cy + rnd(-e.h * 0.6, e.h * 0.6), 1, 0.5, Math.random() < 0.5 ? '#d0c0ff' : '#aef');
  } else {
    ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(cx, cy + 4, 7, 0, 6.3); ctx.fill(); ctx.fillRect(cx - 3, cy + 6, 6, 12);
  }
}

function drawIceSolid(L, s) {
  const x = s[0], y = s[1], w = s[2], h = s[3], t = G.lt;
  const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 240));
  gr.addColorStop(0, '#bfeaff'); gr.addColorStop(0.35, '#6cc4f2'); gr.addColorStop(1, '#2a73b8');
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  for (let px = x + 16; px < x + w - 14; px += 46) { const ph = (px * 7) % 40; ctx.beginPath(); ctx.moveTo(px, y + 14 + ph); ctx.lineTo(px + 10, y + 6 + ph); ctx.lineTo(px + 20, y + 14 + ph); ctx.lineTo(px + 14, y + 30 + ph); ctx.lineTo(px + 4, y + 30 + ph); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#e8f8ff'; rr(x - 3, y - 4, w + 6, 10, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  for (let px = x + 8; px < x + w - 6; px += 30) { const bh = 5 + ((px * 13) % 8); ctx.beginPath(); ctx.moveTo(px, y - 3); ctx.lineTo(px + 5, y - 3 - bh); ctx.lineTo(px + 10, y - 3); ctx.fill(); }
  if (h < 80) { ctx.fillStyle = 'rgba(190,235,255,.9)'; for (let px = x + 10; px < x + w - 8; px += 26) { const ih = 8 + ((px * 11) % 12); ctx.beginPath(); ctx.moveTo(px, y + h); ctx.lineTo(px + 5, y + h + ih); ctx.lineTo(px + 10, y + h); ctx.fill(); } }
  const gx = x + ((t * 90 + x) % (w + 120)) - 60;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y - 4, w, 12); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.moveTo(gx, y + 8); ctx.lineTo(gx + 16, y - 4); ctx.lineTo(gx + 30, y - 4); ctx.lineTo(gx + 14, y + 8); ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawStalactite(s) {
  if (s.st === 3 && s.gnd !== undefined) {
    ctx.save(); ctx.globalAlpha = clamp(s.t / 1.2, 0, 1); ctx.fillStyle = '#8d7b73';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(s.x + i * 9 - 4, s.gnd); ctx.lineTo(s.x + i * 9 + 3, s.gnd - 8 - (i % 2) * 5); ctx.lineTo(s.x + i * 9 + 10, s.gnd); ctx.fill(); }
    ctx.restore();
  }
  ctx.fillStyle = '#5d4e48'; rr(s.x - 12, s.y - 16, s.w + 24, 20, 8); ctx.fill();
  if (s.st === 3) return;
  const sh = s.st === 1 ? Math.sin(G.lt * 90) * 2.4 : 0, y0 = s.y + (s.st === 2 ? s.fy : 0);
  const gr = ctx.createLinearGradient(s.x, y0, s.x + s.w, y0);
  gr.addColorStop(0, '#6d5d57'); gr.addColorStop(0.5, '#b8a59d'); gr.addColorStop(1, '#6d5d57');
  ctx.fillStyle = gr; ctx.strokeStyle = '#3e2f2a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(s.x + sh, y0); ctx.lineTo(s.x + s.w + sh, y0); ctx.lineTo(s.x + s.w / 2 + sh, y0 + s.h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(s.x + 7 + sh, y0 + 3); ctx.lineTo(s.x + 13 + sh, y0 + 3); ctx.lineTo(s.x + s.w / 2 + sh, y0 + s.h * 0.7); ctx.closePath(); ctx.fill();
  if (s.st === 2) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s.x + 6 + i * 11, y0 - 8); ctx.lineTo(s.x + 6 + i * 11, y0 - 30 - i * 6); ctx.stroke(); } }
  if (s.st === 1) { ctx.fillStyle = 'rgba(255,80,80,.9)'; ctx.font = '700 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', s.x + s.w / 2, s.y - 22); }
}

function drawMeteors(cam) {
  for (const f of (G.L.meteors || [])) {
    if (f.x1 < cam.x - 400 || f.x0 > cam.x + cam.vw + 400) continue;
    const m = meteorAt(f, G.lt);
    if (m.fly) {
      if (m.age > m.T - 1.3) {
        const pr = 1 - (m.T - m.age) / 1.3;
        ctx.save(); ctx.strokeStyle = 'rgba(255,70,50,' + (0.35 + pr * 0.55) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(m.ix, f.gy - 3, 54 - pr * 20, 10, 0, 0, 6.3); ctx.stroke();
        ctx.fillStyle = 'rgba(255,70,50,' + (0.12 + pr * 0.25) + ')'; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '700 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', m.ix, f.gy - 18); ctx.restore();
      }
      const tx = m.x - f.vx * 60 * 0.4, ty = m.y - f.vy * 60 * 0.4;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const tg = ctx.createLinearGradient(tx, ty, m.x, m.y);
      tg.addColorStop(0, 'rgba(255,120,30,0)'); tg.addColorStop(1, 'rgba(255,190,70,.9)');
      ctx.strokeStyle = tg; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke();
      const gl = ctx.createRadialGradient(m.x, m.y, 2, m.x, m.y, 34);
      gl.addColorStop(0, 'rgba(255,200,80,.8)'); gl.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(m.x, m.y, 34, 0, 6.3); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(G.lt * 5);
      ctx.fillStyle = '#4e342e'; ctx.strokeStyle = '#ff8f3d'; ctx.lineWidth = 2.5;
      ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * 0.785, r = 14 + (i % 2) * 3.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffab40'; ctx.beginPath(); ctx.arc(-4, -3, 3, 0, 6.3); ctx.fill(); ctx.restore();
    } else if (m.age - m.T < 0.5) {
      const p = (m.age - m.T) / 0.5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gl = ctx.createRadialGradient(m.ix, f.gy - 10, 4, m.ix, f.gy - 10, 30 + p * 60);
      gl.addColorStop(0, 'rgba(255,240,170,' + (0.9 * (1 - p)) + ')'); gl.addColorStop(0.5, 'rgba(255,120,30,' + (0.6 * (1 - p)) + ')'); gl.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(m.ix, f.gy - 10, 30 + p * 60, 0, 6.3); ctx.fill(); ctx.restore();
    }
  }
}

function drawSweeper(s, cam) {
  const T = G.lt, front = s.cx + s.w, y = cam.y - 100, h = cam.vh + 200;
  const roar = T < s.delay, my = cam.y + cam.vh * 0.52;
  const shk = roar ? Math.sin(T * 60) * 2 : 0;
  ctx.save(); ctx.translate(shk, 0);
  const bg = ctx.createLinearGradient(front - 520, 0, front, 0);
  bg.addColorStop(0, 'rgba(8,0,18,.97)'); bg.addColorStop(1, 'rgba(30,0,50,.9)');
  ctx.fillStyle = bg; ctx.fillRect(front - 1400, y, 1400, h);
  for (let i = 0; i < 16; i++) {
    const a = T * (0.5 + (i % 4) * 0.12) + i * 1.7, bx = front - 20 - ((i * 53) % 260) + Math.cos(a) * 34, by = cam.y + ((i * 137 + 60 * Math.sin(T * 0.6 + i)) % h + h) % h - 100, r = 70 + (i % 5) * 20;
    const g = ctx.createRadialGradient(bx, by, 4, bx, by, r);
    g.addColorStop(0, i % 3 ? 'rgba(120,30,170,.38)' : 'rgba(200,20,60,.28)'); g.addColorStop(1, 'rgba(60,0,100,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.3); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(190,110,255,.22)'; ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(front - 150, my, 60 + i * 45, T * (1.2 - i * 0.2) + i, T * (1.2 - i * 0.2) + i + 2.2); ctx.stroke(); }
  const eg = ctx.createLinearGradient(front - 70, 0, front + 60, 0);
  eg.addColorStop(0, 'rgba(255,40,90,0)'); eg.addColorStop(1, 'rgba(255,40,90,.45)');
  ctx.fillStyle = eg; ctx.fillRect(front - 70, y, 130, h);
  const snap = roar ? 1 : 0.5 + 0.5 * Math.sin(T * 4.4);
  const gp = 46 + snap * 96, tipX = front + 52;
  const jaw = (dir) => {
    ctx.fillStyle = '#12001f'; ctx.strokeStyle = '#7a1fa2'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(front - 340, my + dir * (gp + 330)); ctx.quadraticCurveTo(front - 120, my + dir * (gp + 120), tipX, my + dir * gp); ctx.lineTo(tipX - 30, my + dir * (gp + 56)); ctx.quadraticCurveTo(front - 130, my + dir * (gp + 170), front - 340, my + dir * (gp + 400)); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#efe6ff'; ctx.strokeStyle = '#4a2a66'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) {
      const u = k / 7, bx = lerp(front - 230, tipX - 8, u), by = my + dir * (gp + 8 + (1 - u) * (1 - u) * 110), th = 20 + u * 30 + (k % 2) * 6;
      ctx.beginPath(); ctx.moveTo(bx - 11, by + dir * 6); ctx.lineTo(bx + 11, by + dir * 6); ctx.lineTo(bx + 2, by - dir * th); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  };
  jaw(-1); jaw(1);
  ctx.fillStyle = '#efe6ff'; ctx.strokeStyle = '#4a2a66'; ctx.lineWidth = 1.5;
  for (let yy = Math.floor(y / 44) * 44; yy < y + h; yy += 44) {
    if (Math.abs(yy + 22 - my) < gp + 130) continue;
    ctx.beginPath(); ctx.moveTo(front - 6, yy); ctx.lineTo(front + 22 + snap * 10, yy + 22); ctx.lineTo(front - 6, yy + 44); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let e = 0; e < 3; e++) {
    const gx = front - 190 + (e % 2) * 24, gy2 = e === 2 ? my + gp + 110 : my - gp - 130 - (e === 1 ? 70 : 0);
    const pul = 0.75 + 0.25 * Math.sin(T * 5 + e);
    const g = ctx.createRadialGradient(gx, gy2, 2, gx, gy2, 46);
    g.addColorStop(0, 'rgba(255,60,90,' + pul + ')'); g.addColorStop(0.4, 'rgba(200,30,200,.55)'); g.addColorStop(1, 'rgba(120,0,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy2, 46, 0, 6.3); ctx.fill();
  }
  ctx.restore();
  for (let e = 0; e < 3; e++) {
    const gx = front - 190 + (e % 2) * 24, gy2 = e === 2 ? my + gp + 110 : my - gp - 130 - (e === 1 ? 70 : 0);
    ctx.fillStyle = '#ff2d55'; ctx.beginPath(); ctx.ellipse(gx, gy2, 17, 8 + 2 * Math.sin(T * 3 + e), 0.3, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#12001f'; ctx.beginPath(); ctx.ellipse(gx + 3, gy2, 3.5, 8, 0, 0, 6.3); ctx.fill();
  }
  ctx.restore();
  if (roar) {
    ctx.fillStyle = '#fff'; ctx.font = '700 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('THE MAW ROARS! RUN! ' + Math.max(0, s.delay - G.lt).toFixed(1), Math.max(front + 40, cam.x + 24), cam.y + 90);
  }
}

function drawRiser(r, cam) {
  const T = G.lt, y = r.cy;
  if (y > cam.y + cam.vh + 120) return;
  const x0 = cam.x - 60, x1 = cam.x + cam.vw + 60, bot = cam.y + cam.vh + 140, wd = x1 - x0;
  const roar = T < r.delay;
  if (r.kind === 'lava') {
    const g = ctx.createLinearGradient(0, y - 20, 0, y + 400);
    g.addColorStop(0, '#ffb300'); g.addColorStop(0.15, '#ff6d00'); g.addColorStop(1, '#8e1600');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, bot);
    for (let x = x0; x <= x1; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + T * 2.4) * 7 + Math.sin(x * 0.011 - T * 1.3) * 5);
    ctx.lineTo(x1, bot); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createLinearGradient(0, y - 160, 0, y + 10); gl.addColorStop(0, 'rgba(255,120,0,0)'); gl.addColorStop(1, 'rgba(255,150,30,.45)');
    ctx.fillStyle = gl; ctx.fillRect(x0, y - 160, wd, 170); ctx.restore();
    ctx.fillStyle = 'rgba(255,230,120,.8)';
    for (let i = 0; i < 12; i++) { const bx = x0 + ((i * 173 + T * 20 * (1 + i % 3)) % wd), by = y + 20 + ((i * 61 + T * 40) % 160); ctx.beginPath(); ctx.arc(bx, by, 2 + i % 4, 0, 6.3); ctx.fill(); }
    if (!G.paused && Math.random() < 0.4) sparkle(x0 + Math.random() * wd, y - 4, 1, 1, '#ffb74d');
  } else {
    const g = ctx.createLinearGradient(0, y - 30, 0, y + 340);
    g.addColorStop(0, 'rgba(60,0,90,.92)'); g.addColorStop(0.3, 'rgba(14,0,28,.97)'); g.addColorStop(1, 'rgba(6,0,14,1)');
    ctx.fillStyle = g; ctx.fillRect(x0, y, wd, bot - y + 10);
    for (let i = 0; i < 14; i++) {
      const bx = x0 + ((i * 211 + T * 14) % wd), by = y + 20 + ((i * 97) % 240) + Math.sin(T * 0.8 + i) * 26, rr0 = 60 + (i % 4) * 22;
      const gg = ctx.createRadialGradient(bx, by, 4, bx, by, rr0); gg.addColorStop(0, i % 3 ? 'rgba(130,40,180,.38)' : 'rgba(210,30,70,.28)'); gg.addColorStop(1, 'rgba(60,0,100,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx, by, rr0, 0, 6.3); ctx.fill();
    }
    const snap = roar ? 1 : 0.5 + 0.5 * Math.sin(T * 4.4);
    ctx.fillStyle = '#efe6ff'; ctx.strokeStyle = '#4a2a66'; ctx.lineWidth = 1.5;
    for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
      const th = 26 + snap * 14 + ((x / 46) % 3) * 6;
      ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 23, y - th); ctx.lineTo(x + 46, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const n = 4;
    for (let e = 0; e < n; e++) {
      const ex = x0 + (e + 0.5) * (wd / n) + Math.sin(T * 0.7 + e) * 30, ey = y + 54 + (e % 2) * 24;
      const gg = ctx.createRadialGradient(ex, ey, 2, ex, ey, 44); gg.addColorStop(0, 'rgba(255,60,90,.9)'); gg.addColorStop(0.45, 'rgba(200,30,200,.5)'); gg.addColorStop(1, 'rgba(120,0,200,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(ex, ey, 44, 0, 6.3); ctx.fill();
    }
    ctx.restore();
    for (let e = 0; e < n; e++) {
      const ex = x0 + (e + 0.5) * (wd / n) + Math.sin(T * 0.7 + e) * 30, ey = y + 54 + (e % 2) * 24;
      ctx.fillStyle = '#ff2d55'; ctx.beginPath(); ctx.ellipse(ex, ey, 18, 8, e % 2 ? 0.25 : -0.25, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#12001f'; ctx.beginPath(); ctx.ellipse(ex, ey, 3.5, 8, 0, 0, 6.3); ctx.fill();
    }
  }
  if (roar) { ctx.fillStyle = '#fff'; ctx.font = '700 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText((r.kind === 'lava' ? 'LAVA RISING IN ' : 'THE MAW RISES IN ') + Math.max(0, r.delay - T).toFixed(1), cam.x + cam.vw / 2, Math.min(y - 40, cam.y + cam.vh - 40)); }
}

function drawBoutiqueAura(x, y, label) {
  const t = G.lt, cx = x + PW / 2, cy = y + PH / 2;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 46);
  g.addColorStop(0, 'rgba(210,190,255,.45)'); g.addColorStop(1, 'rgba(160,120,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 46, 0, 6.3); ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(225,210,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 20;
  ctx.fillStyle = 'rgba(190,160,255,.14)'; ctx.beginPath(); ctx.ellipse(cx, cy, 27, 33, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fff6b0';
  for (let i = 0; i < 4; i++) { const a = t * 1.6 + i * 1.57; star4(cx + Math.cos(a) * 34, cy + Math.sin(a) * 26, 3, a); }
  ctx.font = '700 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(label || '🛍️', cx, y - 14);
  ctx.restore();
}

function drawCoin(c) {
  if (c.got && c.pop <= 0) return;
  if (c.kind === 'diamond') { drawDiamond(c); return; }
  const t = G.lt * 4 + c.id, sx = Math.abs(Math.cos(t));
  ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 0.7) * 3);
  if (c.got) { ctx.globalAlpha = c.pop * 2; ctx.translate(0, -(0.5 - c.pop) * 50); }
  ctx.fillStyle = 'rgba(255,214,80,.22)'; ctx.beginPath(); ctx.arc(0, 0, 21, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#ffca28'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.ellipse(0, 0, 11 * Math.max(0.2, sx), 13, 0, 0, 6.3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff3b0'; ctx.fillRect(-1.5 * sx, -6, 3 * sx, 12);
  ctx.restore();
}

function drawPlate(p) {
  const down = p.pr;
  ctx.fillStyle = '#5d4037'; ctx.fillRect(p.x - 4, p.y + p.h - 3, p.w + 8, 4);
  ctx.fillStyle = p.on ? '#69db7c' : '#ff6b6b'; rr(p.x, p.y + (down ? 5 : 0), p.w, p.h - (down ? 5 : 0), 4); ctx.fill();
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2; ctx.stroke();
  if (p.hold > 0 && p.t > 0 && !p.pr) {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(p.x, p.y - 12, p.w, 6);
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(p.x, p.y - 12, p.w * clamp(p.t / p.hold, 0, 1), 6);
  }
}

function drawGate(g, L) {
  const solid = gateSolid(g);
  if (g.inv) {
    ctx.save(); ctx.globalAlpha = solid ? 1 : 0.25;
    ctx.fillStyle = '#b0bec5'; ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 3; rr(g.x, g.y, g.w, g.h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd43b'; for (let i = 0; i < 4; i++) ctx.fillRect(g.x + 8 + i * 28, g.y + 4, 14, 5);
    ctx.restore(); return;
  }
  if (solid) {
    ctx.fillStyle = '#78909c'; ctx.strokeStyle = '#37474f'; ctx.lineWidth = 3; rr(g.x, g.y, g.w, g.h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5252'; for (let y = g.y + 14; y < g.y + g.h - 10; y += 34) ctx.fillRect(g.x + 3, y, g.w - 6, 8);
  } else {
    ctx.fillStyle = 'rgba(105,219,124,.25)'; ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = '#78909c'; ctx.fillRect(g.x, g.y - 6, g.w, 14);
  }
}

function drawPad(p, on) {
  ctx.fillStyle = on ? '#69db7c' : '#ffa94d'; rr(p.x, p.y + (on ? 4 : 0), p.w, p.h - (on ? 4 : 0), 4); ctx.fill();
  ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#37474f'; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ANCHOR', p.x + p.w / 2, p.y - 6);
}

function drawRope(R, i) {
  const bob = ropeBob(R);
  ctx.fillStyle = '#6d4c41'; rr(R.ax - 70, R.ay - 22, 140, 18, 6); ctx.fill();
  ctx.fillStyle = '#3e2723'; ctx.beginPath(); ctx.arc(R.ax, R.ay, 10, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(R.ax, R.ay); ctx.lineTo(bob.x, bob.y); ctx.stroke();
  ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]); ctx.stroke(); ctx.setLineDash([]);
  if (R.hs === -1) { ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(bob.x, bob.y, 9, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2; ctx.stroke(); }
  R.pads.forEach((p) => drawPad(p, R.anch));
  if (R.pads.length && !R.anch && R.hs === -1) {
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '700 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('rope too short - stand on an ANCHOR pad!', R.ax, R.ay - 34);
  }
}

function drawFlag(f) {
  ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x, f.y - 62); ctx.stroke();
  ctx.fillStyle = f.on ? '#4dabf7' : '#b0bec5';
  const w = Math.sin(G.lt * 5) * 3;
  ctx.beginPath(); ctx.moveTo(f.x, f.y - 62); ctx.quadraticCurveTo(f.x + 18, f.y - 58 + w, f.x + 34, f.y - 50); ctx.lineTo(f.x, f.y - 36); ctx.closePath(); ctx.fill();
}



const lighten = (hex, a) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(v + (255 - v) * a);
  return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
};

function drawShadow(x, y) {
  const L = G.L, fx = x + PW / 2, feet = y + PH;
  let top = null;
  for (let i = 0; i < L.solids.length; i++) { const s = L.solids[i]; if (fx >= s[0] && fx <= s[0] + s[2] && s[1] >= feet - 6 && (top === null || s[1] < top)) top = s[1]; }
  for (let i = 0; i < L.crumbles.length; i++) { const c = L.crumbles[i]; if (c.st < 2 && fx >= c.x && fx <= c.x + c.w && c.y >= feet - 6 && (top === null || c.y < top)) top = c.y; }
  if (top === null) return;
  const d = top - feet; if (d > 320) return;
  const k = 1 - d / 320;
  ctx.fillStyle = 'rgba(40,20,50,' + (0.07 + 0.2 * k).toFixed(3) + ')';
  ctx.beginPath(); ctx.ellipse(fx, top + 1, 17 * (0.55 + 0.45 * k), 4.5 * (0.55 + 0.45 * k), 0, 0, 6.3); ctx.fill();
}

function drawBunny(x, y, o) {
  const slot = o.slot || 0, skin = o.skin || 'classic';
  const col = COLORS[slot % COLORS.length], dk = DARKS[slot % DARKS.length];
  const face = o.face >= 0 ? 1 : -1, sq = clamp(o.sq || 0, -0.4, 0.4);
  const run = o.ground && Math.abs(o.vx) > 0.8, air = !o.ground;
  const ph = o.runT * 3, bob = run ? -Math.abs(Math.sin(ph)) * 2.4 : 0;
  const t = G.lt + slot * 1.7, blink = (t % (3 + (slot % 3))) < 0.13;
  const vx = o.vx || 0, vy = o.vy || 0;
  ctx.save();
  if (o.inv && Math.floor(G.lt * 14) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(x + PW / 2, y + PH);
  const vs = o.ground ? 0 : clamp(Math.abs(vy) * 0.011, 0, 0.17);
  ctx.scale(face * (1 + sq * 0.6 - vs * 0.45), 1 - sq + vs);
  ctx.rotate(run ? 0.07 : air ? clamp(vy * 0.014, -0.18, 0.18) : 0);
  const earSwing = -(o.ear || 0) + (run ? Math.sin(ph) * 0.1 : 0);
  if (skin === 'slime') {
    const wob = Math.sin(t * 5) * 1.5;
    const sg = ctx.createLinearGradient(0, -38, 0, 0); sg.addColorStop(0, 'rgba(255,224,102,.98)'); sg.addColorStop(1, 'rgba(255,170,0,.95)');
    ctx.fillStyle = sg; ctx.strokeStyle = '#d98200'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-17, 0); ctx.quadraticCurveTo(-19, -34 + wob, 0, -39 + bob + wob); ctx.quadraticCurveTo(19, -34 + wob, 17, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-7, -27, 4, 7, -0.5, 0, 6.3); ctx.fill();
    if (blink) { ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-1, -20); ctx.lineTo(5, -20); ctx.moveTo(7, -20); ctx.lineTo(13, -20); ctx.stroke(); }
    else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2, -21, 4.4, 0, 6.3); ctx.arc(10, -21, 4.4, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.arc(3.4, -20.6, 2.3, 0, 6.3); ctx.arc(11.4, -20.6, 2.3, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2.8, -21.6, 0.9, 0, 6.3); ctx.arc(10.8, -21.6, 0.9, 0, 6.3); ctx.fill();
    }
    ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(6.5, -14, 3.5, 0.15, 3.0); ctx.stroke();
  } else {
    const pal = SKIN_PAL[skin];
    const body = pal ? pal.body : skin === 'ninja' ? '#2b2d42' : skin === 'king' ? '#efe0fa' : col;
    const edge = pal ? pal.edge : skin === 'ninja' ? '#12131f' : skin === 'king' ? '#8e5bbd' : dk;
    const inner = pal ? pal.inner : skin === 'ninja' ? '#00bfa5' : '#ffb3cb';
    if (skin === 'king') {
      ctx.fillStyle = '#c1121f'; ctx.strokeStyle = '#7a0b13'; ctx.lineWidth = 2;
      const cw2 = Math.sin(t * 6) * 2 + (run ? 4 : 0);
      ctx.beginPath(); ctx.moveTo(-11, -28 + bob); ctx.quadraticCurveTo(-22 - cw2, -14, -19 - cw2, 1); ctx.lineTo(-8, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = edge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-15, -10 + bob, 5.6 + Math.sin(t * 6) * 0.4, 0, 6.3); ctx.fill(); ctx.stroke();
    const ear = (ox, rot) => {
      ctx.save(); ctx.translate(ox, -31 + bob); ctx.rotate(rot);
      ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(0, -11, 4.8, 13, 0, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(0, -10, 2.2, 9, 0, 0, 6.3); ctx.fill(); ctx.restore();
    };
    ear(-6, -0.15 - earSwing); ear(6, 0.15 - earSwing * 0.8);
    const bg = ctx.createLinearGradient(0, -36 + bob, 0, 0); bg.addColorStop(0, lighten(body, 0.4)); bg.addColorStop(1, body);
    ctx.fillStyle = bg; ctx.strokeStyle = edge; ctx.lineWidth = 3; rr(-14, -34 + bob, 28, 34 - bob, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin === 'ninja' ? '#3d405b' : pal ? pal.belly : 'rgba(255,255,255,.62)'; ctx.beginPath(); ctx.ellipse(1, -9, 8.5, 8, 0, 0, 6.3); ctx.fill();
    const fo = run ? Math.sin(ph) * 4 : 0, fy = air ? -4 : -2;
    ctx.fillStyle = edge; ctx.beginPath(); ctx.ellipse(-6 + fo, fy, 6, 3.2, 0, 0, 6.3); ctx.ellipse(7 - fo, fy, 6, 3.2, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 2;
    const ay = -14 + bob + (run ? Math.sin(ph + 3.14) * 2.5 : air ? -4 : 0);
    ctx.beginPath(); ctx.ellipse(11, ay, 3.2, 5.2, 0.3, 0, 6.3); ctx.fill(); ctx.stroke();
    if (skin === 'ninja') {
      ctx.fillStyle = '#00f5d4'; ctx.fillRect(-14, -27 + bob, 28, 7);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-14, -27 + bob, 28, 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(1, -25.5 + bob, 5, 3.5); ctx.fillRect(8, -25.5 + bob, 5, 3.5);
      ctx.fillStyle = '#12131f'; ctx.fillRect(3.5, -25 + bob, 2, 2.6); ctx.fillRect(10.5, -25 + bob, 2, 2.6);
      ctx.fillStyle = '#00f5d4'; const tw = Math.sin(G.lt * 8) * 2.5;
      ctx.beginPath(); ctx.moveTo(-14, -25 + bob); ctx.lineTo(-25, -21 + bob + tw); ctx.lineTo(-14, -21 + bob); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-14, -24 + bob); ctx.lineTo(-23, -15 + bob - tw); ctx.lineTo(-14, -20 + bob); ctx.fill();
    } else {
      if (blink) {
        ctx.strokeStyle = '#3b2a3f'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-0.5, -23 + bob); ctx.lineTo(6.5, -23 + bob); ctx.moveTo(7.5, -23 + bob); ctx.lineTo(14, -23 + bob); ctx.stroke();
      } else {
        const pxo = clamp(vx * 0.2, -1, 1.4) + 1.2, pyo = clamp(vy * 0.08, -1.2, 1.2);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3, -23.5 + bob, 4.7, 0, 6.3); ctx.arc(10.5, -23.5 + bob, 4.7, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#3b2a3f'; ctx.beginPath(); ctx.arc(3 + pxo, -23 + bob + pyo, 2.5, 0, 6.3); ctx.arc(10.5 + pxo, -23 + bob + pyo, 2.5, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2.4 + pxo, -24 + bob + pyo, 1, 0, 6.3); ctx.arc(9.9 + pxo, -24 + bob + pyo, 1, 0, 6.3); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,100,140,.4)'; ctx.beginPath(); ctx.ellipse(-1.5, -16.5 + bob, 3.4, 2.2, 0, 0, 6.3); ctx.ellipse(13, -16.5 + bob, 3.2, 2.2, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.ellipse(7.5, -18 + bob, 1.9, 1.4, 0, 0, 6.3); ctx.fill();
      ctx.strokeStyle = '#3b2a3f'; ctx.lineWidth = 1.4;
      if (air && vy < -1) { ctx.fillStyle = '#7a2e45'; ctx.beginPath(); ctx.ellipse(7.5, -14 + bob, 2.2, 2.6, 0, 0, 6.3); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(5.3, -16.2 + bob, 2.2, 0.2, 2.6); ctx.arc(9.7, -16.2 + bob, 2.2, 0.5, 2.9); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(12, -17.5 + bob); ctx.lineTo(19, -19.5 + bob); ctx.moveTo(12, -15.5 + bob); ctx.lineTo(19, -15 + bob); ctx.stroke();
    }
    if (skin === 'king') {
      ctx.fillStyle = '#ffd43b'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, -33 + bob); ctx.lineTo(-11, -44 + bob); ctx.lineTo(-5, -38 + bob); ctx.lineTo(0, -47 + bob); ctx.lineTo(5, -38 + bob); ctx.lineTo(11, -44 + bob); ctx.lineTo(10, -33 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(0, -39 + bob, 2.2, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#4dabf7'; ctx.beginPath(); ctx.arc(-6, -37 + bob, 1.4, 0, 6.3); ctx.arc(6, -37 + bob, 1.4, 0, 6.3); ctx.fill();
    }
    drawSkinAccents(skin, t, bob);
  }
  ctx.restore();
  if (o.shield) {
    ctx.save(); const pul = 1 + Math.sin(G.lt * 6) * 0.04;
    ctx.strokeStyle = 'rgba(120,220,255,.9)'; ctx.fillStyle = 'rgba(120,220,255,.2)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x + PW / 2, y + PH / 2, 24 * pul, 27 * pul, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  if (o.name) {
    ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center';
    const w = ctx.measureText(o.name).width + 10;
    ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(x + PW / 2 - w / 2, y - 34, w, 16, 8); ctx.fill();
    ctx.fillStyle = dk; ctx.fillText(o.name, x + PW / 2, y - 22);
  }
}

function drawTether() {
  if (G.mode !== 'coop' || !G.remotes.size) return;
  const mq = ipos(G.me);
  const ents = [{ slot: G.myslot, x: mq.x, y: mq.y, dead: G.me.dead, tg: G.me.tetherGrace }];
  for (const r of G.remotes.values()) { const rq = ipos(r); ents.push({ slot: r.slot, x: rq.x, y: rq.y, dead: r.dead, tg: r.tetherGrace }); }
  ents.sort((a, b) => a.slot - b.slot);
  for (let i = 0; i < ents.length - 1; i++) {
    const a = ents[i], b = ents[i + 1];
    if (a.dead || b.dead) continue;
    const ax = a.x + PW / 2, ay = a.y + PH * 0.55, bx = b.x + PW / 2, by = b.y + PH * 0.55;
    const d = Math.hypot(bx - ax, by - ay), slack = Math.max(0, TETHER - d), sag = slack * 0.55;
    const tension = clamp((d - TETHER) / 120, 0, 1);
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + sag;
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.slot % COLORS.length]); grad.addColorStop(1, COLORS[b.slot % COLORS.length]);
    ctx.lineCap = 'round';
    ctx.save();
    if ((a.tg && a.tg > 0) || (b.tg && b.tg > 0)) ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(60,30,60,.55)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
    ctx.strokeStyle = tension > 0.05 ? 'rgb(255,' + Math.round(210 - tension * 150) + ',' + Math.round(210 - tension * 150) + ')' : grad;
    ctx.lineWidth = 4.5 - tension * 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
    ctx.restore();
  }
}

function render(dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const L = G.L; if (!L || !G.me) return;
  const cam = G.cam;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackground(L, cam);
  const shk = G.shake > 0.2 ? G.shake : 0; G.shake *= 0.88;
  const ox = shk ? rnd(-shk, shk) : 0, oy = shk ? rnd(-shk, shk) : 0;
  ctx.setTransform(dpr * cam.sc, 0, 0, dpr * cam.sc, -(cam.x + ox) * dpr * cam.sc, -(cam.y + oy) * dpr * cam.sc);
  const ltR = G.lt - STEP * (1 - (G.alpha === undefined ? 1 : G.alpha));
  const x0 = cam.x - 120, x1 = cam.x + cam.vw + 120;
  const vis = (x, w) => x + w > x0 && x < x1;

  for (const s of L.solids) if (vis(s[0], s[2])) drawSolid(L, s);
  for (const g of L.gates) if (vis(g.x, g.w)) drawGate(g, L);
  for (const p of L.plates) if (vis(p.x, p.w)) drawPlate(p);
  for (const c of L.crumbles) if (vis(c.x, c.w)) drawCrumble(c);
  for (const s of L.springs) if (vis(s.x, s.w)) drawSpring(s);
  for (const f of L.flags) if (vis(f.x, 40)) drawFlag(f);
  drawExit(L);
  drawExitWait();
  L.ropes.forEach((R, i) => { if (vis(R.ax - 300, 600)) drawRope(R, i); });
  for (const c of L.crushers) if (vis(c.x, c.w)) drawCrusher(c, crusherBottom(c, ltR));
  for (const q of (L.stalactites || [])) if (vis(q.x - 20, q.w + 40)) drawStalactite(q);
  for (const s of L.spikes) if (vis(s.x, s.w)) drawSpikes(s);
  drawTraps(L);
  drawMeteors(cam);
  for (const b of L.boulders) if (vis(b.x0 - 60, b.x1 - b.x0 + 120)) { const bx = pingPong(b.x0, b.x1, b.speed, b.off, ltR); drawBoulder(b, bx, b.rot + (bx - b.cx) / b.r); }
  for (const c of L.coins) if (vis(c.x - 20, 40)) drawCoin(c);
  if (!G.keyGot) { const k = keyPos(); drawKeyIcon(k.x, k.y, G.lt); }
  drawTether();

  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    const rp = ipos(r);
    drawShadow(rp.x, rp.y);
    drawBunny(rp.x, rp.y, { ear: r.ear, slot: r.slot, skin: G.skins[r.slot], face: r.face, vx: r.tvx, vy: r.tvy, ground: r.onGround, runT: r.runT, sq: r.sq, inv: r.inv, shield: r.shield, name: G.names[r.slot] });
  }

  const me = G.me;
  if (!me.dead) {
    const mp = ipos(me);
    drawShadow(mp.x, mp.y);
    drawBunny(mp.x, mp.y, { ear: me.ear, slot: me.slot, skin: G.skins[me.slot] || Save.equipped(), face: me.face, vx: me.vx, vy: me.vy, ground: me.onGround, runT: me.runT, sq: me.sq, inv: me.inv > 0, shield: me.shield, name: isNet() ? G.names[me.slot] : null });
  }
  for (const rp of G.remotes.values()) if (rp.bout && !rp.dead) { const q = ipos(rp); drawBoutiqueAura(q.x, q.y, '🛍️ ' + (G.names[rp.slot] || '')); }
  if (G.boutique && !me.dead) { const q = ipos(me); drawBoutiqueAura(q.x, q.y, '🛍️ Shop shield'); }
  for (const s of L.sweepers) drawSweeper(s, cam);
  for (const rs of (L.risers || [])) drawRiser(rs, cam);
  drawParts();
  drawEnvFX();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawOffscreenRadar();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const vg = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.45, canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.78);
  vg.addColorStop(0, 'rgba(70,20,80,0)'); vg.addColorStop(1, 'rgba(70,20,80,.22)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawEnvTint();
  drawDebug();
}

// ============================================================================
// MAIN LOOP  (fixed 60 Hz simulation, rendered every animation frame)
// ============================================================================
let lastT = nowMs(), acc = 0;
function frame(t) {
  requestAnimationFrame(frame);
  let dt = (t - lastT) / 1000; lastT = t;
  if (!(dt > 0)) return;
  if (dt > 0.1) dt = 0.1;
  if (G.inGame && G.L && G.me) {
    const modal = modalOpen();
    G.paused = modal && G.mode === 'solo';
    G.boutique = modal && isNet();
    const pb = $('pauseBadge'); if (pb) pb.classList.toggle('hidden', !G.paused);
    if (!G.paused) {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 5) { stepRemotes(); stepPlayer(); updateWorld(); acc -= STEP; n++; }
      if (n === 5) acc = 0;
      G.alpha = clamp(acc / STEP, 0, 1);
      sendPos(t);
      updateParts(dt);
      updateEnvFX(dt);
      spawnSkinTrails();
    } else { acc = 0; lastSend = 0; }
    updateCamera(dt);
    render(dt);
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// ============================================================================

// ============================================================================
// SETTINGS MODAL (GOM NÚT ÂM THANH, RESET, HOME & CHẶNG SPAM)
// ============================================================================
function buildSettingsModal() {
  if ($('settingsModal')) return;
  const st = document.createElement('style');
  st.textContent = `
    .sm-wrap{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(20,10,30,.65);backdrop-filter:blur(4px);padding:14px}
    .sm-card{width:min(420px,94%);background:#fff8fb;border:4px solid #5b3a5e;border-radius:24px;padding:20px;box-shadow:0 8px 0 rgba(0,0,0,.25);text-align:center;font-family:var(--font,sans-serif)}
    .sm-title{font-size:20px;font-weight:800;color:#5b3a5e;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:8px}
    .sm-grid{display:flex;flex-direction:column;gap:10px}
    .sm-btn{font-size:15px;font-weight:700;padding:12px 14px;border:3px solid #5b3a5e;border-radius:14px;background:#fff;cursor:pointer;color:#5b3a5e;box-shadow:0 3px 0 #5b3a5e;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .1s}
    .sm-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #5b3a5e}
    .sm-btn.pri{background:#ffe066}
    .sm-btn.danger{background:#ffc9c9}
    .sm-btn.close{margin-top:8px;background:#e9ecef;border-color:#868e96;color:#495057;box-shadow:0 3px 0 #868e96}
    .sm-btn.host-tag::after{content:'★ Chủ phòng';font-size:11px;background:#ff922b;color:#fff;padding:2px 6px;border-radius:8px;margin-left:6px}
  `;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'settingsModal'; el.className = 'sm-wrap hidden';
  el.innerHTML = `
    <div class="sm-card">
      <div class="sm-title">⚙️ CÀI ĐẶT TRÒ CHƠI</div>
      <div id="smWho" class="sy-who"></div>
      <div class="sm-grid">
        <button id="smSoundBtn" class="sm-btn">🔊 Âm thanh: BẬT</button>
        <button id="smRestartBtn" class="sm-btn pri host-tag">🔄 Khởi động lại màn</button>
        <button id="smAutoMapBtn" class="sm-btn host-tag">🎲 Tạo màn ngẫu nhiên</button>
        <button id="smEditorBtn" class="sm-btn">🛠️ Trình tạo màn (Editor)</button>
        <button id="smUnstickBtn" class="sm-btn">🆘 Kẹt map? Hồi sinh ngay</button>
        <button id="smNickBtn" class="sm-btn">✏️ Đổi biệt danh (Change Nickname)</button>
        <button id="smSaveBtn" class="sm-btn">☁️ Mã đồng bộ 6 ký tự (Sao lưu / Khôi phục)</button>
        <button id="smAdminBtn" class="sm-btn pri hidden">🛠 Bảng quản trị (Admin)</button>
        <button id="smExitBtn" class="sm-btn danger">🏠 Thoát về Menu chính</button>
        <button id="smCloseBtn" class="sm-btn close">✕ Đóng</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  $('smSoundBtn').onclick = () => {
    Snd.init();
    const muted = Snd.toggleMute();
    $('smSoundBtn').textContent = muted ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
    $('muteBtn').textContent = muted ? '🔇' : '🔊';
  };
  $('smRestartBtn').onclick = () => {
    if (G.mode !== 'solo' && !isHostSlot()) {
      toast('⚠️ Chỉ Chủ phòng mới có quyền Reset!');
      return;
    }
    show('settingsModal', false);
    if (G.mode !== 'solo') netEv({ t: 'restart' });
    restartLevel();
    toast('🔄 Đã khởi động lại màn chơi!');
  };
  $('smAutoMapBtn').onclick = () => {
    if (G.mode !== 'solo' && !isHostSlot()) {
      toast('⚠️ Chỉ Chủ phòng (Host ★) mới có quyền đổi Màn Ngẫu Nhiên!');
      return;
    }
    show('settingsModal', false);
    const randLvl = generateRandomLevel(G.mode);
    if (G.mode !== 'solo') netEv({ t: 'custom_lvl', data: randLvl });
    loadLevel(-1, randLvl);
    toast('🎲 Đã sinh màn ngẫu nhiên mới!');
  };
  $('smEditorBtn').onclick = () => {
    show('settingsModal', false);
    openEditor();
  };
  $('smSaveBtn').onclick = () => { show('settingsModal', false); openSyncModal(); };
  $('smNickBtn').onclick = () => { show('settingsModal', false); openNickModal(); };
  $('smAdminBtn').onclick = () => { show('settingsModal', false); openAdminPanel(); };
  $('smUnstickBtn').onclick = () => {
    show('settingsModal', false);
    respawn();
    toast('🆘 Đã hồi sinh về điểm an toàn!');
  };
  $('smExitBtn').onclick = () => {
    show('settingsModal', false);
    leaveToMenu(false);
  };
  $('smCloseBtn').onclick = () => show('settingsModal', false);

  // Group top bar HUD: hide separate restart, mute, menu buttons and put Settings gear
  const rst = $('restartBtn'), mut = $('muteBtn'), mnu = $('menuBtn');
  if (rst) rst.style.display = 'none';
  if (mut) mut.style.display = 'none';
  if (mnu) mnu.style.display = 'none';

  let hudGear = $('hudGearBtn');
  if (!hudGear) {
    hudGear = document.createElement('button');
    hudGear.id = 'hudGearBtn';
    hudGear.className = 'icon-btn';
    hudGear.title = 'Cài đặt';
    hudGear.textContent = '⚙️';
    hudGear.style.fontSize = '18px';
    hudGear.onclick = () => { openSettings(); };
    const hud = $('hud');
    if (hud) hud.appendChild(hudGear);
  }
}


// ============================================================================
// v8 MODULE 1 -- API helper, CLOUD SYNC (6-character code) & LEGACY TB7 IMPORT
// ============================================================================
async function api(method, path, body) {
  try {
    const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch (e) {}
    return { status: r.status, body: j || {} };
  } catch (e) { return { status: 0, body: { error: 'offline' } }; }
}

const LOCAL_ONLY = new Set(['tb_mute', 'tb_sync_code', 'tb_sync_rev', 'tb_sync_dirty']);
const CODE_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const Sync = {
  applying: false, conflict: false, timer: 0, pushing: false,
  code() { return Store.get('tb_sync_code', ''); },
  rev() { return parseInt(Store.get('tb_sync_rev', '0'), 10) || 0; },
  link(code, rev) { Store.set('tb_sync_code', code); Store.set('tb_sync_rev', String(rev)); Store.set('tb_sync_dirty', '0'); this.conflict = false; },
  unlink() { Store.set('tb_sync_code', ''); Store.set('tb_sync_rev', '0'); Store.set('tb_sync_dirty', '0'); this.conflict = false; },
  newCode() { let c = ''; for (let i = 0; i < 6; i++) c += CODE_ALPHA[(Math.random() * CODE_ALPHA.length) | 0]; return c; },
  clean(raw) { return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); },
  snapshot() { const d = {}; Store.keys().forEach((k) => { if (!LOCAL_ONLY.has(k)) d[k] = Store.get(k, ''); }); return d; },
  hasProgress() { return Store.keys().some((k) => !LOCAL_ONLY.has(k) && k !== 'tb_name'); },

  async create(code) {
    const r = await api('POST', '/api/sync/create', { code, data: this.snapshot() });
    if (r.status === 200 && r.body.ok) { this.link(r.body.code, r.body.rev); return { ok: true, code: r.body.code }; }
    return { ok: false, reason: r.body.error || (r.status === 0 ? 'offline' : 'error') };
  },
  async pull(code) {
    const r = await api('GET', '/api/sync/' + encodeURIComponent(code));
    if (r.status === 200 && r.body.ok) return { ok: true, data: r.body.data || {}, rev: r.body.rev | 0 };
    return { ok: false, reason: r.body.error || (r.status === 0 ? 'offline' : 'error') };
  },
  async push(force) {
    const code = this.code();
    if (!code || this.pushing) return { ok: false, reason: 'busy' };
    this.pushing = true; clearTimeout(this.timer);
    try {
      const r = await api('POST', '/api/sync/push', { code, rev: this.rev(), data: this.snapshot(), force: !!force });
      if (r.status === 200 && r.body.ok) { Store.set('tb_sync_rev', String(r.body.rev)); Store.set('tb_sync_dirty', '0'); this.conflict = false; return { ok: true }; }
      if (r.status === 409) { this.conflict = true; return { ok: false, reason: 'conflict' }; }
      if (r.status === 404) {
        const c = await this.create(code);
        return c.ok ? { ok: true } : { ok: false, reason: 'not_found' };
      }
      return { ok: false, reason: r.body.error || 'offline' };
    } finally { this.pushing = false; }
  },
  onWrite(k) {
    if (this.applying || LOCAL_ONLY.has(k) || !this.code()) return;
    Store.set('tb_sync_dirty', '1');
    if (this.conflict) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.autoPush(), 6000);
  },
  async autoPush() {
    const r = await this.push(false);
    if (!r.ok && r.reason === 'conflict') toast('⚠️ Cloud đã đổi từ máy khác — vào ⚙️ → Mã đồng bộ để chọn bản lưu');
  },
  apply(data) {
    this.applying = true;
    try {
      Store.keys().forEach((k) => { if (!LOCAL_ONLY.has(k)) Store.del(k); });
      Object.keys(data || {}).forEach((k) => {
        if (!/^tb_[A-Za-z0-9_\-]+$/.test(k) || LOCAL_ONLY.has(k)) return;
        const v = String(data[k]); if (v.length > 400000) return;
        Store.set(k, v);
      });
    } finally { this.applying = false; }
  },
  async boot() {
    const code = this.code(); if (!code) return;
    const r = await api('GET', '/api/sync/' + code + '/meta');
    const dirty = Store.get('tb_sync_dirty', '0') === '1';
    if (r.status === 404) { if (this.hasProgress()) this.push(false); return; }
    if (r.status !== 200 || !r.body.ok) return;
    if ((r.body.rev | 0) > this.rev()) {
      if (!dirty) {
        const p = await this.pull(code);
        if (p.ok) { this.apply(p.data); this.link(code, p.rev); afterProgressChange(); toast('☁️ Đã cập nhật tiến trình mới nhất từ cloud'); }
      } else { this.conflict = true; toast('⚠️ Cloud và máy này đều có thay đổi — mở ⚙️ → Mã đồng bộ để chọn'); }
    } else if (dirty) this.push(false);
  },
};

function applySaveCode(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (code.indexOf('TB7-') !== 0) return -1;
  try {
    const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
    if (!o || o.v !== 1 || typeof o.d !== 'object' || !o.d) return -1;
    let n = 0;
    Sync.applying = true;
    Object.keys(o.d).forEach((k) => {
      if (!/^tb_[A-Za-z0-9_\-]+$/.test(k) || LOCAL_ONLY.has(k)) return;
      const v = String(o.d[k]); if (v.length > 400000) return;
      Store.set(k, v); n++;
    });
    return n;
  } catch (e) { return -1; } finally { Sync.applying = false; }
}

function afterProgressChange() {
  migrateEconomy();
  refreshFX(); refreshCoinUI(); refreshBuffUI(); refreshShopUI(); rebuildLevelSelect();
  setText('lpCoins', Role.admin ? '∞' : Save.coins());
  const nm = Store.get('tb_name', '') || G.myName; G.myName = nm; G.names[G.myslot] = nm;
  const ni = $('nameInput'); if (ni) ni.value = nm;
  G.skins[G.myslot] = Save.equipped();
  if (isNet() && socket && socket.connected) { socket.emit('skin', Save.equipped()); socket.emit('rename', nm); }
  updatePlayerList();
}

function copyText(text, okMsg) {
  const fallback = () => window.prompt('Sao chép (Ctrl+C):', text);
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(okMsg), fallback);
  else fallback();
}

function makeModal(id, z) {
  let el = $(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id; el.className = 'sm-wrap hidden'; el.style.zIndex = String(z || 80);
    document.body.appendChild(el);
  }
  return el;
}

function syMsg(t, bad) { const m = $('syMsg'); if (m) { m.textContent = t || ''; m.className = 'sy-msg' + (bad ? ' bad' : ''); } }
function openSyncModal() { renderSyncModal(); show('syncModal', true); }
function openSaveCode() { openSyncModal(); }

function renderSyncModal() {
  const el = makeModal('syncModal', 80);
  const code = Sync.code(), conflict = Sync.conflict;
  el.innerHTML =
    '<div class="sm-card">' +
      '<div class="sm-title">☁️ MÃ ĐỒNG BỘ TIẾN TRÌNH</div>' +
      '<div class="sy-help">Mã 6 ký tự giúp bạn chơi tiếp trên thiết bị khác — giữ nguyên xu, 💎, skin, màn đã qua, kỷ lục, thuốc và biệt danh.</div>' +
      (code
        ? '<div class="sy-code">' + code + '</div>' +
          (conflict ? '<div class="sy-warn">⚠️ Cloud đã thay đổi từ thiết bị khác. Hãy chọn bản muốn giữ.</div>' : '<div class="sy-ok">✅ Tự động đồng bộ khi bạn chơi</div>') +
          '<div class="sm-grid">' +
            '<button id="syCopy" class="sm-btn pri">📋 Sao chép mã</button>' +
            '<button id="syPush" class="sm-btn">' + (conflict ? '⬆️ Ghi đè cloud bằng máy này' : '⬆️ Lưu lên cloud ngay') + '</button>' +
            '<button id="syPull" class="sm-btn">⬇️ Tải bản cloud về máy này</button>' +
            '<button id="syUnlink" class="sm-btn danger">🔗 Dùng mã khác (ngắt liên kết)</button>' +
          '</div>'
        : '<div class="sy-label">Tạo mã mới — bạn có thể tự đặt (6 ký tự A-Z / 0-9)</div>' +
          '<div class="sy-row"><input id="syNew" class="sy-input" maxlength="6" autocomplete="off" spellcheck="false"><button id="syDice" class="sm-btn" title="Mã ngẫu nhiên">🎲</button></div>' +
          '<button id="syCreate" class="sm-btn pri" style="width:100%;margin-top:8px">☁️ Tạo mã &amp; lưu tiến trình</button>') +
      '<div class="sy-sep"></div>' +
      '<div class="sy-label">Đã có mã? Nhập để khôi phục</div>' +
      '<div class="sy-row"><input id="syRestore" class="sy-input" placeholder="ABC123" autocomplete="off" spellcheck="false"><button id="syLoad" class="sm-btn pri">📥 Khôi phục</button></div>' +
      '<div id="syMsg" class="sy-msg"></div>' +
      '<button id="syClose" class="sm-btn close" style="width:100%">✕ Đóng</button>' +
    '</div>';
  const on = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
  const restoreIn = $('syRestore');
  restoreIn.oninput = () => { const v = restoreIn.value; if (!/^TB7-/i.test(v.trim())) restoreIn.value = Sync.clean(v); };
  restoreIn.onkeydown = (e) => { if (e.key === 'Enter') $('syLoad').click(); };
  if (!code) {
    const ni = $('syNew'); ni.value = Sync.newCode();
    ni.oninput = () => { ni.value = Sync.clean(ni.value); };
    ni.onkeydown = (e) => { if (e.key === 'Enter') $('syCreate').click(); };
  }
  on('syClose', () => show('syncModal', false));
  on('syCopy', () => copyText(code, '📋 Đã sao chép mã ' + code));
  on('syDice', () => { $('syNew').value = Sync.newCode(); });
  on('syCreate', async () => {
    const want = Sync.clean($('syNew').value);
    if (want.length !== 6) { syMsg('Mã phải đủ 6 ký tự (A-Z, 0-9).', true); return; }
    syMsg('Đang tạo mã…');
    const r = await Sync.create(want);
    if (r.ok) { renderSyncModal(); syMsg('✅ Xong! Hãy ghi nhớ mã ' + r.code + ' để dùng trên thiết bị khác.'); toast('☁️ Đã tạo mã đồng bộ ' + r.code); return; }
    if (r.reason === 'taken') {
      const alt = Sync.newCode(), ni = $('syNew'); ni.value = alt; ni.focus(); ni.select();
      syMsg('⚠️ Mã "' + want + '" đã có người sử dụng. Hãy chọn mã khác (gợi ý: ' + alt + ') rồi bấm Tạo mã.', true); return;
    }
    syMsg(r.reason === 'offline' ? '❌ Không kết nối được máy chủ.' : '❌ Không thể tạo mã (' + r.reason + ').', true);
  });
  on('syPush', async () => {
    syMsg('Đang lưu…');
    const r = await Sync.push(Sync.conflict);
    if (r.ok) { renderSyncModal(); syMsg('✅ Đã lưu tiến trình lên cloud.'); }
    else syMsg(r.reason === 'conflict' ? '⚠️ Cloud đã thay đổi từ thiết bị khác.' : '❌ Không lưu được (' + r.reason + ').', true);
  });
  on('syPull', async () => {
    syMsg('Đang tải…');
    const p = await Sync.pull(code);
    if (!p.ok) { syMsg('❌ Không tải được (' + p.reason + ').', true); return; }
    if (!confirm('Tiến trình trên máy này sẽ được thay bằng bản cloud. Tiếp tục?')) { syMsg(''); return; }
    Sync.apply(p.data); Sync.link(code, p.rev); afterProgressChange();
    renderSyncModal(); syMsg('✅ Đã tải bản cloud về máy.');
  });
  on('syUnlink', () => {
    if (!confirm('Ngắt liên kết mã ' + code + ' khỏi thiết bị này? (Tiến trình trên máy vẫn giữ nguyên.)')) return;
    Sync.unlink(); renderSyncModal();
  });
  on('syLoad', async () => {
    const raw = $('syRestore').value.trim();
    if (/^TB7-/i.test(raw)) {
      if (Sync.hasProgress() && !confirm('Mã TB7 cũ sẽ ghi đè tiến trình hiện tại. Tiếp tục?')) return;
      const n = applySaveCode(raw);
      if (n < 0) { syMsg('❌ Mã TB7 không hợp lệ.', true); return; }
      afterProgressChange(); renderSyncModal(); syMsg('✅ Đã nhập ' + n + ' mục từ mã cũ.'); return;
    }
    const want = Sync.clean(raw);
    if (want.length !== 6) { syMsg('Hãy nhập đủ 6 ký tự.', true); return; }
    syMsg('Đang tải…');
    const p = await Sync.pull(want);
    if (!p.ok) { syMsg(p.reason === 'not_found' ? '❌ Không tìm thấy mã ' + want + '.' : '❌ Lỗi kết nối.', true); return; }
    if (Sync.hasProgress() && !confirm('Khôi phục sẽ ghi đè dữ liệu hiện tại bằng tiến trình của mã ' + want + '. Tiếp tục?')) { syMsg(''); return; }
    Sync.apply(p.data); Sync.link(want, p.rev); afterProgressChange();
    show('syncModal', false); toast('✅ Đã khôi phục tiến trình thành công!');
  });
}

function ensureGuestName() {
  let n = Store.get('tb_name', '');
  if (!n) { n = 'Guest' + (1000 + Math.floor(Math.random() * 9000)); Store.set('tb_name', n); }
  return n;
}

function setNickname(raw) {
  const n = String(raw || '').replace(/[<>&"']/g, '').trim().slice(0, 12);
  if (!n) { toast('Biệt danh không được để trống'); return false; }
  Store.set('tb_name', n); G.myName = n; G.names[G.myslot] = n;
  const ni = $('nameInput'); if (ni) ni.value = n;
  if (isNet() && socket && socket.connected) socket.emit('rename', n);
  updatePlayerList(); refreshSettingsInfo(); toast('✅ Biệt danh mới: ' + n);
  return true;
}

function openNickModal() {
  const el = makeModal('nickModal', 80);
  el.innerHTML =
    '<div class="sm-card"><div class="sm-title">✏️ ĐỔI BIỆT DANH</div>' +
    '<div class="sy-help">Miễn phí, đổi bao nhiêu lần tuỳ thích (tối đa 12 ký tự).</div>' +
    '<input id="nickInput" class="sy-input" style="width:100%;text-transform:none" maxlength="12" autocomplete="off" spellcheck="false">' +
    '<div class="sm-grid" style="margin-top:10px"><button id="nickSave" class="sm-btn pri">💾 Lưu biệt danh</button><button id="nickClose" class="sm-btn close">✕ Hủy</button></div></div>';
  const inp = $('nickInput'); inp.value = Store.get('tb_name', '') || G.myName;
  const save = () => { if (setNickname(inp.value)) show('nickModal', false); };
  $('nickSave').onclick = save;
  $('nickClose').onclick = () => show('nickModal', false);
  inp.onkeydown = (e) => { if (e.key === 'Enter') save(); };
  show('nickModal', true); setTimeout(() => { inp.focus(); inp.select(); }, 50);
}

function refreshSettingsInfo() {
  const w = $('smWho');
  if (w) w.textContent = (Role.admin ? '🛠 Quản trị' : '👤 Khách') + ' · ' + (G.myName || 'Bunny') + (Sync.code() ? ' · ☁️ ' + Sync.code() : ' · chưa có mã');
  show('smAdminBtn', Role.admin);
}
function openSettings() {
  show('settingsModal', true);
  const sb = $('smSoundBtn'); if (sb) sb.textContent = Snd.isMuted() ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
  refreshSettingsInfo();
}

const Admin = {
  async login(key) {
    const r = await api('POST', '/api/admin/login', { key });
    if (r.status === 200 && r.body.ok) { this.enable(r.body.token); return { ok: true }; }
    return { ok: false, reason: r.status === 429 ? 'rate' : r.status === 0 ? 'offline' : 'bad' };
  },
  enable(token) { Role.admin = true; Role.token = token; try { sessionStorage.setItem('tb_admin_tok', token); } catch (e) {} this.refresh(); },
  disable() { Role.admin = false; Role.god = false; Role.dbg = false; Role.token = ''; try { sessionStorage.removeItem('tb_admin_tok'); } catch (e) {} this.refresh(); },
  async resume() {
    let t = ''; try { t = sessionStorage.getItem('tb_admin_tok') || ''; } catch (e) {}
    if (!t) return;
    const r = await api('POST', '/api/admin/verify', { token: t });
    if (r.status === 200 && r.body.ok) this.enable(t); else { try { sessionStorage.removeItem('tb_admin_tok'); } catch (e) {} }
  },
  refresh() {
    show('adminTag', Role.admin);
    refreshCoinUI(); refreshBuffUI(); refreshFX(); refreshShopUI(); rebuildLevelSelect(); refreshSettingsInfo();
    G.skins[G.myslot] = Save.equipped();
    if (isNet() && socket && socket.connected) socket.emit('skin', Save.equipped());
  },
};

function openAdminEntry() { if (Role.admin) openAdminPanel(); else openAdminLogin(); }

function openAdminLogin() {
  const el = makeModal('adminLoginModal', 90);
  el.innerHTML =
    '<div class="sm-card"><div class="sm-title">🔐 QUẢN TRỊ</div>' +
    '<input id="adKey" type="password" class="sy-input" style="width:100%;text-transform:none" placeholder="Mật khẩu admin" autocomplete="off">' +
    '<div id="adMsg" class="sy-msg"></div>' +
    '<div class="sm-grid" style="margin-top:8px"><button id="adGo" class="sm-btn pri">Đăng nhập</button><button id="adCancel" class="sm-btn close">✕ Hủy</button></div></div>';
  const inp = $('adKey');
  const go = async () => {
    const r = await Admin.login(inp.value);
    if (r.ok) { show('adminLoginModal', false); toast('🛠 Đã bật quyền Admin'); openAdminPanel(); return; }
    const m = $('adMsg'); m.className = 'sy-msg bad';
    m.textContent = r.reason === 'rate' ? 'Sai quá nhiều lần, hãy đợi 5 phút.' : 'Sai mật khẩu.';
    inp.value = '';
  };
  $('adGo').onclick = go; $('adCancel').onclick = () => show('adminLoginModal', false);
  inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
  show('adminLoginModal', true); setTimeout(() => inp.focus(), 50);
}

function adminInGame() { if (!G.inGame || !G.me) { toast('Chỉ dùng được khi đang trong màn chơi'); return false; } return true; }
function adminTeleport(x, y) { const P = G.me; P.x = x; P.y = y; P.vx = P.vy = 0; P.rope = null; P.dead = false; G.cam.snap = true; }

function openAdminPanel() {
  const el = makeModal('adminModal', 90);
  const st = (v) => (v ? 'BẬT' : 'TẮT');
  const b = (id, label, cls) => '<button id="' + id + '" class="sm-btn ' + (cls || '') + '">' + label + '</button>';
  el.innerHTML =
    '<div class="sm-card"><div class="sm-title">🛠 BẢNG QUẢN TRỊ</div>' +
    '<div class="sy-help">Xu / 💎 vô hạn, mua miễn phí, mọi skin &amp; màn đều mở (chỉ trên máy này).</div>' +
    '<div class="sm-grid">' +
      b('adGod', '🛡️ Bất tử (God mode): ' + st(Role.god), Role.god ? 'pri' : '') +
      b('adCoins', '🪙 +10.000 xu vào save') + b('adDia', '💎 +100 kim cương vào save') +
      b('adUnlock', '🔓 Mở khóa mọi màn (lưu vào save)') +
      b('adTpKey', '🔑 Dịch chuyển tới chìa khóa') + b('adTpExit', '🚪 Dịch chuyển tới cửa thoát') +
      b('adWin', '⚡ Thắng màn ngay') + b('adKill', '☠️ Tự hồi sinh') +
      b('adDbg', '📊 Thông số debug: ' + st(Role.dbg), Role.dbg ? 'pri' : '') +
      b('adWipe', '🗑️ Xóa save trên máy (test như khách mới)', 'danger') +
      b('adOut', '🚪 Đăng xuất Admin', 'danger') +
      b('adClose', '✕ Đóng', 'close') +
    '</div></div>';
  const on = (id, fn) => { $(id).onclick = fn; };
  on('adClose', () => show('adminModal', false));
  on('adGod', () => { Role.god = !Role.god; openAdminPanel(); toast('🛡️ God mode: ' + st(Role.god)); });
  on('adDbg', () => { Role.dbg = !Role.dbg; openAdminPanel(); });
  on('adCoins', () => { Save.addCoins(10000); toast('🪙 +10.000 xu'); });
  on('adDia', () => { Save.addDiamonds(100); toast('💎 +100 kim cương'); });
  on('adUnlock', () => { ['solo', 'coop', 'party'].forEach((m) => Store.set('tb_unlocked_' + m, String(LEVELS[m].length))); rebuildLevelSelect(); toast('🔓 Đã mở khóa mọi màn'); });
  on('adTpKey', () => { if (!adminInGame()) return; const k = keyPos(); adminTeleport(k.x - PW / 2, k.y - PH / 2); show('adminModal', false); });
  on('adTpExit', () => { if (!adminInGame()) return; const e = G.L.exit; adminTeleport(e.x + e.w / 2 - PW / 2, e.y + e.h - PH - 2); show('adminModal', false); });
  on('adWin', () => { if (!adminInGame()) return; if (!G.keyGot) collectKey(true, G.myslot); triggerWin(true); show('adminModal', false); });
  on('adKill', () => { if (!adminInGame()) return; respawn(); show('adminModal', false); });
  on('adWipe', () => {
    if (!confirm('Xóa TOÀN BỘ tiến trình trên máy này?')) return;
    Sync.applying = true; Store.keys().forEach((k) => { if (k !== 'tb_mute') Store.del(k); }); Sync.applying = false;
    ensureGuestName(); afterProgressChange(); openAdminPanel(); toast('🗑️ Đã xóa save trên máy');
  });
  on('adOut', () => { Admin.disable(); show('adminModal', false); toast('Đã đăng xuất Admin'); });
  show('adminModal', true);
}

function installAdminTrigger() {
  const title = document.querySelector('#lobby .logo h1') || document.querySelector('#lobby .logo');
  if (!title) return;
  let n = 0, last = 0;
  title.addEventListener('click', () => {
    const now = nowMs();
    n = (now - last < 900) ? n + 1 : 1; last = now;
    if (n >= 5) { n = 0; openAdminEntry(); }
  });
}

function drawDebug() {
  if (!(Role.admin && Role.dbg) || !G.me) return;
  const P = G.me;
  const lines = ['ADMIN DEBUG', 'x ' + P.x.toFixed(0) + '  y ' + P.y.toFixed(0), 'vx ' + P.vx.toFixed(1) + '  vy ' + P.vy.toFixed(1),
    'lt ' + G.lt.toFixed(1) + '  ping ' + G.pingMs, 'parts ' + parts.length + ' / env ' + envParts.length, 'god ' + (Role.god ? 'on' : 'off') + '  mode ' + G.mode];
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '12px monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(8, ch - 14 - lines.length * 15, 200, lines.length * 15 + 8);
  ctx.fillStyle = '#7CFC00';
  lines.forEach((t, i) => ctx.fillText(t, 14, ch - 8 - (lines.length - 1 - i) * 15));
}

function priceText(d) {
  const p = [];
  if (d.coins) p.push('🪙 ' + d.coins);
  if (d.dia) p.push('💎 ' + d.dia);
  return p.length ? p.join(' + ') : 'FREE';
}

function renderShop() {
  const m = $('shopModal'), card = m && m.querySelector('.shop-card');
  if (!card) return;
  const eq = Save.equipped();
  let h = '<div class="shop-header"><div class="shop-title">🥕 BUNNY BOUTIQUE</div>' +
    '<div class="shop-balance">🪙 <span id="shopCoins">0</span></div>' +
    '<div class="shop-balance dia">💎 <span id="shopDiamonds">0</span></div>' +
    '<button class="shop-close" data-act="close" title="Close Shop">&times;</button></div>';
  h += '<div class="shop-xchg"><span>💱 Gold → Diamond</span>' +
    '<button class="skin-btn" data-act="xchg" data-n="1">🪙 ' + DIA_RATE + ' → 💎 1</button>' +
    '<button class="skin-btn" data-act="xchg" data-n="5">🪙 ' + (DIA_RATE * 5) + ' → 💎 5</button></div>';
  ['common', 'rare', 'legendary'].forEach((t) => {
    h += '<div class="shop-section-title tier-' + t + '">' + TIERS[t].label + ' SKINS' + (t === 'legendary' ? ' <span class="tiny">· đổi khung cảnh &amp; kỹ năng nội tại</span>' : '') + '</div><div class="shop-grid">';
    Object.keys(SKINS).filter((id) => SKINS[id].tier === t).forEach((id) => {
      const d = SKINS[id], owned = Save.hasSkin(id), on = owned && eq === id;
      h += '<div class="shop-item tier-' + t + '" data-skin="' + id + '"><div class="tier-tag">' + TIERS[t].label + '</div>' +
        '<div class="skin-preview preview-' + id + '">' + d.icon + '</div>' +
        '<div class="skin-name">' + d.name + '</div>' +
        (t === 'legendary' ? '<div class="skin-desc"><b>🌍 ' + d.env.name + '</b> — ' + d.env.desc + '<br><b>✨ ' + d.passive.name + ':</b> ' + d.passive.desc + '</div>' : '') +
        '<div class="skin-price">' + (owned ? 'OWNED' : priceText(d)) + '</div>' +
        '<button class="skin-btn' + (on ? ' equipped' : '') + '" data-act="skin" data-id="' + id + '">' + (!owned ? 'Buy' : on ? 'Equipped' : 'Equip') + '</button></div>';
    });
    h += '</div>';
  });
  h += '<div class="shop-section-title">POTIONS &amp; BUFFS <span class="tiny">· dùng 1 lần · hết hạn khi hết màn hoặc chết</span></div><div class="shop-grid buffs-grid">';
  Object.keys(BUFFS).forEach((id) => {
    const b = BUFFS[id];
    h += '<div class="shop-item buff-item"><div class="skin-preview">' + b.icon + '</div><div class="skin-name">' + b.name + '</div>' +
      '<div class="skin-desc">' + b.desc + '</div>' +
      '<div class="skin-price">🪙 ' + b.price + ' · Kho ' + (Role.admin ? '∞' : Save.buff(id) + '/' + BUFF_CAP) + '</div>' +
      '<button class="skin-btn" data-act="buff" data-id="' + id + '">Buy charge</button></div>';
  });
  h += '</div><div class="shop-foot">Kích hoạt: phím <b>1</b> = 🛡️ Khiên, phím <b>2</b> = 🦘 Nhảy đôi (E = tự chọn). Trên điện thoại có nút 🛡️ / 🦘 riêng.</div>';
  card.innerHTML = h;
  refreshCoinUI();
}

function openShop() { show('shopModal', true); refreshCoinUI(); refreshShopUI(); const m = $('shopModal'); if (m) m.style.zIndex = '40'; }
function closeShop() { show('shopModal', false); setText('lpCoins', Role.admin ? '∞' : Save.coins()); }

function refreshShopUI() {
  const card = document.querySelector('#shopModal .shop-card');
  const top = card ? card.scrollTop : 0;
  renderShop();
  if (card) card.scrollTop = top;
}

function equipSkin(skin) {
  Save.equip(skin); G.skins[G.myslot] = skin;
  if (isNet() && socket && socket.connected) socket.emit('skin', skin);
  refreshFX(); refreshShopUI();
}

function buySkin(id) {
  const d = SKINS[id]; if (!d) return;
  if (Save.hasSkin(id)) {
    equipSkin(id);
    toast(d.passive ? '✨ ' + d.passive.name + ': ' + d.passive.desc : 'Đã trang bị ' + d.name + '!');
    return;
  }
  if (Save.coins() < d.coins) { toast('Không đủ xu! Cần ' + d.coins + ' 🪙'); return; }
  if (Save.diamonds() < d.dia) { toast('Không đủ kim cương! Cần ' + d.dia + ' 💎'); return; }
  if (d.coins) Save.spend(d.coins);
  if (d.dia) Save.spendDiamonds(d.dia);
  Save.addSkin(id); equipSkin(id); Snd.key();
  toast('Mở khóa ' + d.name + '! 🎉' + (d.passive ? '  ✨ ' + d.passive.name : ''));
}

function buyBuff(id) {
  const b = BUFFS[id]; if (!b) return;
  if (Role.admin) { toast('🛠 Admin: Buff miễn phí & vô hạn'); return; }
  if (Save.buff(id) >= BUFF_CAP) { toast('Đã đạt giới hạn tối đa (' + BUFF_CAP + ') ' + b.name); return; }
  if (!Save.spend(b.price)) { toast('Không đủ xu! (' + b.price + ' 🪙)'); return; }
  Save.addBuff(id, 1); Snd.key();
  toast(b.icon + ' Đã mua ' + b.name + '! Trong màn chơi: phím 1 (🛡️) / 2 (🦘), hoặc E.');
  refreshShopUI();
}

function convertGold(n) {
  const cost = DIA_RATE * n;
  if (!Role.admin) {
    if (Save.coins() < cost) { toast('Cần ' + cost + ' 🪙 để đổi ' + n + ' 💎.'); return; }
    Save.spend(cost);
  }
  Save.addDiamonds(n); Snd.key();
  toast('💎 +' + n + ' Kim cương!');
  refreshShopUI();
}

function migrateEconomy() {
  if (Store.get('tb_econ', '') === '8') return;
  let refund = 0;
  Object.keys(BUFFS).forEach((id) => {
    const n = Save.buff(id);
    if (n > BUFF_CAP) { refund += (n - BUFF_CAP) * BUFFS[id].price; Store.set('tb_buff_' + id, String(BUFF_CAP)); }
  });
  if (refund) { Save.addCoins(refund); setTimeout(() => toast('♻️ Hoàn tiền thuốc dư +' + refund + ' 🪙'), 1200); }
  Store.set('tb_econ', '8');
}

function refreshFX() {
  const d = SKINS[Save.equipped()];
  curEnv = (d && d.env) || null;
  curPassive = (d && d.passive) ? d.passive.id : null;
  envParts.length = 0;
  const c = $('passiveChip');
  if (c) {
    if (d && d.passive) { c.textContent = '✨ ' + d.passive.name; c.title = d.passive.desc; c.classList.remove('hidden'); }
    else c.classList.add('hidden');
  }
}

function updateEnvFX(dt) {
  const e = curEnv;
  if (!e || !G.inGame || !G.L) { if (envParts.length) envParts.length = 0; return; }
  const cam = G.cam, vw = cam.vw || 900, vh = cam.vh || 720, k = dt * 60;
  let n = e.rate * dt; n = Math.floor(n) + (Math.random() < n - Math.floor(n) ? 1 : 0);
  while (n-- > 0 && envParts.length < 150) {
    let p;
    if (e.fx === 'embers') p = { x: cam.x + rnd(-30, vw + 30), y: cam.y + vh + 10, vx: rnd(-0.3, 0.9), vy: -rnd(0.7, 2.0), size: rnd(1.4, 3.4), col: ['#ff6a1a', '#ffb347', '#ffe08a'][(Math.random() * 3) | 0], kind: 0 };
    else if (e.fx === 'snow') p = { x: cam.x + rnd(-60, vw + 60), y: cam.y - 12, vx: rnd(-0.5, 0.3), vy: rnd(0.6, 1.5), size: rnd(1.6, 3.8), col: '#ffffff', kind: 0 };
    else if (e.fx === 'petals') p = { x: cam.x + rnd(-60, vw + 60), y: cam.y - 12, vx: rnd(0.2, 1.3), vy: rnd(0.5, 1.3), size: rnd(2.4, 4.2), col: ['#ffb3d1', '#ffd6e6', '#ff8fb8'][(Math.random() * 3) | 0], kind: 3 };
    else if (e.fx === 'bubbles') p = { x: cam.x + rnd(-20, vw + 20), y: cam.y + vh + 10, vx: rnd(-0.2, 0.2), vy: -rnd(0.5, 1.6), size: rnd(2, 6), col: '#d6f6ff', kind: 4 };
    else if (e.fx === 'rain') p = { x: cam.x + rnd(-120, vw + 40), y: cam.y - 20, vx: -2.2, vy: rnd(11, 15), size: 0, col: '#bcd4ff', kind: 5 };
    else if (e.fx === 'sparks') p = { x: cam.x + rnd(-20, vw + 20), y: cam.y + vh + 10, vx: rnd(-0.3, 0.3), vy: -rnd(0.8, 2.2), size: rnd(1.5, 3), col: ['#ff2bd6', '#00ffe0', '#ffffff'][(Math.random() * 3) | 0], kind: 2 };
    else p = { x: cam.x + rnd(0, vw), y: cam.y + rnd(0, vh), vx: rnd(-0.1, 0.1), vy: rnd(-0.1, 0.1), size: rnd(1.6, 3.6), col: ['#ffffff', '#ffe9a8', '#c9b8ff'][(Math.random() * 3) | 0], kind: 1 };
    p.life = p.max = p.kind === 5 ? rnd(0.7, 1.1) : rnd(2, 4.5); p.ph = rnd(0, 6.3);
    envParts.push(p);
  }
  for (let i = envParts.length - 1; i >= 0; i--) {
    const p = envParts[i]; p.life -= dt;
    if (p.life <= 0 || p.y < cam.y - 80 || p.y > cam.y + vh + 80) { envParts.splice(i, 1); continue; }
    p.x += (p.vx + Math.sin(G.lt * 2 + p.ph) * 0.25) * k; p.y += p.vy * k;
  }
}

function drawEnvFX() {
  if (!curEnv || !envParts.length) return;
  ctx.save();
  ctx.globalCompositeOperation = (curEnv.fx === 'embers' || curEnv.fx === 'stars' || curEnv.fx === 'sparks') ? 'lighter' : 'source-over';
  for (const p of envParts) {
    ctx.globalAlpha = clamp(Math.sin(Math.PI * clamp(p.life / p.max, 0, 1)), 0, 1) * 0.9;
    ctx.fillStyle = p.col;
    if (p.kind === 1) {
      const s = p.size * (0.7 + 0.3 * Math.sin(G.lt * 5 + p.ph));
      ctx.fillRect(p.x - s * 2, p.y - 0.5, s * 4, 1); ctx.fillRect(p.x - 0.5, p.y - s * 2, 1, s * 4);
      ctx.beginPath(); ctx.arc(p.x, p.y, s * 0.6, 0, 6.3); ctx.fill();
    } else if (p.kind === 2) {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else if (p.kind === 3) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ph + G.lt * 2);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, 6.3); ctx.fill(); ctx.restore();
    } else if (p.kind === 4) {
      ctx.strokeStyle = 'rgba(220,250,255,.85)'; ctx.fillStyle = 'rgba(200,240,255,.12)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.fill(); ctx.stroke();
    } else if (p.kind === 5) {
      ctx.strokeStyle = p.col; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 1.4, p.y - p.vy * 1.4); ctx.stroke();
    } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.fill(); }
  }
  ctx.restore();
}

function drawEnvTint() {
  if (!curEnv) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = curEnv.tint; ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function spawnSkinTrails() {
  if (!G.inGame || !G.me) return;
  const me0 = G.me;
  if (!me0.dead) {
    if (timedOn(me0, 'speed') && Math.abs(me0.vx) > 1 && Math.random() < 0.5) sparkle(me0.x + PW / 2 - Math.sign(me0.vx) * 10, me0.y + PH * 0.7 + rnd(-6, 6), 1, 0.4, '#ffd43b');
    if (timedOn(me0, 'jumpboost') && !me0.onGround && Math.random() < 0.4) sparkle(me0.x + PW / 2 + rnd(-6, 6), me0.y + PH, 1, 0.4, '#8ce99a');
    if (timedOn(me0, 'magnet') && Math.random() < 0.2) sparkle(me0.x + PW / 2 + rnd(-18, 18), me0.y + PH / 2 + rnd(-18, 18), 1, 0.4, '#ff8787');
  }
  const ents = [];
  if (!G.me.dead) ents.push({ x: G.me.x, y: G.me.y, sp: Math.hypot(G.me.vx, G.me.vy), skin: G.skins[G.me.slot] || Save.equipped(), p: 0.3 });
  for (const r of G.remotes.values()) if (!r.dead) ents.push({ x: r.x, y: r.y, sp: Math.hypot(r.tvx, r.tvy), skin: G.skins[r.slot], p: 0.2 });
  for (const e of ents) {
    const d = SKINS[e.skin];
    if (!d || d.tier !== 'legendary') continue;
    if (e.sp < 1.2 ? Math.random() > 0.08 : Math.random() > e.p) continue;
    sparkle(e.x + PW / 2 + rnd(-8, 8), e.y + PH * 0.6 + rnd(-10, 10), 1, 0.35, d.trail[(Math.random() * d.trail.length) | 0]);
  }
}

const SKY_LEGEND = { ember: 1, frost: 1, cosmic: 1, sakura: 1, ocean: 1, storm: 1, neon: 1 };
function drawLegendSky(theme, cam, T) {
  const L = G.L;
  if (theme === 'sakura' || theme === 'ocean' || theme === 'storm' || theme === 'neon') { drawLegendSky2(theme, cam, T); return; }
  if (theme === 'ember') {
    const sx = cw * 0.7 - cam.x * 0.01, sy = ch * 0.34, r = Math.min(cw, ch) * 0.15;
    let g = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 4);
    g.addColorStop(0, 'rgba(255,140,40,.65)'); g.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    g = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, r * 0.1, sx, sy, r);
    g.addColorStop(0, '#fff6c2'); g.addColorStop(0.6, '#ff9a2e'); g.addColorStop(1, '#e2410f');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.fill();
    for (let v = 0; v < 2; v++) {
      const f = 0.04 + v * 0.05, base = ch * (0.8 + v * 0.04), span = cw * 0.9, off = -((cam.x * f) % span);
      const col = v ? '#2a0a06' : '#431109';
      for (let i = -1; i < 3; i++) {
        const cx0 = off + i * span + cw * (0.25 + v * 0.2), w = cw * 0.36, h = ch * (0.2 - v * 0.04);
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx0 - w / 2, base); ctx.lineTo(cx0 - w * 0.07, base - h); ctx.lineTo(cx0 + w * 0.07, base - h); ctx.lineTo(cx0 + w / 2, base); ctx.closePath(); ctx.fill();
        const lg = ctx.createRadialGradient(cx0, base - h, 0, cx0, base - h, w * 0.35);
        lg.addColorStop(0, 'rgba(255,120,30,.55)'); lg.addColorStop(1, 'rgba(255,120,30,0)');
        ctx.fillStyle = lg; ctx.fillRect(cx0 - w * 0.4, base - h - w * 0.4, w * 0.8, w * 0.8);
      }
    }
    drawSkyCloudLayer(L, cam, 0.05, ch * 0.08, 1.4, 'rgba(60,15,10,.45)', 4);
    drawSkyCloudLayer(L, cam, 0.12, ch * 0.22, 1.1, 'rgba(90,25,15,.4)', 4);
  } else if (theme === 'frost') {
    drawStars(cam, T, 0.55);
    const mx = cw * 0.25 - cam.x * 0.008, my = ch * 0.2, r = Math.min(cw, ch) * 0.1;
    let g = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 3.2);
    g.addColorStop(0, 'rgba(200,235,255,.5)'); g.addColorStop(1, 'rgba(200,235,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#f4fbff'; ctx.beginPath(); ctx.arc(mx, my, r, 0, 6.3); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let rb = 0; rb < 2; rb++) {
      const base = ch * (0.2 + rb * 0.1), c1 = rb ? '170,120,255' : '80,255,200';
      const ag = ctx.createLinearGradient(0, base - ch * 0.1, 0, base + ch * 0.25);
      ag.addColorStop(0, 'rgba(' + c1 + ',0)'); ag.addColorStop(0.5, 'rgba(' + c1 + ',.3)'); ag.addColorStop(1, 'rgba(' + c1 + ',0)');
      ctx.fillStyle = ag; ctx.beginPath();
      for (let x = 0; x <= cw + 14; x += 14) { const y = base + Math.sin(x * 0.006 + T * 0.4 + rb * 2 - cam.x * 0.0005) * ch * 0.05; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      for (let x = cw + 14; x >= 0; x -= 14) ctx.lineTo(x, base + ch * 0.22 + Math.sin(x * 0.008 + T * 0.3 + rb) * ch * 0.04);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    drawSkyCloudLayer(L, cam, 0.06, ch * 0.12, 1.3, 'rgba(220,240,255,.35)', 4);
    drawSkyCloudLayer(L, cam, 0.16, ch * 0.3, 1.0, 'rgba(235,248,255,.5)', 4);
  } else {
    drawStars(cam, T, 1);
    [[0.25, 0.3, 'rgba(150,60,255,.35)', 0.5], [0.7, 0.45, 'rgba(60,120,255,.3)', 0.55], [0.5, 0.15, 'rgba(255,80,200,.2)', 0.4]].forEach((n, i) => {
      const nx = (((n[0] * cw - cam.x * 0.02 + Math.sin(T * 0.05 + i) * 40) % (cw * 1.4)) + cw * 1.4) % (cw * 1.4) - cw * 0.2, ny = n[1] * ch + Math.cos(T * 0.04 + i) * 20, nr = Math.max(cw, ch) * n[3];
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      ng.addColorStop(0, n[2]); ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng; ctx.fillRect(0, 0, cw, ch);
    });
    const px = cw * 0.78 - cam.x * 0.015, py = ch * 0.3, pr = Math.min(cw, ch) * 0.12;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.35);
    ctx.lineWidth = pr * 0.12; ctx.strokeStyle = 'rgba(255,220,160,.55)';
    ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.9, pr * 0.5, 0, Math.PI, 2 * Math.PI); ctx.stroke();
    const pg = ctx.createRadialGradient(-pr * 0.35, -pr * 0.35, pr * 0.1, 0, 0, pr);
    pg.addColorStop(0, '#ffd6a5'); pg.addColorStop(0.6, '#c77dff'); pg.addColorStop(1, '#4a1a8c');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, pr, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, pr * 1.9, pr * 0.5, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
    drawShootingStars(T);
  }
}

function drawLegendSky2(theme, cam, T) {
  const L = G.L;
  if (theme === 'sakura') {
    const sx = cw * 0.3 - cam.x * 0.01, sy = ch * 0.3, r = Math.min(cw, ch) * 0.13;
    let g = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 3.5);
    g.addColorStop(0, 'rgba(255,235,220,.6)'); g.addColorStop(1, 'rgba(255,200,220,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#fff4e6'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.fill();
    const mx = cw * 0.62 - cam.x * 0.02, mb = ch * 0.82, mw = cw * 0.55, mh = ch * 0.34;
    ctx.fillStyle = '#7a3a78'; ctx.beginPath(); ctx.moveTo(mx - mw / 2, mb); ctx.lineTo(mx - mw * 0.06, mb - mh); ctx.lineTo(mx + mw * 0.06, mb - mh); ctx.lineTo(mx + mw / 2, mb); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff0f6'; ctx.beginPath(); ctx.moveTo(mx - mw * 0.06, mb - mh); ctx.lineTo(mx + mw * 0.06, mb - mh); ctx.lineTo(mx + mw * 0.13, mb - mh * 0.74); ctx.lineTo(mx + mw * 0.05, mb - mh * 0.8); ctx.lineTo(mx, mb - mh * 0.72); ctx.lineTo(mx - mw * 0.05, mb - mh * 0.8); ctx.lineTo(mx - mw * 0.13, mb - mh * 0.74); ctx.closePath(); ctx.fill();
    drawSkyCloudLayer(L, cam, 0.06, ch * 0.1, 1.3, 'rgba(255,200,225,.35)', 4);
    for (let v = 0; v < 2; v++) {
      const f = 0.05 + v * 0.07, span = cw * 0.5, off = -((cam.x * f) % span), base = ch * (0.86 + v * 0.04);
      for (let i = -1; i < 4; i++) {
        const tx = off + i * span + span * 0.5, sc = (i & 1 ? 1.15 : 0.9) * (v ? 1.15 : 0.85);
        ctx.fillStyle = v ? '#3a1530' : '#52203f'; ctx.fillRect(tx - 5 * sc, base - 70 * sc, 10 * sc, 70 * sc);
        ctx.fillStyle = v ? 'rgba(235,110,160,.8)' : 'rgba(255,150,190,.6)';
        [[0, -88, 34], [-26, -70, 26], [26, -72, 28], [-8, -108, 24]].forEach((b) => { ctx.beginPath(); ctx.arc(tx + b[0] * sc, base + b[1] * sc, b[2] * sc, 0, 6.3); ctx.fill(); });
      }
    }
  } else if (theme === 'ocean') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x0 = ((i * 0.2 * cw - cam.x * 0.02 + Math.sin(T * 0.2 + i) * 30) % (cw * 1.3) + cw * 1.3) % (cw * 1.3) - cw * 0.15, w = cw * 0.06 + (i % 3) * 14;
      const g = ctx.createLinearGradient(0, 0, 0, ch * 0.9);
      g.addColorStop(0, 'rgba(160,240,255,.28)'); g.addColorStop(1, 'rgba(160,240,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + w, 0); ctx.lineTo(x0 + w - cw * 0.12, ch * 0.9); ctx.lineTo(x0 - cw * 0.12, ch * 0.9); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let s = 0; s < 3; s++) {
      const sp = 14 + s * 9, y0 = ch * (0.28 + s * 0.17), dir = s % 2 ? -1 : 1;
      for (let k = 0; k < 5; k++) {
        const x = (((T * sp * dir + k * cw * 0.28 + s * 113 - cam.x * (0.03 + s * 0.02)) % (cw * 1.4)) + cw * 1.4) % (cw * 1.4) - cw * 0.2;
        const y = y0 + Math.sin(T * 1.3 + k + s) * 8 + (k % 2) * 18, wag = Math.sin(T * 8 + k) * 2;
        ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
        ctx.fillStyle = 'rgba(10,60,110,' + (0.35 + s * 0.1) + ')';
        ctx.beginPath(); ctx.ellipse(0, 0, 14 - s * 2, 6 - s, 0, 0, 6.3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-12 + s, 0); ctx.lineTo(-22 + s, -6 + wag); ctx.lineTo(-22 + s, 6 + wag); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    const step = cw * 0.17, koff = -((cam.x * 0.09) % step);
    ctx.lineCap = 'round';
    for (let i = -1; i < Math.ceil(cw / step) + 2; i++) {
      const kx = koff + i * step, kh = ch * (0.18 + 0.1 * (i & 1)), base = ch * 0.92, sw = Math.sin(T * 1.2 + i) * 14;
      ctx.strokeStyle = 'rgba(20,110,90,.55)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(kx, base); ctx.quadraticCurveTo(kx + sw, base - kh * 0.5, kx - sw * 0.4, base - kh); ctx.stroke();
    }
  } else if (theme === 'storm') {
    drawSkyCloudLayer(L, cam, 0.04, ch * 0.02, 1.8, 'rgba(30,36,60,.75)', 5);
    drawSkyCloudLayer(L, cam, 0.09, ch * 0.14, 1.5, 'rgba(48,56,84,.7)', 5);
    const per = 6.5, ph = T % per, idx = Math.floor(T / per);
    const fl = ph < 0.14 ? 1 - ph / 0.14 : (ph > 0.32 && ph < 0.42 ? 0.55 * (1 - (ph - 0.32) / 0.1) : 0);
    if (fl > 0) {
      let bx = cw * (0.15 + 0.7 * hash1(idx * 13 + 1)), by = 0;
      ctx.save(); ctx.strokeStyle = 'rgba(235,240,255,' + (0.4 + fl * 0.6) + ')'; ctx.lineWidth = 3; ctx.shadowColor = '#bcd0ff'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.moveTo(bx, by);
      for (let k = 1; k <= 9; k++) { bx += (hash1(idx * 31 + k) - 0.5) * cw * 0.07; by = k * ch * 0.085; ctx.lineTo(bx, by); }
      ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(220,230,255,' + (fl * 0.28) + ')'; ctx.fillRect(0, 0, cw, ch);
    }
    drawSkyCloudLayer(L, cam, 0.16, ch * 0.3, 1.2, 'rgba(24,28,48,.6)', 4);
  } else {
    drawStars(cam, T, 0.5);
    const sx = cw * 0.5 - cam.x * 0.008, sy = ch * 0.42, r = Math.min(cw, ch) * 0.2;
    const g = ctx.createLinearGradient(0, sy - r, 0, sy + r);
    g.addColorStop(0, '#fff27a'); g.addColorStop(0.55, '#ff5fa2'); g.addColorStop(1, '#b537f2');
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.3); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(20,0,40,.9)';
    for (let i = 0; i < 6; i++) ctx.fillRect(sx - r, sy + r * 0.05 + i * r * 0.17, r * 2, 2 + i * 1.6);
    ctx.restore();
    for (let v = 0; v < 2; v++) {
      const f = 0.05 + v * 0.08, span = cw * 0.12, base = ch * (0.86 + v * 0.03), off = -((cam.x * f) % span), i0 = Math.floor(cam.x * f / span);
      for (let i = -1; i < Math.ceil(cw / span) + 2; i++) {
        const id = i + i0, bh = ch * (0.12 + 0.2 * hash1(id * 5 + v * 91)) * (v ? 0.8 : 1.2), bw = span * 0.9, bx = off + i * span;
        ctx.fillStyle = v ? '#14052e' : '#220a45'; ctx.fillRect(bx, base - bh, bw, bh);
        ctx.fillStyle = v ? 'rgba(0,255,230,.55)' : 'rgba(255,60,200,.6)';
        for (let wy = 0; wy < bh - 8; wy += 14) for (let wx = 5; wx < bw - 6; wx += 12) if (hash1(id * 97 + wy * 3 + wx) > 0.62) ctx.fillRect(bx + wx, base - bh + wy + 4, 3, 4);
        ctx.fillStyle = v ? '#00ffe0' : '#ff3cc8'; ctx.fillRect(bx, base - bh, bw, 2);
      }
    }
    drawShootingStars(T);
  }
}

function drawDiamond(c) {
  const t = G.lt * 3 + c.id;
  ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 0.8) * 4);
  if (c.got) { ctx.globalAlpha = c.pop * 2; ctx.translate(0, -(0.5 - c.pop) * 60); }
  const gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
  gl.addColorStop(0, 'rgba(120,230,255,.55)'); gl.addColorStop(1, 'rgba(120,230,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.3); ctx.fill();
  ctx.scale(0.78 + 0.22 * Math.abs(Math.cos(t)), 1);
  ctx.fillStyle = '#7ee8ff'; ctx.strokeStyle = '#1b8fb5'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(13, -5); ctx.lineTo(0, 15); ctx.lineTo(-13, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(-6, -5); ctx.lineTo(0, -2); ctx.lineTo(6, -5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(27,143,181,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-13, -5); ctx.lineTo(13, -5); ctx.moveTo(0, -2); ctx.lineTo(0, 15); ctx.stroke();
  ctx.restore();
}

function diamondIndex(mode, lvIdx, n) {
  if (n < 2 || lvIdx < 0) return -1;
  const off = { solo: 0, coop: 1, party: 2 }[mode] || 0;
  if (hash1(lvIdx * 31 + off * 977 + 5) > 0.5) return -1;
  return Math.floor(hash1(lvIdx * 17 + off * 131 + 9) * n) % n;
}

function drawSkinAccentsOld(skin, t, bob) {
  if (skin === 'cocoa') {
    ctx.fillStyle = '#d62839'; ctx.fillRect(-13, -17 + bob, 26, 5);
    ctx.fillStyle = '#9d0208'; ctx.fillRect(-13, -13 + bob, 26, 1.5);
  } else if (skin === 'crystal') {
    ctx.save(); ctx.fillStyle = '#e8fbff'; ctx.strokeStyle = '#2b9bd1'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -42 + bob); ctx.lineTo(4.5, -37.5 + bob); ctx.lineTo(0, -32 + bob); ctx.lineTo(-4.5, -37.5 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  } else if (skin === 'phoenix') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const au = ctx.createRadialGradient(0, -18 + bob, 4, 0, -18 + bob, 34);
    au.addColorStop(0, 'rgba(255,140,40,.35)'); au.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = au; ctx.beginPath(); ctx.arc(0, -18 + bob, 34, 0, 6.3); ctx.fill();
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const len = 11 + Math.sin(t * 9 + i * 2) * 4, y0 = -8 + bob - i * 3.5;
      ctx.fillStyle = i === 0 ? '#e8590c' : i === 1 ? '#ff922b' : '#ffd43b';
      ctx.beginPath(); ctx.moveTo(-13, y0 + 4); ctx.quadraticCurveTo(-13 - len * 0.6, y0 - 4, -14 - len, y0 + Math.sin(t * 11 + i) * 2); ctx.quadraticCurveTo(-13 - len * 0.5, y0 + 6, -13, y0 + 4); ctx.fill();
    }
  } else if (skin === 'aurora') {
    const hu = (t * 70) % 360;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'hsla(' + hu + ',90%,70%,.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, -60 + bob, 11, 3.4, 0, 0, 6.3); ctx.stroke();
    ctx.restore();
  } else if (skin === 'cosmic') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cg = ctx.createRadialGradient(0, -18 + bob, 4, 0, -18 + bob, 36);
    cg.addColorStop(0, 'rgba(140,100,255,.35)'); cg.addColorStop(1, 'rgba(140,100,255,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, -18 + bob, 36, 0, 6.3); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const a = t * 2.2 + i * 2.094, ox = Math.cos(a) * 25, oy = -20 + bob + Math.sin(a) * 11, s = 3 + Math.sin(t * 6 + i) * 0.8;
      ctx.fillStyle = i === 1 ? '#ffe9a8' : '#fff';
      ctx.fillRect(ox - s, oy - 0.6, s * 2, 1.2); ctx.fillRect(ox - 0.6, oy - s, 1.2, s * 2);
      ctx.beginPath(); ctx.arc(ox, oy, 1.4, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }
}

function drawSkinAccents(skin, t, bob) {
  drawSkinAccentsOld(skin, t, bob);
  if (skin === 'mint') {
    ctx.save(); ctx.translate(-9, -34 + bob); ctx.rotate(-0.55);
    ctx.fillStyle = '#74c69d'; ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, -5, 3.6, 7.5, 0, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, -11); ctx.stroke(); ctx.restore();
  } else if (skin === 'panda') {
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(-7.5, -53 + bob, 3.6, 4.2, -0.15, 0, 6.3); ctx.ellipse(7.5, -53 + bob, 3.6, 4.2, 0.15, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(3, -23.5 + bob, 5.9, 0, 6.3); ctx.moveTo(16.4, -23.5 + bob); ctx.arc(10.5, -23.5 + bob, 5.9, 0, 6.3); ctx.stroke();
  } else if (skin === 'ghost') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0, -18 + bob, 4, 0, -18 + bob, 36);
    gg.addColorStop(0, 'rgba(170,190,255,.38)'); gg.addColorStop(1, 'rgba(170,190,255,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, -18 + bob, 36, 0, 6.3); ctx.fill(); ctx.restore();
  } else if (skin === 'blossom') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bg2 = ctx.createRadialGradient(0, -18 + bob, 4, 0, -18 + bob, 36);
    bg2.addColorStop(0, 'rgba(255,170,210,.28)'); bg2.addColorStop(1, 'rgba(255,170,210,0)');
    ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(0, -18 + bob, 36, 0, 6.3); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(-8, -40 + bob);
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566 + t * 0.8;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e85d9b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 3.6, Math.sin(a) * 3.6, 2.8, 0, 6.3); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 6.3); ctx.fill(); ctx.restore();
    for (let i = 0; i < 3; i++) {
      const a = t * 1.8 + i * 2.094;
      ctx.save(); ctx.translate(Math.cos(a) * 24, -20 + bob + Math.sin(a) * 10); ctx.rotate(a * 2);
      ctx.fillStyle = '#ffb3d1'; ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 1.8, 0, 0, 6.3); ctx.fill(); ctx.restore();
    }
  } else if (skin === 'ocean') {
    ctx.save(); ctx.fillStyle = 'rgba(170,235,255,.14)'; ctx.strokeStyle = 'rgba(210,250,255,.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -22 + bob, 18, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -22 + bob, 13.5, 3.6, 4.5); ctx.stroke();
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 2; i++) {
      const bt = (t * 0.7 + i * 0.5) % 1; ctx.globalAlpha = 1 - bt;
      ctx.beginPath(); ctx.arc((i ? 14 : -14) + Math.sin(t * 3 + i) * 3, -30 + bob - bt * 26, 2.2, 0, 6.3); ctx.stroke();
    }
    ctx.restore();
  } else if (skin === 'thunder') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fl = 0.22 + 0.14 * Math.sin(t * 22);
    const tg = ctx.createRadialGradient(0, -18 + bob, 4, 0, -18 + bob, 36);
    tg.addColorStop(0, 'rgba(255,225,90,' + fl + ')'); tg.addColorStop(1, 'rgba(255,225,90,0)');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(0, -18 + bob, 36, 0, 6.3); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#e8a800'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(1, -47 + bob); ctx.lineTo(-4, -38 + bob); ctx.lineTo(0, -38 + bob); ctx.lineTo(-3, -30 + bob); ctx.lineTo(5, -41 + bob); ctx.lineTo(1, -41 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (Math.floor(t * 12) % 3 === 0) {
      ctx.strokeStyle = 'rgba(255,245,160,.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-14, -10 + bob); ctx.lineTo(-20, -16 + bob); ctx.lineTo(-16, -20 + bob); ctx.lineTo(-23, -27 + bob);
      ctx.moveTo(14, -10 + bob); ctx.lineTo(20, -16 + bob); ctx.lineTo(16, -20 + bob); ctx.lineTo(23, -27 + bob); ctx.stroke();
    }
  } else if (skin === 'neon') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ng = ctx.createRadialGradient(0, -18 + bob, 4, 0, -18 + bob, 38);
    ng.addColorStop(0, 'rgba(255,43,214,.30)'); ng.addColorStop(1, 'rgba(255,43,214,0)');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(0, -18 + bob, 38, 0, 6.3); ctx.fill(); ctx.restore();
    ctx.save(); ctx.fillStyle = 'rgba(0,255,230,.45)'; ctx.strokeStyle = '#00ffe0'; ctx.lineWidth = 1.6;
    rr(-2, -28.5 + bob, 18, 9, 4); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

function injectV8Style() {
  if ($('tbV8Style')) return;
  const st = document.createElement('style'); st.id = 'tbV8Style';
  st.textContent = `
    .sm-card{max-height:94vh;overflow-y:auto}
    .sy-help{font-size:13px;color:#5b3a5e;margin:-6px 0 10px;text-align:left}
    .sy-who{font-size:12px;font-weight:700;color:#7a5a7d;margin:-8px 0 10px}
    .sy-label{font-size:13px;font-weight:700;color:#5b3a5e;text-align:left;margin:6px 0}
    .sy-row{display:flex;gap:8px}
    .sy-input{flex:1;min-width:0;font:800 18px monospace;letter-spacing:3px;text-transform:uppercase;border:3px solid #5b3a5e;border-radius:12px;padding:8px 10px;background:#fff;color:#5b3a5e}
    .sy-code{font:800 34px monospace;letter-spacing:8px;color:#5b3a5e;background:#fff3bf;border:3px dashed #c9a800;border-radius:14px;padding:10px 6px;margin:6px 0 8px;user-select:all}
    .sy-sep{height:2px;background:rgba(91,58,94,.18);margin:14px 0 8px}
    .sy-msg{min-height:18px;font-size:13px;font-weight:700;color:#2b8a3e;margin:8px 0;text-align:left}
    .sy-msg.bad,.sy-warn{color:#c92a2a}
    .admin-tag{position:fixed;bottom:4px;left:50%;transform:translateX(-50%);z-index:55;font:700 11px sans-serif;padding:3px 10px;border-radius:10px;border:2px solid #5b3a5e;background:#ffe066;color:#5b3a5e;opacity:.85;cursor:pointer}
    .shop-balance.dia{background:#d0f4ff;color:#0a7ea4}
    .shop-header{flex-wrap:wrap;gap:6px}
    .shop-xchg{display:flex;align-items:center;gap:6px;flex-wrap:wrap;background:#e7f5ff;border:2px dashed #4dabf7;border-radius:12px;padding:6px 8px;margin-top:8px;font-weight:700;font-size:13px}
    .shop-xchg .skin-btn{width:auto;flex:1;min-width:110px}
    .shop-item{position:relative}
    .tier-tag{position:absolute;top:6px;right:8px;font:700 8px var(--pixel,monospace);padding:2px 5px;border-radius:6px;color:#fff;background:#74c69d}
    .shop-item.tier-rare .tier-tag{background:#4dabf7}
    .shop-item.tier-legendary .tier-tag{background:linear-gradient(90deg,#ff9e00,#ff4d6d)}
    .shop-item.tier-rare{border-color:#4dabf7}
    .shop-item.tier-legendary{border-color:#ffb703;background:linear-gradient(160deg,#fff8e1,#ffe9c7)}
    .shop-section-title.tier-rare{color:#1c7ed6}
    .shop-section-title.tier-legendary{color:#e67700}
    .preview-cocoa{background:#a9714b}
    .preview-crystal{background:#bfe9ff;border-color:#4f9ccf;box-shadow:0 0 10px #9fdcff}
    .preview-phoenix{background:#ff9a3c;border-color:#b3300f;box-shadow:0 0 12px #ff6a1a}
    .preview-aurora{background:#9ff3e6;border-color:#2a8f9c;box-shadow:0 0 12px #9ff3e6}
    .preview-cosmic{background:#3b1d8a;border-color:#c9b8ff;box-shadow:0 0 12px #8a6bff}
    .preview-mint{background:#8fe3b0}
    .preview-panda{background:#fff;border-color:#222}
    .preview-ghost{background:#e6ebff;border-color:#8aa0ff;box-shadow:0 0 10px #b8c4ff}
    .preview-blossom{background:#ffc2d9;border-color:#c2457a;box-shadow:0 0 12px #ff9ec4}
    .preview-ocean{background:#7fd3e8;border-color:#0f6e91;box-shadow:0 0 12px #4cc9f0}
    .preview-thunder{background:#ffe066;border-color:#7a5b00;box-shadow:0 0 12px #ffd43b}
    .preview-neon{background:#2a0f4a;border-color:#ff2bd6;box-shadow:0 0 12px #ff2bd6}
  `;
  document.head.appendChild(st);
}

function initV8() {
  injectV8Style();
  const lb = $('lobbyShopBtn'); if (lb && !$('lobbyDiamonds')) lb.insertAdjacentHTML('beforeend', ' &bull; 💎 <span id="lobbyDiamonds">0</span>');
  const hc = $('hudCoins'); if (hc && !$('hudDiamonds')) hc.insertAdjacentHTML('afterend', '<span class="chip-sep">&bull;</span><span id="hudDiamonds" class="hud-coins">💎 0</span>');
  const hr = document.querySelector('.hud-right');
  if (hr && !$('passiveChip')) { const c = document.createElement('div'); c.id = 'passiveChip'; c.className = 'buff-badge hidden'; hr.insertBefore(c, hr.firstChild); }
  if (!$('adminTag')) { const tg = document.createElement('button'); tg.id = 'adminTag'; tg.className = 'admin-tag hidden'; tg.textContent = '🛠 ADMIN'; tg.onclick = openAdminPanel; document.body.appendChild(tg); }

  const sm = $('shopModal');
  if (sm) sm.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b) return;
    Snd.init();
    const a = b.dataset.act;
    if (a === 'close') closeShop();
    else if (a === 'skin') buySkin(b.dataset.id);
    else if (a === 'buff') buyBuff(b.dataset.id);
    else if (a === 'xchg') convertGold(parseInt(b.dataset.n, 10) || 1);
  });
  $('lobbyShopBtn').onclick = openShop;
  $('hudShopBtn').onclick = openShop;

  installAdminTrigger();
  migrateEconomy();
  refreshFX(); refreshCoinUI(); refreshBuffUI(); renderShop();
  storeHook = (k) => Sync.onWrite(k);
  document.addEventListener('visibilitychange', () => { if (document.hidden && Sync.code() && !Sync.conflict && Store.get('tb_sync_dirty', '0') === '1') Sync.push(false); });
  Admin.resume();
  Sync.boot();
}
function addLobbyButtons() {
  const msv = $('modeSelectView');
  if (!msv || $('btnParty')) return;
  const mk = (id, html, bg, fg, shadow, fn) => {
    const b = document.createElement('button');
    b.id = id; b.className = 'btn btn-mode'; b.innerHTML = html;
    b.style.background = bg; b.style.color = fg; b.style.boxShadow = '0 6px 0 ' + shadow; b.style.marginTop = '10px';
    b.onclick = fn; msv.appendChild(b);
  };
  mk('btnParty', '🐰 PARTY XẾP CHỒNG (2-10 người) <span style="font-size:12px;display:block;opacity:.85;font-weight:600">Không nối dây · Nhảy lên đầu nhau leo tường kiểu Pico Park!</span>',
    'linear-gradient(135deg,#b5179e 0%,#7209b7 100%)', '#fff', '#3f0764', () => {
      Snd.init(); G.lobbyMode = 'party'; setText('createBtn', '✨ Tạo phòng Party');
      show('modeSelectView', false); show('coopLobbyView', true);
      const n = $('nameInput'); if (n && !n.value) n.value = Store.get('tb_name', '');
    });
  mk('btnEditor', '🛠️ TỰ TẠO MÀN / LEVEL EDITOR <span style="font-size:12px;display:block;opacity:.85;font-weight:600">Tự vẽ bản đồ hoặc sinh màn ngẫu nhiên vô tận</span>',
    'linear-gradient(135deg,#4cc9f0 0%,#4895ef 100%)', '#03045e', '#0077b6', () => { Snd.init(); openEditor(); });
  mk('btnSaveCode', '💾 MÃ TIẾN TRÌNH <span style="font-size:12px;display:block;opacity:.85;font-weight:600">Sao lưu / khôi phục xu, skin, màn đã qua</span>',
    '#fff3bf', '#5b3a5e', '#c9a800', () => { Snd.init(); openSaveCode(); });
}

// ============================================================================
// LEVEL EDITOR (TRÌNH TẠO MÀN TRỰC QUAN & CHIA SẺ VỚI PHÒNG)
// ============================================================================
let editorActive = false;
let editorTool = 'solid';
let editorLevel = null;
let editorScrollX = 0;

function buildEditorUI() {
  if ($('levelEditorOverlay')) return;
  const st = document.createElement('style');
  st.textContent = `
    .ed-wrap{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;background:#2b2d42;color:#fff;font-family:var(--font,sans-serif)}
    .ed-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#1a1b26;border-bottom:2px solid #3d405b;flex-wrap:wrap}
    .ed-tool{font-size:13px;font-weight:700;padding:6px 10px;border:2px solid #5b3a5e;border-radius:10px;background:#fff;color:#5b3a5e;cursor:pointer}
    .ed-tool.sel{background:#ffe066;border-color:#e65100;transform:scale(1.05)}
    .ed-action{font-size:13px;font-weight:700;padding:6px 12px;border:2px solid #fff;border-radius:10px;cursor:pointer}
    .ed-play{background:#70e000;color:#1a4d00;border-color:#38b000}
    .ed-share{background:#4ea8de;color:#03045e;border-color:#0077b6}
    .ed-close{background:#e63946;color:#fff;border-color:#d90429;margin-left:auto}
    .ed-canvas{flex:1;width:100%;height:100%;cursor:crosshair;touch-action:none}
  `;
  document.head.appendChild(st);
  const el = document.createElement('div');
  el.id = 'levelEditorOverlay'; el.className = 'ed-wrap hidden';
  el.innerHTML = `
    <div class="ed-bar">
      <span style="font-weight:800;color:#ffe066">🛠️ MAP EDITOR</span>
      <button class="ed-tool sel" data-tool="solid">🟩 Đất</button>
      <button class="ed-tool" data-tool="spike">🔺 Gai</button>
      <button class="ed-tool" data-tool="crumble">🟫 Nứt</button>
      <button class="ed-tool" data-tool="spring">🟡 Lò xo</button>
      <button class="ed-tool" data-tool="crusher">🔨 Búa</button>
      <button class="ed-tool" data-tool="plate">🔴 Nút</button>
      <button class="ed-tool" data-tool="flag">⚑ Checkpoint</button>
      <button class="ed-tool" data-tool="key">🔑 Chìa khóa</button>
      <button class="ed-tool" data-tool="exit">🚪 Đích</button>
      <button class="ed-tool" data-tool="eraser">🧹 Xóa</button>
      <button id="edPlayBtn" class="ed-action ed-play">▶ Chơi thử</button>
      <button id="edShareBtn" class="ed-action ed-share">📤 Mời cả phòng</button>
      <button id="edCloseBtn" class="ed-action ed-close">✕ Đóng</button>
    </div>
    <canvas id="editorCanvas" class="ed-canvas"></canvas>
  `;
  document.body.appendChild(el);

  el.querySelectorAll('.ed-tool').forEach((btn) => {
    btn.onclick = () => {
      el.querySelectorAll('.ed-tool').forEach((b) => b.classList.remove('sel'));
      btn.classList.add('sel');
      editorTool = btn.dataset.tool;
    };
  });

  $('edPlayBtn').onclick = () => {
    closeEditor();
    loadLevel(-1, compileEditorLevel());
    toast('▶ Đang chơi thử map tự tạo!');
  };

  $('edShareBtn').onclick = () => {
    if (G.mode !== 'solo') {
      const lvlData = compileEditorLevel();
      netEv({ t: 'custom_lvl', data: lvlData });
      closeEditor();
      loadLevel(-1, lvlData);
      toast('📤 Đã chia sẻ map cho cả phòng cùng chơi!');
    } else {
      toast('⚠️ Hãy tạo phòng Co-op hoặc Party để mời bạn bè!');
    }
  };

  $('edCloseBtn').onclick = closeEditor;
  setupEditorCanvas();
}

function openEditor() {
  buildEditorUI();
  editorActive = true;
  editorLevel = {
    w: 3200, h: WORLD_H,
    solids: [[0, 700, 3200, 200]],
    spikes: [], crumbles: [], springs: [], crushers: [], boulders: [],
    plates: [], gates: [], flags: [{ x: 1000, y: 700 }],
    key: { x: 2600, y: 644 }, exit: { x: 3000, y: 626, w: 54, h: 74 },
    spawn: [80, 664]
  };
  show('levelEditorOverlay', true);
  resizeEditor();
}

function closeEditor() {
  editorActive = false;
  show('levelEditorOverlay', false);
}

function compileEditorLevel() {
  const b = new LB('Custom Map', 'Bản đồ tự tạo bởi người chơi', 180, G.mode === 'coop');
  b.w = editorLevel.w;
  b.solids = editorLevel.solids;
  b.spikes = editorLevel.spikes;
  b.crumbles = editorLevel.crumbles;
  b.springs = editorLevel.springs;
  b.crushers = editorLevel.crushers;
  b.boulders = editorLevel.boulders;
  b.plates = editorLevel.plates;
  b.gates = editorLevel.gates;
  b.ropes = [];
  b.flags = editorLevel.flags.map(f => ({ x: f.x, y: f.y, on: false }));
  b.coins = [{ x: 500, y: 640, id: 0 }, { x: 1500, y: 640, id: 1 }, { x: 2200, y: 640, id: 2 }];
  b.key = editorLevel.key;
  b.exit = editorLevel.exit;
  b.spawn = editorLevel.spawn;
  return b.finish(520, 56);
}

function setupEditorCanvas() {
  const ec = $('editorCanvas');
  if (!ec) return;
  let isDown = false;
  const onPointerDown = (e) => {
    isDown = true;
    handleEditorAction(e.clientX, e.clientY);
  };
  const onPointerMove = (e) => {
    if (isDown) handleEditorAction(e.clientX, e.clientY);
  };
  const onPointerUp = () => { isDown = false; };
  ec.addEventListener('mousedown', onPointerDown);
  ec.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  ec.addEventListener('touchstart', (e) => { if (e.touches.length) onPointerDown(e.touches[0]); }, { passive: false });
  ec.addEventListener('touchmove', (e) => { if (e.touches.length) onPointerMove(e.touches[0]); }, { passive: false });
  window.addEventListener('touchend', onPointerUp);
}

function handleEditorAction(cx, cy) {
  const ec = $('editorCanvas');
  if (!ec || !editorActive || !editorLevel) return;
  const rect = ec.getBoundingClientRect();
  const wx = Math.round((cx - rect.left + editorScrollX) / 30) * 30;
  const wy = Math.round((cy - rect.top) / 30) * 30;
  if (editorTool === 'solid') editorLevel.solids.push([wx, wy, 120, 30]);
  else if (editorTool === 'spike') editorLevel.spikes.push({ x: wx, y: wy - 22, w: 90, h: 22, dir: 'up' });
  else if (editorTool === 'crumble') editorLevel.crumbles.push({ x: wx, y: wy, w: 90, h: 20, st: 0, t: 0, fy: 0 });
  else if (editorTool === 'spring') editorLevel.springs.push({ x: wx, y: wy - 14, w: 56, h: 14, power: 17.5, sq: 0 });
  else if (editorTool === 'crusher') editorLevel.crushers.push({ x: wx, w: 76, h: 130, top: wy - 400, restB: wy - 80, downB: wy, period: 3.0, off: 0, cb: wy - 80, shake: 0 });
  else if (editorTool === 'flag') editorLevel.flags.push({ x: wx, y: wy });
  else if (editorTool === 'key') editorLevel.key = { x: wx, y: wy };
  else if (editorTool === 'exit') editorLevel.exit = { x: wx, y: wy - 74, w: 54, h: 74 };
  else if (editorTool === 'eraser') {
    editorLevel.solids = editorLevel.solids.filter(s => Math.hypot(s[0] - wx, s[1] - wy) > 50);
    editorLevel.spikes = editorLevel.spikes.filter(s => Math.hypot(s.x - wx, s.y - wy) > 50);
    editorLevel.crumbles = editorLevel.crumbles.filter(s => Math.hypot(s.x - wx, s.y - wy) > 50);
    editorLevel.springs = editorLevel.springs.filter(s => Math.hypot(s.x - wx, s.y - wy) > 50);
  }
  drawEditor();
}

function resizeEditor() {
  const ec = $('editorCanvas');
  if (!ec) return;
  ec.width = ec.clientWidth; ec.height = ec.clientHeight;
  drawEditor();
}

function drawEditor() {
  const ec = $('editorCanvas');
  if (!ec || !editorActive || !editorLevel) return;
  const ctx2 = ec.getContext('2d');
  ctx2.clearRect(0, 0, ec.width, ec.height);
  // draw grid
  ctx2.strokeStyle = 'rgba(255,255,255,.08)'; ctx2.lineWidth = 1;
  for (let x = 0; x < ec.width; x += 30) { ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, ec.height); ctx2.stroke(); }
  for (let y = 0; y < ec.height; y += 30) { ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(ec.width, y); ctx2.stroke(); }
  // draw solids
  ctx2.fillStyle = '#6d4c41';
  for (const s of editorLevel.solids) ctx2.fillRect(s[0] - editorScrollX, s[1], s[2], s[3]);
  // draw spikes
  ctx2.fillStyle = '#e63946';
  for (const s of editorLevel.spikes) ctx2.fillRect(s.x - editorScrollX, s.y, s.w, s.h);
  // draw springs
  ctx2.fillStyle = '#ffd54f';
  for (const s of editorLevel.springs) ctx2.fillRect(s.x - editorScrollX, s.y, s.w, s.h);
  // draw crumbles
  ctx2.fillStyle = '#d7b899';
  for (const c of editorLevel.crumbles) ctx2.fillRect(c.x - editorScrollX, c.y, c.w, c.h);
  // draw flags
  ctx2.fillStyle = '#4dabf7';
  for (const f of editorLevel.flags) ctx2.fillRect(f.x - editorScrollX, f.y - 40, 14, 40);
  // draw key & exit
  if (editorLevel.key) { ctx2.fillStyle = '#ffd43b'; ctx2.beginPath(); ctx2.arc(editorLevel.key.x - editorScrollX, editorLevel.key.y, 10, 0, 6.3); ctx2.fill(); }
  if (editorLevel.exit) { ctx2.fillStyle = '#70e000'; ctx2.fillRect(editorLevel.exit.x - editorScrollX, editorLevel.exit.y, editorLevel.exit.w, editorLevel.exit.h); }
}

// BOOT
// ============================================================================
resize();
G.myName = ensureGuestName();
refreshCoinUI();
refreshBuffUI();

const roomParam = (new URLSearchParams(location.search).get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
if (roomParam) {
  show('modeSelectView', false); show('coopLobbyView', true);
  const ci = $('codeInput'); if (ci) ci.value = roomParam;
  setMsg('Room ' + roomParam + ' - enter your name and press Join!');
}

const ni = $('nameInput'); if (ni && !ni.value) ni.value = Store.get('tb_name', '');
document.addEventListener('visibilitychange', () => { if (document.hidden) { kb.l = kb.r = kb.j = kb.b = false; recompute(); } });
buildSettingsModal();
addLobbyButtons();
initV8();
requestAnimationFrame(frame);
})();
