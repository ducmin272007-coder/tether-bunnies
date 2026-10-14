/**
 * Tether Bunnies v19.0 ANIME AWAKENING MASTER - PHẦN 1 / 3
 *  - Hệ thống Biến Hình Chủ Động & Tự Động (Phím F / Shift trên PC hoặc nút 🔥 AWAKEN trên Mobile)
 *  - Hệ thống Tự Động Ngắm Bắn 360 Độ (Auto-Aiming Projectile Engine): Kỹ năng tự khóa mục tiêu vào bẫy/quái
 *    đang tấn công hoặc nằm phía trước/trên đầu mà không cần người chơi phải nhảy lên!
 *  - Sửa triệt để lỗi Cửa Chạy (leapDoor / trollDoor) ở Màn 94 và lỗi Cờ/Đất ở Màn Đảo Chiều (Màn 97)
 *  - Điều chỉnh giá Vàng & Kim Cương đắt giá xứng tầm độ hiếm + Buff Nội Tại Vĩnh Viễn không chờ hồi chiêu!
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
code = code.replace(/const effTheme =/g, 'let effTheme =');

[
  '/* === TB_V12_5_MASTER_OVERRIDE === */',
  '/* === TB_V13_0_UNIVERSITY_EDITION === */',
  '/* === TB_V14_0_ULTIMATE_OVERRIDE === */',
  '/* === TB_V15_0_REMASTERED_EDITION === */',
  '/* === TB_V15_5_SANITIZED_EDITION === */',
  '/* === TB_V16_0_ULTIMATE_EDITION === */',
  '/* === TB_V16_5_FULL_MASTER_EDITION === */',
  '/* === TB_V17_0_SUPREME_MASTER_EDITION === */',
  '/* === TB_V17_5_SINGLE_MASTER === */',
  '/* === TB_V18_0_MODULAR_MASTER === */',
  '/* === TB_V18_5_ULTIMATE_MASTER === */',
  '/* === TB_V19_0_AWAKENING_MASTER === */',
].forEach((mk) => {
  if (code.includes(mk)) code = code.slice(0, code.indexOf(mk)) + '})();\n';
});

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); ở cuối game.js');
  process.exit(0);
}

const v19MasterPayload = `
/* === TB_V19_0_AWAKENING_MASTER === */
// ============================================================================
// 1. KIẾN TRÚC ĐĂNG KÝ TRANG PHỤC MÔ-ĐUN & TRẠNG THÁI BIẾN HÌNH (NORMAL <-> AWAKENED)
// ============================================================================
const CUSTOM_SKINS = new Map();

TIERS.transcendent = { label: 'VÔ HẠN ✦ ĐỘC TÔN (HIẾM NHẤT)' };
TIERS.supreme      = { label: 'SUPREME ★ ANIME THỨC TỈNH' };
TIERS.mythic       = { label: 'MYTHIC ✦ THẦN THOẠI' };

function TB_RegisterSkin(cfg) {
  if (!cfg || !cfg.id) return;
  SKINS[cfg.id] = {
    tier: cfg.tier || 'supreme',
    name: cfg.name || cfg.id,
    icon: cfg.icon || '✨',
    coins: cfg.coins || 0,
    dia: cfg.dia || 0,
    env: cfg.env || {
      name: 'Anime Realm',
      desc: '',
      sky: 'meadow',
      solidHue: 200,
      grassHue: 120,
      tint: 'rgba(0,0,0,0)',
      fx: 'sparks',
      rate: 18,
    },
    passive: cfg.passive || { id: cfg.id, name: cfg.name, desc: '' },
    trail: cfg.trail || ['#ffffff', '#ffd43b'],
  };
  if (cfg.pal) SKIN_PAL[cfg.id] = cfg.pal;
  CUSTOM_SKINS.set(cfg.id, cfg);
  if (cfg.passive && cfg.passive.id) {
    CUSTOM_SKINS.set('passive:' + cfg.passive.id, cfg);
  }
}
window.TB_RegisterSkin = TB_RegisterSkin;

// Trạng thái Thức Tỉnh (Awakened Form) và Danh sách Đạn Kỹ Năng Tự Ngắm (Auto-Aim Projectiles):
G.skillShots = [];
G.groundShockwaves = [];

function v19ToggleAwaken(manual) {
  const P = G.me;
  if (!P || P.dead || G.won) return;
  const skinId = Save.equipped();
  const cfg = CUSTOM_SKINS.get(skinId);
  if (!cfg) {
    if (manual) toast('⚠️ Trang phục hiện tại không có Dạng Thức Tỉnh Anime!');
    return;
  }
  P.awakened = !P.awakened;
  P.awakenAnimT = 0.85;
  Snd.key();
  G.shake = Math.max(G.shake, 7);
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  sparkle(cx, cy, 34, 2.3, (cfg.trail && cfg.trail[0]) || '#00f5d4');
  G.groundShockwaves.push({
    x: cx,
    y: P.y + PH,
    r: 12,
    maxR: 150,
    col: (cfg.trail && cfg.trail[0]) || '#38bdf8',
    life: 0.45,
  });
  if (P.awakened) {
    toast('🔥 THỨC TỈNH: ' + (cfg.awakenedTitle || cfg.name.toUpperCase()) + '!');
    if (typeof cfg.onAwaken === 'function') cfg.onAwaken(P, G.L);
  } else {
    toast('✨ Đã thu hồi Hào Quang về Dạng Thường.');
  }
}

// Gắn phím F và phím Shift để Chuyển Đổi Trạng Thái (Normal <-> Awakened) + Phím Q/E kích hoạt tuyệt kỹ:
window.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (!G.inGame || !G.me || e.repeat) return;
  if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    v19ToggleAwaken(true);
  }
});

// ============================================================================
// 2. HỆ THỐNG TỰ ĐỘNG NGẮM BẮN 360 ĐỘ (AUTO-AIMING PROJECTILE & THREAT ENGINE)
//    Tự động dò tìm bẫy đang lao tới hoặc bẫy phía trước/trên đầu để bắn hạ!
// ============================================================================
function v19FindNearestThreat(P, L, maxRange) {
  if (!P || !L) return null;
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  const face = P.face >= 0 ? 1 : -1;
  let best = null;
  let bestScore = maxRange || 460;

  const consider = (tx, ty, kind, ref, idx, priorityBonus) => {
    const dx = tx - cx;
    const dy = ty - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > (maxRange || 460)) return;
    // Ưu tiên mục tiêu đang ở phía trước mặt hoặc đang rơi từ trên đầu xuống
    const inFront = dx * face >= -60 || dy < -30;
    const score = dist * (inFront ? 0.72 : 1.25) - (priorityBonus || 0);
    if (score < bestScore) {
      bestScore = score;
      best = { x: tx, y: ty, kind, ref, idx, dist };
    }
  };

  // 1. Thạch nhũ trên trần (đang rơi hoặc sắp rơi phía trước):
  (L.stalactites || []).forEach((q, idx) => {
    if (q.st < 3) {
      consider(q.x + q.w / 2, q.y + (q.fy || 0) + q.h / 2, 'stalactite', q, idx, q.st === 2 ? 160 : 50);
    }
  });
  // 2. Đá lăn (Boulders) & Đá dốc (Rocks):
  (L.boulders || []).forEach((b, idx) => {
    consider(b.cx, b.y - b.r, 'boulder', b, idx, 110);
  });
  // 3. Cá Mập Megalodon:
  (L.sharks || []).forEach((sh, idx) => {
    consider(sh.cx, sh.cy, 'shark', sh, idx, 130);
  });
  // 4. Trụ Laser xoay & Pháo đài bắn tỉa (Turrets) & Rìu lắc lư (Pendulums):
  (L.lasers || []).forEach((ls, idx) => {
    consider(ls.x, ls.y, 'laser', ls, idx, 100);
  });
  (L.turrets || []).forEach((trt, idx) => {
    consider(trt.x, trt.y, 'turret', trt, idx, 120);
  });
  (L.pendulums || []).forEach((pd, idx) => {
    const th = Math.sin(G.lt * pd.spd + pd.off) * 1.05;
    consider(pd.x + Math.sin(th) * pd.len, pd.y + Math.cos(th) * pd.len, 'pendulum', pd, idx, 85);
  });
  // 5. Thực thể Quỷ Dị (Doppelgängers, Weeping Ghosts, Acid Globs, Mimic Coins):
  if (L.anomalies) {
    (L.anomalies.doppels || []).forEach((dp, idx) => {
      consider(dp.x + PW / 2, dp.y + PH / 2, 'doppel', dp, idx, 180);
    });
    (L.anomalies.ghosts || []).forEach((gh, idx) => {
      consider(gh.x, gh.y, 'ghost', gh, idx, 150);
    });
    (L.anomalies.spitters || []).forEach((sp, idx) => {
      if (sp.glob) consider(sp.glob.x, sp.glob.y, 'glob', sp, idx, 190);
      else consider(sp.x, sp.y, 'spitter', sp, idx, 70);
    });
  }
  (L.coins || []).forEach((c, idx) => {
    if (!c.got && c.anomaly === 1 && c.trig) {
      consider(c.x, c.y, 'mimic_coin', c, idx, 175);
    }
  });

  return best;
}

function v19DestroyThreat(L, target) {
  if (!L || !target) return;
  const { x, y, kind, ref } = target;
  sparkle(x, y, 22, 1.9, '#ffd43b');
  puff(x, y, 10, '#ffffff', 1.5);
  if (kind === 'stalactite') {
    const idx = (L.stalactites || []).indexOf(ref);
    if (idx >= 0) L.stalactites.splice(idx, 1);
  } else if (kind === 'boulder') {
    const idx = (L.boulders || []).indexOf(ref);
    if (idx >= 0) L.boulders.splice(idx, 1);
  } else if (kind === 'shark') {
    const idx = (L.sharks || []).indexOf(ref);
    if (idx >= 0) L.sharks.splice(idx, 1);
  } else if (kind === 'laser') {
    const idx = (L.lasers || []).indexOf(ref);
    if (idx >= 0) L.lasers.splice(idx, 1);
  } else if (kind === 'turret') {
    const idx = (L.turrets || []).indexOf(ref);
    if (idx >= 0) L.turrets.splice(idx, 1);
  } else if (kind === 'pendulum') {
    const idx = (L.pendulums || []).indexOf(ref);
    if (idx >= 0) L.pendulums.splice(idx, 1);
  } else if (kind === 'doppel' && L.anomalies) {
    G.cursedConsumed.add(ref.id);
    const idx = L.anomalies.doppels.indexOf(ref);
    if (idx >= 0) L.anomalies.doppels.splice(idx, 1);
  } else if (kind === 'ghost' && L.anomalies) {
    G.cursedConsumed.add(ref.id);
    const idx = L.anomalies.ghosts.indexOf(ref);
    if (idx >= 0) L.anomalies.ghosts.splice(idx, 1);
  } else if (kind === 'glob') {
    ref.glob = null;
  } else if (kind === 'spitter' && L.anomalies) {
    const idx = L.anomalies.spitters.indexOf(ref);
    if (idx >= 0) L.anomalies.spitters.splice(idx, 1);
  } else if (kind === 'mimic_coin') {
    G.cursedConsumed.add(ref.cid);
    ref.anomaly = 0;
    ref.trig = false;
  }
}

// Bắn đạn kỹ năng tự động khóa mục tiêu (Homing / Auto-Aiming Projectile):
function v19FireAutoAimSkill(P, L, style, manual) {
  if (!P || !L) return;
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  const face = P.face >= 0 ? 1 : -1;
  const threat = v19FindNearestThreat(P, L, 480);
  if (!threat && !manual) return;

  let tx = cx + face * 320;
  let ty = cy;
  if (threat) {
    tx = threat.x;
    ty = threat.y;
    P.face = tx >= cx ? 1 : -1;
  }
  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const spd = style.speed || 13.5;

  G.skillShots.push({
    x: cx + (dx / dist) * 20,
    y: cy + (dy / dist) * 14,
    vx: (dx / dist) * spd,
    vy: (dy / dist) * spd,
    spd,
    r: style.r || 24,
    col1: style.col1 || '#c084fc',
    col2: style.col2 || '#7e22ce',
    kind: style.kind || 'orb',
    target: threat,
    life: style.life || 1.35,
  });
}

function v19UpdateSkillShots(L) {
  for (let i = G.skillShots.length - 1; i >= 0; i--) {
    const s = G.skillShots[i];
    s.life -= STEP;
    // Tự động bẻ lái đuổi theo mục tiêu (Homing Tracking):
    if (s.target && s.target.ref) {
      let tx = s.target.x;
      let ty = s.target.y;
      if (s.target.kind === 'boulder' || s.target.kind === 'shark') {
        tx = s.target.ref.cx || tx;
        ty = s.target.ref.cy || s.target.ref.y - s.target.ref.r || ty;
      } else if (s.target.kind === 'stalactite') {
        tx = s.target.ref.x + s.target.ref.w / 2;
        ty = s.target.ref.y + (s.target.ref.fy || 0) + s.target.ref.h / 2;
      }
      const dx = tx - s.x;
      const dy = ty - s.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      s.vx = lerp(s.vx, (dx / d) * s.spd, 0.28);
      s.vy = lerp(s.vy, (dy / d) * s.spd, 0.28);
      if (d < s.r + 22) {
        v19DestroyThreat(L, s.target);
        s.target = null;
        if (s.kind !== 'pierce') {
          G.skillShots.splice(i, 1);
          continue;
        }
      }
    }
    s.x += s.vx;
    s.y += s.vy;
    if (Math.random() < 0.65) {
      sparkle(s.x + rnd(-12, 12), s.y + rnd(-12, 12), 1, 0.9, s.col1);
    }

    // Quét va chạm trên đường đạn bay (xóa sổ mọi bẫy đạn chạm phải):
    const hitThreat = v19FindNearestThreat({ x: s.x - PW / 2, y: s.y - PH / 2, face: 1 }, L, s.r + 36);
    if (hitThreat && hitThreat.dist <= s.r + 32) {
      v19DestroyThreat(L, hitThreat);
      if (s.kind !== 'pierce') {
        G.skillShots.splice(i, 1);
        continue;
      }
    }
    if (s.life <= 0) G.skillShots.splice(i, 1);
  }

  for (let i = G.groundShockwaves.length - 1; i >= 0; i--) {
    const sw = G.groundShockwaves[i];
    sw.life -= STEP;
    sw.r = lerp(sw.r, sw.maxR, 0.22);
    if (sw.life <= 0) G.groundShockwaves.splice(i, 1);
  }
}

function v19DrawSkillShots(ctx) {
  const T = G.lt;
  // Vẽ Sóng Xung Kích mặt đất (Ground Crater Shockwaves):
  for (const sw of G.groundShockwaves) {
    ctx.save();
    ctx.globalAlpha = clamp(sw.life * 2.2, 0, 1);
    ctx.strokeStyle = sw.col;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(sw.x, sw.y, sw.r, sw.r * 0.28, 0, 0, 6.3);
    ctx.stroke();
    ctx.restore();
  }

  // Vẽ Đạn Tuyệt Kỹ Anime (Hư Thức: Tử, Kamehameha, Rasenshuriken, Sấm Sét 100.000V, Nắm Đấm Nghiêm Túc):
  for (const s of G.skillShots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.kind === 'rasen') {
      ctx.rotate(T * 28);
      ctx.fillStyle = 'rgba(224,242,254,.85)';
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.rotate((k * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(s.r * 0.8, -s.r * 0.5, s.r * 1.4, 0);
        ctx.quadraticCurveTo(s.r * 0.8, s.r * 0.5, 0, 0);
        ctx.fill();
        ctx.restore();
      }
    } else if (s.kind === 'thunder') {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -260);
      ctx.lineTo(-14, -140);
      ctx.lineTo(12, -80);
      ctx.lineTo(0, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (s.kind === 'punch') {
      const ang = Math.atan2(s.vy, s.vx);
      ctx.rotate(ang);
      ctx.strokeStyle = s.col1;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, s.r, -1.1, 1.1);
      ctx.stroke();
    }
    const rg = ctx.createRadialGradient(0, 0, 3, 0, 0, s.r * 1.35);
    rg.addColorStop(0, '#ffffff');
    rg.addColorStop(0.4, s.col1);
    rg.addColorStop(0.8, s.col2);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, s.r * 1.35, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// 3. KẾT NỐI MẠNG 30HZ & CHỐNG NHÂN ĐÔI NHÂN VẬT KHI ĐỔI MẠNG
// ============================================================================
const V18_CID = (() => {
  let id = '';
  try {
    id = sessionStorage.getItem('tb_cid') || localStorage.getItem('tb_cid') || '';
  } catch (e) {}
  if (!id) {
    id = 'c_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
    try {
      sessionStorage.setItem('tb_cid', id);
      localStorage.setItem('tb_cid', id);
    } catch (e) {}
  }
  return id;
})();

function ensureSocket() {
  if (socket) return socket;
  if (typeof io !== 'function') return null;
  socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 350,
  });
  socket.on('roster', onRoster);
  socket.on('ps', onPositions);
  socket.on('ev', onNetEv);
  socket.on('disconnect', () => {
    if (G.inGame && isNet()) {
      netLost = true;
      toast('⚡ Mất kết nối — Đang tự nối lại…');
    }
  });
  socket.on('connect', () => {
    if (!(netLost && G.inGame && isNet())) return;
    socket.emit(
      'join',
      { code: G.code, name: G.myName, skin: Save.equipped(), cid: V18_CID },
      (res) => {
        if (res && res.ok) {
          netLost = false;
          if (G.myslot !== res.slot) G.remotes.delete(res.slot);
          G.myslot = res.slot;
          if (G.me) G.me.slot = res.slot;
          G.names[res.slot] = G.myName;
          G.hostSlot = res.host !== undefined ? res.host : res.slot;
          toast('✅ Đã kết nối lại!');
        } else {
          toast('Phòng đã đóng.');
          setTimeout(() => {
            location.href = location.pathname;
          }, 1500);
        }
      }
    );
  });
  return socket;
}

function doCreate() {
  Snd.init();
  const s = ensureSocket();
  if (!s) {
    setMsg('Cannot reach the game server.');
    return;
  }
  setMsg('Creating room…');
  s.emit(
    'create',
    {
      name: myNameValue(),
      skin: Save.equipped(),
      mode: G.lobbyMode === 'party' ? 'party' : 'coop',
      cid: V18_CID,
    },
    (res) => {
      if (!res || !res.ok) {
        setMsg((res && res.error) || 'Could not create room.');
        return;
      }
      enterCoop(res, true);
    }
  );
}

function doJoin(codeArg) {
  Snd.init();
  const code = String(codeArg || ($('codeInput') && $('codeInput').value) || '')
    .trim()
    .toUpperCase();
  if (code.length !== 4) {
    setMsg('Enter the 4-letter room code.');
    return;
  }
  const s = ensureSocket();
  if (!s) {
    setMsg('Cannot reach the game server.');
    return;
  }
  setMsg('Joining…');
  s.emit(
    'join',
    { code, name: myNameValue(), skin: Save.equipped(), cid: V18_CID },
    (res) => {
      if (!res || !res.ok) {
        setMsg((res && res.error) || 'Could not join.');
        return;
      }
      enterCoop(res, false);
    }
  );
}
if ($('createBtn')) $('createBtn').onclick = doCreate;
if ($('joinBtn')) $('joinBtn').onclick = () => doJoin();

function stepRemotes() {
  const now = nowMs();
  const k = 1 - Math.exp(-STEP * 28);
  const gEff =
    G.L && G.L.biome === 'water'
      ? GRAV * 0.25
      : G.L && G.L.biome === 'space'
      ? GRAV * 0.35
      : GRAV;
  for (const r of G.remotes.values()) {
    const age = Math.min(0.085, Math.max(0, (now - r.recv) / 1000));
    const ticks = age * 60;
    const ex = r.tx + r.tvx * ticks;
    const ey = r.onGround
      ? r.ty
      : r.ty + clamp(r.tvy * ticks + 0.5 * gEff * ticks * ticks, -42, 42);
    const px = r.x;
    const py = r.y;
    r.px = r.x;
    r.py = r.y;
    if (Math.abs(ex - r.x) > 300 || Math.abs(ey - r.y) > 300) {
      r.x = ex;
      r.y = ey;
    } else {
      r.x += (ex - r.x) * k;
      r.y += (ey - r.y) * k;
    }
    r.dx = r.x - px;
    r.dy = r.y - py;
    springEars(r, r.tvx, r.tvy, r.face);
    if (r.onGround && Math.abs(r.dx) > 2.4 && Math.random() < 0.3) {
      puff(r.x + PW / 2 - r.face * 9, r.y + PH, 1, '#e8e0d8', 0.5);
    }
    r.runT += Math.abs(r.dx) * 0.06;
    r.sq *= 0.85;
  }
}

// ============================================================================
// 4. CỬA HÀNG CAO CẤP + CỜ MỞ ĐƯỜNG QUA VỰC (#6) + NÚT BIẾN HÌNH TRÊN ĐIỆN THOẠI
// ============================================================================
SKY_CFG.toxic = {
  stops: [
    [0, '#071c15'],
    [0.5, '#1b4332'],
    [1, '#52b788'],
  ],
  hills: ['#2d6a4f', '#1b4332', '#081c15'],
  mote: 'rgba(180,255,120,.75)',
};
SKY_CFG.heaven = {
  stops: [
    [0, '#38bdf8'],
    [0.45, '#bae6fd'],
    [0.8, '#fef9c3'],
    [1, '#ffffff'],
  ],
  hills: ['#fde68a', '#fef08a', '#ffffff'],
  mote: 'rgba(255,235,130,.9)',
};
SKY_CFG.hell = {
  stops: [
    [0, '#090202'],
    [0.4, '#450a0a'],
    [0.75, '#991b1b'],
    [1, '#f97316'],
  ],
  hills: ['#450a0a', '#2a0505', '#140202'],
  mote: 'rgba(255,100,20,.85)',
};
SKY_LEGEND.toxic = 1;
SKY_LEGEND.heaven = 1;
SKY_LEGEND.hell = 1;

effTheme = function (L) {
  if (
    L &&
    L.skyTheme &&
    (L.biome === 'water' ||
      L.biome === 'toxic' ||
      L.biome === 'ice' ||
      L.biome === 'space' ||
      L.biome === 'heaven' ||
      L.biome === 'hell')
  ) {
    return L.skyTheme;
  }
  return (L && L.skyTheme) || (curEnv && curEnv.sky) || 'meadow';
};

BUFFS.warpflag = {
  name: 'Cờ Mở Đường (Skip Obstacle)',
  icon: '🚩',
  price: 25,
  desc: 'Tự động đặt Checkpoint ở ĐẤT LIỀN CỐ ĐỊNH PHÍA SAU VỰC / VÁN TRƯỢT và dịch chuyển cả đội qua thẳng chướng ngại vật!',
};
if (!BUFF_IDS.includes('warpflag')) BUFF_IDS.push('warpflag');
BUFF_KEYS.Digit6 = 'warpflag';
BUFF_KEYS.Numpad6 = 'warpflag';

(function addWarpAndAwakenButtons() {
  const tb = $('tBuffs');
  if (tb && !$('tb_warpflag')) {
    const b = document.createElement('button');
    b.id = 'tb_warpflag';
    b.className = 'tbtn tbf hidden';
    b.dataset.buff = 'warpflag';
    b.title = 'Dịch chuyển cả đội qua bờ bên kia chướng ngại vật';
    b.innerHTML = '🚩';
    tb.appendChild(b);
  }
  const host = document.querySelector('#touch .touch-actions') || $('touch');
  if (host && !$('awakenBtn')) {
    const aw = document.createElement('button');
    aw.id = 'awakenBtn';
    aw.className = 'tbtn radar-btn';
    aw.style.background = 'linear-gradient(135deg,#ff0055,#7209b7)';
    aw.style.color = '#fff';
    aw.textContent = '🔥';
    aw.title = 'Biến Hình Thức Tỉnh Anime (PC: Phím F hoặc Shift)';
    aw.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Snd.init();
      v19ToggleAwaken(true);
    }, { passive: false });
    aw.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Snd.init();
      v19ToggleAwaken(true);
    });
    host.appendChild(aw);
  }
})();

function v18FindForwardMainlandSpot(P, L) {
  const isRev = !!(L.name && L.name.indexOf('ĐẢO CHIỀU') >= 0);
  const dir = isRev ? -1 : 1;
  const cx = P.x + PW / 2;
  const forbiddenSolids = new Set();
  for (const t of L.traps || []) {
    if (t.si !== undefined) forbiddenSolids.add(t.si);
    if (dir > 0 && t.k === 'sled' && cx >= t.x0 - 380 && cx <= t.x1 + 80) {
      return {
        x: Math.round(clamp(t.x1 + 190, 80, L.w - PW - 80)),
        y: Math.round(t.y - PH + 4),
      };
    }
    if (dir > 0 && t.k === 'ferry' && cx >= t.cs - 380 && cx <= t.ce + 80) {
      return {
        x: Math.round(clamp(t.ce + 140, 80, L.w - PW - 80)),
        y: Math.round(t.gy - PH),
      };
    }
  }
  for (const ph of L.phantoms || []) {
    if (ph.si !== undefined) forbiddenSolids.add(ph.si);
  }

  let best = null;
  let bestScore = 1e9;
  for (let i = 0; i < (L.solids || []).length; i++) {
    if (forbiddenSolids.has(i)) continue;
    const s = L.solids[i];
    if (
      s.bonk ||
      s.isVehicle ||
      s[3] < 90 ||
      s[2] < 180 ||
      s[1] > (L.h || WORLD_H) - 35 ||
      s[1] < 80
    ) {
      continue;
    }
    if (s[3] > 500 && s[2] < 60) continue;
    const targetX =
      dir > 0
        ? clamp(Math.max(cx + 320, s[0] + 110), s[0] + 50, s[0] + s[2] - PW - 50)
        : clamp(Math.min(cx - 320, s[0] + s[2] - 110), s[0] + 50, s[0] + s[2] - PW - 50);
    const ahead = (targetX - cx) * dir;
    if (ahead < 160 || ahead > 1950) continue;
    const ty = s[1] - PH;
    const hitSpk = (L.spikes || []).some(
      (sp) =>
        !sp.hid &&
        !sp.swimPit &&
        rectsOverlap(targetX - 16, ty - 12, PW + 32, PH + 20, sp.x, sp.y, sp.w, sp.h)
    );
    if (hitSpk) continue;
    const score = Math.abs(ahead - 460) + Math.abs(ty - P.y) * 0.3;
    if (score < bestScore) {
      bestScore = score;
      best = { x: Math.round(targetX), y: Math.round(ty) };
    }
  }
  if (!best) {
    best = {
      x: clamp(Math.round(P.x + dir * 340), 80, L.w - PW - 80),
      y: Math.round(GY - PH),
    };
  }
  return best;
}

function useBuff(which) {
  const P = G.me;
  const L = G.L;
  if (!P || P.dead || G.won || !L) return;
  if (!P.timed) P.timed = { speed: 0, magnet: 0, jumpboost: 0 };
  const free = Role.admin;
  const have = (id) => free || Save.buff(id) > 0;
  const spend = (id) => {
    if (!free) Save.useBuff(id);
  };

  if (which === 'warpflag') {
    if (!have('warpflag')) {
      toast('Hết Cờ Mở Đường 🚩 — Mua ×10 / ×100 trong 🛍️ Shop!');
      return;
    }
    spend('warpflag');
    const spot = v18FindForwardMainlandSpot(P, L);
    P.x = spot.x;
    P.y = spot.y;
    P.vx = 0;
    P.vy = 0;
    P.rope = null;
    P.cp = { x: spot.x, y: spot.y };
    P.inv = Math.max(P.inv, 2.2);
    if (L.flags) L.flags.push({ x: spot.x + PW / 2, y: spot.y + PH, on: true });
    G.cam.snap = true;
    Snd.cp();
    sparkle(spot.x + PW / 2, spot.y + PH / 2, 28, 1.9, '#00ffe0');
    toast('🚩 Đã cắm Cờ ở đất liền phía trước & Dịch chuyển toàn đội qua chướng ngại vật!');
    if (isNet()) netEv({ t: 'cp', x: spot.x, y: spot.y, fi: -1, s: P.slot, pull: 1 });
    refreshBuffUI();
    return;
  }

  const customCfg = CUSTOM_SKINS.get(Save.equipped());
  if (!which && customCfg && typeof customCfg.onActiveSkill === 'function') {
    customCfg.onActiveSkill(P, L);
    return;
  }

  if (!which) {
    if (!P.shield && have('shield')) which = 'shield';
    else if (!P.dj && have('doublejump')) which = 'doublejump';
    else if (have('warpflag')) {
      useBuff('warpflag');
      return;
    } else {
      if (!P.shield && !P.dj) toast('Chưa có thuốc — Mua thêm trong 🛍️ Shop!');
      refreshBuffUI();
      return;
    }
  }
  const b = BUFFS[which];
  if (!b) return;
  if (which === 'shield') {
    if (!P.shield && have('shield')) {
      spend('shield');
      P.shield = true;
      toast('🛡️ Bubble Shield ON!');
      Snd.pop();
    }
  } else if (which === 'doublejump') {
    if (!P.dj && have('doublejump')) {
      spend('doublejump');
      P.dj = true;
      P.djT = DJ_SECONDS;
      P.usedDJ = false;
      toast('🦘 Double Jump ON!');
      Snd.djump();
    }
  } else if (P.timed[which] <= 0 && have(which)) {
    spend(which);
    P.timed[which] = free ? 9999 : b.dur;
    toast(b.icon + ' ' + b.name + ' ON!');
    Snd.djump();
  }
  refreshBuffUI();
}

renderShop = function () {
  const m = $('shopModal');
  const card = m && m.querySelector('.shop-card');
  if (!card) return;
  const eq = Save.equipped();
  let h =
    '<div class="shop-header"><div class="shop-title">🥕 BUNNY BOUTIQUE</div>' +
    '<div class="shop-balance">🪙 <span id="shopCoins">0</span></div>' +
    '<div class="shop-balance dia">💎 <span id="shopDiamonds">0</span></div>' +
    '<button class="shop-close" data-act="close" title="Close Shop">&times;</button></div>';
  h +=
    '<div class="shop-xchg"><span>💱 Đổi Xu → Kim Cương:</span>' +
    '<button class="skin-btn" data-act="xchg" data-n="1">🪙 ' +
    DIA_RATE +
    ' → 💎 1</button>' +
    '<button class="skin-btn" data-act="xchg" data-n="10">🪙 ' +
    DIA_RATE * 10 +
    ' → 💎 10</button>' +
    '<button class="skin-btn" data-act="xchg" data-n="50">🪙 ' +
    DIA_RATE * 50 +
    ' → 💎 50</button></div>';
  ['transcendent', 'supreme', 'mythic', 'legendary', 'rare', 'common'].forEach((t) => {
    const ids = Object.keys(SKINS).filter((id) => SKINS[id].tier === t);
    if (!TIERS[t] || !ids.length) return;
    h +=
      '<div class="shop-section-title tier-' +
      t +
      '">' +
      TIERS[t].label +
      ' SKINS</div><div class="shop-grid">';
    ids.forEach((id) => {
      const d = SKINS[id];
      const owned = Save.hasSkin(id);
      const on = owned && eq === id;
      h +=
        '<div class="shop-item tier-' +
        t +
        '" data-skin="' +
        id +
        '"><div class="tier-tag">' +
        TIERS[t].label +
        '</div>' +
        '<div class="skin-preview preview-' +
        id +
        '">' +
        d.icon +
        '</div>' +
        '<div class="skin-name">' +
        d.name +
        '</div>' +
        (d.passive
          ? '<div class="skin-desc"><b>✨ ' +
            d.passive.name +
            ':</b> ' +
            d.passive.desc +
            '</div>'
          : '') +
        '<div class="skin-price">' +
        (owned ? 'OWNED' : priceText(d)) +
        '</div>' +
        '<button class="skin-btn' +
        (on ? ' equipped' : '') +
        '" data-act="skin" data-id="' +
        id +
        '">' +
        (!owned ? 'Buy' : on ? 'Equipped' : 'Equip') +
        '</button></div>';
    });
    h += '</div>';
  });
  h +=
    '<div class="shop-section-title">POTIONS &amp; BUFFS <span class="tiny">· Mua nhanh ×1 / ×10 / ×100 (Phím 1–6)</span></div><div class="shop-grid buffs-grid">';
  Object.keys(BUFFS).forEach((id) => {
    const b = BUFFS[id];
    h +=
      '<div class="shop-item buff-item"><div class="skin-preview">' +
      b.icon +
      '</div><div class="skin-name">' +
      b.name +
      '</div>' +
      '<div class="skin-desc">' +
      b.desc +
      '</div>' +
      '<div class="skin-price">🪙 ' +
      b.price +
      ' / cái · Kho: <b>' +
      (Role.admin ? '∞' : Save.buff(id)) +
      '</b></div>' +
      '<div style="display:flex;gap:5px;width:100%">' +
      '<button class="skin-btn" data-act="buff" data-id="' +
      id +
      '" data-qty="1">+1</button>' +
      '<button class="skin-btn" data-act="buff" data-id="' +
      id +
      '" data-qty="10">+10</button>' +
      '<button class="skin-btn" data-act="buff" data-id="' +
      id +
      '" data-qty="100">+100</button>' +
      '</div></div>';
  });
  h +=
    '</div><div class="shop-foot">Phím tắt: <b>F / Shift / 🔥</b> = Biến Hình Thức Tỉnh Anime · <b>E</b> = Phóng Tuyệt Kỹ · <b>1–6</b> = Dùng Buff.</div>';
  card.innerHTML = h;
  refreshCoinUI();
};

buyBuff = function (id, qty) {
  const b = BUFFS[id];
  if (!b) return;
  const n = Math.max(1, parseInt(qty, 10) || 1);
  if (Role.admin) {
    Save.addBuff(id, n);
    toast('🛠 Admin: Đã cộng +' + n + ' ' + b.name);
    refreshShopUI();
    return;
  }
  const totalCost = b.price * n;
  if (Save.coins() < totalCost) {
    const maxCanBuy = Math.floor(Save.coins() / b.price);
    if (maxCanBuy <= 0) {
      toast('Không đủ xu! Cần ' + b.price + ' 🪙');
      return;
    }
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
  sm.addEventListener(
    'click',
    (e) => {
      const b = e.target.closest ? e.target.closest('[data-act="buff"][data-qty]') : null;
      if (!b) return;
      e.stopImmediatePropagation();
      Snd.init();
      buyBuff(b.dataset.id, parseInt(b.dataset.qty, 10) || 1);
    },
    true
  );
})();
// === KẾT THÚC PHẦN 1 / 3 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 2 / 3 DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 2 / 3 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 1 / 3 ===

// ============================================================================
// 5. BỘ VẼ CHIBI ANIME ĐỘ PHÂN GIẢI CAO (CHUẨN TỈ LỆ 2 ẢNH MẪU: THƯỜNG & THỨC TỈNH)
// ============================================================================
function drawChibiProportions(ctx, bob, ph, run, air, T, cfg) {
  const fo = run ? Math.sin(ph) * 5.2 : 0;
  const fy = air ? -3.5 : -1.2;
  const breath = Math.sin(T * 4.5) * 0.6;

  // 1. Đôi giày / dép Chibi
  ctx.fillStyle = cfg.shoe || '#0f172a';
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-6 + fo, fy, 5.8, 3.3, 0, 0, 6.3);
  ctx.ellipse(6 - fo, fy, 5.8, 3.3, 0, 0, 6.3);
  ctx.fill();
  ctx.stroke();

  // 2. Quần nhân vật
  ctx.fillStyle = cfg.pants || '#1e293b';
  rr(-11.5, -13.5 + bob, 23, 12 - bob * 0.3, 5.5);
  ctx.fill();
  ctx.stroke();

  // 3. Thân áo (Có đổ bóng 3D & hiệu ứng thở nhẹ)
  const bg = ctx.createLinearGradient(0, -27 + bob, 0, -11 + bob);
  bg.addColorStop(0, cfg.shirtHi || cfg.shirt || '#334155');
  bg.addColorStop(1, cfg.shirt || '#1e293b');
  ctx.fillStyle = bg;
  rr(-12.5, -26.5 + bob + breath * 0.4, 25, 14.5, 6.5);
  ctx.fill();
  ctx.stroke();

  // 4. Đai lưng (nếu có)
  if (cfg.belt) {
    ctx.fillStyle = cfg.belt;
    ctx.fillRect(-12, -14.5 + bob, 24, 3.4);
  }
}

function drawChibiFace(ctx, bob, T, cfg) {
  const breath = Math.sin(T * 4.5) * 0.5;
  const hy = -44.5 + bob + breath;

  // Đầu Chibi to tròn cân đối với má phúng phính (Tỉ lệ chuẩn ảnh mẫu)
  const fg = ctx.createRadialGradient(-3, hy + 7, 2, 0, hy + 10, 18);
  fg.addColorStop(0, cfg.skinHi || '#fff5eb');
  fg.addColorStop(1, cfg.skin || '#ffe0c8');
  ctx.fillStyle = fg;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.2;
  rr(-14.5, hy, 29, 21, 10.5);
  ctx.fill();
  ctx.stroke();

  // Hai tai người nhỏ xinh hai bên thái dương
  ctx.fillStyle = cfg.skin || '#ffe0c8';
  ctx.beginPath();
  ctx.arc(-14.5, hy + 11.5, 3.2, 0, 6.3);
  ctx.arc(14.5, hy + 11.5, 3.2, 0, 6.3);
  ctx.fill();
  ctx.stroke();

  if (cfg.baldFacial) {
    // KHUÔN MẶT SAITAMA: Dạng thường (Mắt chấm tròn ngơ ngác) vs Dạng Nghiêm Túc (Mắt trắng sắc lạnh!)
    if (!cfg.awakened) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(1.5, hy + 10.5, 1.9, 0, 6.3);
      ctx.arc(9.5, hy + 10.5, 1.9, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(1.5, hy + 7, 2.5, 3.4, 6.0);
      ctx.moveTo(7.5, hy + 7);
      ctx.arc(9.5, hy + 7, 2.5, 3.4, 6.0);
      ctx.moveTo(4, hy + 15.5);
      ctx.lineTo(7.5, hy + 15.5);
      ctx.stroke();
    } else {
      // Khuôn mặt Serious Mode (Ảnh 4): Lông mày nhíu chặt, mắt sắc trắng rực, gân trán & đường đổ bóng sống mũi!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, hy + 9.5);
      ctx.lineTo(4.5, hy + 11);
      ctx.lineTo(4, hy + 13);
      ctx.lineTo(-1.5, hy + 12.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(13, hy + 9.5);
      ctx.lineTo(6.5, hy + 11);
      ctx.lineTo(7, hy + 13);
      ctx.lineTo(12.5, hy + 12.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(2.2, hy + 11.4, 1.1, 0, 6.3);
      ctx.arc(8.8, hy + 11.4, 1.1, 0, 6.3);
      ctx.fill();

      // Đường bóng đổ sắc lạnh trên trán & sống mũi Saitama
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-3, hy + 7);
      ctx.lineTo(5, hy + 10);
      ctx.lineTo(13.5, hy + 7);
      ctx.moveTo(5.5, hy + 10);
      ctx.lineTo(5.5, hy + 14.5);
      ctx.moveTo(3, hy + 16.8);
      ctx.lineTo(8.5, hy + 16.5);
      ctx.stroke();
    }
    return;
  }

  // Đôi mắt Anime Chibi tiêu chuẩn
  if (!cfg.hideEyes) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(1.5, hy + 11, 3.6, 4.2, 0, 0, 6.3);
    ctx.ellipse(9.5, hy + 11, 3.6, 4.2, 0, 0, 6.3);
    ctx.fill();

    ctx.fillStyle = cfg.eye || '#0f172a';
    ctx.beginPath();
    ctx.arc(2.1, hy + 11, 2.3, 0, 6.3);
    ctx.arc(10.1, hy + 11, 2.3, 0, 6.3);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(1.3, hy + 9.7, 1.0, 0, 6.3);
    ctx.arc(9.3, hy + 9.7, 1.0, 0, 6.3);
    ctx.fill();

    ctx.strokeStyle = cfg.brow || '#0f172a';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    if (cfg.serious) {
      ctx.moveTo(-2.5, hy + 6);
      ctx.lineTo(4.2, hy + 8);
      ctx.moveTo(13.5, hy + 6);
      ctx.lineTo(7.2, hy + 8);
    } else {
      ctx.moveTo(-1.5, hy + 6.5);
      ctx.lineTo(4, hy + 6.5);
      ctx.moveTo(7.5, hy + 6.5);
      ctx.lineTo(12.5, hy + 6.5);
    }
    ctx.stroke();
  }

  // Miệng cười lớn (Luffy Gear 5) hoặc miệng mỉm cười tự tin
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.6;
  if (cfg.bigLaugh) {
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(5.5, hy + 14.5, 5.2, 0.05, Math.PI - 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1.5, hy + 14.6, 8, 2.2);
  } else {
    ctx.beginPath();
    ctx.arc(5.5, hy + 15.2, 2.5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
}

// ----------------------------------------------------------------------------
// 1. SATORU GOJO (25.000 XU + 350 KIM CƯƠNG — SKIN ĐẮT & MẠNH NHẤT GAME)
// ----------------------------------------------------------------------------
TB_RegisterSkin({
  id: 'gojo',
  tier: 'transcendent',
  name: 'Satoru Gojo (Vô Hạ Hạn)',
  awakenedTitle: 'GOJO SATORU — LỤC NHÃN & HƯ THỨC: TỬ',
  icon: '🌌',
  coins: 25000,
  dia: 350,
  env: {
    name: 'Lãnh Địa Vô Lương Không Xứ',
    desc: 'Vô Hạ Hạn Vĩnh Viễn + Tự động ngắm bắn Thương (Xanh), Hách (Đỏ) & Hư Thức: Tử (Tím)!',
    sky: 'cosmic',
    solidHue: 255,
    grassHue: 195,
    tint: 'rgba(56,189,248,.05)',
    fx: 'stars',
    rate: 30,
  },
  passive: {
    id: 'limitless',
    name: 'Vô Hạ Hạn Vĩnh Viễn & Auto-Aim Hư Thức: Tử',
    desc: '[VĨNH VIỄN] Mọi gai, cưa, đá lăn, cá mập chạm vào đều bị Vô Hạ Hạn đẩy bật ra! Tự động ngắm bắn 360° cầu Thương/Hách/Tử phá hủy bẫy phía trước & trên đầu. Nhấn F để mở băng bịt mắt lộ Lục Nhãn!',
  },
  trail: ['#38bdf8', '#c084fc', '#ef4444'],
  pal: { body: '#0f172a', edge: '#38bdf8', inner: '#a855f7', belly: 'rgba(56,189,248,.5)' },
  renderCharacter(ctx, { bob, ph, run, air, T, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const awk = !!(P && (P.awakened || P.purpleFx > 0));
    const hy = -44.5 + bob + Math.sin(T * 4.5) * 0.5;

    // Hào quang Vô Hạ Hạn + Sét Đỏ-Xanh khi Thức Tỉnh (Chuẩn Ảnh 4)
    const ag = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, awk ? 42 : 32);
    ag.addColorStop(0, awk ? 'rgba(192,132,252,.55)' : 'rgba(56,189,248,.38)');
    ag.addColorStop(0.6, 'rgba(56,189,248,.18)');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, -24 + bob, awk ? 42 : 32, 0, 6.3);
    ctx.fill();

    // Thân áo cao chuyên Chú Thuật Sư đen tím than có 4 cúc vàng dọc giữa ngực (Chuẩn Ảnh 3)
    drawChibiProportions(ctx, bob, ph, run, air, T, {
      shoe: '#090d16',
      pants: '#0f172a',
      shirtHi: '#312e81',
      shirt: '#0f172a',
    });
    ctx.fillStyle = '#facc15';
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.arc(3.5, -24 + b * 3.2 + bob, 1.3, 0, 6.3);
      ctx.fill();
    }

    // Đầu Gojo + Cổ áo cao
    drawChibiFace(ctx, bob, T, {
      skin: '#fff1e6',
      eye: '#00f5d4',
      brow: '#e2e8f0',
      hideEyes: !awk,
      serious: true,
    });
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    rr(-13.5, -27 + bob, 27, 5.5, 2.5);
    ctx.fill();
    ctx.stroke();

    if (!awk) {
      // DẠNG THƯỜNG (Ảnh 3): Băng bịt mắt đen với 2 tròng sáng xanh Cyan phát quang
      ctx.fillStyle = '#090d16';
      rr(-14.5, hy + 6.5, 29, 8.2, 3.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 8;
      rr(-1, hy + 8.2, 5.5, 4.6, 2);
      ctx.fill();
      rr(7, hy + 8.2, 5.5, 4.6, 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // DẠNG THỨC TỈNH (Ảnh 4): Mở băng bịt mắt lộ đôi mắt Lục Nhãn (Six Eyes) rực sáng & tia chớp!
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(2.1, hy + 11, 2.6, 0, 6.3);
      ctx.arc(10.1, hy + 11, 2.6, 0, 6.3);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Mái tóc trắng bạc nhiều lớp chỉa nhọn (Chuẩn Ảnh 3 & 4)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14.5, hy + 7);
    ctx.lineTo(-22, hy - 2);
    ctx.lineTo(-13, hy - 1);
    ctx.lineTo(-19, hy - 11);
    ctx.lineTo(-7, hy - 4);
    ctx.lineTo(-3, hy - 16);
    ctx.lineTo(3, hy - 5);
    ctx.lineTo(10, hy - 14);
    ctx.lineTo(11, hy - 4);
    ctx.lineTo(21, hy - 6);
    ctx.lineTo(14.5, hy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các quả cầu Thương (Xanh), Hách (Đỏ) và Tử (Tím) lơ lửng hai bên (Chuẩn Ảnh 3 & 4)
    const bobOrb = Math.sin(T * 6) * 2.5;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-20, -28 + bob + bobOrb, 4.5, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-18, -17 + bob - bobOrb, 4.5, 0, 6.3);
    ctx.fill();

    // Quả cầu Hư Thức: Tử (Hollow Purple) xoáy tím trên tay phải
    const pR = awk ? 9.5 + Math.sin(T * 25) * 1.5 : 5.5;
    const pg = ctx.createRadialGradient(18, -19 + bob, 1, 18, -19 + bob, pR * 1.4);
    pg.addColorStop(0, '#ffffff');
    pg.addColorStop(0.45, '#d8b4fe');
    pg.addColorStop(0.8, '#9333ea');
    pg.addColorStop(1, 'rgba(147,51,234,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(18, -19 + bob, pR * 1.4, 0, 6.3);
    ctx.fill();

    // Tia chớp Đỏ & Xanh phóng quanh người khi Thức Tỉnh (Ảnh 4)
    if (awk && Math.floor(T * 18) % 2 === 0) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -38 + bob);
      ctx.lineTo(-24, -26 + bob);
      ctx.lineTo(-15, -14 + bob);
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(14, -36 + bob);
      ctx.lineTo(24, -24 + bob);
      ctx.lineTo(16, -12 + bob);
      ctx.stroke();
    }
  },
  onActiveSkill(P, L) {
    v19FireAutoAimSkill(
      P,
      L,
      { speed: 15, r: 34, col1: '#d8b4fe', col2: '#7e22ce', kind: 'pierce', life: 1.5 },
      true
    );
    Snd.slam();
    G.shake = Math.max(G.shake, 7);
    toast('🟣 HƯ THỨC: TỬ (AUTO-AIM HOLLOW PURPLE)!');
  },
});

// ----------------------------------------------------------------------------
// 2. SON GOKU (15.000 XU + 220 KIM CƯƠNG — BASE <-> MASTERED ULTRA INSTINCT)
// ----------------------------------------------------------------------------
TB_RegisterSkin({
  id: 'goku',
  tier: 'supreme',
  name: 'Son Goku (Ultra Instinct)',
  awakenedTitle: 'GOKU — BẢN NĂNG VÔ CỰC HOÀN HẢO (MUI)',
  icon: '🔥',
  coins: 15000,
  dia: 220,
  env: {
    name: 'Tournament of Power Galaxy',
    desc: 'Nhấn F (hoặc đứng gồng Ki) hóa Bản Năng Vô Cực Tóc Bạc + Tự động bắn đạn Ki & Kamehameha khóa bẫy!',
    sky: 'cosmic',
    solidHue: 230,
    grassHue: 195,
    tint: 'rgba(100,200,255,.05)',
    fx: 'sparks',
    rate: 25,
  },
  passive: {
    id: 'saiyan',
    name: 'Bản Năng Vô Cực Vĩnh Viễn & Auto-Aim Ki Blast',
    desc: '[VĨNH VIỄN] Tự động lướt né mọi sát thương chí mạng + Tự động bắn đạn Ki / Kamehameha tiêu diệt bẫy phía trước & thạch nhũ trên đầu! Nhấn F để chuyển đổi dạng Tóc Đen ↔ Tóc Bạc Ultra Instinct!',
  },
  trail: ['#e2e8f0', '#38bdf8', '#a855f7'],
  pal: { body: '#f97316', edge: '#9a3412', inner: '#1d4ed8', belly: 'rgba(30,64,175,.85)' },
  renderCharacter(ctx, { bob, ph, run, air, T, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const mui = !!(P && (P.awakened || (P.gokuForm || 0) >= 3));
    const hy = -44.5 + bob + Math.sin(T * 4.5) * 0.5;

    // Hào quang Ngân Hà Bản Năng Vô Cực (Xanh - Tím - Bạc lấp lánh như Ảnh 4)
    const rA = mui ? 38 + Math.sin(T * 24) * 4 : 28;
    const ag = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, rA);
    if (mui) {
      ag.addColorStop(0, 'rgba(255,255,255,.75)');
      ag.addColorStop(0.45, 'rgba(56,189,248,.52)');
      ag.addColorStop(0.78, 'rgba(168,85,247,.35)');
      ag.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      ag.addColorStop(0, 'rgba(56,189,248,.35)');
      ag.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, -24 + bob, rA, 0, 6.3);
    ctx.fill();

    // Võ phục Kame cam, áo lót xanh dương, băng cổ tay xanh & đai lưng xanh (Chuẩn Ảnh 3 & 4)
    drawChibiProportions(ctx, bob, ph, run, air, T, {
      shoe: '#1e3a8a',
      pants: '#ea580c',
      shirtHi: '#fb923c',
      shirt: '#ea580c',
      belt: '#1d4ed8',
    });
    ctx.fillStyle = '#1d4ed8';
    ctx.beginPath();
    ctx.moveTo(-6.5, -26.5 + bob);
    ctx.lineTo(6.5, -26.5 + bob);
    ctx.lineTo(0, -17.5 + bob);
    ctx.closePath();
    ctx.fill();

    const hairCol = mui ? '#e2e8f0' : '#0f172a';
    const eyeCol = mui ? '#cbd5e1' : '#0f172a';
    drawChibiFace(ctx, bob, T, {
      skin: '#ffedd5',
      eye: eyeCol,
      brow: hairCol,
      serious: true,
    });

    // Mái tóc Goku chuẩn thiết kế (Ảnh 3: Tóc đen chỉa 2 bên; Ảnh 4: Tóc bạc dựng cao ánh kim)
    ctx.fillStyle = hairCol;
    ctx.strokeStyle = mui ? '#64748b' : '#000000';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (!mui) {
      ctx.moveTo(-14, hy + 7);
      ctx.lineTo(-28, hy + 4);
      ctx.lineTo(-16, hy - 1);
      ctx.lineTo(-27, hy - 8);
      ctx.lineTo(-12, hy - 6);
      ctx.lineTo(-15, hy - 16);
      ctx.lineTo(-2, hy - 8);
      ctx.lineTo(7, hy - 17);
      ctx.lineTo(10, hy - 6);
      ctx.lineTo(25, hy - 9);
      ctx.lineTo(14, hy - 1);
      ctx.lineTo(23, hy + 4);
      ctx.lineTo(14, hy + 7);
    } else {
      ctx.moveTo(-14.5, hy + 7);
      ctx.lineTo(-26, hy - 3);
      ctx.lineTo(-14, hy - 3);
      ctx.lineTo(-22, hy - 16);
      ctx.lineTo(-8, hy - 7);
      ctx.lineTo(-4, hy - 22);
      ctx.lineTo(3, hy - 9);
      ctx.lineTo(11, hy - 19);
      ctx.lineTo(12, hy - 6);
      ctx.lineTo(24, hy - 10);
      ctx.lineTo(14.5, hy + 7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },
  onActiveSkill(P, L) {
    v19FireAutoAimSkill(
      P,
      L,
      { speed: 15.5, r: 28, col1: '#38bdf8', col2: '#0284c7', kind: 'pierce', life: 1.3 },
      true
    );
    Snd.slam();
    toast('🐉 KAMEHAMEHA TỰ ĐỘNG KHÓA MỤC TIÊU!');
  },
});

// ----------------------------------------------------------------------------
// 3. LUFFY (14.000 XU + 200 KIM CƯƠNG — DẠNG THƯỜNG MŨ RƠM <-> GEAR 5 THẦN NIKA)
// ----------------------------------------------------------------------------
TB_RegisterSkin({
  id: 'luffy',
  tier: 'supreme',
  name: 'Monkey D. Luffy (Gear 5 Nika)',
  awakenedTitle: 'LUFFY GEAR 5 — CHIẾN BINH GIẢI PHÓNG NIKA',
  icon: '☀️',
  coins: 14000,
  dia: 200,
  env: {
    name: 'Onigashima Roof Sky',
    desc: 'Dạng thường đội Nón Rơm áo đỏ -> Nhấn F (hoặc chạm bẫy) hóa Gear 5 Nika tóc mây trắng & đàn hồi cao su vĩnh viễn!',
    sky: 'storm',
    solidHue: 275,
    grassHue: 330,
    tint: 'rgba(255,255,255,.05)',
    fx: 'sparks',
    rate: 24,
  },
  passive: {
    id: 'nika',
    name: 'Cơ Thể Cao Su Vĩnh Viễn & Auto-Aim Gomu Nika',
    desc: '[VĨNH VIỄN - KHÔNG CHỜ HỒI] Mọi gai nhọn, cưa máy, búa đập hay dung nham chạm vào đều biến thành cao su bật Luffy nảy lên trời! Nhấn F để chuyển đổi Dạng Thường ↔ Gear 5 Nika + Tự động phóng đấm Haki phá bẫy!',
  },
  trail: ['#ffffff', '#e0aaff', '#ff0055'],
  pal: { body: '#ffffff', edge: '#7e22ce', inner: '#ef4444', belly: 'rgba(243,232,255,.95)' },
  renderCharacter(ctx, { bob, ph, run, air, T, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const gear5 = !!(P && P.awakened);
    const hy = -44.5 + bob + Math.sin(T * 4.5) * 0.5;

    if (!gear5) {
      // DẠNG THƯỜNG (Chuẩn Ảnh 3): Quần short xanh, đai vàng, áo ghi-lê đỏ mở ngực chữ X, đội Nón Rơm trên đầu!
      drawChibiProportions(ctx, bob, ph, run, air, T, {
        shoe: '#78350f',
        pants: '#1d4ed8',
        shirtHi: '#ef4444',
        shirt: '#dc2626',
        belt: '#facc15',
      });
      // Ngực trần ở giữa áo ghi-lê đỏ + Sẹo chữ X
      ctx.fillStyle = '#ffe0c8';
      ctx.fillRect(-3.5, -26 + bob, 9, 11);
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-1, -24 + bob);
      ctx.lineTo(4, -18 + bob);
      ctx.moveTo(4, -24 + bob);
      ctx.lineTo(-1, -18 + bob);
      ctx.stroke();

      drawChibiFace(ctx, bob, T, {
        skin: '#ffe0c8',
        eye: '#0f172a',
        brow: '#0f172a',
      });
      // Vết sẹo khâu dưới mắt trái Luffy
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(8, hy + 14.5);
      ctx.lineTo(12, hy + 14.5);
      ctx.stroke();

      // Tóc đen lòa xòa dưới vành mũ
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-14, hy + 6);
      ctx.lineTo(-16, hy + 11);
      ctx.lineTo(-10, hy + 7);
      ctx.lineTo(0, hy + 9);
      ctx.lineTo(14, hy + 6);
      ctx.fill();

      // Chiếc Nón Rơm đội trên đỉnh đầu (Ảnh 3)
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, hy + 2, 21, 5.2, 0, 0, 6.3);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, hy + 1, 13.5, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-13, hy - 2.5, 26, 3.5);
    } else {
      // DẠNG THỨC TỈNH GEAR 5 NIKA (Chuẩn Ảnh 4): Dải khói mây trắng, nón rơm đeo lưng, quần áo trắng đai tím, tóc mây trắng & miệng cười lớn!
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * 0.78 + (i / 6) * Math.PI * 1.44;
        const mx = Math.cos(a) * 23;
        const my = -28 + bob + Math.sin(a) * 16 + Math.sin(T * 6 + i) * 2;
        ctx.beginPath();
        ctx.arc(mx, my, 5.8, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      }
      // Nón rơm đeo sau lưng
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-15, -22 + bob, 5.5, 11, -0.35, 0, 6.3);
      ctx.fill();
      ctx.stroke();

      drawChibiProportions(ctx, bob, ph, run, air, T, {
        shoe: '#78350f',
        pants: '#ffffff',
        shirtHi: '#ffffff',
        shirt: '#f1f5f9',
        belt: '#9333ea',
      });
      drawChibiFace(ctx, bob, T, {
        skin: '#ffe0c8',
        eye: '#e11d48',
        brow: '#ffffff',
        bigLaugh: true,
      });

      // Tóc mây trắng xoăn bồng bềnh
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      [
        [-11, hy - 1, 7],
        [-3, hy - 5, 8.2],
        [5, hy - 4, 7.8],
        [12, hy, 6.5],
        [0, hy - 9, 7],
      ].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      });

      // Sét vàng-đen Haki Bá Vương
      if (Math.floor(T * 16) % 2 === 0) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(12, hy - 8);
        ctx.lineTo(24, hy - 18);
        ctx.lineTo(18, hy - 28);
        ctx.stroke();
      }
    }
  },
  onActiveSkill(P, L) {
    if (!P.awakened) P.awakened = true;
    v19FireAutoAimSkill(
      P,
      L,
      { speed: 14, r: 28, col1: '#ffffff', col2: '#c084fc', kind: 'punch', life: 1.2 },
      true
    );
    Snd.spring();
    toast('☀️ GOMU GOMU NO BAJRANG GUN (AUTO-AIM)!');
  },
});

// ----------------------------------------------------------------------------
// 4. SAITAMA (12.000 XU + 180 KIM CƯƠNG — MẶT NGƠ NGÁC -> TỰ ĐỘNG NGHIÊM TÚC KHI CHẾT >= 1 LẦN)
// ----------------------------------------------------------------------------
TB_RegisterSkin({
  id: 'saitama',
  tier: 'supreme',
  name: 'Saitama (One Punch Man)',
  awakenedTitle: 'SAITAMA — CHẾ ĐỘ NGHIÊM TÚC (SERIOUS SERIES)',
  icon: '🥊',
  coins: 12000,
  dia: 180,
  env: {
    name: 'Z-City Ruins',
    desc: 'Ban đầu mặt ngơ ngác -> Khi chết >= 1 lần (hoặc nhấn F) khuôn mặt hóa Nghiêm Túc + Đấm vỡ mọi bẫy!',
    sky: 'sunset',
    solidHue: 35,
    grassHue: 48,
    tint: 'rgba(255,200,0,.04)',
    fx: 'sparks',
    rate: 20,
  },
  passive: {
    id: 'onepunch',
    name: 'Serious Mode Vĩnh Viễn & Auto-Aim Serious Punch',
    desc: '[VĨNH VIỄN] Sau khi chết 1 lần (hoặc nhấn F), Saitama chuyển sang khuôn mặt Nghiêm Túc: Bất hoại trước mọi bẫy va chạm & Tự động tung sóng đấm Serious Punch khóa mục tiêu hủy diệt đá, cá mập, trụ laser!',
  },
  trail: ['#ffd43b', '#ef4444', '#ffffff'],
  pal: { body: '#ffd43b', edge: '#b45309', inner: '#ef4444', belly: 'rgba(255,255,255,.9)' },
  renderCharacter(ctx, { bob, ph, run, air, T, vx, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const serious = !!(P && (P.awakened || G.deaths >= 1 || P.punchFxT > 0));
    const hy = -44.5 + bob + Math.sin(T * 4.5) * 0.5;

    // Áo choàng trắng: Dạng thường rủ gọn gàng (Ảnh 3); Dạng Nghiêm Túc phồng lớn tung bay dữ dội (Ảnh 4)
    const wave = Math.sin(T * 12) * (serious ? 8 : 3) + Math.min(16, Math.abs(vx) * 2.6);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (!serious) {
      ctx.moveTo(-9, -26 + bob);
      ctx.quadraticCurveTo(-19 - wave * 0.5, -15 + bob, -18 - wave * 0.5, -2 + bob);
      ctx.lineTo(-8, -3 + bob);
    } else {
      ctx.moveTo(-12, -28 + bob);
      ctx.quadraticCurveTo(-34 - wave, -36 + bob, -36 - wave, -2 + bob);
      ctx.lineTo(14, -4 + bob);
      ctx.quadraticCurveTo(24, -24 + bob, 10, -28 + bob);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bộ đồ vàng khóa kéo trắng + Thắt lưng đen mặt khóa vàng tròn + Ủng đỏ (Chuẩn Ảnh 3)
    drawChibiProportions(ctx, bob, ph, run, air, T, {
      shoe: '#b91c1c',
      pants: '#eab308',
      shirtHi: '#fde047',
      shirt: '#eab308',
      belt: '#1e293b',
    });
    // Khóa kéo trắng trước ngực & Mặt thắt lưng vàng tròn
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3.5, -26 + bob);
    ctx.lineTo(3.5, -16 + bob);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(3.5, -13 + bob, 3.8, 2.6, 0, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Hai khuy tròn giữ áo choàng trên vai
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-6.5, -25 + bob, 2.6, 0, 6.3);
    ctx.arc(9.5, -25 + bob, 2.6, 0, 6.3);
    ctx.fill();

    // Khuôn mặt đầu trọc Saitama (Tự động đổi từ Ngơ Ngác sang Nghiêm Túc!)
    drawChibiFace(ctx, bob, T, {
      skin: '#ffedd5',
      baldFacial: true,
      awakened: serious,
    });
    // Ánh sáng phản chiếu trên đỉnh đầu trọc
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.ellipse(-4, hy + 4, 5, 2.4, -0.3, 0, 6.3);
    ctx.fill();

    // Đôi găng tay đỏ đấm bốc
    const punchExt = P && P.punchFxT > 0 ? 14 : 0;
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-11, -16 + bob, 4.8, 0, 6.3);
    ctx.arc(13 + punchExt, -16 + bob, 5.8, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  },
  onActiveSkill(P, L) {
    P.awakened = true;
    v19FireAutoAimSkill(
      P,
      L,
      { speed: 16.5, r: 36, col1: '#ef4444', col2: '#facc15', kind: 'punch', life: 1.1 },
      true
    );
    G.groundShockwaves.push({ x: P.x + PW / 2, y: P.y + PH, r: 15, maxR: 170, col: '#facc15', life: 0.45 });
    Snd.slam();
    G.shake = Math.max(G.shake, 9);
    toast('🥊 SERIOUS SERIES: SERIOUS PUNCH!');
  },
});

// ----------------------------------------------------------------------------
// 5. NARUTO (12.000 XU + 180 KIM CƯƠNG — DẠNG THƯỜNG <-> BARYON / CỬU VĨ KURAMA MODE)
// ----------------------------------------------------------------------------
TB_RegisterSkin({
  id: 'naruto',
  tier: 'supreme',
  name: 'Naruto Uzumaki (Baryon Kurama)',
  awakenedTitle: 'NARUTO — BARYON KURAMA MODE (CỬU VĨ)',
  icon: '🦊',
  coins: 12000,
  dia: 180,
  env: {
    name: 'Valley of the End Chakra',
    desc: 'Nhấn F chuyển đổi Dạng Thường ↔ Baryon Cửu Vĩ 9 đuôi lửa khổng lồ + Tự động phóng Rasengan khóa mục tiêu!',
    sky: 'ember',
    solidHue: 25,
    grassHue: 115,
    tint: 'rgba(255,140,0,.05)',
    fx: 'embers',
    rate: 22,
  },
  passive: {
    id: 'kurama',
    name: 'Cửu Vĩ Hộ Thể Vĩnh Viễn & Auto-Aim Rasengan',
    desc: '[VĨNH VIỄN] Chạy nhanh +35%, Nhảy 3 Lần, Miễn nhiễm 100% Độc/Đảo Phím & Tự động phóng Rasenshuriken truy đuổi phá bẫy! Nhấn F để bật/tắt đại vĩ thú Baryon Kurama 9 đuôi lửa!',
  },
  trail: ['#ff922b', '#ef4444', '#38bdf8'],
  pal: { body: '#fb923c', edge: '#1e293b', inner: '#facc15', belly: 'rgba(30,41,59,.85)' },
  renderCharacter(ctx, { bob, ph, run, air, T, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const baryon = !!(P && P.awakened);
    const hy = -44.5 + bob + Math.sin(T * 4.5) * 0.5;

    if (baryon) {
      // DẠNG THỨC TỈNH BARYON KURAMA (Chuẩn Ảnh 4): 9 Đuôi lửa đỏ-cam đồ sộ bùng cháy phía sau lưng!
      for (let t = -4; t <= 4; t++) {
        const ang = -Math.PI * 0.5 + t * 0.24 + Math.sin(T * 8 + t) * 0.08;
        const tx = Math.cos(ang) * 42;
        const ty = -24 + bob + Math.sin(ang) * 40;
        const tg = ctx.createLinearGradient(0, -18 + bob, tx, ty);
        tg.addColorStop(0, '#fde047');
        tg.addColorStop(0.5, '#f97316');
        tg.addColorStop(1, '#dc2626');
        ctx.fillStyle = tg;
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-6, -16 + bob);
        ctx.quadraticCurveTo(tx * 0.45 - 8, ty * 0.6, tx, ty);
        ctx.quadraticCurveTo(tx * 0.65 + 6, ty * 0.65, 4, -16 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Quần cam, áo khoác cam-đen có sọc đen ngang và khóa kéo trắng giữa ngực (Chuẩn Ảnh 3 & 4)
    drawChibiProportions(ctx, bob, ph, run, air, T, {
      shoe: '#0f172a',
      pants: '#ea580c',
      shirtHi: '#fb923c',
      shirt: '#ea580c',
      belt: '#0f172a',
    });
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -26 + bob, 24, 4.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3.5, -26 + bob);
    ctx.lineTo(3.5, -14 + bob);
    ctx.stroke();

    drawChibiFace(ctx, bob, T, {
      skin: '#ffedd5',
      eye: baryon ? '#ef4444' : '#3b82f6',
      serious: baryon,
    });

    // 3 vệt râu Cửu Vĩ hai bên má + Viền mắt đen-đỏ khi hóa Baryon (Ảnh 4)
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.4;
    for (let w = 0; w < 3; w++) {
      ctx.beginPath();
      ctx.moveTo(-4, hy + 11 + w * 2.2);
      ctx.lineTo(0, hy + 11.4 + w * 2.2);
      ctx.moveTo(11, hy + 11 + w * 2.2);
      ctx.lineTo(14, hy + 11.4 + w * 2.2);
      ctx.stroke();
    }

    // Băng trán Ninja Làng Lá có tấm kim loại bạc ở giữa (Ảnh 3)
    ctx.fillStyle = '#1e293b';
    rr(-14, hy + 1.5, 28, 5.8, 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    rr(-2, hy + 2.2, 12, 4.4, 1.5);
    ctx.fill();

    // Tóc vàng nhọn (Khi hóa Baryon có thêm 2 sừng tai cáo Chakra dựng lên!)
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, hy + 2);
    ctx.lineTo(-20, hy - 8);
    ctx.lineTo(-9, hy - 5);
    ctx.lineTo(-11, hy - 16);
    ctx.lineTo(-1, hy - 7);
    ctx.lineTo(5, hy - 17);
    ctx.lineTo(9, hy - 6);
    ctx.lineTo(19, hy - 10);
    ctx.lineTo(14, hy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Quả cầu Rasengan xanh xoay tít trên tay phải (Ảnh 4)
    if (baryon) {
      const rg = ctx.createRadialGradient(16, -18 + bob, 1, 16, -18 + bob, 9);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.5, '#38bdf8');
      rg.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(16, -18 + bob, 9, 0, 6.3);
      ctx.fill();
    }
  },
  onActiveSkill(P, L) {
    v19FireAutoAimSkill(
      P,
      L,
      { speed: 15, r: 26, col1: '#38bdf8', col2: '#0284c7', kind: 'rasen', life: 1.35 },
      true
    );
    Snd.djump();
    toast('🌀 TIÊN PHÁP: SIÊU ĐẠI NGỌC RASENSHURIKEN!');
  },
});

// ----------------------------------------------------------------------------
// 6. PIKACHU (10.000 XU + 150 KIM CƯƠNG — DẠNG THƯỜNG <-> GIGANTAMAX SUPER CHARGED)
// ----------------------------------------------------------------------------
TB_RegisterSkin({
  id: 'pikachu',
  tier: 'supreme',
  name: 'Pikachu (Gigantamax Volt)',
  awakenedTitle: 'PIKACHU — GIGANTAMAX 100.000 VOLT',
  icon: '⚡',
  coins: 10000,
  dia: 150,
  env: {
    name: 'Thunderstorm Power Plant',
    desc: 'Nhấn F chuyển đổi Dạng Thường ↔ Gigantamax mây đỏ + Triệu hồi Sấm Sét Ngàn Vôn giáng xuống bẫy!',
    sky: 'storm',
    solidHue: 48,
    grassHue: 130,
    tint: 'rgba(255,230,0,.05)',
    fx: 'sparks',
    rate: 26,
  },
  passive: {
    id: 'pikachu',
    name: 'Thần Sấm Vĩnh Viễn & Auto-Aim 100.000V',
    desc: '[VĨNH VIỄN] Chạy siêu tốc +35%, Nhảy Đôi & Tự động giáng Sấm Sét 100.000V từ bầu trời hủy diệt mọi bẫy, cá mập, bóng ma phía trước! Nhấn F để bật trạng thái Gigantamax Super Charged!',
  },
  trail: ['#ffe066', '#ffd43b', '#38bdf8'],
  pal: { body: '#fde047', edge: '#854d0e', inner: '#ef4444', belly: 'rgba(254,249,195,.9)' },
  renderCharacter(ctx, { bob, ph, run, T, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const gmax = !!(P && (P.awakened || P.zapFx > 0));

    // Đuôi tia chớp vàng lớn (Khi hóa Gigantamax đuôi phát sáng rực rỡ như Ảnh 4)
    ctx.fillStyle = gmax ? '#fef08a' : '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-10, -10 + bob);
    ctx.lineTo(-22, -18 + bob);
    ctx.lineTo(-16, -22 + bob);
    ctx.lineTo(-32, -36 + bob);
    ctx.lineTo(-13, -28 + bob);
    ctx.lineTo(-17, -23 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Đôi tai vàng dài với chót tai đen
    const earRot = Math.sin(T * 6) * 0.08;
    [
      [-7, -0.35 - earRot],
      [7, 0.38 + earRot],
    ].forEach(([ox, rot]) => {
      ctx.save();
      ctx.translate(ox, -35 + bob);
      ctx.rotate(rot);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, -11, 4.6, 13.5, 0, 0, 6.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(0, -19.5, 3.5, 5.2, 0, 0, 6.3);
      ctx.fill();
      ctx.restore();
    });

    // Thân Pikachu vàng mũm mĩm (Chuẩn Ảnh 3 & 4)
    const fo = run ? Math.sin(ph) * 4 : 0;
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(-6 + fo, -2, 5.5, 3, 0, 0, 6.3);
    ctx.ellipse(6 - fo, -2, 5.5, 3, 0, 0, 6.3);
    ctx.fill();

    const bg = ctx.createRadialGradient(-3, -24 + bob, 2, 0, -18 + bob, 20);
    bg.addColorStop(0, '#fef08a');
    bg.addColorStop(1, '#eab308');
    ctx.fillStyle = bg;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    rr(-14.5, -37 + bob, 29, 36 - bob, 14);
    ctx.fill();
    ctx.stroke();

    // Mắt đen long lanh, miệng chữ 'w' và 2 má đỏ phóng điện
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(2.2, -25 + bob, 3.2, 0, 6.3);
    ctx.arc(10.5, -25 + bob, 3.2, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(1.4, -26.2 + bob, 1.2, 0, 6.3);
    ctx.arc(9.7, -26.2 + bob, 1.2, 0, 6.3);
    ctx.fill();

    if (gmax) {
      // Lông mày giận dữ & 3 đám mây đỏ Gigantamax bay quanh vai (Chuẩn Ảnh 4)
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-1, -29.5 + bob);
      ctx.lineTo(4.5, -27.5 + bob);
      ctx.moveTo(13.5, -29.5 + bob);
      ctx.lineTo(8, -27.5 + bob);
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      [
        [-18, -32],
        [0, -48],
        [18, -32],
      ].forEach(([cx, cy], i) => {
        ctx.beginPath();
        ctx.arc(cx, cy + bob + Math.sin(T * 8 + i) * 2, 4.8, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      });
    }

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-1, -19.5 + bob, 3.8, 0, 6.3);
    ctx.arc(12.5, -19.5 + bob, 3.4, 0, 6.3);
    ctx.fill();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(4.2, -20 + bob, 2, 0.2, Math.PI - 0.2);
    ctx.arc(7.8, -20 + bob, 2, 0.2, Math.PI - 0.2);
    ctx.stroke();
  },
  onActiveSkill(P, L) {
    v19FireAutoAimSkill(
      P,
      L,
      { speed: 17, r: 30, col1: '#fde047', col2: '#38bdf8', kind: 'thunder', life: 1.1 },
      true
    );
    Snd.slam();
    toast('⚡ GIGANTAMAX VOLT CRASH 100.000V!');
  },
});

// 3 SKIN MYTHIC CAO CẤP (Độc Vương, Tử Thần Hư Không, Long Thần):
TB_RegisterSkin({
  id: 'plague',
  tier: 'mythic',
  name: 'Độc Vương Thỏ',
  icon: '☣️',
  coins: 4500,
  dia: 65,
  env: {
    name: 'Toxic Swamp',
    desc: 'bầu trời axit, miễn nhiễm độc & đảo phím',
    sky: 'toxic',
    solidHue: 135,
    grassHue: 280,
    tint: 'rgba(80,255,120,.06)',
    fx: 'bubbles',
    rate: 18,
  },
  passive: {
    id: 'antidote',
    name: 'Bất Tử Độc Vĩnh Viễn',
    desc: 'Miễn nhiễm 100% bẫy Độc, Hồ Axit, Đảo Phím & Nặng Ngàn Cân + Chạy nhanh 20%.',
  },
  trail: ['#70e000', '#b5179e', '#80ed99'],
  pal: { body: '#52b788', edge: '#081c15', inner: '#b5179e', belly: 'rgba(180,255,150,.75)' },
});
TB_RegisterSkin({
  id: 'reaper',
  tier: 'mythic',
  name: 'Tử Thần Hư Không',
  icon: '💀',
  coins: 5500,
  dia: 80,
  env: {
    name: 'Void Abyss',
    desc: 'vực thẳm tử thần, nhìn thấu xu giả & đi xuyên bẫy',
    sky: 'cosmic',
    solidHue: 270,
    grassHue: 345,
    tint: 'rgba(120,0,255,.07)',
    fx: 'sparks',
    rate: 22,
  },
  passive: {
    id: 'wraith',
    name: 'Hồn Ma Hư Không Vĩnh Viễn',
    desc: 'Đi xuyên sát thương chí mạng & Vô hiệu hóa 100% bẫy đồng xu Quỷ Dị.',
  },
  trail: ['#ff0055', '#7209b7', '#00f5d4'],
  pal: { body: '#1a1423', edge: '#ff0055', inner: '#7209b7', belly: 'rgba(255,0,85,.45)' },
});
TB_RegisterSkin({
  id: 'dragon',
  tier: 'mythic',
  name: 'Long Thần Tinh Tú',
  icon: '🐉',
  coins: 6500,
  dia: 95,
  env: {
    name: 'Dragon Sanctuary',
    desc: 'hoàng hôn rồng thiêng, Nhảy 3 Lần & Hút xu',
    sky: 'ember',
    solidHue: 28,
    grassHue: 45,
    tint: 'rgba(255,180,0,.06)',
    fx: 'embers',
    rate: 24,
  },
  passive: {
    id: 'dragonflight',
    name: 'Long Vũ Cửu Thiên Vĩnh Viễn',
    desc: 'Nhảy 3 Lần liên tiếp trên không (Triple Jump), chạy nhanh +25% & Hút xu/chìa khóa toàn màn hình.',
  },
  trail: ['#ffd43b', '#ff4d6d', '#00ffe0'],
  pal: { body: '#ffb703', edge: '#9d0208', inner: '#00f5d4', belly: 'rgba(255,245,190,.85)' },
});

// ============================================================================
// 6. VẬN HÀNH NỘI TẠI VĨNH VIỄN & AUTO-AIM TỰ ĐỘNG CHO CÁC SKIN ANIME
// ============================================================================
function v19UpdateAllHeroSkills(P, L) {
  if (!P || !L || P.dead || G.won) return;
  if (P.punchCd > 0) P.punchCd -= STEP;
  if (P.punchFxT > 0) P.punchFxT -= STEP;
  if (P.purpleFx > 0) P.purpleFx -= STEP;
  if (P.awakenAnimT > 0) P.awakenAnimT -= STEP;
  if (P.zapFx > 0) P.zapFx -= STEP;

  v19UpdateSkillShots(L);

  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  const isAnimeHero =
    curPassive === 'limitless' ||
    curPassive === 'saiyan' ||
    curPassive === 'nika' ||
    curPassive === 'onepunch' ||
    curPassive === 'kurama' ||
    curPassive === 'pikachu';

  if (!isAnimeHero) return;

  // Mọi trang phục Anime đều được BUFF VĨNH VIỄN: Nhảy Đa Tầng (2–3 bước), Miễn nhiễm Đảo Phím & Hút Vật Phẩm!
  P.rev = 0;
  P.dj = true;
  P.djT = 999;
  if (P.onGround) P.extraHops = 2;

  // 1. SATORU GOJO: Vô Hạ Hạn đẩy lùi mọi vật thể nguy hiểm trong tầm 135px VĨNH VIỄN + Auto-Aim Hư Thức: Tử!
  if (curPassive === 'limitless') {
    for (const q of L.stalactites || []) {
      if (q.st === 2 && Math.hypot(q.x + q.w / 2 - cx, q.y + q.fy + q.h - cy) < 135) {
        q.vy = -5;
        q.st = 3;
        q.t = 1.5;
        sparkle(q.x + q.w / 2, q.y + q.fy, 10, 1.3, '#38bdf8');
      }
    }
    for (const sh of L.sharks || []) {
      const d = Math.hypot(sh.cx - cx, sh.cy - cy);
      if (d < 140 && d > 1) {
        sh.cx += ((sh.cx - cx) / d) * 7.5;
        sh.cy += ((sh.cy - cy) / d) * 7.5;
      }
    }
    if (L.anomalies) {
      for (const sp of L.anomalies.spitters || []) {
        if (sp.glob && Math.hypot(sp.glob.x - cx, sp.glob.y - cy) < 130) sp.glob = null;
      }
    }
  }

  // 2. SAITAMA: Hễ chết >= 1 lần là tự động bật khuôn mặt Nghiêm Túc (Serious Mode)!
  if (curPassive === 'onepunch' && G.deaths >= 1 && !P._autoSerious) {
    P._autoSerious = true;
    P.awakened = true;
  }

  // 3. TỰ ĐỘNG NGẮM BẮN 360 ĐỘ (AUTO-AIM): Tự động dò tìm bẫy đang lao tới hoặc bẫy phía trước/trên đầu mỗi 0.75s!
  P.autoAimT = (P.autoAimT || 0) + STEP;
  if (P.autoAimT >= 0.72) {
    const threat = v19FindNearestThreat(P, L, 440);
    if (threat) {
      P.autoAimT = 0;
      if (curPassive === 'limitless') {
        P.purpleFx = 0.45;
        v19FireAutoAimSkill(
          P,
          L,
          { speed: 15.5, r: 28, col1: '#d8b4fe', col2: '#7e22ce', kind: 'pierce', life: 1.3 },
          false
        );
      } else if (curPassive === 'saiyan') {
        v19FireAutoAimSkill(
          P,
          L,
          { speed: 16, r: 24, col1: '#38bdf8', col2: '#0284c7', kind: 'orb', life: 1.2 },
          false
        );
      } else if (curPassive === 'onepunch') {
        P.punchFxT = 0.32;
        v19FireAutoAimSkill(
          P,
          L,
          { speed: 17, r: 32, col1: '#ef4444', col2: '#facc15', kind: 'punch', life: 1.0 },
          false
        );
      } else if (curPassive === 'kurama') {
        v19FireAutoAimSkill(
          P,
          L,
          { speed: 15, r: 24, col1: '#38bdf8', col2: '#f97316', kind: 'rasen', life: 1.25 },
          false
        );
      } else if (curPassive === 'pikachu') {
        P.zapFx = 0.35;
        v19FireAutoAimSkill(
          P,
          L,
          { speed: 18, r: 26, col1: '#fde047', col2: '#38bdf8', kind: 'thunder', life: 1.0 },
          false
        );
      } else if (curPassive === 'nika') {
        v19FireAutoAimSkill(
          P,
          L,
          { speed: 14.5, r: 24, col1: '#ffffff', col2: '#a855f7', kind: 'punch', life: 1.15 },
          false
        );
      }
    }
  }
}
// === KẾT THÚC PHẦN 2 / 3 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 3 / 3 (PHẦN CUỐI) DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 3 / 3 (PHẦN CUỐI) — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 2 / 3 ===

// ============================================================================
// 7. VẬT LÝ DÂY NGẮN (60px -> 96px MAX) + KÉO CẢ ĐỘI + THÁP SỐNG CÕNG NHAU NHẢY
// ============================================================================
const V15_ROPE_REST = 60;
const V15_ROPE_SPRING = 78;
const V15_ROPE_MAX = 96;
const V15_PIT_SAFE_DROP = 76;

function v15GetSquadLinks(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0) return null;
  let groundedPower = P.onGround ? (input.d ? 3.2 : 1.4) : 0;
  let fallingCount = P.onGround ? 0 : 1;
  let bestAnchor = P.onGround
    ? { x: P.x, y: P.y, tvx: P.vx, vy: P.vy, anch: input.d, slot: P.slot }
    : null;
  const slots = [P.slot];
  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    slots.push(r.slot);
    if (r.onGround || r.anch) {
      groundedPower += r.anch ? 3.2 : 1.4;
      if (!bestAnchor || r.y < bestAnchor.y) {
        bestAnchor = {
          x: r.x,
          y: r.y,
          tvx: r.tvx || 0,
          vy: r.tvy || 0,
          anch: r.anch,
          slot: r.slot,
        };
      }
    } else {
      fallingCount++;
    }
  }
  slots.sort((a, b) => a - b);
  const idx = slots.indexOf(P.slot);
  const links = [];
  if (idx > 0) {
    const r = G.remotes.get(slots[idx - 1]);
    if (r && !r.dead && !r.ropeOn) links.push(r);
  }
  if (idx < slots.length - 1) {
    const r = G.remotes.get(slots[idx + 1]);
    if (r && !r.dead && !r.ropeOn) links.push(r);
  }
  return {
    links,
    bestAnchor,
    rescueRatio: groundedPower / Math.max(1, fallingCount),
  };
}

function applyTether(P) {
  const st = v15GetSquadLinks(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);
  for (const r of links) {
    const ax = P.x + PW / 2;
    const ay = P.y + PH / 2;
    const bx = r.x + PW / 2;
    const by = r.y + PH / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const d = Math.hypot(dx, dy);
    if (d <= V15_ROPE_REST || d < 1) continue;
    const nx = dx / d;
    const ny = dy / d;
    const stretch = d - V15_ROPE_REST;
    const partnerGrounded = !!(r.onGround || r.anch);
    let scale = 1.0;
    if (meGrounded && !partnerGrounded) {
      if (input.d) scale = 0.0;
      else if (rescueRatio >= 0.9) scale = 0.04 / rescueRatio;
      else scale = clamp(0.8 * (1.05 - rescueRatio), 0.24, 0.85);
    } else if (!meGrounded && (partnerGrounded || bestAnchor)) {
      scale = clamp(2.1 * Math.sqrt(Math.max(0.6, rescueRatio)), 1.4, 3.6);
    } else {
      scale = 0.85;
    }
    const f = Math.min(stretch * (d > V15_ROPE_SPRING ? 0.085 : 0.048), 5.5) * scale;
    P.vx += nx * f;
    P.vy += ny * f * (ny < 0 ? 1.85 : 0.25);
  }
  if (!meGrounded && bestAnchor && P.y > bestAnchor.y + 14) {
    const dxA = bestAnchor.x + PW / 2 - (P.x + PW / 2);
    const dyA = bestAnchor.y + PH / 2 - (P.y + PH / 2);
    const distA = Math.max(1, Math.hypot(dxA, dyA));
    const lift = clamp(rescueRatio, 0.85, 2.6);
    P.vy -= Math.min(GRAV * 1.7 * lift, 2.2);
    if (
      Math.abs(bestAnchor.tvx || 0) > 0.45 ||
      (bestAnchor.vy || 0) < -1.8 ||
      bestAnchor.anch ||
      distA > V15_ROPE_SPRING
    ) {
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
    const ax = P.x + PW / 2;
    const ay = P.y + PH / 2;
    const bx = r.x + PW / 2;
    const by = r.y + PH / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const d = Math.hypot(dx, dy);
    if (d > V15_ROPE_MAX && d > 1) {
      if (meGrounded && partnerGrounded && Math.abs(r.tvy || 0) < 2) continue;
      if (meGrounded && !partnerGrounded && (input.d || rescueRatio >= 0.95)) continue;
      const nx = dx / d;
      const ny = dy / d;
      const share =
        !meGrounded && (partnerGrounded || bestAnchor)
          ? 0.98
          : meGrounded
          ? 0.35
          : 0.75;
      const over = (d - V15_ROPE_MAX) * share;
      if (nearSolids(P.x + nx * over, P.y, PW, PH).length === 0) P.x += nx * over;
      if (nearSolids(P.x, P.y + ny * over, PW, PH).length === 0) P.y += ny * over;
      const vRad = P.vx * nx + P.vy * ny;
      if (vRad < 0) {
        P.vx -= nx * vRad * 1.42;
        P.vy -= ny * vRad * 1.48;
      }
    }
  }
}

function hangingFriend(P) {
  let best = null;
  let bd = 1e9;
  for (const r of G.remotes.values()) {
    if (r.dead || (r.onGround && !r.ropeOn) || r.y < P.y + 14) continue;
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    if (d > 220 || d < 25) continue;
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  return best;
}

function drawTether() {
  if (G.mode !== 'coop' || !G.remotes.size) return;
  const mq = ipos(G.me);
  const ents = [{ slot: G.myslot, x: mq.x, y: mq.y, dead: G.me.dead }];
  for (const r of G.remotes.values()) {
    const rq = ipos(r);
    ents.push({ slot: r.slot, x: rq.x, y: rq.y, dead: r.dead });
  }
  ents.sort((a, b) => a.slot - b.slot);
  for (let i = 0; i < ents.length - 1; i++) {
    const a = ents[i];
    const b = ents[i + 1];
    if (a.dead || b.dead) continue;
    const ax = a.x + PW / 2;
    const ay = a.y + PH * 0.55;
    const bx = b.x + PW / 2;
    const by = b.y + PH * 0.55;
    const d = Math.hypot(bx - ax, by - ay);
    const slack = Math.max(0, V15_ROPE_REST - d);
    const sag = slack * 0.4;
    const tension = clamp((d - V15_ROPE_REST) / 36, 0, 1);
    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.slot % COLORS.length]);
    grad.addColorStop(1, COLORS[b.slot % COLORS.length]);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const coils = 8;
    const ux = (bx - ax) / Math.max(1, d);
    const uy = (by - ay) / Math.max(1, d);
    const px = -uy;
    const py = ux;
    const amp = tension > 0.05 ? 3.5 + tension * 4.5 : 0;
    ctx.strokeStyle = 'rgba(40,15,45,.72)';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    if (amp > 0) {
      for (let k = 1; k < coils; k++) {
        const u = k / coils;
        const side = (k % 2 ? 1 : -1) * amp;
        ctx.lineTo(lerp(ax, bx, u) + px * side, lerp(ay, by, u) + py * side);
      }
      ctx.lineTo(bx, by);
    } else {
      ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by);
    }
    ctx.stroke();
    ctx.strokeStyle =
      tension > 0.15
        ? 'rgb(255,' +
          Math.round(215 - tension * 155) +
          ',' +
          Math.round(90 - tension * 70) +
          ')'
        : grad;
    ctx.lineWidth = 3.8;
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================================
// 8. ĐỒ HỌA ĐỊA HÌNH, ĐÁ CUỘI 3D, HỐ NƯỚC BƠI QUA ĐƯỢC & VẼ NHÂN VẬT ANIME
// ============================================================================
drawSolid = function (L, s) {
  if (s.ice || L.biome === 'ice') {
    drawIceSolid(L, s);
    return;
  }
  const x = s[0];
  const y = s[1];
  const w = s[2];
  const h = s[3];
  const T = G.lt;
  const biome = L.biome || 'normal';

  if (biome === 'toxic') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, '#1b4332');
    gr.addColorStop(0.5, '#081c15');
    gr.addColorStop(1, '#040d0a');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(128,237,153,.12)';
    for (let px = x + 18; px < x + w - 18; px += 58) {
      ctx.fillRect(px, y + 26 + ((px * 7) % 45), 18, 5);
    }
    ctx.fillStyle = '#7209b7';
    rr(x - 3, y - 5, w + 6, 17, 6);
    ctx.fill();
    ctx.fillStyle = '#80ed99';
    rr(x - 3, y - 5, w + 6, 8, 4);
    ctx.fill();
    for (let px = x + 22; px < x + w - 20; px += 52) {
      const drip = (T * 24 + px) % 18;
      ctx.fillStyle = '#80ed99';
      ctx.beginPath();
      ctx.arc(px, y + 8 + drip, 2.6, 0, 6.3);
      ctx.fill();
    }
    return;
  }
  if (biome === 'heaven') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.45, '#e0f2fe');
    gr.addColorStop(1, '#bae6fd');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    for (let px = x + 20; px < x + w - 20; px += 44) {
      ctx.beginPath();
      ctx.arc(px, y + 18, 12, 0, 6.3);
      ctx.fill();
    }
    ctx.fillStyle = '#eab308';
    rr(x - 3, y - 5, w + 6, 16, 7);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    rr(x - 3, y - 5, w + 6, 8, 5);
    ctx.fill();
    return;
  }
  if (biome === 'hell') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
    gr.addColorStop(0, '#2a0808');
    gr.addColorStop(0.5, '#170404');
    gr.addColorStop(1, '#090101');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#991b1b';
    rr(x - 3, y - 5, w + 6, 16, 6);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    rr(x - 3, y - 5, w + 6, 7, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,120,0,.45)';
    ctx.lineWidth = 2;
    for (let px = x + 28; px < x + w - 24; px += 76) {
      ctx.beginPath();
      ctx.moveTo(px, y + 6);
      ctx.lineTo(px + 12, y + 26);
      ctx.lineTo(px + 4, y + 48);
      ctx.stroke();
    }
    return;
  }
  if (biome === 'water') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
    gr.addColorStop(0, '#16425b');
    gr.addColorStop(0.4, '#0f2c3f');
    gr.addColorStop(1, '#071722');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#1b6ca8';
    rr(x - 3, y - 5, w + 6, 16, 6);
    ctx.fill();
    ctx.fillStyle = '#48cae4';
    rr(x - 3, y - 5, w + 6, 7, 4);
    ctx.fill();
    for (let px = x + 18; px < x + w - 18; px += 48) {
      const sway = Math.sin(T * 3 + px * 0.05) * 5;
      ctx.strokeStyle = px % 96 === 0 ? '#ff5d8f' : '#00f5d4';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px, y - 3);
      ctx.quadraticCurveTo(px + sway, y - 14, px + sway * 1.4, y - 24);
      ctx.stroke();
    }
    return;
  }
  if (biome === 'space') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, '#232738');
    gr.addColorStop(1, '#0b0d14');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#343a40';
    rr(x - 3, y - 5, w + 6, 15, 4);
    ctx.fill();
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(x - 2, y - 4, w + 4, 4);
    return;
  }

  const sh = curEnv ? curEnv.solidHue : L.hue + 25;
  const gh = curEnv ? curEnv.grassHue : 105;
  const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 280));
  gr.addColorStop(0, hsl(sh, 38, 56));
  gr.addColorStop(1, hsl(sh, 38, 32));
  ctx.fillStyle = gr;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  for (let px = x + 18; px < x + w - 10; px += 56) {
    ctx.fillRect(px, y + 30 + ((px * 7) % 40), 14, 5);
  }
  ctx.fillStyle = 'rgba(0,0,0,.10)';
  for (let px = x + 40; px < x + w - 20; px += 90) {
    ctx.fillRect(px, y + 70 + ((px * 5) % 60), 22, 6);
  }
  ctx.fillStyle = hsl(gh, 52, 40);
  rr(x - 3, y - 5, w + 6, 19, 7);
  ctx.fill();
  ctx.fillStyle = hsl(gh, 60, 56);
  rr(x - 3, y - 5, w + 6, 9, 5);
  ctx.fill();
  ctx.fillStyle = hsl(gh, 62, 50);
  for (let px = x + 6; px < x + w - 4; px += 22) {
    const bh = 5 + ((px * 13) % 7);
    ctx.beginPath();
    ctx.moveTo(px, y - 4);
    ctx.lineTo(px + 3, y - 4 - bh);
    ctx.lineTo(px + 6, y - 4);
    ctx.fill();
  }
  if (h > 100) {
    for (let px = x + 40; px < x + w - 20; px += 170 + ((px * 7) % 90)) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, y - 9, 3.2, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(px, y - 9, 1.5, 0, 6.3);
      ctx.fill();
    }
  }
};

function drawNaturalStoneBoulder(cx, cy, r, rot, isLava) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  const pts = 24;
  ctx.beginPath();
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rad = r * (0.97 + 0.03 * Math.sin(i * 3) + 0.02 * Math.cos(i * 5));
    const vx = Math.cos(a) * rad;
    const vy = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();

  const biome = (G.L && G.L.biome) || 'normal';
  const gr = ctx.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.08, 0, 0, r * 1.02);
  if (biome === 'ice') {
    gr.addColorStop(0, '#e0f2fe');
    gr.addColorStop(0.5, '#7dd3fc');
    gr.addColorStop(1, '#0369a1');
  } else if (biome === 'hell') {
    gr.addColorStop(0, '#7f1d1d');
    gr.addColorStop(0.55, '#450a0a');
    gr.addColorStop(1, '#180404');
  } else {
    gr.addColorStop(0, '#cbd5e1');
    gr.addColorStop(0.52, '#64748b');
    gr.addColorStop(1, '#1e293b');
  }
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = biome === 'ice' ? '#0c4a6e' : '#0f172a';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.84, -2.4, -1.1);
  ctx.stroke();

  const craters = [
    [-0.32, -0.22, 0.22],
    [0.28, 0.26, 0.19],
    [-0.18, 0.36, 0.14],
    [0.25, -0.32, 0.13],
  ];
  for (const [ox, oy, cr] of craters) {
    ctx.fillStyle = 'rgba(15,23,42,.28)';
    ctx.beginPath();
    ctx.arc(r * ox, r * oy, r * cr, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    ctx.beginPath();
    ctx.arc(r * ox - 1.5, r * oy - 1.5, r * cr * 0.7, 0, 6.3);
    ctx.fill();
  }

  ctx.strokeStyle =
    biome === 'toxic'
      ? 'rgba(128,237,153,.65)'
      : biome === 'ice'
      ? 'rgba(255,255,255,.6)'
      : isLava
      ? 'rgba(251,146,60,.65)'
      : 'rgba(15,23,42,.45)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.42, 0.4, 2.5);
  ctx.moveTo(-r * 0.45, 0);
  ctx.quadraticCurveTo(-r * 0.1, r * 0.08, r * 0.35, -r * 0.18);
  ctx.stroke();
  ctx.restore();
}

drawBoulder = function (b, bcx, brot) {
  drawNaturalStoneBoulder(bcx, b.y - b.r, b.r, brot, true);
};
drawFerry = function (t) {
  const a = G.alpha === undefined ? 1 : G.alpha;
  const cx = t.cx - (t.dx || 0) * (1 - a);
  drawNaturalStoneBoulder(cx, t.cy, t.R, t.rot + ((t.dx || 0) * (a - 1)) / t.R, false);
};
drawRocks = function (L, lt) {
  for (const r of L.rocks || []) {
    const p = rockAt(r, lt);
    if (p) drawNaturalStoneBoulder(p.x, p.y, r.r, p.rot, true);
  }
};

drawSpikesRaw = function (s) {
  if (s.w < 10) return;
  const L = G.L;
  const T = G.lt;
  const biome = (L && L.biome) || 'normal';
  const isPit = s.pit || s.y >= ((L && L.h) || WORLD_H) - 45;

  if (s.swimPit) {
    const waterTop = GY + 24;
    const gr = ctx.createLinearGradient(0, waterTop, 0, s.y + s.h + 40);
    gr.addColorStop(0, 'rgba(56,189,248,.78)');
    gr.addColorStop(0.4, 'rgba(2,132,199,.88)');
    gr.addColorStop(1, 'rgba(12,74,110,.96)');
    ctx.save();
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.h + 40);
    for (let px = s.x; px <= s.x + s.w; px += 16) {
      ctx.lineTo(px, waterTop + Math.sin(T * 3.6 + px * 0.035) * 4);
    }
    ctx.lineTo(s.x + s.w, s.y + s.h + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(224,242,254,.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = s.x; px <= s.x + s.w; px += 16) {
      const wy = waterTop + Math.sin(T * 3.6 + px * 0.035) * 4;
      if (px === s.x) ctx.moveTo(px, wy);
      else ctx.lineTo(px, wy);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (isPit) {
    if (biome === 'toxic') {
      const gr = ctx.createLinearGradient(0, s.y - 6, 0, s.y + s.h + 30);
      gr.addColorStop(0, '#80ed99');
      gr.addColorStop(0.35, '#38b000');
      gr.addColorStop(1, '#3c096c');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h + 30);
      for (let px = s.x; px <= s.x + s.w; px += 18) {
        ctx.lineTo(px, s.y + Math.sin(T * 4.5 + px * 0.04) * 4);
      }
      ctx.lineTo(s.x + s.w, s.y + s.h + 30);
      ctx.closePath();
      ctx.fill();
      return;
    }
    if (biome === 'hell') {
      const gr = ctx.createLinearGradient(0, s.y - 6, 0, s.y + s.h + 30);
      gr.addColorStop(0, '#fde047');
      gr.addColorStop(0.3, '#f97316');
      gr.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h + 30);
      for (let px = s.x; px <= s.x + s.w; px += 18) {
        ctx.lineTo(px, s.y + Math.sin(T * 3.8 + px * 0.03) * 5);
      }
      ctx.lineTo(s.x + s.w, s.y + s.h + 30);
      ctx.closePath();
      ctx.fill();
      return;
    }
  }

  const n = Math.max(1, Math.round(s.w / 20));
  const tw = s.w / n;
  const up = s.dir === 'up';
  const baseY = up ? s.y + s.h - 5 : s.y;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(s.x, baseY, s.w, 5);
  const tipCol = biome === 'toxic' ? '#80ed99' : biome === 'ice' ? '#38bdf8' : '#ef4444';
  for (let i = 0; i < n; i++) {
    const x = s.x + i * tw;
    const mx = x + tw / 2;
    const tipY = up ? s.y - 2 : s.y + s.h + 2;
    const rootY = up ? s.y + s.h - 4 : s.y + 4;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(x + 1, rootY);
    ctx.lineTo(mx, tipY);
    ctx.lineTo(mx, rootY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(mx, rootY);
    ctx.lineTo(mx, tipY);
    ctx.lineTo(x + tw - 1, rootY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tipCol;
    const midY = lerp(tipY, rootY, 0.28);
    ctx.beginPath();
    ctx.moveTo(lerp(x + 1, mx, 0.72), midY);
    ctx.lineTo(mx, tipY);
    ctx.lineTo(lerp(x + tw - 1, mx, 0.72), midY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 1, rootY);
    ctx.lineTo(mx, tipY);
    ctx.lineTo(x + tw - 1, rootY);
    ctx.stroke();
  }
};

function v18IsInSwimPit(P, L) {
  if (!P || !L) return false;
  if (L.biome === 'water') return true;
  const cx = P.x + PW / 2;
  const feet = P.y + PH;
  for (const s of L.spikes || []) {
    if (s.swimPit && cx >= s.x && cx <= s.x + s.w && feet >= GY + 18) return true;
  }
  return false;
}

const _origDrawBunnyV10 = drawBunny;
drawBunny = function (x, y, o) {
  const L = G.L;
  const skin = o.skin || 'classic';
  const customCfg = CUSTOM_SKINS.get(skin);
  const inWater = !!(L && (L.biome === 'water' || v18IsInSwimPit({ x, y }, L)));
  const face = o.face >= 0 ? 1 : -1;
  const vx = o.vx || 0;
  const vy = o.vy || 0;
  const sq = clamp(o.sq || 0, -0.4, 0.4);
  const run = o.ground && Math.abs(vx) > 0.8;
  const air = !o.ground;
  const ph = (o.runT || 0) * 3;
  const bob = run ? -Math.abs(Math.sin(ph)) * 2.4 : 0;

  let gDir = 1;
  if (L && L.gravZones) {
    for (const gz of L.gravZones) {
      if (x + PW / 2 >= gz.x0 && x + PW / 2 <= gz.x1) {
        gDir = -1;
        break;
      }
    }
  }

  ctx.save();
  if (gDir < 0) {
    const cy = y + PH / 2;
    ctx.translate(0, cy * 2);
    ctx.scale(1, -1);
  }
  if (inWater && (!o.ground || Math.abs(vx) > 0.35)) {
    const cx = x + PW / 2;
    const cy = y + PH / 2;
    const tilt = face * 1.12 + clamp(vy * 0.04, -0.4, 0.4) * face;
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.translate(-cx, -cy);
  }

  if (customCfg && typeof customCfg.renderCharacter === 'function') {
    ctx.save();
    if (o.inv && Math.floor(G.lt * 14) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.translate(x + PW / 2, y + PH);
    const vs = o.ground ? 0 : clamp(Math.abs(vy) * 0.011, 0, 0.17);
    ctx.scale(face * (1 + sq * 0.6 - vs * 0.45), 1 - sq + vs);
    ctx.rotate(run ? 0.07 : air ? clamp(vy * 0.014, -0.18, 0.18) : 0);
    customCfg.renderCharacter(ctx, { x, y, o, bob, ph, run, air, vx, vy, face, T: G.lt });
    ctx.restore();

    if (typeof customCfg.renderWorldFX === 'function') {
      customCfg.renderWorldFX(ctx, x, y, o);
    }
    if (G.me && o.slot === G.myslot) {
      v19DrawSkillShots(ctx);
    }
    if (o.shield) {
      ctx.save();
      const pul = 1 + Math.sin(G.lt * 6) * 0.04;
      ctx.strokeStyle = 'rgba(120,220,255,.9)';
      ctx.fillStyle = 'rgba(120,220,255,.2)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x + PW / 2, y + PH / 2, 24 * pul, 27 * pul, 0, 0, 6.3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (o.name) {
      ctx.font = '700 12px sans-serif';
      ctx.textAlign = 'center';
      const w = ctx.measureText(o.name).width + 10;
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      rr(x + PW / 2 - w / 2, y - 48, w, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillText(o.name, x + PW / 2, y - 36);
    }
    ctx.restore();
    return;
  }

  _origDrawBunnyV10(x, y, o);
  if (G.me && o.slot === G.myslot) v19DrawSkillShots(ctx);
  ctx.restore();
};

// ============================================================================
// 9. SỬA TRIỆT ĐỂ LỖI CỬA CHẠY (MÀN 94) & LỖI CHECKPOINT ĐẢO CHIỀU (MÀN 97)
// ============================================================================
// Ghi đè seg.trollDoor và seg.leapDoor:
// 1. KHÔNG đặt nút khóa cửa (t.btn) ở ngay bệ nhảy đầu tiên để tránh người chơi vô tình dẫm trúng làm cửa đứng im!
// 2. Khóa cứng e.lock = true ngay từ lúc khởi tạo màn chơi và kích hoạt chạy trốn ngay khi lại gần 240px!
seg.trollDoor = function (b, o) {
  o = o || {};
  const mode = o.mode === 'sink' ? 'sink' : 'run';
  const x0 = b.ground(820);
  const gy = b.gy;
  b.key = { x: x0 + 280, y: gy - 56 };
  b.flag(x0 + 45);
  b.solids.push([x0 + 70, gy - 88, 104, 18]);
  b.coin(x0 + 122, gy - 88 - 52);

  // Nút khóa cửa bí mật được giấu ở tít trên cao phía sau cửa (chỉ ai chủ động tìm mới chạm tới, không bao giờ dẫm nhầm!)
  const btn = { x: x0 + 760, y: gy - 260, w: 44, h: 10 };
  const decoy = { x: x0 + 670, y: gy - 74, w: 54, h: 74, lock: true };
  const GAP = 115;
  const hops = [
    [-30, 175],
    [-70, 150],
    [-25, 150],
    [-68, 165],
    [-35, 340],
  ];
  let cx = b.x;
  b.spikes.push({
    x: cx,
    y: WORLD_H - 26,
    w: hops.reduce((s, h) => s + h[1] + GAP, 0),
    h: 26,
    dir: 'up',
    pit: true,
  });
  let lastTop = gy;
  let lastX = cx;
  hops.forEach(([dy, w], i) => {
    cx += GAP;
    b.solids.push([cx, gy + dy, w, 22]);
    if (i === 0) b.flags.push({ x: cx + 85, y: gy + dy });
    if (i === 1 || i === 3) b.coin(cx + w / 2, gy + dy - 56);
    lastTop = gy + dy;
    lastX = cx;
    cx += w;
  });
  const dest = { x: lastX + 220, y: lastTop - 74 };
  b.x = cx + 80;
  b.exitOv = decoy;
  b.traps.push({
    k: 'door',
    mode,
    btn,
    ex0: decoy.x,
    ey0: decoy.y,
    dx: dest.x,
    dy: dest.y,
    st: 0,
    t: 0,
    dur: mode === 'sink' ? 1.35 : 1.15,
  });
  return x0;
};

seg.leapDoor = function (b) {
  const x0 = b.ground(1640);
  const gy = b.gy;
  b.key = { x: x0 + 240, y: gy - 56 };
  b.flag(x0 + 45);
  const e0 = { x: x0 + 620, y: gy - 74, w: 54, h: 74, lock: true };
  b.exitOv = e0;
  b.traps.push({
    k: 'door2',
    mode: 'leap',
    ex0: e0.x,
    ey0: e0.y,
    hop: 275,
    hops: 3,
    n: 0,
    st: 0,
    t: 0,
    dur: 0.72,
    from: e0.x,
  });
  return x0;
};

// Sửa updateV11Trap để cửa leapDoor (door2) luôn khóa khi chưa nhảy đủ 3 lần và nhạy hơn (230px):
const _origUpdateV11Trap = updateV11Trap;
updateV11Trap = function (t, i, me, bodies) {
  if (t.k === 'door2') {
    const L = G.L;
    const e = L.exit;
    const alive = !me.dead && !G.won;
    const cx = me.x + PW / 2;
    if (t.st === 0) {
      if (t.n < t.hops) e.lock = true;
      if (
        G.keyGot &&
        alive &&
        t.n < t.hops &&
        Math.abs(cx - (e.x + e.w / 2)) < 230 &&
        Math.abs(me.y + PH / 2 - (e.y + e.h / 2)) < 260
      ) {
        trapSend(i, 'flee', 0);
      }
    } else if (t.st === 1) {
      t.t += STEP;
      const u = clamp(t.t / t.dur, 0, 1);
      const k = u * u * (3 - 2 * u);
      e.x = lerp(t.from, t.from + t.hop, k);
      e.y = t.ey0 - Math.sin(u * Math.PI) * 105;
      e.lock = true;
      e.legs = true;
      if (u >= 1) {
        t.n++;
        e.x = t.from + t.hop;
        e.y = t.ey0;
        e.legs = false;
        Snd.slam();
        puff(e.x + e.w / 2, e.y + e.h, 12, '#fff', 1.5);
        if (t.n >= t.hops) {
          t.st = 3;
          e.lock = false;
        } else {
          t.st = 0;
          t.from = e.x;
          e.lock = true;
        }
      }
    }
    return;
  }
  return _origUpdateV11Trap(t, i, me, bodies);
};

// ============================================================================
// 10. BỘ QUÉT SỬA LỖI ĐỊA HÌNH TOÀN CỤC & VÒNG LẶP VẬT LÝ STEPPLAYER / DIE
// ============================================================================
function v15SanitizeLevel(lv) {
  if (!lv) return lv;
  const H = lv.h || WORLD_H;
  const movingSolidIndices = new Set();
  for (const tr of lv.traps || []) {
    if (tr.si !== undefined) {
      movingSolidIndices.add(tr.si);
      if (lv.solids[tr.si]) lv.solids[tr.si].isVehicle = true;
    }
    if (tr.k === 'door' || tr.k === 'door2') {
      if (lv.exit) lv.exit.lock = true;
    }
  }
  for (const ph of lv.phantoms || []) {
    if (ph.si !== undefined) {
      movingSolidIndices.add(ph.si);
      if (lv.solids[ph.si]) lv.solids[ph.si].isVehicle = true;
    }
  }

  const deepWalls = [];
  for (let i = 0; i < (lv.solids || []).length; i++) {
    if (movingSolidIndices.has(i)) continue;
    const s = lv.solids[i];
    if (!s.bonk && !s.isVehicle && s[1] + s[3] >= H - 38 && s[3] >= 90) {
      deepWalls.push([s[0] - 4, s[0] + s[2] + 4]);
    }
  }

  const surfaceKeepOuts = [];
  if (lv.spawn) {
    surfaceKeepOuts.push([
      lv.spawn[0] - 65,
      lv.spawn[0] + PW + 65,
      lv.spawn[1] - 40,
      lv.spawn[1] + PH + 40,
    ]);
  }
  for (const sp of lv.springs || []) {
    surfaceKeepOuts.push([sp.x - 16, sp.x + sp.w + 16, sp.y - 30, sp.y + sp.h + 20]);
  }
  for (const pl of lv.plates || []) {
    surfaceKeepOuts.push([pl.x - 14, pl.x + pl.w + 14, pl.y - 25, pl.y + pl.h + 15]);
  }
  for (const gt of lv.gates || []) {
    surfaceKeepOuts.push([gt.x - 16, gt.x + gt.w + 16, gt.y - 10, gt.y + gt.h + 15]);
  }

  // Đảm bảo 100% Cờ Checkpoint luôn cắm chặt trên mặt đất cố định (không bao giờ lơ lửng ở màn Đảo Chiều!):
  for (const f of lv.flags || []) {
    let validGround = false;
    for (let i = 0; i < (lv.solids || []).length; i++) {
      if (movingSolidIndices.has(i)) continue;
      const s = lv.solids[i];
      if (s.bonk || s.isVehicle || s[3] < 80 || s[2] < 110) continue;
      if (f.x >= s[0] + 22 && f.x <= s[0] + s[2] - 22 && Math.abs(f.y - s[1]) <= 16) {
        f.y = s[1];
        validGround = true;
        break;
      }
    }
    if (!validGround) {
      let bestDist = 1e9;
      for (let i = 0; i < (lv.solids || []).length; i++) {
        if (movingSolidIndices.has(i)) continue;
        const s = lv.solids[i];
        if (s.bonk || s.isVehicle || s[3] < 80 || s[2] < 120 || s[1] < 100 || s[1] > H - 40) {
          continue;
        }
        const cx = clamp(f.x, s[0] + 36, s[0] + s[2] - 36);
        const d = Math.hypot(cx - f.x, s[1] - f.y);
        if (d < bestDist) {
          bestDist = d;
          f.x = cx;
          f.y = s[1];
        }
      }
    }
    surfaceKeepOuts.push([f.x - 62, f.x + 62, f.y - 80, f.y + 20]);
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
  let pitIdx = 0;
  for (const spk of lv.spikes || []) {
    if (spk.bt !== undefined) {
      cleanSpikes.push(spk);
      continue;
    }
    const isPit = spk.pit || spk.y >= H - 45;
    const cuts = isPit
      ? deepWalls
      : surfaceKeepOuts
          .filter((ko) => spk.y + spk.h >= ko[2] && spk.y <= ko[3])
          .map((ko) => [ko[0], ko[1]]);
    for (const [x0, x1] of subtractIntervals(spk.x, spk.x + spk.w, cuts)) {
      const piece = Object.assign({}, spk, { x: x0, w: x1 - x0 });
      if (isPit && lv.biome !== 'hell' && lv.biome !== 'toxic' && pitIdx++ % 2 === 0) {
        piece.swimPit = true;
      }
      cleanSpikes.push(piece);
    }
  }
  lv.spikes = cleanSpikes;

  const safePoints = [[lv.spawn[0] + PW / 2, lv.spawn[1] + PH / 2]];
  for (const f of lv.flags || []) safePoints.push([f.x, f.y - PH / 2]);
  if (lv.lasers) {
    lv.lasers = lv.lasers.filter((ls) =>
      safePoints.every(([sx, sy]) => Math.hypot(ls.x - sx, ls.y - sy) > ls.len + 60)
    );
  }
  if (lv.pendulums) {
    lv.pendulums = lv.pendulums.filter((pd) =>
      safePoints.every(([sx, sy]) => Math.abs(pd.x - sx) > 115)
    );
  }
  if (lv.blackHoles) {
    lv.blackHoles = lv.blackHoles.filter((bh) =>
      safePoints.every(([sx, sy]) => Math.hypot(bh.x - sx, bh.y - sy) > bh.pullR + 35)
    );
  }
  return lv;
}

function hazardCheck(P) {
  const L = G.L;
  const hx = P.x + 4;
  const hy = P.y + 5;
  const hw = PW - 8;
  const hh = PH - 8;
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;

  for (const s of L.spikes) {
    if (s.hid || s.swimPit) continue;
    const isPit = s.pit || s.y >= WORLD_H - 42;
    if (G.mode === 'coop' && isPit && !P.onGround) {
      const st = v15GetSquadLinks(P);
      if (st && st.bestAnchor && st.bestAnchor.y < P.y - 18) {
        P.y = Math.min(P.y, s.y - PH - 14);
        if (P.vy > 0) P.vy = -7.5;
        continue;
      }
    }
    if (
      isPit &&
      L.biome === 'toxic' &&
      (curPassive === 'antidote' || curPassive === 'limitless' || curPassive === 'nika')
    ) {
      P.y = Math.min(P.y, s.y - PH - 4);
      P.vy = -11.5;
      continue;
    }
    let sy = s.dir === 'up' ? s.y + 7 : s.y;
    let sh = s.h - 7;
    if (s.bt !== undefined) {
      if (!s.live) continue;
      const k = clamp(s.ph, 0, 1);
      sy = s.y + s.h * (1 - k) + 7;
      sh = s.h * k - 7;
      if (sh <= 0) continue;
    }
    if (rectsOverlap(hx, hy, hw, hh, s.x + 3, sy, s.w - 6, sh)) return 'spikes';
  }
  for (const ls of L.lasers || []) {
    const ang = G.lt * ls.spd + (ls.off || 0);
    for (let b = 0; b < (ls.blades || 2); b++) {
      const a = ang + (b * Math.PI * 2) / (ls.blades || 2);
      const x1 = ls.x + Math.cos(a) * ls.len;
      const y1 = ls.y + Math.sin(a) * ls.len;
      const dx = x1 - ls.x;
      const dy = y1 - ls.y;
      const len2 = dx * dx + dy * dy;
      const u = clamp(((cx - ls.x) * dx + (cy - ls.y) * dy) / Math.max(1, len2), 0, 1);
      if (Math.hypot(cx - (ls.x + u * dx), cy - (ls.y + u * dy)) < 13) return 'laser';
    }
  }
  for (const pd of L.pendulums || []) {
    const th = Math.sin(G.lt * pd.spd + pd.off) * 1.05;
    const bx = pd.x + Math.sin(th) * pd.len;
    const by = pd.y + Math.cos(th) * pd.len;
    if (circleHitsRect(bx, by, pd.r - 4, hx, hy, hw, hh)) return 'pendulum';
  }
  for (const c of L.crushers) {
    if (rectsOverlap(hx, hy, hw, hh, c.x + 2, c.cb - c.h, c.w - 4, c.h)) return 'crusher';
  }
  for (const b of L.boulders) {
    const bx = b.cx;
    const by = b.y - b.r;
    if (Math.hypot(bx - clamp(bx, hx, hx + hw), by - clamp(by, hy, hy + hh)) < b.r - 4) {
      return 'boulder';
    }
  }
  for (const s of L.sweepers) {
    if (hx < s.cx + s.w - 10) return 'wall';
  }
  for (const r of L.risers || []) {
    if (hy + hh > r.cy + 6) return 'wall';
  }
  for (const q of L.stalactites || []) {
    if (q.st === 2 && rectsOverlap(hx, hy, hw, hh, q.x + 6, q.y + q.fy, q.w - 12, q.h)) {
      return 'stalactite';
    }
  }
  for (const f of L.meteors || []) {
    const m = meteorAt(f, G.lt);
    if (m.fly) {
      if (circleHitsRect(m.x, m.y, 15, hx, hy, hw, hh)) return 'meteor';
    } else if (m.age - m.T < 0.3 && circleHitsRect(m.ix, f.gy - 10, 42, hx, hy, hw, hh)) {
      return 'meteor';
    }
  }
  for (const t of L.traps || []) {
    if (t.k !== 'arena' || t.st !== 1) continue;
    const tt = G.lt - t.t0;
    for (let j = 0; j < t.saws.length; j++) {
      const p = sawPos(t, j, tt);
      if (circleHitsRect(p.x, p.y, t.saws[j].r - 3, hx, hy, hw, hh)) return 'saw';
    }
  }
  const vh = v11Hazard(hx, hy, hw, hh);
  if (vh) return vh;
  if (P.y > (L.h || WORLD_H) + 90 || (P.gDir < 0 && P.y < -120)) return 'fall';
  return null;
}

drawTraps = function (L) {
  const T = G.lt;
  for (const gz of L.gravZones || []) {
    ctx.save();
    const gr = ctx.createLinearGradient(0, gz.y0, 0, gz.y1);
    gr.addColorStop(0, 'rgba(190,90,255,.28)');
    gr.addColorStop(0.5, 'rgba(90,210,255,.10)');
    gr.addColorStop(1, 'rgba(190,90,255,.28)');
    ctx.fillStyle = gr;
    ctx.fillRect(gz.x0, gz.y0, gz.x1 - gz.x0, gz.y1 - gz.y0);
    ctx.fillStyle = 'rgba(220,190,255,.65)';
    for (let x = gz.x0 + 40; x < gz.x1 - 20; x += 65) {
      const yOff = (T * 110 + x * 3) % Math.max(60, gz.y1 - gz.y0);
      ctx.beginPath();
      ctx.arc(x, gz.y1 - yOff, 3, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const ph of L.phantoms || []) {
    ctx.save();
    ctx.globalAlpha = ph.alpha || 0.5;
    ctx.fillStyle = ph.solid ? '#38bdf8' : '#f43f5e';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    rr(ph.x, ph.y, ph.w, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const cv of L.conveyors || []) {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    rr(cv.x, cv.y, cv.w, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = cv.spd > 0 ? '#38bdf8' : '#f97316';
    const dir = cv.spd > 0 ? 1 : -1;
    const stepOff = ((T * Math.abs(cv.spd) * 45) % 28) * dir;
    for (let px = cv.x + 14; px < cv.x + cv.w - 14; px += 28) {
      const ax = px + stepOff;
      ctx.beginPath();
      ctx.moveTo(ax - 5 * dir, cv.y + 4);
      ctx.lineTo(ax + 5 * dir, cv.y + 9);
      ctx.lineTo(ax - 5 * dir, cv.y + 14);
      ctx.fill();
    }
    ctx.restore();
  }
  for (const bh of L.blackHoles || []) {
    ctx.save();
    ctx.translate(bh.x, bh.y);
    const rg = ctx.createRadialGradient(0, 0, bh.killR * 0.3, 0, 0, bh.pullR);
    rg.addColorStop(0, 'rgba(0,0,0,1)');
    rg.addColorStop(0.25, 'rgba(139,92,246,.85)');
    rg.addColorStop(0.55, 'rgba(56,189,248,.25)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, bh.pullR, 0, 6.3);
    ctx.fill();
    ctx.rotate(-T * 4.5);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(0, 0, bh.killR + k * 6, k * 1.5, k * 1.5 + 1.8);
      ctx.stroke();
    }
    ctx.fillStyle = '#030712';
    ctx.beginPath();
    ctx.arc(0, 0, bh.killR * 0.85, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }
  for (const ls of L.lasers || []) {
    const ang = T * ls.spd + (ls.off || 0);
    ctx.save();
    for (let b = 0; b < (ls.blades || 2); b++) {
      const a = ang + (b * Math.PI * 2) / (ls.blades || 2);
      const x1 = ls.x + Math.cos(a) * ls.len;
      const y1 = ls.y + Math.sin(a) * ls.len;
      ctx.strokeStyle = 'rgba(244,63,94,.32)';
      ctx.lineWidth = 11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ls.x, ls.y, 13, 0, 6.3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const pd of L.pendulums || []) {
    const th = Math.sin(T * pd.spd + pd.off) * 1.05;
    const bx = pd.x + Math.sin(th) * pd.len;
    const by = pd.y + Math.cos(th) * pd.len;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(pd.x, pd.y);
    ctx.lineTo(bx, by);
    ctx.stroke();
    drawSaw(bx, by, pd.r, T * 1.5);
  }
  for (const trt of L.turrets || []) {
    ctx.save();
    if (trt.charge > 0.2) {
      const ratio = clamp(trt.charge / trt.period, 0, 1);
      ctx.strokeStyle =
        trt.fireT > 0 ? '#ffffff' : 'rgba(255,23,68,' + (0.2 + ratio * 0.75).toFixed(2) + ')';
      ctx.lineWidth = trt.fireT > 0 ? 7 : 2;
      ctx.beginPath();
      ctx.moveTo(trt.x, trt.y);
      ctx.lineTo(
        trt.x + Math.cos(trt.ang || 0) * 600,
        trt.y + Math.sin(trt.ang || 0) * 600
      );
      ctx.stroke();
    }
    ctx.translate(trt.x, trt.y);
    ctx.rotate(trt.ang || 0);
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, 6.3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const pt of L.portals || []) {
    [
      [pt.x0, pt.y0, '#00ffe0'],
      [pt.x1, pt.y1, '#ff2bd6'],
    ].forEach(([px, py, col]) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(T * 4);
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 32, 0, 0, 6.3);
      ctx.stroke();
      ctx.restore();
    });
  }
  if (!G.keyGot) {
    for (const dc of L.decoys || []) {
      if (!dc.boom) drawKeyIcon(dc.x, dc.y, T + 1.5);
    }
  }
  for (const sh of L.sharks || []) {
    ctx.save();
    ctx.translate(sh.cx, sh.cy);
    ctx.scale(sh.dir || 1, 1);
    const wag = Math.sin(T * 14) * 8;
    ctx.fillStyle = '#1e3a5f';
    ctx.strokeStyle = '#051321';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.quadraticCurveTo(20, -30, -44, -9);
    ctx.lineTo(-72, -26 + wag);
    ctx.lineTo(-56, 0);
    ctx.lineTo(-70, 24 + wag);
    ctx.lineTo(-44, 10);
    ctx.quadraticCurveTo(15, 28, 60, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(36, -7, 4.5, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }
  for (const t of L.traps || []) {
    if (t.k === 'fake') {
      for (const f of t.plates) drawPlate(f);
    } else if (t.k === 'ceil') {
      drawCeil(t);
    } else if (t.k === 'ferry') {
      drawFerry(t);
    } else if (t.k === 'arena' && t.st === 1) {
      const tt = G.lt - t.t0;
      for (let j = 0; j < t.saws.length; j++) {
        const p = sawPos(t, j, tt);
        drawSaw(p.x, p.y, t.saws[j].r, G.lt);
      }
    } else if (t.k === 'sled' && t.st !== 2) {
      ctx.save();
      const biome = L.biome || 'normal';
      ctx.fillStyle =
        biome === 'toxic'
          ? '#52b788'
          : biome === 'hell'
          ? '#991b1b'
          : biome === 'heaven'
          ? '#fef08a'
          : '#7fd8ff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      rr(t.x, t.y, t.w, 26, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (t.k === 'redeye' && G.me && G.me.x + PW / 2 >= t.x0 && G.me.x + PW / 2 <= t.x1) {
      const cx = G.cam.x + (G.cam.vw || 800) / 2;
      const cy = G.cam.y + 92;
      const col = t.state === 2 ? '#ff1744' : t.state === 1 ? '#ffd43b' : '#69db7c';
      ctx.fillStyle = 'rgba(15,5,25,.9)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 48, 27, 0, 0, 6.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy, t.state === 0 ? 4 : 14, 0, 6.3);
      ctx.fill();
    } else if (t.k === 'skygate') {
      const byEff = presentCount() <= 1 ? t.by + 65 : t.by;
      ctx.fillStyle = t.open ? '#69db7c' : '#ff4d6d';
      rr(t.bx, byEff, 54, 24, 6);
      ctx.fill();
    } else if (t.k === 'swap_pad' && !t.used) {
      ctx.strokeStyle = '#ff2bd6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 18, 0, 6.3);
      ctx.stroke();
    }
  }
  v16DrawAnomalies(L);
};

function stepPlayer() {
  const P = G.me;
  const L = G.L;
  P.px = P.x;
  P.py = P.y;
  springEars(P, P.vx, P.vy, P.face);
  if (P.dead) {
    P.deadT -= STEP;
    if (P.deadT <= 0) respawn();
    return;
  }
  if (P.inv > 0) P.inv -= STEP;
  P.tetherGrace = 0;

  v19UpdateAllHeroSkills(P, L);

  if (curPassive === 'antidote' || curPassive === 'limitless') P.rev = 0;
  if (curPassive === 'dragonflight' || curPassive === 'limitless') {
    P.dj = true;
    P.djT = 999;
    if (P.onGround) P.extraHops = 2;
  }

  const permaDJ =
    curPassive === 'limitless' ||
    curPassive === 'dragonflight' ||
    curPassive === 'kurama' ||
    curPassive === 'santoryu' ||
    curPassive === 'nika' ||
    curPassive === 'pikachu' ||
    curPassive === 'onepunch' ||
    curPassive === 'saiyan';
  if (P.dj && !Role.admin && !permaDJ) {
    const before = Math.ceil(P.djT);
    P.djT -= STEP;
    if (P.djT <= 0) {
      P.dj = false;
      P.djT = 0;
      refreshBuffUI();
    } else if (Math.ceil(P.djT) !== before) {
      refreshBuffUI();
    }
  }
  if (P.timed && !Role.admin) {
    for (const id in P.timed) {
      if (P.timed[id] <= 0) continue;
      const before = Math.ceil(P.timed[id]);
      P.timed[id] -= STEP;
      if (P.timed[id] <= 0) {
        P.timed[id] = 0;
        refreshBuffUI();
      } else if (Math.ceil(P.timed[id]) !== before) {
        refreshBuffUI();
      }
    }
  }

  let gDir = 1;
  for (const gz of L.gravZones || []) {
    if (P.x + PW / 2 >= gz.x0 && P.x + PW / 2 <= gz.x1) {
      gDir = -1;
      break;
    }
  }
  P.gDir = gDir;

  const isWater = v18IsInSwimPit(P, L);
  const isSpace = L.biome === 'space';

  if (isWater && L.biome !== 'water' && P.y > GY + 65) {
    P.y = GY + 65;
    if (P.vy > 0) P.vy = -3.5;
    P.onGround = true;
  }

  if (G.won) P.vx *= 0.8;
  let ax = G.won ? 0 : (input.r ? 1 : 0) - (input.l ? 1 : 0);
  if (P.rev > 0) {
    P.rev -= STEP;
    ax = -ax;
  }

  const jumpPressedNow = input.j && !P.jPrev && !G.won;
  if (jumpPressedNow) {
    P.jbuf = 7;
    if (permaDJ && !P.onGround && P.usedDJ && (P.extraHops || 0) > 0) {
      P.usedDJ = false;
      P.extraHops--;
    }
  }
  P.jPrev = input.j;
  if (input.b && !P.bPrev) useBuff();
  P.bPrev = input.b;
  if (P.rope) {
    stepRope(P, ax);
    if (P.jbuf > 0) P.jbuf--;
    P.anch = false;
    const h = hazardCheck(P);
    if (h) die(h);
    return;
  }

  let speedBonus = 1.0;
  if (curPassive === 'limitless' || curPassive === 'pikachu' || curPassive === 'kurama') speedBonus = 1.35;
  else if (curPassive === 'onepunch' || curPassive === 'saiyan' || curPassive === 'nika') speedBonus = 1.28;
  else if (curPassive === 'dragonflight' || curPassive === 'antidote') speedBonus = 1.2;

  const jumpBonus =
    curPassive === 'nika' || curPassive === 'limitless' || curPassive === 'saiyan' ? 1.26 : 1.0;

  if (P.wlock > 0) {
    P.wlock--;
  } else if (ax !== 0) {
    const acc = P.onGround
      ? P.onIce
        ? 0.14
        : slopeAcc(P)
      : isWater
      ? 0.48
      : isSpace
      ? 0.55
      : 0.65;
    const tgt = ax * runMax(P) * speedBonus * (isWater ? 0.92 : 1);
    P.vx += clamp(tgt - P.vx, -acc, acc);
    P.face = ax;
  } else {
    P.vx *= P.onGround ? (P.onIce ? 0.99 : slopeDamp(P)) : isWater ? 0.93 : 0.95;
  }
  slopePull(P);
  if (Math.abs(P.vx) < 0.04) P.vx = 0;
  applyTether(P);

  {
    const rm = runMax(P) * speedBonus;
    P.vx = clamp(P.vx, -rm - 4, rm + 4);
  }

  const gravStep = isWater ? GRAV * 0.32 : isSpace ? GRAV * 0.44 : GRAV;
  const maxFallSpd = isWater
    ? 6.2
    : isSpace
    ? 8.5
    : curPassive === 'featherfall' || curPassive === 'limitless'
    ? MAXFALL * 0.72
    : MAXFALL;
  if (gDir > 0) P.vy = Math.min(P.vy + gravStep, maxFallSpd);
  else P.vy = Math.max(P.vy - gravStep, -maxFallSpd);

  if (L.wj && !P.onGround) {
    const wl = nearSolids(P.x - 3, P.y + 6, 3, PH - 12).length > 0;
    const wr = wl ? false : nearSolids(P.x + PW, P.y + 6, 3, PH - 12).length > 0;
    if (wl || wr) {
      P.wallDir = wl ? -1 : 1;
      P.wallT = 7;
      if (gDir > 0 && P.vy > 2.4) P.vy = 2.4;
    } else if (P.wallT > 0) {
      P.wallT--;
    }
  } else if (P.onGround) {
    P.wallT = 0;
  }

  if (P.onGround) {
    P.coyote = 6;
    P.usedDJ = false;
  } else if (P.coyote > 0) {
    P.coyote--;
  }
  if (P.jbuf === 7 && G.mode === 'coop' && (P.onGround || input.d)) {
    const hf = hangingFriend(P);
    if (hf) {
      P.jbuf = 0;
      doHoist(P, hf);
    }
  }

  if (isWater && (jumpPressedNow || (input.j && P.vy > 1.0))) {
    P.vy = -8.6 * jumpMul(P) * jumpBonus;
    P.onGround = false;
    P.jbuf = 0;
    P.sq = -0.2;
    if (jumpPressedNow) {
      Snd.jump(P.slot);
      puff(P.x + PW / 2, P.y + PH, 5, '#c8f7ff', 1.1);
    }
  } else if (isSpace && (jumpPressedNow || (input.j && P.vy * gDir > -3.2))) {
    P.vy = -7.8 * gDir * jumpMul(P) * jumpBonus;
    P.onGround = false;
    if (jumpPressedNow) {
      Snd.djump();
      P.jbuf = 0;
    }
  } else if (P.jbuf > 0) {
    if (P.coyote > 0) {
      const isFromHead = !!P.ride;
      P.vy = -gDir * (isFromHead ? JUMP * 1.18 : JUMP) * jumpMul(P) * jumpBonus;
      P.coyote = 0;
      P.jbuf = 0;
      P.jumping = true;
      P.onGround = false;
      P.sq = -0.25;
      Snd.jump(P.slot);
    } else if (L.wj && P.wallT > 0 && !P.onGround) {
      P.vy = -gDir * JUMP * 0.96 * jumpMul(P) * jumpBonus;
      P.vx = -P.wallDir * 6.4;
      P.wallT = 0;
      P.wlock = 9;
      P.face = -P.wallDir;
      P.jbuf = 0;
      P.jumping = true;
      P.usedDJ = false;
      Snd.jump(P.slot);
    } else if (P.dj && !P.usedDJ && !P.onGround) {
      P.vy = -gDir * JUMP * 0.92 * jumpMul(P) * jumpBonus;
      P.usedDJ = true;
      P.jbuf = 0;
      P.jumping = true;
      Snd.djump();
    } else {
      P.jbuf--;
    }
  }
  if (!isSpace && !input.j && P.jumping && gDir > 0 && P.vy < -4.2) {
    P.vy = -4.2;
    P.jumping = false;
  }
  if (gDir > 0 && P.vy >= 0) P.jumping = false;

  const feetStart = P.y + PH;
  const pre = nearSolids(P.x, P.y, PW, PH).slice();
  P.x += P.vx;
  if (P.x < 0) {
    P.x = 0;
    P.vx = 0;
  }
  if (P.x > L.w - PW) {
    P.x = L.w - PW;
    P.vx = 0;
  }
  let hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (s.bonk && !s.bonk.rev) continue;
    if (
      (pre.includes(s) && feetStart - s[1] <= 46 && feetStart > s[1]) ||
      (isWater && P.vy < 0 && P.y + PH - s[1] < 38)
    ) {
      continue;
    }
    if (P.vx > 0) P.x = s[0] - PW;
    else if (P.vx < 0) P.x = s[0] + s[2];
    P.vx = 0;
  }

  const feet0 = P.y + PH;
  P.y += P.vy;
  P.wasGround = P.onGround;
  P.onGround = false;
  P.onIce = false;
  P.ride = null;
  P.anch = false;
  hits = nearSolids(P.x, P.y, PW, PH);
  for (let i = 0; i < hits.length; i++) {
    const s = hits[i];
    if (s.bonk && !s.bonk.rev) {
      if (P.vy < 0) {
        onBonk(P, s, 'head');
        P.y = s[1] + s[3];
        P.vy = 0;
      }
      continue;
    }
    if (gDir > 0) {
      if (P.vy > 0) {
        P.y = s[1] - PH;
        P.onGround = true;
        P.onIce = !!s.ice;
      } else if (P.vy < 0) {
        P.y = s[1] + s[3];
      } else if (feet0 <= s[1] + s[3] + 8) {
        P.y = s[1] - PH;
        P.onGround = true;
      } else {
        P.y = s[1] + s[3];
      }
    } else {
      if (P.vy < 0) {
        P.y = s[1] + s[3];
        P.onGround = true;
        P.onIce = !!s.ice;
      } else if (P.vy > 0) {
        P.y = s[1] - PH;
      }
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
        const carryX = r.dx || r.tvx * 0.96 || 0;
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
      P.vy = -s.power * gDir;
      P.onGround = false;
      P.coyote = 0;
      P.jumping = false;
      s.sq = 1;
      Snd.spring();
      P.sq = -0.35;
    }
  }

  if (P.onGround && !P.wasGround) {
    P.sq = 0.3;
    Snd.land();
  }
  P.sq *= 0.82;
  if (P.onGround && input.d) P.anch = true;
  tryGrabRope(P);
  const h = hazardCheck(P);
  if (h) die(h);
}

// HÀM DIE VỚI NỘI TẠI BẢO VỆ VĨNH VIỄN (0 GIÂY HỒI CHIÊU) CHO GOJO, LUFFY GEAR 5, GOKU MUI & SAITAMA SERIOUS MODE:
function die(cause) {
  const P = G.me;
  if (P.dead || P.inv > 0 || G.won) return;
  if (G.boutique) {
    if (cause === 'fall' || cause === 'wall') tpToCheckpoint(P);
    return;
  }
  if (Role.admin && Role.god) {
    if (cause === 'fall' || cause === 'wall') {
      P.x = P.cp.x;
      P.y = P.cp.y;
      P.vx = P.vy = 0;
      G.cam.snap = true;
    }
    return;
  }

  // 1. GOJO SATORU (VÔ HẠN VĨNH VIỄN — KHÔNG CHỜ HỒI CHIÊU!):
  if (curPassive === 'limitless') {
    if (cause === 'fall' || cause === 'wall') {
      tpToCheckpoint(P);
      rewindHunters(P);
      P.inv = 1.2;
      return;
    }
    P.inv = 0.85;
    P.vy = -12.5;
    P.purpleFx = 0.7;
    Snd.djump();
    sparkle(P.x + PW / 2, P.y + PH / 2, 20, 1.8, '#38bdf8');
    return;
  }

  // 2. LUFFY GEAR 5 (CƠ THỂ CAO SU VĨNH VIỄN — Tự động hóa Gear 5 & bật nảy như đệm lò xo!):
  if (curPassive === 'nika' && cause !== 'fall' && cause !== 'wall') {
    P.awakened = true;
    P.inv = 0.8;
    P.vy = -14.2;
    P.sq = -0.42;
    Snd.spring();
    sparkle(P.x + PW / 2, P.y + PH, 20, 1.7, '#ffffff');
    return;
  }

  // 3. SON GOKU (BẢN NĂNG VÔ CỰC VĨNH VIỄN — Tự động hóa MUI Tóc Bạc & lướt né đòn!):
  if (curPassive === 'saiyan' && cause !== 'fall' && cause !== 'wall') {
    P.awakened = true;
    P.gokuForm = 3;
    P.inv = 0.85;
    P.vy = -10.5;
    Snd.djump();
    sparkle(P.x + PW / 2, P.y + PH / 2, 20, 1.7, '#e2e8f0');
    return;
  }

  // 4. SAITAMA (Khi đã vào chế độ Nghiêm Túc sau 1 lần chết hoặc nhấn F -> Mình Đồng Da Sắt Vĩnh Viễn!):
  if (curPassive === 'onepunch' && P.awakened && cause !== 'fall' && cause !== 'wall') {
    P.inv = 0.8;
    P.vy = -9.5;
    P.punchFxT = 0.35;
    Snd.slam();
    sparkle(P.x + PW / 2, P.y + PH / 2, 20, 1.8, '#facc15');
    return;
  }

  // 5. NARUTO / PIKACHU / REAPER: Khi đang bật Thức Tỉnh (P.awakened), tự động kháng đòn chí mạng (mỗi 4s):
  if (
    (curPassive === 'kurama' || curPassive === 'pikachu' || curPassive === 'wraith') &&
    cause !== 'fall' &&
    cause !== 'wall' &&
    (!P.wraithCd || G.lt >= P.wraithCd)
  ) {
    P.wraithCd = G.lt + 4.0;
    P.awakened = true;
    P.inv = 1.4;
    P.vy = -10.5;
    Snd.djump();
    sparkle(P.x + PW / 2, P.y + PH / 2, 20, 1.7, '#fde047');
    return;
  }

  if (P.shield) {
    P.shield = false;
    P.inv = 1.4;
    P.rope = null;
    Snd.pop();
    if (cause === 'fall') tpToCheckpoint(P);
    else if (cause === 'wall') {
      tpToCheckpoint(P);
      rewindHunters(P);
    } else P.vy = -8;
    refreshBuffUI();
    return;
  }

  P.dead = true;
  P.deadT = 0.52;
  P.rope = null;
  P.lastCause = cause;
  if (P.timed) {
    for (const id in P.timed) P.timed[id] = 0;
  }
  refreshBuffUI();
  G.deaths++;
  setText('deaths', '💥 ' + G.deaths);
  Snd.die();
  G.shake = Math.max(G.shake, 8);
  sparkle(P.x + PW / 2, P.y + PH / 2, 22, 1.8, COLORS[P.slot % COLORS.length]);
  netEv({ t: 'die', x: Math.round(P.x), y: Math.round(P.y), wipe: 1 });
  if (isNet()) {
    resetTraps(G.L);
    initV11Level(G.L);
    v15RandomizeTrapsOnDeath(G.L);
    toast('💀 Bạn tử nạn — Cả đội quay về Checkpoint!');
  }
}

function respawn() {
  const P = G.me;
  const L = G.L;
  const rx = P.cp.x;
  const ry = P.cp.y;
  rewindHunters(P);
  resetTraps(L);
  initV11Level(L);
  v15RandomizeTrapsOnDeath(L);
  P.x = rx + (P.slot % 4) * 14;
  P.y = ry;
  P.vx = P.vy = 0;
  P.dead = false;
  P.rev = 0;
  P.inv = curPassive === 'rebirth' ? 3.5 : 1.5;
  if (curPassive === 'onepunch' && G.deaths >= 1) P.awakened = true;
  if (curPassive === 'guard' && !P.shield) {
    P.shield = true;
    refreshBuffUI();
  }
  P.tetherGrace = 0;
  P.rope = null;
  P.ropeCd = 20;
  P.usedDJ = false;
  G.cam.snap = G.cam.snap || Math.abs(G.cam.x - P.x) > 1000;
}

// ============================================================================
// 11. KHỞI TẠO 300 MÀN CHƠI & SỬA TRIỆT ĐỂ MÀN ĐẢO CHIỀU (MÀN 97)
// ============================================================================
(() => {
  SKY_THEMES.length = 0;
  SKY_THEMES.push(
    'meadow',
    'sunset',
    'aurora',
    'galaxy',
    'ember',
    'frost',
    'cosmic',
    'sakura',
    'ocean',
    'storm',
    'neon',
    'toxic',
    'heaven',
    'hell'
  );

  // Ghi đè updateTraps cho cửa chạy (trollDoor) nhạy gấp đôi (240px) để người chơi không chạm thắng trước khi cửa kịp chạy!
  const _prevUpdateTraps = updateTraps;
  updateTraps = function (bodies) {
    const L = G.L;
    const me = G.me;
    if (L && L.traps && me && !me.dead && !G.won) {
      const cx = me.x + PW / 2;
      const cy = me.y + PH / 2;
      for (let i = 0; i < L.traps.length; i++) {
        const t = L.traps[i];
        if (t.k === 'door' && t.st === 0) {
          L.exit.lock = true;
          if (Math.hypot(cx - (L.exit.x + L.exit.w / 2), cy - (L.exit.y + L.exit.h / 2)) < 240) {
            trapSend(i, 'flee', 0);
          }
        }
      }
    }
    return _prevUpdateTraps(bodies);
  };

  function reverseLevelHorizontally(lv) {
    const W = lv.w;
    lv.name += ' [ĐẢO CHIỀU ←]';
    lv.hint = '🔄 MÀN ĐẢO CHIỀU: Xuất phát bên PHẢI, chạy ngược về bên TRÁI để lấy Chìa khóa & vào Cửa!';
    for (const s of lv.solids) s[0] = W - s[0] - s[2];
    // Xây 2 thềm đất liền cố định vững chắc ở đầu Phải (Spawn) và đầu Trái (Exit + Key) để không bao giờ bị rơi hay lơ lửng!
    lv.solids.push([W - 460, GY, 460, WORLD_H - GY + 80]);
    lv.solids.push([0, GY, 540, WORLD_H - GY + 80]);
    lv.spawn = [W - 140, GY - PH];

    lv.spikes = (lv.spikes || []).filter((sp) => sp.bt === undefined);
    for (const sp of lv.spikes) sp.x = W - sp.x - sp.w;
    for (const c of lv.crumbles) {
      c.x = W - c.x - c.w;
      c.lock = false;
    }
    for (const s of lv.springs) s.x = W - s.x - s.w;
    for (const c of lv.crushers) c.x = W - c.x - c.w;
    for (const b of lv.boulders) {
      const n0 = W - b.x1;
      const n1 = W - b.x0;
      b.x0 = n0;
      b.x1 = n1;
      b.cx = n0;
    }
    for (const p of lv.plates) p.x = W - p.x - p.w;
    lv.gates = (lv.gates || []).filter((g) => g.tr === undefined);
    for (const g of lv.gates) g.x = W - g.x - g.w;
    for (const f of lv.flags) f.x = W - f.x;
    for (const c of lv.coins) c.x = W - c.x;
    for (const ls of lv.lasers || []) ls.x = W - ls.x;
    for (const bh of lv.blackHoles || []) bh.x = W - bh.x;
    for (const cv of lv.conveyors || []) {
      cv.x = W - cv.x - cv.w;
      cv.spd = -cv.spd;
    }
    for (const pd of lv.pendulums || []) pd.x = W - pd.x;
    for (const trt of lv.turrets || []) trt.x = W - trt.x;
    for (const ph of lv.phantoms || []) ph.x = W - ph.x - ph.w;
    for (const gz of lv.gravZones || []) {
      const n0 = W - gz.x1;
      const n1 = W - gz.x0;
      gz.x0 = n0;
      gz.x1 = n1;
    }
    lv.sweepers = [];
    lv.traps = [];
    lv.slopes = [];
    lv.rocks = [];
    lv.key = { x: 380, y: GY - 85, run: { x0: 180, x1: 500, gy: GY } };
    lv.exit = { x: 95, y: GY - 74, w: 54, h: 74, lock: false };
    return v15SanitizeLevel(lv);
  }

  // Áp dụng bộ sửa lỗi Đảo Chiều & Cửa Chạy cho toàn bộ 300 màn chơi:
  ['solo', 'coop', 'party'].forEach((mode) => {
    const origArr = LEVELS[mode].slice();
    LEVELS[mode].length = 0;
    for (let i = 0; i < origArr.length; i++) {
      LEVELS[mode].push(() => {
        const lv = origArr[i]();
        if (lv && lv.name && lv.name.indexOf('ĐẢO CHIỀU') >= 0) {
          lv.solids.push([lv.w - 460, GY, 460, WORLD_H - GY + 80]);
          lv.solids.push([0, GY, 540, WORLD_H - GY + 80]);
        }
        return v15SanitizeLevel(lv);
      });
    }
  });
  delete LV_META.solo;
  delete LV_META.coop;
  delete LV_META.party;
  rebuildLevelSelect();
  renderShop();
  resize();
})();

// ============================================================================
// ★ KHU VỰC DÁN THÊM TRANG PHỤC MỚI (PLUG & PLAY) ★
// ============================================================================
`;

code = code.slice(0, lastClose) + v19MasterPayload + '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V19.0 ANIME AWAKENING MASTER] Đã nâng cấp hoàn chỉnh 3 Phần vào public/game.js!');

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
  if (!css.includes('.tier-transcendent')) {
    css += `\n.shop-item.tier-transcendent{border-color:#00f5d4;background:linear-gradient(155deg,#0f172a,#1e1b4b,#3b0764);color:#fff;box-shadow:0 0 18px rgba(56,189,248,.45)}
.shop-item.tier-transcendent .skin-name,.shop-item.tier-transcendent .skin-desc{color:#f8fafc}
.shop-item.tier-transcendent .tier-tag{background:linear-gradient(90deg,#00f5d4,#a855f7,#ff0055)}
.shop-section-title.tier-transcendent{color:#7e22ce;font-size:13px}
.preview-gojo{background:radial-gradient(circle,#38bdf8,#1e1b4b);border-color:#00f5d4;box-shadow:0 0 16px #38bdf8}
.preview-zoro{background:#15803d;border-color:#a855f7;box-shadow:0 0 14px #10b981}
.shop-item.tier-supreme{border-color:#ff002b;background:linear-gradient(155deg,#fff9db,#ffe3e3,#e5dbff);box-shadow:0 4px 14px rgba(255,0,85,.25)}
.shop-item.tier-supreme .tier-tag{background:linear-gradient(90deg,#ff002b,#ff922b,#7209b7)}
.shop-section-title.tier-supreme{color:#e03131;font-size:12px}
.preview-saitama{background:#ffd43b;border-color:#e03131;box-shadow:0 0 14px #ffd43b}
.preview-goku{background:#f97316;border-color:#00f5d4;box-shadow:0 0 14px #38bdf8}
.preview-naruto{background:#fb923c;border-color:#facc15;box-shadow:0 0 14px #ff922b}
.preview-luffy{background:#ffffff;border-color:#9333ea;box-shadow:0 0 14px #e0aaff}
.preview-pikachu{background:#fde047;border-color:#ef4444;box-shadow:0 0 14px #fde047}
.shop-item.tier-mythic{border-color:#ff0055;background:linear-gradient(160deg,#fff0f6,#f3d9fa)}
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
  html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=19.0');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V19.0] Đã tự động cập nhật game.js?v=19.0 trong index.html');
}
