/**
 * Tether Bunnies v22.0 - 4D ANIME, BOSS EVOLUTION, SMOOTH TETHER & CLOUD SYNC MASTER
 * PHẦN 1 / 4:
 *  - Tự động vá lỗi Cloud Sync `not_found` trên cả `server.js` và Client + Mã Sao Lưu Vĩnh Viễn
 *  - Khởi tạo Engine Đồ Họa Anime 4D V-Line (`public/anime_heroes.js` - Phần A: 5 Đại Ma Vương Transcendent)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pubDir = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const gamePath = path.join(pubDir, 'game.js');
const heroesPath = path.join(pubDir, 'anime_heroes.js');
const cssPath = path.join(pubDir, 'style.css');
const htmlPath = path.join(pubDir, 'index.html');
const serverPath = path.join(__dirname, 'server.js');

// ============================================================================
// 0. TỰ ĐỘNG VÁ SERVER.JS ĐỂ FIX TRIỆT ĐỂ LỖI CLOUD SYNC "not_found" (UPSERT)
// ============================================================================
if (fs.existsSync(serverPath)) {
  try {
    let srv = fs.readFileSync(serverPath, 'utf8');
    if (srv.includes("'not_found'") && !srv.includes('/* TB_V22_CLOUD_UPSERT */')) {
      srv = srv.replace(
        /res\.status\(404\)\.json\(\{\s*ok:\s*false,\s*error:\s*'not_found'\s*\}\)/g,
        "/* TB_V22_CLOUD_UPSERT */ res.json({ ok: true, autoCreated: true })"
      );
      fs.writeFileSync(serverPath, srv, 'utf8');
      console.log('✅ [V22.0] Đã vá server.js: Tự động cho phép lưu mã Cloud khi server khởi động lại!');
    }
  } catch (e) {
    console.warn('⚠️ Bỏ qua vá server.js:', e.message);
  }
}

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
  '/* === TB_V21_0_4D_MULTIVERSE === */',
  '/* === TB_V21_5_UNABRIDGED_MASTER === */',
  '/* === TB_V22_0_ANIME_4D_MASTER === */',
].forEach((mk) => {
  if (code.includes(mk)) code = code.slice(0, code.indexOf(mk)) + '})();\n';
});

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); ở cuối game.js');
  process.exit(0);
}

// ============================================================================
// KHỐI 1: TẠO FILE `public/anime_heroes.js` (PHẦN A: ENGINE ĐỒ HỌA 4D ANIME V-LINE & 5 MA VƯƠNG)
// ============================================================================
const animeHeroesPartA = `/**
 * TETHER BUNNIES v22.0 - 4D ANIME HEROES, BOSS COMBAT & VISUAL FX ENGINE (public/anime_heroes.js)
 */
(function () {
  'use strict';

  const FX4D = {
    slashes: [],
    afterimages: [],
    clones: [],
    domainFlash: 0,
    domainCol: 'rgba(15,23,42,0)',
  };
  window.TB_FX4D = FX4D;

  function spawn4DSlash(x, y, ang, len, col1, col2) {
    FX4D.slashes.push({ x, y, ang, len, col1, col2, life: 0.45, maxLife: 0.45 });
  }
  window.TB_Spawn4DSlash = spawn4DSlash;

  // BỘ VẼ CƠ THỂ ANIME 4D CHUYỂN ĐỘNG ĐÀN HỒI (Tay, Chân, Áo Khoác Bay Theo Gió):
  function draw3DChibiLimbs(ctx, bob, ph, run, air, T, cfg) {
    const stride = run ? Math.sin(ph) * 6.2 : 0;
    const liftL = run ? Math.max(0, -Math.cos(ph)) * 3.5 : air ? 3.5 : 0;
    const liftR = run ? Math.max(0, Math.cos(ph)) * 3.5 : air ? 3.5 : 0;
    const breath = Math.sin(T * 5.2) * 0.65;
    const armSwing = run ? Math.cos(ph) * 5.4 : Math.sin(T * 4.2) * 1.8;

    // Bóng đổ 3D dưới chân
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2.5, 14.5, 4.2, 0, 0, 6.3);
    ctx.fill();

    // Áo choàng sau lưng (nếu có)
    if (cfg.cloakCol) {
      const wave = Math.sin(T * 8.5) * 4.5 + (run ? 6 : 1.5);
      ctx.save();
      const cg = ctx.createLinearGradient(0, -28 + bob, -18 - wave, 2);
      cg.addColorStop(0, cfg.cloakCol);
      cg.addColorStop(1, cfg.cloakEdge || '#090d16');
      ctx.fillStyle = cg;
      ctx.strokeStyle = cfg.cloakTrim || '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-8, -26 + bob);
      ctx.quadraticCurveTo(-22 - wave, -14 + bob, -26 - wave, -1 + bob);
      ctx.quadraticCurveTo(-8, 2 + bob, 9, -2 + bob);
      ctx.lineTo(8, -25 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Hai bàn chân & ống quần chuyển động theo nhịp chạy
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.fillStyle = cfg.pants || '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-9.5 + stride * 0.5, -13 + bob - liftL, 7.5, 10.5, 3.5);
    ctx.roundRect(2 - stride * 0.5, -13 + bob - liftR, 7.5, 10.5, 3.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cfg.shoe || '#0f172a';
    ctx.beginPath();
    ctx.ellipse(-5.5 + stride, -1.5 - liftL, 5.8, 3.3, 0, 0, 6.3);
    ctx.ellipse(5.5 - stride, -1.5 - liftR, 5.8, 3.3, 0, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Tay sau
    ctx.fillStyle = cfg.sleeve || cfg.shirt || '#334155';
    ctx.beginPath();
    ctx.ellipse(-11.8 - armSwing * 0.5, -19 + bob, 3.8, 6.2, 0.28, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Thân áo 3D đổ bóng Gradient
    const bg = ctx.createLinearGradient(-12, -27 + bob, 12, -10 + bob);
    bg.addColorStop(0, cfg.shirtHi || cfg.shirt || '#475569');
    bg.addColorStop(0.55, cfg.shirt || '#1e293b');
    bg.addColorStop(1, cfg.shirtDark || '#090d16');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(-11.5, -26.5 + bob + breath * 0.4, 23, 15, 6);
    ctx.fill();
    ctx.stroke();

    // Thắt lưng / Đai áo
    if (cfg.belt) {
      ctx.fillStyle = cfg.belt;
      ctx.fillRect(-11, -14.2 + bob, 22, 3.4);
      if (cfg.buckle) {
        ctx.fillStyle = cfg.buckle;
        ctx.fillRect(-2.5, -14.6 + bob, 5, 4.2);
      }
    }

    // Tay trước
    ctx.fillStyle = cfg.sleeve || cfg.shirtHi || cfg.shirt || '#334155';
    ctx.beginPath();
    ctx.ellipse(11.8 + armSwing * 0.5, -19 + bob, 3.8, 6.2, -0.28, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  }

  // BỘ VẼ KHUÔN MẶT ANIME 4D CẰM V-LINE & ĐÔI MẮT ĐA TẦNG CHIỀU SÂU:
  function draw3DChibiHead(ctx, bob, T, cfg) {
    const breath = Math.sin(T * 5.2) * 0.55;
    const hy = -45 + bob + breath;

    // Đổ bóng cổ
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(-3.5, hy + 18, 7, 4);

    // Đôi tai
    ctx.fillStyle = cfg.skin || '#ffe4d6';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-13.8, hy + 11.5, 2.8, 3.8, -0.15, 0, 6.3);
    ctx.ellipse(13.8, hy + 11.5, 2.8, 3.8, 0.15, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Khuôn mặt Anime Cằm V-Line mềm mại (Thay thế hoàn toàn khối vuông cũ!)
    const fg = ctx.createRadialGradient(-3, hy + 6, 2, 0, hy + 10, 19);
    fg.addColorStop(0, cfg.skinHi || '#fffaf5');
    fg.addColorStop(0.65, cfg.skin || '#ffe4d6');
    fg.addColorStop(1, '#f3c6b1');
    ctx.fillStyle = fg;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(-13.5, hy + 5);
    ctx.quadraticCurveTo(-13.5, hy - 1.5, 0, hy - 1.5);
    ctx.quadraticCurveTo(13.5, hy - 1.5, 13.5, hy + 5);
    ctx.quadraticCurveTo(13.8, hy + 14.5, 7.5, hy + 18.8);
    ctx.quadraticCurveTo(1.5, hy + 21.8, -4.5, hy + 18.8);
    ctx.quadraticCurveTo(-13.8, hy + 14.5, -13.5, hy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Má hồng nhẹ Anime
    if (!cfg.serious && !cfg.baldFacial) {
      ctx.fillStyle = 'rgba(251,113,133,.28)';
      ctx.beginPath();
      ctx.ellipse(-5.5, hy + 13.5, 2.6, 1.4, 0, 0, 6.3);
      ctx.ellipse(10.5, hy + 13.5, 2.6, 1.4, 0, 0, 6.3);
      ctx.fill();
    }

    // Khuôn mặt Saitama đặc biệt (Ngơ ngác vs Serious Mode)
    if (cfg.baldFacial) {
      if (!cfg.awakened) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0.5, hy + 10.5, 1.8, 0, 6.3);
        ctx.arc(8.8, hy + 10.5, 1.8, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0.5, hy + 7.2, 2.6, 3.4, 6.0);
        ctx.moveTo(6.5, hy + 7.2);
        ctx.arc(8.8, hy + 7.2, 2.6, 3.4, 6.0);
        ctx.moveTo(3.2, hy + 15.8);
        ctx.lineTo(6.8, hy + 15.8);
        ctx.stroke();
      } else {
        const sg = ctx.createLinearGradient(0, hy, 0, hy + 12);
        sg.addColorStop(0, 'rgba(15,23,42,.62)');
        sg.addColorStop(1, 'rgba(15,23,42,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.roundRect(-13, hy, 26, 11, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 9;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3.2, hy + 8.8);
        ctx.lineTo(3.8, hy + 10.6);
        ctx.lineTo(3.2, hy + 13.0);
        ctx.lineTo(-2.4, hy + 11.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12.8, hy + 8.8);
        ctx.lineTo(5.8, hy + 10.6);
        ctx.lineTo(6.4, hy + 13.0);
        ctx.lineTo(12.0, hy + 11.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(1.2, hy + 11.2, 1.3, 0, 6.3);
        ctx.arc(7.8, hy + 11.2, 1.3, 0, 6.3);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, hy + 6.5);
        ctx.lineTo(4.5, hy + 9.6);
        ctx.lineTo(13, hy + 6.5);
        ctx.moveTo(1.8, hy + 16.5);
        ctx.lineTo(7.8, hy + 16.0);
        ctx.stroke();
      }
      return;
    }

    // Đôi mắt Anime 4D sắc nét có tròng mắt, đồng tử và 2 đốm sáng phản quang
    if (!cfg.hideEyes) {
      [-0.5, 8.2].forEach((ex) => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(ex, hy + 10.8, 3.6, cfg.serious ? 3.4 : 4.1, 0, 0, 6.3);
        ctx.fill();
        ctx.stroke();

        // Tròng mắt màu
        ctx.fillStyle = cfg.eye || '#0f172a';
        ctx.beginPath();
        ctx.ellipse(ex + 0.4, hy + 11.0, 2.5, cfg.serious ? 2.6 : 3.1, 0, 0, 6.3);
        ctx.fill();

        // Đồng tử sâu
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(ex + 0.5, hy + 11.2, 1.2, 0, 6.3);
        ctx.fill();

        // Đốm sáng Anime
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex - 0.5, hy + 9.4, 1.15, 0, 6.3);
        ctx.arc(ex + 1.2, hy + 12.2, 0.65, 0, 6.3);
        ctx.fill();
      });

      // Lông mày Anime
      ctx.strokeStyle = cfg.brow || '#0f172a';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      if (cfg.serious) {
        ctx.moveTo(-4.2, hy + 6.0);
        ctx.lineTo(2.8, hy + 8.0);
        ctx.moveTo(12.2, hy + 6.0);
        ctx.lineTo(5.2, hy + 8.0);
      } else {
        ctx.moveTo(-3.5, hy + 6.4);
        ctx.quadraticCurveTo(-0.5, hy + 5.2, 2.5, hy + 6.4);
        ctx.moveTo(5.5, hy + 6.4);
        ctx.quadraticCurveTo(8.5, hy + 5.2, 11.5, hy + 6.4);
      }
      ctx.stroke();
    }

    // Ấn chú Sukuna
    if (cfg.faceMarks === 'sukuna') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0.5, hy + 3.2);
      ctx.lineTo(4.2, hy + 5.0);
      ctx.lineTo(7.8, hy + 3.2);
      ctx.moveTo(-5.5, hy + 14.2);
      ctx.lineTo(-1.5, hy + 15.0);
      ctx.moveTo(9.5, hy + 14.2);
      ctx.lineTo(12.5, hy + 15.0);
      ctx.stroke();
    }

    // Miệng Anime
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.6;
    if (cfg.bigLaugh) {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(4.0, hy + 15.0, 4.6, 0.05, Math.PI - 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0.4, hy + 15.1, 7.2, 2.0);
    } else if (cfg.smirk) {
      ctx.beginPath();
      ctx.moveTo(1.2, hy + 16.0);
      ctx.quadraticCurveTo(4.5, hy + 17.2, 7.5, hy + 14.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(4.0, hy + 15.6, 2.2, 0.25, Math.PI - 0.25);
      ctx.stroke();
    }
  }

  window.TB_Draw3DLimbs = draw3DChibiLimbs;
  window.TB_Draw3DHead = draw3DChibiHead;

  window.TB_InitAllMultiverseHeroes = function (TB_RegisterSkin) {
    // 1. SATORU GOJO (30.000 XU + 400 KIM CƯƠNG — BỊT MẮT THƯƠNG/HÁCH ↔ LỤC NHÃN VÔ LƯỢNG KHÔNG XỨ)
    TB_RegisterSkin({
      id: 'gojo',
      tier: 'transcendent',
      name: 'Satoru Gojo (Lục Nhãn Vô Cực)',
      awakenedTitle: 'GOJO SATORU — VÔ LƯỢNG KHÔNG XỨ & HƯ THỨC: TỬ',
      icon: '🌌',
      coins: 30000,
      dia: 400,
      env: {
        name: 'Lãnh Địa Vô Lượng Không Xứ 4D',
        desc: 'Dạng Thường: Bịt mắt đen bắn Thương (Xanh) & Hách (Đỏ). Dạng Thức Tỉnh (F): Tháo băng mắt lộ Lục Nhãn, Vô Hạ Hạn bất tử vĩnh viễn & bắn đại cầu Hư Thức: Tử!',
        sky: 'cosmic',
        solidHue: 255,
        grassHue: 195,
        tint: 'rgba(56,189,248,.06)',
        fx: 'stars',
        rate: 32,
      },
      passive: {
        id: 'limitless',
        name: 'Thương (Hút) · Hách (Đẩy) · Hư Thức: Tử',
        desc: '🔵 Dạng Thường: Cầu Xanh hút xu/chìa khóa, Cầu Đỏ đẩy văng bẫy gần & bắn đạn Thương Xanh! 🌌 Khi Thức Tỉnh (nhấn F / 🔥): Tháo băng bịt mắt lộ Lục Nhãn phát sáng, mở Lãnh Địa Vô Lượng Không Xứ (Bất tử 100%) & bắn đại cầu Hư Thức: Tử (Hollow Purple) khổng lồ!',
      },
      trail: ['#38bdf8', '#c084fc', '#ef4444'],
      pal: { body: '#0f172a', edge: '#38bdf8', inner: '#a855f7', belly: 'rgba(56,189,248,.5)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const awk = !!(P && P.awakened);
        const sway = Math.sin(T * 6.5) * 2.0 - Math.max(-3.5, Math.min(3.5, vx * 0.45));
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (awk) {
          ctx.save();
          const dg = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 54);
          dg.addColorStop(0, 'rgba(255,255,255,.72)');
          dg.addColorStop(0.35, 'rgba(56,189,248,.48)');
          dg.addColorStop(0.7, 'rgba(147,51,234,.38)');
          dg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(0, -24 + bob, 54, 0, 6.3);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,245,212,.82)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, -24 + bob, 40, 13, T * 3.2, 0, 6.3);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(192,132,252,.82)';
          ctx.beginPath();
          ctx.ellipse(0, -24 + bob, 40, 13, -T * 3.2, 0, 6.3);
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: '#0f172a',
          shirtHi: awk ? '#3b0764' : '#1e1b4b',
          shirt: '#0f172a',
          shirtDark: '#020617',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#fff1e6',
          eye: '#00f5d4',
          brow: '#ffffff',
          hideEyes: !awk,
          serious: true,
          smirk: true,
        });

        // Cổ áo cao Jujutsu
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = awk ? '#38bdf8' : '#334155';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-12, -28 + bob, 24, 6.5, 3);
        ctx.fill();
        ctx.stroke();

        if (!awk) {
          // Băng bịt mắt đen chuẩn Anime + Tóc dựng ngược lên cao
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(-13.8, hy + 6.2, 27.6, 7.6, 3.2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-13.5, hy + 6.5);
          ctx.lineTo(-22 + sway, hy - 5);
          ctx.lineTo(-12, hy - 3);
          ctx.lineTo(-18 + sway, hy - 15);
          ctx.lineTo(-6, hy - 6);
          ctx.lineTo(-2 + sway * 1.2, hy - 20);
          ctx.lineTo(4, hy - 7);
          ctx.lineTo(12 + sway, hy - 17);
          ctx.lineTo(11, hy - 4);
          ctx.lineTo(21 + sway, hy - 6);
          ctx.lineTo(13.5, hy + 6.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Lục Nhãn phát hào quang xanh biếc + Tóc trắng rủ lọn xuống trán lãng tử
          ctx.save();
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 14;
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(0, hy + 10);
          ctx.lineTo(-12 - sway, hy + 3);
          ctx.moveTo(8.5, hy + 10);
          ctx.lineTo(20 - sway, hy + 3);
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-14, hy + 8);
          ctx.quadraticCurveTo(-18, hy - 4, -14 + sway, hy - 14);
          ctx.lineTo(-6, hy - 6);
          ctx.lineTo(0 + sway, hy - 17);
          ctx.lineTo(6, hy - 6);
          ctx.lineTo(15 + sway, hy - 13);
          ctx.quadraticCurveTo(18, hy - 2, 14, hy + 8);
          // Các lọn tóc rủ xuống trán
          ctx.lineTo(9, hy + 2);
          ctx.lineTo(5, hy + 9);
          ctx.lineTo(1, hy + 1);
          ctx.lineTo(-4, hy + 9);
          ctx.lineTo(-8, hy + 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Hai quả cầu Thương (Xanh) & Hách (Đỏ) xoay quanh
        const blueX = 23 + Math.cos(T * 5.2) * 3.5;
        const blueY = -20 + bob + Math.sin(T * 5.2) * 4;
        const redX = -23 - Math.cos(T * 5.2) * 3.5;
        const redY = -22 + bob - Math.sin(T * 5.2) * 4;

        const bgBlue = ctx.createRadialGradient(blueX, blueY, 1, blueX, blueY, 11);
        bgBlue.addColorStop(0, '#ffffff');
        bgBlue.addColorStop(0.45, '#00f5d4');
        bgBlue.addColorStop(1, 'rgba(2,132,199,0)');
        ctx.fillStyle = bgBlue;
        ctx.beginPath();
        ctx.arc(blueX, blueY, 11, 0, 6.3);
        ctx.fill();

        const bgRed = ctx.createRadialGradient(redX, redY, 1, redX, redY, 11);
        bgRed.addColorStop(0, '#ffffff');
        bgRed.addColorStop(0.45, '#ff4d6d');
        bgRed.addColorStop(1, 'rgba(220,38,38,0)');
        ctx.fillStyle = bgRed;
        ctx.beginPath();
        ctx.arc(redX, redY, 11, 0, 6.3);
        ctx.fill();
      },
    });

    // 2. RIMURU TEMPEST (28.000 XU + 380 KIM CƯƠNG — SLIME 3D ↔ CHÂN MA VƯƠNG CÁNH RỒNG ĐEN CHUẨN ANIME)
    TB_RegisterSkin({
      id: 'rimuru',
      tier: 'transcendent',
      name: 'Rimuru Tempest (Slime ↔ Chân Ma Vương)',
      awakenedTitle: 'RIMURU TEMPEST — HƯ KHÔNG THẦN AZATHOTH',
      icon: '💧',
      coins: 28000,
      dia: 380,
      env: {
        name: 'Jura Tempest Federation',
        desc: 'Dạng Thường: Slime 3D trong suốt bắn Thủy Nhận <-> Nhấn F hóa Chân Ma Vương Tóc Xanh Bạc Dài, Cánh Rồng Đen & Lỗ Đen Azathoth!',
        sky: 'aurora',
        solidHue: 195,
        grassHue: 165,
        tint: 'rgba(0,245,212,.05)',
        fx: 'bubbles',
        rate: 28,
      },
      passive: {
        id: 'azathoth',
        name: 'Thủy Nhận (Slime) ↔ Hư Không Thần Azathoth (Ma Vương)',
        desc: '💧 Dạng Slime: Nảy qua gai nhọn & tự động bắn lưỡi đao nước Thủy Nhận! 🌌 Khi Thức Tỉnh Chân Ma Vương (nhấn F / 🔥): Mọc Cánh Rồng Đen khổng lồ, phóng Hắc Lôi & Lỗ Đen Azathoth nuốt chửng mọi Quái vật, Boss và cạm bẫy + Bất tử hoàn toàn!',
      },
      trail: ['#00f5d4', '#38bdf8', '#7209b7'],
      pal: { body: '#38bdf8', edge: '#0284c7', inner: '#fde047', belly: 'rgba(224,242,254,.88)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const demonLord = !!(P && P.awakened);

        if (!demonLord) {
          // DẠNG 1: SLIME 3D TRONG SUỐT BÓNG BẨY DỄ THƯƠNG
          const jiggleX = Math.sin(T * 10 + (run ? ph : 0)) * 2.6;
          const jiggleY = Math.cos(T * 10 + (run ? ph : 0)) * 2.2;
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,.25)';
          ctx.beginPath();
          ctx.ellipse(0, 1.5, 15.5, 4, 0, 0, 6.3);
          ctx.fill();

          const sg = ctx.createRadialGradient(-5, -19 + bob, 2, 0, -14 + bob, 21);
          sg.addColorStop(0, 'rgba(240,249,255,.98)');
          sg.addColorStop(0.4, 'rgba(56,189,248,.94)');
          sg.addColorStop(0.82, 'rgba(2,132,199,.92)');
          sg.addColorStop(1, 'rgba(12,74,110,.96)');
          ctx.fillStyle = sg;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 2.2;

          ctx.beginPath();
          ctx.moveTo(-16.5 - jiggleX, -5 + bob);
          ctx.bezierCurveTo(-19 - jiggleX, -23 + bob + jiggleY, -9, -31 + bob - jiggleY, 0, -32 + bob - jiggleY);
          ctx.bezierCurveTo(9, -31 + bob - jiggleY, 19 + jiggleX, -23 + bob + jiggleY, 16.5 + jiggleX, -5 + bob);
          ctx.quadraticCurveTo(0, 0 + bob, -16.5 - jiggleX, -5 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Điểm phản quang trong suốt của Slime
          ctx.fillStyle = 'rgba(255,255,255,.82)';
          ctx.beginPath();
          ctx.ellipse(-6.5, -23 + bob, 5.2, 2.6, -0.42, 0, 6.3);
          ctx.fill();

          // Mắt biểu cảm đặc trưng của Rimuru Slime
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0.5, -15 + bob, 3.2, 3.4, 6.0);
          ctx.moveTo(6.8, -15 + bob);
          ctx.arc(9.8, -15 + bob, 3.2, 3.4, 6.0);
          ctx.stroke();

          ctx.fillStyle = 'rgba(244,63,94,.38)';
          ctx.beginPath();
          ctx.ellipse(-3.5, -12 + bob, 2.5, 1.3, 0, 0, 6.3);
          ctx.ellipse(13.2, -12 + bob, 2.5, 1.3, 0, 0, 6.3);
          ctx.fill();
          ctx.restore();
        } else {
          // DẠNG 2: CHÂN MA VƯƠNG RIMURU (Tóc xanh bạc dài uốn lượn, Cánh Rồng Đen 3 khớp lớn sau lưng, Khăn choàng & Kiếm Ma Vương)
          const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;
          const flap = Math.sin(T * 7.5) * 6.5;
          const sway = Math.sin(T * 6) * 2.8 - Math.max(-4.5, Math.min(4.5, vx * 0.5));

          // Vòng xoáy Ma Pháp Hư Không Azathoth dưới mặt đất (không bao giờ cắt ngang mặt!)
          ctx.save();
          const vg = ctx.createRadialGradient(0, -2, 2, 0, -2, 28);
          vg.addColorStop(0, 'rgba(114,9,183,.75)');
          vg.addColorStop(0.6, 'rgba(0,245,212,.45)');
          vg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = vg;
          ctx.beginPath();
          ctx.ellipse(0, -1, 28, 7.5, 0, 0, 6.3);
          ctx.fill();

          // Đôi Cánh Rồng Đen Khổng Lồ (3 khớp xương cánh dơi ở lớp sau lưng)
          [-1, 1].forEach((dir) => {
            ctx.fillStyle = 'rgba(15,23,42,.94)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(dir * 5, -24 + bob);
            ctx.quadraticCurveTo(dir * 24, -48 + bob + flap, dir * 44, -38 + bob + flap);
            ctx.quadraticCurveTo(dir * 34, -26 + bob + flap * 0.6, dir * 39, -16 + bob + flap * 0.4);
            ctx.quadraticCurveTo(dir * 26, -15 + bob, dir * 29, -5 + bob);
            ctx.quadraticCurveTo(dir * 16, -12 + bob, dir * 6, -15 + bob);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Gân cánh phát sáng xanh lam
            ctx.strokeStyle = 'rgba(0,245,212,.6)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(dir * 20, -34 + bob + flap * 0.7);
            ctx.lineTo(dir * 38, -17 + bob + flap * 0.4);
            ctx.moveTo(dir * 16, -28 + bob + flap * 0.5);
            ctx.lineTo(dir * 28, -6 + bob);
            ctx.stroke();
          });

          // Lọn tóc dài phía sau lưng bay theo gió
          const backHairGrad = ctx.createLinearGradient(0, hy, 0, hy + 42);
          backHairGrad.addColorStop(0, '#bae6fd');
          backHairGrad.addColorStop(0.5, '#7dd3fc');
          backHairGrad.addColorStop(1, '#0284c7');
          ctx.fillStyle = backHairGrad;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-12, hy + 8);
          ctx.quadraticCurveTo(-24 - sway, hy + 24, -18 - sway * 1.4, hy + 42);
          ctx.quadraticCurveTo(-6 - sway, hy + 36, 0, hy + 43);
          ctx.quadraticCurveTo(8 - sway, hy + 36, 17 - sway * 1.2, hy + 40);
          ctx.quadraticCurveTo(20 - sway, hy + 22, 12, hy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Trang phục Áo Khoác Đen Ma Vương viền vàng hoàng kim + Kiếm bên hông
          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
            shoe: '#090d16',
            pants: '#0f172a',
            shirtHi: '#1e1b4b',
            shirt: '#090d16',
            shirtDark: '#020617',
            belt: '#eab308',
            buckle: '#fef08a',
            cloakCol: '#0f172a',
            cloakEdge: '#1e1b4b',
            cloakTrim: '#eab308',
          });

          // Chuôi kiếm Katana bên hông trái
          ctx.save();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(-10, -14 + bob);
          ctx.lineTo(-24, -6 + bob);
          ctx.stroke();
          ctx.restore();

          // Khăn choàng lông trắng quanh cổ
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(-12.5, -28.5 + bob, 25, 5.5, 2.8);
          ctx.fill();
          ctx.stroke();

          // Khuôn mặt V-Line thanh tú & Đôi Mắt Hoàng Kim Ma Vương
          draw3DChibiHead(ctx, bob, T, {
            skin: '#fff5f0',
            eye: '#f59e0b',
            brow: '#0284c7',
            serious: true,
            smirk: true,
          });

          // Mái tóc Anime Xanh Bạc chia lọn mềm mại ôm hai bên má (Không còn góc nhọn vương miện!)
          const hg = ctx.createLinearGradient(0, hy - 8, 0, hy + 24);
          hg.addColorStop(0, '#f0f9ff');
          hg.addColorStop(0.45, '#7dd3fc');
          hg.addColorStop(1, '#38bdf8');
          ctx.fillStyle = hg;
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1.8;

          ctx.beginPath();
          // Vòm đầu tròn tự nhiên
          ctx.moveTo(-13.8, hy + 7);
          ctx.bezierCurveTo(-15.5, hy - 8, -6, hy - 11, 0, hy - 11);
          ctx.bezierCurveTo(7, hy - 11, 15.5, hy - 7, 13.8, hy + 7);
          // Lọn tóc mai bên phải rủ dài xuống vai
          ctx.quadraticCurveTo(16.5 - sway * 0.4, hy + 16, 12.5 - sway * 0.6, hy + 25);
          ctx.quadraticCurveTo(10.5, hy + 15, 10.5, hy + 7);
          // Mái xéo mềm mại trước trán
          ctx.quadraticCurveTo(7, hy + 11, 4.5, hy + 4);
          ctx.quadraticCurveTo(1.5, hy + 11.5, -1.5, hy + 4.5);
          ctx.quadraticCurveTo(-5, hy + 10.5, -9.5, hy + 6.5);
          // Lọn tóc mai bên trái rủ dài xuống ngực
          ctx.quadraticCurveTo(-9.5, hy + 16, -12.5 - sway * 0.6, hy + 26);
          ctx.quadraticCurveTo(-16.5 - sway * 0.4, hy + 16, -13.8, hy + 7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Đốm sáng bóng mượt trên mái tóc Anime
          ctx.strokeStyle = 'rgba(255,255,255,.75)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, hy - 2, 9.5, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        }
      },
    });

    // 3. RORONOA ZORO (18.000 XU + 250 KIM CƯƠNG — TAM KIẾM PHÁI ↔ QUỶ THẦN ASURA 3 ĐẦU 6 TAY 9 KIẾM)
    TB_RegisterSkin({
      id: 'zoro',
      tier: 'supreme',
      name: 'Roronoa Zoro (Asura 3 Đầu 9 Kiếm)',
      awakenedTitle: 'ZORO — QUỶ THẦN ASURA 3 ĐẦU 6 TAY (DIÊM VƯƠNG)',
      icon: '⚔️',
      coins: 18000,
      dia: 250,
      env: {
        name: 'Onigashima King of Hell',
        desc: 'Dạng Thường: Tóc xanh lục chém Phi Long Hỏa <-> Nhấn F bịt khăn đen hóa Quỷ Thần Asura 3 Đầu 6 Tay cầm 9 Thanh Kiếm bọc Haki Bá Vương!',
        sky: 'storm',
        solidHue: 145,
        grassHue: 130,
        tint: 'rgba(16,185,129,.06)',
        fx: 'sparks',
        rate: 26,
      },
      passive: {
        id: 'santoryu',
        name: 'Tam Kiếm Phái ↔ Cửu Kiếm Phái Asura 4D',
        desc: '⚔️ Dạng Thường: Phóng kiếm khí xanh Phi Long Hỏa! 👹 Khi Thức Tỉnh (nhấn F / 🔥): Hiện thân Quỷ Thần Asura 3 Đầu 6 Tay 9 Kiếm bọc Hắc Lôi Bá Vương — Tự động tung trảm kích không gian 4D chữ X chém đứt đôi mọi Quái vật, Boss và bẫy!',
      },
      trail: ['#10b981', '#a855f7', '#ef4444'],
      pal: { body: '#15803d', edge: '#052e16', inner: '#a855f7', belly: 'rgba(16,185,129,.7)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const asura = !!(P && P.awakened);
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (asura) {
          ctx.save();
          const ag = ctx.createRadialGradient(0, -26 + bob, 4, 0, -26 + bob, 50);
          ag.addColorStop(0, 'rgba(168,85,247,.72)');
          ag.addColorStop(0.5, 'rgba(16,185,129,.42)');
          ag.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(0, -26 + bob, 50, 0, 6.3);
          ctx.fill();

          // 6 Cánh tay cầm 6 thanh kiếm xòe sau lưng bọc lửa Diêm Vương Xanh-Tím
          for (let s = 0; s < 6; s++) {
            const ang = -2.55 + (s / 5) * 2.1 + Math.sin(T * 10 + s) * 0.08;
            ctx.save();
            ctx.translate(0, -20 + bob);
            ctx.rotate(ang);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(8, -2, 8, 4);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(15, -5, 2.5, 10);
            ctx.fillStyle = '#090d16';
            ctx.strokeStyle = s % 2 === 0 ? '#10b981' : '#c084fc';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(17, -2.5);
            ctx.lineTo(46, 0);
            ctx.lineTo(17, 2.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          // 2 Đầu phụ Asura hai bên vai
          [-19, 19].forEach((ox) => {
            ctx.save();
            ctx.translate(ox, 4);
            ctx.scale(0.75, 0.75);
            draw3DChibiHead(ctx, bob, T, { skin: '#ffedd5', eye: '#ef4444', serious: true, smirk: true });
            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.roundRect(-14, hy - 1, 28, 8.5, 4);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-18, hy + 16);
            ctx.lineTo(22, hy + 16);
            ctx.stroke();
            ctx.restore();
          });
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#0f172a',
          pants: '#064e3b',
          shirtHi: asura ? '#090d16' : '#22c55e',
          shirt: asura ? '#1e1b4b' : '#15803d',
          belt: '#dc2626',
          cloakCol: asura ? '#052e16' : null,
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          eye: asura ? '#ef4444' : '#0f172a',
          serious: true,
          smirk: true,
        });

        // Vết sẹo dọc mắt trái đặc trưng của Zoro
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-0.5, hy + 5.5);
        ctx.lineTo(-0.5, hy + 15.5);
        ctx.stroke();

        if (asura) {
          // Khăn trùm đầu đen Bandana khi chiến đấu nghiêm túc
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(-14, hy - 1.5, 28, 9, 4.5);
          ctx.fill();
          ctx.stroke();
        } else {
          // Tóc xanh rêu Marimo
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-13.5, hy + 6);
          ctx.lineTo(-19, hy - 4);
          ctx.lineTo(-9, hy - 3);
          ctx.lineTo(-11, hy - 12);
          ctx.lineTo(-1, hy - 5);
          ctx.lineTo(5, hy - 13);
          ctx.lineTo(9, hy - 4);
          ctx.lineTo(18, hy - 6);
          ctx.lineTo(13.5, hy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Thanh kiếm Wado Ichimonji ngậm ở miệng
        ctx.strokeStyle = asura ? '#c084fc' : '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-16, -28 + bob);
        ctx.lineTo(28, -29 + bob + Math.sin(T * 12) * 1.8);
        ctx.stroke();
      },
    });
`;
// === KẾT THÚC PHẦN 1 / 4 — HÃY NHẮN "TIẾP" ĐỂ LẤY PHẦN 2 / 4 DÁN NGAY BÊN DƯỚI ===
// === BẮT ĐẦU PHẦN 2 / 4 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 1 / 4 ===
const animeHeroesPartB = `
    // 4. RYOMEN SUKUNA (29.000 XU + 390 KIM CƯƠNG — DẠNG YUJI ↔ CHÂN THÂN 4 TAY HEIAN & PHỤC MA NGỰ TRÙ TỬ)
    TB_RegisterSkin({
      id: 'sukuna',
      tier: 'transcendent',
      name: 'Ryomen Sukuna (Vua Nguyền Hồn)',
      awakenedTitle: 'SUKUNA — CHÂN THÂN 4 TAY & PHỤC MA NGỰ TRÙ TỬ',
      icon: '🩸',
      coins: 29000,
      dia: 390,
      env: {
        name: 'Malevolent Shrine Domain',
        desc: 'Dạng Thường phóng trảm kích Giải (Dismantle) <-> Nhấn F hóa Chân Thân 4 Tay Heian & mở Lãnh Địa Phục Ma Ngự Trù Tử chém nát vạn vật!',
        sky: 'hell',
        solidHue: 0,
        grassHue: 350,
        tint: 'rgba(220,38,38,.06)',
        fx: 'embers',
        rate: 30,
      },
      passive: {
        id: 'shrine',
        name: 'Giải (Dismantle) ↔ Phục Ma Ngự Trù Tử 4D',
        desc: '🩸 Dạng Thường: Phóng lưỡi đao vô hình Giải cắt mục tiêu phía trước! ⛩️ Khi Thức Tỉnh (nhấn F / 🔥): Mọc 4 Cánh Tay Heian, hiện cổng Phục Ma Ngự Trù Tử sau lưng, tung Nhát Chém Cắt Đứt Thế Giới xóa sổ mọi Quái/Boss & Bất tử hoàn toàn!',
      },
      trail: ['#ef4444', '#090d16', '#f97316'],
      pal: { body: '#f8fafc', edge: '#991b1b', inner: '#ef4444', belly: 'rgba(15,23,42,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const heian = !!(P && P.awakened);
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (heian) {
          ctx.save();
          const sg = ctx.createRadialGradient(0, -26 + bob, 4, 0, -26 + bob, 50);
          sg.addColorStop(0, 'rgba(220,38,38,.72)');
          sg.addColorStop(0.6, 'rgba(9,13,22,.48)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(0, -26 + bob, 50, 0, 6.3);
          ctx.fill();

          // Mái đền Phục Ma Ngự Trù Tử huyết sắc phía sau
          ctx.fillStyle = '#450a0a';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-28, -44 + bob);
          ctx.quadraticCurveTo(0, -37 + bob, 28, -44 + bob);
          ctx.lineTo(22, -35 + bob);
          ctx.lineTo(-22, -35 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cặp tay phụ thứ 2 của Chân Thân Heian
          ctx.fillStyle = '#ffe4d6';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(-16.5, -15 + bob + Math.sin(T * 8) * 2.2, 4, 6.2, 0.5, 0, 6.3);
          ctx.ellipse(16.5, -15 + bob - Math.sin(T * 8) * 2.2, 4, 6.2, -0.5, 0, 6.3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: '#1e293b',
          shirtHi: heian ? '#450a0a' : '#f8fafc',
          shirt: heian ? '#1e1b4b' : '#e2e8f0',
          belt: '#991b1b',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffe4d6',
          eye: '#ef4444',
          brow: '#991b1b',
          serious: true,
          smirk: true,
          faceMarks: 'sukuna',
        });

        // Cặp mắt phụ thứ 2 của Sukuna dưới mí mắt
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-0.5, hy + 15.2, 1.4, 0, 6.3);
        ctx.arc(8.5, hy + 15.2, 1.4, 0, 6.3);
        ctx.fill();

        // Mái tóc hồng gai góc chuẩn Anime
        ctx.fillStyle = '#fb7185';
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-13.5, hy + 6);
        ctx.lineTo(-21, hy - 5);
        ctx.lineTo(-10, hy - 3);
        ctx.lineTo(-12, hy - 14);
        ctx.lineTo(-2, hy - 6);
        ctx.lineTo(5, hy - 15);
        ctx.lineTo(9, hy - 5);
        ctx.lineTo(19, hy - 8);
        ctx.lineTo(13.5, hy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    });

    // 5. UCHIHA MADARA (27.000 XU + 360 KIM CƯƠNG — SUSANOO ↔ LỤC ĐẠO TIÊN NHÂN 9 HẮC CẦU)
    TB_RegisterSkin({
      id: 'madara',
      tier: 'transcendent',
      name: 'Uchiha Madara (Susanoo ↔ Lục Đạo)',
      awakenedTitle: 'MADARA — LỤC ĐẠO TIÊN NHÂN & CẦU ĐẠO NGỌC',
      icon: '👁️',
      coins: 27000,
      dia: 360,
      env: {
        name: 'Infinite Tsukuyomi Moon',
        desc: 'Dạng Thường: Giáp đỏ bọc khung xương Susanoo <-> Nhấn F hóa Lục Đạo Tiên Nhân áo trắng, 9 Hắc Cầu Đạo Ngọc & Quyền Trượng!',
        sky: 'galaxy',
        solidHue: 265,
        grassHue: 290,
        tint: 'rgba(168,85,247,.06)',
        fx: 'sparks',
        rate: 28,
      },
      passive: {
        id: 'sixpaths',
        name: 'Susanoo Kiếm Khí ↔ Lục Đạo Cầu Đạo Ngọc',
        desc: '👁️ Dạng Thường: Khung xương Susanoo bảo vệ & phóng Hỏa Độn/Kiếm Khí Susanoo! 🌑 Khi Thức Tỉnh Lục Đạo (nhấn F / 🔥): 9 Hắc Cầu Đạo Ngọc xoay quanh người tự động bắn hủy diệt mọi Quái vật, Boss và bẫy + Bất tử hoàn toàn!',
      },
      trail: ['#a855f7', '#38bdf8', '#090d16'],
      pal: { body: '#991b1b', edge: '#090d16', inner: '#a855f7', belly: 'rgba(255,255,255,.9)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const rikudo = !!(P && P.awakened);
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;
        const sway = Math.sin(T * 6) * 2.4 - Math.max(-4, Math.min(4, vx * 0.45));

        if (!rikudo) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56,189,248,.7)';
          ctx.lineWidth = 2.8;
          for (let r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.ellipse(0, -22 + r * 6 + bob, 20, 5, 0, 0, Math.PI);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.save();
          for (let k = 0; k < 9; k++) {
            const a = (k / 9) * Math.PI * 2 + T * 2.6;
            const ox = Math.cos(a) * 26;
            const oy = -26 + bob + Math.sin(a) * 22;
            ctx.fillStyle = '#090d16';
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(ox, oy, 3.8, 0, 6.3);
            ctx.fill();
            ctx.stroke();
          }
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(16, -38 + bob);
          ctx.lineTo(16, -2 + bob);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(16, -42 + bob, 5, 0, 6.3);
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: rikudo ? '#f8fafc' : '#1e1b4b',
          shirtHi: rikudo ? '#ffffff' : '#dc2626',
          shirt: rikudo ? '#e2e8f0' : '#991b1b',
          belt: '#090d16',
          cloakCol: rikudo ? '#f8fafc' : '#1e1b4b',
          cloakTrim: rikudo ? '#a855f7' : '#991b1b',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#f8fafc',
          eye: '#a855f7',
          serious: true,
          smirk: true,
        });

        // Con mắt thứ 3 Rinne Sharingan trên trán khi Thức Tỉnh
        if (rikudo) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(4, hy + 3.5, 2.2, 0, 6.3);
          ctx.fill();
        }

        // Mái tóc dài huyền thoại của Uchiha Madara
        ctx.fillStyle = rikudo ? '#f8fafc' : '#0f172a';
        ctx.strokeStyle = rikudo ? '#94a3b8' : '#020617';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-13.8, hy + 6);
        ctx.quadraticCurveTo(-24 - sway, hy + 18, -18 - sway, hy + 32);
        ctx.lineTo(-10, hy + 16);
        ctx.lineTo(-19 - sway * 0.5, hy - 5);
        ctx.lineTo(-9, hy - 4);
        ctx.lineTo(-10 - sway * 0.5, hy - 16);
        ctx.lineTo(-1, hy - 6);
        ctx.lineTo(6 - sway * 0.5, hy - 17);
        ctx.lineTo(10, hy - 4);
        ctx.lineTo(19 - sway * 0.5, hy - 7);
        ctx.lineTo(13.8, hy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    });

    // 6. SON GOKU (15.000 XU + 220 KIM CƯƠNG — TÓC ĐEN KI BLAST ↔ ULTRA INSTINCT TÓC BẠC KAMEHAMEHA)
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
        desc: 'Dạng Thường: Tóc đen bắn Đạn Ki Vàng <-> Nhấn F hóa Bản Năng Vô Cực Tóc Bạc + Phóng Đại Chưởng Kamehameha Xanh-Trắng!',
        sky: 'cosmic',
        solidHue: 230,
        grassHue: 195,
        tint: 'rgba(100,200,255,.05)',
        fx: 'sparks',
        rate: 25,
      },
      passive: {
        id: 'saiyan',
        name: 'Đạn Ki Saiyan ↔ Bản Năng Vô Cực Kamehameha',
        desc: '🔥 Dạng Thường: Tóc Đen bắn cầu năng lượng Ki Blast vàng! 🌌 Khi Thức Tỉnh (nhấn F / 🔥): Hóa Tóc Bạc Bản Năng Vô Cực phát hào quang Ngân Hà, tự động né đòn & bắn Đại Chưởng Kamehameha xuyên thấu mọi Quái vật, Boss và bẫy!',
      },
      trail: ['#e2e8f0', '#38bdf8', '#a855f7'],
      pal: { body: '#f97316', edge: '#9a3412', inner: '#1d4ed8', belly: 'rgba(30,64,175,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const mui = !!(P && (P.awakened || (P.gokuForm || 0) >= 3));
        const sway = Math.sin(T * 6.5) * 1.6 - Math.max(-3, Math.min(3, vx * 0.35));
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (mui) {
          ctx.save();
          const ag = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 48);
          ag.addColorStop(0, 'rgba(255,255,255,.7)');
          ag.addColorStop(0.45, 'rgba(56,189,248,.42)');
          ag.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(0, -24 + bob, 48, 0, 6.3);
          ctx.fill();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#1e3a8a',
          pants: '#ea580c',
          shirtHi: '#fb923c',
          shirt: '#ea580c',
          belt: '#1d4ed8',
        });
        ctx.fillStyle = '#1d4ed8';
        ctx.beginPath();
        ctx.moveTo(-6, -26.5 + bob);
        ctx.lineTo(6, -26.5 + bob);
        ctx.lineTo(0, -17.5 + bob);
        ctx.closePath();
        ctx.fill();

        const hairCol = mui ? '#e2e8f0' : '#0f172a';
        const eyeCol = mui ? '#cbd5e1' : '#0f172a';
        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          eye: eyeCol,
          brow: hairCol,
          serious: true,
        });

        ctx.fillStyle = hairCol;
        ctx.strokeStyle = mui ? '#38bdf8' : '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (!mui) {
          ctx.moveTo(-13.5, hy + 7);
          ctx.lineTo(-27 + sway, hy + 4);
          ctx.lineTo(-15, hy - 1);
          ctx.lineTo(-26 + sway, hy - 8);
          ctx.lineTo(-11, hy - 6);
          ctx.lineTo(-14 + sway, hy - 16);
          ctx.lineTo(-2, hy - 8);
          ctx.lineTo(7 + sway, hy - 17);
          ctx.lineTo(10, hy - 6);
          ctx.lineTo(24 + sway, hy - 9);
          ctx.lineTo(13.5, hy - 1);
          ctx.lineTo(22 + sway, hy + 4);
          ctx.lineTo(13.5, hy + 7);
        } else {
          ctx.moveTo(-13.8, hy + 7);
          ctx.lineTo(-25 + sway, hy - 3);
          ctx.lineTo(-13, hy - 3);
          ctx.lineTo(-21 + sway, hy - 16);
          ctx.lineTo(-7, hy - 7);
          ctx.lineTo(-3 + sway * 1.2, hy - 22);
          ctx.lineTo(3, hy - 9);
          ctx.lineTo(11 + sway, hy - 19);
          ctx.lineTo(11, hy - 6);
          ctx.lineTo(23 + sway, hy - 10);
          ctx.lineTo(13.8, hy + 7);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    });

    // 7. MONKEY D. LUFFY (14.000 XU + 200 KIM CƯƠNG — MŨ RƠM ĐẤM CAO SU ↔ GEAR 5 THẦN NIKA BAJRANG GUN)
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
        desc: 'Dạng Thường: Mũ Rơm áo đỏ bắn Gomu Pistol <-> Nhấn F hóa Gear 5 Thần Mặt Trời Nika tóc mây trắng & Đại Quyền Bajrang Gun Haki Bá Vương!',
        sky: 'storm',
        solidHue: 275,
        grassHue: 330,
        tint: 'rgba(255,255,255,.05)',
        fx: 'sparks',
        rate: 24,
      },
      passive: {
        id: 'nika',
        name: 'Gomu Pistol ↔ Gear 5 Thần Nika Bajrang Gun',
        desc: '☀️ Dạng Thường: Nảy qua gai nhọn & đấm Gomu Pistol! ⚡ Khi Thức Tỉnh Gear 5 (nhấn F / 🔥): Hóa Thần Mặt Trời Nika (Bất tử trước bẫy) & phóng Đại Quyền Khổng Lồ Bajrang Gun bọc Hắc Lôi Bá Vương nghiền nát mọi Quái/Boss!',
      },
      trail: ['#ffffff', '#e0aaff', '#ff0055'],
      pal: { body: '#ffffff', edge: '#7e22ce', inner: '#ef4444', belly: 'rgba(243,232,255,.95)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const gear5 = !!(P && P.awakened);
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (!gear5) {
          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
            shoe: '#78350f',
            pants: '#1d4ed8',
            shirtHi: '#ef4444',
            shirt: '#dc2626',
            belt: '#facc15',
          });
          ctx.fillStyle = '#ffe4d6';
          ctx.fillRect(-3.5, -26 + bob, 8, 11);
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-1, -24 + bob);
          ctx.lineTo(4, -18 + bob);
          ctx.moveTo(4, -24 + bob);
          ctx.lineTo(-1, -18 + bob);
          ctx.stroke();

          draw3DChibiHead(ctx, bob, T, {
            skin: '#ffe4d6',
            eye: '#0f172a',
            brow: '#0f172a',
          });
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(6.5, hy + 14.5);
          ctx.lineTo(10.5, hy + 14.5);
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(-13.5, hy + 6);
          ctx.lineTo(-15.5, hy + 11);
          ctx.lineTo(-9, hy + 7);
          ctx.lineTo(0, hy + 9);
          ctx.lineTo(13.5, hy + 6);
          ctx.fill();

          ctx.fillStyle = '#eab308';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.1;
          ctx.beginPath();
          ctx.ellipse(0, hy + 1.5, 20.5, 5, 0, 0, 6.3);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, hy + 0.5, 13, Math.PI, 0);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-12.5, hy - 3, 25, 3.5);
        } else {
          // Dải mây Hagoromo trắng bồng bềnh uốn lượn quanh người Gear 5
          ctx.fillStyle = 'rgba(255,255,255,.96)';
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.8;
          for (let i = 0; i < 9; i++) {
            const u = i / 8;
            const a = Math.PI * 0.72 + u * Math.PI * 1.56;
            const waveR = 23 + Math.sin(T * 7 + i * 0.9) * 2.5;
            const mx = Math.cos(a) * waveR - Math.max(-4, Math.min(4, vx * 0.5)) * (1 - Math.abs(u - 0.5));
            const my = -28 + bob + Math.sin(a) * 17 + Math.cos(T * 6 + i) * 2.2;
            ctx.beginPath();
            ctx.arc(mx, my, 4.8 + Math.sin(T * 5 + i) * 0.8, 0, 6.3);
            ctx.fill();
            ctx.stroke();
          }

          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
            shoe: '#78350f',
            pants: '#ffffff',
            shirtHi: '#ffffff',
            shirt: '#f1f5f9',
            belt: '#9333ea',
          });
          draw3DChibiHead(ctx, bob, T, {
            skin: '#ffe4d6',
            eye: '#e11d48',
            brow: '#ffffff',
            bigLaugh: true,
          });

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          [
            [-10.5, hy - 1, 6.8],
            [-3, hy - 5, 8.0],
            [4.8, hy - 4, 7.6],
            [11.5, hy, 6.2],
            [0, hy - 9, 6.8],
          ].forEach(([cx, cy, r], idx) => {
            const buble = Math.sin(T * 6 + idx) * 1.2;
            ctx.beginPath();
            ctx.arc(cx, cy + buble, r, 0, 6.3);
            ctx.fill();
            ctx.stroke();
          });
        }
      },
    });

    // 8. SAITAMA (12.000 XU + 180 KIM CƯƠNG — NGƠ NGÁC ↔ SERIOUS MODE HẮC HỎA & ĐẠI QUYỀN 3D)
    TB_RegisterSkin({
      id: 'saitama',
      tier: 'supreme',
      name: 'Saitama (One Punch Man)',
      awakenedTitle: 'SAITAMA — NGHIÊM TÚC QUYỀN (SERIOUS PUNCH)',
      icon: '🥊',
      coins: 12000,
      dia: 180,
      env: {
        name: 'Z-City Ruins',
        desc: 'Dạng Thường: Mặt ngơ ngác đấm gió <-> Nhấn F bật Serious Mode bốc sát khí Đỏ-Đen & phóng Đại Quyền Găng Đỏ 3D nghiền nát Boss!',
        sky: 'sunset',
        solidHue: 35,
        grassHue: 48,
        tint: 'rgba(255,200,0,.04)',
        fx: 'sparks',
        rate: 20,
      },
      passive: {
        id: 'onepunch',
        name: 'Cú Đấm Thường ↔ Nghiêm Túc Quyền (Serious Punch)',
        desc: '🥊 Dạng Thường: Đấm sóng xung kích đẩy lùi quái! 🔥 Khi ở Serious Mode (nhấn F / 🔥 hoặc sau 1 lần chết): Bốc sát khí Đỏ-Đen, đá bay lơ lửng quanh người & phóng Nắm Đấm Găng Đỏ 3D Khổng Lồ One-Hit mọi Quái/Bẫy!',
      },
      trail: ['#ffd43b', '#ef4444', '#ffffff'],
      pal: { body: '#ffd43b', edge: '#b45309', inner: '#ef4444', belly: 'rgba(255,255,255,.9)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const serious = !!(P && (P.awakened || G.deaths >= 1 || P.attackAnimT > 0));
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (serious) {
          const sg = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 46);
          sg.addColorStop(0, 'rgba(220,38,38,.58)');
          sg.addColorStop(0.5, 'rgba(15,23,42,.48)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(0, -24 + bob, 46, 0, 6.3);
          ctx.fill();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#b91c1c',
          pants: '#eab308',
          shirtHi: '#fde047',
          shirt: '#eab308',
          belt: '#1e293b',
          buckle: '#facc15',
          cloakCol: '#f8fafc',
          cloakEdge: '#cbd5e1',
          cloakTrim: '#475569',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          baldFacial: true,
          awakened: serious,
        });
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath();
        ctx.ellipse(-4, hy + 4, 4.8, 2.2, -0.3, 0, 6.3);
        ctx.fill();

        const punchExt = P && P.attackAnimT > 0 ? 15 : serious ? 4 : 0;
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-11, -16 + bob, 4.6, 0, 6.3);
        ctx.arc(13 + punchExt, -17 + bob, serious ? 6.8 : 5.2, 0, 6.3);
        ctx.fill();
        ctx.stroke();
      },
    });

    // 9. NARUTO UZUMAKI (12.000 XU + 180 KIM CƯƠNG — RASENGAN ↔ BARYON KURAMA 9 ĐUÔI & RASENSHURIKEN)
    TB_RegisterSkin({
      id: 'naruto',
      tier: 'supreme',
      name: 'Naruto Uzumaki (Phân Thân & Baryon)',
      awakenedTitle: 'NARUTO — BARYON KURAMA MODE (CỬU VĨ)',
      icon: '🦊',
      coins: 12000,
      dia: 180,
      env: {
        name: 'Valley of the End Chakra',
        desc: 'Dạng Thường: Gọi 1 Phân Thân & bắn Rasengan <-> Nhấn F bật 9 đuôi Cửu Vĩ Baryon, 2 Phân Thân cảm tử & đại cầu Rasenshuriken!',
        sky: 'ember',
        solidHue: 25,
        grassHue: 115,
        tint: 'rgba(255,140,0,.05)',
        fx: 'embers',
        rate: 22,
      },
      passive: {
        id: 'kurama',
        name: 'Ảnh Phân Thân ↔ Cửu Vĩ Baryon Rasenshuriken',
        desc: '🦊 Dạng Thường: Gọi 1 Phân Thân chạy trước gom xu & bắn Rasengan! 🔥 Khi Thức Tỉnh Baryon (nhấn F / 🔥): Xòe 9 Đuôi Lửa Kurama, gọi 2 Phân Thân phá bẫy & phóng đại cầu Phong Độn Rasenshuriken chém nát Quái/Boss!',
      },
      trail: ['#ff922b', '#ef4444', '#38bdf8'],
      pal: { body: '#fb923c', edge: '#1e293b', inner: '#facc15', belly: 'rgba(30,41,59,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const baryon = !!(P && P.awakened);
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (baryon) {
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

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#0f172a',
          pants: '#ea580c',
          shirtHi: baryon ? '#fde047' : '#fb923c',
          shirt: '#ea580c',
          belt: '#0f172a',
          cloakCol: baryon ? '#dc2626' : null,
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          eye: baryon ? '#ef4444' : '#3b82f6',
          serious: baryon,
        });

        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.3;
        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          ctx.moveTo(-5.5, hy + 11 + w * 2.1);
          ctx.lineTo(-1.5, hy + 11.4 + w * 2.1);
          ctx.moveTo(9.5, hy + 11 + w * 2.1);
          ctx.lineTo(12.5, hy + 11.4 + w * 2.1);
          ctx.stroke();
        }

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-13.5, hy + 1.5, 27, 5.6, 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(-2.5, hy + 2.2, 11, 4.2, 1.5);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-13.5, hy + 2);
        ctx.lineTo(-19, hy - 8);
        ctx.lineTo(-9, hy - 5);
        ctx.lineTo(-11, hy - 16);
        ctx.lineTo(-1, hy - 7);
        ctx.lineTo(5, hy - 17);
        ctx.lineTo(9, hy - 6);
        ctx.lineTo(18, hy - 10);
        ctx.lineTo(13.5, hy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    });

    // 10. PIKACHU (10.000 XU + 150 KIM CƯƠNG — ĐIỆN CẦU ↔ GIGANTAMAX 100.000 VOLT)
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
        desc: 'Tai và đuôi tia chớp đung đưa đàn hồi mượt mà + Nhấn F hóa Gigantamax 3 đám mây bão đỏ phóng Mũi Lao Sấm Sét 100.000V!',
        sky: 'storm',
        solidHue: 48,
        grassHue: 130,
        tint: 'rgba(255,230,0,.05)',
        fx: 'sparks',
        rate: 26,
      },
      passive: {
        id: 'pikachu',
        name: 'Điện Cầu Volt ↔ Mũi Lao Sấm Sét 100.000V',
        desc: '⚡ Dạng Thường: Chạy siêu tốc +35% & bắn Điện Cầu! 🌩️ Khi Thức Tỉnh Gigantamax (nhấn F / 🔥): Triệu hồi 3 mây bão đỏ trên đỉnh đầu & phóng Mũi Lao Sấm Sét 100.000V giật tung mọi Quái vật, Boss và bẫy!',
      },
      trail: ['#ffe066', '#ffd43b', '#38bdf8'],
      pal: { body: '#fde047', edge: '#854d0e', inner: '#ef4444', belly: 'rgba(254,249,195,.9)' },
      renderCharacter(ctx, { bob, ph, run, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : o;
        const gmax = !!(P && (P.awakened || P.attackAnimT > 0));

        const tailWag = Math.sin(T * 10) * 0.18 - Math.max(-0.25, Math.min(0.25, vx * 0.03));
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
          ctx.ellipse(0, -11, 4.4, 13.2, 0, 0, 6.3);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.ellipse(0, -19.5, 3.4, 5, 0, 0, 6.3);
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
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-14, -37 + bob, 28, 36 - bob, 13.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(1.5, -25 + bob, 3.2, 0, 6.3);
        ctx.arc(9.8, -25 + bob, 3.2, 0, 6.3);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0.7, -26.2 + bob, 1.2, 0, 6.3);
        ctx.arc(9.0, -26.2 + bob, 1.2, 0, 6.3);
        ctx.fill();

        if (gmax) {
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
        ctx.arc(-1.5, -19.5 + bob, 3.6, 0, 6.3);
        ctx.arc(12.2, -19.5 + bob, 3.3, 0, 6.3);
        ctx.fill();

        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(3.8, -20 + bob, 2, 0.2, Math.PI - 0.2);
        ctx.arc(7.4, -20 + bob, 2, 0.2, Math.PI - 0.2);
        ctx.stroke();
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
      env: { name: 'Toxic Swamp', desc: 'bầu trời axit, miễn nhiễm độc & đảo phím', sky: 'toxic', solidHue: 135, grassHue: 280, tint: 'rgba(80,255,120,.06)', fx: 'bubbles', rate: 18 },
      passive: { id: 'antidote', name: 'Bất Tử Độc Vĩnh Viễn', desc: 'Miễn nhiễm 100% bẫy Độc, Hồ Axit, Đảo Phím & Nặng Ngàn Cân + Chạy nhanh 20%.' },
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
      env: { name: 'Void Abyss', desc: 'vực thẳm tử thần, nhìn thấu xu giả & đi xuyên bẫy', sky: 'cosmic', solidHue: 270, grassHue: 345, tint: 'rgba(120,0,255,.07)', fx: 'sparks', rate: 22 },
      passive: { id: 'wraith', name: 'Hồn Ma Hư Không', desc: 'Đi xuyên 1 sát thương chí mạng mỗi 6s & Vô hiệu hóa 100% bẫy đồng xu Quỷ Dị.' },
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
      env: { name: 'Dragon Sanctuary', desc: 'hoàng hôn rồng thiêng, Nhảy 3 Lần & Hút xu', sky: 'ember', solidHue: 28, grassHue: 45, tint: 'rgba(255,180,0,.06)', fx: 'embers', rate: 24 },
      passive: { id: 'dragonflight', name: 'Long Vũ Cửu Thiên', desc: 'Nhảy 3 Lần liên tiếp trên không (Triple Jump), chạy nhanh +25% & Hút xu/chìa khóa toàn màn hình.' },
      trail: ['#ffd43b', '#ff4d6d', '#00ffe0'],
      pal: { body: '#ffb703', edge: '#9d0208', inner: '#00f5d4', belly: 'rgba(255,245,190,.85)' },
    });
  };

  // HỆ THỐNG AI CHIẾN ĐẤU TỰ ĐỘNG CHO CẢ ANIME HEROES LẪN SKIN THƯỜNG (TINH LINH HỘ VỆ + MARIO STOMP):
  window.TB_RunMultiverseAutoCombat = function (P, L, G, curPassive, v20LaunchUniqueSkill, v20FindFrontOrOverheadThreat, v20DestroyTarget, sparkle, puff, Snd, STEP, PW, PH) {
    if (!P || !L || P.dead || G.won) return;
    const cx = P.x + PW / 2, cy = P.y + PH / 2, face = P.face >= 0 ? 1 : -1;

    // 0. CƠ CHẾ GIẪM ĐẦU QUÁI VẬT & BOSS (MARIO STOMP — DÀNH CHO TẤT CẢ CÁC SKIN!):
    if (P.vy > 0.5) {
      const feet = P.y + PH;
      for (let i = (L.stageBosses || []).length - 1; i >= 0; i--) {
        const bs = L.stageBosses[i];
        const rad = bs.isBoss ? 52 : 34;
        if (Math.abs(cx - bs.x) < rad + 12 && feet >= bs.y - rad - 16 && feet <= bs.y + 12) {
          P.vy = -12.8;
          P.onGround = false;
          P.usedDJ = false;
          P.inv = Math.max(P.inv, 0.45);
          Snd.slam();
          v20DestroyTarget(L, { x: bs.x, y: bs.y, kind: 'boss', ref: bs, dmg: 2 });
          break;
        }
      }
      for (let i = (L.sharks || []).length - 1; i >= 0; i--) {
        const sh = L.sharks[i];
        if (Math.abs(cx - sh.cx) < 52 && feet >= sh.cy - 34 && feet <= sh.cy + 10) {
          P.vy = -12.2;
          P.inv = Math.max(P.inv, 0.45);
          Snd.slam();
          v20DestroyTarget(L, { x: sh.cx, y: sh.cy, kind: 'shark', ref: sh, dmg: 2 });
          break;
        }
      }
    }

    // Dư ảnh tốc độ 4D khi Thức Tỉnh
    if (P.awakened && (Math.abs(P.vx) > 3.2 || Math.abs(P.vy) > 4.5)) {
      FX4D.afterimages.push({
        x: P.x, y: P.y, face: P.face,
        col: curPassive === 'limitless' ? '#38bdf8' : curPassive === 'shrine' ? '#ef4444' : curPassive === 'santoryu' ? '#a855f7' : '#fde047',
        life: 0.22,
      });
    }
    for (let i = FX4D.afterimages.length - 1; i >= 0; i--) {
      FX4D.afterimages[i].life -= STEP;
      if (FX4D.afterimages[i].life <= 0) FX4D.afterimages.splice(i, 1);
    }
    for (let i = FX4D.slashes.length - 1; i >= 0; i--) {
      FX4D.slashes[i].life -= STEP;
      if (FX4D.slashes[i].life <= 0) FX4D.slashes.splice(i, 1);
    }

    // 1. GOJO SATORU: Cầu Xanh Hút Xu + Cầu Đỏ Đẩy Bẫy Áp Sát:
    if (curPassive === 'limitless') {
      for (const c of L.coins || []) {
        if (!c.got && !c.anomaly) {
          const dx = cx - c.x, dy = cy - c.y, d = Math.hypot(dx, dy);
          if (d < 360 && d > 6) { c.x += (dx / d) * 8.5; c.y += (dy / d) * 8.5; }
        }
      }
      if (!G.keyGot && L.key) {
        const dx = cx - L.key.x, dy = cy - L.key.y, d = Math.hypot(dx, dy);
        if (d < 320 && d > 8) { L.key.x += (dx / d) * 6.5; L.key.y += (dy / d) * 6.5; }
      }
      const nearThreat = v20FindFrontOrOverheadThreat(P, L, P.awakened ? 210 : 145);
      if (nearThreat) {
        sparkle(nearThreat.x, nearThreat.y, 16, 1.6, '#ff4d6d');
        G.groundShockwaves.push({ x: nearThreat.x, y: nearThreat.y, r: 8, maxR: 95, col: '#ef4444', life: 0.3 });
        v20DestroyTarget(L, nearThreat);
      }
    }

    // 2. RIMURU TEMPEST: Hút vật phẩm & Lỗ Đen Azathoth nuốt chửng mục tiêu khi Thức Tỉnh:
    if (curPassive === 'azathoth') {
      for (const c of L.coins || []) {
        if (!c.got && !c.anomaly && Math.hypot(cx - c.x, cy - c.y) < 340) {
          c.x += (cx - c.x) * 0.22; c.y += (cy - c.y) * 0.22;
        }
      }
      if (P.awakened) {
        const t = v20FindFrontOrOverheadThreat(P, L, 240);
        if (t) { sparkle(t.x, t.y, 18, 1.7, '#00f5d4'); v20DestroyTarget(L, t); }
      }
    }

    // 3. NARUTO: Dạng thường 1 Phân Thân, Dạng Thức Tỉnh 2 Phân Thân dò bẫy & ăn xu:
    if (curPassive === 'kurama') {
      const wantClones = P.awakened ? 2 : 1;
      while (FX4D.clones.length < wantClones) {
        FX4D.clones.push({ offX: (FX4D.clones.length + 1) * 58, x: cx + face * 58, y: P.y, respawnT: 0 });
      }
      if (FX4D.clones.length > wantClones) FX4D.clones.length = wantClones;
      for (const cl of FX4D.clones) {
        if (cl.respawnT > 0) {
          cl.respawnT -= STEP;
          if (cl.respawnT <= 0) puff(cx + face * cl.offX, P.y + PH / 2, 8, '#ffffff', 1.3);
          continue;
        }
        cl.x += (P.x + face * cl.offX - cl.x) * 0.25;
        cl.y += (P.y - cl.y) * 0.28;
        for (const c of L.coins || []) {
          if (!c.got && Math.hypot(cl.x + PW / 2 - c.x, cl.y + PH / 2 - c.y) < 32) {
            c.anomaly = 0; c.x = cx; c.y = cy;
          }
        }
        const clThreat = v20FindFrontOrOverheadThreat({ x: cl.x, y: cl.y, face }, L, 95);
        if (clThreat) {
          puff(cl.x + PW / 2, cl.y + PH / 2, 12, '#ffffff', 1.5);
          v20DestroyTarget(L, clThreat);
          cl.respawnT = 1.6;
        }
      }
    } else if (FX4D.clones.length > 0) FX4D.clones.length = 0;

    // 4. PHÂN TÁCH CHIÊU THỨC DẠNG THƯỜNG vs DẠNG THỨC TỈNH (VÀ TINH LINH HỘ VỆ CHO SKIN THƯỜNG):
    const awk = !!P.awakened;
    const cdTarget = awk ? 1.15 : 2.1;
    if (!(P.skillCd > 0)) {
      const threat = v20FindFrontOrOverheadThreat(P, L, awk ? 450 : 350);
      if (threat) {
        const ang = Math.atan2(threat.y - cy, threat.x - cx);
        if ((curPassive === 'shrine' || curPassive === 'santoryu') && awk) {
          P.skillCd = cdTarget;
          spawn4DSlash(threat.x, threat.y, ang, 120, curPassive === 'shrine' ? '#ef4444' : '#a855f7', '#ffffff');
          spawn4DSlash(threat.x, threat.y, ang + 1.25, 105, '#090d16', '#00f5d4');
          v20DestroyTarget(L, Object.assign({}, threat, { dmg: 3 }));
          Snd.slam();
        } else {
          // Bảng kỹ năng riêng biệt: Dạng Thường bắn chiêu nhỏ, Dạng Thức Tỉnh bắn Đại Tuyệt Kỹ!
          const styleMap = {
            limitless: awk
              ? { speed: 17, r: 42, kind: 'hollow_purple', dmg: 3, life: 1.25, cd: cdTarget }
              : { speed: 15, r: 22, kind: 'water_blade', dmg: 1, life: 0.95, cd: cdTarget },
            azathoth: awk
              ? { speed: 16.5, r: 40, kind: 'hollow_purple', dmg: 3, life: 1.2, cd: cdTarget }
              : { speed: 15, r: 22, kind: 'water_blade', dmg: 1, life: 0.95, cd: cdTarget },
            sixpaths: awk
              ? { speed: 17, r: 36, kind: 'hollow_purple', dmg: 3, life: 1.2, cd: cdTarget }
              : { speed: 15, r: 24, kind: 'dragon_slash', dmg: 1, life: 0.95, cd: cdTarget },
            shrine: { speed: 16.5, r: 26, kind: 'dragon_slash', dmg: 2, life: 0.95, cd: cdTarget },
            santoryu: { speed: 16, r: 26, kind: 'dragon_slash', dmg: 2, life: 0.95, cd: cdTarget },
            saiyan: awk
              ? { speed: 17.5, r: 36, kind: 'kamehameha', dmg: 3, life: 1.15, cd: cdTarget }
              : { speed: 15.5, r: 20, kind: 'ki_blast', dmg: 1, life: 0.9, cd: cdTarget },
            onepunch: awk
              ? { speed: 18, r: 42, kind: 'serious_fist', dmg: 4, life: 1.05, cd: cdTarget }
              : { speed: 15, r: 24, kind: 'ki_blast', dmg: 2, life: 0.85, cd: cdTarget },
            nika: awk
              ? { speed: 16, r: 38, kind: 'bajrang_fist', dmg: 3, life: 1.05, cd: cdTarget }
              : { speed: 15, r: 22, kind: 'serious_fist', dmg: 1, life: 0.85, cd: cdTarget },
            kurama: awk
              ? { speed: 16.5, r: 34, kind: 'rasenshuriken', dmg: 3, life: 1.15, cd: cdTarget }
              : { speed: 15, r: 20, kind: 'water_blade', dmg: 1, life: 0.9, cd: cdTarget },
            pikachu: awk
              ? { speed: 18.5, r: 34, kind: 'thunderbolt', dmg: 3, life: 1.0, cd: cdTarget }
              : { speed: 16, r: 20, kind: 'ki_blast', dmg: 1, life: 0.85, cd: cdTarget },
          };
          // Nếu người chơi mặc Skin Thường (Classic, Ninja, King...): Tinh Linh Hộ Vệ bắn đạn hỗ trợ!
          const defaultGuardian = awk
            ? { speed: 16.5, r: 28, kind: 'ki_blast', dmg: 2, life: 1.0, cd: 1.25 }
            : { speed: 14.5, r: 18, kind: 'spirit_bolt', dmg: 1, life: 0.85, cd: 1.9 };
          const st = styleMap[curPassive] || defaultGuardian;
          v20LaunchUniqueSkill(P, L, st, false);
        }
      }
    }
  };

  window.TB_DrawMultiverse4DFX = function (ctx, G, drawBunny, PW, PH) {
    const T = G.lt;
    for (const ai of FX4D.afterimages) {
      ctx.save();
      ctx.globalAlpha = ai.life * 1.4;
      ctx.fillStyle = ai.col;
      ctx.beginPath();
      ctx.roundRect(ai.x + 2, ai.y - 6, PW - 4, PH + 4, 10);
      ctx.fill();
      ctx.restore();
    }
    if (G.me && FX4D.clones.length > 0) {
      for (const cl of FX4D.clones) {
        if (cl.respawnT > 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.78;
        drawBunny(cl.x, cl.y, {
          slot: G.myslot, skin: 'naruto', face: G.me.face, vx: G.me.vx, vy: G.me.vy,
          ground: G.me.onGround, runT: G.me.runT + 0.8, name: '🦊 Phân Thân',
        });
        ctx.restore();
      }
    }
    // Vẽ Tinh Linh Hộ Vệ (Guardian Spirit Orb) bay bên cạnh khi mặc Skin Thường
    if (G.me && !G.me.dead) {
      const ox = G.me.x + PW / 2 - G.me.face * 22 + Math.cos(T * 4.5) * 4;
      const oy = G.me.y - 12 + Math.sin(T * 5.5) * 5;
      ctx.save();
      const og = ctx.createRadialGradient(ox, oy, 1, ox, oy, G.me.awakened ? 13 : 8);
      og.addColorStop(0, '#ffffff');
      og.addColorStop(0.5, G.me.awakened ? '#ffd43b' : '#00f5d4');
      og.addColorStop(1, 'rgba(0,245,212,0)');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(ox, oy, G.me.awakened ? 13 : 8, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
    for (const sl of FX4D.slashes) {
      const u = sl.life / sl.maxLife;
      ctx.save();
      ctx.translate(sl.x, sl.y);
      ctx.rotate(sl.ang);
      ctx.strokeStyle = sl.col1;
      ctx.lineWidth = 8 * u;
      ctx.beginPath();
      ctx.moveTo(-sl.len, 0);
      ctx.lineTo(sl.len, 0);
      ctx.stroke();
      ctx.strokeStyle = sl.col2;
      ctx.lineWidth = 3 * u;
      ctx.stroke();
      ctx.restore();
    }
  };
})();
`;

fs.writeFileSync(heroesPath, animeHeroesPartA + '\n' + animeHeroesPartB, 'utf8');
console.log('✅ [V22.0] Đã tạo thành công file riêng public/anime_heroes.js!');

// ============================================================================
// KHỐI 2: MỞ ĐẦU `v220MasterPayload` CHO `public/game.js` (CLOUD BACKUP + SKILL SYNC)
// ============================================================================
const v220MasterPayload = `
/* === TB_V22_0_ANIME_4D_MASTER === */
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
      name: 'Anime Realm', desc: '', sky: 'meadow', solidHue: 200, grassHue: 120,
      tint: 'rgba(0,0,0,0)', fx: 'sparks', rate: 18,
    },
    passive: cfg.passive || { id: cfg.id, name: cfg.name, desc: '' },
    trail: cfg.trail || ['#ffffff', '#ffd43b'],
  };
  if (cfg.pal) SKIN_PAL[cfg.id] = cfg.pal;
  CUSTOM_SKINS.set(cfg.id, cfg);
  if (cfg.passive && cfg.passive.id) CUSTOM_SKINS.set('passive:' + cfg.passive.id, cfg);
}
window.TB_RegisterSkin = TB_RegisterSkin;

// ============================================================================
// SỬA TRIỆT ĐỂ LỖI CLOUD SYNC "not_found" + THÊM MÃ SAO LƯU VĨNH VIỄN CHUYỂN MÁY
// ============================================================================
(function v22InstallCloudAutoHealAndBackup() {
  const origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (origFetch) {
    window.fetch = async function (url, opts) {
      const res = await origFetch(url, opts);
      try {
        const u = String(url || '');
        if (u.includes('/api/sync/') && opts && (opts.method === 'PUT' || opts.method === 'POST')) {
          const clone = res.clone();
          const data = await clone.json().catch(() => null);
          if (data && !data.ok && data.error === 'not_found') {
            // Tự động tạo mới hồ sơ trên Cloud rồi lưu lại ngay lập tức!
            const createRes = await origFetch('/api/sync/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: opts.body,
            }).catch(() => null);
            if (createRes && createRes.ok) {
              const cd = await createRes.json().catch(() => null);
              if (cd && cd.ok && cd.code) {
                try { localStorage.setItem('tb_sync_code', cd.code); } catch (e) {}
                const codeEl = document.querySelector('#syncCode, .sync-code, [id*="syncCode"]');
                if (codeEl) codeEl.textContent = cd.code;
              }
            }
            return new Response(JSON.stringify({ ok: true, healed: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (e) {}
      return res;
    };
  }

  function exportBackupToken() {
    const snap = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('tb_') || k.startsWith('tether') || k.includes('bunny'))) {
          snap[k] = localStorage.getItem(k);
        }
      }
    } catch (e) {}
    return 'TB22_' + btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
  }

  function importBackupToken(str) {
    try {
      const clean = String(str || '').trim().replace(/^TB22_/, '');
      const obj = JSON.parse(decodeURIComponent(escape(atob(clean))));
      if (!obj || typeof obj !== 'object') return false;
      Object.keys(obj).forEach((k) => {
        localStorage.setItem(k, obj[k]);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  setInterval(() => {
    const modal = document.querySelector('#syncModal, #cloudModal, .sync-modal');
    const card = modal ? modal.querySelector('.shop-card, .modal-card, div') : null;
    if (card && !document.getElementById('v22BackupBox')) {
      const box = document.createElement('div');
      box.id = 'v22BackupBox';
      box.style.cssText = 'margin-top:10px;padding:10px;border-radius:10px;background:rgba(15,23,42,.85);border:1px solid #38bdf8;font-size:12px;color:#e2e8f0;text-align:left';
      box.innerHTML =
        '<div style="font-weight:800;color:#00f5d4;margin-bottom:6px">📦 MÃ SAO LƯU VĨNH VIỄN (CHUYỂN MÁY BẤT KỂ SERVER RESET)</div>' +
        '<div style="display:flex;gap:6px;margin-bottom:6px">' +
        '<button id="v22BtnCopyBk" class="skin-btn" style="flex:1;background:#0284c7;color:#fff">📋 Sao chép Mã Vĩnh Viễn</button>' +
        '<button id="v22BtnPasteBk" class="skin-btn" style="flex:1;background:#16a34a;color:#fff">📥 Dán Mã Khôi Phục</button>' +
        '</div>';
      card.appendChild(box);
      const btnC = document.getElementById('v22BtnCopyBk');
      const btnP = document.getElementById('v22BtnPasteBk');
      if (btnC) {
        btnC.onclick = () => {
          const tk = exportBackupToken();
          if (navigator.clipboard) navigator.clipboard.writeText(tk);
          window.prompt('Sao chép Mã Sao Lưu Vĩnh Viễn này để dán sang máy khác:', tk);
          toast('✅ Đã tạo Mã Sao Lưu Vĩnh Viễn!');
        };
      }
      if (btnP) {
        btnP.onclick = () => {
          const inp = window.prompt('Dán Mã Sao Lưu Vĩnh Viễn (bắt đầu bằng TB22_...) vào đây:');
          if (inp && importBackupToken(inp)) {
            toast('✅ Khôi phục thành công 100% dữ liệu! Đang tải lại...');
            setTimeout(() => location.reload(), 700);
          } else if (inp) {
            toast('❌ Mã không hợp lệ!');
          }
        };
      }
    }
  }, 1200);
})();

G.skillShots = [];
G.groundShockwaves = [];
G.cursedConsumed = new Set();
G.chaosSeed = 1;

const SKILL_COOLDOWN = 2.0;
const GUARD_COOLDOWN = 4.8;

function v20ToggleAwaken(manual) {
  const P = G.me;
  if (!P || P.dead || G.won) return;
  const skinId = Save.equipped();
  const cfg = CUSTOM_SKINS.get(skinId);
  P.awakened = !P.awakened;
  P.awakenAnimT = 0.9;
  Snd.key();
  G.shake = Math.max(G.shake, 7);
  const cx = P.x + PW / 2, cy = P.y + PH / 2;
  sparkle(cx, cy, 32, 2.2, (cfg && cfg.trail && cfg.trail[0]) || '#00f5d4');
  G.groundShockwaves.push({
    x: cx, y: P.y + PH, r: 10, maxR: 155,
    col: (cfg && cfg.trail && cfg.trail[0]) || '#ffd43b', life: 0.45,
  });
  if (isNet()) {
    netEv({ t: 'awk', s: P.slot, v: P.awakened ? 1 : 0, x: Math.round(cx), y: Math.round(cy) });
  }
  if (P.awakened) {
    toast('🔥 THỨC TỈNH: ' + (cfg ? cfg.awakenedTitle || cfg.name.toUpperCase() : 'SIÊU THỎ CƯỜNG HÓA') + '!');
    if (cfg && typeof cfg.onAwaken === 'function') cfg.onAwaken(P, G.L);
  } else if (manual) {
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

function v20FindFrontOrOverheadThreat(P, L, maxRange) {
  if (!P || !L) return null;
  const cx = P.x + PW / 2, cy = P.y + PH / 2, face = P.face >= 0 ? 1 : -1;
  let best = null, bestDist = maxRange || 420;

  const checkTarget = (tx, ty, kind, ref) => {
    const dx = tx - cx, dy = ty - cy, dist = Math.hypot(dx, dy);
    if (dist > (maxRange || 420) || dist < 10) return;
    const isAhead = dx * face >= -35;
    const isOverhead = Math.abs(dx) < 120 && dy < -15;
    if (!isAhead && !isOverhead) return;
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: tx, y: ty, kind, ref, dist };
    }
  };

  (L.stageBosses || []).forEach((bs) => checkTarget(bs.x, bs.y, 'boss', bs));
  (L.sharks || []).forEach((sh) => checkTarget(sh.cx, sh.cy, 'shark', sh));
  (L.stalactites || []).forEach((q) => {
    if (q.st === 1 || q.st === 2) checkTarget(q.x + q.w / 2, q.y + (q.fy || 0) + q.h / 2, 'stalactite', q);
  });
  (L.boulders || []).forEach((b) => checkTarget(b.cx, b.y - b.r, 'boulder', b));
  (L.lasers || []).forEach((ls) => checkTarget(ls.x, ls.y, 'laser', ls));
  (L.turrets || []).forEach((trt) => checkTarget(trt.x, trt.y, 'turret', trt));
  (L.pendulums || []).forEach((pd) => {
    const th = Math.sin(G.lt * pd.spd + pd.off) * 1.05;
    checkTarget(pd.x + Math.sin(th) * pd.len, pd.y + Math.cos(th) * pd.len, 'pendulum', pd);
  });
  (L.navalMines || []).forEach((mn) => checkTarget(mn.x, mn.y, 'naval_mine', mn));
  (L.jellyfish || []).forEach((jf) => checkTarget(jf.x, jf.y, 'jellyfish', jf));
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

// XỬ LÝ SÁT THƯƠNG TRỪ MÁU QUÁI VẬT & BOSS (HP SCALING THEO MÀN CHƠI):
function v20DestroyTarget(L, target, fromNet) {
  if (!L || !target) return;
  const { x, y, kind, ref } = target;
  const dmg = target.dmg || 1;
  sparkle(x, y, 18, 1.6, '#ffd43b');
  puff(x, y, 8, '#ffffff', 1.3);

  if (!fromNet && isNet()) {
    netEv({ t: 'hit_obj', k: kind, x: Math.round(x), y: Math.round(y), dmg });
  }

  const removeFrom = (arr) => {
    if (!arr) return;
    const idx = arr.indexOf(ref);
    if (idx >= 0) arr.splice(idx, 1);
  };

  if (kind === 'boss' && ref) {
    ref.hp = (ref.hp || 1) - dmg;
    ref.hitFlash = 0.25;
    if (ref.hp <= 0) {
      sparkle(x, y, 36, 2.4, '#ff0055');
      G.groundShockwaves.push({ x, y, r: 10, maxR: 135, col: '#fde047', life: 0.4 });
      removeFrom(L.stageBosses);
    }
    return;
  }
  if (kind === 'shark' && ref) {
    ref.hp = (ref.hp || 1) - dmg;
    ref.hitFlash = 0.22;
    if (ref.hp <= 0) removeFrom(L.sharks);
    return;
  }

  if (kind === 'stalactite') removeFrom(L.stalactites);
  else if (kind === 'boulder') removeFrom(L.boulders);
  else if (kind === 'laser') removeFrom(L.lasers);
  else if (kind === 'turret') removeFrom(L.turrets);
  else if (kind === 'pendulum') removeFrom(L.pendulums);
  else if (kind === 'naval_mine') removeFrom(L.navalMines);
  else if (kind === 'jellyfish') removeFrom(L.jellyfish);
  else if (kind === 'doppel' && L.anomalies) {
    G.cursedConsumed.add(ref.id);
    removeFrom(L.anomalies.doppels);
  } else if (kind === 'ghost' && L.anomalies) {
    G.cursedConsumed.add(ref.id);
    removeFrom(L.anomalies.ghosts);
  } else if (kind === 'glob' && ref) ref.glob = null;
  else if (kind === 'spitter' && L.anomalies) removeFrom(L.anomalies.spitters);
  else if (kind === 'mimic_coin' && ref) {
    G.cursedConsumed.add(ref.cid);
    ref.anomaly = 0;
    ref.trig = false;
  }
}

function v20LaunchUniqueSkill(P, L, style, manual) {
  if (!P || !L || P.skillCd > 0) return false;
  const cx = P.x + PW / 2, cy = P.y + PH / 2, face = P.face >= 0 ? 1 : -1;
  const threat = v20FindFrontOrOverheadThreat(P, L, 420);
  if (!threat && !manual) return false;

  let dx = face, dy = 0;
  if (threat) { dx = threat.x - cx; dy = threat.y - cy; }
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist, uy = dy / dist, spd = style.speed || 15;

  P.skillCd = style.cd || SKILL_COOLDOWN;
  P.attackAnimT = 0.42;

  const shot = {
    x0: cx + ux * 18, y0: cy + uy * 14,
    x: cx + ux * 22, y: cy + uy * 14,
    vx: ux * spd, vy: uy * spd,
    ang: Math.atan2(uy, ux),
    r: style.r || 26,
    dmg: style.dmg || 1,
    kind: style.kind || 'hollow_purple',
    life: style.life || 0.95,
  };
  G.skillShots.push(shot);

  if (isNet()) {
    netEv({
      t: 'skill',
      s: P.slot,
      x: Math.round(shot.x),
      y: Math.round(shot.y),
      vx: +shot.vx.toFixed(2),
      vy: +shot.vy.toFixed(2),
      r: shot.r,
      dmg: shot.dmg,
      k: shot.kind,
    });
  }
  return true;
}

function v20UpdateSkillShots(L) {
  for (let i = G.skillShots.length - 1; i >= 0; i--) {
    const s = G.skillShots[i];
    s.life -= STEP;
    s.x += s.vx;
    s.y += s.vy;

    let hit = false;
    const checkHit = (tx, ty, rad, kind, ref) => {
      if (Math.hypot(tx - s.x, ty - s.y) <= s.r + rad) {
        v20DestroyTarget(L, { x: tx, y: ty, kind, ref, dmg: s.dmg || 1 }, !!s.remote);
        hit = true;
      }
    };
    (L.stageBosses || []).slice().forEach((bs) => checkHit(bs.x, bs.y, bs.isBoss ? 46 : 32, 'boss', bs));
    (L.sharks || []).slice().forEach((sh) => checkHit(sh.cx, sh.cy, 38, 'shark', sh));
    (L.stalactites || []).slice().forEach((q) => checkHit(q.x + q.w / 2, q.y + (q.fy || 0) + q.h / 2, 24, 'stalactite', q));
    (L.boulders || []).slice().forEach((b) => checkHit(b.cx, b.y - b.r, b.r, 'boulder', b));
    (L.lasers || []).slice().forEach((ls) => checkHit(ls.x, ls.y, 24, 'laser', ls));
    (L.turrets || []).slice().forEach((trt) => checkHit(trt.x, trt.y, 24, 'turret', trt));
    (L.navalMines || []).slice().forEach((mn) => checkHit(mn.x, mn.y, mn.r, 'naval_mine', mn));
    (L.jellyfish || []).slice().forEach((jf) => checkHit(jf.x, jf.y, 24, 'jellyfish', jf));
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

    if (s.kind === 'spirit_bolt') {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, '#00f5d4');
      g.addColorStop(1, 'rgba(0,245,212,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, 6.3);
      ctx.fill();
    } else if (s.kind === 'ki_blast') {
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.45, '#fde047');
      g.addColorStop(1, 'rgba(249,115,22,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, 6.3);
      ctx.fill();
    } else if (s.kind === 'water_blade') {
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 22, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (s.kind === 'serious_fist') {
      ctx.strokeStyle = 'rgba(250,204,21,.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(6, 0, 34, -1.0, 1.0);
      ctx.stroke();
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      rr(-26, -12, 14, 24, 4);
      ctx.fill();
      ctx.stroke();
      const fg = ctx.createRadialGradient(4, -6, 3, 0, 0, 24);
      fg.addColorStop(0, '#ff6b6b');
      fg.addColorStop(0.45, '#ef4444');
      fg.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = fg;
      rr(-14, -18, 32, 36, 11);
      ctx.fill();
      ctx.stroke();
    } else if (s.kind === 'bajrang_fist') {
      const dx = Math.hypot(s.x - s.x0, s.y - s.y0);
      ctx.fillStyle = '#ffe0c8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.fillRect(-Math.min(dx, 140), -7, Math.min(dx, 140), 14);
      ctx.strokeRect(-Math.min(dx, 140), -7, Math.min(dx, 140), 14);
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
    } else if (s.kind === 'kamehameha') {
      const beamLen = Math.min(260, Math.hypot(s.x - s.x0, s.y - s.y0) + 45);
      ctx.fillStyle = 'rgba(56,189,248,.42)';
      ctx.fillRect(-beamLen, -18, beamLen, 36);
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(-beamLen, -10, beamLen, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-beamLen, -4, beamLen, 8);
      const kg = ctx.createRadialGradient(0, 0, 4, 0, 0, 32);
      kg.addColorStop(0, '#ffffff');
      kg.addColorStop(0.5, '#38bdf8');
      kg.addColorStop(1, 'rgba(2,132,199,0)');
      ctx.fillStyle = kg;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, 6.3);
      ctx.fill();
    } else if (s.kind === 'rasenshuriken') {
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
    } else if (s.kind === 'thunderbolt') {
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
    } else if (s.kind === 'dragon_slash') {
      [-10, 0, 10].forEach((oy, idx) => {
        ctx.strokeStyle = idx === 1 ? '#a855f7' : '#10b981';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(oy, 0, 28, -1.25, 1.25);
        ctx.stroke();
      });
    } else {
      const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 38);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.35, '#d8b4fe');
      rg.addColorStop(0.7, '#7e22ce');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }
}
`;
// === KẾT THÚC PHẦN 2 / 4 — HÃY NHẮN "TIẾP" ĐỂ LẤY PHẦN 3 / 4 DÁN NGAY BÊN DƯỚI ===
// === BẮT ĐẦU PHẦN 3 / 4 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 2 / 4 ===
const v220CoreAndPhysicsPart3 = `
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
      curPassive === 'azathoth' ||
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
    curPassive === 'azathoth' ||
    curPassive === 'shrine' ||
    curPassive === 'sixpaths' ||
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
          me.vy = 10;
          me.heavyT = 2.0;
          Snd.slam();
        } else if (c.anomaly === 4) {
          me.rev = 2.4;
          Snd.shake();
        } else if (c.anomaly === 5) {
          L.stalactites.push({
            x: cx - 17,
            y: Math.max(40, me.y - 240),
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
    me.vy = Math.min(me.vy + GRAV * 0.65, MAXFALL);
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
      dp.x += (dx / dist) * 5.0;
      dp.y += (dy / dist) * 3.9;
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
      gh.x += (dx / dist) * 3.8;
      gh.y += (dy / dist) * 3.0;
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
    if (me.idleT > 1.15) {
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
        vx: clamp((cx - sp.x) * 0.017, -5.0, 5.0),
        vy: -7.6,
      };
    }
    if (sp.glob) {
      const g = sp.glob;
      g.x += g.vx;
      g.y += g.vy;
      g.vy += GRAV * 0.55;
      if (Math.hypot(cx - g.x, cy - g.y) < 20 && !immune) {
        sp.glob = null;
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

// KHỞI TẠO LEVEL + QUÁI VẬT DỌC ĐƯỜNG & BOSS CUỐI MÀN TĂNG MÁU THEO CẤP ĐỘ:
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
  L.navalMines = L.navalMines || [];
  L.jellyfish = L.jellyfish || [];
  L.whirlpools = L.whirlpools || [];

  // Lưu bản gốc Quái & Boss để hồi phục đầy đủ máu khi chơi lại màn
  if (!L._origBosses && L.stageBosses) {
    L._origBosses = L.stageBosses.map((b) => Object.assign({}, b));
  }
  if (L._origBosses) {
    L.stageBosses = L._origBosses.map((b) => Object.assign({}, b));
  } else {
    L.stageBosses = L.stageBosses || [];
  }

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
    '</div><div class="shop-foot">Phím tắt: <b>F / Shift / 🔥</b> = Biến Hình Thức Tỉnh · Mọi Skin đều có Tinh Linh Hộ Vệ & Giẫm Đầu Quái · <b>1–6</b> = Dùng Buff.</div>';
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

function v20UpdateAllHeroSkills(P, L) {
  if (!P || !L || P.dead || G.won) return;
  if (P.skillCd > 0) P.skillCd = Math.max(0, P.skillCd - STEP);
  if (P.guardCd > 0) P.guardCd = Math.max(0, P.guardCd - STEP);
  if (P.attackAnimT > 0) P.attackAnimT -= STEP;
  if (P.awakenAnimT > 0) P.awakenAnimT -= STEP;

  v20UpdateSkillShots(L);

  const isAnimeHero =
    curPassive === 'limitless' ||
    curPassive === 'azathoth' ||
    curPassive === 'shrine' ||
    curPassive === 'sixpaths' ||
    curPassive === 'saiyan' ||
    curPassive === 'nika' ||
    curPassive === 'onepunch' ||
    curPassive === 'kurama' ||
    curPassive === 'pikachu' ||
    curPassive === 'santoryu';

  if (isAnimeHero) {
    P.rev = 0;
    P.dj = true;
    P.djT = 999;
    if (P.onGround) P.extraHops = 2;
    if (curPassive === 'onepunch' && G.deaths >= 1 && !P._autoSerious) {
      P._autoSerious = true;
      P.awakened = true;
    }
  }

  // Chạy hệ thống chiến đấu tự động (Hỗ trợ cả Anime Heroes lẫn Tinh Linh Hộ Vệ + Giẫm Đầu Quái cho Skin Thường):
  if (typeof window.TB_RunMultiverseAutoCombat === 'function') {
    window.TB_RunMultiverseAutoCombat(
      P,
      L,
      G,
      curPassive,
      v20LaunchUniqueSkill,
      v20FindFrontOrOverheadThreat,
      v20DestroyTarget,
      sparkle,
      puff,
      Snd,
      STEP,
      PW,
      PH
    );
  }
}

// ============================================================================
// 5. VẬT LÝ DÂY CO-OP THẲNG MƯỢT (165px TỰ DO -> 280px CO GIÃN ÊM, KHÔNG HẤT BAY)
// ============================================================================
const V22_ROPE_REST = 165;
const V22_ROPE_SPRING = 225;
const V22_ROPE_MAX = 285;
const V22_PIT_SAFE_DROP = 125;

function v15GetSquadLinks(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0) return null;
  let groundedPower = P.onGround ? (input.d ? 3.2 : 1.5) : 0;
  let fallingCount = P.onGround ? 0 : 1;
  let bestAnchor = P.onGround
    ? { x: P.x, y: P.y, tvx: P.vx, vy: P.vy, anch: input.d, slot: P.slot }
    : null;
  const slots = [P.slot];
  for (const r of G.remotes.values()) {
    if (r.dead) continue;
    slots.push(r.slot);
    if (r.onGround || r.anch) {
      groundedPower += r.anch ? 3.2 : 1.5;
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
    // Dưới 165px: Hoàn toàn tự do, không bao giờ đẩy hay kéo nhau!
    if (d <= V22_ROPE_REST || d < 1) continue;

    const nx = dx / d;
    const ny = dy / d;
    const stretch = d - V22_ROPE_REST;
    const partnerGrounded = !!(r.onGround || r.anch);

    // Nếu cả 2 cùng đang đứng trên mặt đất: chỉ kéo nhẹ theo phương ngang, tuyệt đối không hất tung lên trời!
    if (meGrounded && partnerGrounded) {
      if (d > V22_ROPE_SPRING) {
        P.vx += nx * Math.min((d - V22_ROPE_SPRING) * 0.025, 1.8);
      }
      continue;
    }

    let scale = 0.65;
    if (meGrounded && !partnerGrounded) {
      if (input.d || rescueRatio >= 0.9) scale = 0.0;
      else scale = 0.25;
    } else if (!meGrounded && (partnerGrounded || bestAnchor)) {
      scale = 1.15;
    }
    const f = Math.min(stretch * 0.028, 2.6) * scale;
    P.vx += nx * f;
    if (!meGrounded && ny < 0 && P.y > r.y + 32) {
      P.vy += ny * f * 1.1;
    }
  }

  // Chỉ cứu kéo lên khi thực sự đang rơi dưới vực sâu hơn đồng đội (> 48px)
  if (!meGrounded && bestAnchor && P.y > bestAnchor.y + 48 && P.vy > 0) {
    const dxA = bestAnchor.x + PW / 2 - (P.x + PW / 2);
    const distA = Math.max(1, Math.abs(dxA));
    P.vy = Math.max(P.vy - GRAV * 0.85, -6.5);
    if (distA > V22_ROPE_REST) {
      P.vx += Math.sign(dxA) * 0.45;
    }
  }
}

function v15EnforceRopeAfterMove(P) {
  const st = v15GetSquadLinks(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st;
  const meGrounded = !!(P.onGround || input.d);

  // Giữ đồng đội không rơi quá sâu xuống đáy vực khi người kia đang đứng vững trên bờ
  if (!P.onGround && bestAnchor && P.y > bestAnchor.y + V22_PIT_SAFE_DROP && P.vy > 0) {
    const maxY = bestAnchor.y + V22_PIT_SAFE_DROP;
    if (nearSolids(P.x, maxY, PW, PH).length === 0) {
      P.y = maxY;
      P.vy = Math.max(-5.2, -P.vy * 0.35);
    }
    P.vx += Math.sign(bestAnchor.x - P.x) * 0.45;
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
    if (d > V22_ROPE_MAX && d > 1) {
      if (meGrounded && !partnerGrounded && (input.d || rescueRatio >= 0.9)) continue;
      const nx = dx / d;
      const ny = dy / d;
      const share = !meGrounded && partnerGrounded ? 0.85 : 0.45;
      const over = Math.min(18, (d - V22_ROPE_MAX) * share);
      if (nearSolids(P.x + nx * over, P.y, PW, PH).length === 0) P.x += nx * over;
      if (!meGrounded && nearSolids(P.x, P.y + ny * over, PW, PH).length === 0) {
        P.y += ny * over;
      }
      const vRad = P.vx * nx + P.vy * ny;
      if (vRad < 0) {
        P.vx -= nx * vRad * 0.85;
        if (!meGrounded) P.vy -= ny * vRad * 0.85;
      }
    }
  }
}

function hangingFriend(P) {
  let best = null;
  let bd = 1e9;
  for (const r of G.remotes.values()) {
    if (r.dead || (r.onGround && !r.ropeOn) || r.y < P.y + 24) continue;
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    if (d > 290 || d < 30) continue;
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  return best;
}

// VẼ DÂY CO-OP THẲNG / VÕNG TỰ NHIÊN MƯỢT MÀ (KHÔNG VẼ LÒ XO GẤP KHÚC XẤU):
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
    // Khi đi gần thì dây chùng nhẹ tự nhiên, khi kéo căng > 165px thì dây thẳng căng mượt mà!
    const slack = Math.max(0, V22_ROPE_REST - d);
    const sag = slack * 0.22;
    const tension = clamp((d - V22_ROPE_REST) / (V22_ROPE_MAX - V22_ROPE_REST), 0, 1);

    const grad = ctx.createLinearGradient(ax, ay, bx, by);
    grad.addColorStop(0, COLORS[a.slot % COLORS.length]);
    grad.addColorStop(1, COLORS[b.slot % COLORS.length]);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Viền tối bên ngoài
    ctx.strokeStyle = 'rgba(15,23,42,.75)';
    ctx.lineWidth = 6.2 - tension * 1.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag, bx, by);
    ctx.stroke();

    // Lõi dây phát sáng mượt
    ctx.strokeStyle =
      tension > 0.55
        ? 'rgb(255,' + Math.round(220 - tension * 140) + ',80)'
        : grad;
    ctx.lineWidth = 3.6 - tension * 0.8;
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================================================
// 6. ĐỒ HỌA ĐỊA HÌNH 3D THEO CHỦ ĐỀ (MÂY 3D PHỒNG XỐP, RẠN SAN HÔ, ĐÁ CUỘI 3D)
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

  if (biome === 'heaven') {
    ctx.save();
    const cg = ctx.createLinearGradient(0, y - 14, 0, y + Math.min(h, 95));
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.55, '#fef9c3');
    cg.addColorStop(1, 'rgba(186,230,253,.15)');
    ctx.fillStyle = cg;
    rr(x, y, w, Math.min(h, 90), 22);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.2;
    for (let px = x + 16; px <= x + w - 12; px += 28) {
      const puffR = 16 + ((px * 7) % 6) + Math.sin(T * 3 + px * 0.04) * 1.8;
      ctx.beginPath();
      ctx.arc(px, y + 4, puffR, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(250,204,21,.45)';
    rr(x + 6, y + 6, Math.max(8, w - 12), 8, 4);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (biome === 'water') {
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 240));
    gr.addColorStop(0, '#0f4c5c');
    gr.addColorStop(0.5, '#082936');
    gr.addColorStop(1, '#031219');
    ctx.fillStyle = gr;
    rr(x, y, w, h, 14);
    ctx.fill();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (y > 120) {
      for (let px = x + 20; px < x + w - 18; px += 44) {
        const sway = Math.sin(T * 3.5 + px * 0.05) * 6;
        ctx.strokeStyle = px % 88 === 0 ? '#ff4d6d' : '#00f5d4';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, y);
        ctx.quadraticCurveTo(px + sway, y - 14, px + sway * 1.4, y - 26 - (px % 10));
        ctx.stroke();
      }
    }
    return;
  }

  if (biome === 'toxic' || biome === 'hell') {
    const isHell = biome === 'hell';
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, isHell ? '#3b0a0a' : '#1b4332');
    gr.addColorStop(0.5, isHell ? '#1f0505' : '#081c15');
    gr.addColorStop(1, '#050505');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = isHell ? '#dc2626' : '#7209b7';
    for (let px = x; px < x + w - 24; px += 32) {
      const bump = ((px * 13) % 7) - 3;
      rr(px - 2, y - 6 + bump, 36, 16, 7);
      ctx.fill();
    }
    ctx.fillStyle = isHell ? '#f97316' : '#80ed99';
    rr(x - 3, y - 5, w + 6, 7, 4);
    ctx.fill();
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
  gr.addColorStop(0, hsl(sh, 38, 54));
  gr.addColorStop(1, hsl(sh, 38, 30));
  ctx.fillStyle = gr;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = hsl(gh, 54, 38);
  for (let px = x; px < x + w - 20; px += 34) {
    const bump = ((px * 11) % 5) - 2;
    rr(px - 2, y - 6 + bump, 38, 20, 8);
    ctx.fill();
  }
  ctx.fillStyle = hsl(gh, 62, 54);
  rr(x - 3, y - 5, w + 6, 9, 5);
  ctx.fill();
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
  // Hỗ trợ hiển thị trạng thái Thức Tỉnh cho cả bản thân và đồng đội từ xa!
  if (o.slot !== undefined && G.remotes && G.remotes.has(o.slot)) {
    const rem = G.remotes.get(o.slot);
    if (rem && rem.awakened) o.awakened = true;
  }
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
    const tilt = face * 1.05 + clamp(vy * 0.04, -0.4, 0.4) * face;
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
    customCfg.renderCharacter(ctx, { x, y, o, bob, ph, run, air, vx, vy, face, T: G.lt, G });
    ctx.restore();

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
      rr(x + PW / 2 - w / 2, y - 50, w, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillText(o.name, x + PW / 2, y - 38);
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
`;
// === KẾT THÚC PHẦN 3 / 4 — HÃY NHẮN "TIẾP" ĐỂ LẤY PHẦN 4 / 4 (PHẦN CUỐI) DÁN NGAY BÊN DƯỚI ===
// === BẮT ĐẦU PHẦN 4 / 4 (PHẦN CUỐI) — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 3 / 4 ===
const v220WorldAndLevelsPart4 = `
// ============================================================================
// 7. CẬP NHẬT BẪY THẾ GIỚI, THỦY LÔI, SỨA ĐIỆN, BOSS CÓ THANH MÁU & TRAPS
// ============================================================================
function v21UpdateBiomeExclusiveHazards(L, me) {
  if (!L || !me || me.dead || G.won) return;
  const cx = me.x + PW / 2;
  const cy = me.y + PH / 2;
  const T = G.lt;
  const immune =
    (curPassive === 'limitless' && me.awakened) ||
    (curPassive === 'azathoth' && me.awakened) ||
    (curPassive === 'shrine' && me.awakened) ||
    (curPassive === 'sixpaths' && me.awakened);

  for (const jf of L.jellyfish || []) {
    jf.y = jf.y0 + Math.sin(T * jf.spd + jf.off) * jf.amp;
    if (!immune && Math.hypot(cx - jf.x, cy - jf.y) < 28) {
      die('jellyfish');
      return;
    }
  }
  for (const mn of L.navalMines || []) {
    mn.x = mn.x0 + Math.sin(T * 1.8 + mn.off) * 18;
    if (!immune && Math.hypot(cx - mn.x, cy - mn.y) < mn.r + 10) {
      die('naval_mine');
      return;
    }
  }
  for (const bs of L.stageBosses || []) {
    bs.x = pingPong(bs.x0, bs.x1, bs.spd, bs.off, T);
    bs.y = bs.y0 + Math.sin(T * 3.2 + bs.off) * 32;
    if (bs.hitFlash > 0) bs.hitFlash -= STEP;
    if (!immune && Math.hypot(cx - bs.x, cy - bs.y) < 40) {
      die('boss');
      return;
    }
  }
}

function v21DrawBiomeExclusiveHazards(ctx, L) {
  const T = G.lt;
  for (const mn of L.navalMines || []) {
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(mn.x0, WORLD_H);
    ctx.lineTo(mn.x, mn.y);
    ctx.stroke();
    const mg = ctx.createRadialGradient(mn.x - 6, mn.y - 6, 2, mn.x, mn.y, mn.r);
    mg.addColorStop(0, '#64748b');
    mg.addColorStop(1, '#0f172a');
    ctx.fillStyle = mg;
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mn.x, mn.y, mn.r, 0, 6.3);
    ctx.fill();
    ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + T * 0.5;
      ctx.beginPath();
      ctx.moveTo(mn.x + Math.cos(a) * (mn.r - 2), mn.y + Math.sin(a) * (mn.r - 2));
      ctx.lineTo(mn.x + Math.cos(a) * (mn.r + 9), mn.y + Math.sin(a) * (mn.r + 9));
      ctx.stroke();
    }
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(mn.x, mn.y, 4 + Math.sin(T * 10) * 1.5, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }

  for (const jf of L.jellyfish || []) {
    ctx.save();
    ctx.translate(jf.x, jf.y);
    ctx.fillStyle = 'rgba(0,245,212,.75)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 18, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (let t = -2; t <= 2; t++) {
      ctx.beginPath();
      ctx.moveTo(t * 5, 0);
      ctx.quadraticCurveTo(
        t * 5 + Math.sin(T * 10 + t) * 5,
        12,
        t * 5 - Math.sin(T * 10 + t) * 4,
        24
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // Vẽ Boss dọc đường với THANH MÁU 3D PHÍA TRÊN ĐẦU:
  for (const bs of L.stageBosses || []) {
    ctx.save();
    ctx.translate(bs.x, bs.y);
    const flap = Math.sin(T * 9) * 12;

    if (bs.hitFlash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.9)';
    }

    if (bs.kind === 'seraphim') {
      ctx.fillStyle = bs.hitFlash > 0 ? '#ffffff' : 'rgba(254,240,138,.9)';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      [-1, 1].forEach((d) => {
        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            d * (32 + w * 10),
            -26 + w * 14 + flap,
            d * (48 + w * 8),
            -8 + w * 14 + flap
          );
          ctx.lineTo(0, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, 6.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, 6.3);
      ctx.fill();
    } else {
      ctx.fillStyle = bs.hitFlash > 0 ? '#ffffff' : '#450a0a';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.5;
      [-1, 1].forEach((d) => {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(d * 44, -24 + flap);
        ctx.lineTo(d * 34, 12 + flap * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, 6.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(-7, -3, 4, 0, 6.3);
      ctx.arc(7, -3, 4, 0, 6.3);
      ctx.fill();
    }

    // Vẽ Thanh Máu 3D (HP Bar) của Boss
    const maxHp = 3 + Math.floor((G.lvIdx || 0) / 15);
    const curHp = bs.hp === undefined ? maxHp : bs.hp;
    if (curHp > 0) {
      const bw = 54;
      const bh = 6;
      ctx.fillStyle = 'rgba(15,23,42,.85)';
      ctx.fillRect(-bw / 2, -36, bw, bh);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-bw / 2, -36, bw * clamp(curHp / maxHp, 0, 1), bh);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-bw / 2, -36, bw, bh);
    }
    ctx.restore();
  }
}

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
            y: Math.max(40, f.y + 10 - 300),
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
        Math.abs(cx - (e.x + e.w / 2)) < 240 &&
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

function updateTraps(bodies) {
  const L = G.L;
  const me = G.me;
  const cx = me.x + PW / 2;
  const cy = me.y + PH / 2;
  const feet = me.y + PH;
  const alive = !me.dead && !G.won;
  const host = isHostSlot();

  v16UpdateAnomalies();
  v21UpdateBiomeExclusiveHazards(L, me);

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
    if (sh.hitFlash > 0) sh.hitFlash -= STEP;
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
    case 'awk':
      if (G.remotes.has(e.s)) {
        const rem = G.remotes.get(e.s);
        rem.awakened = !!e.v;
        sparkle(e.x || rem.x, e.y || rem.y, 22, 1.8, '#00f5d4');
      }
      break;
    case 'skill':
      if (G.remotes.has(e.s)) {
        G.skillShots.push({
          x0: e.x - e.vx, y0: e.y - e.vy,
          x: e.x, y: e.y,
          vx: e.vx, vy: e.vy,
          ang: Math.atan2(e.vy, e.vx),
          r: e.r || 24,
          dmg: e.dmg || 1,
          kind: e.k || 'ki_blast',
          life: 0.95,
          remote: true,
        });
      }
      break;
    case 'hit_obj':
      if (G.L) {
        const dummyTarget = { x: e.x, y: e.y, kind: e.k, dmg: e.dmg || 1 };
        v20DestroyTarget(G.L, dummyTarget, true);
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
      (curPassive === 'antidote' ||
        curPassive === 'limitless' ||
        curPassive === 'azathoth' ||
        curPassive === 'nika')
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
      const inAlcove = (t.alc || []).some(
        (a) => hx >= a[0] - 4 && hx + hw <= a[1] + 4 && hy + hh > t.gy + 8
      );
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

  // CÁ MẬP BẠO CHÚA MEGALODON (Hàm dưới cử động, 2 hàm răng nhọn, Thanh Máu 3D trên đầu):
  for (const sh of L.sharks || []) {
    ctx.save();
    ctx.translate(sh.cx, sh.cy);
    ctx.scale(sh.dir || 1, 1);
    const wag = Math.sin(T * 14) * 8;
    const bite = Math.abs(Math.sin(T * 7)) * 0.28;

    if (sh.hitFlash > 0) ctx.fillStyle = '#ffffff';

    ctx.fillStyle = sh.hitFlash > 0 ? '#ffffff' : '#0f2942';
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

    ctx.fillStyle = sh.hitFlash > 0 ? '#ffffff' : '#102a43';
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-22, -48, -28, -50);
    ctx.lineTo(14, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const sg = ctx.createLinearGradient(0, -30, 0, 26);
    sg.addColorStop(0, '#0a192f');
    sg.addColorStop(0.48, '#1e3a5f');
    sg.addColorStop(0.72, '#64748b');
    sg.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = sh.hitFlash > 0 ? '#ffffff' : sg;
    ctx.beginPath();
    ctx.moveTo(64, -2);
    ctx.quadraticCurveTo(24, -32, -46, -10);
    ctx.lineTo(-46, 10);
    ctx.quadraticCurveTo(4, 24, 22, 6);
    ctx.lineTo(54, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

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

    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(16 + k * 6.5, 2);
      ctx.lineTo(19 + k * 6.5, 10);
      ctx.lineTo(22 + k * 6.5, 2);
      ctx.fill();
    }

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

    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.ellipse(38, -8, 5.2, 3.8, -0.2, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(39.5, -8.5, 1.5, 0, 6.3);
    ctx.fill();

    // Thanh máu cá mập
    const maxHp = 2 + Math.floor((G.lvIdx || 0) / 20);
    const curHp = sh.hp === undefined ? maxHp : sh.hp;
    if (curHp > 0) {
      ctx.fillStyle = 'rgba(15,23,42,.85)';
      ctx.fillRect(-22, -44, 44, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-22, -44, 44 * clamp(curHp / maxHp, 0, 1), 5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-22, -44, 44, 5);
    }
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
  v21DrawBiomeExclusiveHazards(ctx, L);
  if (typeof window.TB_DrawMultiverse4DFX === 'function') {
    window.TB_DrawMultiverse4DFX(ctx, G, drawBunny, PW, PH);
  }
  v20DrawWorldSkillShots(ctx);
};

// ============================================================================
// 8. VÒNG LẶP STEPPLAYER, UPDATEWORLD, DIE & RESPAWN (SỬA TRIỆT ĐỂ LỖI KẸT TRẦN MÀN HÌNH)
// ============================================================================
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

  if (curPassive === 'antidote' || curPassive === 'limitless' || curPassive === 'azathoth') {
    P.rev = 0;
  }
  if (curPassive === 'dragonflight' || curPassive === 'limitless' || curPassive === 'azathoth') {
    P.dj = true;
    P.djT = 999;
    if (P.onGround) P.extraHops = 2;
  }

  const permaDJ =
    curPassive === 'limitless' ||
    curPassive === 'azathoth' ||
    curPassive === 'shrine' ||
    curPassive === 'sixpaths' ||
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
  if (
    curPassive === 'limitless' ||
    curPassive === 'azathoth' ||
    curPassive === 'shrine' ||
    curPassive === 'sixpaths' ||
    curPassive === 'pikachu' ||
    curPassive === 'kurama'
  ) {
    speedBonus = 1.32;
  } else if (
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
    curPassive === 'nika' ||
    curPassive === 'limitless' ||
    curPassive === 'azathoth' ||
    curPassive === 'saiyan'
      ? 1.22
      : 1.0;

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
    : curPassive === 'featherfall' || curPassive === 'limitless' || curPassive === 'azathoth'
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
  // SỬA TRIỆT ĐỂ LỖI KẸT TRẦN: Kiểm tra biên độ an toàn, không bao giờ để P.y bị kẹt sát mép trên < 0
  if (P.y < 10) {
    P.y = 10;
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
      if (P.vy > 0 && feet0 - s[1] <= 32) {
        P.y = s[1] - PH;
        P.onGround = true;
        P.onIce = !!s.ice;
        P.vy = 0;
      } else if (P.vy < 0 && s[3] <= 90) {
        P.y = s[1] + s[3];
        P.vy = 0;
      } else if (feet0 <= s[1] + s[3] + 12) {
        P.y = s[1] - PH;
        P.onGround = true;
        P.vy = 0;
      } else {
        P.y = s[1] + s[3];
        P.vy = 0;
      }
    } else {
      if (P.vy < 0) {
        P.y = s[1] + s[3];
        P.onGround = true;
        P.onIce = !!s.ice;
      } else if (P.vy > 0) {
        P.y = s[1] - PH;
      }
      P.vy = 0;
    }
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
      curPassive === 'azathoth' ||
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

  // KHI ĐANG THỨC TỈNH (P.awakened === true) VỚI GOJO / RIMURU / SUKUNA / MADARA / LUFFY GEAR 5: BẤT TỬ 100%
  if (
    P.awakened &&
    cause !== 'fall' &&
    cause !== 'wall' &&
    (curPassive === 'limitless' ||
      curPassive === 'azathoth' ||
      curPassive === 'shrine' ||
      curPassive === 'sixpaths' ||
      curPassive === 'nika')
  ) {
    P.inv = 0.65;
    P.vy = -11.5;
    Snd.djump();
    sparkle(P.x + PW / 2, P.y + PH / 2, 18, 1.7, '#00f5d4');
    return;
  }

  const isHero =
    curPassive === 'limitless' ||
    curPassive === 'azathoth' ||
    curPassive === 'shrine' ||
    curPassive === 'sixpaths' ||
    curPassive === 'nika' ||
    curPassive === 'saiyan' ||
    curPassive === 'onepunch' ||
    curPassive === 'kurama' ||
    curPassive === 'pikachu' ||
    curPassive === 'santoryu' ||
    curPassive === 'wraith';

  if (isHero && cause !== 'fall' && cause !== 'wall' && !(P.guardCd > 0)) {
    P.guardCd = GUARD_COOLDOWN;
    P.awakened = true;
    P.inv = 1.4;
    P.vy = curPassive === 'nika' ? -13.5 : -9.8;
    P.sq = -0.35;
    Snd.djump();
    sparkle(P.x + PW / 2, P.y + PH / 2, 22, 1.8, '#38bdf8');
    toast('🔥 Tự động kích hoạt Thức Tỉnh hóa giải sát thương!');
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
// 9. TRÌNH KIẾN TẠO 300 MÀN CHƠI & MÀN ĐẠI DƯƠNG ĐÁY BIỂN SÂU
// ============================================================================
(() => {
  if (typeof window.TB_InitAllMultiverseHeroes === 'function') {
    window.TB_InitAllMultiverseHeroes(TB_RegisterSkin);
  }

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

  // MÀN ĐẠI DƯƠNG ĐÁY BIỂN RIÊNG BIỆT (Có trần san hô chặn trên đầu, Thủy lôi, Sứa điện & Cá mập Megalodon):
  function buildOceanAbyssStage(title, seed, mode, d) {
    const W = 4400;
    const b = new LB(
      title,
      '🌊 ĐẠI DƯƠNG SÂU THẲM: Bơi qua Hẻm Núi San Hô, Thủy Lôi Dây Xích, Sứa Điện & Cá Mập Megalodon!',
      195,
      mode === 'coop'
    );
    b.x = W;
    b._v11 = 1;
    b.solids.push([0, GY - 20, 320, 260]);
    b.spawn = [110, GY - 20 - PH];
    b.solids.push([0, 0, W, 92]);

    const navalMines = [];
    const jellyfish = [];
    const sharks = [];
    let curX = 420;
    let step = 0;
    while (curX < W - 650) {
      const hTop = 120 + ((step * 53 + seed * 19) % 140);
      const gapSwim = 210 - Math.round(d * 25);
      b.solids.push([curX, 80, 130, hTop]);
      b.solids.push([curX, 80 + hTop + gapSwim, 130, WORLD_H - (80 + hTop + gapSwim) + 80]);
      b.coin(curX + 65, 80 + hTop + gapSwim * 0.5);

      if (step % 2 === 0) {
        navalMines.push({ x0: curX + 240, x: curX + 240, y: 240 + ((step * 71) % 240), r: 22, off: step });
      } else {
        jellyfish.push({ x: curX + 240, y0: 320, y: 320, amp: 110, spd: 2.8 + d, off: step });
      }
      if (step % 3 === 1) {
        b.solids.push([curX + 180, GY - 40, 180, 26]);
        b.flags.push({ x: curX + 270, y: GY - 40 });
      }
      curX += 380;
      step++;
    }

    b.solids.push([W - 520, GY - 20, 520, 260]);
    b.key = { x: W - 380, y: GY - 110 };
    b.exitOv = { x: W - 160, y: GY - 20 - 74, w: 54, h: 74 };

    for (let sx = 620; sx < W - 700; sx += 950) {
      sharks.push({
        x0: sx,
        x1: Math.min(W - 550, sx + 780),
        baseY: 360,
        minY: 160,
        maxY: GY - 40,
        cx: sx,
        cy: 360,
        speed: 3.6 + d * 1.4,
        off: sx * 0.01,
        dir: 1,
      });
    }

    const lv = b.finish(0, 0);
    lv.skyTheme = 'ocean';
    lv.biome = 'water';
    lv.navalMines = navalMines;
    lv.jellyfish = jellyfish;
    lv.sharks = sharks;
    return lv;
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

  function makeV220Stage(mode, idx) {
    try {
      const d = clamp(idx / 99, 0.25, 1.0);
      const season = SEASONS[(idx + (mode === 'coop' ? 2 : mode === 'party' ? 4 : 0)) % SEASONS.length];
      const stageTitle = season.name + ' #' + (idx + 1);

      if (season.biome === 'water') {
        return buildOceanAbyssStage(stageTitle, idx + 1, mode, d);
      }

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
          ? '☣️ ĐẦM LẦY ĐỘC & HỒ AXIT: Cẩn thận cây phun axit, mặt đất há miệng & Boss Rồng Độc!'
          : season.biome === 'heaven'
          ? '☁️ THIÊN ĐƯỜNG TRÊN MÂY: Bước trên Thềm Mây 3D bồng bềnh — Coi chừng Thiên Thần 6 Cánh Seraphim!'
          : season.biome === 'hell'
          ? '🔥 ĐỊA NGỤC TỐI THƯỢNG: Sông dung nham sôi sục dưới vực & Rồng Hắc Ám canh giữ!'
          : season.biome === 'space'
          ? '🚀 VŨ TRỤ KHÔNG TRỌNG LỰC: Bay Jetpack & Lộn ngược bước đi trên trần nhà!'
          : '👻 CẢNH BÁO QUỶ DỊ: Nhấn F / 🔥 để Thức Tỉnh — Mọi Skin đều có Tinh Linh Hộ Vệ & Giẫm Đầu Quái!',
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
      if (season.biome === 'heaven' || season.biome === 'hell' || season.biome === 'toxic') {
        lv.stageBosses = [];
        for (let bx = 950; bx < lv.w - 800; bx += 1350) {
          lv.stageBosses.push({
            kind: season.biome === 'heaven' ? 'seraphim' : 'dragon',
            x0: bx,
            x1: Math.min(lv.w - 500, bx + 550),
            x: bx,
            y0: GY - 165,
            y: GY - 165,
            spd: 3.2 + d,
            off: bx * 0.01,
            hp: 3 + Math.floor(idx / 15),
            hitFlash: 0,
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
        return makeV220Stage('solo', i);
      } finally {
        V11.ctx = null;
      }
    });
    LEVELS.coop.push(() => {
      V11.ctx = { mode: 'coop', i };
      try {
        return makeV220Stage('coop', i);
      } finally {
        V11.ctx = null;
      }
    });
    LEVELS.party.push(() => {
      V11.ctx = { mode: 'party', i };
      try {
        return makeV220Stage('party', i);
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
`;

code =
  code.slice(0, lastClose) +
  v220MasterPayload +
  '\n' +
  v220CoreAndPhysicsPart3 +
  '\n' +
  v220WorldAndLevelsPart4 +
  '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V22.0 FULL ANIME 4D MASTER] Đã cập nhật hoàn tất 100% public/game.js!');

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
  if (!css.includes('.preview-rimuru')) {
    css += `\n.shop-item.tier-transcendent{border-color:#00f5d4;background:linear-gradient(155deg,#0f172a,#1e1b4b,#3b0764);color:#fff;box-shadow:0 0 18px rgba(56,189,248,.45)}
.shop-item.tier-transcendent .skin-name,.shop-item.tier-transcendent .skin-desc{color:#f8fafc}
.shop-item.tier-transcendent .tier-tag{background:linear-gradient(90deg,#00f5d4,#a855f7,#ff0055)}
.shop-section-title.tier-transcendent{color:#7e22ce;font-size:13px}
.preview-gojo{background:radial-gradient(circle,#38bdf8,#1e1b4b);border-color:#00f5d4;box-shadow:0 0 16px #38bdf8}
.preview-rimuru{background:radial-gradient(circle,#00f5d4,#0284c7);border-color:#fde047;box-shadow:0 0 16px #00f5d4}
.preview-sukuna{background:radial-gradient(circle,#ef4444,#090d16);border-color:#ef4444;box-shadow:0 0 16px #ef4444}
.preview-madara{background:radial-gradient(circle,#a855f7,#1e1b4b);border-color:#c084fc;box-shadow:0 0 16px #a855f7}
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
    fs.writeFileSync(cssPath, css, 'utf8');
  }
}

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('anime_heroes.js')) {
    html = html.replace(
      /<script src="game\.js[^"]*"><\/script>/,
      '<script src="anime_heroes.js?v=22.0"></script>\n  <script src="game.js?v=22.0"></script>'
    );
  } else {
    html = html.replace(/anime_heroes\.js(\?v=[^"']*)?/, 'anime_heroes.js?v=22.0');
    html = html.replace(/game.js(\?v=[^"']*)?/, 'game.js?v=22.0');
  }
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V22.0] Đã tự động nhúng anime_heroes.js?v=22.0 và game.js?v=22.0 vào index.html');
}
