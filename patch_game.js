/**
 * Tether Bunnies v16.5 FULL MASTER - UNABRIDGED v15.5 + v16.0 COMBINED EDITION
 *  - Giữ nguyên 100% toàn bộ code vật lý, đồ họa Remastered, 24 mô-đun bẫy và Bộ quét lỗi địa hình của v15.5
 *  - Tích hợp đầy đủ 100% hệ thống Quỷ Dị của v16.0:
 *      + Bot giả dạng đồng đội ở Checkpoint (Doppelgänger Bot)
 *      + Bóng ma không nhìn mặt (Weeping Phantom) & Bàn tay hắc ám dưới đất (Abyssal Hands)
 *      + Đồng xu biến hóa ngẫu nhiên (Mimic / Ma trơi / Nặng ngàn cân / Đảo phím / Thiên thạch)
 *      + Quy tắc "Giết 1 lần là hóa giải" (G.cursedConsumed): Bị Quỷ Dị giết 1 lần thì hồi sinh lại nó trở về bình thường!
 *  - Tích hợp Chủ đề Màn Đầm Lầy Độc Dược (Toxic Swamp) + Cây Ăn Thịt Phun Axit + Quái vật đuổi biến hình theo Mùa
 *  - Tích hợp Cờ Mở Đường Phía Trước (Forward Safe-Ground Warp Flag #6) + Mua nhanh Buff (+1, +10, +100) + 3 Skin MYTHIC
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pubDir = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const gamePath = path.join(pubDir, 'game.js');
const cssPath = path.join(pubDir, 'style.css');
const htmlPath = path.join(pubDir, 'index.html');

let code = fs.readFileSync(gamePath, 'utf8').replace(/\r\n/g, '\n');

code = code.replace(/const BUFF_CAP = \d+;/g, 'const BUFF_CAP = 9999;');
code = code.replace(/const SEND_MS = \d+;/g, 'const SEND_MS = 33;');

[
  '/* === TB_V12_5_MASTER_OVERRIDE === */',
  '/* === TB_V13_0_UNIVERSITY_EDITION === */',
  '/* === TB_V14_0_ULTIMATE_OVERRIDE === */',
  '/* === TB_V15_0_REMASTERED_EDITION === */',
  '/* === TB_V15_5_SANITIZED_EDITION === */',
  '/* === TB_V16_0_ULTIMATE_EDITION === */',
  '/* === TB_V16_5_FULL_MASTER_EDITION === */',
].forEach((mk) => {
  if (code.includes(mk)) code = code.slice(0, code.indexOf(mk)) + '})();\n';
});

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); ở cuối game.js');
  process.exit(0);
}

const v165FullPayload = `
/* === TB_V16_5_FULL_MASTER_EDITION === */
// ============================================================================
// 1. CLIENT ID CHỐNG NHÂN ĐÔI NHÂN VẬT KHI ĐỔI MẠNG & ĐỒNG BỘ VẬT LÝ MƯỢT 30HZ
// ============================================================================
const V15_CID = (() => {
  let id = '';
  try { id = sessionStorage.getItem('tb_cid') || localStorage.getItem('tb_cid') || ''; } catch (e) {}
  if (!id) {
    id = 'c_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
    try { sessionStorage.setItem('tb_cid', id); localStorage.setItem('tb_cid', id); } catch (e) {}
  }
  return id;
})();

function ensureSocket() {
  if (socket) return socket;
  if (typeof io !== 'function') return null;
  socket = io({ transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 350 });
  socket.on('roster', onRoster);
  socket.on('ps', onPositions);
  socket.on('ev', onNetEv);
  socket.on('disconnect', () => { if (G.inGame && isNet()) { netLost = true; toast('⚡ Mất kết nối — Đang tự nối lại…'); } });
  socket.on('connect', () => {
    if (!(netLost && G.inGame && isNet())) return;
    socket.emit('join', { code: G.code, name: G.myName, skin: Save.equipped(), cid: V15_CID }, (res) => {
      if (res && res.ok) {
        netLost = false;
        if (G.myslot !== res.slot) G.remotes.delete(res.slot);
        G.myslot = res.slot; if (G.me) G.me.slot = res.slot;
        G.names[res.slot] = G.myName; G.hostSlot = res.host !== undefined ? res.host : res.slot;
        toast('✅ Đã kết nối lại!');
      } else { toast('Phòng đã đóng.'); setTimeout(() => { location.href = location.pathname; }, 1500); }
    });
  });
  return socket;
}

function doCreate() {
  Snd.init();
  const s = ensureSocket(); if (!s) { setMsg('Cannot reach the game server.'); return; }
  setMsg('Creating room…');
  s.emit('create', { name: myNameValue(), skin: Save.equipped(), mode: G.lobbyMode === 'party' ? 'party' : 'coop', cid: V15_CID }, (res) => {
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
  s.emit('join', { code, name: myNameValue(), skin: Save.equipped(), cid: V15_CID }, (res) => {
    if (!res || !res.ok) { setMsg((res && res.error) || 'Could not join.'); return; }
    enterCoop(res, false);
  });
}
if ($('createBtn')) $('createBtn').onclick = doCreate;
if ($('joinBtn')) $('joinBtn').onclick = () => doJoin();

function stepRemotes() {
  const now = nowMs();
  const k = 1 - Math.exp(-STEP * 28);
  const gEff = (G.L && G.L.biome === 'water') ? GRAV * 0.25 : (G.L && G.L.biome === 'space') ? GRAV * 0.35 : GRAV;
  for (const r of G.remotes.values()) {
    const age = Math.min(0.085, Math.max(0, (now - r.recv) / 1000));
    const ticks = age * 60;
    const ex = r.tx + r.tvx * ticks;
    const ey = r.onGround ? r.ty : r.ty + clamp(r.tvy * ticks + 0.5 * gEff * ticks * ticks, -42, 42);
    const px = r.x, py = r.y;
    r.px = r.x; r.py = r.y;
    if (Math.abs(ex - r.x) > 300 || Math.abs(ey - r.y) > 300) { r.x = ex; r.y = ey; }
    else { r.x += (ex - r.x) * k; r.y += (ey - r.y) * k; }
    r.dx = r.x - px;
    r.dy = r.y - py;
    springEars(r, r.tvx, r.tvy, r.face);
    if (r.onGround && Math.abs(r.dx) > 2.4 && Math.random() < 0.3) puff(r.x + PW / 2 - r.face * 9, r.y + PH, 1, '#e8e0d8', 0.5);
    r.runT += Math.abs(r.dx) * 0.06;
    r.sq *= 0.85;
  }
}

// ============================================================================
// 2. SKIN BẬC THẦN THOẠI (MYTHIC) + BUFF CỜ MỞ ĐƯỜNG PHÍA TRƯỚC (#6) + MUA NHANH ×1/×10/×100
// ============================================================================
TIERS.mythic = { label: 'MYTHIC ✦' };
SKY_CFG.toxic = { stops: [[0, '#071c15'], [0.5, '#1b4332'], [1, '#52b788']], hills: ['#2d6a4f', '#1b4332', '#081c15'], mote: 'rgba(180,255,120,.75)' };
SKY_LEGEND.toxic = 1;

Object.assign(SKINS, {
  plague: {
    tier: 'mythic', name: 'Độc Vương Thỏ', icon: '☣️', coins: 200, dia: 22,
    env: { name: 'Toxic Swamp', desc: 'bầu trời axit, sương mù độc dược, miễn nhiễm độc & đảo phím', sky: 'toxic', solidHue: 135, grassHue: 280, tint: 'rgba(80,255,120,.06)', fx: 'bubbles', rate: 18 },
    passive: { id: 'antidote', name: 'Bất Tử Độc', desc: 'Miễn nhiễm 100% bẫy Độc, Đảo Phím & Nặng Ngàn Cân + Chạy nhanh 15%.' },
    trail: ['#70e000', '#b5179e', '#80ed99'],
  },
  reaper: {
    tier: 'mythic', name: 'Tử Thần Hư Không', icon: '💀', coins: 300, dia: 28,
    env: { name: 'Void Abyss', desc: 'vực thẳm tử thần, nhìn thấu xu giả & đi xuyên 1 bẫy mỗi 12s', sky: 'cosmic', solidHue: 270, grassHue: 345, tint: 'rgba(120,0,255,.07)', fx: 'sparks', rate: 22 },
    passive: { id: 'wraith', name: 'Hồn Ma Hư Không', desc: 'Tự động né 1 đòn chí mạng mỗi 12 giây (Phase Shift) & Nhìn thấu mọi bẫy Quỷ Dị.' },
    trail: ['#ff0055', '#7209b7', '#00f5d4'],
  },
  dragon: {
    tier: 'mythic', name: 'Long Thần Tinh Tú', icon: '🐉', coins: 400, dia: 35,
    env: { name: 'Dragon Sanctuary', desc: 'hoàng hôn rồng thiêng, Nhảy 3 Lần (Triple Jump) & Hút xu toàn bản đồ', sky: 'ember', solidHue: 28, grassHue: 45, tint: 'rgba(255,180,0,.06)', fx: 'embers', rate: 24 },
    passive: { id: 'dragonflight', name: 'Long Vũ Cửu Thiên', desc: 'Nhảy 3 Lần liên tiếp trên không (Triple Jump), chạy nhanh +20% & Hút xu/chìa khóa.' },
    trail: ['#ffd43b', '#ff4d6d', '#00ffe0'],
  },
});

Object.assign(SKIN_PAL, {
  plague: { body: '#52b788', edge: '#081c15', inner: '#b5179e', belly: 'rgba(180,255,150,.75)' },
  reaper: { body: '#1a1423', edge: '#ff0055', inner: '#7209b7', belly: 'rgba(255,0,85,.45)' },
  dragon: { body: '#ffb703', edge: '#9d0208', inner: '#00f5d4', belly: 'rgba(255,245,190,.85)' },
});

BUFFS.warpflag = {
  name: 'Cờ Mở Đường (Forward Warp)',
  icon: '🚩',
  price: 25,
  desc: 'Tự động quét tìm MẶT ĐẤT AN TOÀN PHÍA TRƯỚC bạn chưa tới, cắm Checkpoint mới ở đó và DỊCH CHUYỂN CẢ ĐỘI vượt qua bẫy tới thẳng điểm đó!',
};
if (!BUFF_IDS.includes('warpflag')) BUFF_IDS.push('warpflag');
BUFF_KEYS.Digit6 = 'warpflag';
BUFF_KEYS.Numpad6 = 'warpflag';

(function addWarpTouchButton() {
  const tb = $('tBuffs');
  if (tb && !$('tb_warpflag')) {
    const b = document.createElement('button');
    b.id = 'tb_warpflag'; b.className = 'tbtn tbf hidden'; b.dataset.buff = 'warpflag';
    b.title = 'Dịch chuyển cả đội tới mặt đất an toàn phía trước';
    b.innerHTML = '🚩';
    tb.appendChild(b);
  }
})();

// Quét tìm mặt đất cố định an toàn ở phía trước mặt người chơi (chỗ chưa tới) để cắm cờ & dịch chuyển vượt bẫy:
function v16FindForwardSafeSpot(P, L) {
  const isRev = !!(L.name && L.name.indexOf('ĐẢO CHIỀU') >= 0);
  const dir = isRev ? -1 : 1;
  const cx = P.x + PW / 2;
  let best = null, bestScore = 1e9;

  for (let i = 0; i < (L.solids || []).length; i++) {
    const s = L.solids[i];
    if (s.bonk || s[2] < 70 || s[1] > (L.h || WORLD_H) - 35 || s[1] < 80) continue;
    if (s[3] > 500 && s[2] < 60) continue;
    const sMid = s[0] + s[2] / 2;
    const ahead = (sMid - cx) * dir;
    if (ahead < 110 || ahead > 680) continue;

    const tx = clamp(cx + dir * 260, s[0] + 22, s[0] + s[2] - PW - 22);
    const ty = s[1] - PH;
    const hitSpk = (L.spikes || []).some((sp) => !sp.hid && rectsOverlap(tx - 8, ty - 8, PW + 16, PH + 16, sp.x, sp.y, sp.w, sp.h));
    if (hitSpk) continue;

    const score = Math.abs(ahead - 280) + Math.abs(ty - P.y) * 0.35;
    if (score < bestScore) { bestScore = score; best = { x: Math.round(tx), y: Math.round(ty) }; }
  }
  if (!best) {
    const fallbackX = clamp(Math.round(P.x + dir * 220), 60, L.w - PW - 60);
    best = { x: fallbackX, y: Math.round(Math.min(P.y, GY - PH)) };
  }
  return best;
}

function useBuff(which) {
  const P = G.me, L = G.L;
  if (!P || P.dead || G.won || !L) return;
  if (!P.timed) P.timed = { speed: 0, magnet: 0, jumpboost: 0 };
  const free = Role.admin;
  const have = (id) => free || Save.buff(id) > 0;
  const spend = (id) => { if (!free) Save.useBuff(id); };

  if (which === 'warpflag') {
    if (!have('warpflag')) { toast('Hết Cờ Mở Đường 🚩 — Mua ×10 / ×100 trong 🛍️ Shop!'); return; }
    spend('warpflag');
    const spot = v16FindForwardSafeSpot(P, L);
    P.x = spot.x; P.y = spot.y; P.vx = 0; P.vy = 0; P.rope = null;
    P.cp = { x: spot.x, y: spot.y };
    P.inv = Math.max(P.inv, 2.0);
    if (L.flags) L.flags.push({ x: spot.x + PW / 2, y: spot.y + PH, on: true });
    G.cam.snap = true;
    Snd.cp(); sparkle(spot.x + PW / 2, spot.y + PH / 2, 28, 1.9, '#00ffe0');
    toast('🚩 Đã cắm Cờ ở mặt đất phía trước & Dịch chuyển toàn đội vượt chướng ngại vật!');
    if (isNet()) netEv({ t: 'cp', x: spot.x, y: spot.y, fi: -1, s: P.slot, pull: 1 });
    refreshBuffUI();
    return;
  }

  if (!which) {
    if (!P.shield && have('shield')) which = 'shield';
    else if (!P.dj && have('doublejump')) which = 'doublejump';
    else if (have('warpflag')) { useBuff('warpflag'); return; }
    else { if (!P.shield && !P.dj) toast('Chưa có thuốc — Mua thêm trong 🛍️ Shop!'); refreshBuffUI(); return; }
  }
  const b = BUFFS[which]; if (!b) return;
  if (which === 'shield') {
    if (P.shield) toast('🛡️ Khiên đang bật rồi!');
    else if (!have('shield')) toast('Hết khiên 🛡️ — Mua thêm ở 🛍️ Shop!');
    else { spend('shield'); P.shield = true; toast('🛡️ Bubble Shield ON!'); Snd.pop(); }
  } else if (which === 'doublejump') {
    if (P.dj) toast('🦘 Nhảy đôi đang bật rồi!');
    else if (!have('doublejump')) toast('Hết thuốc nhảy đôi 🦘 — Mua thêm ở 🛍️ Shop!');
    else { spend('doublejump'); P.dj = true; P.djT = DJ_SECONDS; P.usedDJ = false; toast('🦘 Double Jump ON (' + DJ_SECONDS + 's)!'); Snd.djump(); }
  } else {
    if (P.timed[which] > 0) toast(b.icon + ' ' + b.name + ' đang bật rồi!');
    else if (!have(which)) toast('Hết ' + b.name + ' ' + b.icon + ' — Mua thêm ở 🛍️ Shop!');
    else {
      spend(which); P.timed[which] = free ? 9999 : b.dur;
      toast(b.icon + ' ' + b.name + ' ON (' + b.dur + 's)!'); Snd.djump();
      sparkle(P.x + PW / 2, P.y + PH / 2, 10, 1.2, '#fff3a0');
    }
  }
  refreshBuffUI();
}

renderShop = function () {
  const m = $('shopModal'), card = m && m.querySelector('.shop-card');
  if (!card) return;
  const eq = Save.equipped();
  let h = '<div class="shop-header"><div class="shop-title">🥕 BUNNY BOUTIQUE</div>' +
    '<div class="shop-balance">🪙 <span id="shopCoins">0</span></div>' +
    '<div class="shop-balance dia">💎 <span id="shopDiamonds">0</span></div>' +
    '<button class="shop-close" data-act="close" title="Close Shop">&times;</button></div>';
  h += '<div class="shop-xchg"><span>💱 Đổi Xu → Kim Cương:</span>' +
    '<button class="skin-btn" data-act="xchg" data-n="1">🪙 ' + DIA_RATE + ' → 💎 1</button>' +
    '<button class="skin-btn" data-act="xchg" data-n="10">🪙 ' + (DIA_RATE * 10) + ' → 💎 10</button>' +
    '<button class="skin-btn" data-act="xchg" data-n="50">🪙 ' + (DIA_RATE * 50) + ' → 💎 50</button></div>';
  ['mythic', 'legendary', 'rare', 'common'].forEach((t) => {
    if (!TIERS[t]) return;
    h += '<div class="shop-section-title tier-' + t + '">' + TIERS[t].label + ' SKINS</div><div class="shop-grid">';
    Object.keys(SKINS).filter((id) => SKINS[id].tier === t).forEach((id) => {
      const d = SKINS[id], owned = Save.hasSkin(id), on = owned && eq === id;
      h += '<div class="shop-item tier-' + t + '" data-skin="' + id + '"><div class="tier-tag">' + TIERS[t].label + '</div>' +
        '<div class="skin-preview preview-' + id + '">' + d.icon + '</div>' +
        '<div class="skin-name">' + d.name + '</div>' +
        (d.passive ? '<div class="skin-desc"><b>🌍 ' + d.env.name + '</b> — ' + d.env.desc + '<br><b>✨ ' + d.passive.name + ':</b> ' + d.passive.desc + '</div>' : '') +
        '<div class="skin-price">' + (owned ? 'OWNED' : priceText(d)) + '</div>' +
        '<button class="skin-btn' + (on ? ' equipped' : '') + '" data-act="skin" data-id="' + id + '">' + (!owned ? 'Buy' : on ? 'Equipped' : 'Equip') + '</button></div>';
    });
    h += '</div>';
  });
  h += '<div class="shop-section-title">POTIONS &amp; BUFFS <span class="tiny">· Mua nhanh ×1 / ×10 / ×100 (Phím 1–6)</span></div><div class="shop-grid buffs-grid">';
  Object.keys(BUFFS).forEach((id) => {
    const b = BUFFS[id];
    h += '<div class="shop-item buff-item"><div class="skin-preview">' + b.icon + '</div><div class="skin-name">' + b.name + '</div>' +
      '<div class="skin-desc">' + b.desc + '</div>' +
      '<div class="skin-price">🪙 ' + b.price + ' / cái · Kho: <b>' + (Role.admin ? '∞' : Save.buff(id)) + '</b></div>' +
      '<div style="display:flex;gap:5px;width:100%">' +
        '<button class="skin-btn" data-act="buff" data-id="' + id + '" data-qty="1">+1</button>' +
        '<button class="skin-btn" data-act="buff" data-id="' + id + '" data-qty="10">+10</button>' +
        '<button class="skin-btn" data-act="buff" data-id="' + id + '" data-qty="100">+100</button>' +
      '</div></div>';
  });
  h += '</div><div class="shop-foot">Phím tắt: <b>1</b>=🛡️ Khiên, <b>2</b>=🦘 Nhảy đôi, <b>3</b>=👟 Tốc độ, <b>4</b>=🧲 Nam châm, <b>5</b>=🚀 Siêu nhảy, <b>6</b>=🚩 Cờ Mở Đường.</div>';
  card.innerHTML = h;
  refreshCoinUI();
};

buyBuff = function (id, qty) {
  const b = BUFFS[id]; if (!b) return;
  const n = Math.max(1, parseInt(qty, 10) || 1);
  if (Role.admin) { Save.addBuff(id, n); toast('🛠 Admin: Đã cộng +' + n + ' ' + b.name); refreshShopUI(); return; }
  const totalCost = b.price * n;
  if (Save.coins() < totalCost) {
    const maxCanBuy = Math.floor(Save.coins() / b.price);
    if (maxCanBuy <= 0) { toast('Không đủ xu! Cần ' + b.price + ' 🪙'); return; }
    Save.spend(maxCanBuy * b.price);
    Save.addBuff(id, maxCanBuy);
    Snd.key();
    toast(b.icon + ' Đã mua tối đa +' + maxCanBuy + ' ' + b.name + '!');
    refreshShopUI();
    return;
  }
  Save.spend(totalCost);
  Save.addBuff(id, n);
  Snd.key();
  toast(b.icon + ' Đã mua +' + n + ' ' + b.name + '!');
  refreshShopUI();
};

(function bindBulkShopClick() {
  const sm = $('shopModal');
  if (!sm) return;
  sm.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-act="buff"][data-qty]') : null;
    if (!b) return;
    e.stopImmediatePropagation();
    Snd.init();
    buyBuff(b.dataset.id, parseInt(b.dataset.qty, 10) || 1);
  }, true);
})();

// ============================================================================
// 3. VẬT LÝ DÂY NGẮN (60px -> 96px MAX) + KÉO CẢ ĐỘI + THÁP SỐNG CÕNG NHAU NHẢY
// ============================================================================
const V15_ROPE_REST = 60;
const V15_ROPE_SPRING = 78;
const V15_ROPE_MAX = 96;
const V15_PIT_SAFE_DROP = 76;

function v15GetSquadLinks(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0) return null;
  let groundedPower = P.onGround ? (input.d ? 3.2 : 1.4) : 0;
  let fallingCount = P.onGround ? 0 : 1;
  let bestAnchor = P.onGround ? { x: P.x, y: P.y, tvx: P.vx, vy: P.vy, anch: input.d, slot: P.slot } : null;
  const slots = [P.slot];
  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    slots.push(r.slot);
    if (r.onGround || r.anch) {
      groundedPower += r.anch ? 3.2 : 1.4;
      if (!bestAnchor || r.y < bestAnchor.y) bestAnchor = { x: r.x, y: r.y, tvx: r.tvx || 0, vy: r.tvy || 0, anch: r.anch, slot: r.slot };
    } else fallingCount++;
  }
  slots.sort((a, b) => a - b);
  const idx = slots.indexOf(P.slot);
  const links = [];
  if (idx > 0) { const r = G.remotes.get(slots[idx - 1]); if (r && !r.dead && !r.ropeOn) links.push(r); }
  if (idx < slots.length - 1) { const r = G.remotes.get(slots[idx + 1]); if (r && !r.dead && !r.ropeOn) links.push(r); }
  return { links, bestAnchor, rescueRatio: groundedPower / Math.max(1, fallingCount) };
}

function applyTether(P) {
  const st = v15GetSquadLinks(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  for (const r of links) {
    const ax = P.x + PW / 2, ay = P.y + PH / 2, bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d <= V15_ROPE_REST || d < 1) continue;
    const nx = dx / d, ny = dy / d, stretch = d - V15_ROPE_REST;
    const partnerGrounded = !!(r.onGround || r.anch);

    let scale = 1.0;
    if (meGrounded && !partnerGrounded) {
      if (input.d) scale = 0.0;
      else if (rescueRatio >= 0.9) scale = 0.04 / rescueRatio;
      else scale = clamp(0.8 * (1.05 - rescueRatio), 0.24, 0.85);
    } else if (!meGrounded && (partnerGrounded || bestAnchor)) {
      scale = clamp(2.1 * Math.sqrt(Math.max(0.6, rescueRatio)), 1.4, 3.6);
    } else scale = 0.85;

    const kS = d > V15_ROPE_SPRING ? 0.085 : 0.048;
    const f = Math.min(stretch * kS, 5.5) * scale;
    P.vx += nx * f;
    P.vy += ny * f * (ny < 0 ? 1.85 : 0.25);
  }

  if (!meGrounded && bestAnchor && P.y > bestAnchor.y + 14) {
    const dxA = (bestAnchor.x + PW / 2) - (P.x + PW / 2);
    const dyA = (bestAnchor.y + PH / 2) - (P.y + PH / 2);
    const distA = Math.max(1, Math.hypot(dxA, dyA));
    const lift = clamp(rescueRatio, 0.85, 2.6);
    P.vy -= Math.min(GRAV * 1.7 * lift, 2.2);
    if (Math.abs(bestAnchor.tvx || 0) > 0.45 || (bestAnchor.vy || 0) < -1.8 || bestAnchor.anch || distA > V15_ROPE_SPRING) {
      P.vy = Math.max(P.vy - 1.25 * lift, -12.2);
      P.vx += (dxA / distA) * 0.85 * lift;
    }
  }
}

function v15EnforceRopeAfterMove(P) {
  const st = v15GetSquadLinks(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  if (!P.onGround && bestAnchor && P.y > bestAnchor.y + V15_PIT_SAFE_DROP) {
    const maxY = bestAnchor.y + V15_PIT_SAFE_DROP;
    if (nearSolids(P.x, maxY, PW, PH).length === 0) {
      P.y = maxY;
      if (P.vy > 0) P.vy = -P.vy * 0.55 - 3.4;
    }
    P.vx += Math.sign(bestAnchor.x - P.x) * 0.7;
  }

  for (const r of links) {
    const partnerGrounded = !!(r.onGround || r.anch);
    const ax = P.x + PW / 2, ay = P.y + PH / 2, bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d > V15_ROPE_MAX && d > 1) {
      if (meGrounded && partnerGrounded && Math.abs(r.tvy || 0) < 2) continue;
      if (meGrounded && !partnerGrounded && (input.d || rescueRatio >= 0.95)) continue;
      const nx = dx / d, ny = dy / d;
      const share = (!meGrounded && (partnerGrounded || bestAnchor)) ? 0.98 : (meGrounded ? 0.35 : 0.75);
      const over = (d - V15_ROPE_MAX) * share;
      const cx = P.x + nx * over, cy = P.y + ny * over;
      if (nearSolids(cx, P.y, PW, PH).length === 0) P.x = cx;
      if (nearSolids(P.x, cy, PW, PH).length === 0) P.y = cy;
      const vRad = P.vx * nx + P.vy * ny;
      if (vRad < 0) { P.vx -= nx * vRad * 1.42; P.vy -= ny * vRad * 1.48; }
    }
  }
}

function hangingFriend(P) {
  let best = null, bd = 1e9;
  for (const r of G.remotes.values()) {
    if (r.dead || (r.onGround && !r.ropeOn) || r.y < P.y + 14) continue;
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    if (d > 220 || d < 25) continue;
    if (d < bd) { bd = d; best = r; }
  }
  return best;
}

function drawTether() {
  if (G.mode !== 'coop' || !G.remotes.size) return;
  const mq = ipos(G.me);
  const ents = [{ slot: G.myslot, x: mq.x, y: mq.y, dead: G.me.dead }];
  for (const r of G.remotes.values()) { const rq = ipos(r); ents.push({ slot: r.slot, x: rq.x, y: rq.y, dead: r.dead }); }
  ents.sort((a, b) => a.slot - b.slot);
  for (let i = 0; i < ents.length - 1; i++) {
    const a = ents[i], b = ents[i + 1];
    if (a.dead || b.dead) continue;
    const ax = a.x + PW / 2, ay = a.y + PH * 0.55, bx = b.x + PW / 2, by = b.y + PH * 0.55;
    const d = Math.hypot(bx - ax, by - ay), slack = Math.max(0, V15_ROPE_REST - d), sag = slack * 0.4;
    const tension = clamp((d - V15_ROPE_REST) / 36, 0, 1);
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.slot % COLORS.length]); grad.addColorStop(1, COLORS[b.slot % COLORS.length]);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const coils = 8, ux = (bx - ax) / Math.max(1, d), uy = (by - ay) / Math.max(1, d);
    const px = -uy, py = ux, amp = tension > 0.05 ? (3.5 + tension * 4.5) : 0;
    ctx.strokeStyle = 'rgba(40,15,45,.72)'; ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    if (amp > 0) {
      for (let k = 1; k < coils; k++) {
        const u = k / coils, side = (k % 2 ? 1 : -1) * amp;
        ctx.lineTo(lerp(ax, bx, u) + px * side, lerp(ay, by, u) + py * side);
      }
      ctx.lineTo(bx, by);
    } else ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by);
    ctx.stroke();
    ctx.strokeStyle = tension > 0.15 ? 'rgb(255,' + Math.round(215 - tension * 155) + ',' + Math.round(90 - tension * 70) + ')' : grad;
    ctx.lineWidth = 3.8;
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================================
// 4. ĐỒ HỌA REMASTERED: ĐÁ TẢNG ĐA DIỆN, GAI THÉP 3D, BÚA THỦY LỰC, BOSS ĐUỔI & BƠI LẶN
// ============================================================================
drawSolid = function (L, s) {
  if (s.ice || L.biome === 'ice') { drawIceSolid(L, s); return; }
  const x = s[0], y = s[1], w = s[2], h = s[3], T = G.lt;
  const theme = effTheme(L);

  if (L.biome === 'toxic' || theme === 'toxic') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, '#1b4332'); gr.addColorStop(0.5, '#081c15'); gr.addColorStop(1, '#040d0a');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#7209b7'; rr(x - 3, y - 5, w + 6, 16, 6); ctx.fill();
    ctx.fillStyle = '#80ed99'; rr(x - 3, y - 5, w + 6, 7, 4); ctx.fill();
    for (let px = x + 22; px < x + w - 20; px += 52) {
      const drip = (T * 24 + px) % 18;
      ctx.fillStyle = '#80ed99'; ctx.beginPath(); ctx.arc(px, y + 8 + drip, 2.6, 0, 6.3); ctx.fill();
    }
    return;
  }

  if (L.biome === 'water' || theme === 'ocean') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
    gr.addColorStop(0, '#16425b'); gr.addColorStop(0.4, '#0f2c3f'); gr.addColorStop(1, '#071722');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(120,220,255,.08)';
    for (let px = x + 16; px < x + w - 16; px += 64) ctx.fillRect(px, y + 28 + ((px * 7) % 45), 24, 6);
    ctx.fillStyle = '#1b6ca8'; rr(x - 3, y - 5, w + 6, 16, 6); ctx.fill();
    ctx.fillStyle = '#48cae4'; rr(x - 3, y - 5, w + 6, 7, 4); ctx.fill();
    for (let px = x + 18; px < x + w - 18; px += 48) {
      const sway = Math.sin(T * 3 + px * 0.05) * 5;
      const col = (px % 96 === 0) ? '#ff5d8f' : (px % 64 === 0) ? '#00f5d4' : '#38b000';
      ctx.strokeStyle = col; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, y - 3);
      ctx.quadraticCurveTo(px + sway, y - 14, px + sway * 1.4, y - 24 - (px % 9));
      ctx.stroke();
    }
    return;
  }

  if (L.biome === 'space' || theme === 'cosmic' || theme === 'neon') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, '#232738'); gr.addColorStop(0.5, '#161925'); gr.addColorStop(1, '#0b0d14');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,255,230,.18)'; ctx.lineWidth = 1.5;
    for (let px = x + 40; px < x + w - 10; px += 80) {
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + Math.min(h, 180)); ctx.stroke();
    }
    ctx.fillStyle = '#343a40'; rr(x - 3, y - 5, w + 6, 15, 4); ctx.fill();
    ctx.fillStyle = theme === 'neon' ? '#ff2bd6' : '#00f5d4';
    ctx.fillRect(x - 2, y - 4, w + 4, 4);
    ctx.fillStyle = '#e9ecef';
    for (let px = x + 14; px < x + w - 10; px += 36) {
      ctx.beginPath(); ctx.arc(px, y + 4, 2, 0, 6.3); ctx.fill();
    }
    return;
  }

  if (theme === 'ember') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
    gr.addColorStop(0, '#2b1d1e'); gr.addColorStop(0.5, '#1a1112'); gr.addColorStop(1, '#0d0708');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#4a2520'; rr(x - 3, y - 5, w + 6, 16, 6); ctx.fill();
    ctx.fillStyle = '#ff6b00'; rr(x - 3, y - 5, w + 6, 6, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,100,0,.45)'; ctx.lineWidth = 2;
    for (let px = x + 28; px < x + w - 24; px += 76) {
      ctx.beginPath(); ctx.moveTo(px, y + 6); ctx.lineTo(px + 12, y + 26); ctx.lineTo(px + 4, y + 48); ctx.stroke();
    }
    return;
  }

  const sh = curEnv ? curEnv.solidHue : L.hue + 25, gh = curEnv ? curEnv.grassHue : 105;
  const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
  gr.addColorStop(0, hsl(sh, 32, 48)); gr.addColorStop(1, hsl(sh, 35, 26));
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.10)';
  for (let px = x + 18; px < x + w - 10; px += 56) ctx.fillRect(px, y + 30 + ((px * 7) % 40), 16, 5);
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  for (let px = x + 40; px < x + w - 20; px += 90) ctx.fillRect(px, y + 70 + ((px * 5) % 60), 24, 7);
  ctx.fillStyle = hsl(gh, 52, 38); rr(x - 3, y - 5, w + 6, 19, 7); ctx.fill();
  ctx.fillStyle = hsl(gh, 60, 54); rr(x - 3, y - 5, w + 6, 9, 5); ctx.fill();
};

drawSpikesRaw = function (s) {
  if (s.w < 10) return;
  const n = Math.max(1, Math.round(s.w / 20)), tw = s.w / n;
  const up = s.dir === 'up';
  const baseY = up ? s.y + s.h - 5 : s.y;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(s.x, baseY, s.w, 5);
  const tipCol = (G.L && G.L.biome === 'toxic') ? '#80ed99' : '#ef4444';
  for (let i = 0; i < n; i++) {
    const x = s.x + i * tw, mx = x + tw / 2;
    const tipY = up ? s.y - 2 : s.y + s.h + 2;
    const rootY = up ? s.y + s.h - 4 : s.y + 4;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(x + 1, rootY); ctx.lineTo(mx, tipY); ctx.lineTo(mx, rootY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(mx, rootY); ctx.lineTo(mx, tipY); ctx.lineTo(x + tw - 1, rootY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tipCol;
    const midY = lerp(tipY, rootY, 0.28);
    ctx.beginPath();
    ctx.moveTo(lerp(x + 1, mx, 0.72), midY);
    ctx.lineTo(mx, tipY);
    ctx.lineTo(lerp(x + tw - 1, mx, 0.72), midY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 1, rootY); ctx.lineTo(mx, tipY); ctx.lineTo(x + tw - 1, rootY); ctx.stroke();
  }
};

function drawFacetedRock(cx, cy, r, rot, isLava) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  const verts = 14;
  ctx.beginPath();
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    const jag = 0.86 + 0.16 * Math.sin(i * 4.7 + 1.3) + 0.06 * Math.cos(i * 7.1);
    const vx = Math.cos(a) * r * jag, vy = Math.sin(a) * r * jag;
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.05);
  gr.addColorStop(0, '#8d99ae');
  gr.addColorStop(0.55, '#4a5568');
  gr.addColorStop(1, '#1a202c');
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.12)';
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.2); ctx.lineTo(-r * 0.1, -r * 0.65); ctx.lineTo(r * 0.25, -r * 0.25); ctx.lineTo(-r * 0.15, 0);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.moveTo(r * 0.1, r * 0.1); ctx.lineTo(r * 0.65, r * 0.05); ctx.lineTo(r * 0.4, r * 0.6); ctx.lineTo(-r * 0.2, r * 0.55);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = (G.L && G.L.biome === 'toxic') ? '#80ed99' : isLava ? '#ff5400' : '#111827';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, r * 0.12); ctx.lineTo(-r * 0.12, -r * 0.08); ctx.lineTo(r * 0.18, r * 0.35);
  ctx.moveTo(-r * 0.12, -r * 0.08); ctx.lineTo(r * 0.38, -r * 0.42);
  ctx.stroke();
  ctx.restore();
}

drawBoulder = function (b, bcx, brot) { drawFacetedRock(bcx, b.y - b.r, b.r, brot, true); };
drawFerry = function (t) {
  const a = (G.alpha === undefined ? 1 : G.alpha), cx = t.cx - (t.dx || 0) * (1 - a), cy = t.cy, R = t.R;
  drawFacetedRock(cx, cy, R, t.rot + (t.dx || 0) * (a - 1) / R, false);
};
drawRocks = function (L, lt) {
  for (const r of (L.rocks || [])) {
    const p = rockAt(r, lt);
    if (!p) continue;
    drawFacetedRock(p.x, p.y, r.r, p.rot, true);
  }
};

drawCrusher = function (c, cb) {
  const sx = c.shake ? Math.sin(G.lt * 130) * 3.5 : 0;
  const x = c.x + sx, y = cb - c.h, w = c.w, h = c.h;
  const cx = x + w / 2;

  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 16, c.top, 10, Math.max(0, y - c.top));
  ctx.fillRect(cx + 6, c.top, 10, Math.max(0, y - c.top));
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx - 14, c.top, 3, Math.max(0, y - c.top));
  ctx.fillRect(cx + 8, c.top, 3, Math.max(0, y - c.top));

  const gr = ctx.createLinearGradient(x, y, x + w, y + h - 20);
  gr.addColorStop(0, '#475569'); gr.addColorStop(0.5, '#1e293b'); gr.addColorStop(1, '#0f172a');
  ctx.fillStyle = gr;
  rr(x, y, w, h - 20, 6); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = c.shake ? '#ef4444' : '#090d16'; ctx.stroke();

  ctx.save();
  ctx.beginPath(); ctx.rect(x + 4, y + h - 42, w - 8, 16); ctx.clip();
  ctx.fillStyle = '#eab308'; ctx.fillRect(x + 4, y + h - 42, w - 8, 16);
  ctx.fillStyle = '#0f172a';
  for (let k = -20; k < w + 20; k += 18) {
    ctx.beginPath(); ctx.moveTo(x + k, y + h - 26); ctx.lineTo(x + k + 10, y + h - 42);
    ctx.lineTo(x + k + 18, y + h - 42); ctx.lineTo(x + k + 8, y + h - 26); ctx.fill();
  }
  ctx.restore();

  const coreCol = (c.shake || cb > c.restB + 10) ? '#ff1744' : '#38bdf8';
  ctx.fillStyle = coreCol;
  ctx.beginPath(); ctx.arc(cx, y + (h - 42) * 0.5, 11, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.stroke();

  drawSpikesRaw({ x: x + 2, y: y + h - 20, w: w - 4, h: 20, dir: 'down' });
};

drawCeil = function (t) {
  const cb = t.st === 1 ? t.cb : t.top;
  const w = t.x1 - t.x0, SH = t.SH, y = cb - SH;
  for (const a of t.alc) {
    ctx.save(); ctx.fillStyle = 'rgba(56,189,248,.16)'; ctx.fillRect(a[0], t.gy, a[1] - a[0], 70);
    ctx.fillStyle = '#38bdf8'; ctx.font = '800 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('▼ HỐC TRÚ ẨN ▼', (a[0] + a[1]) / 2, t.gy - 10 + Math.sin(G.lt * 5) * 4);
    ctx.restore();
  }
  const gr = ctx.createLinearGradient(0, y, 0, y + SH);
  gr.addColorStop(0, '#334155'); gr.addColorStop(1, '#0f172a');
  ctx.fillStyle = gr; ctx.fillRect(t.x0, y, w, SH - 20);
  ctx.strokeStyle = '#020617'; ctx.lineWidth = 4; ctx.strokeRect(t.x0, y, w, SH - 20);
  drawSpikesRaw({ x: t.x0 + 4, y: y + SH - 20, w: w - 8, h: 20, dir: 'down' });
};

drawGate = function (g) {
  const solid = gateSolid(g);
  if (g.inv) {
    ctx.save(); ctx.globalAlpha = solid ? 1 : 0.25;
    ctx.fillStyle = '#475569'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3;
    rr(g.x, g.y, g.w, g.h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 4; i++) ctx.fillRect(g.x + 8 + i * 24, g.y + 5, 14, 4);
    ctx.restore();
    return;
  }
  if (solid) {
    const gr = ctx.createLinearGradient(g.x, 0, g.x + g.w, 0);
    gr.addColorStop(0, '#1e293b'); gr.addColorStop(0.5, '#475569'); gr.addColorStop(1, '#0f172a');
    ctx.fillStyle = gr; ctx.strokeStyle = '#020617'; ctx.lineWidth = 3;
    rr(g.x, g.y, g.w, g.h, 4); ctx.fill(); ctx.stroke();
    const pulse = 0.65 + 0.35 * Math.sin(G.lt * 10);
    ctx.fillStyle = 'rgba(239,68,68,' + pulse.toFixed(2) + ')';
    ctx.fillRect(g.x + g.w * 0.35, g.y + 8, g.w * 0.3, g.h - 16);
    for (let y = g.y + 20; y < g.y + g.h - 16; y += 36) {
      ctx.fillStyle = '#eab308'; ctx.fillRect(g.x + 3, y, g.w - 6, 4);
    }
  } else {
    ctx.fillStyle = 'rgba(56,189,248,.16)'; ctx.fillRect(g.x + 4, g.y, g.w - 8, g.h);
    ctx.fillStyle = '#334155'; rr(g.x - 2, g.y - 8, g.w + 4, 16, 4); ctx.fill();
  }
};

drawSweeper = function (s, cam) {
  const T = G.lt, front = s.cx + s.w, y = cam.y - 100, h = cam.vh + 200, my = cam.y + cam.vh * 0.52;
  const biome = (G.L && G.L.biome) || 'normal';
  const roar = T < s.delay;
  ctx.save();
  const c0 = biome === 'toxic' ? 'rgba(8,28,21,.96)' : biome === 'water' ? 'rgba(5,20,38,.96)' : biome === 'ice' ? 'rgba(12,32,54,.96)' : 'rgba(15,5,25,.96)';
  const c1 = biome === 'toxic' ? 'rgba(45,106,79,.88)' : biome === 'water' ? 'rgba(15,65,110,.88)' : biome === 'ice' ? 'rgba(56,189,248,.82)' : 'rgba(80,15,40,.9)';
  const bg = ctx.createLinearGradient(front - 480, 0, front, 0);
  bg.addColorStop(0, c0); bg.addColorStop(1, c1);
  ctx.fillStyle = bg; ctx.fillRect(front - 1400, y, 1400, h);

  for (let yy = Math.floor(y / 130) * 130; yy < y + h; yy += 130) {
    const cy = yy + 65, wag = Math.sin(T * 7 + yy * 0.02) * 18;
    if (biome === 'water' || biome === 'toxic') {
      ctx.strokeStyle = biome === 'toxic' ? '#80ed99' : '#00f5d4'; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(front - 40, cy);
      ctx.quadraticCurveTo(front + 15, cy + wag, front + 48, cy - wag * 0.7);
      ctx.stroke();
    } else {
      drawSaw(front + 10, cy, 42, T * 1.8);
    }
    ctx.fillStyle = biome === 'toxic' ? '#b5179e' : '#ff1744';
    ctx.beginPath(); ctx.ellipse(front - 55, cy, 18, 10, 0, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(front - 48, cy, 4, 0, 6.3); ctx.fill();
  }
  ctx.restore();
  if (roar) {
    ctx.fillStyle = '#ffe066'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('⚠️ QUÁI VẬT SĂN ĐUỔI TRONG ' + Math.max(0, s.delay - T).toFixed(1) + 's!', Math.max(front + 50, cam.x + 24), my - 120);
  }
};

const _origDrawBunnyV10 = drawBunny;
drawBunny = function (x, y, o) {
  const L = G.L;
  const isWater = !!(L && L.biome === 'water');
  const isSpace = !!(L && L.biome === 'space');
  const face = o.face >= 0 ? 1 : -1;
  const vx = o.vx || 0, vy = o.vy || 0;

  let gDir = 1;
  if (L && L.gravZones) {
    for (const gz of L.gravZones) {
      if (x + PW / 2 >= gz.x0 && x + PW / 2 <= gz.x1) { gDir = -1; break; }
    }
  }

  if (isWater) {
    const swimActive = !o.ground || Math.abs(vx) > 0.35;
    const tilt = swimActive ? face * 1.18 + clamp(vy * 0.045, -0.45, 0.45) * face : 0;
    const kick = Math.sin(G.lt * 20 + (o.slot || 0)) * 7;

    ctx.save();
    const cx = x + PW / 2, cy = y + PH / 2;
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);

    if (swimActive) {
      ctx.save();
      ctx.fillStyle = '#00f5d4'; ctx.strokeStyle = '#0a3d62'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx - face * 10 + kick * 0.4, y + PH + 3, 8, 3.8, 0.3, 0, 6.3);
      ctx.ellipse(cx + face * 4 - kick * 0.4, y + PH + 4, 8, 3.8, -0.3, 0, 6.3);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    _origDrawBunnyV10(x, y, Object.assign({}, o, { ground: !swimActive, runT: G.lt * 4.5 }));

    ctx.save();
    ctx.translate(cx, y + PH);
    ctx.scale(face, 1);
    ctx.fillStyle = 'rgba(0,245,212,.55)';
    ctx.strokeStyle = '#023e8a'; ctx.lineWidth = 2.2;
    rr(0, -28, 15, 9, 3); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(12, -22); ctx.lineTo(17, -22); ctx.lineTo(17, -38); ctx.stroke();
    ctx.restore();
    ctx.restore();

    if (swimActive && !G.paused && Math.random() < 0.38) {
      puff(x + PW / 2 - face * 16, y + PH * 0.6 + rnd(-6, 6), 1, 'rgba(200,248,255,.85)', 0.45);
    }
    return;
  }

  ctx.save();
  if (gDir < 0) {
    const cy = y + PH / 2;
    ctx.translate(0, cy * 2);
    ctx.scale(1, -1);
  }
  _origDrawBunnyV10(x, y, o);

  if (isSpace) {
    ctx.save();
    ctx.translate(x + PW / 2, y + PH);
    ctx.scale(face, 1);
    ctx.fillStyle = 'rgba(56,189,248,.52)'; ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
    rr(-1, -29, 16, 10, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2;
    rr(-19, -25, 7, 17, 2); ctx.fill(); ctx.stroke();
    if (!o.ground) {
      const fl = 8 + Math.sin(G.lt * 45) * 4;
      const fg = ctx.createLinearGradient(-15.5, -8, -15.5, -8 + fl);
      fg.addColorStop(0, '#38bdf8'); fg.addColorStop(0.5, '#f97316'); fg.addColorStop(1, 'rgba(239,68,68,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.moveTo(-19, -8); ctx.lineTo(-12, -8); ctx.lineTo(-15.5, -8 + fl); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
};

// ============================================================================
// 5. BỘ QUÉT & CẮT GỌT ĐỊA HÌNH TOÀN CỤC (GLOBAL LEVEL SANITIZER CHO 300 MÀN)
// ============================================================================
function v15SanitizeLevel(lv) {
  if (!lv) return lv;
  const H = lv.h || WORLD_H;

  const deepWalls = [];
  for (let i = 0; i < (lv.solids || []).length; i++) {
    const s = lv.solids[i];
    if (s.bonk) continue;
    if (s[1] + s[3] >= H - 38 && s[3] >= 90) {
      deepWalls.push([s[0] - 4, s[0] + s[2] + 4]);
    }
  }

  const surfaceKeepOuts = [];
  if (lv.spawn) surfaceKeepOuts.push([lv.spawn[0] - 65, lv.spawn[0] + PW + 65, lv.spawn[1] - 40, lv.spawn[1] + PH + 40]);
  for (const sp of (lv.springs || [])) surfaceKeepOuts.push([sp.x - 16, sp.x + sp.w + 16, sp.y - 30, sp.y + sp.h + 20]);
  for (const pl of (lv.plates || [])) surfaceKeepOuts.push([pl.x - 14, pl.x + pl.w + 14, pl.y - 25, pl.y + pl.h + 15]);
  for (const gt of (lv.gates || [])) surfaceKeepOuts.push([gt.x - 16, gt.x + gt.w + 16, gt.y - 10, gt.y + gt.h + 15]);
  for (const sl of (lv.slopes || [])) {
    surfaceKeepOuts.push([sl.x0 - 24, sl.x0 + 42, Math.min(sl.y0, sl.y1) - 30, Math.max(sl.y0, sl.y1) + 30]);
    surfaceKeepOuts.push([sl.x1 - 42, sl.x1 + 24, Math.min(sl.y0, sl.y1) - 30, Math.max(sl.y0, sl.y1) + 30]);
  }
  for (const tr of (lv.traps || [])) {
    if (tr.k === 'fake') {
      for (const fp of (tr.plates || [])) surfaceKeepOuts.push([fp.x - 14, fp.x + fp.w + 14, fp.y - 25, fp.y + fp.h + 15]);
    }
  }

  const movingSolidIndices = new Set();
  for (const tr of (lv.traps || [])) {
    if (tr.si !== undefined) movingSolidIndices.add(tr.si);
  }
  for (const ph of (lv.phantoms || [])) {
    if (ph.si !== undefined) movingSolidIndices.add(ph.si);
  }

  for (const f of (lv.flags || [])) {
    let validGround = false;
    for (let i = 0; i < (lv.solids || []).length; i++) {
      if (movingSolidIndices.has(i)) continue;
      const s = lv.solids[i];
      if (s.bonk) continue;
      if (f.x >= s[0] + 18 && f.x <= s[0] + s[2] - 18 && Math.abs(f.y - s[1]) <= 14) {
        f.y = s[1]; validGround = true; break;
      }
    }
    if (!validGround) {
      let bestDist = 1e9;
      for (let i = 0; i < (lv.solids || []).length; i++) {
        if (movingSolidIndices.has(i)) continue;
        const s = lv.solids[i];
        if (s.bonk || s[2] < 80 || s[1] < 100 || s[1] > H - 40) continue;
        const cx = clamp(f.x, s[0] + 28, s[0] + s[2] - 28);
        const d = Math.hypot(cx - f.x, s[1] - f.y);
        if (d < bestDist) { bestDist = d; f.x = cx; f.y = s[1]; }
      }
    }
    surfaceKeepOuts.push([f.x - 58, f.x + 58, f.y - 80, f.y + 20]);
  }

  function subtractIntervals(a, b, cuts) {
    let segs = [[a, b]];
    for (const [c0, c1] of cuts) {
      const next = [];
      for (const [s0, s1] of segs) {
        if (c1 <= s0 || c0 >= s1) next.push([s0, s1]);
        else {
          if (c0 > s0) next.push([s0, c0]);
          if (c1 < s1) next.push([c1, s1]);
        }
      }
      segs = next;
      if (!segs.length) break;
    }
    return segs.filter(([s0, s1]) => s1 - s0 >= 18);
  }

  const cleanSpikes = [];
  for (const spk of (lv.spikes || [])) {
    if (spk.bt !== undefined) {
      cleanSpikes.push(spk);
      continue;
    }
    const isPit = spk.pit || spk.y >= H - 45;
    if (isPit) {
      const pieces = subtractIntervals(spk.x, spk.x + spk.w, deepWalls);
      for (const [x0, x1] of pieces) {
        cleanSpikes.push(Object.assign({}, spk, { x: x0, w: x1 - x0 }));
      }
    } else {
      const relevantCuts = surfaceKeepOuts
        .filter((ko) => spk.y + spk.h >= ko[2] && spk.y <= ko[3])
        .map((ko) => [ko[0], ko[1]]);
      const pieces = subtractIntervals(spk.x, spk.x + spk.w, relevantCuts);
      for (const [x0, x1] of pieces) {
        cleanSpikes.push(Object.assign({}, spk, { x: x0, w: x1 - x0 }));
      }
    }
  }
  lv.spikes = cleanSpikes;

  const safePoints = [[lv.spawn[0] + PW / 2, lv.spawn[1] + PH / 2]];
  for (const f of (lv.flags || [])) safePoints.push([f.x, f.y - PH / 2]);

  if (lv.lasers) {
    lv.lasers = lv.lasers.filter((ls) => safePoints.every(([sx, sy]) => Math.hypot(ls.x - sx, ls.y - sy) > ls.len + 55));
  }
  if (lv.pendulums) {
    lv.pendulums = lv.pendulums.filter((pd) => safePoints.every(([sx, sy]) => Math.abs(pd.x - sx) > 110));
  }
  if (lv.blackHoles) {
    lv.blackHoles = lv.blackHoles.filter((bh) => safePoints.every(([sx, sy]) => Math.hypot(bh.x - sx, bh.y - sy) > bh.pullR + 30));
  }
  return lv;
}

// ============================================================================
// 6. HỆ THỐNG BẪY QUỶ DỊ ĐỘNG (GIẾT 1 LẦN LÀ HÓA GIẢI) & 24 BẪY ĐẠI HỌC
// ============================================================================
G.cursedConsumed = new Set();
G.chaosSeed = 1;

function v16InitAnomalies(L) {
  L.anomalies = L.anomalies || { doppels: [], hands: [], ghosts: [], spitters: [] };
  const seed = (G.lvIdx + 1) * 97 + (G.deaths + 1) * 31;

  // 1. ĐỒNG XU BIẾN HÓA NGẪU NHIÊN (Đã giết người chơi 1 lần -> Trở về đồng xu bình thường!):
  (L.coins || []).forEach((c, idx) => {
    const cid = 'coin_' + G.mode + '_' + G.lvIdx + '_' + idx;
    if (G.cursedConsumed.has(cid) || curPassive === 'wraith') {
      c.anomaly = 0; c.trig = false; return;
    }
    const h = hash1(seed + idx * 17.3);
    c.anomaly = h < 0.72 ? 0 : (1 + (Math.floor(h * 100) % 5));
    c.cid = cid; c.trig = false; c.x0 = c.x0 || c.x; c.y0 = c.y0 || c.y;
    c.x = c.x0; c.y = c.y0;
  });

  // 2. BÓNG MA KHÔNG NHÌN MẶT (WEEPING PHANTOM) & BÀN TAY HẮC ÁM:
  L.anomalies.doppels = [];
  L.anomalies.hands = [];
  const ghostId = 'ghost_' + G.mode + '_' + G.lvIdx;
  L.anomalies.ghosts = [];
  if (!G.cursedConsumed.has(ghostId) && L.w > 1800 && (G.lvIdx + G.deaths) % 2 === 0) {
    L.anomalies.ghosts.push({ id: ghostId, x: 520, y: GY - 140, frozen: false });
  }

  // 3. CÂY PHUN ĐỘC AXIT (Màn Đầm Lầy Độc):
  L.anomalies.spitters = [];
  if (L.biome === 'toxic') {
    for (let sx = 680; sx < L.w - 600; sx += 920) {
      L.anomalies.spitters.push({ x: sx, y: GY - 28, t: (sx * 0.01) % 2.5, glob: null });
    }
  }
}

function v16SpawnDoppelganger(L, me, fx, fy, flagIdx) {
  const did = 'doppel_' + G.mode + '_' + G.lvIdx + '_' + flagIdx;
  if (G.cursedConsumed.has(did)) return;
  let fakeName = 'Bóng Ma ' + (G.myName || 'Bunny');
  let fakeSlot = (me.slot + 1) % 10;
  let fakeSkin = Save.equipped();
  if (G.remotes.size > 0) {
    const arr = [...G.remotes.values()];
    const pick = arr[flagIdx % arr.length];
    fakeSlot = pick.slot;
    fakeName = G.names[pick.slot] || 'Đồng đội';
    fakeSkin = G.skins[pick.slot] || 'classic';
  }
  L.anomalies = L.anomalies || { doppels: [], hands: [], ghosts: [], spitters: [] };
  L.anomalies.doppels.push({
    id: did, x: fx - 48, y: fy - PH, face: 1, slot: fakeSlot, name: fakeName, skin: fakeSkin,
    age: 0, evil: false, life: 5.2,
  });
}

function v16UpdateAnomalies() {
  const L = G.L, me = G.me;
  if (!L || !me || me.dead || G.won) return;
  const A = L.anomalies; if (!A) return;
  const cx = me.x + PW / 2, cy = me.y + PH / 2, feet = me.y + PH;
  const immune = curPassive === 'antidote' || curPassive === 'wraith';

  // Đồng xu biến hóa ngẫu nhiên:
  for (const c of (L.coins || [])) {
    if (c.got || !c.anomaly) continue;
    const d = Math.hypot(cx - c.x, cy - c.y);
    if (c.anomaly === 1) {
      if (!c.trig && d < 88) { c.trig = true; Snd.grab(); }
      if (c.trig) {
        c.x += ((cx - c.x) / Math.max(1, d)) * 4.9;
        c.y += ((cy - c.y) / Math.max(1, d)) * 4.9;
        if (d < 22) { G.cursedConsumed.add(c.cid); die('mimic_coin'); return; }
      }
    } else if (c.anomaly === 2 && d < 75) {
      c.x += Math.sign(c.x - cx) * 4.5;
      c.y -= 1.2;
    } else if (d < 28) {
      c.got = true; c.pop = 0.5;
      G.cursedConsumed.add(c.cid);
      if (!immune) {
        if (c.anomaly === 3) { me.vy = 12; me.heavyT = 2.5; Snd.slam(); }
        else if (c.anomaly === 4) { me.rev = 2.8; Snd.shake(); }
        else if (c.anomaly === 5) {
          L.stalactites.push({ x: cx - 17, y: me.y - 260, w: 34, h: 66, st: 2, t: 0, fy: 0, vy: 9, gnd: feet + 40, dyn: true });
        }
      }
    }
  }
  if (me.heavyT > 0) { me.heavyT -= STEP; me.vy += GRAV * 0.85; }

  // Kẻ Giả Dạng Đồng Đội ở Checkpoint:
  for (let i = (A.doppels || []).length - 1; i >= 0; i--) {
    const dp = A.doppels[i];
    dp.age += STEP; dp.life -= STEP;
    if (dp.life <= 0) { puff(dp.x + PW / 2, dp.y + PH / 2, 10, '#7209b7', 1.2); A.doppels.splice(i, 1); continue; }
    const dx = cx - (dp.x + PW / 2), dy = cy - (dp.y + PH / 2), dist = Math.max(1, Math.hypot(dx, dy));
    dp.face = dx >= 0 ? 1 : -1;
    if (dp.age < 1.65) {
      dp.x += clamp((me.x - me.face * 42 - dp.x) * 0.12, -4.5, 4.5);
      dp.y += (me.y - dp.y) * 0.18;
    } else {
      if (!dp.evil) { dp.evil = true; Snd.shake(); sparkle(dp.x + PW / 2, dp.y + PH / 2, 14, 1.4, '#ff0055'); }
      dp.x += (dx / dist) * 5.3;
      dp.y += (dy / dist) * 4.2;
      if (dist < 24) {
        G.cursedConsumed.add(dp.id);
        die('doppelganger');
        return;
      }
    }
  }

  // Bóng Ma Không Nhìn Mặt:
  for (let i = (A.ghosts || []).length - 1; i >= 0; i--) {
    const gh = A.ghosts[i];
    const dx = cx - gh.x, dy = cy - gh.y, dist = Math.max(1, Math.hypot(dx, dy));
    if (dist > 750) continue;
    gh.frozen = (dx > 0 && me.face < 0) || (dx < 0 && me.face > 0);
    if (!gh.frozen) {
      gh.x += (dx / dist) * 3.85;
      gh.y += (dy / dist) * 3.1;
      if (dist < 24) {
        G.cursedConsumed.add(gh.id);
        die('weeping_ghost');
        return;
      }
    }
  }

  // Bàn Tay Hắc Ám Dưới Đất:
  const handKey = 'hand_' + G.mode + '_' + G.lvIdx + '_' + Math.floor(cx / 300);
  if (me.onGround && Math.abs(me.vx) < 0.3 && !G.cursedConsumed.has(handKey) && cx > 300) {
    me.idleT = (me.idleT || 0) + STEP;
    if (me.idleT > 0.95) {
      me.idleT = 0;
      A.hands.push({ id: handKey, x: cx, y: feet, t: 0, dur: 0.75 });
      Snd.shake();
    }
  } else me.idleT = 0;

  for (let i = (A.hands || []).length - 1; i >= 0; i--) {
    const hd = A.hands[i];
    hd.t += STEP;
    if (hd.t > 0.28 && hd.t < 0.62 && Math.abs(cx - hd.x) < 22 && Math.abs(feet - hd.y) < 34) {
      G.cursedConsumed.add(hd.id);
      die('abyss_hand');
      return;
    }
    if (hd.t >= hd.dur) A.hands.splice(i, 1);
  }

  // Cây Độc Phun Axit:
  for (const sp of (A.spitters || [])) {
    sp.t += STEP;
    if (sp.t >= 2.4 && Math.abs(cx - sp.x) < 520) {
      sp.t = 0;
      sp.glob = { x: sp.x, y: sp.y - 16, vx: clamp((cx - sp.x) * 0.018, -5.5, 5.5), vy: -8.2 };
    }
    if (sp.glob) {
      const g = sp.glob;
      g.x += g.vx; g.y += g.vy; g.vy += GRAV * 0.55;
      if (Math.hypot(cx - g.x, cy - g.y) < 20 && !immune) { die('toxic_acid'); return; }
      if (g.y > WORLD_H) sp.glob = null;
    }
  }
}

function v16DrawAnomalies(L) {
  const A = L.anomalies; if (!A) return;
  const T = G.lt;
  for (const dp of (A.doppels || [])) {
    drawBunny(dp.x, dp.y, {
      slot: dp.slot, skin: dp.skin, face: dp.face, vx: 3, vy: 0, ground: true, runT: T * 5,
      name: dp.evil ? '👹 ' + dp.name : dp.name,
    });
    if (dp.evil) {
      ctx.save(); ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(dp.x + PW / 2, dp.y + PH / 2, 26 + Math.sin(T * 20) * 4, 0, 6.3); ctx.stroke();
      ctx.restore();
    }
  }
  for (const gh of (A.ghosts || [])) {
    ctx.save();
    ctx.translate(gh.x, gh.y + Math.sin(T * 5) * 5);
    ctx.fillStyle = gh.frozen ? 'rgba(148,163,184,.65)' : 'rgba(244,63,94,.88)';
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, -6, 18, Math.PI, 0);
    ctx.lineTo(18, 18); ctx.lineTo(9, 12); ctx.lineTo(0, 18); ctx.lineTo(-9, 12); ctx.lineTo(-18, 18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gh.frozen ? '#334155' : '#ffeb3b';
    ctx.beginPath(); ctx.arc(-6, -6, 3.5, 0, 6.3); ctx.arc(6, -6, 3.5, 0, 6.3); ctx.fill();
    ctx.restore();
  }
  for (const hd of (A.hands || [])) {
    const reach = Math.sin(clamp(hd.t / hd.dur, 0, 1) * Math.PI) * 52;
    ctx.save();
    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hd.x - 14, hd.y); ctx.lineTo(hd.x - 10, hd.y - reach);
    ctx.lineTo(hd.x, hd.y - reach - 10); ctx.lineTo(hd.x + 10, hd.y - reach); ctx.lineTo(hd.x + 14, hd.y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  for (const sp of (A.spitters || [])) {
    ctx.save();
    ctx.fillStyle = '#7209b7'; ctx.strokeStyle = '#081c15'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(sp.x, sp.y + 10, 18, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#80ed99'; ctx.beginPath(); ctx.arc(sp.x, sp.y - 2, 6, 0, 6.3); ctx.fill();
    if (sp.glob) {
      ctx.fillStyle = '#80ed99'; ctx.strokeStyle = '#1b4332'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sp.glob.x, sp.glob.y, 9, 0, 6.3); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}

function v15RandomizeTrapsOnDeath(L) {
  G.chaosSeed = (G.chaosSeed * 1664525 + 1013904223) >>> 0;
  const rng = (k) => hash1(G.chaosSeed * 0.0001 + k * 13.37);

  for (let i = 0; i < (L.bonks || []).length; i++) {
    const bk = L.bonks[i];
    if (bk.baseX === undefined) bk.baseX = bk.x;
    if (!bk.rev) {
      bk.x = bk.baseX + Math.round((rng(i) - 0.5) * 34);
      const s = L.solids.find((q) => q.bonk === bk);
      if (s) s[0] = bk.x;
    }
  }

  for (let i = 0; i < (L.traps || []).length; i++) {
    const t = L.traps[i];
    if (t.k === 'fake' && t.allPos && t.realPlate) {
      const pick = Math.floor(rng(i + 77) * t.allPos.length) % t.allPos.length;
      t.realPlate.x = t.allPos[pick];
      let fi = 0;
      for (let j = 0; j < t.allPos.length; j++) {
        if (j === pick) continue;
        if (t.plates[fi]) { t.plates[fi].x = t.allPos[j]; t.plates[fi].used = false; fi++; }
      }
    } else if (t.k === 'sled') {
      t.x = t.x0; t.vx = 0; t.st = 0; t.wait = 0;
    } else if (t.k === 'syncgate' || t.k === 'skygate') {
      t.open = false;
      if (L.gates[t.gi]) L.gates[t.gi].act = false;
    } else if (t.k === 'double_bluff' || t.k === 'shift_ledge') {
      t.st = 0; t.t = 0; t.cur = 0;
      if (L.solids[t.si]) L.solids[t.si][0] = t.baseX;
      if (t.topSpk) { t.topSpk.x = t.baseX + 115; t.topSpk.hid = true; t.topSpk.live = false; t.topSpk.ph = 0; }
    } else if (t.k === 'swap_pad') {
      t.used = false;
    }
  }
  for (const m of (L.mimics || [])) { m.trig = false; m.vx = 0; m.vy = 0; m.x = m.x0; m.y = m.y0; }
  v16InitAnomalies(L);
}

function initV11Level(L) {
  L.slopes = L.slopes || []; L.bonks = L.bonks || []; L.rocks = L.rocks || [];
  L.portals = L.portals || []; L.sharks = L.sharks || []; L.gravZones = L.gravZones || [];
  L.decoys = L.decoys || []; L.lasers = L.lasers || []; L.blackHoles = L.blackHoles || [];
  L.mimics = L.mimics || []; L.conveyors = L.conveyors || []; L.pendulums = L.pendulums || [];
  L.turrets = L.turrets || []; L.phantoms = L.phantoms || [];
  L.solids = L.solids.filter((s) => !s.bonk);
  L.bonks.forEach((bk, i) => {
    bk.i = i;
    if (bk.rev === undefined) bk.rev = false;
    bk.sh = 0;
    const r = [bk.x, bk.y, bk.w, bk.h]; r.bonk = bk; L.solids.push(r);
  });
  L.rocks.forEach((r) => { r.cyc = -1; });
  const k = L.key;
  if (k && k.run) {
    if (k.hx === undefined) { k.hx = k.x; k.hy = k.y; }
    k.x = k.hx; k.y = k.hy; k.vx = 0; k.vy = 0; k.fl = 0; k.t = 0; k.tx = k.x; k.ty = k.y; k.arc = null; k.cool = 0;
    const R = k.run;
    L.decoys = [
      { x: R.x0 + 130, y: R.gy - 125, boom: false },
      { x: R.x1 - 130, y: R.gy - 125, boom: false },
    ];
  }
  v16InitAnomalies(L);
}

function updateRunKey(bodies) {
  const L = G.L, k = L.key;
  if (!k || !k.run || G.keyGot) return;
  const R = k.run;
  if (isNet() && !isHostSlot()) { k.x += (k.tx - k.x) * 0.35; k.y += (k.ty - k.y) * 0.35; return; }
  let nb = null, nd = 1e9;
  for (const b of bodies) {
    if (b.dead) continue;
    const d = Math.hypot(b.x + PW / 2 - k.x, b.y + PH / 2 - k.y);
    if (d < nd) { nd = d; nb = b; }
  }
  k.t += STEP;
  if (k.cool > 0) k.cool -= STEP;
  const maxBlinks = 4;
  if (nb && nd < 130 && !(k.cool > 0) && k.fl < maxBlinks) {
    const spots = [
      [R.x0 + 70, R.gy - 150],
      [R.x1 - 70, R.gy - 155],
      [(R.x0 + R.x1) / 2, R.gy - 190],
      [clamp(nb.x + (nb.face > 0 ? -230 : 230), R.x0 + 55, R.x1 - 55), R.gy - 65],
    ];
    const pick = spots[(k.fl + (G.chaosSeed % 4)) % spots.length];
    sparkle(k.x, k.y, 16, 1.5, '#ff4d6d');
    k.x = pick[0]; k.y = pick[1];
    k.fl++; k.cool = 0.72;
    Snd.djump();
    sparkle(k.x, k.y, 18, 1.6, '#ffd43b');
  } else if (nb && nd < 175 && k.fl >= maxBlinks) {
    k.x = clamp(k.x + Math.sign(k.x - nb.x) * 2.1, R.x0 + 45, R.x1 - 45);
    k.y = R.gy - 90 + Math.sin(G.lt * 6.5) * 52;
  }
}

function onBonk(P, s, how) {
  const bk = s.bonk;
  P.vx = 0;
  if (how === 'head') P.vy = 1.5;
  if (!bk.rev) {
    bk.rev = true; bk.sh = 1; P.wlock = Math.max(P.wlock, 16);
    Snd.pop(); G.shake = Math.max(G.shake, 6);
    sparkle(bk.x + bk.w / 2, bk.y + bk.h, 12, 1.3, '#ffcc66'); puff(bk.x + bk.w / 2, bk.y + bk.h, 6, '#fff', 1);
    netEv({ t: 'bonk', i: bk.i });
  }
}

function v11TrapAct(t, i, a, v, who) {
  const L = G.L;
  if (t.k === 'ceil') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t0 = +v || G.lt; Snd.shake(); G.shake = Math.max(G.shake, 3); }
  } else if (t.k === 'ferry') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t0 = +v || G.lt; Snd.shake(); }
  } else if (t.k === 'door2') {
    if (a === 'flee' && t.st === 0) { t.st = 1; t.t = 0; t.from = L.exit.x; Snd.shake(); G.shake = Math.max(G.shake, 3); }
  } else if (t.k === 'betray') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 3.8; Snd.shake();
      const n = t.cr.length;
      t.cr.forEach((ci, k) => { const c = L.crumbles[ci]; if (c && c.st === 0) { c.st = 1; c.t = 0.07 + (n - 1 - k) * 0.07; } });
    }
  } else if (t.k === 'pass_drop') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 2.8;
      t.cr.forEach((ci, k) => { const c = L.crumbles[ci]; if (c && c.st === 0) { c.st = 1; c.t = 0.03 + k * 0.04; c.fast = true; } });
    }
  } else if (t.k === 'ambush') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 0.2;
      for (const q of (L.stalactites || [])) if (q.sniper && q.st === 0 && Math.abs(q.x - t.zx1) < 340) { q.st = 2; q.vy = 9.5; q.vx = q.aimVx || 0; q.fy = 0; q.gnd = groundBelow(q.x, q.x + q.w, q.y + q.h); }
    }
  } else if (t.k === 'shift_ledge' || t.k === 'double_bluff') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t = 0; }
    else if (a === 'hit' && t.st === 1) {
      t.st = 2; t.t = 1.6;
      if (t.topSpk) { t.topSpk.hid = false; t.topSpk.live = true; t.topSpk.ph = 1; }
      Snd.slam();
    }
  } else if (t.k === 'troll_spring') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 4.0;
      const sp = L.springs[t.sIdx]; if (sp) sp.power = 23.8;
      for (const s of L.spikes) if (s.bt === i) { s.hid = false; s.live = true; s.ph = 1; }
    }
  } else if (t.k === 'syncgate' || t.k === 'skygate') {
    if (a === 'sync') {
      t.open = true;
      if (L.gates[t.gi]) L.gates[t.gi].act = true;
      Snd.gate(true);
    }
  }
}

function v11ResetTrap(L, t) {
  if (t.k === 'ceil') { t.cb = t.top; }
  else if (t.k === 'ferry') { t.cx = t.cx0; t.px = t.cx0; t.dx = 0; t.dir = 0; t.rot = 0; }
  else if (t.k === 'door2') { const e = L.exit; e.x = t.ex0; e.y = t.ey0; e.lock = false; e.legs = false; e.hide = false; t.n = 0; t.from = t.ex0; }
  else if (t.k === 'shift_ledge' || t.k === 'double_bluff') {
    t.cur = 0; const s = L.solids[t.si]; if (s) s[0] = t.baseX;
    if (t.topSpk) { t.topSpk.x = t.baseX + 115; t.topSpk.hid = true; t.topSpk.live = false; t.topSpk.ph = 0; }
  }
  else if (t.k === 'troll_spring') { const sp = L.springs[t.sIdx]; if (sp) sp.power = 17.5; }
  else if (t.k === 'sled') { t.x = t.x0; t.vx = 0; t.st = 0; t.wait = 0; if (L.solids[t.si]) L.solids[t.si][0] = t.x0; }
  else if (t.k === 'syncgate' || t.k === 'skygate') { t.open = false; if (L.gates[t.gi]) L.gates[t.gi].act = false; }
  else if (t.k === 'swap_pad') { t.used = false; }
}

function trapAct(i, a, v, who) {
  const L = G.L; if (!L || !L.traps) return;
  const t = L.traps[i]; if (!t) return;
  const mine = who === G.myslot;
  if (t.k === 'bait') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t = 0.13; }
  } else if (t.k === 'fake') {
    const f = t.plates[v | 0];
    if (a === 'hit' && f && !f.used) {
      f.used = true; Snd.plate(true);
      if (f.v === 'stalac') {
        for (let q = 0; q < 4; q++) L.stalactites.push({ x: f.x - 40 + q * 65, y: f.y + 10 - 300, w: 34, h: 66, st: 2, t: 0, fy: 0, vy: 6.5, gnd: f.y + 10, dyn: true });
      } else if (mine) { G.me.rev = 4.2; }
    }
  } else if (t.k === 'door') {
    const e = L.exit;
    if (a === 'flee' && t.st === 0) { t.st = 1; t.t = 0; Snd.shake(); }
    else if (a === 'fix') {
      if (t.st === 0) { t.st = 3; e.lock = false; e.x = t.ex0; e.y = t.ey0; Snd.key(); sparkle(e.x + e.w / 2, e.y + e.h / 2, 18, 1.4, '#ffd43b'); }
    }
  } else if (t.k === 'arena') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t0 = +v || G.lt; t.empty = 0; Snd.shake(); }
    else if (a === 'done' && t.st === 1) { t.st = 2; Snd.gate(true); }
    else if (a === 'reset' && t.st === 1) { t.st = 0; t.empty = 0; }
  } else {
    v11TrapAct(t, i, a, v, who);
  }
}

function updateTraps(bodies) {
  const L = G.L, me = G.me;
  const cx = me.x + PW / 2, cy = me.y + PH / 2, feet = me.y + PH, alive = !me.dead && !G.won;
  const host = isHostSlot();

  v16UpdateAnomalies();

  if (me.portalCd > 0) me.portalCd -= STEP;
  for (const pt of (L.portals || [])) {
    if (alive && !(me.portalCd > 0) && Math.hypot(cx - pt.x0, cy - pt.y0) < 38) {
      me.x = pt.x1 - PW / 2; me.y = pt.y1 - PH / 2; me.portalCd = 1.1;
      Snd.key(); sparkle(pt.x1, pt.y1, 20, 1.6, '#00ffe0');
      break;
    }
  }

  for (const dc of (L.decoys || [])) {
    if (!dc.boom && alive && Math.hypot(cx - dc.x, cy - dc.y) < 32) {
      dc.boom = true;
      Snd.slam(); G.shake = 9;
      sparkle(dc.x, dc.y, 26, 2.2, '#ff2d55');
      me.vy = -10.5; me.vx = -me.face * 8.5;
      die('decoy_key');
    }
  }

  for (const m of (L.mimics || [])) {
    const dist = Math.hypot(cx - m.x, cy - m.y);
    if (!m.trig && alive && dist < 82) {
      m.trig = true; Snd.grab();
    }
    if (m.trig && alive) {
      const dx = cx - m.x, dy = cy - m.y, d = Math.max(1, Math.hypot(dx, dy));
      m.x += (dx / d) * 4.8;
      m.y += (dy / d) * 4.8;
      if (d < 22) die('mimic_coin');
    }
  }

  for (const bh of (L.blackHoles || [])) {
    const dx = bh.x - cx, dy = bh.y - cy, d = Math.hypot(dx, dy);
    if (alive && d < bh.pullR && d > 8) {
      const f = (1 - d / bh.pullR) * 0.58;
      me.vx += (dx / d) * f;
      me.vy += (dy / d) * f;
      if (d < bh.killR) die('black_hole');
    }
  }

  for (const cv of (L.conveyors || [])) {
    if (alive && me.onGround && cx >= cv.x && cx <= cv.x + cv.w && Math.abs(feet - cv.y) < 10) {
      me.x += cv.spd;
    }
  }

  for (const ph of (L.phantoms || [])) {
    const wave = Math.sin(G.lt * ph.spd + ph.phase);
    ph.solid = wave > -0.15;
    ph.alpha = clamp((wave + 0.35) / 0.8, 0.08, 1);
    const s = L.solids[ph.si];
    if (s) s[1] = ph.solid ? ph.y : 9999;
  }

  for (const trt of (L.turrets || [])) {
    const dist = Math.hypot(cx - trt.x, cy - trt.y);
    trt.ang = Math.atan2(cy - trt.y, cx - trt.x);
    if (dist < 560 && alive) {
      trt.charge = (trt.charge || 0) + STEP;
      if (trt.charge >= trt.period) {
        trt.charge = 0; trt.fireT = 0.22;
        trt.hitX = cx; trt.hitY = cy;
        Snd.slam();
      }
      if (trt.fireT > 0) {
        trt.fireT -= STEP;
        const A = cy - trt.y, B = trt.x - cx, C = -(A * trt.x + B * trt.y);
        const lineDist = Math.abs(A * cx + B * cy + C) / Math.max(1, Math.hypot(A, B));
        if (lineDist < 16 && Math.abs(trt.ang - Math.atan2(trt.hitY - trt.y, trt.hitX - trt.x)) < 0.14) {
          die('sniper_laser');
        }
      }
    } else {
      trt.charge = Math.max(0, (trt.charge || 0) - STEP * 0.5);
    }
  }

  for (const sh of (L.sharks || [])) {
    sh.cx = pingPong(sh.x0, sh.x1, sh.speed, sh.off, G.lt);
    const dir = Math.cos(((G.lt + sh.off) * sh.speed * 60 / Math.max(1, sh.x1 - sh.x0)) * Math.PI) >= 0 ? 1 : -1;
    sh.dir = dir;
    const tg = nearestBodyTo(sh.cx, sh.cy);
    const wantY = tg ? clamp(tg.y + PH / 2, sh.minY, sh.maxY) : sh.baseY;
    sh.cy += (wantY - sh.cy) * 0.055;
    if (alive && rectsOverlap(me.x + 4, me.y + 4, PW - 8, PH - 8, sh.cx - 48, sh.cy - 22, 96, 44)) {
      die('shark');
    }
  }

  const tr = L.traps; if (!tr || !tr.length) return;
  for (let i = 0; i < tr.length; i++) {
    const t = tr[i];
    if (t.k === 'bait') {
      const sp = t._sp || (t._sp = L.spikes.filter((s) => s.bt === i));
      if (t.st === 0) {
        if (alive) {
          const inside = cx > t.zx0 && cx < t.zx1 && Math.abs(feet - t.gy) < 170;
          if (inside) {
            const bt = (me.bt = me.bt || {});
            const s = (bt[i] = bt[i] || { armed: false, maxX: cx });
            const grounded = me.onGround && Math.abs(feet - t.gy) < 4;
            if (grounded) { s.armed = true; if (cx > s.maxX) s.maxX = cx; }
            else if (s.armed && feet < t.gy - 12) trapSend(i, 'fire', 0);
            if (t.st === 0 && grounded && s.armed && me.vx < -1.2 && cx < s.maxX - 45) trapSend(i, 'fire', 1);
          } else if (me.bt && me.bt[i]) { me.bt[i].armed = false; me.bt[i].maxX = cx; }
        }
      } else if (t.st === 1) {
        t.t -= STEP; sp.forEach((s) => { s.hid = false; s.ph = clamp(1 - t.t / 0.13, 0, 1) * 0.4; });
        if (t.t <= 0) { t.st = 2; t.t = 1.8; sp.forEach((s) => { s.live = true; s.ph = 1; }); Snd.slam(); }
      } else if (t.st === 2) {
        t.t -= STEP; if (t.t <= 0) { t.st = 3; t.t = 0.35; sp.forEach((s) => { s.live = false; }); }
      } else if (t.st === 3) {
        t.t -= STEP; sp.forEach((s) => { s.ph = Math.max(0, t.t / 0.35); });
        if (t.t <= 0) { t.st = 4; t.t = 0.7; sp.forEach((s) => { s.hid = true; s.ph = 0; }); }
      } else { t.t -= STEP; if (t.t <= 0) t.st = 0; }
    } else if (t.k === 'pass_drop') {
      if (t.st === 0 && alive && cx > t.x0 + (t.x1 - t.x0) * 0.35 && cx < t.x1 + 30 && Math.abs(feet - t.gy) < 28) {
        trapSend(i, 'fire', G.lt);
      } else if (t.st === 1) {
        t.t -= STEP; if (t.t <= 0) t.st = 0;
      }
    } else if (t.k === 'ambush') {
      const sp = t._sp || (t._sp = L.spikes.filter((s) => s.bt === i));
      if (t.st === 0 && alive && cx > t.zx0 + 65 && cx < t.zx1 && Math.abs(feet - t.gy) < 42) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1) {
        t.t -= STEP;
        if (t.t <= 0) { t.st = 2; t.t = 1.9; sp.forEach((s) => { s.hid = false; s.live = true; s.ph = 1; }); Snd.slam(); }
      } else if (t.st === 2) {
        t.t -= STEP;
        if (t.t <= 0) { t.st = 0; sp.forEach((s) => { s.hid = true; s.live = false; s.ph = 0; }); }
      }
    } else if (t.k === 'shift_ledge' || t.k === 'double_bluff') {
      const s = L.solids[t.si];
      if (t.st === 0 && alive && cx > t.gx - 24 && cx < t.baseX + 45 && !me.onGround && me.vy < 4) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1 && s) {
        t.t += STEP;
        const u = clamp(t.t / 0.16, 0, 1);
        t.cur = t.shift * u;
        s[0] = t.baseX + t.cur;
        if (t.topSpk) t.topSpk.x = s[0] + 115;
        if (t.k === 'double_bluff' && alive && me.onGround && cx > s[0] + 95 && cx < s[0] + s[2] - 10) {
          trapSend(i, 'hit', 0);
        }
        if (t.t > 3.2) { t.st = 0; t.cur = 0; s[0] = t.baseX; if (t.topSpk) t.topSpk.x = t.baseX + 115; }
      } else if (t.st === 2) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 0; t.cur = 0; if (s) s[0] = t.baseX;
          if (t.topSpk) { t.topSpk.x = t.baseX + 115; t.topSpk.hid = true; t.topSpk.live = false; t.topSpk.ph = 0; }
        }
      }
    } else if (t.k === 'troll_spring') {
      const sp = L.springs[t.sIdx];
      if (t.st === 0 && sp && sp.sq > 0.5) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 0; if (sp) sp.power = 17.5;
          for (const s of L.spikes) if (s.bt === i) { s.hid = true; s.live = false; s.ph = 0; }
        }
      }
    } else if (t.k === 'sled') {
      const totalPlayers = presentCount();
      let riders = 0, meOnSled = false;
      for (const b of bodies) {
        if (b.dead) continue;
        const bFeet = b.y + PH;
        if (b.x + PW - 4 > t.x && b.x + 4 < t.x + t.w && bFeet >= t.y - 6 && bFeet <= t.y + 18) {
          riders++;
          if (b === me) meOnSled = true;
        }
      }
      if (t.st === 0) {
        t.dx = 0;
        if (riders > 0) {
          t.wait += STEP;
          if (riders >= totalPlayers || t.wait >= 1.35) { t.st = 1; Snd.shake(); }
        } else t.wait = 0;
      } else if (t.st === 1) {
        const prevX = t.x;
        t.vx = Math.min(t.maxV || 6.0, (t.vx || 1.6) + 0.045);
        t.x = Math.min(t.x1, t.x + t.vx);
        t.dx = t.x - prevX;
        if (totalPlayers > 1 && t.x > t.x0 + (t.x1 - t.x0) * 0.36 && t.x < t.x1 - 150 && riders < totalPlayers) {
          t.st = 2; t.shatterT = 2.0; t.dx = 0;
          Snd.crumble(); G.shake = 10;
          debris(t.x, t.y, t.w, 26, 22, '#9ad7f5');
          toast('🧊 Đi lẻ bỏ rơi đồng đội — Tảng băng nổ tung!');
          if (meOnSled) die('sled_betray');
        } else if (t.x >= t.x1) t.dx = 0;
      } else if (t.st === 2) {
        t.dx = 0; t.shatterT -= STEP;
        if (t.shatterT <= 0) { t.st = 0; t.x = t.x0; t.vx = 0; t.wait = 0; }
      }
      const s = L.solids[t.si];
      if (s) { s[0] = t.st === 2 ? -9999 : t.x; s[1] = t.y; }
      if (meOnSled && t.st === 1) me.x += t.dx;
    } else if (t.k === 'redeye') {
      if (cx < t.x0 || cx > t.x1) continue;
      const cycle = 4.5, ph = (G.lt + (t.off || 0)) % cycle;
      t.state = ph < 2.45 ? 0 : ph < 3.2 ? 1 : 2;
      if (t.state === 2 && alive && (input.l || input.r || input.j || Math.abs(me.vx) > 1.7 || (!me.onGround && Math.abs(me.vy) > 3.4))) {
        sparkle(cx, cy, 24, 2.0, '#ff2d55'); G.shake = 9;
        die('redeye');
      }
    } else if (t.k === 'syncgate') {
      const g = L.gates[t.gi];
      if (!g || t.open) { if (g) g.act = true; continue; }
      let allAirborneNear = bodies.length > 0, someoneNear = false;
      for (const b of bodies) {
        if (b.dead) { allAirborneNear = false; break; }
        if (Math.abs((b.x + PW / 2) - t.x) < 280) someoneNear = true;
        if (b.onGround || Math.abs((b.x + PW / 2) - t.x) > 350) { allAirborneNear = false; break; }
      }
      if (someoneNear && allAirborneNear) {
        t.open = true; g.act = true;
        Snd.gate(true); sparkle(g.x + g.w / 2, g.y + g.h / 2, 22, 1.6, '#70e000');
        if (isNet()) trapSend(i, 'sync', 1);
      }
    } else if (t.k === 'skygate') {
      const g = L.gates[t.gi];
      if (!g || t.open) { if (g) g.act = true; continue; }
      for (const b of bodies) {
        if (!b.dead && rectsOverlap(b.x, b.y, PW, PH, t.bx, t.by, 54, 26)) {
          t.open = true; g.act = true;
          Snd.gate(true); sparkle(t.bx + 27, t.by + 13, 22, 1.6, '#ffd43b');
          if (isNet()) trapSend(i, 'sync', 1);
          break;
        }
      }
    } else if (t.k === 'swap_pad' && !t.used && alive) {
      if (Math.hypot(cx - t.x, cy - t.y) < 34 && G.remotes.size > 0) {
        const others = [...G.remotes.values()].filter((r) => !r.dead);
        if (others.length) {
          t.used = true;
          const target = others[G.chaosSeed % others.length];
          const ox = me.x, oy = me.y;
          me.x = target.x; me.y = target.y;
          Snd.djump(); sparkle(ox, oy, 18, 1.5, '#ff2bd6'); sparkle(me.x, me.y, 18, 1.5, '#00f5d4');
        }
      }
    } else if (t.k === 'fake') {
      for (let j = 0; j < t.plates.length; j++) {
        const f = t.plates[j];
        let pr = false;
        for (const b of bodies) if (standsOn(b, f)) { pr = true; break; }
        f.pr = pr; f.on = pr;
        if (!f.used && alive && standsOn(me, f)) trapSend(i, 'hit', j);
      }
    } else if (t.k === 'door') {
      const e = L.exit;
      let down = false;
      for (const b of bodies) if (standsOn(b, t.btn)) { down = true; break; }
      if (down && !t.btnDown) Snd.plate(true);
      t.btnDown = down;
      if (t.st === 0) {
        e.lock = true;
        if (alive) {
          if (standsOn(me, t.btn)) trapSend(i, 'fix', 0);
          else if (Math.hypot(cx - (e.x + e.w / 2), cy - (e.y + e.h / 2)) < 120) trapSend(i, 'flee', 0);
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
        if (alive && cx > t.trig && cx < t.x1 - 120 && me.onGround && Math.abs(feet - t.gy) < 4) trapSend(i, 'fire', G.lt);
      } else if (t.st === 1) {
        const tt = G.lt - t.t0;
        if (host) {
          let inside = 0;
          for (const b of bodies) {
            if (b.dead) continue;
            const bcx = b.x + PW / 2;
            if (bcx > t.x0 - 10 && bcx < t.x1 + 10 && b.y + PH > t.gy - 240 && b.y < t.gy + 10) inside++;
          }
          if (tt > 1.2 && inside === 0) t.empty += STEP; else t.empty = 0;
          if (t.empty > 1.0) trapSend(i, 'reset', 0);
          else if (tt >= t.dur) trapSend(i, 'done', 0);
        }
      }
    } else {
      updateV11Trap(t, i, me, bodies);
    }
  }
  for (let q = L.stalactites.length - 1; q >= 0; q--) if (L.stalactites[q].dyn && L.stalactites[q].gone) L.stalactites.splice(q, 1);
}

function updateStalactites(bodies) {
  const L = G.L;
  for (const s of (L.stalactites || [])) {
    if (s.st === 0) {
      for (const b of bodies) {
        const cx = b.x + PW / 2 + (b.vx || 0) * 14;
        if (cx > s.x - 68 && cx < s.x + s.w + 68 && b.y > s.y + s.h * 0.4 && b.y < s.y + s.h + 540) {
          s.st = 1; s.t = 0.22; s.aimVx = clamp((b.vx || 0) * 0.45, -3.2, 3.2);
          break;
        }
      }
    } else if (s.st === 1) {
      s.t -= STEP;
      if (s.t <= 0) { s.st = 2; s.vy = 3.2; s.fy = 0; if (s.gnd === undefined) s.gnd = groundBelow(s.x, s.x + s.w, s.y + s.h); }
    } else if (s.st === 2) {
      s.vy = Math.min(s.vy + 1.05, 22); s.fy += s.vy;
      if (s.aimVx) s.x += s.aimVx;
      if (s.y + s.h + s.fy >= s.gnd) {
        s.fy = Math.max(0, s.gnd - s.y - s.h); s.st = 3; s.t = 2.8;
        debris(s.x - 8, s.gnd - 8, s.w + 16, 8, 10, '#8d7b73');
      }
    } else {
      s.t -= STEP;
      if (s.t <= 0) { s.st = 0; s.fy = 0; s.vy = 0; if (s.dyn) s.gone = true; }
    }
  }
}

function hazardCheck(P) {
  const L = G.L;
  const hx = P.x + 4, hy = P.y + 5, hw = PW - 8, hh = PH - 8;
  const cx = P.x + PW / 2, cy = P.y + PH / 2;

  for (const s of L.spikes) {
    if (s.hid) continue;
    if (G.mode === 'coop' && (s.pit || s.y >= WORLD_H - 42) && !P.onGround) {
      const st = v15GetSquadLinks(P);
      if (st && st.bestAnchor && st.bestAnchor.y < P.y - 18) {
        P.y = Math.min(P.y, s.y - PH - 14);
        if (P.vy > 0) P.vy = -7.5;
        continue;
      }
    }
    let sy = s.dir === 'up' ? s.y + 7 : s.y, sh = s.h - 7;
    if (s.bt !== undefined) {
      if (!s.live) continue;
      const k = clamp(s.ph, 0, 1); sy = s.y + s.h * (1 - k) + 7; sh = s.h * k - 7;
      if (sh <= 0) continue;
    }
    if (rectsOverlap(hx, hy, hw, hh, s.x + 3, sy, s.w - 6, sh)) return 'spikes';
  }

  for (const ls of (L.lasers || [])) {
    const ang = G.lt * ls.spd + (ls.off || 0);
    for (let b = 0; b < (ls.blades || 2); b++) {
      const a = ang + (b * Math.PI * 2) / (ls.blades || 2);
      const x1 = ls.x + Math.cos(a) * ls.len, y1 = ls.y + Math.sin(a) * ls.len;
      const dx = x1 - ls.x, dy = y1 - ls.y, len2 = dx * dx + dy * dy;
      const u = clamp(((cx - ls.x) * dx + (cy - ls.y) * dy) / Math.max(1, len2), 0, 1);
      if (Math.hypot(cx - (ls.x + u * dx), cy - (ls.y + u * dy)) < 14) return 'laser';
    }
  }

  for (const pd of (L.pendulums || [])) {
    const th = Math.sin(G.lt * pd.spd + pd.off) * 1.05;
    const bx = pd.x + Math.sin(th) * pd.len, by = pd.y + Math.cos(th) * pd.len;
    if (circleHitsRect(bx, by, pd.r - 4, hx, hy, hw, hh)) return 'pendulum';
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
  const vh = v11Hazard(hx, hy, hw, hh);
  if (vh) return vh;
  if (P.y > (L.h || WORLD_H) + 90 || (P.gDir < 0 && P.y < -120)) return 'fall';
  return null;
}

function drawTraps(L) {
  const T = G.lt;
  for (const gz of (L.gravZones || [])) {
    ctx.save();
    const gr = ctx.createLinearGradient(0, gz.y0, 0, gz.y1);
    gr.addColorStop(0, 'rgba(190,90,255,.30)');
    gr.addColorStop(0.5, 'rgba(90,210,255,.12)');
    gr.addColorStop(1, 'rgba(190,90,255,.30)');
    ctx.fillStyle = gr;
    ctx.fillRect(gz.x0, gz.y0, gz.x1 - gz.x0, gz.y1 - gz.y0);
    ctx.fillStyle = 'rgba(235,200,255,.85)'; ctx.font = '800 13px sans-serif'; ctx.textAlign = 'center';
    for (let x = gz.x0 + 70; x < gz.x1 - 40; x += 150) {
      const yOff = ((T * 95 + x) % Math.max(60, gz.y1 - gz.y0));
      ctx.fillText('▲ PHẢN TRỌNG LỰC ▲', x, gz.y1 - yOff);
    }
    ctx.restore();
  }

  for (const ph of (L.phantoms || [])) {
    ctx.save();
    ctx.globalAlpha = ph.alpha || 0.5;
    ctx.fillStyle = ph.solid ? '#38bdf8' : '#f43f5e';
    ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
    rr(ph.x, ph.y, ph.w, 18, 5); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  for (const cv of (L.conveyors || [])) {
    ctx.save();
    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
    rr(cv.x, cv.y, cv.w, 18, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = cv.spd > 0 ? '#38bdf8' : '#f97316';
    const dir = cv.spd > 0 ? 1 : -1;
    const stepOff = ((T * Math.abs(cv.spd) * 45) % 28) * dir;
    for (let px = cv.x + 14; px < cv.x + cv.w - 14; px += 28) {
      const ax = px + stepOff;
      ctx.beginPath();
      ctx.moveTo(ax - 5 * dir, cv.y + 4); ctx.lineTo(ax + 5 * dir, cv.y + 9); ctx.lineTo(ax - 5 * dir, cv.y + 14);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const bh of (L.blackHoles || [])) {
    ctx.save();
    ctx.translate(bh.x, bh.y);
    const rg = ctx.createRadialGradient(0, 0, bh.killR * 0.3, 0, 0, bh.pullR);
    rg.addColorStop(0, 'rgba(0,0,0,1)');
    rg.addColorStop(0.22, 'rgba(139,92,246,.85)');
    rg.addColorStop(0.55, 'rgba(56,189,248,.25)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(0, 0, bh.pullR, 0, 6.3); ctx.fill();
    ctx.rotate(-T * 4.5);
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath(); ctx.arc(0, 0, bh.killR + k * 6, k * 1.5, k * 1.5 + 1.8); ctx.stroke();
    }
    ctx.fillStyle = '#030712';
    ctx.beginPath(); ctx.arc(0, 0, bh.killR * 0.85, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  for (const ls of (L.lasers || [])) {
    const ang = T * ls.spd + (ls.off || 0);
    ctx.save();
    for (let b = 0; b < (ls.blades || 2); b++) {
      const a = ang + (b * Math.PI * 2) / (ls.blades || 2);
      const x1 = ls.x + Math.cos(a) * ls.len, y1 = ls.y + Math.sin(a) * ls.len;
      ctx.strokeStyle = 'rgba(244,63,94,.35)'; ctx.lineWidth = 11; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ls.x, ls.y); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = '#ff1744'; ctx.lineWidth = 4.5;
      ctx.beginPath(); ctx.moveTo(ls.x, ls.y); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(ls.x, ls.y); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ls.x, ls.y, 14, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  for (const pd of (L.pendulums || [])) {
    const th = Math.sin(T * pd.spd + pd.off) * 1.05;
    const bx = pd.x + Math.sin(th) * pd.len, by = pd.y + Math.cos(th) * pd.len;
    ctx.save();
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(pd.x, pd.y); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(pd.x, pd.y, 9, 0, 6.3); ctx.fill();
    drawSaw(bx, by, pd.r, T * 1.5);
    ctx.restore();
  }

  for (const trt of (L.turrets || [])) {
    ctx.save();
    if (trt.charge > 0.2) {
      const ratio = clamp(trt.charge / trt.period, 0, 1);
      ctx.strokeStyle = trt.fireT > 0 ? '#ffffff' : 'rgba(255,23,68,' + (0.2 + ratio * 0.75).toFixed(2) + ')';
      ctx.lineWidth = trt.fireT > 0 ? 7 : (1.5 + ratio * 2.5);
      ctx.setLineDash(trt.fireT > 0 ? [] : [8, 6]);
      ctx.beginPath();
      ctx.moveTo(trt.x, trt.y);
      ctx.lineTo(trt.x + Math.cos(trt.ang || 0) * 600, trt.y + Math.sin(trt.ang || 0) * 600);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.translate(trt.x, trt.y);
    ctx.rotate(trt.ang || 0);
    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
    ctx.fillRect(0, -6, 26, 12); ctx.strokeRect(0, -6, 26, 12);
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, 6.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff1744'; ctx.beginPath(); ctx.arc(4, 0, 5, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  for (const m of (L.mimics || [])) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.fillStyle = m.trig ? '#ef4444' : '#ffca28';
    ctx.strokeStyle = m.trig ? '#7f1d1d' : '#b8860b';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.3); ctx.fill(); ctx.stroke();
    if (m.trig) {
      ctx.fillStyle = '#fff';
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath(); ctx.moveTo(k * 4 - 2, -2); ctx.lineTo(k * 4, 5); ctx.lineTo(k * 4 + 2, -2); ctx.fill();
      }
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath(); ctx.arc(-4, -5, 2.5, 0, 6.3); ctx.arc(4, -5, 2.5, 0, 6.3); ctx.fill();
    } else {
      ctx.fillStyle = '#fff3b0'; ctx.fillRect(-2, -6, 4, 12);
    }
    ctx.restore();
  }

  for (const pt of (L.portals || [])) {
    [[pt.x0, pt.y0, '#00ffe0'], [pt.x1, pt.y1, '#ff2bd6']].forEach(([px, py, col]) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(T * 4);
      ctx.strokeStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 32, 0, 0, 6.3); ctx.stroke();
      ctx.fillStyle = 'rgba(20,10,45,.75)'; ctx.fill();
      ctx.restore();
    });
  }
  if (!G.keyGot) {
    for (const dc of (L.decoys || [])) if (!dc.boom) drawKeyIcon(dc.x, dc.y, T + 1.5);
  }

  for (const sh of (L.sharks || [])) {
    ctx.save();
    ctx.translate(sh.cx, sh.cy);
    ctx.scale(sh.dir || 1, 1);
    const wag = Math.sin(T * 14) * 8;
    const bite = Math.abs(Math.sin(T * 7)) * 0.28;

    ctx.fillStyle = '#0f2942'; ctx.strokeStyle = '#051321'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-76, -30 + wag);
    ctx.lineTo(-62, -2 + wag * 0.4);
    ctx.lineTo(-74, 26 + wag);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#102a43';
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-22, -48, -28, -50);
    ctx.lineTo(14, -18);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    const sg = ctx.createLinearGradient(0, -30, 0, 26);
    sg.addColorStop(0, '#0a192f');
    sg.addColorStop(0.48, '#1e3a5f');
    sg.addColorStop(0.72, '#64748b');
    sg.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(64, -2);
    ctx.quadraticCurveTo(24, -32, -46, -10);
    ctx.lineTo(-46, 10);
    ctx.quadraticCurveTo(4, 24, 22, 6);
    ctx.lineTo(54, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.translate(14, 8);
    ctx.rotate(bite);
    ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(38, 2); ctx.quadraticCurveTo(18, 16, -6, 8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath(); ctx.moveTo(6 + k * 6, 1); ctx.lineTo(9 + k * 6, -6); ctx.lineTo(12 + k * 6, 1); ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 6; k++) {
      ctx.beginPath(); ctx.moveTo(16 + k * 6.5, 2); ctx.lineTo(19 + k * 6.5, 10); ctx.lineTo(22 + k * 6.5, 2); ctx.fill();
    }

    ctx.strokeStyle = '#051321'; ctx.lineWidth = 2.2;
    for (let g = 0; g < 3; g++) {
      ctx.beginPath(); ctx.moveTo(2 - g * 6, -8); ctx.quadraticCurveTo(4 - g * 6, 0, 1 - g * 6, 8); ctx.stroke();
    }
    ctx.fillStyle = '#102a43';
    ctx.beginPath(); ctx.moveTo(4, 10); ctx.lineTo(-16, 32); ctx.lineTo(18, 14); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ff1744';
    ctx.beginPath(); ctx.ellipse(38, -8, 5.2, 3.8, -0.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(39.5, -8.5, 1.5, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  for (const t of (L.traps || [])) {
    if (t.k === 'fake') for (const f of t.plates) drawPlate(f);
    else if (t.k === 'ceil') drawCeil(t);
    else if (t.k === 'ferry') drawFerry(t);
    else if (t.k === 'arena' && t.st === 1) {
      const tt = G.lt - t.t0;
      ctx.save(); ctx.fillStyle = 'rgba(255,60,60,' + (0.15 + 0.1 * Math.sin(G.lt * 8)) + ')';
      ctx.fillRect(t.x0, t.ceilY, t.x1 - t.x0, t.gy - t.ceilY); ctx.restore();
      for (let j = 0; j < t.saws.length; j++) { const p = sawPos(t, j, tt); drawSaw(p.x, p.y, t.saws[j].r, G.lt); }
      ctx.save(); ctx.font = '800 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.lineWidth = 3;
      const left = Math.max(0, Math.ceil(t.dur - tt));
      ctx.strokeText('⏱ ' + left + 's', (t.x0 + t.x1) / 2, t.ceilY + 28); ctx.fillText('⏱ ' + left + 's', (t.x0 + t.x1) / 2, t.ceilY + 28);
      ctx.restore();
    } else if (t.k === 'sled' && t.st !== 2) {
      ctx.save();
      const gr = ctx.createLinearGradient(t.x, t.y, t.x, t.y + 32);
      gr.addColorStop(0, '#f0fbff'); gr.addColorStop(0.4, '#7fd8ff'); gr.addColorStop(1, '#1b6ca8');
      ctx.fillStyle = gr; ctx.strokeStyle = '#0a3d62'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x - 10, t.y); ctx.lineTo(t.x + t.w + 10, t.y);
      ctx.lineTo(t.x + t.w - 12, t.y + 30); ctx.lineTo(t.x + 12, t.y + 30);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(G.mode !== 'solo' ? '🧊 TẢNG BĂNG DUY NHẤT (Đợi đủ đội!)' : '🧊 VÁN TRƯỢT BĂNG', t.x + t.w / 2, t.y - 10);
      ctx.restore();
    } else if (t.k === 'redeye') {
      const cx = G.cam.x + (G.cam.vw || 800) / 2, cy = G.cam.y + 92;
      if (G.me && G.me.x + PW / 2 >= t.x0 && G.me.x + PW / 2 <= t.x1) {
        ctx.save();
        const col = t.state === 2 ? '#ff1744' : t.state === 1 ? '#ffd43b' : '#69db7c';
        ctx.fillStyle = 'rgba(15,5,25,.9)'; ctx.strokeStyle = col; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(cx, cy, 48, 27, 0, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(cx, cy, t.state === 0 ? 4 : 14, 0, 6.3); ctx.fill();
        if (t.state === 2) {
          ctx.fillStyle = 'rgba(255,20,60,.15)';
          ctx.fillRect(G.cam.x, G.cam.y, G.cam.vw || 800, G.cam.vh || 720);
        }
        ctx.restore();
      }
    } else if (t.k === 'syncgate' && !t.open) {
      const g = L.gates[t.gi];
      if (g) {
        ctx.save(); ctx.font = '800 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe066'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText('⚡ CẢ ĐỘI NHẢY CÙNG LÚC!', g.x, g.y - 14);
        ctx.fillText('⚡ CẢ ĐỘI NHẢY CÙNG LÚC!', g.x, g.y - 14);
        ctx.restore();
      }
    } else if (t.k === 'skygate') {
      ctx.save();
      ctx.fillStyle = t.open ? '#69db7c' : '#ff4d6d';
      ctx.strokeStyle = '#2b1442'; ctx.lineWidth = 3;
      rr(t.bx, t.by, 54, 24, 6); ctx.fill(); ctx.stroke();
      if (!t.open) {
        ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe066';
        ctx.fillText('🗼 XẾP THÁP ĐỤNG NÚT!', t.bx + 27, t.by - 8);
      }
      ctx.restore();
    } else if (t.k === 'swap_pad' && !t.used) {
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.strokeStyle = '#ff2bd6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(T * 8) * 3, 0, 6.3); ctx.stroke();
      ctx.fillStyle = '#00f5d4'; ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🔀 SWAP', 0, -24);
      ctx.restore();
    }
  }

  v16DrawAnomalies(L);
}

// ============================================================================
// 7. STEPPLAYER, UPDATEWORLD, DIE, RESPAWN, ONNETEV & MOBILE CONTROLS
// ============================================================================
function stepPlayer() {
  const P = G.me, L = G.L;
  P.px = P.x; P.py = P.y;
  springEars(P, P.vx, P.vy, P.face);
  if (P.dead) { P.deadT -= STEP; if (P.deadT <= 0) respawn(); return; }
  if (P.inv > 0) P.inv -= STEP;
  P.tetherGrace = 0;

  if (curPassive === 'antidote') P.rev = 0;
  if (curPassive === 'dragonflight') { P.dj = true; P.djT = 999; }
  if (curPassive === 'dragonflight' && P.onGround) P.extraHops = 2;

  if (P.dj && !Role.admin && curPassive !== 'dragonflight') {
    const before = Math.ceil(P.djT); P.djT -= STEP;
    if (P.djT <= 0) { P.dj = false; P.djT = 0; refreshBuffUI(); }
    else if (Math.ceil(P.djT) !== before) refreshBuffUI();
  }
  if (P.timed && !Role.admin) {
    for (const id in P.timed) {
      if (P.timed[id] <= 0) continue;
      const before = Math.ceil(P.timed[id]); P.timed[id] -= STEP;
      if (P.timed[id] <= 0) { P.timed[id] = 0; refreshBuffUI(); }
      else if (Math.ceil(P.timed[id]) !== before) refreshBuffUI();
    }
  }

  let gDir = 1;
  for (const gz of (L.gravZones || [])) {
    if (P.x + PW / 2 >= gz.x0 && P.x + PW / 2 <= gz.x1) { gDir = -1; break; }
  }
  P.gDir = gDir;

  const isWater = L.biome === 'water';
  const isSpace = L.biome === 'space';

  if (G.won) { P.vx *= 0.8; }
  let ax = G.won ? 0 : (input.r ? 1 : 0) - (input.l ? 1 : 0);
  if (P.rev > 0) { P.rev -= STEP; ax = -ax; }

  const jumpPressedNow = input.j && !P.jPrev && !G.won;
  if (jumpPressedNow) {
    P.jbuf = 7;
    if (curPassive === 'dragonflight' && !P.onGround && P.usedDJ && P.extraHops > 0) {
      P.usedDJ = false; P.extraHops--;
    }
  }
  P.jPrev = input.j;
  if (input.b && !P.bPrev) useBuff();
  P.bPrev = input.b;
  if (P.rope) { stepRope(P, ax); if (P.jbuf > 0) P.jbuf--; P.anch = false; const h = hazardCheck(P); if (h) die(h); return; }

  const speedBonus = (curPassive === 'dragonflight' ? 1.2 : curPassive === 'antidote' ? 1.15 : 1);
  if (P.wlock > 0) { P.wlock--; } else if (ax !== 0) {
    const acc = P.onGround ? (P.onIce ? 0.14 : slopeAcc(P)) : (isWater ? 0.48 : isSpace ? 0.55 : 0.65);
    const tgt = ax * runMax(P) * speedBonus * (isWater ? 0.92 : 1);
    P.vx += clamp(tgt - P.vx, -acc, acc);
    P.face = ax;
  } else P.vx *= P.onGround ? (P.onIce ? 0.99 : slopeDamp(P)) : (isWater ? 0.93 : 0.95);
  slopePull(P);
  if (Math.abs(P.vx) < 0.04) P.vx = 0;
  applyTether(P);

  { const rm = runMax(P) * speedBonus; P.vx = clamp(P.vx, -rm - 4, rm + 4); }

  const gravStep = isWater ? GRAV * 0.32 : isSpace ? GRAV * 0.44 : GRAV;
  const maxFallSpd = isWater ? 6.2 : isSpace ? 8.5 : (curPassive === 'featherfall' ? MAXFALL * 0.7 : MAXFALL);
  if (gDir > 0) P.vy = Math.min(P.vy + gravStep, maxFallSpd);
  else P.vy = Math.max(P.vy - gravStep, -maxFallSpd);

  if (L.wj && !P.onGround) {
    const wl = nearSolids(P.x - 3, P.y + 6, 3, PH - 12).length > 0;
    const wr = wl ? false : nearSolids(P.x + PW, P.y + 6, 3, PH - 12).length > 0;
    if (wl || wr) {
      P.wallDir = wl ? -1 : 1; P.wallT = 7;
      if (gDir > 0 && P.vy > 2.4) P.vy = 2.4;
    } else if (P.wallT > 0) P.wallT--;
  } else if (P.onGround) P.wallT = 0;

  if (P.onGround) { P.coyote = 6; P.usedDJ = false; } else if (P.coyote > 0) P.coyote--;
  if (P.jbuf === 7 && G.mode === 'coop' && (P.onGround || input.d)) {
    const hf = hangingFriend(P);
    if (hf) { P.jbuf = 0; doHoist(P, hf); }
  }

  if (isWater && (jumpPressedNow || (input.j && P.vy > 1.2))) {
    P.vy = -7.4 * jumpMul(P); P.onGround = false; P.jbuf = 0; P.sq = -0.2;
    if (jumpPressedNow) Snd.jump(P.slot);
    puff(P.x + PW / 2, P.y + PH, 3, '#c8f7ff', 0.7);
  } else if (isSpace && (jumpPressedNow || (input.j && P.vy * gDir > -3.2))) {
    P.vy = -7.8 * gDir * jumpMul(P);
    P.onGround = false;
    if (jumpPressedNow) { Snd.djump(); P.jbuf = 0; }
    if (Math.random() < 0.6) sparkle(P.x + PW / 2, P.y + (gDir > 0 ? PH : 0), 2, 0.5, '#ff922b');
  } else if (P.jbuf > 0) {
    if (P.coyote > 0) {
      const isFromHead = !!P.ride;
      P.vy = -gDir * (isFromHead ? JUMP * 1.18 : JUMP) * jumpMul(P);
      P.coyote = 0; P.jbuf = 0; P.jumping = true; P.onGround = false; P.sq = -0.25;
      Snd.jump(P.slot); puff(P.x + PW / 2, P.y + (gDir > 0 ? PH : 0), isFromHead ? 6 : 4, isFromHead ? '#ffe066' : '#fff');
    } else if (L.wj && P.wallT > 0 && !P.onGround) {
      P.vy = -gDir * JUMP * 0.96 * jumpMul(P); P.vx = -P.wallDir * 6.4; P.wallT = 0; P.wlock = 9; P.face = -P.wallDir; P.jbuf = 0; P.jumping = true; P.usedDJ = false;
      Snd.jump(P.slot);
    } else if (P.dj && !P.usedDJ && !P.onGround) {
      P.vy = -gDir * JUMP * 0.92 * jumpMul(P); P.usedDJ = true; P.jbuf = 0; P.jumping = true; Snd.djump(); sparkle(P.x + PW / 2, P.y + PH, 8, 1, '#9ef');
    } else P.jbuf--;
  }
  if (!isSpace && !input.j && P.jumping && gDir > 0 && P.vy < -4.2) { P.vy = -4.2; P.jumping = false; }
  if (gDir > 0 && P.vy >= 0) P.jumping = false;

  const feetStart = P.y + PH;
  const pre = nearSolids(P.x, P.y, PW, PH).slice();
  P.x += P.vx;
  if (P.x < 0) { P.x = 0; P.vx = 0; }
  if (P.x > L.w - PW) { P.x = L.w - PW; P.vx = 0; }
  let hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (s.bonk && !s.bonk.rev) continue;
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
    if (s.bonk && !s.bonk.rev) {
      if (P.vy < 0) { onBonk(P, s, 'head'); P.y = s[1] + s[3]; P.vy = 0; }
      continue;
    }
    if (gDir > 0) {
      if (P.vy > 0) { P.y = s[1] - PH; P.onGround = true; P.onIce = !!s.ice; }
      else if (P.vy < 0) { P.y = s[1] + s[3]; }
      else if (feet0 <= s[1] + s[3] + 8) { P.y = s[1] - PH; P.onGround = true; }
      else { P.y = s[1] + s[3]; }
    } else {
      if (P.vy < 0) { P.y = s[1] + s[3]; P.onGround = true; P.onIce = !!s.ice; }
      else if (P.vy > 0) { P.y = s[1] - PH; }
    }
    P.vy = 0;
  }

  v11Ground(P, feet0);
  if (P.fer !== null) {
    const fc = ferryCarry(P);
    P.x += fc;
    if (nearSolids(P.x, P.y, PW, PH).length) P.x -= fc;
  }

  if ((G.mode === 'coop' || G.mode === 'party') && !P.onGround && P.vy >= -2.5) {
    for (const r of G.remotes.values()) {
      if (r.dead || r.ropeOn) continue;
      const feet = P.y + PH;
      if (P.x + PW - 2 > r.x && P.x + 2 < r.x + PW && feet >= r.y - 10 && feet0 <= r.y + 20) {
        P.y = r.y - PH;
        P.onGround = true;
        P.ride = r;
        const carryX = r.dx || (r.tvx * 0.96) || 0;
        P.x += carryX;
        if (nearSolids(P.x, P.y, PW, PH).length) P.x -= carryX;
        if ((r.tvy || 0) < -2.2 || (r.dy || 0) < -2.0) {
          P.vy = Math.min(P.vy, (r.tvy || -JUMP) * 1.06);
          P.onGround = false;
        } else {
          P.vy = 0;
        }
        break;
      }
    }
  }

  if (G.mode === 'coop') v15EnforceRopeAfterMove(P);

  for (const s of L.springs) {
    const feet = P.y + PH;
    if (P.vy >= 0 && P.x + PW - 3 > s.x && P.x + 3 < s.x + s.w && feet >= s.y - 4 && feet <= s.y + s.h + 3) {
      P.vy = -s.power * gDir; P.onGround = false; P.coyote = 0; P.jumping = false; s.sq = 1;
      Snd.spring(); puff(s.x + s.w / 2, s.y, 6, '#ffd54f'); P.sq = -0.35;
    }
  }

  if (P.onGround && !P.wasGround) { P.sq = 0.3; Snd.land(); puff(P.x + PW / 2, P.y + PH, 6, '#efe7df', 1.2); }
  P.sq *= 0.82;

  if (P.onGround) {
    if (input.d) P.anch = true;
    for (const p of L.plates) if (standsOn(P, p)) P.anch = true;
    for (const R of L.ropes) for (const p of R.pads) if (standsOn(P, p)) P.anch = true;
  }
  tryGrabRope(P);
  const h = hazardCheck(P);
  if (h) die(h);
}

function updateWorld() {
  const L = G.L, me = G.me;
  G.lt += STEP;
  if (!G.won) G.levelTime += STEP;
  const bodies = allBodies();
  const camMidX = G.cam.x + (G.cam.vw || 800) / 2;
  const hearRange = (G.cam.vw || 800) * 0.75;

  for (const p of L.plates) {
    let pr = false;
    for (const b of bodies) if (standsOn(b, p)) { pr = true; break; }
    if (pr) p.t = Math.max(p.hold, 0.25); else if (p.t > 0) p.t -= STEP;
    const act = pr || p.t > 0;
    if (act !== p.on && Math.abs(p.x - camMidX) < hearRange) Snd.plate(act);
    p.on = act; p.pr = pr;
  }

  for (const g of L.gates) {
    let act;
    if (g.tr !== undefined) {
      const trObj = L.traps[g.tr];
      if (!trObj) act = true;
      else if (trObj.k === 'syncgate' || trObj.k === 'skygate') act = !!trObj.open;
      else act = trapGateOpen(g);
    }
    else if (g.mode === 'all') act = g.ctrl.every((id) => L.plates.find((p) => p.id === id).on);
    else if (g.mode === 'count') act = g.ctrl.filter((id) => L.plates.find((p) => p.id === id).on).length >= Math.min(g.need || g.ctrl.length, g.ctrl.length);
    else act = g.ctrl.some((id) => L.plates.find((p) => p.id === id).on);
    if (act !== g.act && Math.abs(g.x - camMidX) < hearRange) Snd.gate(act);
    g.act = act;
  }

  for (const c of L.crumbles) {
    if (c.st === 0) {
      if (!c.lock) for (const b of bodies) {
        const feet = b.y + PH;
        if (b.x + PW - 3 > c.x && b.x + 3 < c.x + c.w && feet >= c.y - 2 && feet <= c.y + 8) { c.st = 1; c.t = c.fast ? 0.09 : 0.22; break; }
      }
    } else if (c.st === 1) {
      c.t -= STEP;
      if (c.t <= 0) { c.st = 2; c.t = 2.5; c.fy = 0; c.vy = 0; if (Math.abs(c.x - camMidX) < hearRange) Snd.crumble(); debris(c.x, c.y, c.w, c.h, 8, '#8d6e63'); }
    } else {
      c.t -= STEP; c.vy = (c.vy || 0) + 0.65; c.fy += c.vy;
      if (c.t <= 0) { c.st = 0; c.fy = 0; }
    }
  }

  for (const c of L.crushers) {
    const prev = c.cb; c.cb = crusherBottom(c, G.lt);
    if (prev !== undefined && prev < c.downB - 2 && c.cb >= c.downB - 2 && c.cb - prev < 40) {
      if (Math.abs(c.x + c.w / 2 - camMidX) < hearRange) {
        Snd.slam(); G.shake = Math.max(G.shake, 4.5); puff(c.x + c.w / 2, c.downB, 8, '#cfd8dc', 1.4);
      }
    }
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
  updateRunKey(bodies);
  updateRocks();
  updateBonks();

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
    for (let fi = 0; fi < L.flags.length; fi++) {
      const f = L.flags[fi];
      if (!f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90) {
        f.on = true; me.cp = { x: f.x - PW / 2, y: f.y - PH }; Snd.cp(); sparkle(f.x, f.y - 50, 14, 1, '#7cf');
        toast('⚑ Checkpoint! Toàn đội đã được đồng bộ!');
        v16SpawnDoppelganger(L, me, f.x, f.y, fi);
        if (G.mode !== 'solo') { netEv({ t: 'cp', x: Math.round(me.cp.x), y: Math.round(me.cp.y), fi, s: me.slot, pull: 1 }); }
      } else if (f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90 && f.x - PW / 2 >= me.cp.x) {
        me.cp = { x: f.x - PW / 2, y: f.y - PH };
      }
    }
    const cx = me.x + PW / 2, cy = me.y + PH / 2;
    const mg = (curPassive === 'magnet' || curPassive === 'dragonflight' || timedOn(me, 'magnet')) ? 2.4 : 1;
    for (const c of L.coins) {
      if (c.pop > 0) c.pop -= STEP;
      if (c.got || c.anomaly) continue;
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

function die(cause) {
  const P = G.me;
  if (P.dead || P.inv > 0 || G.won) return;
  if (G.boutique) { if (cause === 'fall' || cause === 'wall') tpToCheckpoint(P); return; }
  if (Role.admin && Role.god) {
    if (cause === 'fall' || cause === 'wall') { P.x = P.cp.x; P.y = P.cp.y; P.vx = P.vy = 0; G.cam.snap = true; }
    return;
  }
  if (curPassive === 'wraith' && cause !== 'fall' && (!P.wraithCd || G.lt >= P.wraithCd)) {
    P.wraithCd = G.lt + 12;
    P.inv = 1.6; P.vy = -7.5;
    Snd.djump(); sparkle(P.x + PW / 2, P.y + PH / 2, 20, 1.6, '#ff0055');
    toast('💀 Hồn Ma Hư Không: Đã đi xuyên qua sát thương chí mạng!');
    return;
  }
  if (P.shield) {
    P.shield = false; P.inv = 1.4; P.rope = null; Snd.pop(); sparkle(P.x + PW / 2, P.y + PH / 2, 16, 1.5, '#8ff');
    if (cause === 'fall') { tpToCheckpoint(P); }
    else if (cause === 'wall') { tpToCheckpoint(P); rewindHunters(P); }
    else { P.vy = -8; }
    refreshBuffUI(); return;
  }
  P.dead = true; P.deadT = 0.52; P.rope = null; P.lastCause = cause;
  if (P.dj && curPassive !== 'dragonflight') { P.dj = false; P.djT = 0; }
  if (P.timed) { for (const id in P.timed) P.timed[id] = 0; }
  refreshBuffUI();
  G.deaths++; setText('deaths', '💥 ' + G.deaths);
  Snd.die(); G.shake = Math.max(G.shake, 8);
  sparkle(P.x + PW / 2, P.y + PH / 2, 22, 1.8, COLORS[P.slot % COLORS.length]);
  puff(P.x + PW / 2, P.y + PH, 8, '#fff', 1.2);
  netEv({ t: 'die', x: Math.round(P.x), y: Math.round(P.y), wipe: 1 });
  if (isNet()) {
    resetTraps(G.L);
    initV11Level(G.L);
    v15RandomizeTrapsOnDeath(G.L);
    toast('💀 Bạn tử nạn — Cả đội quay về Checkpoint!');
  }
}

function respawn() {
  const P = G.me, L = G.L;
  const rx = P.cp.x, ry = P.cp.y;
  rewindHunters(P);
  resetTraps(L);
  initV11Level(L);
  v15RandomizeTrapsOnDeath(L);
  P.x = rx + (P.slot % 4) * 14; P.y = ry; P.vx = P.vy = 0; P.dead = false; P.rev = 0;
  P.inv = curPassive === 'rebirth' ? 3.5 : 1.5;
  if (curPassive === 'guard' && !P.shield) { P.shield = true; refreshBuffUI(); }
  P.tetherGrace = 0;
  P.rope = null; P.ropeCd = 20; P.usedDJ = false;
  puff(P.x + PW / 2, P.y + PH, 12, '#fff');
  G.cam.snap = G.cam.snap || (Math.abs(G.cam.x - P.x) > 1000);
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
        const M = G.me, L = G.L;
        if (M) {
          M.cp = { x: e.x, y: e.y };
          if (L && L.flags && e.fi >= 0 && L.flags[e.fi]) L.flags[e.fi].on = true;
          const dist = Math.hypot(M.x - e.x, M.y - e.y);
          if (e.pull || M.dead || dist > 180) {
            M.dead = false; M.x = e.x + (M.slot % 4) * 14; M.y = e.y; M.vx = 0; M.vy = 0; M.rope = null;
            G.cam.snap = true;
            sparkle(M.x + PW / 2, M.y + PH / 2, 18, 1.5, '#7cf');
          }
          toast('⚑ ' + (G.names[e.s] || 'Đồng đội') + ' chạm Checkpoint — Toàn đội dịch chuyển lên!');
        }
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
        if (M.rope) M.rope.len = Math.max(150, M.rope.len - 10);
        else { M.vy = -11.0; const r = G.remotes.get(e.s); if (r) M.vx += Math.sign(r.x - M.x) * 4.0; }
        sparkle(M.x + PW / 2, M.y + PH / 2, 6, 0.9, '#fff3a0');
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
        Snd.die();
        if (e.wipe && G.me && !G.won) {
          const culprit = G.names[e.s] || 'Đồng đội';
          toast('💀 ' + culprit + ' tử nạn — Cả đội quay về Checkpoint!');
          G.shake = Math.max(G.shake, 7);
          respawn();
        }
      }
      break;
    case 'clk':
      if (e.lv === G.lvIdx && e.s === G.hostSlot && e.s !== G.myslot) {
        const target = e.v + G.pingMs / 2000, diff = target - G.lt;
        if (Math.abs(diff) > 1.2) G.lt = target;
        else if (Math.abs(diff) > 0.08) G.lt += clamp(diff * 0.15, -0.02, 0.02);
      }
      break;
    default: break;
  }
}

function ensureRadarBtn() {
  const host = document.querySelector('#touch .touch-actions') || $('touch');
  if (!host) return;
  if (!$('anchorBtn')) {
    const a = document.createElement('button');
    a.id = 'anchorBtn'; a.className = 'tbtn radar-btn hidden'; a.dataset.k = 'd'; a.textContent = '⚓';
    a.title = 'Giữ để Cắm Neo giữ đồng đội (PC: giữ phím S / Mũi tên xuống)';
    host.appendChild(a);
  }
  if ($('anchorBtn')) $('anchorBtn').classList.toggle('hidden', G.mode !== 'coop');
  if ($('radarBtn')) return;
  const b = document.createElement('button');
  b.id = 'radarBtn'; b.className = 'tbtn radar-btn hidden'; b.dataset.k = 'tv'; b.textContent = '📡';
  b.title = 'Giữ để xem toàn đội (PC: giữ Tab)';
  host.appendChild(b);
}

function updateTouch(touches) {
  const act = { l: false, r: false, j: false, b: false, d: false, tv: false };
  const cur = new Set();
  for (const t of touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const b = el && el.closest ? el.closest('.tbtn') : null;
    if (b) { if (b.dataset.buff) cur.add(b.dataset.buff); else act[b.dataset.k] = true; }
  }
  document.querySelectorAll('.tbtn').forEach((b) => b.classList.toggle('down', b.dataset.buff ? cur.has(b.dataset.buff) : !!act[b.dataset.k]));
  cur.forEach((id) => { if (!touchBuffDown.has(id)) useBuff(id); });
  touchBuffDown = cur;
  tc.l = act.l; tc.r = act.r; tc.j = act.j; tc.b = act.b; tc.d = act.d;
  G.teamView = !!act.tv && (G.mode === 'party' || G.mode === 'coop');
  recompute();
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const rawW = window.innerWidth, rawH = window.innerHeight;
  const portrait = isTouchDevice && rawH > rawW;
  document.body.classList.toggle('force-landscape', portrait);
  cw = portrait ? rawH : rawW;
  ch = portrait ? rawW : rawH;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
}

// ============================================================================
// 8. KHO TÀNG 24 MÔ-ĐUN BẪY TỔ HỢP (> 1.120 BIẾN THỂ) + QUỶ DỊ CHO 300 MÀN CHƠI
// ============================================================================
(() => {
  SKY_THEMES.length = 0;
  SKY_THEMES.push('meadow', 'sunset', 'aurora', 'galaxy', 'ember', 'frost', 'cosmic', 'sakura', 'ocean', 'storm', 'neon', 'toxic');

  LB.prototype.gap = function (len) {
    this.spikes.push({ x: this.x, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    this.x += len;
  };

  seg.bonkGap = function (b, gapW, o) {
    o = o || {}; gapW = gapW || 150;
    const x0 = (o.lead === 0) ? b.x : seg.run(b, o.lead || 320, {});
    const gx = b.x, gy = b.gy;
    b.gap(gapW);
    b.bonks.push({ x: gx + gapW / 2 - 22 + (o.dx || 0), y: gy - 166, w: 46, h: 40, rev: false, sh: 0 });
    seg.run(b, o.land || 320, { flag: o.flag !== false });
    return x0;
  };

  seg.passCollapse = function (b, len) {
    const span = len || 350, x0 = b.ground(220), gy = b.gy, bx = b.x;
    b.spikes.push({ x: bx, y: WORLD_H - 26, w: span, h: 26, dir: 'up', pit: true });
    const nTiles = Math.max(3, Math.floor(span / 85)), tw = Math.floor(span / nTiles), idxs = [];
    for (let i = 0; i < nTiles; i++) {
      b.crumbles.push({ x: bx + i * tw, y: gy, w: tw, h: 24, st: 0, t: 0, fy: 0, lock: true, stealth: true });
      idxs.push(b.crumbles.length - 1);
    }
    b.traps.push({ k: 'pass_drop', x0: bx, x1: bx + span, gy, cr: idxs, st: 0, t: 0 });
    b.x = bx + span; b.ground(260); b.coin(bx + span * 0.5, gy - 58);
    return x0;
  };

  seg.delayedAmbush = function (b, len) {
    len = Math.max(620, len || 680);
    const x0 = b.ground(len), gy = b.gy, idx = b.traps.length;
    for (let gx = x0 + 150; gx + 68 <= x0 + len - 120; gx += 116) {
      b.spikes.push({ x: gx, y: gy - 24, w: 68, h: 24, dir: 'up', hid: true, bt: idx, ph: 0, live: false });
    }
    b.stalactites.push({ x: x0 + len - 220, y: gy - 310, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0, sniper: true });
    b.traps.push({ k: 'ambush', zx0: x0 + 120, zx1: x0 + len - 90, gy, st: 0, t: 0 });
    b.coin(x0 + len * 0.5, gy - 64);
    return x0;
  };

  seg.movingGap = function (b, gapW) {
    gapW = gapW || 135;
    const x0 = b.ground(260), gy = b.gy, gx = b.x;
    const pw = 220, shiftAmt = 68, rightGap = 135;
    b.spikes.push({ x: gx + 6, y: WORLD_H - 26, w: gapW + pw + rightGap - 12, h: 26, dir: 'up', pit: true });
    const platIdx = b.solids.length, tIdx = b.traps.length;
    const platSolid = [gx + gapW, gy, pw, 44];
    b.solids.push(platSolid);
    const topSpk = { x: gx + gapW + 115, y: gy - 24, w: 72, h: 24, dir: 'up', hid: true, bt: tIdx, ph: 0, live: false };
    b.spikes.push(topSpk);
    b.traps.push({ k: 'double_bluff', gx, gy, si: platIdx, baseX: gx + gapW, shift: shiftAmt, cur: 0, st: 0, t: 0, topSpk });
    b.x = gx + gapW + pw + rightGap;
    b.ground(280);
    return x0;
  };

  seg.trollSpringTrap = function (b) {
    const x0 = b.ground(340), gy = b.gy, spx = x0 + 185, sIdx = b.springs.length;
    b.springs.push({ x: spx, y: gy - 14, w: 56, h: 14, power: 17.5, sq: 0, trollIdx: b.traps.length });
    b.spikes.push({ x: spx - 30, y: gy - 285, w: 120, h: 26, dir: 'down' });
    b.spikes.push({ x: x0 + 30, y: gy - 22, w: 70, h: 22, dir: 'up', hid: true, bt: b.traps.length, ph: 0, live: false });
    b.traps.push({ k: 'troll_spring', sIdx, st: 0, t: 0 });
    b.step(145); b.ground(320);
    return x0;
  };

  seg.fakePlates = function (b, n, o) {
    o = o || {};
    n = Math.max(4, Math.min(n || 5, 6));
    const pitch = 145, lead = 110, tail = 220, hold = 4.2;
    const x0 = b.ground(lead + n * pitch + tail + 180);
    const idx = b.traps.length;
    const realIdx = 1 + ((n + idx) % (n - 1));
    const rid = 'p' + (b.pid++);
    const fakes = [], allPos = [];
    let realPlate = null;
    for (let i = 0; i < n; i++) {
      const px = x0 + lead + i * pitch, py = b.gy - 10;
      allPos.push(px);
      if (i === realIdx) {
        realPlate = { id: rid, x: px, y: py, w: 60, h: 10, hold, t: 0, on: false };
        b.plates.push(realPlate);
      } else {
        fakes.push({ x: px, y: py, w: 60, h: 10, hold: 0, t: 0, on: false, pr: false, used: false, v: ((i + idx) % 2 === 0) ? 'stalac' : 'rev' });
      }
    }
    const gx = x0 + lead + n * pitch + tail;
    b.gates.push({ x: gx, y: b.gy - 340, w: 28, h: 340, ctrl: [rid], mode: 'any', open: false, inv: false });
    b.traps.push({ k: 'fake', plates: fakes, allPos, realPlate });
    if (o.flag) b.flag(x0 + 40);
    return x0;
  };

  seg.glacierSled = function (b, len, mode) {
    baseDrop(b);
    len = len || 1600;
    const x0 = b.ground(280), gy = b.gy;
    b.solids[b.solids.length - 1].ice = true;
    b.flag(x0 + 50);
    const cs = b.x, ce = cs + len;
    b.spikes.push({ x: cs, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    for (let sx = cs + 380; sx < ce - 280; sx += 390) {
      b.spikes.push({ x: sx, y: gy - 26, w: 48, h: 26, dir: 'down' });
      b.stalactites.push({ x: sx + 140, y: gy - 310, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0, sniper: true });
    }
    const sledW = mode === 'solo' ? 120 : 180;
    const si = b.solids.length;
    const sledSolid = [cs + 12, gy - 4, sledW, 24];
    sledSolid.ice = true;
    b.solids.push(sledSolid);
    b.traps.push({ k: 'sled', si, x0: cs + 12, x1: ce - sledW - 14, x: cs + 12, y: gy - 4, w: sledW, maxV: 5.8, vx: 0, dx: 0, st: 0, wait: 0 });
    b.x = ce;
    const landX = b.ground(320);
    b.solids[b.solids.length - 1].ice = true;
    b.coin(cs + len * 0.5, gy - 85);
    return landX;
  };

  seg.judgmentCorridor = function (b, len, mode) {
    len = len || 880;
    const x0 = b.ground(len), gy = b.gy;
    b.spikeUp(x0 + 220, 56);
    b.spikeUp(x0 + 480, 56);
    b.traps.push({ k: 'redeye', x0: x0 + 60, x1: x0 + len - 80, off: (x0 * 0.01) % 3, state: 0 });
    if (mode !== 'solo') {
      const gi = b.gates.length;
      const isSky = (x0 % 2 === 0);
      b.gates.push({ x: x0 + len - 90, y: gy - 340, w: 28, h: 340, ctrl: [], mode: 'any', open: false, inv: false, tr: b.traps.length });
      if (isSky) b.traps.push({ k: 'skygate', gi, bx: x0 + len - 240, by: gy - 195, open: false });
      else b.traps.push({ k: 'syncgate', gi, x: x0 + len - 210, open: false });
    }
    b.coin(x0 + len * 0.5, gy - 75);
    return x0;
  };

  seg.antiGravChamber = function (b, len) {
    len = len || 760;
    const x0 = b.x, gy = b.gy, ceilY = gy - 290;
    b.spikes.push({ x: x0, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    b.solids.push([x0, ceilY - 36, len, 36]);
    b.spikes.push({ x: x0 + 210, y: ceilY, w: 64, h: 22, dir: 'down' });
    b.spikes.push({ x: x0 + 470, y: ceilY, w: 64, h: 22, dir: 'down' });
    b.gravZones = b.gravZones || [];
    b.gravZones.push({ x0: x0 + 20, x1: x0 + len - 40, y0: ceilY, y1: gy });
    b.x = x0 + len;
    b.ground(300);
    b.coin(x0 + len * 0.5, ceilY + 55);
    return x0;
  };

  seg.laserCorridor = function (b, len, d) {
    len = len || 820;
    const x0 = b.ground(len), gy = b.gy;
    b.lasers = b.lasers || [];
    b.mimics = b.mimics || [];
    const nLasers = 2 + (d > 0.5 ? 1 : 0);
    for (let i = 0; i < nLasers; i++) {
      const lx = x0 + 220 + i * Math.floor((len - 340) / Math.max(1, nLasers - 1));
      b.solids.push([lx - 28, gy - 115, 56, 18]);
      b.lasers.push({ x: lx, y: gy - 106, len: 102, spd: (i % 2 ? -1 : 1) * (1.85 + d * 0.9), off: i * 1.1, blades: d > 0.65 ? 3 : 2 });
    }
    const mx = x0 + len * 0.52, my = gy - 68;
    b.mimics.push({ x: mx, y: my, x0: mx, y0: my, trig: false });
    return x0;
  };

  seg.blackHoleVortex = function (b, len, d) {
    baseDrop(b);
    len = len || 660;
    const x0 = b.ground(220), gy = b.gy, gx = b.x;
    b.spikes.push({ x: gx, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    for (let i = 0; i < 3; i++) {
      b.solids.push([gx + 85 + i * 195, gy - (i % 2 ? 75 : 20), 95, 18]);
    }
    b.blackHoles = b.blackHoles || [];
    b.blackHoles.push({ x: gx + len * 0.5, y: gy - 175, pullR: 250, killR: 28 + Math.round(d * 8) });
    b.x = gx + len;
    b.ground(240);
    return x0;
  };

  seg.phantomBridge = function (b, n, d) {
    baseDrop(b);
    n = n || 5;
    const w = 96, g = 88, x0 = b.ground(200), gy = b.gy, gx = b.x;
    const span = g + n * (w + g);
    b.spikes.push({ x: gx, y: WORLD_H - 26, w: span, h: 26, dir: 'up', pit: true });
    b.phantoms = b.phantoms || [];
    for (let i = 0; i < n; i++) {
      const px = gx + g + i * (w + g), py = gy - (i % 2) * 35;
      const si = b.solids.length;
      b.solids.push([px, py, w, 18]);
      b.phantoms.push({ si, x: px, y: py, w, spd: 3.2 + d * 1.2, phase: i * 0.9, solid: true, alpha: 1 });
    }
    b.x = gx + span;
    b.ground(240);
    return x0;
  };

  seg.conveyorPendulum = function (b, len, d) {
    len = len || 840;
    const x0 = b.ground(len), gy = b.gy;
    b.conveyors = b.conveyors || [];
    b.pendulums = b.pendulums || [];
    b.conveyors.push({ x: x0 + 90, y: gy, w: len - 180, spd: (x0 % 2 === 0 ? -1 : 1) * (2.2 + d * 1.1) });
    for (let i = 0; i < 3; i++) {
      const px = x0 + 210 + i * 210;
      b.pendulums.push({ x: px, y: gy - 260, len: 215, r: 28, spd: 2.8 + d * 0.9, off: i * 1.3 });
    }
    b.coin(x0 + len * 0.5, gy - 95);
    return x0;
  };

  seg.sniperBastion = function (b, len, d, mode) {
    len = len || 820;
    const x0 = b.ground(len), gy = b.gy;
    b.turrets = b.turrets || [];
    b.turrets.push({ x: x0 + len * 0.55, y: gy - 245, period: Math.max(1.35, 2.2 - d * 0.6), charge: 0, fireT: 0, ang: 0 });
    b.solids.push([x0 + 220, gy - 85, 95, 18]);
    b.solids.push([x0 + 510, gy - 95, 95, 18]);
    b.spikeUp(x0 + 360, 72);
    if (mode !== 'solo') {
      b.traps.push({ k: 'swap_pad', x: x0 + 265, y: gy - 115, used: false });
    }
    return x0;
  };

  seg.gravityPillars = function (b, len) {
    len = len || 920;
    const x0 = b.x, gy = b.gy, ceilY = gy - 280;
    b.spikes.push({ x: x0, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    b.solids.push([x0, ceilY - 36, len, 36]);
    b.solids.push([x0 + 280, gy, 320, WORLD_H - gy + 80]);
    b.spikes.push({ x: x0 + 130, y: ceilY, w: 60, h: 22, dir: 'down' });
    b.spikes.push({ x: x0 + 410, y: gy - 22, w: 60, h: 22, dir: 'up' });
    b.spikes.push({ x: x0 + 700, y: ceilY, w: 60, h: 22, dir: 'down' });
    b.gravZones = b.gravZones || [];
    b.gravZones.push({ x0: x0 + 20, x1: x0 + 290, y0: ceilY, y1: gy });
    b.gravZones.push({ x0: x0 + 580, x1: x0 + len - 30, y0: ceilY, y1: gy });
    b.x = x0 + len;
    b.ground(280);
    return x0;
  };

  v11Inject = function (b, kb, ku) {
    const c = V11.ctx;
    if (!c || b._v11) return;
    b._v11 = 1;
    if (b.h !== WORLD_H || b.wj || b.exitOv) return;
    if (!b.key) b.key = { x: b.x - (kb || 520), y: b.gy - (ku || 56) };
    baseDrop(b);
    seg.passCollapse(b, 340);
    baseDrop(b);
    seg.run(b, 360, { flag: true, coins: [[180, -60]] });
  };

  LB.prototype.finish = function (keyBack, keyUp) {
    v11Inject(this, keyBack, keyUp);
    const cleanFlags = [];
    for (let i = 0; i < this.flags.length; i++) {
      const f = this.flags[i];
      const tooClose = cleanFlags.some((cf) => Math.hypot(cf.x - f.x, cf.y - f.y) < 750);
      if (!tooClose) cleanFlags.push({ x: f.x, y: f.y, on: false });
    }
    const off = { solo: 0, coop: 4, party: 8 }[G.mode] || 0;
    const key = G.lvIdx >= 0 ? G.lvIdx : 1;
    const lv = {
      name: this.name, hint: this.hint, hue: (this.hue + key * 37 + off * 53) % 360, coop: this.coop, traps: this.traps,
      skyTheme: SKY_THEMES[(key * 3 + off) % SKY_THEMES.length],
      w: this.x, h: this.h, wj: this.wj, stalactites: this.stalactites, meteors: this.meteors, risers: this.risers, spawn: this.spawn,
      solids: this.solids, spikes: this.spikes, crumbles: this.crumbles, springs: this.springs,
      crushers: this.crushers, boulders: this.boulders, sweepers: this.sweepers,
      plates: this.plates, gates: this.gates, ropes: this.ropes,
      slopes: this.slopes || [], bonks: this.bonks || [], rocks: this.rocks || [],
      lasers: this.lasers || [], blackHoles: this.blackHoles || [], mimics: this.mimics || [],
      conveyors: this.conveyors || [], pendulums: this.pendulums || [], turrets: this.turrets || [],
      phantoms: this.phantoms || [], gravZones: this.gravZones || [],
      coins: this.coins.map((c, i) => ({ x: c.x, y: c.y, id: i })),
      flags: cleanFlags,
      key: this.key || { x: this.x - (keyBack || 520), y: this.gy - (keyUp || 56) },
      exit: this.exitOv ? Object.assign({}, this.exitOv) : { x: this.x - 150, y: this.gy - 74, w: 54, h: 74 },
    };
    const scaleFactor = G.mode === 'party' ? hazardK(partyN()) * 1.22 : 1.25;
    (lv.boulders || []).forEach((q) => { q.speed *= scaleFactor; });
    (lv.crushers || []).forEach((q) => { q.period = Math.max(1.45, q.period / scaleFactor); });
    (lv.meteors || []).forEach((q) => { q.period = Math.max(1.6, q.period / scaleFactor); });
    (lv.sweepers || []).forEach((q) => { q.speed *= 1.15; });
    return v15SanitizeLevel(lv);
  };

  function buildDescentStage(title, hue, seed, mode) {
    const W = 980, H = 2750;
    const b = new LB(title + ' [DESCENT ↓]', 'Đi từ ĐỈNH xuống ĐÁY vực sâu! Cẩn thận đá lăn, tia laser & bẫy ngầm mỗi tầng!', hue, mode === 'coop');
    b.h = H; b.wj = true; b.x = W;
    b.solids.push([0, 0, 40, H + 200]);
    b.solids.push([W - 40, 0, 40, H + 200]);
    b.solids.push([60, 190, 260, 24]);
    b.spawn = [120, 190 - PH];
    let curY = 310, fIdx = 0;
    b.lasers = [];
    while (curY < H - 280) {
      const gapX = 110 + Math.floor(hash1(seed * 13 + fIdx * 7.1) * (W - 380));
      const gapW = 145 + (fIdx % 3) * 20;
      if (gapX > 50) b.solids.push([40, curY, gapX - 40, 22]);
      if (gapX + gapW < W - 50) b.solids.push([gapX + gapW, curY, W - 40 - (gapX + gapW), 22]);
      if (fIdx % 2 === 1) {
        const spX = gapX > W / 2 ? 120 : W - 240;
        b.spikes.push({ x: spX, y: curY - 22, w: 72, h: 22, dir: 'up' });
      }
      if (fIdx % 3 === 0) b.boulders.push({ x0: 70, x1: W - 70, y: curY, r: 24, speed: 3.6 + (fIdx % 3) * 0.5, off: fIdx * 1.1, cx: 120, rot: 0 });
      if (fIdx % 4 === 1) b.lasers.push({ x: W / 2, y: curY - 75, len: 95, spd: 2.1 * (fIdx % 2 ? 1 : -1), off: fIdx, blades: 2 });
      if (fIdx % 4 === 2) b.flags.push({ x: gapX > W / 2 ? 140 : W - 140, y: curY });
      b.coin(gapX + gapW / 2, curY - 35);
      curY += 165; fIdx++;
    }
    const botY = H - 90;
    b.solids.push([40, botY, W - 80, 160]);
    b.key = { x: 180, y: botY - 140, run: { x0: 90, x1: W - 90, gy: botY } };
    b.exitOv = { x: W - 150, y: botY - 74, w: 54, h: 74 };
    const lv = b.finish(0, 0);
    lv.skyTheme = 'storm';
    return v15SanitizeLevel(lv);
  }

  function reverseLevelHorizontally(lv) {
    const W = lv.w;
    lv.name += ' [ĐẢO CHIỀU ←]';
    lv.hint = '🔄 MÀN ĐẢO CHIỀU: Xuất phát bên PHẢI, chạy ngược về bên TRÁI để tìm Chìa khóa & Cửa thoát!';
    lv.spawn = [W - 140, GY - PH];
    for (const s of lv.solids) s[0] = W - s[0] - s[2];
    lv.spikes = (lv.spikes || []).filter((sp) => sp.bt === undefined);
    for (const sp of lv.spikes) sp.x = W - sp.x - sp.w;
    for (const c of lv.crumbles) { c.x = W - c.x - c.w; c.lock = false; }
    for (const s of lv.springs) s.x = W - s.x - s.w;
    for (const c of lv.crushers) c.x = W - c.x - c.w;
    for (const b of lv.boulders) { const n0 = W - b.x1, n1 = W - b.x0; b.x0 = n0; b.x1 = n1; b.cx = n0; }
    for (const p of lv.plates) p.x = W - p.x - p.w;
    lv.gates = (lv.gates || []).filter((g) => g.tr === undefined);
    for (const g of lv.gates) g.x = W - g.x - g.w;
    for (const f of lv.flags) f.x = W - f.x;
    for (const c of lv.coins) c.x = W - c.x;
    for (const q of (lv.stalactites || [])) q.x = W - q.x - q.w;
    for (const bk of (lv.bonks || [])) bk.x = W - bk.x - bk.w;
    for (const ls of (lv.lasers || [])) ls.x = W - ls.x;
    for (const bh of (lv.blackHoles || [])) bh.x = W - bh.x;
    for (const m of (lv.mimics || [])) { m.x = W - m.x; m.x0 = m.x; }
    for (const cv of (lv.conveyors || [])) { cv.x = W - cv.x - cv.w; cv.spd = -cv.spd; }
    for (const pd of (lv.pendulums || [])) pd.x = W - pd.x;
    for (const trt of (lv.turrets || [])) trt.x = W - trt.x;
    for (const ph of (lv.phantoms || [])) ph.x = W - ph.x - ph.w;
    for (const gz of (lv.gravZones || [])) { const n0 = W - gz.x1, n1 = W - gz.x0; gz.x0 = n0; gz.x1 = n1; }
    lv.sweepers = [];
    lv.traps = [];
    lv.slopes = [];
    lv.rocks = [];
    lv.key = { x: 420, y: GY - 95, run: { x0: 140, x1: 780, gy: GY } };
    lv.exit = { x: 110, y: GY - 74, w: 54, h: 74 };
    return v15SanitizeLevel(lv);
  }

  const POOL_SOLO = [
    (b, d, m) => seg.laserCorridor(b, 840, d),
    (b, d, m) => seg.blackHoleVortex(b, 660, d),
    (b, d, m) => seg.phantomBridge(b, 4 + (d > 0.5 ? 2 : 1), d),
    (b, d, m) => seg.conveyorPendulum(b, 840, d),
    (b, d, m) => seg.sniperBastion(b, 820, d, m),
    (b) => seg.gravityPillars(b, 920),
    (b, d, m) => seg.glacierSled(b, Math.round(1500 + d * 350), m),
    (b, d, m) => seg.judgmentCorridor(b, 860, m),
    (b) => seg.antiGravChamber(b, 740),
    (b, d) => seg.passCollapse(b, Math.round(330 + d * 110)),
    (b) => seg.delayedAmbush(b, 680),
    (b, d) => seg.movingGap(b, Math.round(130 + d * 35)),
    (b) => { seg.trollSpringTrap(b); baseDrop(b); },
    (b) => seg.antiBaitSpikes(b, 720, { flag: true, coins: [[340, -95]] }),
    (b, d) => seg.fakePlates(b, Math.min(6, 4 + Math.floor(d * 2.5)), { flag: true }),
    (b, d) => seg.sawArena(b, Math.round(13 + d * 2), d > 0.45 ? 4 : 3),
    (b, d) => seg.compactor(b, 1300, { speed: +(2.0 + d * 0.75).toFixed(2) }),
    (b, d) => seg.ferry(b, Math.round(1600 + d * 300), { speed: +(1.55 + d * 0.55).toFixed(2) }),
    (b, d) => seg.avalancheHill(b, Math.round(165 + d * 35), { n: d > 0.5 ? 3 : 2, period: +(3.2 - d * 0.8).toFixed(2) }),
    (b, d) => seg.crushers(b, d > 0.5 ? 5 : 4, { spacing: Math.round(230 - d * 30), period: +(2.3 - d * 0.6).toFixed(2), coins: [1, 2], flag: true }),
    (b) => seg.cave(b, 760, { ice: true, at: [160, 320, 480, 640], flag: true }),
    (b, d) => seg.meteor(b, 860, { n: d > 0.35 ? 3 : 2, period: +(3.1 - d * 0.85).toFixed(2), flag: true }),
  ];

  const POOL_TEAM = [
    (b, d, m) => { seg.sniperBastion(b, 820, d, m); seg.coopDualHold(b, 480, { flag: true }); },
    (b, d, m) => { seg.conveyorPendulum(b, 840, d); seg.partyStackCliff(b, Math.round(205 + d * 60)); baseDrop(b); },
    (b, d, m) => seg.glacierSled(b, Math.round(1550 + d * 350), m),
    (b, d, m) => seg.judgmentCorridor(b, 880, m),
    (b, d) => { seg.laserCorridor(b, 820, d); seg.passCollapse(b, 360); },
    (b, d) => { seg.blackHoleVortex(b, 660, d); seg.delayedAmbush(b, 680); },
    (b, d) => { seg.phantomBridge(b, 5, d); seg.movingGap(b, 140); },
    (b) => { seg.gravityPillars(b, 920); seg.sawArena(b, 14, 4); },
    (b) => { seg.betray(b, {}); seg.fakePlates(b, 5, { flag: true }); },
    (b, d) => { seg.compactor(b, 1320, { speed: +(2.05 + d * 0.7).toFixed(2) }); seg.antiBaitSpikes(b, 750, { flag: true }); },
  ];

  const SEASONS = [
    { name: '☣️ Đầm Lầy Độc Dược', sky: 'toxic', hue: 135, biome: 'toxic' },
    { name: '🌊 Đại Dương Cá Mập', sky: 'ocean', hue: 195, biome: 'water' },
    { name: '🧊 Kỷ Băng Hà Tuyệt Đối', sky: 'frost', hue: 200, biome: 'ice' },
    { name: '🚀 Vũ Trụ Không Trọng Lực', sky: 'cosmic', hue: 265, biome: 'space' },
    { name: '👻 Nghĩa Địa Quỷ Dị', sky: 'storm', hue: 275, biome: 'normal' },
    { name: '🌋 Hỏa Ngục Dung Nham', sky: 'ember', hue: 14, biome: 'normal' },
    { name: '🌃 Đêm Neon Đảo Chiều', sky: 'neon', hue: 290, biome: 'normal' },
  ];

  function makeUniversityStage(mode, idx) {
    try {
      const d = clamp(idx / 99, 0.25, 1.0);
      const season = SEASONS[(idx + (mode === 'coop' ? 2 : mode === 'party' ? 4 : 0)) % SEASONS.length];
      const stageTitle = season.name + ' #' + (idx + 1);

      if (idx % 8 === 3) return buildDescentStage(stageTitle, season.hue, idx + 1, mode);
      if (mode !== 'coop' && idx % 8 === 7) {
        const nFloors = 4 + Math.min(4, Math.floor(d * 4));
        const tw = buildTower({
          name: stageTitle + ' [TOWER ↑]',
          hint: 'Leo từ ĐÁY lên ĐỈNH! Dung nham & Void Maw dâng tốc độ cao.',
          hue: season.hue,
          rooms: [['L', nFloors, { crumble: 1, drip: 1, ice: true }], ['C', 3 + (idx % 2)], ['S', 2 + (idx % 2)], ['L', nFloors, { crumble: 1, drip: 1 }]],
          riser: { speed: Math.round(19 + d * 16), delay: 4.5, kind: idx % 2 ? 'lava' : 'maw' },
          seed: idx + 300,
        });
        return v15SanitizeLevel(tw);
      }

      const b = new LB(
        stageTitle,
        season.biome === 'toxic'
          ? '☣️ ĐẦM LẦY ĐỘC & QUỶ DỊ: Coi chừng cây phun axit, đồng xu biến dị & Kẻ Giả Dạng ở Checkpoint!'
          : season.biome === 'water'
          ? '🌊 BƠI LẶN ĐẠI DƯƠNG: Thỏ bơi ngang đạp nước — Coi chừng hàm răng Cá Mập Megalodon!'
          : season.biome === 'space'
          ? '🚀 VŨ TRỤ KHÔNG TRỌNG LỰC: Bay Jetpack & Lộn ngược bước đi trên trần nhà!'
          : season.biome === 'ice'
          ? '🧊 BĂNG HÀ VĨNH CỬU: Đi chung trên Tảng Băng Duy Nhất (đi lẻ băng sẽ nổ)!'
          : '👻 CẢNH BÁO QUỶ DỊ: Bẫy biến hóa ngẫu nhiên — Kẻ giả dạng đồng đội rình rập ở Checkpoint!',
        season.hue,
        mode === 'coop'
      );

      if (idx % 5 === 4 && idx % 8 !== 5) seg.chaser(b, Math.round(124 + d * 34), 3.8);
      seg.run(b, 420, { flag: true, spikes: [[180, 64]], coins: [[210, -110]] });

      const modCount = 5 + (idx >= 35 ? 1 : 0) + (idx >= 70 ? 1 : 0);
      const usedMods = new Set();
      for (let step = 0; step < modCount; step++) {
        baseDrop(b);
        if (season.biome === 'ice' && step === 1) { seg.glacierSled(b, 1650, mode); continue; }
        if (season.biome === 'space' && step === 1) { seg.gravityPillars(b, 920); continue; }
        if (mode !== 'solo' && step % 2 === 0) {
          const ti = (idx * 5 + step * 7) % POOL_TEAM.length;
          POOL_TEAM[ti](b, d, mode);
        } else {
          let si = Math.floor(hash1((idx + 1) * 31.7 + step * 19.3 + (mode === 'coop' ? 7 : mode === 'party' ? 13 : 0)) * POOL_SOLO.length) % POOL_SOLO.length;
          while (usedMods.has(si)) si = (si + 1) % POOL_SOLO.length;
          usedMods.add(si);
          POOL_SOLO[si](b, d, mode);
        }
      }

      baseDrop(b);
      const endType = (idx * 3 + (mode === 'coop' ? 1 : mode === 'party' ? 2 : 0)) % 4;
      let lv;
      if (endType === 0) { seg.trollDoor(b, { mode: 'run' }); lv = b.finish(0, 0); }
      else if (endType === 1) { seg.trollDoor(b, { mode: 'sink' }); lv = b.finish(0, 0); }
      else if (endType === 2) { seg.leapDoor(b, {}); lv = b.finish(0, 0); }
      else { seg.runKeyZone(b, { len: 1050 }); seg.run(b, 500, { coins: [[250, -60]] }); lv = b.finish(460, 56); }

      lv.skyTheme = season.sky;
      lv.biome = season.biome;

      if (season.biome === 'ice') {
        for (const s of lv.solids) s.ice = true;
      }
      if (season.biome === 'water') {
        lv.sharks = [];
        for (let sx = 580; sx < lv.w - 600; sx += 980) {
          lv.sharks.push({
            x0: sx, x1: Math.min(lv.w - 280, sx + 880),
            baseY: GY - 135, minY: GY - 340, maxY: GY - 55,
            cx: sx, cy: GY - 135, speed: 3.6 + d * 1.5, off: sx * 0.01, dir: 1,
          });
        }
      }
      if (lv.w > 2400 && idx % 2 === 0) {
        lv.portals = [{ x0: 920, y0: GY - 55, x1: 1480, y1: GY - 185 }];
      }
      if (idx % 8 === 5) return reverseLevelHorizontally(lv);
      return v15SanitizeLevel(lv);
    } catch (err) {
      console.error('Fallback stage error:', err);
      const fb = new LB('Chaos Stage #' + (idx + 1), 'Vượt chướng ngại vật', (idx * 47) % 360, mode === 'coop');
      seg.run(fb, 800, { flag: true });
      seg.fakes(fb, 4, {});
      seg.run(fb, 800, {});
      return v15SanitizeLevel(fb.finish(450, 56));
    }
  }

  LEVELS.solo.length = 0;
  LEVELS.coop.length = 0;
  LEVELS.party.length = 0;
  for (let i = 0; i < 100; i++) {
    LEVELS.solo.push(() => { V11.ctx = { mode: 'solo', i }; try { return makeUniversityStage('solo', i); } finally { V11.ctx = null; } });
    LEVELS.coop.push(() => { V11.ctx = { mode: 'coop', i }; try { return makeUniversityStage('coop', i); } finally { V11.ctx = null; } });
    LEVELS.party.push(() => { V11.ctx = { mode: 'party', i }; try { return makeUniversityStage('party', i); } finally { V11.ctx = null; } });
  }
  delete LV_META.solo;
  delete LV_META.coop;
  delete LV_META.party;
  rebuildLevelSelect();
  renderShop();
  resize();
})();
`;

code = code.slice(0, lastClose) + v165FullPayload + '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V16.5 FULL MASTER] Đã gộp đầy đủ 100% v15.5 + v16.0 (Không cắt gọn bất kỳ tính năng hay cạm bẫy nào)!');

if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf8');
  if (!css.includes('body.force-landscape')) {
    css += `\nbody.force-landscape {
  position: fixed; top: 0; left: 100vw;
  width: 100vh !important; height: 100vw !important;
  transform: rotate(90deg); transform-origin: 0 0; overflow: hidden;
}
body.force-landscape #game, body.force-landscape #lobby, body.force-landscape .lp-wrap, body.force-landscape .shop-modal, body.force-landscape .sm-wrap {
  width: 100vh !important; height: 100vw !important;
}
body.force-landscape #hud, body.force-landscape #touch {
  width: 100vh !important; height: auto !important;
}\n`;
  }
  if (!css.includes('.tier-mythic')) {
    css += `\n.shop-item.tier-mythic{border-color:#ff0055;background:linear-gradient(160deg,#fff0f6,#f3d9fa)}
.shop-item.tier-mythic .tier-tag{background:linear-gradient(90deg,#7209b7,#ff0055)}
.shop-section-title.tier-mythic{color:#d6336c}
.preview-plague{background:#52b788;border-color:#081c15;box-shadow:0 0 12px #80ed99}
.preview-reaper{background:#1a1423;border-color:#ff0055;box-shadow:0 0 12px #ff0055}
.preview-dragon{background:#ffb703;border-color:#9d0208;box-shadow:0 0 12px #ffd43b}\n`;
  }
  fs.writeFileSync(cssPath, css, 'utf8');
}

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=16.5');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V16.5] Đã tự động cập nhật game.js?v=16.5 trong index.html');
}
