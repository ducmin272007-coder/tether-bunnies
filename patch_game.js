/**
 * Tether Bunnies v13.0 - UNIVERSITY CHAOS OVERHAUL PATCHER
 *  - Unlimited Buff Cap (999) + New Buff #6: Warp Flag (Checkpoint & Summon Squad)
 *  - Checkpoint Touch Auto-Teleports lagging/dead teammates forward
 *  - 30Hz Network Sync + Gravity Extrapolation (fixes floating/teleporting remote players) + Client ID (fixes duplicate ghost player on network switch)
 *  - Short & Strong Elastic Tether + Multi-Tier Stacking Carry (bottom bunny moves & jumps the entire stack!)
 *  - 4-Directional Courses: Left->Right, Right->Left (Reverse), Top->Bottom (Abyssal Descent), Bottom->Top (Tower Ascent)
 *  - New Biomes & Vehicles:
 *      1) Underwater Diving / Submarine + Megalodon Shark Chaser
 *      2) Space Zero-G / Flappy Jetpack Spaceship + Anti-Gravity Ceiling Walk
 *      3) Total Glacier Season + Single Iceberg Sled (requires whole squad aboard or shatters mid-abyss!)
 *  - University-Tier Traps: Red-Light Judgment Eye (input = death), Sync-Jump Gate, Decoy Teleporting Keys,
 *    Portal Swap Exit, and Dynamic Chaos Seed (randomizes traps after every death so you can never memorize them!)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pubDir = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const gamePath = path.join(pubDir, 'game.js');
const cssPath = path.join(pubDir, 'style.css');
const htmlPath = path.join(pubDir, 'index.html');

let code = fs.readFileSync(gamePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Nâng giới hạn mua Buff từ 2 lên 999 và tốc độ gửi gói tin lên 30Hz (33ms) ngay trong thân file gốc:
code = code.replace(/const BUFF_CAP = \d+;/g, 'const BUFF_CAP = 999;');
code = code.replace(/const SEND_MS = \d+;/g, 'const SEND_MS = 33;');

// Xóa bản patch cũ (nếu có) trước khi ghi bản v13.0 mới nhất
const OLD_M = '/* === TB_V12_5_MASTER_OVERRIDE === */';
const NEW_M = '/* === TB_V13_0_UNIVERSITY_EDITION === */';
if (code.includes(OLD_M)) code = code.slice(0, code.indexOf(OLD_M)) + '})();\n';
if (code.includes(NEW_M)) code = code.slice(0, code.indexOf(NEW_M)) + '})();\n';

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); cuối file game.js');
  process.exit(0);
}

const v13Payload = `
${NEW_M}
// ============================================================================
// 1. ĐỊNH DANH CLIENT ID (CHỐNG NHÂN ĐÔI NHÂN VẬT KHI ĐỔI MẠNG) & ĐỒNG BỘ MƯỢT 30HZ
// ============================================================================
const V13_CID = (() => {
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
  socket = io({ transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 400 });
  socket.on('roster', onRoster);
  socket.on('ps', onPositions);
  socket.on('ev', onNetEv);
  socket.on('disconnect', () => { if (G.inGame && isNet()) { netLost = true; toast('⚡ Mất kết nối — Đang tự động nối lại…'); } });
  socket.on('connect', () => {
    if (!(netLost && G.inGame && isNet())) return;
    socket.emit('join', { code: G.code, name: G.myName, skin: Save.equipped(), cid: V13_CID }, (res) => {
      if (res && res.ok) {
        netLost = false;
        if (G.myslot !== res.slot) G.remotes.delete(res.slot);
        G.myslot = res.slot; if (G.me) G.me.slot = res.slot;
        G.names[res.slot] = G.myName; G.hostSlot = res.host !== undefined ? res.host : res.slot;
        toast('✅ Đã nối lại mạng thành công!');
      } else { toast('Phòng đã đóng.'); setTimeout(() => { location.href = location.pathname; }, 1500); }
    });
  });
  return socket;
}

function doCreate() {
  Snd.init();
  const s = ensureSocket(); if (!s) { setMsg('Cannot reach the game server.'); return; }
  setMsg('Creating room…');
  s.emit('create', { name: myNameValue(), skin: Save.equipped(), mode: G.lobbyMode === 'party' ? 'party' : 'coop', cid: V13_CID }, (res) => {
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
  s.emit('join', { code, name: myNameValue(), skin: Save.equipped(), cid: V13_CID }, (res) => {
    if (!res || !res.ok) { setMsg((res && res.error) || 'Could not join.'); return; }
    enterCoop(res, false);
  });
}
$('createBtn').onclick = doCreate;
$('joinBtn').onclick = () => doJoin();

// Nội suy vật lý có Trọng Lực (Gravity Prediction) -> Chấm dứt hoàn toàn lỗi nhìn thấy bạn bay lơ lửng / dịch chuyển!
function stepRemotes() {
  const now = nowMs();
  const k = 1 - Math.exp(-STEP * 28);
  const gEff = (G.L && G.L.biome === 'water') ? GRAV * 0.25 : (G.L && G.L.biome === 'space') ? GRAV * 0.35 : GRAV;
  for (const r of G.remotes.values()) {
    const age = Math.min(0.09, Math.max(0, (now - r.recv) / 1000));
    const ticks = age * 60;
    const ex = r.tx + r.tvx * ticks;
    const ey = r.onGround ? r.ty : r.ty + clamp(r.tvy * ticks + 0.5 * gEff * ticks * ticks, -48, 48);
    const px = r.x, py = r.y;
    r.px = r.x; r.py = r.y;
    if (Math.abs(ex - r.x) > 320 || Math.abs(ey - r.y) > 320) { r.x = ex; r.y = ey; }
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
// 2. MỞ RỘNG SHOP BUFF (MUA VÔ HẠN 999) & THÊM BUFF SỐ 6: 🚩 CỜ TRIỆU HỒI CHECKPOINT
// ============================================================================
BUFFS.warpflag = {
  name: 'Warp Checkpoint',
  icon: '🚩',
  price: 25,
  desc: 'Cắm Checkpoint ngay tại chỗ đang đứng và DỊCH CHUYỂN TỨC THÌ toàn bộ đồng đội tới vị trí của bạn!',
};
if (!BUFF_IDS.includes('warpflag')) BUFF_IDS.push('warpflag');
BUFF_KEYS.Digit6 = 'warpflag';
BUFF_KEYS.Numpad6 = 'warpflag';

(function ensureWarpTouchBtn() {
  const tb = $('tBuffs');
  if (tb && !$('tb_warpflag')) {
    const b = document.createElement('button');
    b.id = 'tb_warpflag'; b.className = 'tbtn tbf hidden'; b.dataset.buff = 'warpflag'; b.title = 'Cắm Cờ Checkpoint & Triệu hồi đồng đội';
    b.innerHTML = '🚩';
    tb.appendChild(b);
  }
})();

const _origUseBuff = useBuff;
useBuff = function (which) {
  const P = G.me;
  if (!P || P.dead || G.won) return;
  if (which === 'warpflag') {
    const free = Role.admin;
    if (!free && Save.buff('warpflag') <= 0) { toast('Hết Cờ Triệu Hồi 🚩 — Mua thêm trong 🛍️ Shop!'); return; }
    if (!P.onGround && G.L && G.L.biome !== 'water' && G.L.biome !== 'space') {
      toast('⚠️ Phải đứng trên mặt đất mới cắm được Cờ Checkpoint!');
      return;
    }
    if (!free) Save.useBuff('warpflag');
    const wx = Math.round(P.x), wy = Math.round(P.y);
    P.cp = { x: wx, y: wy };
    if (G.L && G.L.flags) G.L.flags.push({ x: wx + PW / 2, y: wy + PH, on: true });
    Snd.cp(); sparkle(wx + PW / 2, wy + PH / 2, 26, 1.8, '#ffd43b');
    toast('🚩 Đã cắm Cờ Checkpoint & Triệu hồi toàn đội tới chỗ bạn!');
    if (isNet()) netEv({ t: 'cp', x: wx, y: wy, fi: -1, s: P.slot, pull: 1 });
    refreshBuffUI();
    return;
  }
  return _origUseBuff(which);
};

// ============================================================================
// 3. DÂY NGẮN & KÉO CẢ ĐỘI + XẾP CHỒNG ĐA TẦNG (NGƯỜI DƯỚI CÙNG NHẢY/ĐI MANG THEO CẢ THÁP)
// ============================================================================
const V13_ROPE_REST = 64;        // Dây ngắn gọn 64px để kéo đồng đội cực nhạy
const V13_ROPE_SPRING = 82;      // Ngưỡng lò xo kéo mạnh
const V13_ROPE_MAX = 104;        // Khóa cứng tối đa 104px (không bao giờ dãn dài hay chạm chông!)
const V13_PIT_SAFE = 78;         // Treo cao hơn mũi chông đáy vực 55px

function v13SquadState(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0) return null;
  let groundedPower = P.onGround ? (input.d ? 3.0 : 1.35) : 0;
  let fallingCount = P.onGround ? 0 : 1;
  let bestAnchor = P.onGround ? { x: P.x, y: P.y, tvx: P.vx, vy: P.vy, anch: input.d, slot: P.slot } : null;
  const slots = [P.slot];
  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    slots.push(r.slot);
    if (r.onGround || r.anch) {
      groundedPower += r.anch ? 3.0 : 1.35;
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
  const st = v13SquadState(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  for (const r of links) {
    const ax = P.x + PW / 2, ay = P.y + PH / 2, bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d <= V13_ROPE_REST || d < 1) continue;
    const nx = dx / d, ny = dy / d, stretch = d - V13_ROPE_REST;
    const partnerGrounded = !!(r.onGround || r.anch);

    let scale = 1.0;
    if (meGrounded && !partnerGrounded) {
      if (input.d) scale = 0.0;
      else if (rescueRatio >= 0.9) scale = 0.04 / rescueRatio;
      else scale = clamp(0.8 * (1.05 - rescueRatio), 0.25, 0.85);
    } else if (!meGrounded && (partnerGrounded || bestAnchor)) {
      scale = clamp(1.95 * Math.sqrt(Math.max(0.6, rescueRatio)), 1.35, 3.4);
    } else scale = 0.8;

    const kS = d > V13_ROPE_SPRING ? 0.078 : 0.045;
    const f = Math.min(stretch * kS, 5.2) * scale;
    P.vx += nx * f;
    P.vy += ny * f * (ny < 0 ? 1.75 : 0.28);
  }

  // Người trên bờ nhảy hoặc chạy là đủ sức kéo toàn bộ đội dưới vực bay lên theo:
  if (!meGrounded && bestAnchor && P.y > bestAnchor.y + 16) {
    const dxA = (bestAnchor.x + PW / 2) - (P.x + PW / 2);
    const dyA = (bestAnchor.y + PH / 2) - (P.y + PH / 2);
    const distA = Math.max(1, Math.hypot(dxA, dyA));
    const lift = clamp(rescueRatio, 0.85, 2.5);
    P.vy -= Math.min(GRAV * 1.65 * lift, 2.1);
    if (Math.abs(bestAnchor.tvx || 0) > 0.5 || (bestAnchor.vy || 0) < -2 || bestAnchor.anch || distA > V13_ROPE_SPRING) {
      P.vy = Math.max(P.vy - 1.15 * lift, -12.0);
      P.vx += (dxA / distA) * 0.78 * lift;
    }
  }
}

function v13EnforceRopeConstraint(P) {
  const st = v13SquadState(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  if (!P.onGround && bestAnchor && P.y > bestAnchor.y + V13_PIT_SAFE) {
    const maxY = bestAnchor.y + V13_PIT_SAFE;
    if (nearSolids(P.x, maxY, PW, PH).length === 0) {
      P.y = maxY;
      if (P.vy > 0) P.vy = -P.vy * 0.52 - 3.2;
    }
    P.vx += Math.sign(bestAnchor.x - P.x) * 0.65;
  }

  for (const r of links) {
    const partnerGrounded = !!(r.onGround || r.anch);
    const ax = P.x + PW / 2, ay = P.y + PH / 2, bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d > V13_ROPE_MAX && d > 1) {
      if (meGrounded && partnerGrounded && Math.abs(r.tvy || 0) < 2) continue;
      if (meGrounded && !partnerGrounded && (input.d || rescueRatio >= 0.95)) continue;
      const nx = dx / d, ny = dy / d;
      const share = (!meGrounded && (partnerGrounded || bestAnchor)) ? 0.98 : (meGrounded ? 0.35 : 0.72);
      const over = (d - V13_ROPE_MAX) * share;
      const cx = P.x + nx * over, cy = P.y + ny * over;
      if (nearSolids(cx, P.y, PW, PH).length === 0) P.x = cx;
      if (nearSolids(P.x, cy, PW, PH).length === 0) P.y = cy;
      const vRad = P.vx * nx + P.vy * ny;
      if (vRad < 0) { P.vx -= nx * vRad * 1.4; P.vy -= ny * vRad * 1.45; }
    }
  }
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
    const d = Math.hypot(bx - ax, by - ay), slack = Math.max(0, V13_ROPE_REST - d), sag = slack * 0.4;
    const tension = clamp((d - V13_ROPE_REST) / 40, 0, 1);
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.slot % COLORS.length]); grad.addColorStop(1, COLORS[b.slot % COLORS.length]);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const coils = 8, ux = (bx - ax) / Math.max(1, d), uy = (by - ay) / Math.max(1, d);
    const px = -uy, py = ux, amp = tension > 0.05 ? (3.5 + tension * 4.5) : 0;
    ctx.strokeStyle = 'rgba(40,15,45,.7)'; ctx.lineWidth = 6.5;
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
// 4. HỆ THỐNG BẪY SINH VIÊN, PHƯƠNG TIỆN (TẢNG BĂNG / TÀU NGẦM / JETPACK) & CÁ MẬP
// ============================================================================
G.chaosSeed = 1;

function v13RandomizeOnDeath(L) {
  G.chaosSeed = (G.chaosSeed * 1664525 + 1013904223) >>> 0;
  const rng = (k) => hash1(G.chaosSeed * 0.0001 + k * 13.37);

  // 1. Giữ nguyên các khối gạch tàng hình ĐÃ ĐỤNG ĐẦU (bk.rev === true) để người chơi nhảy lên làm bàn đạp,
  //    nhưng các khối chưa đụng sẽ dịch chuyển nhẹ vị trí để chống học vẹt!
  for (let i = 0; i < (L.bonks || []).length; i++) {
    const bk = L.bonks[i];
    if (bk.baseX === undefined) bk.baseX = bk.x;
    if (!bk.rev) {
      bk.x = bk.baseX + Math.round((rng(i) - 0.5) * 36);
      const s = L.solids.find((q) => q.bonk === bk);
      if (s) s[0] = bk.x;
    }
  }

  // 2. Đảo ngẫu nhiên vị trí công tắc thật trong dãy fakePlates mỗi lần chết!
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
      t.x = t.x0; t.vx = 0; t.st = 0; t.wait = 0; t.shatter = false;
    } else if (t.k === 'redeye') {
      t.ph = 0; t.t = 2.6;
    } else if (t.k === 'syncgate') {
      t.open = false;
    }
  }
}

function initV11Level(L) {
  L.slopes = L.slopes || []; L.bonks = L.bonks || []; L.rocks = L.rocks || [];
  L.portals = L.portals || []; L.sharks = L.sharks || []; L.gravZones = L.gravZones || [];
  L.solids = L.solids.filter((s) => !s.bonk);
  L.bonks.forEach((bk, i) => {
    bk.i = i;
    // Chỉ khởi tạo bk.rev = false khi mới vào màn lần đầu, KHÔNG reset khi chết để có thể leo lên nóc gạch!
    if (bk.rev === undefined) bk.rev = false;
    bk.sh = 0;
    const r = [bk.x, bk.y, bk.w, bk.h]; r.bonk = bk; L.solids.push(r);
  });
  L.rocks.forEach((r) => { r.cyc = -1; });
  const k = L.key;
  if (k && k.run) {
    if (k.hx === undefined) { k.hx = k.x; k.hy = k.y; }
    k.x = k.hx; k.y = k.hy; k.vx = 0; k.vy = 0; k.fl = 0; k.t = 0; k.tx = k.x; k.ty = k.y; k.arc = null; k.cool = 0;
  }
}

// Chìa khóa cấp độ Sinh Viên: Không chỉ chạy lùi mà biết Dịch Chuyển Tức Thời (Blink Teleport) & tạo Phân Thân Giả!
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
  if (nb && nd < 135 && !(k.cool > 0) && k.fl < maxBlinks) {
    // Dịch chuyển tức thời (Blink) tới 1 trong 4 điểm khó lường (trên cao, sau lưng người chơi, hoặc bờ bên kia)
    const spots = [
      [R.x0 + 60, R.gy - 145],
      [R.x1 - 60, R.gy - 155],
      [(R.x0 + R.x1) / 2, R.gy - 195],
      [clamp(nb.x + (nb.face > 0 ? -240 : 240), R.x0 + 50, R.x1 - 50), R.gy - 65],
    ];
    const pick = spots[(k.fl + (G.chaosSeed % 4)) % spots.length];
    sparkle(k.x, k.y, 16, 1.5, '#ff4d6d');
    k.x = pick[0]; k.y = pick[1];
    k.fl++; k.cool = 0.75;
    Snd.djump();
    sparkle(k.x, k.y, 18, 1.6, '#ffd43b');
  } else if (nb && nd < 180 && k.fl >= maxBlinks) {
    // Khi đã hết lần Blink, bay lượn hình sin tốc độ cao
    k.x = clamp(k.x + Math.sign(k.x - nb.x) * 2.2, R.x0 + 40, R.x1 - 40);
    k.y = R.gy - 90 + Math.sin(G.lt * 7) * 55;
  }
}

// Cập nhật các cơ chế mới: Tảng băng trượt độc nhất (Iceberg Sled), Cá mập săn mồi (Megalodon), Mắt Đèn Đỏ, Cổng Đồng Bộ, Cổng Dịch Chuyển
function v13UpdateSpecialSystems(bodies) {
  const L = G.L, me = G.me;
  if (!L || !me) return;
  const alive = !me.dead && !G.won;
  const cx = me.x + PW / 2, cy = me.y + PH / 2, feet = me.y + PH;

  // 1. CỔNG DỊCH CHUYỂN KHÔNG GIAN (PORTALS / WORMHOLES):
  if (me.portalCd > 0) me.portalCd -= STEP;
  for (const pt of (L.portals || [])) {
    if (alive && !(me.portalCd > 0) && Math.hypot(cx - pt.x0, cy - pt.y0) < 38) {
      me.x = pt.x1 - PW / 2; me.y = pt.y1 - PH / 2;
      me.portalCd = 1.1;
      Snd.key(); sparkle(pt.x1, pt.y1, 20, 1.6, '#00ffe0');
      break;
    }
  }

  // 2. CÁ MẬP BẠO CHÚA (MEGALODON SHARK) DƯỚI ĐẠI DƯƠNG:
  for (const sh of (L.sharks || [])) {
    sh.cx = pingPong(sh.x0, sh.x1, sh.speed, sh.off, G.lt);
    const dir = Math.cos(((G.lt + sh.off) * sh.speed * 60 / Math.max(1, sh.x1 - sh.x0)) * Math.PI) >= 0 ? 1 : -1;
    sh.dir = dir;
    const tg = nearestBodyTo(sh.cx, sh.cy);
    const wantY = tg ? clamp(tg.y + PH / 2, sh.minY, sh.maxY) : sh.baseY;
    sh.cy += (wantY - sh.cy) * 0.045;
    if (alive && rectsOverlap(me.x + 4, me.y + 4, PW - 8, PH - 8, sh.cx - 46, sh.cy - 20, 92, 40)) {
      die('shark');
    }
  }

  // 3. CÁC BẪY CẤP ĐỘ ĐẠI HỌC TRONG L.TRAPS:
  for (let i = 0; i < (L.traps || []).length; i++) {
    const t = L.traps[i];

    // 3A. TẢNG BĂNG TRƯỢT ĐỘC NHẤT (ICEBERG SLED) - Phương tiện duy nhất qua biển chông băng!
    // Nếu chơi Party/Co-op mà chỉ 1 người leo lên đi lẻ bỏ đồng đội lại, tới giữa vực tảng băng sẽ VỠ VỤN bắt chết để reset!
    if (t.k === 'sled') {
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
          // Chờ 1.2s ở bến để đồng đội kịp nhảy lên cùng, hoặc chạy ngay nếu toàn đội đã lên đủ!
          if (riders >= totalPlayers || t.wait >= 1.35) {
            t.st = 1; Snd.shake();
          }
        } else t.wait = 0;
      } else if (t.st === 1) {
        const prevX = t.x;
        t.vx = Math.min(t.maxV || 6.2, (t.vx || 1.6) + 0.045);
        t.x = Math.min(t.x1, t.x + t.vx);
        t.dx = t.x - prevX;

        // KIỂM TRA PHẢN BỘI ĐỒNG ĐỘI TRONG CO-OP / PARTY:
        // Khi tảng băng đã trượt ra giữa vực sâu (> 38% quãng đường), nếu số người trên băng < tổng số người trong đội:
        // Tảng băng lập tức NỔ TUNG (Shatter), hất kẻ đi lẻ xuống biển chông băng để reset đội!
        if (totalPlayers > 1 && t.x > t.x0 + (t.x1 - t.x0) * 0.36 && t.x < t.x1 - 160 && riders < totalPlayers) {
          t.st = 2; t.shatterT = 2.0; t.dx = 0;
          Snd.crumble(); G.shake = 10;
          debris(t.x, t.y, t.w, 26, 22, '#9ad7f5');
          toast('🧊 Đi lẻ bỏ rơi đồng đội — Tảng băng vỡ vụn!');
          if (meOnSled) die('sled_betray');
        } else if (t.x >= t.x1) {
          t.dx = 0;
        }
      } else if (t.st === 2) {
        t.dx = 0; t.shatterT -= STEP;
        if (t.shatterT <= 0) { t.st = 0; t.x = t.x0; t.vx = 0; t.wait = 0; }
      }
      const s = L.solids[t.si];
      if (s) {
        s[0] = t.st === 2 ? -9999 : t.x;
        s[1] = t.y;
      }
      if (meOnSled && t.st === 1) {
        me.x += t.dx;
      }
    }

    // 3B. CON MẮT PHÁN QUYẾT "ĐÈN ĐỎ DỪNG LẠI" (RED LIGHT, GREEN LIGHT):
    // Khi mắt mở đỏ (st === 2), ai bấm phím Trái/Phải/Nhảy sẽ bị tia sét đánh trúng ngay lập tức!
    else if (t.k === 'redeye') {
      if (cx < t.x0 || cx > t.x1) continue;
      const cycle = 4.6, ph = (G.lt + (t.off || 0)) % cycle;
      t.state = ph < 2.5 ? 0 : ph < 3.25 ? 1 : 2; // 0: Nhắm mắt (Xanh), 1: Nheo mắt chuẩn bị (Vàng), 2: Mở mắt soi (Đỏ!)
      if (t.state === 2 && alive && (input.l || input.r || input.j || Math.abs(me.vx) > 1.8 || (!me.onGround && Math.abs(me.vy) > 3.5))) {
        sparkle(cx, cy, 24, 2.0, '#ff2d55');
        G.shake = 9;
        die('redeye');
      }
    }

    // 3C. CỔNG ĐỒNG BỘ NHỊP NHẢY (SYNC JUMP GATE - Bắt buộc cả đội nhảy cùng 1 nhịp mới mở!):
    else if (t.k === 'syncgate') {
      const g = L.gates[t.gi];
      if (!g || t.open) { if (g) g.act = true; continue; }
      let allAirborneNear = bodies.length > 0;
      let someoneNear = false;
      for (const b of bodies) {
        if (b.dead) { allAirborneNear = false; break; }
        if (Math.abs((b.x + PW / 2) - t.x) < 280) someoneNear = true;
        if (b.onGround || Math.abs((b.x + PW / 2) - t.x) > 340) { allAirborneNear = false; break; }
      }
      if (someoneNear && allAirborneNear) {
        t.open = true; g.act = true;
        Snd.gate(true); sparkle(g.x + g.w / 2, g.y + g.h / 2, 22, 1.6, '#70e000');
        if (isNet()) trapSend(i, 'sync', 1);
      }
    }
  }
}

// ============================================================================
// 5. GHI ĐÈ STEPPLAYER HỖ TRỢ: ĐẢO TRỌNG LỰC, BƠI LẶN, BAY JETPACK & CÕNG ĐỒNG ĐỘI ĐA TẦNG
// ============================================================================
function stepPlayer() {
  const P = G.me, L = G.L;
  P.px = P.x; P.py = P.y;
  springEars(P, P.vx, P.vy, P.face);
  if (P.dead) { P.deadT -= STEP; if (P.deadT <= 0) respawn(); return; }
  if (P.inv > 0) P.inv -= STEP;
  P.tetherGrace = 0;

  if (P.dj && !Role.admin) {
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

  // Kiểm tra vùng Đảo Ngược Trọng Lực (Zero-G / Anti-Gravity):
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
  if (jumpPressedNow) P.jbuf = 7;
  P.jPrev = input.j;
  if (input.b && !P.bPrev) useBuff();
  P.bPrev = input.b;
  if (P.rope) { stepRope(P, ax); if (P.jbuf > 0) P.jbuf--; P.anch = false; const h = hazardCheck(P); if (h) die(h); return; }

  if (P.wlock > 0) { P.wlock--; } else if (ax !== 0) {
    const acc = P.onGround ? (P.onIce ? 0.14 : slopeAcc(P)) : (isWater ? 0.45 : isSpace ? 0.55 : 0.65);
    const tgt = ax * runMax(P) * (isWater ? 0.88 : 1);
    P.vx += clamp(tgt - P.vx, -acc, acc);
    P.face = ax;
  } else P.vx *= P.onGround ? (P.onIce ? 0.99 : slopeDamp(P)) : (isWater ? 0.92 : 0.95);
  slopePull(P);
  if (Math.abs(P.vx) < 0.04) P.vx = 0;
  applyTether(P);

  { const rm = runMax(P); P.vx = clamp(P.vx, -rm - 4, rm + 4); }

  // Trọng lực theo Môi trường (Nước / Vũ trụ / Đảo ngược trần nhà / Bình thường):
  const gravStep = isWater ? GRAV * 0.34 : isSpace ? GRAV * 0.44 : GRAV;
  const maxFallSpd = isWater ? 6.5 : isSpace ? 8.5 : (curPassive === 'featherfall' ? MAXFALL * 0.7 : MAXFALL);
  if (gDir > 0) P.vy = Math.min(P.vy + gravStep, maxFallSpd);
  else P.vy = Math.max(P.vy - gravStep, -maxFallSpd);

  // Leo tường (Wall-Jump):
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

  // Xử lý Nhảy / Bơi dưới nước / Bay Tàu Vũ Trụ Jetpack (Flappy Thrust):
  if (isWater && jumpPressedNow) {
    P.vy = -7.6 * jumpMul(P); P.onGround = false; P.jbuf = 0; P.sq = -0.2;
    Snd.jump(P.slot); puff(P.x + PW / 2, P.y + PH, 4, '#c8f7ff', 0.8);
  } else if (isSpace && (jumpPressedNow || (input.j && P.vy > -3.2))) {
    P.vy = Math.max(P.vy - 1.35 * gDir, -8.8) * gDir;
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
      // Đi bộ lộn ngược trên trần nhà khi vào vùng Đảo Trọng Lực!
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

  // THÁP SỐNG ĐA TẦNG (MULTI-TIER STACKING CARRY):
  // Người đứng trên đầu đồng đội sẽ được đồng đội bên dưới cõng đi (cả ngang dx lẫn nhảy tung lên dy)!
  if ((G.mode === 'coop' || G.mode === 'party') && !P.onGround && P.vy >= -2) {
    for (const r of G.remotes.values()) {
      if (r.dead || r.ropeOn) continue;
      const feet = P.y + PH;
      if (P.x + PW - 3 > r.x + 1 && P.x + 3 < r.x + PW - 1 && feet >= r.y - 8 && feet0 <= r.y + 18) {
        P.y = r.y - PH;
        P.onGround = true;
        P.ride = r;
        const carryX = r.dx || (r.tvx * 0.95) || 0;
        P.x += carryX;
        if (nearSolids(P.x, P.y, PW, PH).length) P.x -= carryX;
        // Nếu người dưới cùng nhảy lên (r.tvy < -2 hoặc r.dy < -2), đẩy người đứng trên bay lên theo cùng khối!
        if ((r.tvy || 0) < -2.5 || (r.dy || 0) < -2.2) {
          P.vy = Math.min(P.vy, (r.tvy || -JUMP) * 1.05);
          P.onGround = false;
        } else {
          P.vy = 0;
        }
        break;
      }
    }
  }

  if (G.mode === 'coop') v13EnforceRopeConstraint(P);

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

// ============================================================================
// 6. KHI CHẠM CHECKPOINT -> TỰ ĐỘNG LÔI / DỊCH CHUYỂN ĐỒNG ĐỘI LÊN CÙNG!
// ============================================================================
const _origUpdateWorld = updateWorld;
updateWorld = function () {
  const L = G.L, me = G.me;
  const prevFlags = L && L.flags ? L.flags.map((f) => f.on) : [];
  _origUpdateWorld();
  if (!L || !me) return;
  v13UpdateSpecialSystems(allBodies());

  // Nếu vừa chạm mở 1 Checkpoint mới trong Co-op / Party, gửi cờ pull: 1 để lôi toàn bộ đồng đội ở phía sau lên!
  if (isNet() && L.flags) {
    for (let i = 0; i < L.flags.length; i++) {
      if (!prevFlags[i] && L.flags[i].on) {
        netEv({ t: 'cp', x: Math.round(me.cp.x), y: Math.round(me.cp.y), fi: i, s: me.slot, pull: 1 });
      }
    }
  }
};

const _origOnNetEv = onNetEv;
onNetEv = function (e) {
  if (!e || !G.inGame || !isNet()) return;
  if (e.t === 'cp' && e.lv === G.lvIdx) {
    const M = G.me, L = G.L;
    if (M) {
      M.cp = { x: e.x, y: e.y };
      if (L && L.flags && e.fi >= 0 && L.flags[e.fi]) L.flags[e.fi].on = true;
      // Dịch chuyển ngay đồng đội đang chết hoặc đang bị bỏ lại phía sau (> 180px) lên thẳng Checkpoint vừa chạm!
      const dist = Math.hypot(M.x - e.x, M.y - e.y);
      if (e.pull || M.dead || dist > 180) {
        M.dead = false; M.x = e.x + (M.slot % 4) * 14; M.y = e.y; M.vx = 0; M.vy = 0; M.rope = null;
        G.cam.snap = true;
        sparkle(M.x + PW / 2, M.y + PH / 2, 18, 1.5, '#7cf');
      }
      toast('⚑ ' + (G.names[e.s] || 'Đồng đội') + ' chạm Checkpoint — Cả đội được kéo lên!');
    }
    return;
  }
  if (e.t === 'trap' && e.lv === G.lvIdx && e.a === 'sync') {
    const t = G.L && G.L.traps && G.L.traps[e.i];
    if (t && t.k === 'syncgate') {
      t.open = true;
      if (G.L.gates[t.gi]) G.L.gates[t.gi].act = true;
      Snd.gate(true);
    }
    return;
  }
  return _origOnNetEv(e);
};

const _origRespawn = respawn;
respawn = function () {
  _origRespawn();
  if (G.L) v13RandomizeOnDeath(G.L);
};

// ============================================================================
// 7. NÂNG CẤP ĐỒ HỌA QUÁI VẬT (CÁ MẬP MEGALODON, CON MẮT PHÁN QUYẾT, CỔNG VŨ TRỤ, TÀU NGẦM/JETPACK)
// ============================================================================
const _origDrawTraps = drawTraps;
drawTraps = function (L) {
  _origDrawTraps(L);
  const T = G.lt;

  // Vẽ vùng Đảo Ngược Trọng Lực (Anti-Gravity Field):
  for (const gz of (L.gravZones || [])) {
    ctx.save();
    const gr = ctx.createLinearGradient(0, gz.y0, 0, gz.y1);
    gr.addColorStop(0, 'rgba(180,80,255,.28)');
    gr.addColorStop(0.5, 'rgba(100,200,255,.12)');
    gr.addColorStop(1, 'rgba(180,80,255,.28)');
    ctx.fillStyle = gr;
    ctx.fillRect(gz.x0, gz.y0, gz.x1 - gz.x0, gz.y1 - gz.y0);
    ctx.fillStyle = 'rgba(220,180,255,.75)';
    ctx.font = '800 14px sans-serif'; ctx.textAlign = 'center';
    for (let x = gz.x0 + 60; x < gz.x1 - 40; x += 140) {
      const yOff = ((T * 90 + x) % (gz.y1 - gz.y0));
      ctx.fillText('▲ ZERO-G ▲', x, gz.y1 - yOff);
    }
    ctx.restore();
  }

  // Vẽ Cổng Dịch Chuyển Không Gian (Portals):
  for (const pt of (L.portals || [])) {
    [[pt.x0, pt.y0, '#00ffe0'], [pt.x1, pt.y1, '#ff2bd6']].forEach(([px, py, col]) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(T * 3.5);
      ctx.strokeStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 32, 0, 0, 6.3); ctx.stroke();
      ctx.fillStyle = 'rgba(20,10,45,.75)'; ctx.fill();
      ctx.restore();
    });
  }

  // Vẽ Cá Mập Khổng Lồ (Megalodon Shark):
  for (const sh of (L.sharks || [])) {
    ctx.save();
    ctx.translate(sh.cx, sh.cy);
    ctx.scale(sh.dir || 1, 1);
    // Thân cá mập cơ khí / đại dương sắc nét
    const sg = ctx.createLinearGradient(0, -26, 0, 26);
    sg.addColorStop(0, '#2b4c66'); sg.addColorStop(0.6, '#4a7696'); sg.addColorStop(1, '#dcebf7');
    ctx.fillStyle = sg; ctx.strokeStyle = '#122333'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(52, 2);
    ctx.quadraticCurveTo(15, -26, -38, -8);
    ctx.lineTo(-62, -24 + Math.sin(T * 14) * 6);
    ctx.lineTo(-50, 0);
    ctx.lineTo(-62, 22 + Math.sin(T * 14) * 6);
    ctx.lineTo(-38, 10);
    ctx.quadraticCurveTo(10, 26, 52, 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Vây lưng
    ctx.fillStyle = '#1d364a';
    ctx.beginPath(); ctx.moveTo(-4, -17); ctx.lineTo(-18, -42); ctx.lineTo(14, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Hàm răng sắc nhọn
    ctx.fillStyle = '#fff';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath(); ctx.moveTo(16 + k * 6, 6); ctx.lineTo(19 + k * 6, 13); ctx.lineTo(22 + k * 6, 6); ctx.fill();
    }
    // Mắt đỏ săn mồi
    ctx.fillStyle = '#ff1744'; ctx.beginPath(); ctx.arc(28, -5, 4.2, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  // Vẽ Tảng Băng Trượt Độc Nhất (Iceberg Sled), Mắt Đèn Đỏ & Cổng Đồng Bộ:
  for (const t of (L.traps || [])) {
    if (t.k === 'sled' && t.st !== 2) {
      ctx.save();
      const gr = ctx.createLinearGradient(t.x, t.y, t.x, t.y + 34);
      gr.addColorStop(0, '#e8f8ff'); gr.addColorStop(0.4, '#7fd8ff'); gr.addColorStop(1, '#1c6ea4');
      ctx.fillStyle = gr; ctx.strokeStyle = '#0b4870'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.x - 8, t.y); ctx.lineTo(t.x + t.w + 8, t.y);
      ctx.lineTo(t.x + t.w - 10, t.y + 30); ctx.lineTo(t.x + 12, t.y + 30);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center';
      const label = G.mode !== 'solo' ? '🧊 TẢNG BĂNG DUY NHẤT (Đợi đủ đội!)' : '🧊 VÁN TRƯỢT BĂNG';
      ctx.fillText(label, t.x + t.w / 2, t.y - 10);
      ctx.restore();
    } else if (t.k === 'redeye') {
      const cx = G.cam.x + (G.cam.vw || 800) / 2, cy = G.cam.y + 92;
      if (G.me && G.me.x + PW / 2 >= t.x0 && G.me.x + PW / 2 <= t.x1) {
        ctx.save();
        const col = t.state === 2 ? '#ff1744' : t.state === 1 ? '#ffd43b' : '#69db7c';
        ctx.fillStyle = 'rgba(15,5,25,.88)'; ctx.strokeStyle = col; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(cx, cy, 46, 26, 0, 0, 6.3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(cx, cy, t.state === 0 ? 4 : 13, 0, 6.3); ctx.fill();
        if (t.state === 2) {
          ctx.fillStyle = 'rgba(255,20,60,.14)';
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
    }
  }
};

// ============================================================================
// 8. BỘ KIẾN TẠO MÀN CHƠI ĐẠI HỌC (ĐA HƯỚNG, ĐA MÙA, ĐẠI DƯƠNG, VŨ TRỤ, BĂNG TUYẾT - 300 MÀN)
// ============================================================================
(() => {
  // Xóa đồng xu nằm ngay trên nóc gạch tàng hình để không làm lộ vị trí bẫy:
  seg.bonkGap = function (b, gapW, o) {
    o = o || {}; gapW = gapW || 150;
    const x0 = (o.lead === 0) ? b.x : seg.run(b, o.lead || 340, {});
    const gx = b.x, gy = b.gy;
    b.gap(gapW);
    b.bonks.push({ x: gx + gapW / 2 - 22 + (o.dx || 0), y: gy - 168, w: 46, h: 40, rev: false, sh: 0 });
    seg.run(b, o.land || 340, { flag: o.flag !== false });
    return x0;
  };

  // Lưu mảng tất cả vị trí nút bấm của fakePlates để mỗi lần chết tự động tráo vị trí nút thật!
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

  // MÔ-ĐUN MỚI A: VỰC BĂNG TUYẾT & TẢNG BĂNG TRƯỢT ĐỘC NHẤT (ICEBERG SLED)
  seg.glacierSled = function (b, len) {
    baseDrop(b);
    len = len || 1650;
    const x0 = b.ground(280), gy = b.gy;
    b.solids[b.solids.length - 1].ice = true;
    b.flag(x0 + 50);
    const cs = b.x, ce = cs + len;
    b.spikes.push({ x: cs, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    // Chướng ngại vật dọc đường trượt băng bắt buộc cả đội trên băng phải nhảy qua:
    for (let sx = cs + 380; sx < ce - 280; sx += 390) {
      b.spikes.push({ x: sx, y: gy - 26, w: 48, h: 26, dir: 'down' });
      b.stalactites.push({ x: sx + 140, y: gy - 310, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0 });
    }
    const sledW = G.mode === 'solo' ? 120 : 175;
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

  // MÔ-ĐUN MỚI B: CON MẮT PHÁN QUYẾT "ĐÈN ĐỎ DỪNG LẠI" (RED LIGHT EYE) + CỔNG NHẢY ĐỒNG BỘ (SYNC GATE)
  seg.judgmentCorridor = function (b, len) {
    len = len || 880;
    const x0 = b.ground(len), gy = b.gy;
    b.spikeUp(x0 + 220, 56);
    b.spikeUp(x0 + 480, 56);
    b.traps.push({ k: 'redeye', x0: x0 + 60, x1: x0 + len - 80, off: (x0 * 0.01) % 3, state: 0 });
    if (G.mode !== 'solo') {
      const gi = b.gates.length;
      b.gates.push({ x: x0 + len - 90, y: gy - 340, w: 28, h: 340, ctrl: [], mode: 'any', open: false, inv: false, tr: b.traps.length });
      b.traps.push({ k: 'syncgate', gi, x: x0 + len - 210, open: false });
    }
    b.coin(x0 + len * 0.5, gy - 75);
    return x0;
  };

  // MÔ-ĐUN MỚI C: VÙNG ĐẢO NGƯỢC TRỌNG LỰC (ANTI-GRAVITY CEILING WALK) + CỔNG DỊCH CHUYỂN
  seg.antiGravChamber = function (b, len) {
    len = len || 760;
    const x0 = b.x, gy = b.gy, ceilY = gy - 290;
    b.spikes.push({ x: x0, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    // Trần nhà biến thành sàn đi bộ lộn ngược!
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

  // MÀN CHƠI ĐẶC BIỆT 1: ĐI TỪ ĐỈNH THÁP RƠI XUỐNG ĐÁY VỰC SÂU (ABYSSAL DESCENT: TOP -> BOTTOM)
  function buildDescentStage(title, hue, seed) {
    const W = 960, H = 2650;
    const b = new LB(title + ' [DESCENT ↓]', 'Đi từ ĐỈNH xuống ĐÁY vực sâu! Cẩn thận trần gai đuổi từ trên xuống!', hue, G.mode === 'coop');
    b.h = H; b.wj = true; b.x = W;
    b.solids.push([0, 0, 40, H + 200]);
    b.solids.push([W - 40, 0, 40, H + 200]);
    // Xuất phát ở trên đỉnh (y = 150):
    b.solids.push([60, 190, 260, 24]);
    b.spawn = [120, 190 - PH];
    let curY = 310;
    let fIdx = 0;
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
      if (fIdx % 4 === 2) b.flags.push({ x: gapX > W / 2 ? 140 : W - 140, y: curY });
      b.coin(gapX + gapW / 2, curY - 35);
      curY += 165; fIdx++;
    }
    const botY = H - 90;
    b.solids.push([40, botY, W - 80, 160]);
    b.key = { x: 160, y: botY - 140, run: { x0: 90, x1: W - 90, gy: botY } };
    b.exitOv = { x: W - 150, y: botY - 74, w: 54, h: 74 };
    const lv = b.finish(0, 0);
    lv.skyTheme = 'storm';
    return lv;
  }

  // MÀN CHƠI ĐẶC BIỆT 2: ĐẢO CHIỀU ĐI TỪ PHẢI SANG TRÁI (MIRROR REVERSE: RIGHT -> LEFT)
  function reverseLevelHorizontally(lv) {
    const W = lv.w;
    lv.name += ' [ĐẢO CHIỀU ←]';
    lv.hint = '🔄 MÀN ĐẢO CHIỀU: Xuất phát bên PHẢI, chạy ngược về bên TRÁI để tìm Chìa khóa & Cửa thoát!';
    lv.spawn = [W - 140, GY - PH];
    for (const s of lv.solids) s[0] = W - s[0] - s[2];
    for (const sp of lv.spikes) sp.x = W - sp.x - sp.w;
    for (const c of lv.crumbles) c.x = W - c.x - c.w;
    for (const s of lv.springs) s.x = W - s.x - s.w;
    for (const c of lv.crushers) c.x = W - c.x - c.w;
    for (const b of lv.boulders) { const n0 = W - b.x1, n1 = W - b.x0; b.x0 = n0; b.x1 = n1; b.cx = n0; }
    for (const p of lv.plates) p.x = W - p.x - p.w;
    for (const g of lv.gates) g.x = W - g.x - g.w;
    for (const f of lv.flags) f.x = W - f.x;
    for (const c of lv.coins) c.x = W - c.x;
    for (const q of (lv.stalactites || [])) q.x = W - q.x - q.w;
    lv.sweepers = []; // Tắt tường quét trái->phải trong màn đi ngược
    lv.traps = [];    // Dùng hệ thống vật lý đảo chiều thuần túy
    lv.key = { x: 420, y: GY - 95, run: { x0: 140, x1: 780, gy: GY } };
    lv.exit = { x: 110, y: GY - 74, w: 54, h: 74 };
    return lv;
  }

  const POOL_SOLO = [
    (b, d) => seg.glacierSled(b, Math.round(1500 + d * 350)),
    (b) => seg.judgmentCorridor(b, 860),
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
    (b, d) => seg.glacierSled(b, Math.round(1550 + d * 350)),
    (b) => seg.judgmentCorridor(b, 880),
    (b) => seg.antiGravChamber(b, 740),
    (b, d) => { seg.partyStackCliff(b, Math.round(205 + d * 65)); baseDrop(b); seg.passCollapse(b, 360); },
    (b, d) => { seg.coopDualHold(b, Math.round(460 + d * 150), { flag: true }); seg.delayedAmbush(b, 680); },
    (b) => { seg.betray(b, {}); seg.movingGap(b, 140); },
    (b) => { seg.sawArena(b, 14, 4); seg.fakePlates(b, 5, { flag: true }); },
    (b, d) => { seg.compactor(b, 1320, { speed: +(2.05 + d * 0.7).toFixed(2) }); seg.antiBaitSpikes(b, 750, { flag: true }); },
  ];

  const SEASONS = [
    { name: '🌸 Mùa Xuân Bẫy Ngầm', sky: 'sakura', hue: 330, biome: 'normal' },
    { name: '🌊 Đại Dương Cá Mập', sky: 'ocean', hue: 195, biome: 'water' },
    { name: '🧊 Kỷ Băng Hà Tuyệt Đối', sky: 'frost', hue: 200, biome: 'ice' },
    { name: '🚀 Vũ Trụ Không Trọng Lực', sky: 'cosmic', hue: 265, biome: 'space' },
    { name: '⛈️ Bão Sấm Phán Quyết', sky: 'storm', hue: 225, biome: 'normal' },
    { name: '🌋 Hỏa Ngục Dung Nham', sky: 'ember', hue: 14, biome: 'normal' },
    { name: '🌃 Đêm Neon Đảo Chiều', sky: 'neon', hue: 290, biome: 'normal' },
  ];

  function makeUniversityStage(mode, idx) {
    const d = clamp(idx / 99, 0.22, 1.0);
    const season = SEASONS[(idx + (mode === 'coop' ? 2 : mode === 'party' ? 4 : 0)) % SEASONS.length];
    const stageTitle = season.name + ' #' + (idx + 1);

    // 1. Cứ mỗi 8 màn: Màn Rơi Từ Đỉnh Xuống Đáy Vực (Top -> Bottom Descent)!
    if (idx % 8 === 3) {
      return buildDescentStage(stageTitle, season.hue, idx + 1);
    }
    // 2. Cứ mỗi 8 màn: Màn Leo Tháp Từ Đáy Lên Đỉnh (Bottom -> Top Ascent)!
    if (mode !== 'coop' && idx % 8 === 6) {
      const nFloors = 4 + Math.min(4, Math.floor(d * 4));
      return buildTower({
        name: stageTitle + ' [TOWER ↑]',
        hint: 'Leo từ ĐÁY lên ĐỈNH! Dung nham & Void Maw dâng tốc độ cao.',
        hue: season.hue,
        rooms: [['L', nFloors, { crumble: 1, drip: 1, ice: true }], ['C', 3 + (idx % 2)], ['S', 2 + (idx % 2)], ['L', nFloors, { crumble: 1, drip: 1 }]],
        riser: { speed: Math.round(19 + d * 16), delay: 4.5, kind: idx % 2 ? 'lava' : 'maw' },
        seed: idx + 300,
      });
    }

    const b = new LB(
      stageTitle,
      season.biome === 'water'
        ? '🌊 MÀN BƠI LẶN: Bấm Nhảy liên tục để bơi! Coi chừng Cá Mập Megalodon săn đuổi!'
        : season.biome === 'space'
        ? '🚀 KHÔNG GIAN VŨ TRỤ: Giữ Nhảy để bay phản lực Jetpack & Đi bộ lộn ngược trên trần!'
        : season.biome === 'ice'
        ? '🧊 MÙA ĐÔNG VĨNH CỬU: Mặt đất đóng băng 100% — Phải đi chung trên Tảng Băng Duy Nhất!'
        : 'Độ khó Sinh Viên · Bẫy biến hóa ngẫu nhiên sau mỗi lần chết!',
      season.hue,
      mode === 'coop'
    );

    if (idx % 5 === 4 && idx % 8 !== 5) seg.chaser(b, Math.round(122 + d * 34), 4.0);
    seg.run(b, 440, { flag: true, spikes: [[180, 64]], coins: [[210, -110]] });

    const modCount = 4 + (idx >= 30 ? 1 : 0) + (idx >= 65 ? 1 : 0);
    let lastSi = -1;
    for (let step = 0; step < modCount; step++) {
      baseDrop(b);
      if (season.biome === 'ice' && step === 1) {
        seg.glacierSled(b, 1650);
        continue;
      }
      if (season.biome === 'space' && step === 1) {
        seg.antiGravChamber(b, 780);
        continue;
      }
      if (mode !== 'solo' && step % 2 === 0) {
        POOL_TEAM[(idx * 3 + step * 5) % POOL_TEAM.length](b, d);
      } else {
        let si = (idx * 7 + step * 11 + (mode === 'coop' ? 3 : mode === 'party' ? 9 : 0)) % POOL_SOLO.length;
        if (si === lastSi) si = (si + 1) % POOL_SOLO.length;
        lastSi = si;
        POOL_SOLO[si](b, d);
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

    // Nếu là Mùa Băng Giá: Đóng băng toàn bộ mặt đất!
    if (season.biome === 'ice') {
      for (const s of lv.solids) s.ice = true;
    }
    // Nếu là Màn Đại Dương: Thả Cá Mập Megalodon tuần tra dọc suốt màn chơi!
    if (season.biome === 'water') {
      lv.sharks = [];
      for (let sx = 650; sx < lv.w - 700; sx += 1150) {
        lv.sharks.push({
          x0: sx, x1: Math.min(lv.w - 300, sx + 950),
          baseY: GY - 110, minY: GY - 320, maxY: GY - 35,
          cx: sx, cy: GY - 110, speed: 3.4 + d * 1.4, off: sx * 0.01, dir: 1,
        });
      }
    }
    // Cổng dịch chuyển bất ngờ nối liền hai khu vực trong bản đồ:
    if (lv.w > 2400 && idx % 3 === 0) {
      lv.portals = [{ x0: 950, y0: GY - 55, x1: 1450, y1: GY - 180 }];
    }

    // 3. Cứ mỗi 8 màn (idx % 8 === 5): Đảo ngược toàn bộ màn chơi đi từ PHẢI sang TRÁI!
    if (idx % 8 === 5) {
      return reverseLevelHorizontally(lv);
    }
    return lv;
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

code = code.slice(0, lastClose) + v13Payload + '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V13.0 UNIVERSITY EDITION] Đã nâng cấp thành công public/game.js!');

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
    fs.writeFileSync(cssPath, css, 'utf8');
  }
}

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=13.0');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V13.0] Đã tự động cập nhật cache-busting game.js?v=13.0 trong index.html');
}
