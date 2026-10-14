/**
 * Tether Bunnies v12.5 - Guaranteed Runtime & File Override Patcher
 * Tự động chạy cùng server.js trên Render, ghi đè trực tiếp trước dấu })(); cuối file game.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pubDir = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const gamePath = path.join(pubDir, 'game.js');
const cssPath = path.join(pubDir, 'style.css');
const htmlPath = path.join(pubDir, 'index.html');

let code = fs.readFileSync(gamePath, 'utf8');

// Nếu có bản patch cũ thì cắt bỏ để cập nhật bản mới nhất
const MARKER = '/* === TB_V12_5_MASTER_OVERRIDE === */';
if (code.includes(MARKER)) {
  code = code.slice(0, code.indexOf(MARKER)) + '})();\n';
}

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); ở cuối file game.js');
  process.exit(0);
}

const v12Payload = `
${MARKER}
// ============================================================================
// 1. GHI ĐÈ HỆ THỐNG DÂY LÒ XO CO-OP (CHỐNG CHẠM CHÔNG KHI CHƠI 2v2 / 3-4 NGƯỜI)
// ============================================================================
const V12_TETHER_REST = 82;      // Chiều dài dây nghỉ (px)
const V12_TETHER_SPRING = 105;   // Ngưỡng đàn hồi lò xo mạnh (px)
const V12_TETHER_MAX = 128;      // Khóa cứng khoảng cách tối đa 2 đầu dây (px)
const V12_PIT_CLEARANCE = 88;    // Độ sâu tối đa dưới chân đồng đội trên bờ (luôn cao hơn chông đáy vực 45px!)

function v12GetSquadAnchor(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0) return null;
  let groundedPower = P.onGround ? (input.d ? 2.6 : 1.25) : 0;
  let fallingCount = P.onGround ? 0 : 1;
  let bestAnchor = P.onGround ? { x: P.x, y: P.y, slot: P.slot } : null;

  const slots = [P.slot];
  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    slots.push(r.slot);
    if (r.onGround || r.anch) {
      groundedPower += r.anch ? 2.6 : 1.25;
      if (!bestAnchor || r.y < bestAnchor.y) bestAnchor = { x: r.x, y: r.y, tvx: r.tvx || 0, anch: r.anch, slot: r.slot };
    } else {
      fallingCount += 1;
    }
  }
  slots.sort((a, b) => a - b);
  const idx = slots.indexOf(P.slot);
  const links = [];
  if (idx > 0) { const r = G.remotes.get(slots[idx - 1]); if (r && !r.dead && !r.ropeOn) links.push(r); }
  if (idx < slots.length - 1) { const r = G.remotes.get(slots[idx + 1]); if (r && !r.dead && !r.ropeOn) links.push(r); }

  return {
    links,
    bestAnchor,
    groundedPower,
    fallingCount,
    rescueRatio: groundedPower / Math.max(1, fallingCount), // >= 1.0 khi 1v1 hoặc 2v2!
  };
}

function applyTether(P) {
  const st = v12GetSquadAnchor(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  for (const r of links) {
    const ax = P.x + PW / 2, ay = P.y + PH / 2;
    const bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay;
    const d = Math.hypot(dx, dy);
    if (d <= V12_TETHER_REST || d < 1) continue;

    const nx = dx / d, ny = dy / d;
    const stretch = d - V12_TETHER_REST;
    const partnerGrounded = !!(r.onGround || r.anch);

    let pullScale = 1.0;
    if (meGrounded && !partnerGrounded) {
      // Mình đang đứng trên bờ giữ đồng đội dưới vực:
      // Nếu giữ phím S/Cắm neo hoặc số người trên bờ >= số người dưới vực (1v1, 2v2) -> Đứng cực vững!
      // Nếu 1 người trên bờ gánh 2-3 người dưới vực mà không giữ Neo -> Bị kéo trượt ra mép vực!
      if (input.d) pullScale = 0.0;
      else if (rescueRatio >= 0.95) pullScale = 0.06 / rescueRatio;
      else pullScale = clamp(0.82 * (1.05 - rescueRatio), 0.28, 0.9);
    } else if (!meGrounded && (partnerGrounded || bestAnchor)) {
      pullScale = clamp(1.75 * Math.sqrt(Math.max(0.6, rescueRatio)), 1.25, 3.0);
    } else {
      pullScale = 0.75;
    }

    const kSpring = d > V12_TETHER_SPRING ? 0.065 : 0.036;
    const f = Math.min(stretch * kSpring, 4.8) * pullScale;
    P.vx += nx * f;
    P.vy += ny * f * (ny < 0 ? 1.65 : 0.3);
  }

  // Lực tời lò xo tổng hợp cho CẢ ĐỘI khi có ít nhất 1 đồng đội trên bờ (Xử lý triệt để 2v2!):
  if (!meGrounded && bestAnchor && P.y > bestAnchor.y + 22) {
    const dxA = (bestAnchor.x + PW / 2) - (P.x + PW / 2);
    const dyA = (bestAnchor.y + PH / 2) - (P.y + PH / 2);
    const distA = Math.max(1, Math.hypot(dxA, dyA));
    const liftPower = clamp(rescueRatio, 0.75, 2.2);
    P.vy -= Math.min(GRAV * 1.55 * liftPower, 1.85);
    // Khi đồng đội trên bờ chạy lùi hoặc nhảy, kéo bổng toàn bộ người dưới vực lên bờ!
    if (Math.abs(bestAnchor.tvx || 0) > 0.7 || bestAnchor.anch || distA > V12_TETHER_SPRING) {
      P.vy = Math.max(P.vy - 0.95 * liftPower, -11.5);
      P.vx += (dxA / distA) * 0.62 * liftPower;
    }
  }
}

function v12EnforceTetherAfterMove(P) {
  const st = v12GetSquadAnchor(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  // 1. CHỐNG CHẠM CHÔNG ĐÁY VỰC CHO CẢ CHUỖI 2v2 (Dù là người thứ 3 hay thứ 4 trong chuỗi dây!):
  // Khi trên bờ có đồng đội đang trụ vững, KHÔNG BAO GIỜ cho phép bất kỳ ai rơi sâu quá 88px dưới mặt bờ!
  if (!P.onGround && bestAnchor && P.y > bestAnchor.y + V12_PIT_CLEARANCE) {
    const maxAllowedY = bestAnchor.y + V12_PIT_CLEARANCE;
    if (nearSolids(P.x, maxAllowedY, PW, PH).length === 0) {
      P.y = maxAllowedY;
      if (P.vy > 0) P.vy = -P.vy * 0.5 - 2.8; // Đàn hồi bật ngược lên như lò xo!
    }
    P.vx += Math.sign(bestAnchor.x - P.x) * 0.5;
  }

  // 2. KHÓA CỨNG ĐỘ DÃN DÂY TỐI ĐA (128px) GIỮA 2 NGƯỜI LIỀN KỀ:
  for (const r of links) {
    const partnerGrounded = !!(r.onGround || r.anch);
    const ax = P.x + PW / 2, ay = P.y + PH / 2;
    const bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay;
    const d = Math.hypot(dx, dy);
    if (d > V12_TETHER_MAX && d > 1) {
      if (meGrounded && partnerGrounded) continue;
      if (meGrounded && !partnerGrounded && (input.d || rescueRatio >= 0.95)) continue;
      const nx = dx / d, ny = dy / d;
      const share = (!meGrounded && (partnerGrounded || bestAnchor)) ? 0.96 : (meGrounded ? 0.25 : 0.65);
      const over = (d - V12_TETHER_MAX) * share;
      const cx = P.x + nx * over, cy = P.y + ny * over;
      if (nearSolids(cx, P.y, PW, PH).length === 0) P.x = cx;
      if (nearSolids(P.x, cy, PW, PH).length === 0) P.y = cy;

      const vRad = P.vx * nx + P.vy * ny;
      if (vRad < 0) {
        P.vx -= nx * vRad * 1.35;
        P.vy -= ny * vRad * 1.4;
      }
    }
  }
}

function hangingFriend(P) {
  let best = null, bd = 1e9;
  for (const r of G.remotes.values()) {
    if (r.dead || (r.onGround && !r.ropeOn) || r.y < P.y + 18) continue;
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    if (d > 240 || d < 35) continue;
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
    const d = Math.hypot(bx - ax, by - ay), slack = Math.max(0, V12_TETHER_REST - d), sag = slack * 0.45;
    const tension = clamp((d - V12_TETHER_REST) / 46, 0, 1);
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.slot % COLORS.length]); grad.addColorStop(1, COLORS[b.slot % COLORS.length]);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Vẽ hình xoắn lò xo khi dây căng để thấy rõ lực đàn hồi:
    const coils = 9, ux = (bx - ax) / Math.max(1, d), uy = (by - ay) / Math.max(1, d);
    const px = -uy, py = ux, amp = tension > 0.05 ? (3.5 + tension * 4.5) : 0;
    ctx.strokeStyle = 'rgba(45,20,50,.65)'; ctx.lineWidth = 6.5;
    ctx.beginPath(); ctx.moveTo(ax, ay);
    if (amp > 0) {
      for (let k = 1; k < coils; k++) {
        const u = k / coils, side = (k % 2 ? 1 : -1) * amp;
        ctx.lineTo(lerp(ax, bx, u) + px * side, lerp(ay, by, u) + py * side);
      }
      ctx.lineTo(bx, by);
    } else {
      ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by);
    }
    ctx.stroke();
    ctx.strokeStyle = tension > 0.15 ? 'rgb(255,' + Math.round(215 - tension * 155) + ',' + Math.round(90 - tension * 70) + ')' : grad;
    ctx.lineWidth = 3.8;
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================================
// 2. GHI ĐÈ STEPPLAYER, HAZARDCHECK, DIE, RESPAWN & ONNETEV (TEAM WIPE CHECKPOINT)
// ============================================================================
function hazardCheck(P) {
  const L = G.L;
  const hx = P.x + 4, hy = P.y + 5, hw = PW - 8, hh = PH - 8;
  for (const s of L.spikes) {
    if (s.hid) continue;
    // Bảo vệ tuyệt đối khỏi chông đáy vực khi đội vẫn còn ít nhất 1 người đứng trên bờ giữ dây!
    if (G.mode === 'coop' && (s.pit || s.y >= WORLD_H - 42) && !P.onGround) {
      const st = v12GetSquadAnchor(P);
      if (st && st.bestAnchor && st.bestAnchor.y < P.y - 20) {
        P.y = Math.min(P.y, s.y - PH - 14);
        if (P.vy > 0) P.vy = -7.2;
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
  if (P.y > (L.h || WORLD_H) + 90) return 'fall';
  return null;
}

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
  if (G.won) { P.vx *= 0.8; }
  let ax = G.won ? 0 : (input.r ? 1 : 0) - (input.l ? 1 : 0);
  if (P.rev > 0) { P.rev -= STEP; ax = -ax; }

  if (input.j && !P.jPrev && !G.won) P.jbuf = 7;
  P.jPrev = input.j;
  if (input.b && !P.bPrev) useBuff();
  P.bPrev = input.b;
  if (P.rope) { stepRope(P, ax); if (P.jbuf > 0) P.jbuf--; P.anch = false; const h = hazardCheck(P); if (h) die(h); return; }

  if (P.wlock > 0) { P.wlock--; } else if (ax !== 0) {
    const acc = P.onGround ? (P.onIce ? 0.16 : slopeAcc(P)) : (curPassive === 'featherfall' ? 0.85 : 0.65);
    const tgt = ax * runMax(P);
    P.vx += clamp(tgt - P.vx, -acc, acc);
    P.face = ax;
  } else P.vx *= P.onGround ? (P.onIce ? 0.985 : slopeDamp(P)) : 0.95;
  slopePull(P);
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
      P.vy = (isFromHead ? -JUMP * 1.15 : -JUMP) * jumpMul(P);
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
  P.x += P.vx;
  if (P.x < 0) { P.x = 0; P.vx = 0; }
  if (P.x > L.w - PW) { P.x = L.w - PW; P.vx = 0; }
  let hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
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
    if (P.vy > 0) {
      P.y = s[1] - PH; P.onGround = true; P.onIce = !!s.ice;
    } else if (P.vy < 0) {
      P.y = s[1] + s[3];
    } else {
      if (feet0 <= s[1] + s[3] + 8) { P.y = s[1] - PH; P.onGround = true; }
      else { P.y = s[1] + s[3]; }
    }
    P.vy = P.vy > 0 ? 0 : (P.vy < 0 ? 0 : P.vy);
  }

  v11Ground(P, feet0);
  if (P.fer !== null) {
    const fc = ferryCarry(P);
    P.x += fc;
    if (nearSolids(P.x, P.y, PW, PH).length) P.x -= fc;
  }

  if ((G.mode === 'coop' || G.mode === 'party') && !P.onGround && P.vy >= 0) {
    for (const r of G.remotes.values()) {
      if (r.dead || r.ropeOn) continue;
      const feet = P.y + PH, prevFeet = feet0;
      if (P.x + PW - 5 > r.x + 3 && P.x + 5 < r.x + PW - 3 && feet >= r.y - 2 && prevFeet <= r.y + 10) {
        P.y = r.y - PH; P.vy = 0; P.onGround = true; P.ride = r;
        P.x += r.dx || 0;
        if (nearSolids(P.x, P.y, PW, PH).length) P.x -= r.dx || 0;
        break;
      }
    }
  }

  // Khóa cứng dây ngay sau khi di chuyển & trước khi kiểm tra va chạm chông!
  if (G.mode === 'coop') v12EnforceTetherAfterMove(P);

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
    if (input.d) P.anch = true;
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
    if (cause === 'fall') { tpToCheckpoint(P); }
    else if (cause === 'wall') { tpToCheckpoint(P); rewindHunters(P); }
    else { P.vy = -8; }
    refreshBuffUI(); return;
  }
  P.dead = true; P.deadT = 0.55; P.rope = null; P.lastCause = cause;
  if (P.dj) { P.dj = false; P.djT = 0; }
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
    toast('💀 Bạn tử nạn — Cả đội quay về Checkpoint!');
  }
}

function respawn() {
  const P = G.me, L = G.L;
  const rx = P.cp.x, ry = P.cp.y;
  rewindHunters(P);
  resetTraps(L);
  initV11Level(L);
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
        if (M.rope) M.rope.len = Math.max(150, M.rope.len - 10);
        else { M.vy = -10.8; const r = G.remotes.get(e.s); if (r) M.vx += Math.sign(r.x - M.x) * 3.8; }
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

// ============================================================================
// 3. TẮT CẢNH BÁO BẪY (SILENT TRAPS), NGỤY TRANG ĐỊA HÌNH & SỬA GIẬT MAP/SOUND
// ============================================================================
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
      t.cr.forEach((ci, k) => { const c = L.crumbles[ci]; if (c && c.st === 0) { c.st = 1; c.t = 0.08 + (n - 1 - k) * 0.08; } });
    }
  } else if (t.k === 'pass_drop') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 3.0;
      t.cr.forEach((ci, k) => { const c = L.crumbles[ci]; if (c && c.st === 0) { c.st = 1; c.t = 0.04 + k * 0.04; c.fast = true; } });
    }
  } else if (t.k === 'ambush') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 0.22;
      for (const q of (L.stalactites || [])) if (q.sniper && q.st === 0 && Math.abs(q.x - t.zx1) < 300) { q.st = 2; q.vy = 9; q.fy = 0; q.gnd = groundBelow(q.x, q.x + q.w, q.y + q.h); }
    }
  } else if (t.k === 'shift_ledge') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t = 0; }
  } else if (t.k === 'troll_spring') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1; t.t = 4.0;
      const sp = L.springs[t.sIdx]; if (sp) sp.power = 23.5;
      for (const s of L.spikes) if (s.bt === i) { s.hid = false; s.live = true; s.ph = 1; }
    }
  }
}

function v11ResetTrap(L, t) {
  if (t.k === 'ceil') { t.cb = t.top; }
  else if (t.k === 'ferry') { t.cx = t.cx0; t.px = t.cx0; t.dx = 0; t.dir = 0; t.rot = 0; }
  else if (t.k === 'door2') { const e = L.exit; e.x = t.ex0; e.y = t.ey0; e.lock = false; e.legs = false; e.hide = false; t.n = 0; t.from = t.ex0; }
  else if (t.k === 'shift_ledge') { t.cur = 0; const s = L.solids[t.si]; if (s) s[0] = t.baseX; }
  else if (t.k === 'troll_spring') { const sp = L.springs[t.sIdx]; if (sp) sp.power = 17.5; }
}

function trapAct(i, a, v, who) {
  const L = G.L; if (!L || !L.traps) return;
  const t = L.traps[i]; if (!t) return;
  const mine = who === G.myslot;
  if (t.k === 'bait') {
    if (a === 'fire' && t.st === 0) { t.st = 1; t.t = 0.14; }
  } else if (t.k === 'fake') {
    const f = t.plates[v | 0];
    if (a === 'hit' && f && !f.used) {
      f.used = true; Snd.plate(true);
      if (f.v === 'stalac') {
        for (let q = 0; q < 4; q++) L.stalactites.push({ x: f.x - 40 + q * 65, y: f.y + 10 - 300, w: 34, h: 66, st: 2, t: 0, fy: 0, vy: 6, gnd: f.y + 10, dyn: true });
      } else if (mine) { G.me.rev = 4.0; }
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
  const tr = L.traps; if (!tr || !tr.length) return;
  const host = isHostSlot();
  const cx = me.x + PW / 2, feet = me.y + PH, alive = !me.dead && !G.won;
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
        t.t -= STEP; sp.forEach((s) => { s.hid = false; s.ph = clamp(1 - t.t / 0.14, 0, 1) * 0.4; });
        if (t.t <= 0) { t.st = 2; t.t = 1.8; sp.forEach((s) => { s.live = true; s.ph = 1; }); Snd.slam(); }
      } else if (t.st === 2) {
        t.t -= STEP; if (t.t <= 0) { t.st = 3; t.t = 0.35; sp.forEach((s) => { s.live = false; }); }
      } else if (t.st === 3) {
        t.t -= STEP; sp.forEach((s) => { s.ph = Math.max(0, t.t / 0.35); });
        if (t.t <= 0) { t.st = 4; t.t = 0.7; sp.forEach((s) => { s.hid = true; s.ph = 0; }); }
      } else { t.t -= STEP; if (t.t <= 0) t.st = 0; }
    } else if (t.k === 'pass_drop') {
      if (t.st === 0 && alive && cx > t.x0 + (t.x1 - t.x0) * 0.38 && cx < t.x1 + 30 && Math.abs(feet - t.gy) < 28) {
        trapSend(i, 'fire', G.lt);
      } else if (t.st === 1) {
        t.t -= STEP; if (t.t <= 0) t.st = 0;
      }
    } else if (t.k === 'ambush') {
      const sp = t._sp || (t._sp = L.spikes.filter((s) => s.bt === i));
      if (t.st === 0 && alive && cx > t.zx0 + 70 && cx < t.zx1 && Math.abs(feet - t.gy) < 40) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1) {
        t.t -= STEP;
        if (t.t <= 0) { t.st = 2; t.t = 1.9; sp.forEach((s) => { s.hid = false; s.live = true; s.ph = 1; }); Snd.slam(); }
      } else if (t.st === 2) {
        t.t -= STEP;
        if (t.t <= 0) { t.st = 0; sp.forEach((s) => { s.hid = true; s.live = false; s.ph = 0; }); }
      }
    } else if (t.k === 'shift_ledge') {
      const s = L.solids[t.si];
      if (t.st === 0 && alive && cx > t.gx - 20 && cx < t.baseX + 40 && !me.onGround && me.vy < 4) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1 && s) {
        t.t += STEP;
        const u = clamp(t.t / 0.18, 0, 1);
        t.cur = t.shift * u;
        s[0] = t.baseX + t.cur;
        if (t.t > 3.2) { t.st = 0; t.cur = 0; s[0] = t.baseX; }
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
          else if (Math.hypot(cx - (e.x + e.w / 2), me.y + PH / 2 - (e.y + e.h / 2)) < 120) trapSend(i, 'flee', 0);
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
    if (g.tr !== undefined) act = trapGateOpen(g);
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
        if (b.x + PW - 3 > c.x && b.x + 3 < c.x + c.w && feet >= c.y - 2 && feet <= c.y + 8) { c.st = 1; c.t = c.fast ? 0.10 : 0.24; break; }
      }
    } else if (c.st === 1) {
      c.t -= STEP;
      if (c.t <= 0) { c.st = 2; c.t = 2.6; c.fy = 0; c.vy = 0; if (Math.abs(c.x - camMidX) < hearRange) Snd.crumble(); debris(c.x, c.y, c.w, c.h, 8, '#8d6e63'); }
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
    for (const f of L.flags) {
      if (!f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90) {
        f.on = true; me.cp = { x: f.x - PW / 2, y: f.y - PH }; Snd.cp(); sparkle(f.x, f.y - 50, 14, 1, '#7cf');
        toast('⚑ Checkpoint!');
        if (G.mode !== 'solo') { netEv({ t: 'cp', x: Math.round(me.cp.x), y: Math.round(me.cp.y), fi: L.flags.indexOf(f), s: me.slot }); }
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

function drawCrumble(c) {
  if (c.st === 2) {
    ctx.save(); ctx.globalAlpha = clamp(1 - c.fy / 260, 0, 1); ctx.translate(c.x + c.w / 2, c.y + c.fy);
    ctx.rotate(c.fy * 0.004); ctx.fillStyle = '#a1887f'; ctx.fillRect(-c.w / 2, 0, c.w, c.h); ctx.restore(); return;
  }
  const sh = c.st === 1 ? Math.sin(G.lt * 90) * 2.5 : 0;
  const x = c.x + sh, y = c.y;
  const L = G.L || { hue: 200 };
  const shue = curEnv ? curEnv.solidHue : L.hue + 25, ghue = curEnv ? curEnv.grassHue : 105;
  ctx.fillStyle = hsl(shue, 38, 48); rr(x, y, c.w, c.h, 5); ctx.fill();
  ctx.fillStyle = hsl(ghue, 54, 44); rr(x - 2, y - 4, c.w + 4, 12, 5); ctx.fill();
  ctx.fillStyle = hsl(ghue, 60, 56); rr(x - 2, y - 4, c.w + 4, 6, 4); ctx.fill();
}

function drawStalactite(s) {
  if (s.st === 3 && s.gnd !== undefined) {
    ctx.save(); ctx.globalAlpha = clamp(s.t / 1.2, 0, 1); ctx.fillStyle = '#8d7b73';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(s.x + i * 9 - 4, s.gnd); ctx.lineTo(s.x + i * 9 + 3, s.gnd - 8 - (i % 2) * 5); ctx.lineTo(s.x + i * 9 + 10, s.gnd); ctx.fill(); }
    ctx.restore();
  }
  ctx.fillStyle = '#5d4e48'; rr(s.x - 12, s.y - 16, s.w + 24, 20, 8); ctx.fill();
  if (s.st === 3) return;
  const sh = s.st === 1 ? Math.sin(G.lt * 90) * 1.5 : 0, y0 = s.y + (s.st === 2 ? s.fy : 0);
  const gr = ctx.createLinearGradient(s.x, y0, s.x + s.w, y0);
  gr.addColorStop(0, '#6d5d57'); gr.addColorStop(0.5, '#b8a59d'); gr.addColorStop(1, '#6d5d57');
  ctx.fillStyle = gr; ctx.strokeStyle = '#3e2f2a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(s.x + sh, y0); ctx.lineTo(s.x + s.w + sh, y0); ctx.lineTo(s.x + s.w / 2 + sh, y0 + s.h); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// ============================================================================
// 4. XOAY NGANG ĐIỆN THOẠI TỰ ĐỘNG & NÚT CẮM NEO (⚓)
// ============================================================================
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
// 5. KHỞI TẠO 4 BẪY TỰ CHẾ CỰC ÁC, 11 BẦU TRỜI & 300 MÀN CHƠI (100 SOLO / 100 CO-OP / 100 PARTY)
// ============================================================================
(() => {
  SKY_THEMES.length = 0;
  SKY_THEMES.push('meadow', 'sunset', 'aurora', 'galaxy', 'ember', 'frost', 'cosmic', 'sakura', 'ocean', 'storm', 'neon');

  LB.prototype.gap = function (len) {
    this.spikes.push({ x: this.x, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    this.x += len;
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
    return lv;
  };

  seg.passCollapse = function (b, len) {
    const span = len || 340, x0 = b.ground(220), gy = b.gy, bx = b.x;
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
    b.stalactites.push({ x: x0 + len - 210, y: gy - 310, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0, sniper: true });
    b.traps.push({ k: 'ambush', zx0: x0 + 120, zx1: x0 + len - 90, gy, st: 0, t: 0 });
    b.coin(x0 + len * 0.5, gy - 64);
    return x0;
  };

  seg.movingGap = function (b, gapW) {
    gapW = gapW || 135;
    const x0 = b.ground(260), gy = b.gy, gx = b.x;
    b.spikes.push({ x: gx, y: WORLD_H - 26, w: gapW + 280, h: 26, dir: 'up', pit: true });
    const platIdx = b.solids.length, pw = 210;
    b.solids.push([gx + gapW, gy, pw, WORLD_H - gy + 80]);
    b.traps.push({ k: 'shift_ledge', gx, gy, si: platIdx, baseX: gx + gapW, shift: 68, cur: 0, st: 0, t: 0 });
    b.x = gx + gapW + pw + 70; b.ground(280); b.coin(gx + gapW * 0.6, gy - 95);
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

  const POOL_SOLO = [
    (b, d) => seg.passCollapse(b, Math.round(330 + d * 110)),
    (b) => seg.delayedAmbush(b, 680),
    (b, d) => seg.movingGap(b, Math.round(130 + d * 35)),
    (b) => { seg.trollSpringTrap(b); baseDrop(b); },
    (b) => seg.antiBaitSpikes(b, 720, { flag: true, coins: [[340, -95]] }),
    (b, d) => seg.fakePlates(b, Math.min(6, 4 + Math.floor(d * 2.5)), { flag: true }),
    (b, d) => seg.sawArena(b, Math.round(13 + d * 2), d > 0.45 ? 4 : 3),
    (b, d) => seg.compactor(b, 1300, { speed: +(1.95 + d * 0.75).toFixed(2) }),
    (b, d) => seg.ferry(b, Math.round(1600 + d * 300), { speed: +(1.5 + d * 0.55).toFixed(2) }),
    (b, d) => seg.avalancheHill(b, Math.round(165 + d * 35), { n: d > 0.5 ? 3 : 2, period: +(3.3 - d * 0.8).toFixed(2) }),
    (b, d) => seg.hillChute(b, Math.round(150 + d * 30), { deg: 42 }),
    (b, d) => seg.crushers(b, d > 0.6 ? 5 : 4, { spacing: Math.round(235 - d * 30), period: +(2.4 - d * 0.65).toFixed(2), coins: [1, 2], flag: true }),
    (b, d) => seg.boulders(b, 960, { specs: [[60, 900, +(3.8 + d * 1.4).toFixed(2), 0], [60, 900, +(3.3 + d * 1.2).toFixed(2), 3.1]], plats: [[290, -100, 96], [630, -100, 96]], flag: true }),
    (b) => seg.cave(b, 760, { ice: true, at: [160, 320, 480, 640], flag: true }),
    (b, d) => seg.meteor(b, 860, { n: d > 0.4 ? 3 : 2, period: +(3.2 - d * 0.9).toFixed(2), flag: true }),
    (b) => { seg.dropFloor(b, { pat: [1, 1, 0, 1, 1, 0, 1] }); seg.bonkGap(b, 155, { lead: 260 }); },
  ];

  const POOL_COOP = [
    (b) => { seg.passCollapse(b, 360); seg.stackWall(b); baseDrop(b); },
    (b, d) => { seg.delayedAmbush(b, 680); seg.coopDualHold(b, Math.round(460 + d * 160), { flag: true }); },
    (b) => { seg.betray(b, {}); seg.movingGap(b, 140); },
    (b) => { seg.rope(b, { key: false }); seg.trollSpringTrap(b); baseDrop(b); },
    (b, d) => { seg.compactor(b, 1300, { speed: +(2.0 + d * 0.7).toFixed(2) }); seg.coopDoor(b, { flag: true }); },
    (b, d) => { seg.ferry(b, 1750, { speed: +(1.55 + d * 0.5).toFixed(2) }); seg.fakePlates(b, 5, { flag: true }); },
    (b, d) => { seg.sawArena(b, 14, d > 0.4 ? 4 : 3); seg.antiBaitSpikes(b, 740, { flag: true }); },
    (b) => { seg.avalancheHill(b, 180, { n: 3, period: 2.9 }); seg.coopDualHold(b, 540, { flag: true }); },
  ];

  const POOL_PARTY = [
    (b, d) => { seg.partyStackCliff(b, Math.round(210 + d * 65)); baseDrop(b); seg.passCollapse(b, 360); },
    (b, d) => { seg.partyPlates(b, Math.min(6, 2 + Math.floor(d * 4)), { hold: +(3.2 - d * 0.9).toFixed(2) }); seg.delayedAmbush(b, 680); },
    (b, d) => { seg.partyTierPlates(b, { hold: +(4.5 - d * 1.2).toFixed(2) }); seg.movingGap(b, 145); },
    (b) => { seg.sawArena(b, 14, 4); seg.fakePlates(b, 5, { flag: true }); },
    (b, d) => { seg.compactor(b, 1350, { speed: +(2.05 + d * 0.75).toFixed(2) }); seg.antiBaitSpikes(b, 760, { flag: true }); },
    (b, d) => { seg.ferry(b, 1800, { speed: +(1.6 + d * 0.55).toFixed(2) }); seg.betray(b, {}); },
  ];

  const PFX = ['Abyssal', 'Cursed', 'Phantom', 'Shattered', 'Infernal', 'Ruthless', 'Venomous', 'Twisted', 'Merciless', 'Doomsday'];
  const NOUN = ['Gauntlet', 'Labyrinth', 'Catacomb', 'Citadel', 'Crucible', 'Slaughterhouse', 'Bastion', 'Purgatory', 'Vortex', 'Apocalypse'];

  function makeStage(mode, idx) {
    const d = clamp(idx / 99, 0.18, 1.0);
    const title = PFX[idx % 10] + ' ' + NOUN[Math.floor(idx / 10) % 10] + ' #' + (idx + 1);
    const hue = (idx * 53 + (mode === 'coop' ? 110 : mode === 'party' ? 220 : 0)) % 360;

    if (mode !== 'coop' && idx >= 9 && idx % 7 === 6) {
      const nFloors = 4 + Math.min(4, Math.floor(d * 4));
      return buildTower({
        name: 'Tower: ' + title,
        hint: 'Leo tường tốc độ cao! Bẫy ngầm không cảnh báo.',
        hue,
        rooms: [['L', nFloors, { crumble: 1, drip: 1, ice: idx % 2 === 0 }], ['C', 3 + (idx % 2)], ['S', 2 + (idx % 2)], ['L', nFloors, { crumble: 1, drip: 1 }]],
        riser: { speed: Math.round(18 + d * 16), delay: Math.max(4, 7 - Math.floor(d * 3)), kind: idx % 2 ? 'lava' : 'maw' },
        seed: idx + (mode === 'party' ? 500 : 100),
      });
    }

    const b = new LB(title, 'Cấp độ ' + (idx + 1) + '/100 · Không cảnh báo bẫy · Cẩn thận sau lưng!', hue, mode === 'coop');
    if (idx % 4 === 1 || idx > 82) seg.chaser(b, Math.round(120 + d * 36), Math.max(2.8, +(4.6 - d * 1.6).toFixed(1)));
    seg.run(b, 460, { flag: true, spikes: [[190, 64]], coins: [[220, -110]] });

    const count = 4 + (idx >= 35 ? 1 : 0) + (idx >= 70 ? 1 : 0);
    let lastMod = -1;
    for (let step = 0; step < count; step++) {
      baseDrop(b);
      if (mode === 'coop' && step % 2 === 0) {
        POOL_COOP[(idx * 3 + step * 5) % POOL_COOP.length](b, d);
      } else if (mode === 'party' && step % 2 === 0) {
        POOL_PARTY[(idx * 3 + step * 5) % POOL_PARTY.length](b, d);
      } else {
        let si = (idx * 7 + step * 11 + (mode === 'coop' ? 3 : mode === 'party' ? 9 : 0)) % POOL_SOLO.length;
        if (si === lastMod) si = (si + 1) % POOL_SOLO.length;
        lastMod = si;
        POOL_SOLO[si](b, d);
      }
    }

    baseDrop(b);
    const endType = (idx * 3 + (mode === 'coop' ? 1 : mode === 'party' ? 2 : 0)) % 4;
    if (endType === 0) { seg.trollDoor(b, { mode: 'run' }); return b.finish(0, 0); }
    if (endType === 1) { seg.trollDoor(b, { mode: 'sink' }); return b.finish(0, 0); }
    if (endType === 2) { seg.leapDoor(b, {}); return b.finish(0, 0); }
    seg.runKeyZone(b, { len: 1050 });
    seg.run(b, 520, { coins: [[260, -60]] });
    return b.finish(460, 56);
  }

  // Ghi đè toàn bộ danh sách màn chơi thành 100 màn cho mỗi chế độ:
  LEVELS.solo.length = 0;
  LEVELS.coop.length = 0;
  LEVELS.party.length = 0;
  for (let i = 0; i < 100; i++) {
    LEVELS.solo.push(() => { V11.ctx = { mode: 'solo', i }; try { return makeStage('solo', i); } finally { V11.ctx = null; } });
    LEVELS.coop.push(() => { V11.ctx = { mode: 'coop', i }; try { return makeStage('coop', i); } finally { V11.ctx = null; } });
    LEVELS.party.push(() => { V11.ctx = { mode: 'party', i }; try { return makeStage('party', i); } finally { V11.ctx = null; } });
  }
  delete LV_META.solo;
  delete LV_META.coop;
  delete LV_META.party;
  rebuildLevelSelect();
  resize();
})();
`;

code = code.slice(0, lastClose) + v12Payload + '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V12.5] Đã nâng cấp thành công public/game.js (300 màn chơi + Vật lý dây 2v2 + Bẫy ngầm)!');

// Tự động cập nhật style.css cho xoay ngang màn hình điện thoại
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

// Tự động tăng version trong index.html để trình duyệt xóa cache cũ ngay lập tức
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=12.5');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V12.5] Đã tự động cập nhật cache-busting game.js?v=12.5 trong index.html');
}
