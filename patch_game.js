/**
 * Script tự động nâng cấp & sửa lỗi cho Tether Bunnies (game.js & style.css)
 * Cách chạy: Mở terminal tại thư mục gốc và gõ: node patch_game.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const gamePath = fs.existsSync(path.join(__dirname, 'public', 'game.js'))
  ? path.join(__dirname, 'public', 'game.js')
  : path.join(__dirname, 'game.js');

const cssPath = fs.existsSync(path.join(__dirname, 'public', 'style.css'))
  ? path.join(__dirname, 'public', 'style.css')
  : path.join(__dirname, 'style.css');

let code = fs.readFileSync(gamePath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

function replaceMust(str, target, replacement, label) {
  if (!str.includes(target)) {
    console.warn('⚠️ Không tìm thấy đoạn cần thay (hoặc đã được vá trước đó): ' + label);
    return str;
  }
  console.log('✅ Đã cập nhật: ' + label);
  return str.replace(target, replacement);
}

// 1. Nâng cấp thông số dây lò xo (TETHER)
code = replaceMust(
  code,
  `const TETHER = 200;                // rope rest length (px)`,
  `const TETHER = 125;                // chiều dài dây nghỉ (px) - căng sớm trước khi chạm đáy vực
const TETHER_SPRING = 180;         // ngưỡng đàn hồi lò xo mạnh (px)
const TETHER_MAX = 230;            // giới hạn cứng tối đa - KHÔNG BAO GIỜ dãn quá mức này`,
  'Thông số dây lò xo (TETHER / TETHER_SPRING / TETHER_MAX)'
);

// 2. Kích hoạt v11Inject và đổi màu địa hình đa dạng trong LB.finish
code = replaceMust(
  code,
  `  finish(keyBack, keyUp) {
    // Checkpoint Sanitizer: eliminate flags placed within 650px of each other`,
  `  finish(keyBack, keyUp) {
    v11Inject(this, keyBack, keyUp);
    // Checkpoint Sanitizer: eliminate flags placed within 650px of each other`,
  'Kích hoạt v11Inject (bẫy Troll & địa hình mới) trong mọi màn chơi'
);

// 3. Làm mới toàn bộ cấu trúc các màn Co-op (Màn 9 - 25) để không bị lặp lại
code = replaceMust(
  code,
  `  for (let i = 8; i < 25; i++) {
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
  }`,
  `  for (let i = 8; i < 25; i++) {
    const meta = coopTitles[i - 8];
    const j = i - 8;
    C.push(() => {
      const b = new LB(meta[0], meta[1], meta[2], true);
      if (j === 12 || j === 15 || j === 16) seg.chaser(b, 118 + (j % 3) * 8, 4.5);
      seg.run(b, 620, { flag: true, coins: [[310, -60]] });
      if (j % 5 === 0) { seg.betray(b, {}); seg.stackWall(b); }
      else if (j % 5 === 1) { seg.compactor(b, 1300, { speed: 2.05 }); seg.coopDualHold(b, 480, { flag: true }); }
      else if (j % 5 === 2) { seg.ferry(b, 1650, { speed: 1.6 }); seg.fakePlates(b, 4 + (j % 2), { flag: true }); }
      else if (j % 5 === 3) { seg.avalancheHill(b, 175, { n: 2, period: 3.3 }); seg.rope(b, { key: false }); }
      else { seg.sawArena(b, 13, 3); seg.antiBaitSpikes(b, 720, { flag: true, coins: [[340, -90]] }); }

      baseDrop(b);
      if (j % 3 === 0) seg.hillChute(b, 150, { deg: 40 });
      else if (j % 3 === 1) seg.dropFloor(b, { pat: [1, 0, 1, 1, 0, 1] });
      else seg.bonkGap(b, 150, { lead: 320 });

      baseDrop(b);
      seg.coopDoor(b, { coins: [[250, -60]], flag: true });
      if (j % 2 === 0) seg.cave(b, 720, { ice: true, at: [180, 380, 560], flag: true });
      else seg.meteor(b, 820, { n: 2, period: 3.4, flag: true });

      baseDrop(b);
      if (j % 3 === 0) { seg.trollDoor(b, { mode: j % 2 ? 'run' : 'sink' }); return b.finish(0, 0); }
      if (j % 3 === 1) { seg.leapDoor(b, {}); return b.finish(0, 0); }
      seg.runKeyZone(b, { len: 1050 });
      seg.run(b, 650, { coins: [[320, -60]] });
      return b.finish(480, 56);
    });
  }`,
  'Thiết kế lại các màn Co-op (Màn 9 - 25) chống lặp cấu trúc'
);

// 4. Mở khóa toàn bộ 11 chủ đề bầu trời trong loadLevel & SKY_THEMES
code = replaceMust(
  code,
  `L.skyTheme = SKY_THEMES[(key + off) % 4];`,
  `L.skyTheme = SKY_THEMES[(key * 3 + off * 5) % SKY_THEMES.length];
    L.hue = (L.hue + key * 43 + off * 67) % 360;`,
  'Đa dạng hóa bầu trời và màu sắc địa hình cho từng màn'
);

code = replaceMust(
  code,
  `const SKY_THEMES = ['meadow', 'sunset', 'aurora', 'galaxy'];`,
  `const SKY_THEMES = ['meadow', 'sunset', 'aurora', 'galaxy', 'ember', 'frost', 'cosmic', 'sakura', 'ocean', 'storm', 'neon'];`,
  'Mở khóa đủ 11 bầu trời động (SKY_THEMES)'
);

// 5. Kích hoạt updateV11Trap trong updateTraps
code = replaceMust(
  code,
  `          if (t.empty > 1.0) trapSend(i, 'reset', 0);
          else if (tt >= t.dur) trapSend(i, 'done', 0);
        }
      }
    }
  }`,
  `          if (t.empty > 1.0) trapSend(i, 'reset', 0);
          else if (tt >= t.dur) trapSend(i, 'done', 0);
        }
      }
    } else if (t.k === 'ceil' || t.k === 'ferry' || t.k === 'door2' || t.k === 'betray') {
      updateV11Trap(t, i, me, bodies);
    }
  }`,
  'Kích hoạt updateV11Trap (Trần ép, Đá chở người, Cửa nhảy, Cầu phản bội)'
);

// 6. Sửa lỗi Map giật liên tục kèm theo âm thanh (updateWorld)
code = replaceMust(
  code,
  `  for (const p of L.plates) {
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
  }`,
  `  const camMidX = G.cam.x + (G.cam.vw || 800) / 2;
  const hearRange = (G.cam.vw || 800) * 0.78;
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
  }`,
  'Chống spam âm thanh nút bấm & cửa sắt (Debounce 0.25s + Khoanh vùng âm thanh)'
);

code = replaceMust(
  code,
  `  for (const c of L.crushers) {
    const prev = c.cb; c.cb = crusherBottom(c, G.lt);
    if (prev < c.downB - 2 && c.cb >= c.downB - 2) { Snd.slam(); G.shake = Math.max(G.shake, 6); puff(c.x + c.w / 2, c.downB, 8, '#cfd8dc', 1.4); }
  }`,
  `  for (const c of L.crushers) {
    const prev = c.cb; c.cb = crusherBottom(c, G.lt);
    if (prev !== undefined && prev < c.downB - 2 && c.cb >= c.downB - 2 && c.cb - prev < 40) {
      if (Math.abs(c.x + c.w / 2 - camMidX) < hearRange) {
        Snd.slam(); G.shake = Math.max(G.shake, 4.5); puff(c.x + c.w / 2, c.downB, 8, '#cfd8dc', 1.4);
      }
    }
  }`,
  'Sửa lỗi búa đập ở xa làm giật màn hình và phát tiếng liên tục'
);

// 7. Checkpoint xài chung nhưng 1 đứa chết là cả team hồi sinh tại Checkpoint đã chạm
code = replaceMust(
  code,
  `  netEv({ t: 'die', x: Math.round(P.x), y: Math.round(P.y) });
}`,
  `  netEv({ t: 'die', x: Math.round(P.x), y: Math.round(P.y), wipe: 1 });
  if (isNet()) {
    resetTraps(G.L);
    initV11Level(G.L);
    toast('💀 Bạn vừa tử nạn — Cả đội bị kéo về Checkpoint!');
  }
}`,
  'Gửi tín hiệu hồi sinh cả đội khi 1 người chết (die)'
);

code = replaceMust(
  code,
  `    case 'die':
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
      break;`,
  `    case 'die':
      if (e.lv === G.lvIdx) {
        const col = COLORS[(e.s | 0) % COLORS.length];
        sparkle(e.x + PW / 2, e.y + PH / 2, 18, 1.6, col);
        G.deaths++; setText('deaths', '💥 ' + G.deaths);
        Snd.die();
        if (e.wipe && G.me && !G.won) {
          const culprit = G.names[e.s] || 'Đồng đội';
          toast('💀 ' + culprit + ' vừa báo hại cả team! Hồi sinh tại Checkpoint!');
          G.shake = Math.max(G.shake, 6);
          resetTraps(G.L);
          initV11Level(G.L);
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
      break;`,
  'Xử lý hồi sinh toàn đội về Checkpoint chung & Làm mượt đồng bộ đồng hồ clk'
);

// 8. Thay thế cơ chế vật lý Dây lò xo (applyTether)
code = replaceMust(
  code,
  `function applyTether(P) {
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
}`,
  `function applyTether(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0 || (P.tetherGrace && P.tetherGrace > 0)) return;

  // Tính tỷ lệ cân bằng lực giữa số người đang bám trên bờ và số người đang rơi dưới vực
  let groundedWeight = P.onGround ? ((input.d || P.anch) ? 1.9 : 1.15) : 0;
  let fallingCount = P.onGround ? 0 : 1;
  for (const r of G.remotes.values()) {
    if (r.dead || (r.tetherGrace && r.tetherGrace > 0)) continue;
    if (r.onGround || r.anch) groundedWeight += r.anch ? 1.9 : 1.15;
    else fallingCount += 1;
  }
  const rescueRatio = groundedWeight / Math.max(1, fallingCount);

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
    const ax = P.x + PW / 2, ay = P.y + PH / 2;
    const bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay;
    const d = Math.hypot(dx, dy);
    if (d <= TETHER || d < 1) continue;

    const nx = dx / d, ny = dy / d;
    const stretch = d - TETHER;
    const partnerGrounded = !!(r.onGround || r.anch);
    const meGrounded = !!(P.onGround || input.d || P.anch);

    let pullScale = 1.0;
    if (meGrounded && !partnerGrounded) {
      if (input.d || P.anch) pullScale = 0.03;
      else if (rescueRatio >= 1.0) pullScale = 0.10 / rescueRatio;
      else pullScale = clamp(0.62 * (1.1 - rescueRatio), 0.16, 0.72);
    } else if (!meGrounded && partnerGrounded) {
      pullScale = clamp(1.4 * Math.sqrt(Math.max(0.6, rescueRatio)), 1.05, 2.5);
    } else {
      pullScale = 0.65;
    }

    // 1. Lực đàn hồi lò xo
    const kSpring = d > TETHER_SPRING ? 0.044 : 0.025;
    const springForce = Math.min(stretch * kSpring, 3.9) * pullScale;
    P.vx += nx * springForce;
    P.vy += ny * springForce * (ny < 0 ? 1.38 : 0.42);

    // 2. Lực tời nâng tự động khi đồng đội ở trên bờ cao hơn và chạy/nhảy kéo lên
    if (!meGrounded && partnerGrounded && dy < -32) {
      const lift = Math.min(GRAV * 1.38 * clamp(rescueRatio, 0.75, 1.85), 1.5);
      P.vy -= lift;
      if (Math.abs(r.tvx) > 1.1 || !r.onGround || d > TETHER_SPRING) {
        P.vy = Math.max(P.vy - 0.58 * clamp(rescueRatio, 0.8, 2.0), -10.8);
        P.vx += nx * 0.36;
      }
    }

    // 3. Khóa cứng độ dãn tối đa (Không bao giờ cho phép dãn vô hạn)
    if (d > TETHER_MAX && (!meGrounded || (!partnerGrounded && rescueRatio < 0.7))) {
      const over = (d - TETHER_MAX) * (meGrounded ? 0.22 : 0.88);
      const nextX = P.x + nx * over;
      const nextY = P.y + ny * over;
      if (nearSolids(nextX, P.y, PW, PH).length === 0) P.x = nextX;
      if (nearSolids(P.x, nextY, PW, PH).length === 0) P.y = nextY;

      const radVel = P.vx * nx + P.vy * ny;
      if (radVel < 0) {
        P.vx -= nx * radVel * 1.16;
        P.vy -= ny * radVel * 1.20;
      }
    }
  }
}`,
  'Cơ chế Dây lò xo đàn hồi + Cân bằng số người + Khóa độ dãn tối đa'
);

// 9. Bảo vệ người chơi đang treo dây trên hố sâu + Kích hoạt v11Hazard trong hazardCheck
code = replaceMust(
  code,
  `  for (const s of L.spikes) {
    if (s.hid) continue;
    let sy = s.dir === 'up' ? s.y + 7 : s.y, sh = s.h - 7;`,
  `  for (const s of L.spikes) {
    if (s.hid) continue;
    if (G.mode === 'coop' && s.y >= WORLD_H - 40 && !P.onGround) {
      let heldByTeam = false;
      for (const r of G.remotes.values()) {
        if (!r.dead && r.y < P.y - 55 && Math.hypot(r.x - P.x, r.y - P.y) <= TETHER_MAX + 35) {
          heldByTeam = true;
          P.y = Math.min(P.y, s.y - PH - 8);
          if (P.vy > 0) P.vy = -5.2;
          break;
        }
      }
      if (heldByTeam) continue;
    }
    let sy = s.dir === 'up' ? s.y + 7 : s.y, sh = s.h - 7;`,
  'Cứu người chơi treo dây trên hố gai để đồng đội kéo lên'
);

code = replaceMust(
  code,
  `  if (P.y > (L.h || WORLD_H) + 90) return 'fall';
  return null;
}`,
  `  const vh = v11Hazard(hx, hy, hw, hh);
  if (vh) return vh;
  if (P.y > (L.h || WORLD_H) + 90) return 'fall';
  return null;
}`,
  'Kích hoạt va chạm bẫy v11Hazard (Đá lăn dốc & Trần ép)'
);

// 10. Kích hoạt v11Ground (dốc trượt & đá chở người) trong stepPlayer
code = replaceMust(
  code,
  `    P.vy = P.vy > 0 ? 0 : (P.vy < 0 ? 0 : P.vy);
  }

  if ((G.mode === 'coop' || G.mode === 'party') && !P.onGround && P.vy >= 0) {`,
  `    P.vy = P.vy > 0 ? 0 : (P.vy < 0 ? 0 : P.vy);
  }
  v11Ground(P, feet0);
  if (P.fer !== null) {
    const fc = ferryCarry(P);
    P.x += fc;
    if (nearSolids(P.x, P.y, PW, PH).length) P.x -= fc;
  }

  if ((G.mode === 'coop' || G.mode === 'party') && !P.onGround && P.vy >= 0) {`,
  'Kích hoạt đứng trên dốc trượt (slopes) và đá lăn qua vực (ferry)'
);

// 11. Tự động xoay ngang màn hình cho mọi điện thoại
code = replaceMust(
  code,
  `function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cw = window.innerWidth; ch = window.innerHeight;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
}`,
  `let portraitRotated = false;
function tryLockLandscape() {
  if (!isTouchDevice) return;
  try {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
  } catch (e) {}
}
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const rawW = window.innerWidth, rawH = window.innerHeight;
  portraitRotated = isTouchDevice && rawH > rawW;
  document.body.classList.toggle('force-landscape', portraitRotated);
  cw = portraitRotated ? rawH : rawW;
  ch = portraitRotated ? rawW : rawH;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
}`,
  'Hàm tự động xoay ngang màn hình trên mọi điện thoại (resize & tryLockLandscape)'
);

code = replaceMust(
  code,
  `function beginGame(mode, idx) {
  G.mode = mode;`,
  `function beginGame(mode, idx) {
  tryLockLandscape();
  G.mode = mode;`,
  'Tự động khóa xoay ngang khi bắt đầu màn chơi trên điện thoại'
);

fs.writeFileSync(gamePath, code, 'utf8');

// 12. Bổ sung CSS force-landscape vào style.css
if (!css.includes('body.force-landscape')) {
  css += `\n/* Tự động xoay ngang toàn bộ giao diện trên điện thoại đang khóa chiều dọc */
body.force-landscape {
  position: fixed;
  top: 0;
  left: 100vw;
  width: 100vh !important;
  height: 100vw !important;
  transform: rotate(90deg);
  transform-origin: 0 0;
  overflow: hidden;
}
body.force-landscape #game,
body.force-landscape #lobby,
body.force-landscape .lp-wrap,
body.force-landscape .shop-modal,
body.force-landscape .sm-wrap {
  width: 100vh !important;
  height: 100vw !important;
}
body.force-landscape #hud,
body.force-landscape #touch {
  width: 100vh !important;
  height: auto !important;
}
`;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('✅ Đã thêm CSS tự động xoay ngang điện thoại vào style.css');
}

console.log('\n🎉 HOÀN TẤT! Toàn bộ bản vá đã được áp dụng vào game.js và style.css.');
