/**
 * Tether Bunnies: Co-op Chaos  --  v5 "RAGE & TROLL" client
 * ---------------------------------------------------------------------------
 *  MODES
 *   - SOLO HARDCORE : single player, no rope, fully offline (no server needed).
 *   - CO-OP CHAOS   : 2-4 players, elastic tether rope, head-stacking, buttons.
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
    },
  };
})();

const Save = {
  unlocked(mode) { return Math.max(1, parseInt(Store.get('tb_unlocked_' + (mode || 'solo'), '1'), 10) || 1); },
  unlock(mode, n) { if (n > this.unlocked(mode)) Store.set('tb_unlocked_' + (mode || 'solo'), n); },
  customLevels() { try { const a = JSON.parse(Store.get('tb_custom_levels', '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
  saveCustomLevel(lvl) { const a = this.customLevels(); a.push(lvl); Store.set('tb_custom_levels', JSON.stringify(a)); },
  coins() { return Math.max(0, parseInt(Store.get('tb_coins', '0'), 10) || 0); },
  addCoins(n) { Store.set('tb_coins', this.coins() + n); refreshCoinUI(); },
  spend(n) { const c = this.coins(); if (c < n) return false; Store.set('tb_coins', c - n); refreshCoinUI(); return true; },
  skins() { try { const a = JSON.parse(Store.get('tb_skins', '["classic"]')); return Array.isArray(a) ? a : ['classic']; } catch (e) { return ['classic']; } },
  hasSkin(s) { return s === 'classic' || this.skins().includes(s); },
  addSkin(s) { const a = this.skins(); if (!a.includes(s)) { a.push(s); Store.set('tb_skins', JSON.stringify(a)); } },
  equipped() { const s = Store.get('tb_equipped_skin', 'classic'); return this.hasSkin(s) ? s : 'classic'; },
  equip(s) { Store.set('tb_equipped_skin', s); },
  buff(b) { return Math.max(0, parseInt(Store.get('tb_buff_' + b, '0'), 10) || 0); },
  addBuff(b, n) { Store.set('tb_buff_' + b, this.buff(b) + n); refreshBuffUI();
buildSettingsModal();

// Add Party Mode button and Editor button to lobby modeSelectView
const msv = $('modeSelectView');
if (msv) {
  let btnParty = $('btnParty');
  if (!btnParty) {
    btnParty = document.createElement('button');
    btnParty.id = 'btnParty';
    btnParty.className = 'btn pri';
    btnParty.style.background = 'linear-gradient(135deg, #b5179e 0%, #7209b7 100%)';
    btnParty.style.color = '#fff';
    btnParty.style.boxShadow = '0 6px 0 #3f0764';
    btnParty.style.marginTop = '10px';
    btnParty.innerHTML = '🐱 PARTY XẾP CHỒNG (2-10 người) <span style="font-size:12px;display:block;opacity:.85;font-weight:600">Không nối dây · Nhảy lên đầu nhau leo tường Roblox/Pico Park!</span>';
    btnParty.onclick = () => {
      Snd.init();
      G.mode = 'party';
      show('modeSelectView', false);
      show('coopLobbyView', true);
      const n = $('nameInput');
      if (n && !n.value) n.value = Store.get('tb_name', '');
    };
    msv.appendChild(btnParty);
  }

  let btnEditor = $('btnEditor');
  if (!btnEditor) {
    btnEditor = document.createElement('button');
    btnEditor.id = 'btnEditor';
    btnEditor.className = 'btn';
    btnEditor.style.background = 'linear-gradient(135deg, #4cc9f0 0%, #4895ef 100%)';
    btnEditor.style.color = '#03045e';
    btnEditor.style.boxShadow = '0 6px 0 #0077b6';
    btnEditor.style.marginTop = '10px';
    btnEditor.innerHTML = '🛠️ TỰ TẠO MÀN / LEVEL EDITOR <span style="font-size:12px;display:block;opacity:.85;font-weight:600">Tự vẽ bản đồ hoặc Tạo Màn Ngẫu Nhiên Vô Tận</span>';
    btnEditor.onclick = () => {
      Snd.init();
      openEditor();
    };
    msv.appendChild(btnEditor);
  }
}
 },
  useBuff(b) { const c = this.buff(b); if (c <= 0) return false; Store.set('tb_buff_' + b, c - 1); refreshBuffUI(); return true; },
  coinsGot(mode, lv) { try { const a = JSON.parse(Store.get('tb_cg_' + mode + '_' + lv, '[]')); return Array.isArray(a) ? a : []; } catch (e) { return []; } },
  markCoin(mode, lv, i) { const a = this.coinsGot(mode, lv); if (!a.includes(i)) { a.push(i); Store.set('tb_cg_' + mode + '_' + lv, JSON.stringify(a)); } },
  best(mode, lv) { const v = parseFloat(Store.get('tb_best_' + mode + '_' + lv, '0')); return v > 0 ? v : 0; },
  setBest(mode, lv, t) { const b = this.best(mode, lv); if (!b || t < b) { Store.set('tb_best_' + mode + '_' + lv, t.toFixed(2)); return true; } return false; },
  cleared(mode, lv) { return this.unlocked(mode) > lv + 1 || this.best(mode, lv) > 0; },
};

function refreshCoinUI() {
  const c = Save.coins();
  setText('lobbyCoins', c); setText('shopCoins', c); setText('hudCoins', '🪙 ' + c);
}

function refreshBuffUI() {
  const dj = Save.buff('doublejump'), sh = Save.buff('shield');
  let str = '';
  if (G && G.me && G.me.shield) str = '🛡️ ACTIVE';
  else if (G && G.me && G.me.dj) str = '🦘 ACTIVE';
  else if (sh > 0) str = '🛡️ Shield x' + sh + ' (E)';
  else if (dj > 0) str = '🦘 2xJump x' + dj + ' (E)';
  const badge = $('buffBadge');
  if (badge) { badge.textContent = str; badge.classList.toggle('hidden', !str); }
  const tb = $('tBuff');
  if (tb) { tb.classList.toggle('hidden', !(str && isTouchDevice)); tb.textContent = (sh > 0 || (G && G.me && G.me.shield)) ? '🛡️' : '🦘'; }
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
    return {
      name: this.name, hint: this.hint, hue: this.hue, coop: this.coop,
      w: this.x, h: WORLD_H, spawn: this.spawn,
      solids: this.solids, spikes: this.spikes, crumbles: this.crumbles, springs: this.springs,
      crushers: this.crushers, boulders: this.boulders, sweepers: this.sweepers,
      plates: this.plates, gates: this.gates, ropes: this.ropes,
      coins: this.coins.map((c, i) => ({ x: c.x, y: c.y, id: i })),
      flags: this.flags.map((f) => ({ x: f.x, y: f.y, on: false })),
      key: this.key || { x: this.x - (keyBack || 520), y: this.gy - (keyUp || 56) },
      exit: { x: this.x - 150, y: this.gy - 74, w: 54, h: 74 },
    };
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
  seg.springWall(b);
  seg.run(b, 560, { flag: true, spikes: [[260, 70]], coins: [[300, -60]] });
  b.gap(140);
  seg.run(b, 300);
  seg.springWall(b, { h: 200 });
  seg.run(b, 460, { spikes: [[200, 64]] });
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 320, { flag: true });
  seg.springWall(b, { h: 210 });
  seg.run(b, 420, { coins: [[210, -60]] });
  b.gap(150);
  seg.run(b, 300);
  seg.springWall(b, { h: 190 });
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
  const x0 = b.ground(420);
  const wallX = x0 + 420;
  b.step(160);
  const x1 = b.ground(520);
  const pId = 'p' + (b.pid++);
  b.plates.push({ id: pId, x: x1 + 60, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.gates.push({ x: wallX - 140, y: b.gy + 60, w: 140, h: 20, ctrl: [pId], mode: 'any', open: false, inv: true });
  b.coin(x1 + 90, b.gy - 70);
  seg.run(b, 500, { flag: true });
  seg.fakes(b, 3, { coins: [1] });
  seg.run(b, 800, { coins: [[300, -60]] });
  return b.finish(520, 56);
});

PTY.push(() => {
  const b = new LB('Cầu Bập Bênh Cân Não', 'Phân chia người đứng hai bên để giữ thăng bằng vượt qua hố gai!', 45, false);
  seg.run(b, 600, { flag: true });
  b.gap(120);
  seg.run(b, 340, { flag: true });
  const x0 = b.ground(700);
  const a = 'p' + (b.pid++), c = 'p' + (b.pid++);
  b.plates.push({ id: a, x: x0 + 100, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.plates.push({ id: c, x: x0 + 500, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.gates.push({ x: x0 + 320, y: b.gy - 340, w: 30, h: 340, ctrl: [a, c], mode: 'all', open: false, inv: false });
  b.coin(x0 + 335, b.gy - 80);
  seg.run(b, 400, { flag: true, spikes: [[180, 60]] });
  seg.fakes(b, 4, { coins: [2] });
  seg.run(b, 800);
  return b.finish(500, 56);
});

PTY.push(() => {
  const b = new LB('Công Tắc Tam Trọng', '3 công tắc ở 3 tầng khác nhau, cần ít nhất 3 bạn dẫm cùng lúc để mở cửa sắt!', 210, false);
  seg.run(b, 640, { flag: true });
  const x0 = b.ground(800);
  const p1 = 'p' + (b.pid++), p2 = 'p' + (b.pid++), p3 = 'p' + (b.pid++);
  b.plates.push({ id: p1, x: x0 + 80, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.solids.push([x0 + 200, b.gy - 80, 100, 18]);
  b.plates.push({ id: p2, x: x0 + 220, y: b.gy - 90, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.solids.push([x0 + 360, b.gy - 160, 100, 18]);
  b.plates.push({ id: p3, x: x0 + 380, y: b.gy - 170, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.gates.push({ x: x0 + 600, y: b.gy - 340, w: 30, h: 340, ctrl: [p1, p2, p3], mode: 'all', open: false, inv: false });
  b.coin(x0 + 410, b.gy - 220);
  seg.run(b, 400, { flag: true });
  seg.crushers(b, 3, { spacing: 240, coins: [1] });
  seg.run(b, 800);
  return b.finish(520, 56);
});

PTY.push(() => {
  const b = new LB('Vách Núi 3 Tầng', 'Vách núi siêu cao 240px! Phải xếp chồng 3-4 bạn thỏ thành tháp sống để với tới đỉnh!', 280, false);
  seg.run(b, 620, { flag: true });
  const x0 = b.ground(460);
  const wallX = x0 + 460;
  b.step(240);
  const x1 = b.ground(600);
  const pId = 'p' + (b.pid++);
  b.plates.push({ id: pId, x: x1 + 80, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.gates.push({ x: wallX - 160, y: b.gy + 100, w: 160, h: 20, ctrl: [pId], mode: 'any', open: false, inv: true });
  b.gates.push({ x: wallX - 80, y: b.gy + 180, w: 80, h: 20, ctrl: [pId], mode: 'any', open: false, inv: true });
  b.coin(x1 + 110, b.gy - 80);
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
  const x0 = b.ground(440);
  const wallX = x0 + 440;
  b.step(180);
  const x1 = b.ground(500);
  const pId = 'p' + (b.pid++);
  b.plates.push({ id: pId, x: x1 + 60, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
  b.gates.push({ x: wallX - 140, y: b.gy + 80, w: 140, h: 20, ctrl: [pId], mode: 'any', open: false, inv: true });
  seg.crushers(b, 3, { spacing: 240, period: 2.7, coins: [1], flag: true });
  seg.boulders(b, 850, { specs: [[60, 800, 3.5, 0]], plats: [[320, -100, 110]], coins: [[370, -170]] });
  seg.fakes(b, 5, { real: [1, 4], dys: [-10, -70, -30, -90, -50] });
  seg.run(b, 900, { coins: [[500, -60]] });
  return b.finish(480, 56);
});

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
    const x0 = b.ground(420);
    const wallX = x0 + 420;
    b.step(160);
    const x1 = b.ground(500);
    const pId = 'p' + (b.pid++);
    b.plates.push({ id: pId, x: x1 + 60, y: b.gy - 10, w: 60, h: 10, hold: 0, t: 0, on: false });
    b.gates.push({ x: wallX - 130, y: b.gy + 60, w: 130, h: 20, ctrl: [pId], mode: 'any', open: false, inv: true });
    b.coin(x1 + 80, b.gy - 60);
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
const F_RIGHT = 1, F_GROUND = 2, F_DEAD = 4, F_ROPE = 16, F_SHIELD = 32, F_INV = 64, F_ANCH = 128;
const G = {
  mode: 'solo', lvIdx: 0, L: null, lt: 0, levelTime: 0,
  inGame: false, won: false, winT: 0, keyGot: false, deaths: 0, finalShown: false,
  me: null, myslot: 0, code: 'SOLO', myName: 'Bunny',
  remotes: new Map(), names: {}, skins: {}, roster: null, hostSlot: 0,
  cam: { x: 0, y: 0, z: 1, snap: true }, shake: 0, pingMs: 0,
  banner: 0, msg: '',
};

const input = { l: false, r: false, j: false, b: false };

function newPlayer(slot) {
  return {
    slot, x: 0, y: 0, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, jbuf: 0,
    jPrev: false, bPrev: false, jumping: false, dead: false, deadT: 0, inv: 0,
    shield: false, dj: false, usedDJ: false, rope: null, ropeCd: 0, cp: { x: 0, y: 0 },
    anch: false, sq: 0, runT: 0, ride: null, wasGround: false, tetherGrace: 0,
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
  if (customLevelObj) {
    G.L = customLevelObj;
    G.lvIdx = -1;
  } else {
    const list = LEVELS[G.mode] || LEVELS.solo;
    idx = clamp(idx | 0, 0, list.length - 1);
    G.lvIdx = idx;
    G.L = list[idx]();
  }
  const L = G.L;
  G.lt = 0; G.levelTime = 0; G.keyGot = false; G.won = false; G.winT = 0; G.deaths = 0; G.finalShown = false;
  const got = G.lvIdx >= 0 ? Save.coinsGot(G.mode, G.lvIdx) : [];
  L.coins.forEach((c) => { c.got = got.includes(c.id); c.pop = 0; });
  L.plates.forEach((p) => { p.t = 0; p.on = false; p.pr = false; });
  L.gates.forEach((g) => { g.act = false; });
  L.ropes.forEach((r) => { r.hs = -1; r.hb = null; });
  L.key.got = false;
  const me = newPlayer(G.myslot);
  me.x = L.spawn[0] + (G.myslot % 4) * 34; me.y = L.spawn[1];
  me.cp = { x: me.x, y: me.y };
  G.me = me;
  for (const r of G.remotes.values()) { r.x = r.tx = L.spawn[0] + (r.slot % 4) * 34; r.y = r.ty = L.spawn[1]; r.vx = r.vy = 0; r.dead = false; r.ropeOn = false; r.recv = nowMs(); }
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
    if (g.mode === 'all') act = g.ctrl.every((id) => L.plates.find((p) => p.id === id).on);
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
      } else if (f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90) {
        me.cp = { x: f.x - PW / 2, y: f.y - PH };
      }
    }
    const cx = me.x + PW / 2, cy = me.y + PH / 2;
    for (const c of L.coins) {
      if (c.pop > 0) c.pop -= STEP;
      if (c.got) continue;
      if (Math.abs(cx - c.x) < 24 && Math.abs(cy - c.y) < 28) {
        c.got = true; c.pop = 0.5; Save.markCoin(G.mode, G.lvIdx, c.id); Save.addCoins(1);
        Snd.coin(); sparkle(c.x, c.y, 10, 1);
      }
    }
    if (!G.keyGot) {
      const k = keyPos();
      if (Math.abs(cx - k.x) < 30 && Math.abs(cy - k.y) < 34) collectKey(true, me.slot);
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
  if (!rectsOverlap(me.x, me.y, PW, PH, e.x, e.y, e.w, e.h)) return;
  if (G.mode !== 'solo') {
    const t = nowMs();
    for (const r of G.remotes.values()) {
      if (t - r.recv > 5000) continue;
      if (r.dead || !rectsOverlap(r.x, r.y, PW, PH, e.x - 14, e.y - 14, e.w + 28, e.h + 28)) {
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
    setTimeout(() => { if (isHostSlot() || G.mode === 'solo') loadLevel(-1, generateRandomLevel(G.mode)); }, 3000);
    return;
  }
  const next = G.lvIdx + 1;
  if (next < list.length) {
    if (G.mode !== 'solo') {
      G.finalShown = true;
      if (isHostSlot()) { netEv({ t: 'lvl', n: next }); loadLevel(next); }
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

function die(cause) {
  const P = G.me;
  if (P.dead || P.inv > 0 || G.won) return;
  if (P.shield) {
    P.shield = false; P.inv = 1.4; P.vy = -8; P.rope = null; Snd.pop(); sparkle(P.x + PW / 2, P.y + PH / 2, 16, 1.5, '#8ff');
    toast('🛡️ Shield popped!'); refreshBuffUI(); return;
  }
  P.dead = true; P.deadT = 0.75; P.rope = null;
  G.deaths++; setText('deaths', '💥 ' + G.deaths);
  Snd.die(); G.shake = Math.max(G.shake, 8);
  sparkle(P.x + PW / 2, P.y + PH / 2, 22, 1.8, COLORS[P.slot % 4]);
  puff(P.x + PW / 2, P.y + PH, 8, '#fff', 1.2);
  netEv({ t: 'die', x: Math.round(P.x), y: Math.round(P.y) });
}

function respawn() {
  const P = G.me, L = G.L;
  let rx = P.cp.x, ry = P.cp.y;
  if (G.mode !== 'solo' && G.remotes.size) {
    let leader = null;
    for (const r of G.remotes.values()) {
      if (!r.dead && (!leader || r.x > leader.x)) leader = r;
    }
    // If teammate is way further ahead than old checkpoint (> 500px), catch up to avoid rubberband death loop
    if (leader && leader.x > rx + 500) {
      rx = Math.max(rx, leader.x - 70);
      ry = leader.y;
    }
  }
  for (const s of L.sweepers) {
    if (rx < s.cx + s.w + 160) {
      let best = null;
      for (const g of L.solids) if (g[0] >= s.cx + s.w + 220 && g[2] >= 200 && (!best || g[0] < best[0])) best = g;
      if (best) { rx = best[0] + 60; ry = best[1] - PH; }
    }
  }
  P.x = rx; P.y = ry; P.vx = P.vy = 0; P.dead = false;
  P.inv = 2.5; // 2.5s invulnerability
  P.tetherGrace = 3.5; // 3.5s zero-tether pull on respawn!
  P.rope = null; P.ropeCd = 20; P.usedDJ = false;
  puff(P.x + PW / 2, P.y + PH, 12, '#fff');
  G.cam.snap = G.cam.snap || (Math.abs(G.cam.x - P.x) > 1400);
}

function useBuff() {
  const P = G.me;
  if (P.dead || G.won) return;
  if (!P.shield && Save.buff('shield') > 0) { Save.useBuff('shield'); P.shield = true; toast('🛡️ Bubble Shield on!'); Snd.pop(); }
  else if (!P.dj && Save.buff('doublejump') > 0) { Save.useBuff('doublejump'); P.dj = true; toast('🦘 Double Jump on for this level!'); Snd.djump(); }
  else if (!P.shield && !P.dj) toast('No potions - visit the 🛍️ shop!');
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
      const f = Math.min(st * 0.008 + (st > 120 ? 0.2 : 0), 1.2);
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
    const sy = s.dir === 'up' ? s.y + 7 : s.y, sh = s.h - 7;
    if (rectsOverlap(hx, hy, hw, hh, s.x + 3, sy, s.w - 6, sh)) return 'spikes';
  }
  for (const c of L.crushers) if (rectsOverlap(hx, hy, hw, hh, c.x + 2, c.cb - c.h, c.w - 4, c.h)) return 'crusher';
  for (const b of L.boulders) {
    const bx = b.cx, by = b.y - b.r;
    const nx = clamp(bx, hx, hx + hw), ny = clamp(by, hy, hy + hh);
    if (Math.hypot(bx - nx, by - ny) < b.r - 4) return 'boulder';
  }
  for (const s of L.sweepers) if (hx < s.cx + s.w - 10 && hx + hw > s.cx) return 'wall';
  if (P.y > WORLD_H + 90) return 'fall';
  return null;
}

function stepPlayer() {
  const P = G.me, L = G.L;
  if (P.dead) { P.deadT -= STEP; if (P.deadT <= 0) respawn(); return; }
  if (P.inv > 0) P.inv -= STEP;
  if (P.tetherGrace > 0) P.tetherGrace -= STEP;
  if (G.won) { P.vx *= 0.8; }
  const ax = G.won ? 0 : (input.r ? 1 : 0) - (input.l ? 1 : 0);

  if (input.j && !P.jPrev && !G.won) P.jbuf = 7;
  P.jPrev = input.j;
  if (input.b && !P.bPrev) useBuff();
  P.bPrev = input.b;
  if (P.rope) { stepRope(P, ax); if (P.jbuf > 0) P.jbuf--; P.anch = false; const h = hazardCheck(P); if (h) die(h); return; }

  if (ax !== 0) {
    const acc = P.onGround ? 1.0 : 0.65;
    const tgt = ax * RUN;
    P.vx += clamp(tgt - P.vx, -acc, acc);
    P.face = ax;
  } else P.vx *= P.onGround ? 0.72 : 0.95;
  if (Math.abs(P.vx) < 0.04) P.vx = 0;
  applyTether(P);

  P.vx = clamp(P.vx, -RUN - 4, RUN + 4);
  P.vy = Math.min(P.vy + GRAV, MAXFALL);

  if (P.onGround) { P.coyote = 6; P.usedDJ = false; } else if (P.coyote > 0) P.coyote--;
  if (P.jbuf > 0) {
    if (P.coyote > 0) {
      const isFromHead = !!P.ride;
      P.vy = isFromHead ? -JUMP * 1.15 : -JUMP; // 15% super jump boost off head!
      P.coyote = 0; P.jbuf = 0; P.jumping = true; P.onGround = false; P.sq = -0.25;
      Snd.jump(P.slot); puff(P.x + PW / 2, P.y + PH, isFromHead ? 6 : 4, isFromHead ? '#ffe066' : '#fff');
    } else if (P.dj && !P.usedDJ && !P.onGround) {
      P.vy = -JUMP * 0.92; P.usedDJ = true; P.jbuf = 0; P.jumping = true; Snd.djump(); sparkle(P.x + PW / 2, P.y + PH, 8, 1, '#9ef');
    } else P.jbuf--;
  }
  if (!input.j && P.jumping && P.vy < -4.2) { P.vy = -4.2; P.jumping = false; }
  if (P.vy >= 0) P.jumping = false;

  const px0 = P.x;
  P.x += P.vx;
  if (P.x < 0) { P.x = 0; P.vx = 0; }
  if (P.x > L.w - PW) { P.x = L.w - PW; P.vx = 0; }
  let hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (P.vx > 0) P.x = s[0] - PW;
    else if (P.vx < 0) P.x = s[0] + s[2];
    else P.x += (P.x + PW / 2 < s[0] + s[2] / 2) ? -1.5 : 1.5;
    P.vx = 0;
  }

  const feet0 = P.y + PH;
  P.y += P.vy;
  P.wasGround = P.onGround; P.onGround = false; P.ride = null; P.anch = false;
  hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (P.vy > 0) {
      P.y = s[1] - PH; P.onGround = true;
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

  if (P.onGround && !P.wasGround) { P.sq = 0.3; Snd.land(); puff(P.x + PW / 2, P.y + PH, 3); }
  P.sq *= 0.82;

  if (P.onGround) {
    for (const p of L.plates) if (standsOn(P, p)) P.anch = true;
    for (const R of L.ropes) for (const p of R.pads) if (standsOn(P, p)) P.anch = true;
  }
  if (P.onGround && Math.abs(P.vx) > 1) { P.runT += Math.abs(P.vx) * 0.06; if (Math.random() < 0.08) puff(P.x + PW / 2, P.y + PH, 1, '#fff', 0.6); }
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
  return f;
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
  r.ropeOn = !!(f & F_ROPE); r.ropeId = f >> 8; r.shield = !!(f & F_SHIELD); r.inv = !!(f & F_INV); r.anch = !!(f & F_ANCH);
}

function ensureSocket() {
  if (socket) return socket;
  if (typeof io !== 'function') return null;
  socket = io({ transports: ['websocket', 'polling'], reconnection: true });
  socket.on('roster', onRoster);
  socket.on('ps', onPositions);
  socket.on('ev', onNetEv);
  socket.on('disconnect', () => { if (G.inGame && G.mode === 'coop') { netLost = true; toast('Connection lost - reconnecting…'); } });
  socket.on('connect', () => {
    if (netLost && G.inGame && G.mode === 'coop') { netLost = false; toast('Room was lost during the disconnect.'); setTimeout(() => { location.href = location.pathname; }, 1200); }
  });
  return socket;
}

function netEv(o) {
  if (G.mode !== 'coop' || !socket || !socket.connected) return;
  o.lv = G.lvIdx;
  socket.emit('ev', o);
}

function onPositions(arr) {
  if (!Array.isArray(arr) || G.mode !== 'coop') return;
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
  if (!e || !G.inGame || G.mode !== 'coop') return;
  switch (e.t) {
    case 'lvl':
      loadLevel(e.n);
      break;
    case 'cp':
      if (e.lv === G.lvIdx) {
        G.me.cp = { x: e.x, y: e.y };
        if (G.L && G.L.flags && G.L.flags[e.fi]) G.L.flags[e.fi].on = true;
        sparkle(e.x + PW / 2, e.y + PH / 2, 14, 1, '#7cf');
        toast('⚑ ' + (G.names[e.s] || 'Đồng đội') + ' đã mở Checkpoint!');
      }
      break;
    case 'restart':
      if (e.lv === G.lvIdx) {
        loadLevel(e.lv);
        toast('🔄 Chủ phòng đã khởi động lại màn!');
      }
      break;
    case 'custom_lvl':
      if (e.data) {
        loadLevel(-1, e.data);
        toast('🗺️ Đã tải màn chơi từ ' + (G.names[e.s] || 'Chủ phòng') + '!');
      }
      break;
    case 'key': if (e.lv === G.lvIdx) collectKey(false, e.s); break;
    case 'keyst': if (e.lv === G.lvIdx && e.v && !G.keyGot) { G.keyGot = true; const ks = $('keyStat'); if (ks) { ks.textContent = '🔑 ✓'; ks.classList.add('got'); } } break;
    case 'win': if (e.lv === G.lvIdx) triggerWin(false); break;
    case 'die':
      if (e.lv === G.lvIdx) {
        const col = COLORS[(e.s | 0) % 4];
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
}

function updatePlayerList() {
  const el = $('playerList'); if (!el) return;
  el.innerHTML = '';
  if (G.mode !== 'coop') return;
  const slots = [G.myslot, ...G.remotes.keys()].sort((a, b) => a - b);
  slots.forEach((s) => {
    const d = document.createElement('div'); d.className = 'pchip';
    const i = document.createElement('i'); i.style.background = COLORS[s % 4];
    const sp = document.createElement('span'); sp.textContent = (G.names[s] || 'Bunny') + (s === G.myslot ? ' (you)' : '') + (s === G.hostSlot ? ' ★' : '');
    d.appendChild(i); d.appendChild(sp); el.appendChild(d);
  });
}

function sendPos(now) {
  if (G.mode !== 'coop' || !socket || !socket.connected || !G.me) return;
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
    const px = r.x;
    if (Math.abs(ex - r.x) > 380 || Math.abs(ey - r.y) > 380) { r.x = ex; r.y = ey; }
    else { r.x += (ex - r.x) * k; r.y += (ey - r.y) * k; }
    r.dx = r.x - px;
    r.runT += Math.abs(r.dx) * 0.06;
    r.sq *= 0.85;
  }
}

setInterval(() => {
  if (!socket || !socket.connected || G.mode !== 'coop') return;
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
  if (!LV_META[mode]) LV_META[mode] = LEVELS[mode].map((f) => { const L = f(); return { name: L.name, w: L.w, coins: L.coins.length }; });
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

function showPicker(mode) {
  buildPicker();
  const meta = levelMeta(mode), un = Save.unlocked(mode);
  setText('lpTitle', mode === 'solo' ? '🌟 SOLO HARDCORE — choose a level' : '🤝 CO-OP CHAOS');
  setText('lpCoins', Save.coins());
  const grid = $('lpGrid'); grid.innerHTML = '';
  meta.forEach((m, i) => {
    const locked = i + 1 > un, cleared = Save.cleared(mode, i), best = Save.best(mode, i);
    const b = document.createElement('button');
    b.className = 'lp-cell' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '');
    b.innerHTML = '<div class=\"lp-num\"></div><div class=\"lp-name\"></div><div class=\"lp-meta\"></div>' + (locked ? '<div class=\"lp-lock\">🔒</div>' : cleared ? '<div class=\"lp-lock\">⭐</div>' : '');
    b.children[0].textContent = String(i + 1);
    b.children[1].textContent = m.name;
    b.children[2].textContent = locked ? 'Beat level ' + i + ' first' : (best ? '⏱ ' + best.toFixed(1) + 's' : 'Not cleared') + ' · 🪙 ' + Save.coinsGot(mode, i).length + '/' + m.coins;
    b.onclick = () => { if (locked) { toast('🔒 Beat level ' + i + ' to unlock!'); return; } Snd.init(); show('levelPicker', false); beginGame(mode, i); };
    grid.appendChild(b);
  });
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
  if (G.mode === 'coop') { location.href = location.pathname; return; }
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
  G.mode = 'coop'; G.myslot = res.slot; G.code = res.code; G.myName = myNameValue();
  G.remotes.clear(); G.hostSlot = res.host !== undefined ? res.host : res.slot;
  setText('roomCode', res.code);
  try { history.replaceState(null, '', location.pathname + '?room=' + res.code); } catch (e) {}
  beginGame('coop', creator ? 0 : (res.lv | 0));
  if (creator) netEv({ t: 'lvl', n: 0 });
  toast('Room ' + res.code + ' - share the link!');
}

function doCreate() {
  Snd.init();
  const s = ensureSocket(); if (!s) { setMsg('Cannot reach the game server.'); return; }
  setMsg('Creating room…');
  s.emit('create', { name: myNameValue(), skin: Save.equipped(), mode: 'coop' }, (res) => {
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
$('btnCoop').onclick = () => { Snd.init(); show('modeSelectView', false); show('coopLobbyView', true); const n = $('nameInput'); if (n && !n.value) n.value = Store.get('tb_name', ''); };
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
$('restartBtn').onclick = () => { changeLevel(G.lvIdx); $('restartBtn').blur(); };
$('muteBtn').onclick = () => { Snd.init(); $('muteBtn').textContent = Snd.toggleMute() ? '🔇' : '🔊'; $('muteBtn').blur(); };
$('muteBtn').textContent = Snd.isMuted() ? '🔇' : '🔊';
$('fsBtn').onclick = () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
  else (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
  $('fsBtn').blur();
};
$('lvSelect').onchange = (e) => { changeLevel(+e.target.value); e.target.blur(); };

function changeLevel(n) {
  if (!G.inGame) return;
  if (n + 1 > Save.unlocked(G.mode)) { toast('🔒 Locked - beat the previous level first'); rebuildLevelSelect(); return; }
  if (G.mode === 'coop') netEv({ t: 'lvl', n });
  loadLevel(n);
}

function openShop() { show('shopModal', true); refreshCoinUI(); refreshShopUI(); const m = $('shopModal'); if (m) m.style.zIndex = '40'; }
function closeShop() { show('shopModal', false); setText('lpCoins', Save.coins()); }

function refreshShopUI() {
  const eq = Save.equipped();
  document.querySelectorAll('.shop-item[data-skin]').forEach((el) => {
    const skin = el.dataset.skin, btn = el.querySelector('.skin-btn');
    const owned = Save.hasSkin(skin);
    btn.textContent = !owned ? 'Buy' : (eq === skin ? 'Equipped' : 'Equip');
    btn.className = 'skin-btn' + (owned && eq === skin ? ' equipped' : '');
  });
}

function equipSkin(skin) {
  Save.equip(skin); G.skins[G.myslot] = skin;
  if (G.mode === 'coop' && socket && socket.connected) socket.emit('skin', skin);
  refreshShopUI();
}

document.querySelectorAll('.shop-item[data-skin]').forEach((el) => {
  const skin = el.dataset.skin, btn = el.querySelector('.skin-btn');
  btn.onclick = () => {
    Snd.init();
    if (Save.hasSkin(skin)) { equipSkin(skin); toast('Equipped ' + skin + '!'); return; }
    const cost = SKIN_PRICE[skin] || 20;
    if (Save.spend(cost)) { Save.addSkin(skin); equipSkin(skin); toast('Unlocked ' + skin + ' skin! 🎉'); Snd.key(); }
    else toast('Not enough coins! Collect 🪙 in levels (need ' + cost + ').');
  };
});

$('buyDoubleJumpBtn').onclick = () => { Snd.init(); if (Save.spend(10)) { Save.addBuff('doublejump', 1); toast('Double Jump potion bought! Press E in a level. 🦘'); } else toast('Not enough coins! (10 🪙)'); };
$('buyShieldBtn').onclick = () => { Snd.init(); if (Save.spend(15)) { Save.addBuff('shield', 1); toast('Bubble Shield bought! Press E in a level. 🛡️'); } else toast('Not enough coins! (15 🪙)'); };
$('lobbyShopBtn').onclick = openShop;
$('hudShopBtn').onclick = openShop;
$('shopCloseBtn').onclick = closeShop;

const kb = { l: false, r: false, j: false, b: false }, tc = { l: false, r: false, j: false, b: false };
function recompute() { input.l = kb.l || tc.l; input.r = kb.r || tc.r; input.j = kb.j || tc.j; input.b = kb.b || tc.b; }
const KEYMAP = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'j', KeyW: 'j', Space: 'j', KeyE: 'b' };
window.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  Snd.init();
  const k = KEYMAP[e.code];
  if (k && G.inGame) { kb[k] = true; recompute(); e.preventDefault(); }
  else if (e.code === 'KeyR' && !e.repeat && G.inGame) changeLevel(G.lvIdx);
  else if (e.code === 'KeyM' && !e.repeat) $('muteBtn').click();
});
window.addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) { kb[k] = false; recompute(); } });
window.addEventListener('blur', () => { kb.l = kb.r = kb.j = kb.b = false; tc.l = tc.r = tc.j = tc.b = false; recompute(); });

const touchBtns = [...document.querySelectorAll('.tbtn')];
function updateTouch(touches) {
  const act = { l: false, r: false, j: false, b: false };
  for (const t of touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const b = el && el.closest ? el.closest('.tbtn') : null;
    if (b) act[b.dataset.k] = true;
  }
  touchBtns.forEach((b) => b.classList.toggle('down', !!act[b.dataset.k]));
  tc.l = act.l; tc.r = act.r; tc.j = act.j; tc.b = act.b;
  recompute();
}

const touchEl = $('touch');
['touchstart', 'touchmove'].forEach((n) => touchEl.addEventListener(n, (e) => { e.preventDefault(); Snd.init(); updateTouch(e.touches); }, { passive: false }));
['touchend', 'touchcancel'].forEach((n) => touchEl.addEventListener(n, (e) => { e.preventDefault(); updateTouch(e.touches); }, { passive: false }));
touchBtns.forEach((btn) => {
  const k = btn.dataset.k;
  btn.addEventListener('mousedown', (e) => { e.preventDefault(); tc[k] = true; btn.classList.add('down'); recompute(); });
  ['mouseup', 'mouseleave'].forEach((n) => btn.addEventListener(n, () => { tc[k] = false; btn.classList.remove('down'); recompute(); }));
});

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
  let fx = me.x + PW / 2, fy = me.y + PH / 2, spread = 0;
  if (G.mode === 'coop' && G.remotes.size) {
    let sx = 0, sy = 0, n = 0;
    for (const r of G.remotes.values()) { if (r.dead) continue; sx += r.x + PW / 2; sy += r.y + PH / 2; n++; spread = Math.max(spread, Math.hypot(r.x - me.x, r.y - me.y)); }
    if (n) { fx = lerp(fx, sx / n, 0.35); fy = lerp(fy, sy / n, 0.35); }
  }
  const tz = G.mode === 'coop' ? clamp(1 - (spread - 420) / 1700, 0.78, 1) : 1;
  cam.z += (tz - cam.z) * (1 - Math.exp(-dt * 2.5));
  const sc = sc0 * cam.z;
  const vw = cw / sc, vh = ch / sc;
  const look = clamp(me.vx * 14, -90, 90);
  let tx = fx + look - vw / 2;
  let ty = fy - vh * 0.56;
  tx = clamp(tx, me.x + PW / 2 - vw * 0.78, me.x + PW / 2 - vw * 0.22);
  ty = clamp(ty, me.y + PH / 2 - vh * 0.85, me.y + PH / 2 - vh * 0.15);
  tx = L.w <= vw ? (L.w - vw) / 2 : clamp(tx, 0, L.w - vw);
  ty = L.h <= vh ? (L.h - vh) / 2 : clamp(ty, 0, L.h - vh);
  if (cam.snap) { cam.x = tx; cam.y = ty; cam.snap = false; }
  else {
    cam.x += (tx - cam.x) * (1 - Math.exp(-dt * 5.5));
    cam.y += (ty - cam.y) * (1 - Math.exp(-dt * 4.2));
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

function drawBackground(L, cam) {
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, hsl(L.hue, 70, 82)); g.addColorStop(0.6, hsl(L.hue + 20, 80, 90)); g.addColorStop(1, hsl(L.hue + 40, 70, 94));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  for (const c of clouds) {
    const span = L.w * c.f + cw + 600;
    const x = ((c.x - cam.x * c.f) % span + span) % span - 200;
    drawCloud(x, c.y * cam.sc * 0.8 + 20 - cam.y * 0.04 * cam.sc, c.s * cam.sc * 0.9);
  }
  for (let layer = 0; layer < 3; layer++) {
    const f = 0.12 + layer * 0.14, base = ch * (0.72 + layer * 0.08) - (cam.y * (0.1 + layer * 0.05)) * cam.sc;
    ctx.fillStyle = hsl(L.hue + 10 + layer * 12, 45, 76 - layer * 6, 0.9);
    ctx.beginPath(); ctx.moveTo(0, ch);
    for (let sx = 0; sx <= cw + 40; sx += 40) {
      const wx = sx / cam.sc * 1 + cam.x * f * 1;
      ctx.lineTo(sx, base - (Math.sin(wx * 0.004 + layer * 2) * 40 + Math.sin(wx * 0.011 + layer) * 18 + 60 - layer * 14) * cam.sc * 0.8);
    }
    ctx.lineTo(cw, ch); ctx.closePath(); ctx.fill();
  }
}

function drawSolid(L, s) {
  const [x, y, w, h] = s;
  const body = hsl(L.hue + 25, 35, 52), dark = hsl(L.hue + 25, 35, 40);
  ctx.fillStyle = body; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = dark; ctx.fillRect(x, y + 18, w, 3);
  ctx.fillStyle = hsl(110, 55, 52); rr(x - 2, y - 4, w + 4, 16, 6); ctx.fill();
  ctx.fillStyle = hsl(110, 55, 42); ctx.fillRect(x, y + 8, w, 3);
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  for (let px = x + 18; px < x + w - 10; px += 56) ctx.fillRect(px, y + 30 + ((px * 7) % 40), 14, 5);
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

function drawCrusher(c) {
  const sx = c.shake ? Math.sin(G.lt * 120) * 3 : 0;
  ctx.strokeStyle = '#78909c'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(c.x + c.w / 2 + sx, c.top); ctx.lineTo(c.x + c.w / 2 + sx, c.cb - c.h); ctx.stroke();
  const x = c.x + sx, y = c.cb - c.h;
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

function drawBoulder(b) {
  ctx.save(); ctx.translate(b.cx, b.y - b.r); ctx.rotate(b.rot);
  ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath(); ctx.arc(-b.r * 0.35, -b.r * 0.25, b.r * 0.25, 0, 6.3); ctx.arc(b.r * 0.3, b.r * 0.3, b.r * 0.2, 0, 6.3); ctx.arc(b.r * 0.2, -b.r * 0.4, b.r * 0.14, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#3e2723'; ctx.beginPath(); ctx.moveTo(-b.r * 0.6, b.r * 0.1); ctx.lineTo(0, -b.r * 0.1); ctx.lineTo(b.r * 0.5, b.r * 0.55); ctx.stroke();
  ctx.restore();
}

function drawSweeper(s, cam) {
  const x = s.cx, y = cam.y - 100, h = cam.vh + 200;
  ctx.fillStyle = 'rgba(60,0,20,.9)'; ctx.fillRect(x, y, s.w, h);
  const g = ctx.createLinearGradient(x + s.w - 60, 0, x + s.w + 40, 0);
  g.addColorStop(0, 'rgba(255,40,60,.0)'); g.addColorStop(1, 'rgba(255,40,60,.5)');
  ctx.fillStyle = g; ctx.fillRect(x + s.w - 60, y, 100, h);
  ctx.fillStyle = '#ff5252';
  for (let yy = Math.floor(y / 40) * 40; yy < y + h; yy += 40) {
    ctx.beginPath(); ctx.moveTo(x + s.w - 4, yy); ctx.lineTo(x + s.w + 30, yy + 20); ctx.lineTo(x + s.w - 4, yy + 40); ctx.closePath(); ctx.fill();
  }
  if (G.lt < s.delay) {
    ctx.fillStyle = '#fff'; ctx.font = '700 22px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('RUN! ' + Math.max(0, s.delay - G.lt).toFixed(1), Math.max(x + 20, cam.x + 24), cam.y + 90);
  }
}

function drawCoin(c) {
  if (c.got && c.pop <= 0) return;
  const t = G.lt * 4 + c.id, sx = Math.abs(Math.cos(t));
  ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 0.7) * 3);
  if (c.got) { ctx.globalAlpha = c.pop * 2; ctx.translate(0, -(0.5 - c.pop) * 50); }
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

function drawKeyIcon(x, y, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 3);
  ctx.fillStyle = '#ffd43b'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(-6, 0, 9, 0, 6.3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8e1'; ctx.beginPath(); ctx.arc(-6, 0, 3.5, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#ffd43b'; ctx.fillRect(1, -3, 17, 6); ctx.strokeRect(1, -3, 17, 6); ctx.fillRect(12, 3, 4, 7); ctx.fillRect(7, 3, 3, 5);
  ctx.restore();
}

function drawExit(L) {
  const e = L.exit, open = G.keyGot;
  ctx.fillStyle = '#6d4c41'; rr(e.x - 6, e.y - 8, e.w + 12, e.h + 8, 10); ctx.fill();
  ctx.fillStyle = open ? '#fff59d' : '#37474f'; rr(e.x, e.y, e.w, e.h, 8); ctx.fill();
  if (open) { ctx.fillStyle = 'rgba(255,255,255,.55)'; rr(e.x + 8, e.y + 10, e.w - 16, e.h - 10, 6); ctx.fill(); sparkle(e.x + rnd(0, e.w), e.y + rnd(0, e.h), 0, 1); }
  else { ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y + e.h / 2 + 4, 7, 0, 6.3); ctx.fill(); ctx.fillRect(e.x + e.w / 2 - 3, e.y + e.h / 2 + 6, 6, 12); }
}

function drawBunny(x, y, o) {
  const slot = o.slot || 0, skin = o.skin || 'classic';
  const col = COLORS[slot % 4], dk = DARKS[slot % 4];
  const face = o.face >= 0 ? 1 : -1, sq = clamp(o.sq || 0, -0.4, 0.4);
  const run = o.ground && Math.abs(o.vx) > 0.8;
  const bob = run ? Math.sin(o.runT * 3) * 2 : 0;
  ctx.save();
  if (o.inv && Math.floor(G.lt * 14) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(x + PW / 2, y + PH);
  ctx.scale(face * (1 + sq * 0.6), 1 - sq);
  const earSwing = clamp(-(o.vy || 0) * 0.05, -0.5, 0.5) + (run ? Math.sin(o.runT * 3) * 0.12 : 0);
  if (skin === 'slime') {
    ctx.fillStyle = 'rgba(255,193,7,.95)'; ctx.strokeStyle = '#e09b00'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(-18, -34, 0, -38 + bob); ctx.quadraticCurveTo(18, -34, 16, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.ellipse(-6, -26, 4, 7, -0.5, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.arc(2, -20, 2.6, 0, 6.3); ctx.arc(10, -20, 2.6, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(6, -14, 3.5, 0.15, 3.0); ctx.stroke();
  } else {
    const body = skin === 'ninja' ? '#2b2d42' : skin === 'king' ? '#e8d5f5' : col;
    const edge = skin === 'ninja' ? '#12131f' : skin === 'king' ? '#9d6bc9' : dk;
    ctx.save(); ctx.translate(-5, -30 + bob); ctx.rotate(-0.15 - earSwing);
    ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -10, 4.5, 12, 0, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin === 'ninja' ? '#00bfa5' : '#ffc1d4'; ctx.beginPath(); ctx.ellipse(0, -9, 2, 8, 0, 0, 6.3); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(6, -30 + bob); ctx.rotate(0.15 - earSwing);
    ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, -10, 4.5, 12, 0, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin === 'ninja' ? '#00bfa5' : '#ffc1d4'; ctx.beginPath(); ctx.ellipse(0, -9, 2, 8, 0, 0, 6.3); ctx.fill(); ctx.restore();
    ctx.fillStyle = body; ctx.strokeStyle = edge; ctx.lineWidth = 3; rr(-14, -34 + bob, 28, 34 - bob, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin === 'ninja' ? '#3d405b' : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(0, -10, 8, 8, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = edge; const fo = run ? Math.sin(o.runT * 3) * 3 : 0;
    ctx.fillRect(-11 + fo, -3, 9, 3); ctx.fillRect(2 - fo, -3, 9, 3);
    if (skin === 'ninja') {
      ctx.fillStyle = '#00f5d4'; ctx.fillRect(-14, -26 + bob, 28, 6);
      ctx.fillStyle = '#fff'; ctx.fillRect(1, -25 + bob, 5, 3); ctx.fillRect(8, -25 + bob, 5, 3);
      ctx.fillStyle = '#00f5d4'; ctx.beginPath(); ctx.moveTo(-14, -24 + bob); ctx.lineTo(-24, -20 + bob + Math.sin(G.lt * 8) * 2); ctx.lineTo(-14, -20 + bob); ctx.fill();
    } else {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3, -23 + bob, 4.2, 0, 6.3); ctx.arc(10, -23 + bob, 4.2, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#3b2a3f'; ctx.beginPath(); ctx.arc(4.4, -22.5 + bob, 2.1, 0, 6.3); ctx.arc(11.4, -22.5 + bob, 2.1, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.arc(7, -18 + bob, 1.6, 0, 6.3); ctx.fill();
    }
    if (skin === 'king') {
      ctx.fillStyle = '#ffd43b'; ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-10, -33 + bob); ctx.lineTo(-11, -44 + bob); ctx.lineTo(-5, -38 + bob); ctx.lineTo(0, -47 + bob); ctx.lineTo(5, -38 + bob); ctx.lineTo(11, -44 + bob); ctx.lineTo(10, -33 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(0, -39 + bob, 2.2, 0, 6.3); ctx.fill();
    }
  }
  ctx.restore();
  if (o.shield) {
    ctx.save(); ctx.strokeStyle = 'rgba(120,220,255,.9)'; ctx.fillStyle = 'rgba(120,220,255,.2)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x + PW / 2, y + PH / 2, 24, 27, 0, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.restore();
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
  const ents = [{ slot: G.myslot, x: G.me.x, y: G.me.y, dead: G.me.dead, tg: G.me.tetherGrace }];
  for (const r of G.remotes.values()) ents.push({ slot: r.slot, x: r.x, y: r.y, dead: r.dead, tg: r.tetherGrace });
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
  const x0 = cam.x - 120, x1 = cam.x + cam.vw + 120;
  const vis = (x, w) => x + w > x0 && x < x1;

  for (const s of L.solids) if (vis(s[0], s[2])) drawSolid(L, s);
  for (const g of L.gates) if (vis(g.x, g.w)) drawGate(g, L);
  for (const p of L.plates) if (vis(p.x, p.w)) drawPlate(p);
  for (const c of L.crumbles) if (vis(c.x, c.w)) drawCrumble(c);
  for (const s of L.springs) if (vis(s.x, s.w)) drawSpring(s);
  for (const f of L.flags) if (vis(f.x, 40)) drawFlag(f);
  drawExit(L);
  L.ropes.forEach((R, i) => { if (vis(R.ax - 300, 600)) drawRope(R, i); });
  for (const c of L.crushers) if (vis(c.x, c.w)) drawCrusher(c);
  for (const s of L.spikes) if (vis(s.x, s.w)) drawSpikes(s);
  for (const b of L.boulders) if (vis(b.x0 - 60, b.x1 - b.x0 + 120)) drawBoulder(b);
  for (const c of L.coins) if (vis(c.x - 20, 40)) drawCoin(c);
  if (!G.keyGot) { const k = keyPos(); drawKeyIcon(k.x, k.y, G.lt); }
  drawTether();

  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    drawBunny(r.x, r.y, { slot: r.slot, skin: G.skins[r.slot], face: r.face, vx: r.tvx, vy: r.tvy, ground: r.onGround, runT: r.runT, sq: r.sq, inv: r.inv, shield: r.shield, name: G.names[r.slot] });
  }

  const me = G.me;
  if (!me.dead) drawBunny(me.x, me.y, { slot: me.slot, skin: G.skins[me.slot] || Save.equipped(), face: me.face, vx: me.vx, vy: me.vy, ground: me.onGround, runT: me.runT, sq: me.sq, inv: me.inv > 0, shield: me.shield, name: G.mode === 'coop' ? G.names[me.slot] : null });
  for (const s of L.sweepers) drawSweeper(s, cam);
  drawParts();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) { stepRemotes(); stepPlayer(); updateWorld(); acc -= STEP; n++; }
    if (n === 5) acc = 0;
    sendPos(t);
    updateParts(dt);
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
      <div class="sm-grid">
        <button id="smSoundBtn" class="sm-btn">🔊 Âm thanh: BẬT</button>
        <button id="smRestartBtn" class="sm-btn pri host-tag">🔄 Khởi động lại màn</button>
        <button id="smAutoMapBtn" class="sm-btn host-tag">🎲 Tạo màn ngẫu nhiên</button>
        <button id="smEditorBtn" class="sm-btn">🛠️ Trình tạo màn (Editor)</button>
        <button id="smUnstickBtn" class="sm-btn">🆘 Kẹt map? Hồi sinh ngay</button>
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
      toast('⚠️ Chỉ Chủ phòng (Host ★) mới có quyền Reset màn!');
      return;
    }
    show('settingsModal', false);
    if (G.mode !== 'solo') netEv({ t: 'restart', lv: G.lvIdx });
    loadLevel(G.lvIdx);
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
    hudGear.className = 'hbtn';
    hudGear.title = 'Cài đặt';
    hudGear.textContent = '⚙️';
    hudGear.style.fontSize = '18px';
    hudGear.onclick = () => {
      show('settingsModal', true);
      $('smSoundBtn').textContent = Snd.isMuted() ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
    };
    const hud = $('hud');
    if (hud) hud.appendChild(hudGear);
  }
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
G.myName = Store.get('tb_name', 'Bunny');
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
requestAnimationFrame(frame);
})();
