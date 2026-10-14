/**
 * Tether Bunnies v20.0 MASTERPIECE EDITION - PHẦN 1 / 2
 *  - Sửa triệt để lỗi Lồng Giam Cưa Máy (Arena), Bẫy Trần Sập (Compactor) & Lỗi Gojo bay lên trời
 *  - Khôi phục 100% Cá Mập Megalodon hàm răng cử động & Địa hình Cỏ Hoa / Đá Cuội 3D / Hồ Nước Bơi
 *  - Đạn Kỹ Năng bay trong World Space (Không bị dịch chuyển theo hướng quay mặt của nhân vật)
 *  - 7 Hình dạng Kỹ năng Độc bản (Nắm đấm đỏ 3D Saitama, Đấm Haki Luffy, Tia Kamehameha Goku,
 *    Rasenshuriken 4 cánh Naruto, Cột Sét Pikachu, Hư Thức Tử Gojo, Kiếm Khí Zoro) + Hồi chiêu cân bằng
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
  '/* === TB_V19_5_FULL_MASTER === */',
  '/* === TB_V20_0_MASTERPIECE === */',
].forEach((mk) => {
  if (code.includes(mk)) code = code.slice(0, code.indexOf(mk)) + '})();\n';
});

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); ở cuối game.js');
  process.exit(0);
}

const v20MasterPayload = `
/* === TB_V20_0_MASTERPIECE === */
// ============================================================================
// 1. HỆ THỐNG ĐĂNG KÝ SKIN MÔ-ĐUN, BIẾN HÌNH (PHÍM F / 🔥) & HỒI CHIÊU CÂN BẰNG
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

G.skillShots = [];
G.groundShockwaves = [];
G.cursedConsumed = new Set();
G.chaosSeed = 1;

const SKILL_COOLDOWN = 3.2; // Thời gian hồi tuyệt kỹ bắn (3.2s - cân bằng, không spam)
const GUARD_COOLDOWN = 6.0; // Thời gian hồi nội tại đỡ đòn chí mạng (6.0s)

function v20ToggleAwaken(manual) {
  const P = G.me;
  if (!P || P.dead || G.won) return;
  const skinId = Save.equipped();
  const cfg = CUSTOM_SKINS.get(skinId);
  if (!cfg) {
    if (manual) toast('⚠️ Hãy trang bị Skin Anime trong Shop để Biến Hình Thức Tỉnh!');
    return;
  }
  P.awakened = !P.awakened;
  P.awakenAnimT = 0.9;
  Snd.key();
  G.shake = Math.max(G.shake, 7);
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  sparkle(cx, cy, 32, 2.2, (cfg.trail && cfg.trail[0]) || '#00f5d4');
  G.groundShockwaves.push({
    x: cx,
    y: P.y + PH,
    r: 10,
    maxR: 155,
    col: (cfg.trail && cfg.trail[0]) || '#38bdf8',
    life: 0.45,
  });
  if (P.awakened) {
    toast('🔥 THỨC TỈNH: ' + (cfg.awakenedTitle || cfg.name.toUpperCase()) + '!');
    if (typeof cfg.onAwaken === 'function') cfg.onAwaken(P, G.L);
  } else {
    toast('✨ Đã chuyển về Dạng Thường.');
  }
}

window.addEventListener('keydown', (e) => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (!G.inGame || !G.me || e.repeat) return;
  if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    v20ToggleAwaken(true);
  }
});

// ============================================================================
// 2. HỆ THỐNG ĐẠN KỸ NĂNG WORLD-SPACE (KHÔNG BỊ DỊCH CHUYỂN KHI QUAY MẶT!)
//    & 7 HÌNH DẠNG TUYỆT KỸ RIÊNG BIỆT CHO TỪNG NHÂN VẬT ANIME
// ============================================================================
function v20FindFrontOrOverheadThreat(P, L, maxRange) {
  if (!P || !L) return null;
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  const face = P.face >= 0 ? 1 : -1;
  let best = null;
  let bestDist = maxRange || 420;

  const checkTarget = (tx, ty, kind, ref) => {
    const dx = tx - cx;
    const dy = ty - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > (maxRange || 420) || dist < 12) return;
    // Chỉ ngắm vào bẫy đang ở phía trước mặt nhân vật HOẶC đang rơi từ trên đầu xuống:
    const isAhead = dx * face >= -25;
    const isOverhead = Math.abs(dx) < 110 && dy < -20;
    if (!isAhead && !isOverhead) return;
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: tx, y: ty, kind, ref, dist };
    }
  };

  (L.stalactites || []).forEach((q) => {
    if (q.st === 1 || q.st === 2) checkTarget(q.x + q.w / 2, q.y + (q.fy || 0) + q.h / 2, 'stalactite', q);
  });
  (L.boulders || []).forEach((b) => checkTarget(b.cx, b.y - b.r, 'boulder', b));
  (L.sharks || []).forEach((sh) => checkTarget(sh.cx, sh.cy, 'shark', sh));
  (L.lasers || []).forEach((ls) => checkTarget(ls.x, ls.y, 'laser', ls));
  (L.turrets || []).forEach((trt) => checkTarget(trt.x, trt.y, 'turret', trt));
  (L.pendulums || []).forEach((pd) => {
    const th = Math.sin(G.lt * pd.spd + pd.off) * 1.05;
    checkTarget(pd.x + Math.sin(th) * pd.len, pd.y + Math.cos(th) * pd.len, 'pendulum', pd);
  });
  if (L.anomalies) {
    (L.anomalies.doppels || []).forEach((dp) => {
      if (dp.evil) checkTarget(dp.x + PW / 2, dp.y + PH / 2, 'doppel', dp);
    });
    (L.anomalies.ghosts || []).forEach((gh) => checkTarget(gh.x, gh.y, 'ghost', gh));
    (L.anomalies.spitters || []).forEach((sp) => {
      if (sp.glob) checkTarget(sp.glob.x, sp.glob.y, 'glob', sp);
      else checkTarget(sp.x, sp.y, 'spitter', sp);
    });
  }
  (L.coins || []).forEach((c) => {
    if (!c.got && c.anomaly === 1 && c.trig) checkTarget(c.x, c.y, 'mimic_coin', c);
  });

  return best;
}

function v20DestroyTarget(L, target) {
  if (!L || !target) return;
  const { x, y, kind, ref } = target;
  sparkle(x, y, 22, 1.8, '#ffd43b');
  puff(x, y, 9, '#ffffff', 1.4);
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

// Khóa hướng bắn cố định tại thời điểm phóng (World Space) -> Không bao giờ bị lệch hay dịch chuyển khi nhân vật đổi hướng!
function v20LaunchUniqueSkill(P, L, style, manual) {
  if (!P || !L) return false;
  if (P.skillCd > 0) {
    if (manual) toast('⏳ Kỹ năng đang hồi: còn ' + P.skillCd.toFixed(1) + 's');
    return false;
  }
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  const face = P.face >= 0 ? 1 : -1;
  const threat = v20FindFrontOrOverheadThreat(P, L, 390);
  if (!threat && !manual) return false;

  let dx = face;
  let dy = 0;
  if (threat) {
    dx = threat.x - cx;
    dy = threat.y - cy;
  }
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist;
  const uy = dy / dist;
  const spd = style.speed || 14.5;

  P.skillCd = style.cd || SKILL_COOLDOWN;
  P.attackAnimT = 0.42;

  G.skillShots.push({
    x0: cx + ux * 18,
    y0: cy + uy * 14,
    x: cx + ux * 22,
    y: cy + uy * 14,
    vx: ux * spd,
    vy: uy * spd,
    ang: Math.atan2(uy, ux),
    r: style.r || 28,
    kind: style.kind || 'hollow_purple',
    life: style.life || 0.95,
    maxLife: style.life || 0.95,
  });
  return true;
}

function v20UpdateSkillShots(L) {
  for (let i = G.skillShots.length - 1; i >= 0; i--) {
    const s = G.skillShots[i];
    s.life -= STEP;
    // Bay thẳng theo вектор cố định lúc phóng (không tự dịch chuyển hay bẻ cong vô lý!)
    s.x += s.vx;
    s.y += s.vy;

    // Kiểm tra va chạm trực tiếp trên đường bay của đạn:
    let hit = false;
    const checkHit = (tx, ty, rad, kind, ref) => {
      if (Math.hypot(tx - s.x, ty - s.y) <= s.r + rad) {
        v20DestroyTarget(L, { x: tx, y: ty, kind, ref });
        hit = true;
      }
    };
    (L.stalactites || []).slice().forEach((q) => checkHit(q.x + q.w / 2, q.y + (q.fy || 0) + q.h / 2, 24, 'stalactite', q));
    (L.boulders || []).slice().forEach((b) => checkHit(b.cx, b.y - b.r, b.r, 'boulder', b));
    (L.sharks || []).slice().forEach((sh) => checkHit(sh.cx, sh.cy, 38, 'shark', sh));
    (L.lasers || []).slice().forEach((ls) => checkHit(ls.x, ls.y, 24, 'laser', ls));
    (L.turrets || []).slice().forEach((trt) => checkHit(trt.x, trt.y, 24, 'turret', trt));
    (L.pendulums || []).slice().forEach((pd) => {
      const th = Math.sin(G.lt * pd.spd + pd.off) * 1.05;
      checkHit(pd.x + Math.sin(th) * pd.len, pd.y + Math.cos(th) * pd.len, pd.r, 'pendulum', pd);
    });
    if (L.anomalies) {
      (L.anomalies.doppels || []).slice().forEach((dp) => checkHit(dp.x + PW / 2, dp.y + PH / 2, 24, 'doppel', dp));
      (L.anomalies.ghosts || []).slice().forEach((gh) => checkHit(gh.x, gh.y, 24, 'ghost', gh));
      (L.anomalies.spitters || []).slice().forEach((sp) => {
        if (sp.glob) checkHit(sp.glob.x, sp.glob.y, 18, 'glob', sp);
        else checkHit(sp.x, sp.y, 22, 'spitter', sp);
      });
    }
    (L.coins || []).forEach((c) => {
      if (!c.got && c.anomaly === 1) checkHit(c.x, c.y, 20, 'mimic_coin', c);
    });

    if ((hit && s.kind !== 'hollow_purple' && s.kind !== 'kamehameha') || s.life <= 0) {
      G.skillShots.splice(i, 1);
    }
  }

  for (let i = G.groundShockwaves.length - 1; i >= 0; i--) {
    const sw = G.groundShockwaves[i];
    sw.life -= STEP;
    sw.r = lerp(sw.r, sw.maxR, 0.22);
    if (sw.life <= 0) G.groundShockwaves.splice(i, 1);
  }
}

// VẼ 7 TUYỆT KỸ HOÀN TOÀN KHÁC NHAU TRONG WORLD SPACE:
function v20DrawWorldSkillShots(ctx) {
  const T = G.lt;
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

  for (const s of G.skillShots) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.ang);

    if (s.kind === 'serious_fist') {
      // 1. SAITAMA: NẮM ĐẤM GĂNG ĐỎ 3D KHỔNG LỒ (Có ngón cái, 4 đốt ngón tay, cổ găng & sóng xung kích xé gió!)
      ctx.strokeStyle = 'rgba(250,204,21,.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(6, 0, 34, -1.0, 1.0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-42, -16);
      ctx.lineTo(-10, -16);
      ctx.moveTo(-48, 0);
      ctx.lineTo(-14, 0);
      ctx.moveTo(-42, 16);
      ctx.lineTo(-10, 16);
      ctx.stroke();

      // Cổ găng tay đỏ
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      rr(-26, -12, 14, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Bầu nắm đấm găng đỏ 3D
      const fg = ctx.createRadialGradient(4, -6, 3, 0, 0, 24);
      fg.addColorStop(0, '#ff6b6b');
      fg.addColorStop(0.45, '#ef4444');
      fg.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = fg;
      rr(-14, -18, 32, 36, 11);
      ctx.fill();
      ctx.stroke();

      // 4 đốt ngón tay phía trước + Ngón cái gập bên dưới
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = '#dc2626';
        rr(10, -16 + k * 8.2, 10, 7.5, 3.5);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#b91c1c';
      rr(-4, 6, 16, 10, 4);
      ctx.fill();
      ctx.stroke();
    } else if (s.kind === 'bajrang_fist') {
      // 2. LUFFY GEAR 5: CÁNH TAY CAO SU KHỔNG LỒ BỌC HAKI BÁ VƯƠNG + VÒNG MÂY TRẮNG!
      const dx = Math.hypot(s.x - s.x0, s.y - s.y0);
      // Cánh tay cao su kéo dài từ người Luffy tới nắm đấm
      ctx.fillStyle = '#ffe0c8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-Math.min(dx, 140), -7, Math.min(dx, 140), 14);
      ctx.strokeRect(-Math.min(dx, 140), -7, Math.min(dx, 140), 14);

      // Vòng mây trắng quanh cổ tay
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#c084fc';
      for (let m = -2; m <= 2; m++) {
        ctx.beginPath();
        ctx.arc(-14, m * 6, 6, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      }

      // Nắm đấm bọc Haki Vũ Trang Đen-Đỏ khổng lồ
      const hg = ctx.createRadialGradient(4, -5, 2, 2, 0, 26);
      hg.addColorStop(0, '#f43f5e');
      hg.addColorStop(0.4, '#4c0519');
      hg.addColorStop(1, '#090d16');
      ctx.fillStyle = hg;
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2.8;
      rr(-10, -20, 34, 40, 12);
      ctx.fill();
      ctx.stroke();

      // Tia chớp đen-đỏ Haki Bá Vương phóng quanh nắm đấm
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(20, -14);
      ctx.lineTo(36, -24);
      ctx.lineTo(28, -4);
      ctx.moveTo(20, 14);
      ctx.lineTo(38, 22);
      ctx.stroke();
    } else if (s.kind === 'kamehameha') {
      // 3. SON GOKU: CHƯỞNG KAMEHAMEHA TIA LASER XANH-TRẮNG KÉO DÀI LIÊN TỤC!
      const beamLen = Math.min(260, Math.hypot(s.x - s.x0, s.y - s.y0) + 45);
      ctx.fillStyle = 'rgba(56,189,248,.42)';
      ctx.fillRect(-beamLen, -18, beamLen, 36);
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(-beamLen, -10, beamLen, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-beamLen, -4, beamLen, 8);

      // Đầu sóng chưởng Kamehameha xoáy năng lượng
      const kg = ctx.createRadialGradient(0, 0, 4, 0, 0, 32);
      kg.addColorStop(0, '#ffffff');
      kg.addColorStop(0.5, '#38bdf8');
      kg.addColorStop(1, 'rgba(2,132,199,0)');
      ctx.fillStyle = kg;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, 6.3);
      ctx.fill();
    } else if (s.kind === 'rasenshuriken') {
      // 4. NARUTO: PHONG ĐỘN RASENSHURIKEN 4 CÁNH PHI TIÊU GIÓ XOAY TÍT!
      ctx.rotate(T * 32);
      ctx.fillStyle = 'rgba(224,242,254,.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        ctx.save();
        ctx.rotate((k * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(18, -14, 38, 0);
        ctx.quadraticCurveTo(18, 14, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, 6.3);
      ctx.fill();
    } else if (s.kind === 'thunderbolt') {
      // 5. PIKACHU: MŨI LAO SẤM SÉT 100.000V & CỘT SÉT GIÁNG TỪ BẦU TRỜI!
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.lineTo(-20, -14);
      ctx.lineTo(-5, 10);
      ctx.lineTo(15, -12);
      ctx.lineTo(34, 0);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (s.kind === 'dragon_slash') {
      // 6. RORONOA ZORO: 3 LUỒNG KIẾM KHÍ BÁN NGUYỆT XANH-TÍM HAKI DIÊM VƯƠNG!
      [-10, 0, 10].forEach((oy, idx) => {
        ctx.strokeStyle = idx === 1 ? '#a855f7' : '#10b981';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(oy, 0, 28, -1.25, 1.25);
        ctx.stroke();
      });
    } else {
      // 7. SATORU GOJO: HƯ THỨC: TỬ (HOLLOW PURPLE) — Hố đen tím + 2 vệ tinh Đỏ/Xanh xoắn kép!
      const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.35, '#d8b4fe');
      rg.addColorStop(0.7, '#7e22ce');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, 6.3);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(Math.cos(T * 20) * 14, Math.sin(T * 20) * 14, 6, 0, 6.3);
      ctx.stroke();
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-Math.cos(T * 20) * 14, -Math.sin(T * 20) * 14, 6, 0, 6.3);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ============================================================================
// 3. HỆ THỐNG QUỶ DỊ TOÀN DIỆN (ANOMALIES - GIẾT 1 LẦN LÀ HÓA GIẢI!)
// ============================================================================
function v16InitAnomalies(L) {
  if (!L) return;
  L.anomalies = L.anomalies || {
    doppels: [],
    hands: [],
    ghosts: [],
    spitters: [],
    floorMaws: [],
  };
  const seed = (G.lvIdx + 1) * 97 + (G.deaths + 1) * 31;

  (L.coins || []).forEach((c, idx) => {
    const cid = 'coin_' + G.mode + '_' + G.lvIdx + '_' + idx;
    const nearLaser = (L.lasers || []).some((ls) => Math.abs(ls.x - c.x) < 220);
    if (
      G.cursedConsumed.has(cid) ||
      curPassive === 'wraith' ||
      curPassive === 'limitless' ||
      nearLaser
    ) {
      c.anomaly = 0;
      c.trig = false;
      return;
    }
    const h = hash1(seed + idx * 17.3);
    c.anomaly = h < 0.78 ? 0 : 1 + (Math.floor(h * 100) % 5);
    c.cid = cid;
    c.trig = false;
    c.x0 = c.x0 || c.x;
    c.y0 = c.y0 || c.y;
    c.x = c.x0;
    c.y = c.y0;
  });

  (L.springs || []).forEach((sp, idx) => {
    const sid = 'spr_' + G.mode + '_' + G.lvIdx + '_' + idx;
    if (sp.x0 === undefined) sp.x0 = sp.x;
    sp.x = sp.x0;
    sp.sid = sid;
    sp.cursed = !G.cursedConsumed.has(sid) && hash1(seed + idx * 29.1) > 0.55;
    sp.dodged = false;
  });

  L.anomalies.floorMaws = [];
  for (let i = 0; i < (L.solids || []).length; i++) {
    const s = L.solids[i];
    if (s.bonk || s.isVehicle || s[2] < 420 || s[3] < 90) continue;
    const mid = 'maw_' + G.mode + '_' + G.lvIdx + '_' + i;
    if (!G.cursedConsumed.has(mid) && hash1(seed + i * 41.7) > 0.65) {
      L.anomalies.floorMaws.push({
        id: mid,
        x: s[0] + s[2] * 0.55,
        y: s[1],
        open: 0,
        st: 0,
      });
    }
  }

  L.anomalies.doppels = [];
  L.anomalies.hands = [];
  const ghostId = 'ghost_' + G.mode + '_' + G.lvIdx;
  L.anomalies.ghosts = [];
  if (!G.cursedConsumed.has(ghostId) && L.w > 1800 && (G.lvIdx + G.deaths) % 2 === 0) {
    L.anomalies.ghosts.push({ id: ghostId, x: 520, y: GY - 140, frozen: false });
  }

  L.anomalies.spitters = [];
  if (L.biome === 'toxic') {
    for (const s of L.solids || []) {
      if (s.bonk || s.isVehicle || s[2] < 320 || s[3] < 90) continue;
      L.anomalies.spitters.push({
        x: s[0] + s[2] * 0.5,
        y: s[1] - 18,
        t: (s[0] * 0.01) % 2.5,
        glob: null,
      });
    }
  }
}

function v16SpawnDoppelganger(L, me, fx, fy, flagIdx) {
  if (!L || !me) return;
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
  L.anomalies = L.anomalies || {
    doppels: [],
    hands: [],
    ghosts: [],
    spitters: [],
    floorMaws: [],
  };
  L.anomalies.doppels.push({
    id: did,
    x: fx - 48,
    y: fy - PH,
    face: 1,
    slot: fakeSlot,
    name: fakeName,
    skin: fakeSkin,
    age: 0,
    evil: false,
    life: 5.2,
  });
}

function v16UpdateAnomalies() {
  const L = G.L;
  const me = G.me;
  if (!L || !me || me.dead || G.won) return;
  const A = L.anomalies;
  if (!A) return;
  const cx = me.x + PW / 2;
  const cy = me.y + PH / 2;
  const feet = me.y + PH;
  const immune =
    curPassive === 'antidote' ||
    curPassive === 'wraith' ||
    curPassive === 'kurama' ||
    curPassive === 'limitless' ||
    curPassive === 'nika' ||
    curPassive === 'saiyan' ||
    curPassive === 'onepunch';

  for (const sp of L.springs || []) {
    if (
      sp.cursed &&
      !sp.dodged &&
      !me.onGround &&
      Math.abs(cx - (sp.x + sp.w / 2)) < 68 &&
      feet < sp.y + 10 &&
      feet > sp.y - 110
    ) {
      sp.dodged = true;
      G.cursedConsumed.add(sp.sid);
      sp.x += cx < sp.x + sp.w / 2 ? 42 : -42;
      Snd.pop();
    }
  }

  for (const mw of A.floorMaws || []) {
    const dist = Math.abs(cx - mw.x);
    if (mw.st === 0 && dist < 72 && Math.abs(feet - mw.y) < 35) {
      mw.st = 1;
      mw.t = 0.9;
      Snd.shake();
    } else if (mw.st === 1) {
      mw.t -= STEP;
      mw.open = Math.sin(clamp(1 - mw.t / 0.9, 0, 1) * Math.PI);
      if (mw.open > 0.55 && dist < 34 && Math.abs(feet - mw.y) < 18) {
        G.cursedConsumed.add(mw.id);
        die('floor_maw');
        return;
      }
      if (mw.t <= 0) {
        mw.st = 2;
        mw.open = 0;
        G.cursedConsumed.add(mw.id);
      }
    }
  }

  for (const c of L.coins || []) {
    if (c.got || !c.anomaly) continue;
    const d = Math.hypot(cx - c.x, cy - c.y);
    if (c.anomaly === 1) {
      if (!c.trig && d < 88) {
        c.trig = true;
        Snd.grab();
      }
      if (c.trig) {
        c.x += ((cx - c.x) / Math.max(1, d)) * 4.7;
        c.y += ((cy - c.y) / Math.max(1, d)) * 4.7;
        if (d < 22) {
          G.cursedConsumed.add(c.cid);
          die('mimic_coin');
          return;
        }
      }
    } else if (c.anomaly === 2 && d < 75) {
      c.x += Math.sign(c.x - cx) * 4.5;
      c.y -= 1.2;
    } else if (d < 28) {
      c.got = true;
      c.pop = 0.5;
      G.cursedConsumed.add(c.cid);
      if (!immune) {
        if (c.anomaly === 3) {
          me.vy = 12;
          me.heavyT = 2.2;
          Snd.slam();
        } else if (c.anomaly === 4) {
          me.rev = 2.6;
          Snd.shake();
        } else if (c.anomaly === 5) {
          L.stalactites.push({
            x: cx - 17,
            y: me.y - 260,
            w: 34,
            h: 66,
            st: 2,
            t: 0,
            fy: 0,
            vy: 9,
            gnd: feet + 40,
            dyn: true,
          });
        }
      }
    }
  }
  if (me.heavyT > 0) {
    me.heavyT -= STEP;
    me.vy += GRAV * 0.85;
  }

  for (let i = (A.doppels || []).length - 1; i >= 0; i--) {
    const dp = A.doppels[i];
    dp.age += STEP;
    dp.life -= STEP;
    if (dp.life <= 0) {
      puff(dp.x + PW / 2, dp.y + PH / 2, 10, '#7209b7', 1.2);
      A.doppels.splice(i, 1);
      continue;
    }
    const dx = cx - (dp.x + PW / 2);
    const dy = cy - (dp.y + PH / 2);
    const dist = Math.max(1, Math.hypot(dx, dy));
    dp.face = dx >= 0 ? 1 : -1;
    if (dp.age < 1.65) {
      dp.x += clamp((me.x - me.face * 42 - dp.x) * 0.12, -4.5, 4.5);
      dp.y += (me.y - dp.y) * 0.18;
    } else {
      if (!dp.evil) {
        dp.evil = true;
        Snd.shake();
        sparkle(dp.x + PW / 2, dp.y + PH / 2, 14, 1.4, '#ff0055');
      }
      dp.x += (dx / dist) * 5.2;
      dp.y += (dy / dist) * 4.1;
      if (dist < 24) {
        G.cursedConsumed.add(dp.id);
        die('doppelganger');
        return;
      }
    }
  }

  for (let i = (A.ghosts || []).length - 1; i >= 0; i--) {
    const gh = A.ghosts[i];
    const dx = cx - gh.x;
    const dy = cy - gh.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
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

  const handKey = 'hand_' + G.mode + '_' + G.lvIdx + '_' + Math.floor(cx / 300);
  if (
    me.onGround &&
    Math.abs(me.vx) < 0.3 &&
    !immune &&
    !G.cursedConsumed.has(handKey) &&
    cx > 300
  ) {
    me.idleT = (me.idleT || 0) + STEP;
    if (me.idleT > 1.05) {
      me.idleT = 0;
      A.hands.push({ id: handKey, x: cx, y: feet, t: 0, dur: 0.75 });
      Snd.shake();
    }
  } else {
    me.idleT = 0;
  }

  for (let i = (A.hands || []).length - 1; i >= 0; i--) {
    const hd = A.hands[i];
    hd.t += STEP;
    if (
      hd.t > 0.28 &&
      hd.t < 0.62 &&
      Math.abs(cx - hd.x) < 22 &&
      Math.abs(feet - hd.y) < 34
    ) {
      G.cursedConsumed.add(hd.id);
      die('abyss_hand');
      return;
    }
    if (hd.t >= hd.dur) A.hands.splice(i, 1);
  }

  for (const sp of A.spitters || []) {
    sp.t += STEP;
    if (sp.t >= 2.5 && Math.abs(cx - sp.x) < 480) {
      sp.t = 0;
      sp.glob = {
        x: sp.x,
        y: sp.y - 16,
        vx: clamp((cx - sp.x) * 0.017, -5.2, 5.2),
        vy: -8.0,
      };
    }
    if (sp.glob) {
      const g = sp.glob;
      g.x += g.vx;
      g.y += g.vy;
      g.vy += GRAV * 0.55;
      if (Math.hypot(cx - g.x, cy - g.y) < 20 && !immune) {
        die('toxic_acid');
        return;
      }
      if (g.y > WORLD_H) sp.glob = null;
    }
  }
}

function v16DrawAnomalies(L) {
  if (!L || !L.anomalies) return;
  const A = L.anomalies;
  const T = G.lt;
  for (const mw of A.floorMaws || []) {
    if (mw.open <= 0.02) continue;
    const w = 44 * mw.open;
    ctx.save();
    ctx.fillStyle = '#090101';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mw.x - w, mw.y);
    ctx.lineTo(mw.x, mw.y + 48 * mw.open);
    ctx.lineTo(mw.x + w, mw.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const dp of A.doppels || []) {
    drawBunny(dp.x, dp.y, {
      slot: dp.slot,
      skin: dp.skin,
      face: dp.face,
      vx: 3,
      vy: 0,
      ground: true,
      runT: T * 5,
      name: dp.evil ? '👹 ' + dp.name : dp.name,
    });
  }
  for (const gh of A.ghosts || []) {
    ctx.save();
    ctx.translate(gh.x, gh.y + Math.sin(T * 5) * 5);
    ctx.fillStyle = gh.frozen ? 'rgba(148,163,184,.65)' : 'rgba(244,63,94,.88)';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -6, 18, Math.PI, 0);
    ctx.lineTo(18, 18);
    ctx.lineTo(9, 12);
    ctx.lineTo(0, 18);
    ctx.lineTo(-9, 12);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = gh.frozen ? '#334155' : '#ffeb3b';
    ctx.beginPath();
    ctx.arc(-6, -6, 3.5, 0, 6.3);
    ctx.arc(6, -6, 3.5, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }
  for (const hd of A.hands || []) {
    const reach = Math.sin(clamp(hd.t / hd.dur, 0, 1) * Math.PI) * 52;
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(hd.x - 14, hd.y);
    ctx.lineTo(hd.x - 10, hd.y - reach);
    ctx.lineTo(hd.x, hd.y - reach - 10);
    ctx.lineTo(hd.x + 10, hd.y - reach);
    ctx.lineTo(hd.x + 14, hd.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const sp of A.spitters || []) {
    ctx.save();
    ctx.fillStyle = '#7209b7';
    ctx.strokeStyle = '#081c15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y + 10, 18, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#80ed99';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y - 2, 6, 0, 6.3);
    ctx.fill();
    if (sp.glob) {
      ctx.fillStyle = '#80ed99';
      ctx.strokeStyle = '#1b4332';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.glob.x, sp.glob.y, 9, 0, 6.3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function v15RandomizeTrapsOnDeath(L) {
  if (!L) return;
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
        if (t.plates[fi]) {
          t.plates[fi].x = t.allPos[j];
          t.plates[fi].used = false;
          fi++;
        }
      }
    } else if (t.k === 'sled') {
      t.x = t.x0;
      t.vx = 0;
      t.st = 0;
      t.wait = 0;
    } else if (t.k === 'syncgate' || t.k === 'skygate') {
      t.open = false;
      if (L.gates[t.gi]) L.gates[t.gi].act = false;
    } else if (t.k === 'double_bluff' || t.k === 'shift_ledge') {
      t.st = 0;
      t.t = 0;
      t.cur = 0;
      if (L.solids[t.si]) L.solids[t.si][0] = t.baseX;
      if (t.topSpk) {
        t.topSpk.x = t.baseX + 115;
        t.topSpk.hid = true;
        t.topSpk.live = false;
        t.topSpk.ph = 0;
      }
    } else if (t.k === 'swap_pad') {
      t.used = false;
    }
  }
  v16InitAnomalies(L);
}

function initV11Level(L) {
  if (!L) return;
  L.slopes = L.slopes || [];
  L.bonks = L.bonks || [];
  L.rocks = L.rocks || [];
  L.portals = L.portals || [];
  L.sharks = L.sharks || [];
  L.gravZones = L.gravZones || [];
  L.decoys = L.decoys || [];
  L.lasers = L.lasers || [];
  L.blackHoles = L.blackHoles || [];
  L.mimics = L.mimics || [];
  L.conveyors = L.conveyors || [];
  L.pendulums = L.pendulums || [];
  L.turrets = L.turrets || [];
  L.phantoms = L.phantoms || [];
  L.solids = L.solids.filter((s) => !s.bonk);
  L.bonks.forEach((bk, i) => {
    bk.i = i;
    if (bk.rev === undefined) bk.rev = false;
    bk.sh = 0;
    const r = [bk.x, bk.y, bk.w, bk.h];
    r.bonk = bk;
    L.solids.push(r);
  });
  L.rocks.forEach((r) => {
    r.cyc = -1;
  });
  const k = L.key;
  if (k && k.run) {
    if (k.hx === undefined) {
      k.hx = k.x;
      k.hy = k.y;
    }
    k.x = k.hx;
    k.y = k.hy;
    k.vx = 0;
    k.vy = 0;
    k.fl = 0;
    k.t = 0;
    k.tx = k.x;
    k.ty = k.y;
    k.arc = null;
    k.cool = 0;
    const R = k.run;
    L.decoys = [
      { x: R.x0 + 130, y: R.gy - 125, boom: false },
      { x: R.x1 - 130, y: R.gy - 125, boom: false },
    ];
  }
  v16InitAnomalies(L);
}
// === KẾT THÚC PHẦN 1 / 2 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 2 / 2 DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 2 / 3 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 1 ===

// ============================================================================
// 4. ĐỒNG BỘ MẠNG 30HZ, CỬA HÀNG CAO CẤP (×1 / ×10 / ×100) & NÚT THỨC TỈNH 🔥
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
    aw.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        Snd.init();
        v20ToggleAwaken(true);
      },
      { passive: false }
    );
    aw.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Snd.init();
      v20ToggleAwaken(true);
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
    '</div><div class="shop-foot">Phím tắt: <b>F / Shift / 🔥</b> = Biến Hình Thức Tỉnh Anime · <b>E</b> = Phóng Tuyệt Kỹ (Hồi 3.2s) · <b>1–6</b> = Dùng Buff.</div>';
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

// ============================================================================
// 5. ĐỘNG CƠ HOẠT ẢNH CHIBI ANIME 60FPS MƯỢT MÀ (FLUID KINEMATICS & TAILS/CAPES)
// ============================================================================
function drawChibiProportions(ctx, bob, ph, run, air, T, cfg) {
  const fo = run ? Math.sin(ph) * 5.4 : 0;
  const fy = air ? -3.5 : -1.2;
  const breath = Math.sin(T * 5.2) * 0.65;
  const armSwing = run ? Math.cos(ph) * 4.5 : Math.sin(T * 4.5) * 1.5;

  // Đôi giày Chibi đàn hồi theo bước chạy
  ctx.fillStyle = cfg.shoe || '#0f172a';
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-6 + fo, fy, 5.8, 3.3, 0, 0, 6.3);
  ctx.ellipse(6 - fo, fy, 5.8, 3.3, 0, 0, 6.3);
  ctx.fill();
  ctx.stroke();

  // Quần nhân vật
  ctx.fillStyle = cfg.pants || '#1e293b';
  rr(-11.5, -13.5 + bob, 23, 12 - bob * 0.3, 5.5);
  ctx.fill();
  ctx.stroke();

  // Cánh tay sau vung theo nhịp chạy
  ctx.fillStyle = cfg.sleeve || cfg.shirt || '#334155';
  ctx.beginPath();
  ctx.ellipse(-11 - armSwing * 0.5, -19 + bob, 3.8, 5.5, 0.25, 0, 6.3);
  ctx.fill();
  ctx.stroke();

  // Thân áo đổ bóng 3D & nhịp thở sống động
  const bg = ctx.createLinearGradient(0, -27 + bob, 0, -11 + bob);
  bg.addColorStop(0, cfg.shirtHi || cfg.shirt || '#334155');
  bg.addColorStop(1, cfg.shirt || '#1e293b');
  ctx.fillStyle = bg;
  rr(-12.5, -26.5 + bob + breath * 0.4, 25, 14.5, 6.5);
  ctx.fill();
  ctx.stroke();

  if (cfg.belt) {
    ctx.fillStyle = cfg.belt;
    ctx.fillRect(-12, -14.5 + bob, 24, 3.4);
  }

  // Cánh tay trước vung tự nhiên
  ctx.fillStyle = cfg.sleeve || cfg.shirtHi || cfg.shirt || '#334155';
  ctx.beginPath();
  ctx.ellipse(11 + armSwing * 0.5, -19 + bob, 3.8, 5.5, -0.25, 0, 6.3);
  ctx.fill();
  ctx.stroke();
}

function drawChibiFace(ctx, bob, T, cfg) {
  const breath = Math.sin(T * 5.2) * 0.55;
  const hy = -44.5 + bob + breath;

  const fg = ctx.createRadialGradient(-3, hy + 7, 2, 0, hy + 10, 18);
  fg.addColorStop(0, cfg.skinHi || '#fff5eb');
  fg.addColorStop(1, cfg.skin || '#ffe0c8');
  ctx.fillStyle = fg;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.2;
  rr(-14.5, hy, 29, 21, 10.5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = cfg.skin || '#ffe0c8';
  ctx.beginPath();
  ctx.arc(-14.5, hy + 11.5, 3.2, 0, 6.3);
  ctx.arc(14.5, hy + 11.5, 3.2, 0, 6.3);
  ctx.fill();
  ctx.stroke();

  if (cfg.baldFacial) {
    if (!cfg.awakened) {
      // Dạng thường của Saitama: Đầu tròn ngơ ngác, mắt chấm bi hiền lành
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
      // Dạng SERIOUS MODE của Saitama (Khác biệt hoàn toàn!):
      // Đổ bóng đen nửa trên trán, đôi mắt trắng rực sắc lẹm, các đường gân bóng đổ dọc gò má!
      const sg = ctx.createLinearGradient(0, hy, 0, hy + 12);
      sg.addColorStop(0, 'rgba(15,23,42,.55)');
      sg.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = sg;
      rr(-14, hy + 1, 28, 11, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2.5, hy + 8.8);
      ctx.lineTo(4.8, hy + 10.8);
      ctx.lineTo(4.2, hy + 13.2);
      ctx.lineTo(-1.8, hy + 12.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(13.5, hy + 8.8);
      ctx.lineTo(6.5, hy + 10.8);
      ctx.lineTo(7.0, hy + 13.2);
      ctx.lineTo(12.8, hy + 12.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(2.2, hy + 11.4, 1.2, 0, 6.3);
      ctx.arc(8.8, hy + 11.4, 1.2, 0, 6.3);
      ctx.fill();

      // Đường gân trán & bóng đổ gò má uy lực chuẩn Anime One Punch Man
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-3.5, hy + 6.5);
      ctx.lineTo(5.5, hy + 9.8);
      ctx.lineTo(14, hy + 6.5);
      ctx.moveTo(5.5, hy + 9.8);
      ctx.lineTo(5.5, hy + 14.5);
      ctx.moveTo(-1, hy + 14.5);
      ctx.lineTo(-1, hy + 17.5);
      ctx.moveTo(11.5, hy + 14.5);
      ctx.lineTo(11.5, hy + 17.5);
      ctx.moveTo(2.5, hy + 17);
      ctx.lineTo(8.8, hy + 16.5);
      ctx.stroke();
    }
    return;
  }

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

// 1. SATORU GOJO (25.000 XU + 350 KIM CƯƠNG — HIẾM & MẠNH NHẤT)
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
    desc: 'Vô Hạ Hạn hộ thể + Phóng Hư Thức: Tử (Hollow Purple) xoắn kép Đỏ-Xanh-Tím!',
    sky: 'cosmic',
    solidHue: 255,
    grassHue: 195,
    tint: 'rgba(56,189,248,.05)',
    fx: 'stars',
    rate: 30,
  },
  passive: {
    id: 'limitless',
    name: 'Lục Nhãn & Hư Thức: Tử',
    desc: 'Khiên Vô Hạ Hạn đẩy lùi đá/thạch nhũ/cá mập lại gần! Tự động (hoặc bấm E) phóng Hư Thức: Tử xóa sổ bẫy phía trước (Hồi 3.2s). Nhấn F để tháo băng bịt mắt lộ Lục Nhãn!',
  },
  trail: ['#38bdf8', '#c084fc', '#ef4444'],
  pal: { body: '#0f172a', edge: '#38bdf8', inner: '#a855f7', belly: 'rgba(56,189,248,.5)' },
  renderCharacter(ctx, { bob, ph, run, air, T, vx, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const awk = !!(P && (P.awakened || P.attackAnimT > 0));
    const sway = Math.sin(T * 6) * 1.8 - clamp(vx * 0.4, -3, 3);
    const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

    const ag = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, awk ? 44 : 32);
    ag.addColorStop(0, awk ? 'rgba(192,132,252,.6)' : 'rgba(56,189,248,.4)');
    ag.addColorStop(0.6, 'rgba(56,189,248,.18)');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, -24 + bob, awk ? 44 : 32, 0, 6.3);
    ctx.fill();

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
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(2.1, hy + 11, 2.6, 0, 6.3);
      ctx.arc(10.1, hy + 11, 2.6, 0, 6.3);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Mái tóc bạch kim uốn lượn mềm mại theo gió (sway)
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14.5, hy + 7);
    ctx.quadraticCurveTo(-19, hy + 2, -22 + sway, hy - 2);
    ctx.lineTo(-13, hy - 1);
    ctx.quadraticCurveTo(-17, hy - 7, -19 + sway, hy - 12);
    ctx.lineTo(-7, hy - 4);
    ctx.quadraticCurveTo(-5, hy - 11, -3 + sway * 1.2, hy - 17);
    ctx.lineTo(3, hy - 5);
    ctx.quadraticCurveTo(8, hy - 10, 10 + sway, hy - 15);
    ctx.lineTo(11, hy - 4);
    ctx.lineTo(21 + sway * 0.8, hy - 6);
    ctx.lineTo(14.5, hy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Quỹ đạo cầu Thương (Xanh) & Hách (Đỏ) bay mượt mà quanh Gojo
    const orbPhase = T * 4.2;
    const rx = Math.cos(orbPhase) * 22;
    const ry = -24 + bob + Math.sin(orbPhase * 2) * 6;
    const bx = Math.cos(orbPhase + Math.PI) * 22;
    const by = -24 + bob - Math.sin(orbPhase * 2) * 6;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(rx, ry, 4.6, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(bx, by, 4.6, 0, 6.3);
    ctx.fill();
  },
  onActiveSkill(P, L) {
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 15, r: 32, kind: 'hollow_purple', life: 1.2, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      Snd.slam();
      G.shake = Math.max(G.shake, 7);
      toast('🟣 HƯ THỨC: TỬ (HOLLOW PURPLE)!');
    }
  },
});

// 2. SON GOKU (15.000 XU + 220 KIM CƯƠNG — BASE <-> MASTERED ULTRA INSTINCT)
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
    desc: 'Nhấn F (hoặc đứng gồng Ki) hóa Bản Năng Vô Cực Tóc Bạc + Bắn tia chưởng Kamehameha kéo dài!',
    sky: 'cosmic',
    solidHue: 230,
    grassHue: 195,
    tint: 'rgba(100,200,255,.05)',
    fx: 'sparks',
    rate: 25,
  },
  passive: {
    id: 'saiyan',
    name: 'Bản Năng Vô Cực & Tia Chưởng Kamehameha',
    desc: 'Tự động lướt né sát thương chí mạng + Phóng Tia Chưởng Kamehameha Xanh-Trắng xuyên phá bẫy phía trước (Hồi 3.2s)! Nhấn F để chuyển đổi Tóc Đen ↔ Tóc Bạc Ultra Instinct!',
  },
  trail: ['#e2e8f0', '#38bdf8', '#a855f7'],
  pal: { body: '#f97316', edge: '#9a3412', inner: '#1d4ed8', belly: 'rgba(30,64,175,.85)' },
  renderCharacter(ctx, { bob, ph, run, air, T, vx, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const mui = !!(P && (P.awakened || (P.gokuForm || 0) >= 3));
    const sway = Math.sin(T * 6.5) * 1.6 - clamp(vx * 0.35, -3, 3);
    const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

    // Hào quang lửa Ki uốn lượn mềm mại quanh thân Goku
    ctx.save();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + T * 5;
      const fx = Math.cos(a) * 16;
      const fy = -22 + bob + Math.sin(a * 1.5) * 14;
      ctx.fillStyle = mui ? 'rgba(224,242,254,.38)' : 'rgba(56,189,248,.22)';
      ctx.beginPath();
      ctx.arc(fx, fy, mui ? 14 : 9, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();

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

    ctx.fillStyle = hairCol;
    ctx.strokeStyle = mui ? '#64748b' : '#000000';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (!mui) {
      ctx.moveTo(-14, hy + 7);
      ctx.lineTo(-28 + sway, hy + 4);
      ctx.lineTo(-16, hy - 1);
      ctx.lineTo(-27 + sway, hy - 8);
      ctx.lineTo(-12, hy - 6);
      ctx.lineTo(-15 + sway, hy - 16);
      ctx.lineTo(-2, hy - 8);
      ctx.lineTo(7 + sway, hy - 17);
      ctx.lineTo(10, hy - 6);
      ctx.lineTo(25 + sway, hy - 9);
      ctx.lineTo(14, hy - 1);
      ctx.lineTo(23 + sway, hy + 4);
      ctx.lineTo(14, hy + 7);
    } else {
      ctx.moveTo(-14.5, hy + 7);
      ctx.lineTo(-26 + sway, hy - 3);
      ctx.lineTo(-14, hy - 3);
      ctx.lineTo(-22 + sway, hy - 16);
      ctx.lineTo(-8, hy - 7);
      ctx.lineTo(-4 + sway * 1.2, hy - 22);
      ctx.lineTo(3, hy - 9);
      ctx.lineTo(11 + sway, hy - 19);
      ctx.lineTo(12, hy - 6);
      ctx.lineTo(24 + sway, hy - 10);
      ctx.lineTo(14.5, hy + 7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },
  onActiveSkill(P, L) {
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 16, r: 26, kind: 'kamehameha', life: 1.15, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      Snd.slam();
      toast('🐉 KAMEHAMEHA TIA CHƯỞNG XUYÊN PHÁ!');
    }
  },
});

// 3. LUFFY (14.000 XU + 200 KIM CƯƠNG — DẠNG THƯỜNG MŨ RƠM <-> GEAR 5 THẦN NIKA)
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
    desc: 'Dạng thường đội Nón Rơm áo đỏ -> Nhấn F hóa Gear 5 Nika + Phóng Nắm Đấm Cao Su Haki Khổng Lồ!',
    sky: 'storm',
    solidHue: 275,
    grassHue: 330,
    tint: 'rgba(255,255,255,.05)',
    fx: 'sparks',
    rate: 24,
  },
  passive: {
    id: 'nika',
    name: 'Trái Cao Su Nika & Nắm Đấm Bajrang Gun',
    desc: 'Chạm vào gai nhọn, cưa máy hay búa đập sẽ biến thành cao su bật Luffy nảy lên trời + Phóng Cánh Tay Cao Su Khổng Lồ bọc Haki Sét Đỏ-Đen phá bẫy (Hồi 3.2s)! Nhấn F để hóa Gear 5!',
  },
  trail: ['#ffffff', '#e0aaff', '#ff0055'],
  pal: { body: '#ffffff', edge: '#7e22ce', inner: '#ef4444', belly: 'rgba(243,232,255,.95)' },
  renderCharacter(ctx, { bob, ph, run, air, T, vx, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const gear5 = !!(P && P.awakened);
    const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

    if (!gear5) {
      drawChibiProportions(ctx, bob, ph, run, air, T, {
        shoe: '#78350f',
        pants: '#1d4ed8',
        shirtHi: '#ef4444',
        shirt: '#dc2626',
        belt: '#facc15',
      });
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
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(8, hy + 14.5);
      ctx.lineTo(12, hy + 14.5);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(-14, hy + 6);
      ctx.lineTo(-16, hy + 11);
      ctx.lineTo(-10, hy + 7);
      ctx.lineTo(0, hy + 9);
      ctx.lineTo(14, hy + 6);
      ctx.fill();

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
      // Dải mây trắng Hagoromo uốn lượn mềm mại theo hàm sóng sin liên tục
      ctx.fillStyle = 'rgba(255,255,255,.96)';
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 9; i++) {
        const u = i / 8;
        const a = Math.PI * 0.72 + u * Math.PI * 1.56;
        const waveR = 23 + Math.sin(T * 7 + i * 0.9) * 2.5;
        const mx = Math.cos(a) * waveR - clamp(vx * 0.5, -4, 4) * (1 - Math.abs(u - 0.5));
        const my = -28 + bob + Math.sin(a) * 17 + Math.cos(T * 6 + i) * 2.2;
        ctx.beginPath();
        ctx.arc(mx, my, 4.8 + Math.sin(T * 5 + i) * 0.8, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      }
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

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      [
        [-11, hy - 1, 7],
        [-3, hy - 5, 8.2],
        [5, hy - 4, 7.8],
        [12, hy, 6.5],
        [0, hy - 9, 7],
      ].forEach(([cx, cy, r], idx) => {
        const buble = Math.sin(T * 6 + idx) * 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy + buble, r, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      });
    }
  },
  onActiveSkill(P, L) {
    if (!P.awakened) P.awakened = true;
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 14, r: 30, kind: 'bajrang_fist', life: 0.95, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      Snd.spring();
      toast('☀️ GOMU GOMU NO BAJRANG GUN (NẮM ĐẤM HAKI)!');
    }
  },
});

// 4. SAITAMA (12.000 XU + 180 KIM CƯƠNG — DẠNG THƯỜNG NGƠ NGÁC <-> SERIOUS MODE HẮC HỎA & ĐẤM ĐỎ 3D)
TB_RegisterSkin({
  id: 'saitama',
  tier: 'supreme',
  name: 'Saitama (One Punch Man)',
  awakenedTitle: 'SAITAMA — CHẾ ĐỘ NGHIÊM TÚC (SERIOUS MODE)',
  icon: '🥊',
  coins: 12000,
  dia: 180,
  env: {
    name: 'Z-City Ruins',
    desc: 'Dạng thường ngơ ngác -> Nhấn F (hoặc sau 1 lần chết) hóa Serious Mode bốc sát khí Đỏ-Đen & phóng Nắm Đấm Găng Đỏ 3D!',
    sky: 'sunset',
    solidHue: 35,
    grassHue: 48,
    tint: 'rgba(255,200,0,.04)',
    fx: 'sparks',
    rate: 20,
  },
  passive: {
    id: 'onepunch',
    name: 'Serious Mode & Nắm Đấm Găng Đỏ 3D',
    desc: 'Khi ở Serious Mode (nhấn F hoặc sau khi chết 1 lần): Bốc sát khí Đỏ-Đen, đá bay lơ lửng quanh chân & Phóng Nắm Đấm Găng Đỏ 3D Khổng Lồ nghiền nát bẫy phía trước (Hồi 3.2s)!',
  },
  trail: ['#ffd43b', '#ef4444', '#ffffff'],
  pal: { body: '#ffd43b', edge: '#b45309', inner: '#ef4444', belly: 'rgba(255,255,255,.9)' },
  renderCharacter(ctx, { bob, ph, run, air, T, vx, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const serious = !!(P && (P.awakened || G.deaths >= 1 || P.attackAnimT > 0));
    const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

    if (serious) {
      // SÁT KHÍ ĐỎ-ĐEN CỦA SERIOUS MODE + ĐÁ VỤN BAY LƠ LỬNG QUANH CHÂN (Khác biệt hoàn toàn với dạng thường!)
      const sg = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 44);
      sg.addColorStop(0, 'rgba(220,38,38,.55)');
      sg.addColorStop(0.5, 'rgba(15,23,42,.45)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, -24 + bob, 44, 0, 6.3);
      ctx.fill();

      // Các viên đá vụn bị áp lực đấm nâng bổng bay lên quanh Saitama
      ctx.fillStyle = '#64748b';
      for (let r = 0; r < 4; r++) {
        const rx = -22 + r * 14;
        const ry = -6 - ((T * 35 + r * 9) % 28);
        ctx.fillRect(rx, ry, 4, 4);
      }
    }

    // Áo choàng trắng uốn lượn mềm mại bằng đường cong sóng liên tục (Sine-Wave Billowing Cape)
    const wind = Math.min(18, Math.abs(vx) * 2.8);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (!serious) {
      const w1 = Math.sin(T * 8) * 3.5 + wind * 0.5;
      ctx.moveTo(-8, -26 + bob);
      ctx.bezierCurveTo(-18 - w1, -20 + bob, -16 - w1, -10 + bob, -20 - w1, -2 + bob);
      ctx.quadraticCurveTo(-14 - w1 * 0.5, -1 + bob + Math.cos(T * 8) * 2, -8, -3 + bob);
    } else {
      // Khi Serious Mode: Áo choàng bung rộng 5 đỉnh sóng phần phật sau lưng!
      ctx.moveTo(-10, -27 + bob);
      const topX = -34 - wind;
      const topY = -36 + bob + Math.sin(T * 12) * 5;
      ctx.quadraticCurveTo(-24 - wind * 0.5, -34 + bob, topX, topY);
      for (let k = 1; k <= 4; k++) {
        const u = k / 4;
        const px = lerp(topX, -12, u) + Math.sin(T * 14 + k * 1.6) * 4;
        const py = lerp(topY, -2 + bob, u);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(8, -4 + bob);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawChibiProportions(ctx, bob, ph, run, air, T, {
      shoe: '#b91c1c',
      pants: '#eab308',
      shirtHi: '#fde047',
      shirt: '#eab308',
      belt: '#1e293b',
    });
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

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-6.5, -25 + bob, 2.6, 0, 6.3);
    ctx.arc(9.5, -25 + bob, 2.6, 0, 6.3);
    ctx.fill();

    drawChibiFace(ctx, bob, T, {
      skin: '#ffedd5',
      baldFacial: true,
      awakened: serious,
    });
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.ellipse(-4, hy + 4, 5, 2.4, -0.3, 0, 6.3);
    ctx.fill();

    // Đôi găng tay đỏ (Khi ở Serious Mode găng tay phải đưa lên trước ngực tích tụ lực đấm đỏ rực!)
    const punchExt = P && P.attackAnimT > 0 ? 15 : serious ? 4 : 0;
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-11, -16 + bob, 4.8, 0, 6.3);
    ctx.arc(13 + punchExt, -17 + bob, serious ? 6.8 : 5.5, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  },
  onActiveSkill(P, L) {
    P.awakened = true;
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 16.5, r: 34, kind: 'serious_fist', life: 1.0, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      G.groundShockwaves.push({
        x: P.x + PW / 2,
        y: P.y + PH,
        r: 15,
        maxR: 175,
        col: '#facc15',
        life: 0.45,
      });
      Snd.slam();
      G.shake = Math.max(G.shake, 9);
      toast('🥊 SERIOUS SERIES: SERIOUS PUNCH (NẮM ĐẤM 3D)!');
    }
  },
});

// 5. NARUTO (12.000 XU + 180 KIM CƯƠNG — 9 ĐUÔI CỬU VĨ UỐN LƯỢN SÓNG SIN ĐA KHỚP MƯỢT MÀ)
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
    desc: 'Nhấn F bật 9 đuôi Cửu Vĩ uốn lượn mềm mại + Phóng Phong Độn Rasenshuriken 4 cánh xoay tít!',
    sky: 'ember',
    solidHue: 25,
    grassHue: 115,
    tint: 'rgba(255,140,0,.05)',
    fx: 'embers',
    rate: 22,
  },
  passive: {
    id: 'kurama',
    name: 'Cửu Vĩ Hộ Thể & Phong Độn Rasenshuriken',
    desc: 'Chạy nhanh +32%, Nhảy 3 Lần, Miễn nhiễm Độc/Đảo Phím & Phóng Rasenshuriken 4 cánh xoay phá bẫy phía trước (Hồi 3.2s)! Nhấn F để bật/tắt 9 đuôi lửa Baryon Kurama!',
  },
  trail: ['#ff922b', '#ef4444', '#38bdf8'],
  pal: { body: '#fb923c', edge: '#1e293b', inner: '#facc15', belly: 'rgba(30,41,59,.85)' },
  renderCharacter(ctx, { bob, ph, run, air, T, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const baryon = !!(P && P.awakened);
    const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

    if (baryon) {
      // 9 CHIẾC ĐUÔI CỬU VĨ UỐN LƯỢN MỀM MẠI BẰNG SÓNG SIN ĐA KHỚP (Không còn cứng đơ!)
      for (let t = -4; t <= 4; t++) {
        const baseA = -Math.PI * 0.52 + t * 0.23;
        const w1 = Math.sin(T * 6.5 + t * 0.8) * 0.16;
        const w2 = Math.cos(T * 6.5 + t * 0.8) * 0.22;
        const midX = Math.cos(baseA + w1) * 24;
        const midY = -20 + bob + Math.sin(baseA + w1) * 24;
        const tipX = Math.cos(baseA + w2) * 44;
        const tipY = -22 + bob + Math.sin(baseA + w2) * 42;

        const tg = ctx.createLinearGradient(0, -16 + bob, tipX, tipY);
        tg.addColorStop(0, '#fde047');
        tg.addColorStop(0.5, '#f97316');
        tg.addColorStop(1, '#dc2626');
        ctx.fillStyle = tg;
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-4, -15 + bob);
        ctx.quadraticCurveTo(midX - 6, midY, tipX, tipY);
        ctx.quadraticCurveTo(midX + 6, midY + 3, 4, -15 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

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

    ctx.fillStyle = '#1e293b';
    rr(-14, hy + 1.5, 28, 5.8, 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    rr(-2, hy + 2.2, 12, 4.4, 1.5);
    ctx.fill();

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
  },
  onActiveSkill(P, L) {
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 15, r: 28, kind: 'rasenshuriken', life: 1.15, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      Snd.djump();
      toast('🌀 PHONG ĐỘN: RASENSHURIKEN 4 CÁNH!');
    }
  },
});

// 6. PIKACHU (10.000 XU + 150 KIM CƯƠNG — TAI & ĐUÔI ĐÀN HỒI MƯỢT MÀ + MŨI LAO SẤM SÉT)
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
    desc: 'Tai và đuôi tia chớp đung đưa đàn hồi mượt mà + Phóng mũi lao Sấm Sét 100.000V!',
    sky: 'storm',
    solidHue: 48,
    grassHue: 130,
    tint: 'rgba(255,230,0,.05)',
    fx: 'sparks',
    rate: 26,
  },
  passive: {
    id: 'pikachu',
    name: 'Thần Sấm & Mũi Lao Điện 100.000V',
    desc: 'Chạy siêu tốc +35%, Nhảy Đôi & Phóng Mũi Lao Sấm Sét 100.000V hủy diệt bẫy và cá mập phía trước (Hồi 3.2s)! Nhấn F để bật trạng thái Gigantamax Super Charged!',
  },
  trail: ['#ffe066', '#ffd43b', '#38bdf8'],
  pal: { body: '#fde047', edge: '#854d0e', inner: '#ef4444', belly: 'rgba(254,249,195,.9)' },
  renderCharacter(ctx, { bob, ph, run, T, vx, o }) {
    const P = G.me && o.slot === G.myslot ? G.me : null;
    const gmax = !!(P && (P.awakened || P.attackAnimT > 0));

    // Đuôi tia chớp xoay đàn hồi mượt mà theo nhịp chạy (Spring Tail Wag)
    const tailWag = Math.sin(T * 10) * 0.18 - clamp(vx * 0.03, -0.25, 0.25);
    ctx.save();
    ctx.translate(-10, -12 + bob);
    ctx.rotate(tailWag);
    ctx.fillStyle = gmax ? '#fef08a' : '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, -8);
    ctx.lineTo(-6, -12);
    ctx.lineTo(-22, -26);
    ctx.lineTo(-3, -18);
    ctx.lineTo(-7, -13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const earRot = Math.sin(T * 7.5) * 0.12;
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
      for (let i = 0; i < 3; i++) {
        const a = T * 4 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 18, -42 + bob + Math.sin(a) * 5, 4.8, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      }
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
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 17.5, r: 28, kind: 'thunderbolt', life: 0.95, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      Snd.slam();
      toast('⚡ GIGANTAMAX VOLT CRASH 100.000V!');
    }
  },
});

// 7. RORONOA ZORO (13.500 XU + 190 KIM CƯƠNG — TAM KIẾM PHÁI HAKI DIÊM VƯƠNG)
TB_RegisterSkin({
  id: 'zoro',
  tier: 'supreme',
  name: 'Roronoa Zoro (King of Hell)',
  awakenedTitle: 'ZORO — DIÊM VƯƠNG TAM KIẾM PHÁI',
  icon: '⚔️',
  coins: 13500,
  dia: 190,
  env: {
    name: 'King of Hell Wano',
    desc: 'Tam Kiếm Phái ngậm Hòa Đạo Nhất Văn, phóng 3 luồng Kiếm Khí Bán Nguyệt Haki Diêm Vương!',
    sky: 'storm',
    solidHue: 145,
    grassHue: 130,
    tint: 'rgba(16,185,129,.05)',
    fx: 'sparks',
    rate: 22,
  },
  passive: {
    id: 'santoryu',
    name: 'Diêm Vương Tam Kiếm Khí',
    desc: 'Phóng 3 luồng Kiếm Khí Bán Nguyệt Xanh-Tím chém nát đá lăn, thạch nhũ, cá mập & trụ laser phía trước (Hồi 3.2s) + Chạy nhanh +28% & Nhảy 3 Lần!',
  },
  trail: ['#10b981', '#a855f7', '#0f172a'],
  pal: { body: '#15803d', edge: '#052e16', inner: '#a855f7', belly: 'rgba(16,185,129,.7)' },
  renderCharacter(ctx, { bob, ph, run, air, T }) {
    drawChibiProportions(ctx, bob, ph, run, air, T, {
      shoe: '#0f172a',
      pants: '#064e3b',
      shirtHi: '#22c55e',
      shirt: '#15803d',
      belt: '#dc2626',
    });
    drawChibiFace(ctx, bob, T, {
      skin: '#ffedd5',
      eye: '#dc2626',
      serious: true,
    });
    const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, hy + 6);
    ctx.lineTo(-20, hy - 4);
    ctx.lineTo(-9, hy - 2);
    ctx.lineTo(-11, hy - 12);
    ctx.lineTo(-1, hy - 4);
    ctx.lineTo(6, hy - 13);
    ctx.lineTo(10, hy - 3);
    ctx.lineTo(19, hy - 6);
    ctx.lineTo(14, hy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -27 + bob);
    ctx.lineTo(26, -29 + bob + Math.sin(T * 12) * 2);
    ctx.stroke();
  },
  onActiveSkill(P, L) {
    if (
      v20LaunchUniqueSkill(
        P,
        L,
        { speed: 16, r: 30, kind: 'dragon_slash', life: 1.0, cd: SKILL_COOLDOWN },
        true
      )
    ) {
      Snd.slam();
      toast('⚔️ TAM KIẾM PHÁI: LUYỆN NGỤC QUỶ TRẢM!');
    }
  },
});

// 3 SKIN MYTHIC CAO CẤP:
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
    name: 'Hồn Ma Hư Không',
    desc: 'Đi xuyên 1 sát thương chí mạng mỗi 6s & Vô hiệu hóa 100% bẫy đồng xu Quỷ Dị.',
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
    name: 'Long Vũ Cửu Thiên',
    desc: 'Nhảy 3 Lần liên tiếp trên không (Triple Jump), chạy nhanh +25% & Hút xu/chìa khóa toàn màn hình.',
  },
  trail: ['#ffd43b', '#ff4d6d', '#00ffe0'],
  pal: { body: '#ffb703', edge: '#9d0208', inner: '#00f5d4', belly: 'rgba(255,245,190,.85)' },
});

function v20UpdateAllHeroSkills(P, L) {
  if (!P || !L || P.dead || G.won) return;
  if (P.skillCd > 0) P.skillCd = Math.max(0, P.skillCd - STEP);
  if (P.guardCd > 0) P.guardCd = Math.max(0, P.guardCd - STEP);
  if (P.attackAnimT > 0) P.attackAnimT -= STEP;
  if (P.awakenAnimT > 0) P.awakenAnimT -= STEP;

  v20UpdateSkillShots(L);

  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  const isAnimeHero =
    curPassive === 'limitless' ||
    curPassive === 'saiyan' ||
    curPassive === 'nika' ||
    curPassive === 'onepunch' ||
    curPassive === 'kurama' ||
    curPassive === 'pikachu' ||
    curPassive === 'santoryu';

  if (!isAnimeHero) return;

  P.rev = 0;
  P.dj = true;
  P.djT = 999;
  if (P.onGround) P.extraHops = 2;

  if (curPassive === 'limitless') {
    for (const q of L.stalactites || []) {
      if (q.st === 2 && Math.hypot(q.x + q.w / 2 - cx, q.y + q.fy + q.h - cy) < 120) {
        q.vy = -4.5;
        q.st = 3;
        q.t = 1.5;
        sparkle(q.x + q.w / 2, q.y + q.fy, 8, 1.2, '#38bdf8');
      }
    }
    if (L.anomalies) {
      for (const sp of L.anomalies.spitters || []) {
        if (sp.glob && Math.hypot(sp.glob.x - cx, sp.glob.y - cy) < 115) sp.glob = null;
      }
    }
  }

  if (curPassive === 'onepunch' && G.deaths >= 1 && !P._autoSerious) {
    P._autoSerious = true;
    P.awakened = true;
  }

  // Tự động ngắm bắn mục tiêu nguy hiểm phía trước/trên đầu khi kỹ năng đã hồi xong (3.2s cooldown):
  if (!(P.skillCd > 0)) {
    const threat = v20FindFrontOrOverheadThreat(P, L, 360);
    if (threat) {
      const styleMap = {
        limitless: { speed: 15, r: 30, kind: 'hollow_purple', life: 1.15 },
        saiyan: { speed: 16, r: 26, kind: 'kamehameha', life: 1.1 },
        onepunch: { speed: 16.5, r: 32, kind: 'serious_fist', life: 0.95 },
        nika: { speed: 14.5, r: 28, kind: 'bajrang_fist', life: 0.95 },
        kurama: { speed: 15, r: 26, kind: 'rasenshuriken', life: 1.1 },
        pikachu: { speed: 17.5, r: 26, kind: 'thunderbolt', life: 0.9 },
        santoryu: { speed: 16, r: 28, kind: 'dragon_slash', life: 0.95 },
      };
      const st = styleMap[curPassive];
      if (st) v20LaunchUniqueSkill(P, L, st, false);
    }
  }
}
// === KẾT THÚC PHẦN 2 / 3 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 3 / 3 (PHẦN CUỐI) DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 3 / 3 (PHẦN CUỐI) — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 2 / 3 ===

// ============================================================================
// 6. VẬT LÝ DÂY NGẮN (60px -> 96px MAX) + KÉO CẢ ĐỘI + THÁP SỐNG CÕNG NHAU NHẢY
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
// 7. ĐỒ HỌA ĐỊA HÌNH, ĐÁ CUỘI 3D, HỐ NƯỚC BƠI & BỘ VẼ NHÂN VẬT DRAWBUNNY
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
    if (s.swimPit && cx >= s.x - 16 && cx <= s.x + s.w + 16 && feet >= GY + 12) return true;
  }
  return false;
}

drawCrusher = function (c, cb) {
  const sx = c.shake ? Math.sin(G.lt * 130) * 3.5 : 0;
  const x = c.x + sx;
  const y = cb - c.h;
  const w = c.w;
  const h = c.h;
  const cx = x + w / 2;
  ctx.fillStyle = '#334155';
  ctx.fillRect(cx - 16, c.top, 10, Math.max(0, y - c.top));
  ctx.fillRect(cx + 6, c.top, 10, Math.max(0, y - c.top));
  const gr = ctx.createLinearGradient(x, y, x + w, y + h - 20);
  gr.addColorStop(0, '#475569');
  gr.addColorStop(0.5, '#1e293b');
  gr.addColorStop(1, '#0f172a');
  ctx.fillStyle = gr;
  rr(x, y, w, h - 20, 6);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = c.shake ? '#ef4444' : '#090d16';
  ctx.stroke();
  ctx.fillStyle = c.shake || cb > c.restB + 10 ? '#ff1744' : '#38bdf8';
  ctx.beginPath();
  ctx.arc(cx, y + (h - 32) * 0.5, 11, 0, 6.3);
  ctx.fill();
  drawSpikesRaw({ x: x + 2, y: y + h - 20, w: w - 4, h: 20, dir: 'down' });
};

drawCeil = function (t) {
  const cb = t.st === 1 ? t.cb : t.top;
  const w = t.x1 - t.x0;
  const SH = t.SH;
  const y = cb - SH;
  for (const a of t.alc) {
    ctx.fillStyle = 'rgba(56,189,248,.18)';
    ctx.fillRect(a[0], t.gy, a[1] - a[0], 70);
  }
  const gr = ctx.createLinearGradient(0, y, 0, y + SH);
  gr.addColorStop(0, '#334155');
  gr.addColorStop(1, '#0f172a');
  ctx.fillStyle = gr;
  ctx.fillRect(t.x0, y, w, SH - 20);
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 4;
  ctx.strokeRect(t.x0, y, w, SH - 20);
  drawSpikesRaw({ x: t.x0 + 4, y: y + SH - 20, w: w - 8, h: 20, dir: 'down' });
};

drawSweeper = function (s, cam) {
  const T = G.lt;
  const front = s.cx + s.w;
  const y = cam.y - 100;
  const h = cam.vh + 200;
  const biome = (G.L && G.L.biome) || 'normal';
  ctx.save();
  const c0 =
    biome === 'toxic'
      ? 'rgba(8,28,21,.96)'
      : biome === 'water'
      ? 'rgba(5,20,38,.96)'
      : 'rgba(15,5,25,.96)';
  const c1 =
    biome === 'toxic'
      ? 'rgba(45,106,79,.88)'
      : biome === 'water'
      ? 'rgba(15,65,110,.88)'
      : 'rgba(80,15,40,.9)';
  const bg = ctx.createLinearGradient(front - 480, 0, front, 0);
  bg.addColorStop(0, c0);
  bg.addColorStop(1, c1);
  ctx.fillStyle = bg;
  ctx.fillRect(front - 1400, y, 1400, h);
  for (let yy = Math.floor(y / 130) * 130; yy < y + h; yy += 130) {
    const cy = yy + 65;
    const wag = Math.sin(T * 7 + yy * 0.02) * 18;
    if (biome === 'water' || biome === 'toxic') {
      ctx.strokeStyle = biome === 'toxic' ? '#80ed99' : '#00f5d4';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(front - 40, cy);
      ctx.quadraticCurveTo(front + 15, cy + wag, front + 48, cy - wag * 0.7);
      ctx.stroke();
    } else {
      drawSaw(front + 10, cy, 42, T * 1.8);
    }
    ctx.fillStyle = biome === 'toxic' ? '#b5179e' : '#ff1744';
    ctx.beginPath();
    ctx.ellipse(front - 55, cy, 18, 10, 0, 0, 6.3);
    ctx.fill();
  }
  ctx.restore();
};

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
    const cx = x + PW / 2;
    const cy = y + PH / 2;
    for (const gz of L.gravZones) {
      if (cx >= gz.x0 && cx <= gz.x1 && cy >= gz.y0 - 45 && cy <= gz.y1 + 45) {
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

    // Thanh hiển thị Hồi chiêu Kỹ năng nhỏ gọn dưới chân người chơi chính:
    if (G.me && o.slot === G.myslot && G.me.skillCd > 0) {
      const ratio = 1 - clamp(G.me.skillCd / SKILL_COOLDOWN, 0, 1);
      ctx.fillStyle = 'rgba(15,23,42,.75)';
      rr(x - 2, y + PH + 4, PW + 4, 4, 2);
      ctx.fill();
      ctx.fillStyle = '#00f5d4';
      rr(x - 1, y + PH + 5, (PW + 2) * ratio, 2, 1);
      ctx.fill();
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
  ctx.restore();
};

const _origDrawLegendSky2 = drawLegendSky2;
drawLegendSky2 = function (theme, cam, T) {
  const L = G.L;
  if (theme === 'heaven') {
    const sx = cw * 0.5 - cam.x * 0.008;
    const sy = ch * 0.22;
    const r = Math.min(cw, ch) * 0.16;
    const g = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 3.8);
    g.addColorStop(0, 'rgba(255,253,220,.95)');
    g.addColorStop(0.4, 'rgba(253,224,71,.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    drawSkyCloudLayer(L, cam, 0.05, ch * 0.12, 1.5, 'rgba(255,255,255,.92)', 6);
    drawSkyCloudLayer(L, cam, 0.14, ch * 0.28, 1.2, 'rgba(254,249,195,.88)', 5);
    return;
  }
  if (theme === 'hell') {
    const mx = cw * 0.72 - cam.x * 0.01;
    const my = ch * 0.24;
    const r = Math.min(cw, ch) * 0.14;
    const g = ctx.createRadialGradient(mx, my, r * 0.2, mx, my, r * 3.2);
    g.addColorStop(0, '#ef4444');
    g.addColorStop(0.5, 'rgba(153,27,27,.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, 6.3);
    ctx.fill();
    drawSkyCloudLayer(L, cam, 0.06, ch * 0.1, 1.5, 'rgba(40,5,5,.75)', 5);
    return;
  }
  if (theme === 'toxic') {
    drawStars(cam, T, 0.45);
    drawSkyCloudLayer(L, cam, 0.06, ch * 0.1, 1.5, 'rgba(45,106,79,.55)', 5);
    drawSkyCloudLayer(L, cam, 0.14, ch * 0.26, 1.2, 'rgba(114,9,183,.35)', 4);
    return;
  }
  return _origDrawLegendSky2(theme, cam, T);
};

// ============================================================================
// 8. SỬA TRIỆT ĐỂ LỒNG GIAM (ARENA), BẪY TRẦN (CEIL) & KHÔI PHỤC CÁ MẬP MEGALODON
// ============================================================================
function updateRunKey(bodies) {
  const L = G.L;
  const k = L.key;
  if (!k || !k.run || G.keyGot) return;
  const R = k.run;
  if (isNet() && !isHostSlot()) {
    k.x += (k.tx - k.x) * 0.35;
    k.y += (k.ty - k.y) * 0.35;
    return;
  }
  let nb = null;
  let nd = 1e9;
  for (const b of bodies) {
    if (b.dead) continue;
    const d = Math.hypot(b.x + PW / 2 - k.x, b.y + PH / 2 - k.y);
    if (d < nd) {
      nd = d;
      nb = b;
    }
  }
  k.t += STEP;
  if (k.cool > 0) k.cool -= STEP;
  if (nb && nd < 130 && !(k.cool > 0) && k.fl < 4) {
    const spots = [
      [R.x0 + 70, R.gy - 150],
      [R.x1 - 70, R.gy - 155],
      [(R.x0 + R.x1) / 2, R.gy - 190],
      [clamp(nb.x + (nb.face > 0 ? -230 : 230), R.x0 + 55, R.x1 - 55), R.gy - 65],
    ];
    const pick = spots[(k.fl + (G.chaosSeed % 4)) % spots.length];
    sparkle(k.x, k.y, 16, 1.5, '#ff4d6d');
    k.x = pick[0];
    k.y = pick[1];
    k.fl++;
    k.cool = 0.72;
    Snd.djump();
  } else if (nb && nd < 175 && k.fl >= 4) {
    k.x = clamp(k.x + Math.sign(k.x - nb.x) * 2.1, R.x0 + 45, R.x1 - 45);
    k.y = R.gy - 90 + Math.sin(G.lt * 6.5) * 52;
  }
}

function onBonk(P, s, how) {
  const bk = s.bonk;
  P.vx = 0;
  if (how === 'head') P.vy = 1.5;
  if (!bk.rev) {
    bk.rev = true;
    bk.sh = 1;
    P.wlock = Math.max(P.wlock, 16);
    Snd.pop();
    G.shake = Math.max(G.shake, 6);
    sparkle(bk.x + bk.w / 2, bk.y + bk.h, 12, 1.3, '#ffcc66');
    netEv({ t: 'bonk', i: bk.i });
  }
}

function v11TrapAct(t, i, a, v) {
  const L = G.L;
  if (t.k === 'ceil') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t0 = +v || G.lt;
      Snd.shake();
      G.shake = Math.max(G.shake, 4);
    }
  } else if (t.k === 'ferry') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t0 = +v || G.lt;
      Snd.shake();
    }
  } else if (t.k === 'door2') {
    if (a === 'flee' && t.st === 0) {
      t.st = 1;
      t.t = 0;
      t.from = L.exit.x;
      Snd.shake();
    }
  } else if (t.k === 'betray') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t = 3.8;
      Snd.shake();
      const n = t.cr.length;
      t.cr.forEach((ci, k) => {
        const c = L.crumbles[ci];
        if (c && c.st === 0) {
          c.st = 1;
          c.t = 0.07 + (n - 1 - k) * 0.07;
        }
      });
    }
  } else if (t.k === 'pass_drop') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t = 2.8;
      t.cr.forEach((ci, k) => {
        const c = L.crumbles[ci];
        if (c && c.st === 0) {
          c.st = 1;
          c.t = 0.03 + k * 0.04;
          c.fast = true;
        }
      });
    }
  } else if (t.k === 'ambush') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t = 0.2;
      for (const q of L.stalactites || []) {
        if (q.sniper && q.st === 0 && Math.abs(q.x - t.zx1) < 340) {
          q.st = 2;
          q.vy = 9.5;
          q.fy = 0;
          q.gnd = groundBelow(q.x, q.x + q.w, q.y + q.h);
        }
      }
    }
  } else if (t.k === 'shift_ledge' || t.k === 'double_bluff') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t = 0;
    } else if (a === 'hit' && t.st === 1) {
      t.st = 2;
      t.t = 1.6;
      if (t.topSpk) {
        t.topSpk.hid = false;
        t.topSpk.live = true;
        t.topSpk.ph = 1;
      }
      Snd.slam();
    }
  } else if (t.k === 'troll_spring') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t = 4.0;
      const sp = L.springs[t.sIdx];
      if (sp) sp.power = 23.8;
      for (const s of L.spikes) {
        if (s.bt === i) {
          s.hid = false;
          s.live = true;
          s.ph = 1;
        }
      }
    }
  } else if ((t.k === 'syncgate' || t.k === 'skygate') && a === 'sync') {
    t.open = true;
    if (L.gates[t.gi]) L.gates[t.gi].act = true;
    Snd.gate(true);
  }
}

function v11ResetTrap(L, t) {
  if (t.k === 'ceil') {
    t.st = 0;
    t.cb = t.top;
  } else if (t.k === 'ferry') {
    t.st = 0;
    t.cx = t.cx0;
    t.px = t.cx0;
    t.dx = 0;
    t.dir = 0;
    t.rot = 0;
  } else if (t.k === 'door2') {
    const e = L.exit;
    e.x = t.ex0;
    e.y = t.ey0;
    e.lock = true;
    e.legs = false;
    e.hide = false;
    t.n = 0;
    t.from = t.ex0;
  } else if (t.k === 'shift_ledge' || t.k === 'double_bluff') {
    t.cur = 0;
    const s = L.solids[t.si];
    if (s) s[0] = t.baseX;
    if (t.topSpk) {
      t.topSpk.x = t.baseX + 115;
      t.topSpk.hid = true;
      t.topSpk.live = false;
      t.topSpk.ph = 0;
    }
  } else if (t.k === 'troll_spring') {
    const sp = L.springs[t.sIdx];
    if (sp) sp.power = 17.5;
  } else if (t.k === 'sled') {
    t.x = t.x0;
    t.vx = 0;
    t.st = 0;
    t.wait = 0;
    if (L.solids[t.si]) L.solids[t.si][0] = t.x0;
  } else if (t.k === 'syncgate' || t.k === 'skygate') {
    t.open = false;
    if (L.gates[t.gi]) L.gates[t.gi].act = false;
  } else if (t.k === 'swap_pad') {
    t.used = false;
  }
}

function trapAct(i, a, v, who) {
  const L = G.L;
  if (!L || !L.traps) return;
  const t = L.traps[i];
  if (!t) return;
  const mine = who === G.myslot;
  if (t.k === 'bait') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t = 0.13;
    }
  } else if (t.k === 'fake') {
    const f = t.plates[v | 0];
    if (a === 'hit' && f && !f.used) {
      f.used = true;
      Snd.plate(true);
      if (f.v === 'stalac') {
        for (let q = 0; q < 4; q++) {
          L.stalactites.push({
            x: f.x - 40 + q * 65,
            y: f.y + 10 - 300,
            w: 34,
            h: 66,
            st: 2,
            t: 0,
            fy: 0,
            vy: 6.5,
            gnd: f.y + 10,
            dyn: true,
          });
        }
      } else if (mine) {
        G.me.rev = 4.2;
      }
    }
  } else if (t.k === 'door') {
    const e = L.exit;
    if (a === 'flee' && t.st === 0) {
      t.st = 1;
      t.t = 0;
      Snd.shake();
    } else if (a === 'fix' && t.st === 0) {
      t.st = 3;
      e.lock = false;
      e.x = t.ex0;
      e.y = t.ey0;
      Snd.key();
    }
  } else if (t.k === 'arena') {
    if (a === 'fire' && t.st === 0) {
      t.st = 1;
      t.t0 = +v || G.lt;
      t.empty = 0;
      Snd.shake();
    } else if (a === 'done' && t.st === 1) {
      t.st = 2;
      Snd.gate(true);
      toast('🔓 Lồng giam đã mở!');
    } else if (a === 'reset' && t.st === 1) {
      t.st = 0;
      t.empty = 0;
    }
  } else {
    v11TrapAct(t, i, a, v, who);
  }
}

function updateTraps(bodies) {
  const L = G.L;
  const me = G.me;
  const cx = me.x + PW / 2;
  const cy = me.y + PH / 2;
  const feet = me.y + PH;
  const alive = !me.dead && !G.won;
  const host = isHostSlot();

  v16UpdateAnomalies();

  if (me.portalCd > 0) me.portalCd -= STEP;
  for (const pt of L.portals || []) {
    if (alive && !(me.portalCd > 0) && Math.hypot(cx - pt.x0, cy - pt.y0) < 38) {
      me.x = pt.x1 - PW / 2;
      me.y = pt.y1 - PH / 2;
      me.portalCd = 1.1;
      Snd.key();
      sparkle(pt.x1, pt.y1, 20, 1.6, '#00ffe0');
      break;
    }
  }
  for (const dc of L.decoys || []) {
    if (!dc.boom && alive && Math.hypot(cx - dc.x, cy - dc.y) < 32) {
      dc.boom = true;
      Snd.slam();
      G.shake = 9;
      die('decoy_key');
    }
  }
  for (const bh of L.blackHoles || []) {
    const dx = bh.x - cx;
    const dy = bh.y - cy;
    const d = Math.hypot(dx, dy);
    if (alive && d < bh.pullR && d > 8) {
      const f = (1 - d / bh.pullR) * 0.58;
      me.vx += (dx / d) * f;
      me.vy += (dy / d) * f;
      if (d < bh.killR) die('black_hole');
    }
  }
  for (const cv of L.conveyors || []) {
    if (alive && me.onGround && cx >= cv.x && cx <= cv.x + cv.w && Math.abs(feet - cv.y) < 10) {
      me.x += cv.spd;
    }
  }
  for (const ph of L.phantoms || []) {
    const wave = Math.sin(G.lt * ph.spd + ph.phase);
    ph.solid = wave > -0.15;
    ph.alpha = clamp((wave + 0.35) / 0.8, 0.08, 1);
    if (L.solids[ph.si]) L.solids[ph.si][1] = ph.solid ? ph.y : 9999;
  }
  for (const trt of L.turrets || []) {
    const dist = Math.hypot(cx - trt.x, cy - trt.y);
    trt.ang = Math.atan2(cy - trt.y, cx - trt.x);
    if (dist < 560 && alive) {
      trt.charge = (trt.charge || 0) + STEP;
      if (trt.charge >= trt.period) {
        trt.charge = 0;
        trt.fireT = 0.22;
        trt.hitX = cx;
        trt.hitY = cy;
        Snd.slam();
      }
      if (trt.fireT > 0) {
        trt.fireT -= STEP;
        if (Math.abs(trt.ang - Math.atan2(trt.hitY - trt.y, trt.hitX - trt.x)) < 0.14) {
          die('sniper_laser');
        }
      }
    } else {
      trt.charge = Math.max(0, (trt.charge || 0) - STEP * 0.5);
    }
  }
  for (const sh of L.sharks || []) {
    sh.cx = pingPong(sh.x0, sh.x1, sh.speed, sh.off, G.lt);
    sh.dir =
      Math.cos((((G.lt + sh.off) * sh.speed * 60) / Math.max(1, sh.x1 - sh.x0)) * Math.PI) >= 0
        ? 1
        : -1;
    const tg = nearestBodyTo(sh.cx, sh.cy);
    sh.cy += ((tg ? clamp(tg.y + PH / 2, sh.minY, sh.maxY) : sh.baseY) - sh.cy) * 0.055;
    if (alive && rectsOverlap(me.x + 4, me.y + 4, PW - 8, PH - 8, sh.cx - 48, sh.cy - 22, 96, 44)) {
      die('shark');
    }
  }

  const tr = L.traps;
  if (!tr || !tr.length) return;
  for (let i = 0; i < tr.length; i++) {
    const t = tr[i];
    if (t.k === 'bait') {
      const sp = t._sp || (t._sp = L.spikes.filter((s) => s.bt === i));
      if (t.st === 0) {
        if (alive && cx > t.zx0 && cx < t.zx1 && Math.abs(feet - t.gy) < 170) {
          const bt = (me.bt = me.bt || {});
          const s = (bt[i] = bt[i] || { armed: false, maxX: cx });
          const grounded = me.onGround && Math.abs(feet - t.gy) < 4;
          if (grounded) {
            s.armed = true;
            if (cx > s.maxX) s.maxX = cx;
          } else if (s.armed && feet < t.gy - 12) {
            trapSend(i, 'fire', 0);
          }
          if (t.st === 0 && grounded && s.armed && me.vx < -1.2 && cx < s.maxX - 45) {
            trapSend(i, 'fire', 1);
          }
        }
      } else if (t.st === 1) {
        t.t -= STEP;
        sp.forEach((s) => {
          s.hid = false;
          s.ph = clamp(1 - t.t / 0.13, 0, 1) * 0.4;
        });
        if (t.t <= 0) {
          t.st = 2;
          t.t = 1.8;
          sp.forEach((s) => {
            s.live = true;
            s.ph = 1;
          });
          Snd.slam();
        }
      } else if (t.st === 2) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 3;
          t.t = 0.35;
          sp.forEach((s) => {
            s.live = false;
          });
        }
      } else if (t.st === 3) {
        t.t -= STEP;
        sp.forEach((s) => {
          s.ph = Math.max(0, t.t / 0.35);
        });
        if (t.t <= 0) {
          t.st = 4;
          t.t = 0.7;
          sp.forEach((s) => {
            s.hid = true;
            s.ph = 0;
          });
        }
      } else {
        t.t -= STEP;
        if (t.t <= 0) t.st = 0;
      }
    } else if (t.k === 'ceil') {
      // SỬA TRIỆT ĐỂ BẪY TRẦN SẬP (COMPACTOR CEIL):
      // Hễ người chơi bước hoặc nhảy vào phạm vi x0..x1 là trần lập tức sập xuống theo chu kỳ!
      if (t.st === 0) {
        t.cb = t.top;
        if (alive && cx > t.x0 + 25 && cx < t.x1 - 40 && feet <= t.gy + 80) {
          trapSend(i, 'fire', G.lt);
        }
      } else if (t.st === 1) {
        const el = Math.max(0, G.lt - t.t0);
        const dropDur = Math.max(1.8, (t.gy - t.top) / ((t.speed || 2.2) * 55));
        const holdDur = 1.1;
        const riseDur = 1.4;
        const totalCyc = dropDur + holdDur + riseDur;
        if (el < dropDur) {
          t.cb = lerp(t.top, t.gy, el / dropDur);
        } else if (el < dropDur + holdDur) {
          if (t.cb < t.gy - 1) {
            Snd.slam();
            G.shake = Math.max(G.shake, 7);
          }
          t.cb = t.gy;
        } else if (el < totalCyc) {
          t.cb = lerp(t.gy, t.top, (el - dropDur - holdDur) / riseDur);
        } else {
          t.cb = t.top;
          t.st = 0;
        }
      }
    } else if (t.k === 'arena') {
      // SỬA TRIỆT ĐỂ LỒNG GIAM CƯA MÁY (SAW ARENA):
      // Kích hoạt ngay khi bước hoặc nhảy vào lồng; tính cả người chơi đang nhảy cao trên không; sau 6s mở cửa!
      const arenaDur = Math.min(t.dur || 6.5, 6.5);
      if (t.st === 0) {
        if (alive && cx > t.x0 + 25 && cx < t.x1 - 25 && feet <= t.gy + 40 && me.y >= t.ceilY - 120) {
          trapSend(i, 'fire', G.lt);
        }
      } else if (t.st === 1) {
        const tt = Math.max(0, G.lt - t.t0);
        if (host) {
          let inside = 0;
          for (const b of bodies) {
            if (!b.dead && b.x + PW / 2 > t.x0 - 30 && b.x + PW / 2 < t.x1 + 30) {
              inside++;
            }
          }
          if (tt > 1.5 && inside === 0) t.empty = (t.empty || 0) + STEP;
          else t.empty = 0;
          if (t.empty > 1.5) trapSend(i, 'reset', 0);
          else if (tt >= arenaDur) trapSend(i, 'done', 0);
        }
      }
    } else if (t.k === 'pass_drop') {
      if (
        t.st === 0 &&
        alive &&
        cx > t.x0 + (t.x1 - t.x0) * 0.35 &&
        cx < t.x1 + 30 &&
        Math.abs(feet - t.gy) < 28
      ) {
        trapSend(i, 'fire', G.lt);
      } else if (t.st === 1) {
        t.t -= STEP;
        if (t.t <= 0) t.st = 0;
      }
    } else if (t.k === 'ambush') {
      const sp = t._sp || (t._sp = L.spikes.filter((s) => s.bt === i));
      if (t.st === 0 && alive && cx > t.zx0 + 65 && cx < t.zx1 && Math.abs(feet - t.gy) < 42) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 2;
          t.t = 1.9;
          sp.forEach((s) => {
            s.hid = false;
            s.live = true;
            s.ph = 1;
          });
          Snd.slam();
        }
      } else if (t.st === 2) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 0;
          sp.forEach((s) => {
            s.hid = true;
            s.live = false;
            s.ph = 0;
          });
        }
      }
    } else if (t.k === 'shift_ledge' || t.k === 'double_bluff') {
      const s = L.solids[t.si];
      if (t.st === 0 && alive && cx > t.gx - 24 && cx < t.baseX + 45 && !me.onGround && me.vy < 4) {
        trapSend(i, 'fire', 0);
      } else if (t.st === 1 && s) {
        t.t += STEP;
        t.cur = t.shift * clamp(t.t / 0.16, 0, 1);
        s[0] = t.baseX + t.cur;
        if (t.topSpk) t.topSpk.x = s[0] + 115;
        if (t.k === 'double_bluff' && alive && me.onGround && cx > s[0] + 95 && cx < s[0] + s[2] - 10) {
          trapSend(i, 'hit', 0);
        }
        if (t.t > 3.2) {
          t.st = 0;
          t.cur = 0;
          s[0] = t.baseX;
          if (t.topSpk) t.topSpk.x = t.baseX + 115;
        }
      } else if (t.st === 2) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 0;
          t.cur = 0;
          if (s) s[0] = t.baseX;
          if (t.topSpk) {
            t.topSpk.x = t.baseX + 115;
            t.topSpk.hid = true;
            t.topSpk.live = false;
            t.topSpk.ph = 0;
          }
        }
      }
    } else if (t.k === 'troll_spring') {
      const sp = L.springs[t.sIdx];
      if (t.st === 0 && sp && sp.sq > 0.5) trapSend(i, 'fire', 0);
      else if (t.st === 1) {
        t.t -= STEP;
        if (t.t <= 0) {
          t.st = 0;
          if (sp) sp.power = 17.5;
          for (const s of L.spikes) {
            if (s.bt === i) {
              s.hid = true;
              s.live = false;
              s.ph = 0;
            }
          }
        }
      }
    } else if (t.k === 'sled') {
      const totalPlayers = presentCount();
      let riders = 0;
      let meOnSled = false;
      for (const b of bodies) {
        if (
          !b.dead &&
          b.x + PW - 4 > t.x &&
          b.x + 4 < t.x + t.w &&
          b.y + PH >= t.y - 6 &&
          b.y + PH <= t.y + 18
        ) {
          riders++;
          if (b === me) meOnSled = true;
        }
      }
      if (t.st === 0) {
        t.dx = 0;
        if (riders > 0) {
          t.wait += STEP;
          if (riders >= totalPlayers || t.wait >= 1.35) {
            t.st = 1;
            Snd.shake();
          }
        } else {
          t.wait = 0;
        }
      } else if (t.st === 1) {
        const prevX = t.x;
        t.vx = Math.min(t.maxV || 6.0, (t.vx || 1.6) + 0.045);
        t.x = Math.min(t.x1, t.x + t.vx);
        t.dx = t.x - prevX;
        if (
          totalPlayers > 1 &&
          t.x > t.x0 + (t.x1 - t.x0) * 0.36 &&
          t.x < t.x1 - 150 &&
          riders < totalPlayers
        ) {
          t.st = 2;
          t.shatterT = 2.0;
          t.dx = 0;
          Snd.crumble();
          G.shake = 10;
          if (meOnSled) die('sled_betray');
        } else if (t.x >= t.x1) {
          t.dx = 0;
        }
      } else if (t.st === 2) {
        t.dx = 0;
        t.shatterT -= STEP;
        if (t.shatterT <= 0) {
          t.st = 0;
          t.x = t.x0;
          t.vx = 0;
          t.wait = 0;
        }
      }
      const s = L.solids[t.si];
      if (s) {
        s[0] = t.st === 2 ? -9999 : t.x;
        s[1] = t.y;
      }
      if (meOnSled && t.st === 1) me.x += t.dx;
    } else if (t.k === 'redeye') {
      if (cx < t.x0 || cx > t.x1) continue;
      const ph = (G.lt + (t.off || 0)) % 4.5;
      t.state = ph < 2.45 ? 0 : ph < 3.2 ? 1 : 2;
      if (
        t.state === 2 &&
        alive &&
        (input.l || input.r || input.j || Math.abs(me.vx) > 1.7 || (!me.onGround && Math.abs(me.vy) > 3.4))
      ) {
        die('redeye');
      }
    } else if (t.k === 'syncgate') {
      const g = L.gates[t.gi];
      if (!g || t.open) {
        if (g) g.act = true;
        continue;
      }
      let allAir = bodies.length > 0;
      let near = false;
      for (const b of bodies) {
        if (b.dead) {
          allAir = false;
          break;
        }
        if (Math.abs(b.x + PW / 2 - t.x) < 280) near = true;
        if (b.onGround || Math.abs(b.x + PW / 2 - t.x) > 350) {
          allAir = false;
          break;
        }
      }
      if (near && allAir) {
        t.open = true;
        g.act = true;
        Snd.gate(true);
        if (isNet()) trapSend(i, 'sync', 1);
      }
    } else if (t.k === 'skygate') {
      const g = L.gates[t.gi];
      if (!g || t.open) {
        if (g) g.act = true;
        continue;
      }
      const byEff = presentCount() <= 1 ? t.by + 65 : t.by;
      for (const b of bodies) {
        if (!b.dead && rectsOverlap(b.x, b.y, PW, PH, t.bx, byEff, 54, 26)) {
          t.open = true;
          g.act = true;
          Snd.gate(true);
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
          me.x = target.x;
          me.y = target.y;
          Snd.djump();
        }
      }
    } else if (t.k === 'fake') {
      for (let j = 0; j < t.plates.length; j++) {
        const f = t.plates[j];
        let pr = false;
        for (const b of bodies) {
          if (standsOn(b, f)) {
            pr = true;
            break;
          }
        }
        f.pr = pr;
        f.on = pr;
        if (!f.used && alive && standsOn(me, f)) trapSend(i, 'hit', j);
      }
    } else if (t.k === 'door') {
      const e = L.exit;
      let down = false;
      for (const b of bodies) {
        if (standsOn(b, t.btn)) {
          down = true;
          break;
        }
      }
      if (down && !t.btnDown) Snd.plate(true);
      t.btnDown = down;
      if (t.st === 0) {
        e.lock = true;
        if (alive) {
          if (standsOn(me, t.btn)) trapSend(i, 'fix', 0);
          else if (Math.hypot(cx - (e.x + e.w / 2), cy - (e.y + e.h / 2)) < 240) {
            trapSend(i, 'flee', 0);
          }
        }
      } else if (t.st === 1) {
        t.t += STEP;
        const u = clamp(t.t / t.dur, 0, 1);
        e.lock = true;
        if (t.mode === 'run') {
          const k = u * u * (3 - 2 * u);
          e.x = lerp(t.ex0, t.dx, k);
          e.y = lerp(t.ey0, t.dy, k) - Math.abs(Math.sin(u * Math.PI * 7)) * 46 * Math.sin(u * Math.PI);
          e.legs = true;
        } else if (u < 0.4) {
          e.x = t.ex0;
          e.y = t.ey0 + e.h * (u / 0.4);
          e.clipY = t.ey0 + e.h;
          e.hide = false;
        } else if (u < 0.6) {
          e.hide = true;
          e.x = t.dx;
          e.y = t.dy + e.h;
        } else {
          const k = (u - 0.6) / 0.4;
          e.hide = false;
          e.x = t.dx;
          e.y = t.dy + e.h * (1 - k);
          e.clipY = t.dy + e.h;
        }
        if (u >= 1) {
          t.st = 2;
          e.x = t.dx;
          e.y = t.dy;
          e.lock = false;
          e.legs = false;
          e.hide = false;
          e.clipY = undefined;
        }
      }
    } else {
      updateV11Trap(t, i, me, bodies);
    }
  }
  for (let q = L.stalactites.length - 1; q >= 0; q--) {
    if (L.stalactites[q].dyn && L.stalactites[q].gone) L.stalactites.splice(q, 1);
  }
}

function updateStalactites(bodies) {
  const L = G.L;
  for (const s of L.stalactites || []) {
    if (s.st === 0) {
      for (const b of bodies) {
        const cx = b.x + PW / 2 + (b.vx || 0) * 14;
        if (cx > s.x - 68 && cx < s.x + s.w + 68 && b.y > s.y + s.h * 0.4 && b.y < s.y + s.h + 540) {
          s.st = 1;
          s.t = 0.22;
          s.aimVx = clamp((b.vx || 0) * 0.45, -3.2, 3.2);
          break;
        }
      }
    } else if (s.st === 1) {
      s.t -= STEP;
      if (s.t <= 0) {
        s.st = 2;
        s.vy = 3.2;
        s.fy = 0;
        if (s.gnd === undefined) s.gnd = groundBelow(s.x, s.x + s.w, s.y + s.h);
      }
    } else if (s.st === 2) {
      s.vy = Math.min(s.vy + 1.05, 22);
      s.fy += s.vy;
      if (s.aimVx) s.x += s.aimVx;
      if (s.y + s.h + s.fy >= s.gnd) {
        s.fy = Math.max(0, s.gnd - s.y - s.h);
        s.st = 3;
        s.t = 2.8;
      }
    } else {
      s.t -= STEP;
      if (s.t <= 0) {
        s.st = 0;
        s.fy = 0;
        s.vy = 0;
        if (s.dyn) s.gone = true;
      }
    }
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
      if (e.lv === G.lvIdx && G.me) {
        const M = G.me;
        const L = G.L;
        M.cp = { x: e.x, y: e.y };
        if (L && L.flags && e.fi >= 0 && L.flags[e.fi]) L.flags[e.fi].on = true;
        if (e.pull || M.dead || Math.hypot(M.x - e.x, M.y - e.y) > 180) {
          M.dead = false;
          M.x = e.x + (M.slot % 4) * 14;
          M.y = e.y;
          M.vx = 0;
          M.vy = 0;
          M.rope = null;
          G.cam.snap = true;
        }
        toast('⚑ ' + (G.names[e.s] || 'Đồng đội') + ' chạm Checkpoint — Toàn đội dịch chuyển lên!');
      }
      break;
    case 'restart':
      if (e.pn) PARTY_N = Math.max(1, Math.min(10, e.pn | 0));
      restartLevel();
      break;
    case 'custom_lvl':
      if (e.data) loadLevel(-1, e.data);
      break;
    case 'hoist':
      if (e.lv === G.lvIdx && e.to === G.myslot && G.me && !G.me.dead) {
        const M = G.me;
        if (M.rope) M.rope.len = Math.max(150, M.rope.len - 10);
        else {
          M.vy = -11.0;
          const r = G.remotes.get(e.s);
          if (r) M.vx += Math.sign(r.x - M.x) * 4.0;
        }
      }
      break;
    case 'key':
      if (e.lv === G.lvIdx) collectKey(false, e.s);
      break;
    case 'keyst':
      if (e.lv === G.lvIdx && e.v && !G.keyGot) {
        G.keyGot = true;
        const ks = $('keyStat');
        if (ks) {
          ks.textContent = '🔑 ✓';
          ks.classList.add('got');
        }
      }
      break;
    case 'win':
      if (e.lv === G.lvIdx) triggerWin(false);
      break;
    case 'die':
      if (e.lv === G.lvIdx) {
        G.deaths++;
        setText('deaths', '💥 ' + G.deaths);
        Snd.die();
        if (e.wipe && G.me && !G.won) {
          toast('💀 ' + (G.names[e.s] || 'Đồng đội') + ' tử nạn — Cả đội quay về Checkpoint!');
          respawn();
        }
      }
      break;
    case 'clk':
      if (e.lv === G.lvIdx && e.s === G.hostSlot && e.s !== G.myslot) {
        const target = e.v + G.pingMs / 2000;
        const diff = target - G.lt;
        if (Math.abs(diff) > 1.2) G.lt = target;
        else if (Math.abs(diff) > 0.08) G.lt += clamp(diff * 0.15, -0.02, 0.02);
      }
      break;
  }
}

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
    if (t.k === 'ceil' && t.st === 1) {
      // Kiểm tra va chạm với Bẫy Trần Sập (nếu không đứng trong hốc trú ẩn alcoves):
      const inAlcove = (t.alc || []).some((a) => hx >= a[0] - 4 && hx + hw <= a[1] + 4 && hy + hh > t.gy + 8);
      if (!inAlcove && rectsOverlap(hx, hy, hw, hh, t.x0 + 4, t.cb - t.SH, t.x1 - t.x0 - 8, t.SH)) {
        return 'crusher';
      }
    }
    if (t.k !== 'arena' || t.st !== 1) continue;
    const tt = G.lt - t.t0;
    for (let j = 0; j < t.saws.length; j++) {
      const p = sawPos(t, j, tt);
      if (circleHitsRect(p.x, p.y, t.saws[j].r - 3, hx, hy, hw, hh)) return 'saw';
    }
  }
  const vh = v11Hazard(hx, hy, hw, hh);
  if (vh) return vh;
  if (P.y > (L.h || WORLD_H) + 90 || P.y < -120) return 'fall';
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

  // KHÔI PHỤC 100% CÁ MẬP BẠO CHÚA MEGALODON BẢN ĐẸP NHẤT (Hàm dưới cử động, 2 hàm răng nhọn, khe mang, vây lưng):
  for (const sh of L.sharks || []) {
    ctx.save();
    ctx.translate(sh.cx, sh.cy);
    ctx.scale(sh.dir || 1, 1);
    const wag = Math.sin(T * 14) * 8;
    const bite = Math.abs(Math.sin(T * 7)) * 0.28;

    // Vây đuôi phân thùy
    ctx.fillStyle = '#0f2942';
    ctx.strokeStyle = '#051321';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(-76, -30 + wag);
    ctx.lineTo(-62, -2 + wag * 0.4);
    ctx.lineTo(-74, 26 + wag);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vây lưng đại bàng
    ctx.fillStyle = '#102a43';
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-22, -48, -28, -50);
    ctx.lineTo(14, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thân trên cơ bắp chuyển sắc đại dương
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
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Khớp hàm dưới cử động táp mồi + Răng hàm dưới
    ctx.save();
    ctx.translate(14, 8);
    ctx.rotate(bite);
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(38, 2);
    ctx.quadraticCurveTo(18, 16, -6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(6 + k * 6, 1);
      ctx.lineTo(9 + k * 6, -6);
      ctx.lineTo(12 + k * 6, 1);
      ctx.fill();
    }
    ctx.restore();

    // Hàng răng hàm trên sắc nhọn
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(16 + k * 6.5, 2);
      ctx.lineTo(19 + k * 6.5, 10);
      ctx.lineTo(22 + k * 6.5, 2);
      ctx.fill();
    }

    // 3 Khe mang cá & Vây ngực
    ctx.strokeStyle = '#051321';
    ctx.lineWidth = 2.2;
    for (let g = 0; g < 3; g++) {
      ctx.beginPath();
      ctx.moveTo(2 - g * 6, -8);
      ctx.quadraticCurveTo(4 - g * 6, 0, 1 - g * 6, 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#102a43';
    ctx.beginPath();
    ctx.moveTo(4, 10);
    ctx.lineTo(-16, 32);
    ctx.lineTo(18, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mắt đỏ săn mồi phát sáng
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.ellipse(38, -8, 5.2, 3.8, -0.2, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(39.5, -8.5, 1.5, 0, 6.3);
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
      const arenaDur = Math.min(t.dur || 6.5, 6.5);
      ctx.save();
      ctx.fillStyle = 'rgba(255,60,60,' + (0.12 + 0.08 * Math.sin(G.lt * 8)) + ')';
      ctx.fillRect(t.x0, t.ceilY, t.x1 - t.x0, t.gy - t.ceilY);
      ctx.restore();
      for (let j = 0; j < t.saws.length; j++) {
        const p = sawPos(t, j, tt);
        drawSaw(p.x, p.y, t.saws[j].r, G.lt);
      }
      ctx.save();
      ctx.font = '800 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe066';
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      ctx.lineWidth = 3.5;
      const left = Math.max(0, Math.ceil(arenaDur - tt));
      ctx.strokeText('⏱ MỞ CỬA SAU: ' + left + 's', (t.x0 + t.x1) / 2, t.ceilY + 32);
      ctx.fillText('⏱ MỞ CỬA SAU: ' + left + 's', (t.x0 + t.x1) / 2, t.ceilY + 32);
      ctx.restore();
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
  // Vẽ Đạn Kỹ Năng trong World Space (Không bao giờ bị lật hay dịch chuyển theo hướng nhân vật!):
  v20DrawWorldSkillShots(ctx);
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

  v20UpdateAllHeroSkills(P, L);

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

  // SỬA TRIỆT ĐỂ LỖI GOJO BAY LÊN TRỜI MÃI MÃI:
  // Chỉ đảo trọng lực khi cả X lẫn Y của nhân vật nằm trong buồng phản trọng lực!
  let gDir = 1;
  const cx = P.x + PW / 2;
  const cy = P.y + PH / 2;
  for (const gz of L.gravZones || []) {
    if (cx >= gz.x0 && cx <= gz.x1 && cy >= gz.y0 - 45 && cy <= gz.y1 + 45) {
      gDir = -1;
      break;
    }
  }
  P.gDir = gDir;

  const isWater = v18IsInSwimPit(P, L);
  const isSpace = L.biome === 'space';

  if (isWater && L.biome !== 'water' && P.y > GY + 60) {
    P.y = GY + 60;
    if (P.vy > 0) P.vy = -3.8;
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
  if (curPassive === 'limitless' || curPassive === 'pikachu' || curPassive === 'kurama') speedBonus = 1.32;
  else if (
    curPassive === 'onepunch' ||
    curPassive === 'saiyan' ||
    curPassive === 'nika' ||
    curPassive === 'santoryu'
  ) {
    speedBonus = 1.25;
  } else if (curPassive === 'dragonflight' || curPassive === 'antidote') {
    speedBonus = 1.18;
  }

  const jumpBonus =
    curPassive === 'nika' || curPassive === 'limitless' || curPassive === 'saiyan' ? 1.22 : 1.0;

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
    P.vy = -9.6 * jumpMul(P) * jumpBonus;
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
    if (pre.includes(s) && feetStart - s[1] <= 46 && feetStart > s[1]) continue;
    if (isWater && P.y + PH - s[1] <= 76 && (P.vy < 0 || input.j)) {
      P.y = s[1] - PH;
      P.vy = -6.5;
      P.onGround = true;
      continue;
    }
    if (P.vx > 0) P.x = s[0] - PW;
    else if (P.vx < 0) P.x = s[0] + s[2];
    P.vx = 0;
  }

  const feet0 = P.y + PH;
  P.y += P.vy;
  // Trần bảo vệ bầu trời: Không bao giờ cho nhân vật bay vọt lên trên mép bản đồ!
  if (P.y < -30) {
    P.y = -30;
    if (P.vy < 0) P.vy = 0;
  }
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

function updateWorld() {
  const L = G.L;
  const me = G.me;
  G.lt += STEP;
  if (!G.won) G.levelTime += STEP;
  const bodies = allBodies();
  const camMidX = G.cam.x + (G.cam.vw || 800) / 2;
  const hearRange = (G.cam.vw || 800) * 0.75;

  for (const p of L.plates) {
    let pr = false;
    for (const b of bodies) {
      if (standsOn(b, p)) {
        pr = true;
        break;
      }
    }
    if (pr) p.t = Math.max(p.hold, 0.25);
    else if (p.t > 0) p.t -= STEP;
    const act = pr || p.t > 0;
    if (act !== p.on && Math.abs(p.x - camMidX) < hearRange) Snd.plate(act);
    p.on = act;
    p.pr = pr;
  }
  for (const g of L.gates) {
    let act;
    if (g.tr !== undefined) {
      const trObj = L.traps[g.tr];
      if (!trObj) act = true;
      else if (trObj.k === 'syncgate' || trObj.k === 'skygate') act = !!trObj.open;
      else act = trapGateOpen(g);
    } else if (g.mode === 'all') {
      act = g.ctrl.every((id) => L.plates.find((p) => p.id === id).on);
    } else if (g.mode === 'count') {
      act =
        g.ctrl.filter((id) => L.plates.find((p) => p.id === id).on).length >=
        Math.min(g.need || g.ctrl.length, g.ctrl.length);
    } else {
      act = g.ctrl.some((id) => L.plates.find((p) => p.id === id).on);
    }
    if (act !== g.act && Math.abs(g.x - camMidX) < hearRange) Snd.gate(act);
    g.act = act;
  }
  for (const c of L.crumbles) {
    if (c.st === 0) {
      if (!c.lock) {
        for (const b of bodies) {
          const feet = b.y + PH;
          if (b.x + PW - 3 > c.x && b.x + 3 < c.x + c.w && feet >= c.y - 2 && feet <= c.y + 8) {
            c.st = 1;
            c.t = c.fast ? 0.09 : 0.22;
            break;
          }
        }
      }
    } else if (c.st === 1) {
      c.t -= STEP;
      if (c.t <= 0) {
        c.st = 2;
        c.t = 2.5;
        c.fy = 0;
        c.vy = 0;
        if (Math.abs(c.x - camMidX) < hearRange) Snd.crumble();
      }
    } else {
      c.t -= STEP;
      c.vy = (c.vy || 0) + 0.65;
      c.fy += c.vy;
      if (c.t <= 0) {
        c.st = 0;
        c.fy = 0;
      }
    }
  }
  for (const c of L.crushers) {
    const prev = c.cb;
    c.cb = crusherBottom(c, G.lt);
    if (
      prev !== undefined &&
      prev < c.downB - 2 &&
      c.cb >= c.downB - 2 &&
      c.cb - prev < 40 &&
      Math.abs(c.x + c.w / 2 - camMidX) < hearRange
    ) {
      Snd.slam();
      G.shake = Math.max(G.shake, 4.5);
    }
  }
  for (const b of L.boulders) {
    const prev = b.cx;
    b.cx = pingPong(b.x0, b.x1, b.speed, b.off, G.lt);
    b.rot += (b.cx - prev) / b.r;
  }
  for (const s of L.sweepers) s.cx = s.x + s.speed * Math.max(0, G.lt - s.delay);
  for (const r of L.risers || []) r.cy = r.y - r.speed * Math.max(0, G.lt - r.delay);
  updateStalactites(bodies);
  updateMeteors();
  updateTraps(bodies);
  updateRunKey(bodies);
  updateRocks();
  updateBonks();

  for (const s of L.springs) if (s.sq > 0) s.sq = Math.max(0, s.sq - STEP * 5);

  if (!me.dead) {
    for (let fi = 0; fi < L.flags.length; fi++) {
      const f = L.flags[fi];
      if (!f.on && Math.abs(me.x + PW / 2 - f.x) < 40 && Math.abs(me.y + PH - f.y) < 90) {
        f.on = true;
        me.cp = { x: f.x - PW / 2, y: f.y - PH };
        Snd.cp();
        sparkle(f.x, f.y - 50, 14, 1, '#7cf');
        toast('⚑ Checkpoint!');
        v16SpawnDoppelganger(L, me, f.x, f.y, fi);
        if (G.mode !== 'solo') {
          netEv({ t: 'cp', x: Math.round(me.cp.x), y: Math.round(me.cp.y), fi, s: me.slot, pull: 1 });
        }
      } else if (
        f.on &&
        Math.abs(me.x + PW / 2 - f.x) < 40 &&
        Math.abs(me.y + PH - f.y) < 90 &&
        f.x - PW / 2 >= me.cp.x
      ) {
        me.cp = { x: f.x - PW / 2, y: f.y - PH };
      }
    }
    const cx = me.x + PW / 2;
    const cy = me.y + PH / 2;
    const mg =
      curPassive === 'magnet' ||
      curPassive === 'dragonflight' ||
      curPassive === 'limitless' ||
      timedOn(me, 'magnet')
        ? 2.5
        : 1;
    for (const c of L.coins) {
      if (c.pop > 0) c.pop -= STEP;
      if (c.got || c.anomaly) continue;
      if (Math.abs(cx - c.x) < 24 * mg && Math.abs(cy - c.y) < 28 * mg) {
        c.got = true;
        c.pop = 0.5;
        const dia = c.kind === 'diamond';
        if (G.lvIdx >= 0) {
          Save.markCoin(G.mode, G.lvIdx, c.id);
          if (dia) Save.addDiamonds(1);
          else Save.addCoins(1);
        }
        if (dia) {
          Snd.key();
          toast('💎 Diamond found!');
        } else {
          Snd.coin();
        }
      }
    }
    if (!G.keyGot) {
      const k = keyPos();
      const kg = mg > 1 ? 1.6 : 1;
      if (Math.abs(cx - k.x) < 30 * kg && Math.abs(cy - k.y) < 34 * kg) {
        collectKey(true, me.slot);
      }
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
  if (P.dead || G.won) return;
  // Nếu rơi ra ngoài bản đồ (fall) thì kể cả đang bất tử (P.inv > 0) vẫn phải đưa về Checkpoint ngay!
  if (cause === 'fall' && P.inv > 0) {
    tpToCheckpoint(P);
    return;
  }
  if (P.inv > 0) return;
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

  // NỘI TẠI ĐỠ ĐÒN CHÍ MẠNG (Có thời gian hồi chiêu cân bằng: Gojo 3.5s, các nhân vật Supreme 6.0s):
  const isHero =
    curPassive === 'limitless' ||
    curPassive === 'nika' ||
    curPassive === 'saiyan' ||
    curPassive === 'onepunch' ||
    curPassive === 'kurama' ||
    curPassive === 'pikachu' ||
    curPassive === 'santoryu' ||
    curPassive === 'wraith';

  if (isHero && cause !== 'fall' && cause !== 'wall' && !(P.guardCd > 0)) {
    P.guardCd = curPassive === 'limitless' ? 3.5 : GUARD_COOLDOWN;
    P.awakened = true;
    P.inv = 1.4;
    P.vy = curPassive === 'nika' ? -13.5 : -9.8;
    P.sq = -0.35;
    Snd.djump();
    sparkle(P.x + PW / 2, P.y + PH / 2, 22, 1.8, '#38bdf8');
    toast('✨ Nội tại Thức Tỉnh đã hóa giải đòn chí mạng! (Hồi ' + P.guardCd + 's)');
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
// 9. TRÌNH KIẾN TẠO ĐẦY ĐỦ 300 MÀN CHƠI (100 SOLO / 100 CO-OP / 100 PARTY)
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

  LB.prototype.gap = function (len) {
    this.spikes.push({ x: this.x, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    this.x += len;
  };

  seg.bonkGap = function (b, gapW) {
    gapW = gapW || 150;
    const x0 = seg.run(b, 320, {});
    const gx = b.x;
    const gy = b.gy;
    b.gap(gapW);
    b.bonks.push({ x: gx + gapW / 2 - 22, y: gy - 166, w: 46, h: 40, rev: false, sh: 0 });
    seg.run(b, 320, { flag: true });
    return x0;
  };

  seg.passCollapse = function (b, len) {
    const span = len || 350;
    const x0 = b.ground(220);
    const gy = b.gy;
    const bx = b.x;
    b.spikes.push({ x: bx, y: WORLD_H - 26, w: span, h: 26, dir: 'up', pit: true });
    const nTiles = Math.max(3, Math.floor(span / 85));
    const tw = Math.floor(span / nTiles);
    const idxs = [];
    for (let i = 0; i < nTiles; i++) {
      b.crumbles.push({ x: bx + i * tw, y: gy, w: tw, h: 24, st: 0, t: 0, fy: 0, lock: true, stealth: true });
      idxs.push(b.crumbles.length - 1);
    }
    b.traps.push({ k: 'pass_drop', x0: bx, x1: bx + span, gy, cr: idxs, st: 0, t: 0 });
    b.x = bx + span;
    b.ground(260);
    b.coin(bx + span * 0.5, gy - 58);
    return x0;
  };

  seg.delayedAmbush = function (b, len) {
    len = Math.max(620, len || 680);
    const x0 = b.ground(len);
    const gy = b.gy;
    const idx = b.traps.length;
    for (let gx = x0 + 160; gx + 64 <= x0 + len - 140; gx += 130) {
      b.spikes.push({ x: gx, y: gy - 24, w: 64, h: 24, dir: 'up', hid: true, bt: idx, ph: 0, live: false });
    }
    b.stalactites.push({ x: x0 + len - 220, y: gy - 310, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0, sniper: true });
    b.traps.push({ k: 'ambush', zx0: x0 + 120, zx1: x0 + len - 90, gy, st: 0, t: 0 });
    b.coin(x0 + len * 0.5, gy - 64);
    return x0;
  };

  seg.movingGap = function (b, gapW) {
    gapW = gapW || 135;
    const x0 = b.ground(260);
    const gy = b.gy;
    const gx = b.x;
    const pw = 220;
    const shiftAmt = 68;
    const rightGap = 135;
    b.spikes.push({ x: gx + 6, y: WORLD_H - 26, w: gapW + pw + rightGap - 12, h: 26, dir: 'up', pit: true });
    const platIdx = b.solids.length;
    const tIdx = b.traps.length;
    const platSolid = [gx + gapW, gy, pw, 44];
    platSolid.isVehicle = true;
    b.solids.push(platSolid);
    const topSpk = { x: gx + gapW + 115, y: gy - 24, w: 72, h: 24, dir: 'up', hid: true, bt: tIdx, ph: 0, live: false };
    b.spikes.push(topSpk);
    b.traps.push({ k: 'double_bluff', gx, gy, si: platIdx, baseX: gx + gapW, shift: shiftAmt, cur: 0, st: 0, t: 0, topSpk });
    b.x = gx + gapW + pw + rightGap;
    b.ground(280);
    return x0;
  };

  seg.trollSpringTrap = function (b) {
    const x0 = b.ground(340);
    const gy = b.gy;
    const spx = x0 + 185;
    const sIdx = b.springs.length;
    b.springs.push({ x: spx, y: gy - 14, w: 56, h: 14, power: 17.5, sq: 0, trollIdx: b.traps.length });
    b.spikes.push({ x: spx - 30, y: gy - 285, w: 120, h: 26, dir: 'down' });
    b.spikes.push({ x: x0 + 30, y: gy - 22, w: 70, h: 22, dir: 'up', hid: true, bt: b.traps.length, ph: 0, live: false });
    b.traps.push({ k: 'troll_spring', sIdx, st: 0, t: 0 });
    b.step(145);
    b.ground(320);
    return x0;
  };

  seg.fakePlates = function (b, n, o) {
    o = o || {};
    n = Math.max(4, Math.min(n || 5, 6));
    const pitch = 145;
    const lead = 110;
    const tail = 220;
    const hold = 4.2;
    const x0 = b.ground(lead + n * pitch + tail + 180);
    const idx = b.traps.length;
    const realIdx = 1 + ((n + idx) % (n - 1));
    const rid = 'p' + b.pid++;
    const fakes = [];
    const allPos = [];
    let realPlate = null;
    for (let i = 0; i < n; i++) {
      const px = x0 + lead + i * pitch;
      const py = b.gy - 10;
      allPos.push(px);
      if (i === realIdx) {
        realPlate = { id: rid, x: px, y: py, w: 60, h: 10, hold, t: 0, on: false };
        b.plates.push(realPlate);
      } else {
        fakes.push({
          x: px,
          y: py,
          w: 60,
          h: 10,
          hold: 0,
          t: 0,
          on: false,
          pr: false,
          used: false,
          v: (i + idx) % 2 === 0 ? 'stalac' : 'rev',
        });
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
    len = len || 1450;
    const x0 = b.ground(280);
    const gy = b.gy;
    const cs = b.x;
    const ce = cs + len;
    b.spikes.push({ x: cs, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    for (let sx = cs + 420; sx < ce - 320; sx += 440) {
      b.stalactites.push({ x: sx, y: gy - 310, w: 34, h: 66, st: 0, t: 0, fy: 0, vy: 0, sniper: true });
    }
    const sledW = mode === 'solo' ? 130 : 185;
    const si = b.solids.length;
    const sledSolid = [cs + 12, gy - 4, sledW, 24];
    sledSolid.isVehicle = true;
    b.solids.push(sledSolid);
    b.traps.push({
      k: 'sled',
      si,
      x0: cs + 12,
      x1: ce - sledW - 14,
      x: cs + 12,
      y: gy - 4,
      w: sledW,
      maxV: 5.8,
      vx: 0,
      dx: 0,
      st: 0,
      wait: 0,
    });
    b.x = ce;
    const landX = b.ground(360);
    b.flag(landX + 90);
    b.coin(cs + len * 0.5, gy - 85);
    return landX;
  };

  seg.judgmentCorridor = function (b, len, mode) {
    len = len || 840;
    const x0 = b.ground(len);
    const gy = b.gy;
    b.traps.push({ k: 'redeye', x0: x0 + 70, x1: x0 + len - 90, off: (x0 * 0.01) % 3, state: 0 });
    if (mode !== 'solo') {
      const gi = b.gates.length;
      const isSky = x0 % 2 === 0;
      b.gates.push({
        x: x0 + len - 90,
        y: gy - 340,
        w: 28,
        h: 340,
        ctrl: [],
        mode: 'any',
        open: false,
        inv: false,
        tr: b.traps.length,
      });
      if (isSky) b.traps.push({ k: 'skygate', gi, bx: x0 + len - 240, by: gy - 195, open: false });
      else b.traps.push({ k: 'syncgate', gi, x: x0 + len - 210, open: false });
    }
    b.coin(x0 + len * 0.5, gy - 75);
    return x0;
  };

  seg.antiGravChamber = function (b, len) {
    len = len || 760;
    const x0 = b.x;
    const gy = b.gy;
    const ceilY = gy - 290;
    b.spikes.push({ x: x0, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    b.solids.push([x0, ceilY - 36, len, 36]);
    b.spikes.push({ x: x0 + 220, y: ceilY, w: 60, h: 22, dir: 'down' });
    b.spikes.push({ x: x0 + 480, y: ceilY, w: 60, h: 22, dir: 'down' });
    b.gravZones = b.gravZones || [];
    b.gravZones.push({ x0: x0 + 20, x1: x0 + len - 40, y0: ceilY, y1: gy });
    b.x = x0 + len;
    b.ground(300);
    b.coin(x0 + len * 0.5, ceilY + 55);
    return x0;
  };

  seg.laserCorridor = function (b, len, d) {
    len = len || 820;
    const x0 = b.ground(len);
    const gy = b.gy;
    b.lasers = b.lasers || [];
    const nLasers = 2 + (d > 0.55 ? 1 : 0);
    for (let i = 0; i < nLasers; i++) {
      const lx = x0 + 220 + i * Math.floor((len - 340) / Math.max(1, nLasers - 1));
      b.solids.push([lx - 28, gy - 115, 56, 18]);
      b.lasers.push({
        x: lx,
        y: gy - 106,
        len: 100,
        spd: (i % 2 ? -1 : 1) * (1.8 + d * 0.85),
        off: i * 1.1,
        blades: d > 0.65 ? 3 : 2,
      });
    }
    b.coin(x0 + len * 0.5, gy - 68);
    return x0;
  };

  seg.blackHoleVortex = function (b, len, d) {
    baseDrop(b);
    len = len || 660;
    const x0 = b.ground(220);
    const gy = b.gy;
    const gx = b.x;
    b.spikes.push({ x: gx, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    for (let i = 0; i < 3; i++) {
      b.solids.push([gx + 85 + i * 195, gy - (i % 2 ? 75 : 20), 95, 18]);
    }
    b.blackHoles = b.blackHoles || [];
    b.blackHoles.push({ x: gx + len * 0.5, y: gy - 175, pullR: 245, killR: 26 + Math.round(d * 8) });
    b.x = gx + len;
    b.ground(240);
    return x0;
  };

  seg.phantomBridge = function (b, n, d) {
    baseDrop(b);
    n = n || 5;
    const w = 96;
    const g = 88;
    const x0 = b.ground(200);
    const gy = b.gy;
    const gx = b.x;
    const span = g + n * (w + g);
    b.spikes.push({ x: gx, y: WORLD_H - 26, w: span, h: 26, dir: 'up', pit: true });
    b.phantoms = b.phantoms || [];
    for (let i = 0; i < n; i++) {
      const px = gx + g + i * (w + g);
      const py = gy - (i % 2) * 35;
      const si = b.solids.length;
      const phSolid = [px, py, w, 18];
      phSolid.isVehicle = true;
      b.solids.push(phSolid);
      b.phantoms.push({ si, x: px, y: py, w, spd: 3.1 + d * 1.1, phase: i * 0.9, solid: true, alpha: 1 });
    }
    b.x = gx + span;
    b.ground(240);
    return x0;
  };

  seg.conveyorPendulum = function (b, len, d) {
    len = len || 840;
    const x0 = b.ground(len);
    const gy = b.gy;
    b.conveyors = b.conveyors || [];
    b.pendulums = b.pendulums || [];
    b.conveyors.push({ x: x0 + 90, y: gy, w: len - 180, spd: (x0 % 2 === 0 ? -1 : 1) * (2.1 + d * 1.0) });
    for (let i = 0; i < 3; i++) {
      b.pendulums.push({ x: x0 + 210 + i * 210, y: gy - 260, len: 215, r: 28, spd: 2.7 + d * 0.85, off: i * 1.3 });
    }
    b.coin(x0 + len * 0.5, gy - 95);
    return x0;
  };

  seg.sniperBastion = function (b, len, d, mode) {
    len = len || 800;
    const x0 = b.ground(len);
    const gy = b.gy;
    b.turrets = b.turrets || [];
    b.turrets.push({
      x: x0 + len * 0.55,
      y: gy - 245,
      period: Math.max(1.45, 2.3 - d * 0.55),
      charge: 0,
      fireT: 0,
      ang: 0,
    });
    b.solids.push([x0 + 210, gy - 85, 105, 18], [x0 + 490, gy - 95, 105, 18]);
    if (mode !== 'solo') {
      b.traps.push({ k: 'swap_pad', x: x0 + 260, y: gy - 115, used: false });
    }
    return x0;
  };

  seg.gravityPillars = function (b, len) {
    len = len || 920;
    const x0 = b.x;
    const gy = b.gy;
    const ceilY = gy - 280;
    b.spikes.push({ x: x0, y: WORLD_H - 26, w: len, h: 26, dir: 'up', pit: true });
    b.solids.push([x0, ceilY - 36, len, 36], [x0 + 280, gy, 320, WORLD_H - gy + 80]);
    b.gravZones = b.gravZones || [];
    b.gravZones.push(
      { x0: x0 + 20, x1: x0 + 290, y0: ceilY, y1: gy },
      { x0: x0 + 580, x1: x0 + len - 30, y0: ceilY, y1: gy }
    );
    b.x = x0 + len;
    b.ground(280);
    return x0;
  };

  seg.trollDoor = function (b, o) {
    o = o || {};
    const mode = o.mode === 'sink' ? 'sink' : 'run';
    const x0 = b.ground(820);
    const gy = b.gy;
    b.key = { x: x0 + 280, y: gy - 56 };
    b.flag(x0 + 45);
    b.solids.push([x0 + 70, gy - 88, 104, 18]);
    b.coin(x0 + 122, gy - 88 - 52);

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

  v11Inject = function (b, kb, ku) {
    if (b._v11 || b.h !== WORLD_H || b.wj || b.exitOv) return;
    b._v11 = 1;
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
      if (!cleanFlags.some((cf) => Math.hypot(cf.x - f.x, cf.y - f.y) < 750)) {
        cleanFlags.push({ x: f.x, y: f.y, on: false });
      }
    }
    const off = { solo: 0, coop: 4, party: 8 }[G.mode] || 0;
    const key = G.lvIdx >= 0 ? G.lvIdx : 1;
    const lv = {
      name: this.name,
      hint: this.hint,
      hue: (this.hue + key * 37 + off * 53) % 360,
      coop: this.coop,
      traps: this.traps,
      skyTheme: SKY_THEMES[(key * 3 + off) % SKY_THEMES.length],
      w: this.x,
      h: this.h,
      wj: this.wj,
      stalactites: this.stalactites,
      meteors: this.meteors,
      risers: this.risers,
      spawn: this.spawn,
      solids: this.solids,
      spikes: this.spikes,
      crumbles: this.crumbles,
      springs: this.springs,
      crushers: this.crushers,
      boulders: this.boulders,
      sweepers: this.sweepers,
      plates: this.plates,
      gates: this.gates,
      ropes: this.ropes,
      slopes: this.slopes || [],
      bonks: this.bonks || [],
      rocks: this.rocks || [],
      lasers: this.lasers || [],
      blackHoles: this.blackHoles || [],
      mimics: this.mimics || [],
      conveyors: this.conveyors || [],
      pendulums: this.pendulums || [],
      turrets: this.turrets || [],
      phantoms: this.phantoms || [],
      gravZones: this.gravZones || [],
      coins: this.coins.map((c, i) => ({ x: c.x, y: c.y, id: i })),
      flags: cleanFlags,
      key: this.key || { x: this.x - (keyBack || 520), y: this.gy - (keyUp || 56) },
      exit: this.exitOv ? Object.assign({}, this.exitOv) : { x: this.x - 150, y: this.gy - 74, w: 54, h: 74 },
    };
    return v15SanitizeLevel(lv);
  };

  function buildDescentStage(title, hue, seed, mode) {
    const W = 980;
    const H = 2750;
    const b = new LB(
      title + ' [DESCENT ↓]',
      'Đi từ ĐỈNH xuống ĐÁY vực sâu! Cẩn thận đá lăn & tia laser mỗi tầng!',
      hue,
      mode === 'coop'
    );
    b.h = H;
    b.wj = true;
    b.x = W;
    b.solids.push([0, 0, 40, H + 200], [W - 40, 0, 40, H + 200], [60, 190, 260, 24]);
    b.spawn = [120, 190 - PH];
    let curY = 310;
    let fIdx = 0;
    b.lasers = [];
    while (curY < H - 280) {
      const gapX = 110 + Math.floor(hash1(seed * 13 + fIdx * 7.1) * (W - 380));
      const gapW = 145 + (fIdx % 3) * 20;
      if (gapX > 50) b.solids.push([40, curY, gapX - 40, 22]);
      if (gapX + gapW < W - 50) b.solids.push([gapX + gapW, curY, W - 40 - (gapX + gapW), 22]);
      if (fIdx % 3 === 0) {
        b.boulders.push({ x0: 70, x1: W - 70, y: curY, r: 24, speed: 3.6, off: fIdx, cx: 120, rot: 0 });
      }
      if (fIdx % 4 === 1) {
        b.lasers.push({ x: W / 2, y: curY - 75, len: 95, spd: 2.1, off: fIdx, blades: 2 });
      }
      if (fIdx % 4 === 2) {
        b.flags.push({ x: gapX > W / 2 ? 140 : W - 140, y: curY });
      }
      b.coin(gapX + gapW / 2, curY - 35);
      curY += 165;
      fIdx++;
    }
    const botY = H - 90;
    b.solids.push([40, botY, W - 80, 160]);
    b.key = { x: 180, y: botY - 140, run: { x0: 90, x1: W - 90, gy: botY } };
    b.exitOv = { x: W - 150, y: botY - 74, w: 54, h: 74 };
    return v15SanitizeLevel(b.finish(0, 0));
  }

  function reverseLevelHorizontally(lv) {
    const W = lv.w;
    lv.name += ' [ĐẢO CHIỀU ←]';
    lv.hint = '🔄 MÀN ĐẢO CHIỀU: Xuất phát bên PHẢI, chạy ngược về bên TRÁI!';
    for (const s of lv.solids) s[0] = W - s[0] - s[2];
    lv.solids.push([W - 480, GY, 480, WORLD_H - GY + 80]);
    lv.solids.push([0, GY, 560, WORLD_H - GY + 80]);
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

  const POOL_ALL = [
    (b, d) => seg.laserCorridor(b, 840, d),
    (b, d) => seg.blackHoleVortex(b, 660, d),
    (b, d) => seg.phantomBridge(b, 5, d),
    (b, d) => seg.conveyorPendulum(b, 840, d),
    (b, d, m) => seg.sniperBastion(b, 800, d, m),
    (b) => seg.gravityPillars(b, 920),
    (b, d, m) => seg.glacierSled(b, 1450, m),
    (b, d, m) => seg.judgmentCorridor(b, 840, m),
    (b) => seg.antiGravChamber(b, 740),
    (b, d) => seg.passCollapse(b, Math.round(330 + d * 110)),
    (b) => seg.delayedAmbush(b, 680),
    (b, d) => seg.movingGap(b, Math.round(130 + d * 35)),
    (b) => {
      seg.trollSpringTrap(b);
      baseDrop(b);
    },
    (b) => seg.antiBaitSpikes(b, 720, { flag: true, coins: [[340, -95]] }),
    (b, d) => seg.fakePlates(b, Math.min(6, 4 + Math.floor(d * 2.5)), { flag: true }),
    (b, d) => seg.sawArena(b, 6.5, d > 0.45 ? 4 : 3),
    (b, d) => seg.compactor(b, 1300, { speed: +(2.0 + d * 0.75).toFixed(2) }),
    (b, d) => seg.ferry(b, 1600, { speed: +(1.55 + d * 0.55).toFixed(2) }),
    (b) => seg.bonkGap(b, 150),
  ];

  const SEASONS = [
    { name: '☣️ Đầm Lầy Độc Dược', sky: 'toxic', hue: 135, biome: 'toxic' },
    { name: '🌊 Đại Dương Cá Mập', sky: 'ocean', hue: 195, biome: 'water' },
    { name: '☁️ Thiên Đường Trên Mây', sky: 'heaven', hue: 48, biome: 'heaven' },
    { name: '🔥 Địa Ngục Tối Thượng', sky: 'hell', hue: 8, biome: 'hell' },
    { name: '🧊 Kỷ Băng Hà Tuyệt Đối', sky: 'frost', hue: 200, biome: 'ice' },
    { name: '🚀 Vũ Trụ Không Trọng Lực', sky: 'cosmic', hue: 265, biome: 'space' },
    { name: '👻 Nghĩa Địa Quỷ Dị', sky: 'storm', hue: 275, biome: 'normal' },
    { name: '🌃 Đêm Neon Đảo Chiều', sky: 'neon', hue: 290, biome: 'normal' },
  ];

  function makeV20Stage(mode, idx) {
    try {
      const d = clamp(idx / 99, 0.25, 1.0);
      const season = SEASONS[(idx + (mode === 'coop' ? 2 : mode === 'party' ? 4 : 0)) % SEASONS.length];
      const stageTitle = season.name + ' #' + (idx + 1);

      if (idx % 9 === 4) return buildDescentStage(stageTitle, season.hue, idx + 1, mode);
      if (mode !== 'coop' && idx % 9 === 8) {
        const nFloors = 4 + Math.min(4, Math.floor(d * 4));
        const tw = buildTower({
          name: stageTitle + ' [TOWER ↑]',
          hint: 'Leo từ ĐÁY lên ĐỈNH! Dung nham & Quái vật dâng tốc độ cao.',
          hue: season.hue,
          rooms: [
            ['L', nFloors, { crumble: 1, drip: 1, ice: true }],
            ['C', 3 + (idx % 2)],
            ['S', 2 + (idx % 2)],
            ['L', nFloors, { crumble: 1, drip: 1 }],
          ],
          riser: { speed: Math.round(19 + d * 16), delay: 4.5, kind: idx % 2 ? 'lava' : 'maw' },
          seed: idx + 300,
        });
        tw.skyTheme = season.sky;
        tw.biome = season.biome;
        return v15SanitizeLevel(tw);
      }

      const b = new LB(
        stageTitle,
        season.biome === 'toxic'
          ? '☣️ ĐẦM LẦY ĐỘC & HỒ AXIT: Cẩn thận cây phun axit, mặt đất há miệng & Kẻ Giả Dạng ở Checkpoint!'
          : season.biome === 'water'
          ? '🌊 BƠI LẶN ĐẠI DƯƠNG: Bơi ngang đạp nước — Coi chừng hàm răng Cá Mập Megalodon!'
          : season.biome === 'heaven'
          ? '☁️ THIÊN ĐƯỜNG TRÊN MÂY: Hố nước thiên giới có thể bơi qua — Nhấn F để Thức Tỉnh Anime!'
          : season.biome === 'hell'
          ? '🔥 ĐỊA NGỤC TỐI THƯỢNG: Sông dung nham sôi sục dưới vực & Mưa thiên thạch hủy diệt!'
          : season.biome === 'space'
          ? '🚀 VŨ TRỤ KHÔNG TRỌNG LỰC: Bay Jetpack & Lộn ngược bước đi trên trần nhà!'
          : '👻 CẢNH BÁO QUỶ DỊ: Hố nước có thể bơi qua — Nhấn F / 🔥 để Biến Hình Thức Tỉnh Anime!',
        season.hue,
        mode === 'coop'
      );

      if (idx % 5 === 3 && idx % 9 !== 6) seg.chaser(b, Math.round(124 + d * 34), 3.8);
      seg.run(b, 420, { flag: true, spikes: [[180, 64]], coins: [[210, -110]] });

      const modCount = 5 + (idx >= 40 ? 1 : 0);
      const used = new Set();
      for (let step = 0; step < modCount; step++) {
        baseDrop(b);
        if (season.biome === 'ice' && step === 1) {
          seg.glacierSled(b, 1450, mode);
          continue;
        }
        if (season.biome === 'space' && step === 1) {
          seg.gravityPillars(b, 920);
          continue;
        }
        if (mode === 'party' && step === 2) {
          seg.partyStackCliff(b, Math.round(205 + d * 60));
          continue;
        }
        if (mode === 'coop' && step === 2) {
          seg.coopDualHold(b, 480, { flag: true });
          continue;
        }
        let si =
          Math.floor(
            hash1((idx + 1) * 31.7 + step * 19.3 + (mode === 'coop' ? 7 : mode === 'party' ? 13 : 0)) *
              POOL_ALL.length
          ) % POOL_ALL.length;
        while (used.has(si)) si = (si + 1) % POOL_ALL.length;
        used.add(si);
        POOL_ALL[si](b, d, mode);
      }

      baseDrop(b);
      let lv;
      if (idx % 3 === 0) {
        seg.trollDoor(b, { mode: 'run' });
        lv = b.finish(0, 0);
      } else if (idx % 3 === 1) {
        seg.leapDoor(b, {});
        lv = b.finish(0, 0);
      } else {
        seg.runKeyZone(b, { len: 1050 });
        seg.run(b, 500, { coins: [[250, -60]] });
        lv = b.finish(460, 56);
      }

      lv.skyTheme = season.sky;
      lv.biome = season.biome;
      if (season.biome === 'ice') {
        for (const s of lv.solids) s.ice = true;
      }
      if (season.biome === 'water') {
        lv.sharks = [];
        for (let sx = 580; sx < lv.w - 600; sx += 980) {
          lv.sharks.push({
            x0: sx,
            x1: Math.min(lv.w - 280, sx + 880),
            baseY: GY - 135,
            minY: GY - 340,
            maxY: GY - 55,
            cx: sx,
            cy: GY - 135,
            speed: 3.6 + d * 1.5,
            off: sx * 0.01,
            dir: 1,
          });
        }
      }
      if (lv.w > 2400 && (season.biome === 'heaven' || season.biome === 'hell' || idx % 3 === 0)) {
        lv.portals = [{ x0: 940, y0: GY - 55, x1: 1520, y1: GY - 180 }];
      }
      if (idx % 9 === 6) return reverseLevelHorizontally(lv);
      return v15SanitizeLevel(lv);
    } catch (err) {
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
    LEVELS.solo.push(() => {
      V11.ctx = { mode: 'solo', i };
      try {
        return makeV20Stage('solo', i);
      } finally {
        V11.ctx = null;
      }
    });
    LEVELS.coop.push(() => {
      V11.ctx = { mode: 'coop', i };
      try {
        return makeV20Stage('coop', i);
      } finally {
        V11.ctx = null;
      }
    });
    LEVELS.party.push(() => {
      V11.ctx = { mode: 'party', i };
      try {
        return makeV20Stage('party', i);
      } finally {
        V11.ctx = null;
      }
    });
  }
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

code = code.slice(0, lastClose) + v20MasterPayload + '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V20.0 MASTERPIECE] Đã tích hợp hoàn chỉnh 7 Tuyệt kỹ Anime độc bản, Cá Mập Megalodon, Lồng Giam, Trần Sập & 300 Màn chơi!');

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
  html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=20.0');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V20.0] Đã tự động cập nhật game.js?v=20.0 trong index.html');
}
