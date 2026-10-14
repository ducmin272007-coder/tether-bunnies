/**
 * Tether Bunnies v22.0 - 4D ANIME, BOSS HP SCALING, CLOUD SYNC FIX & HARDCORE BIOMES (PHẦN 1 / 4)
 *  - Sửa triệt để lỗi nhân vật bị hút bay lên trời kẹt trên không trung ở Màn 97 (Đầm Lầy Độc / Đảo Chiều)
 *  - Sửa triệt để lỗi Cloud Sync "Không lưu được (not_found)" + Bổ sung Mã Sao Lưu Chuyển Máy Vĩnh Viễn
 *  - Thiết kế lại diện mạo Anime 4D (Cằm V-line, tóc nhiều lớp mềm mại, cánh Rồng Đen Rimuru lớn sau lưng)
 *  - Tách biệt rõ Kỹ năng Dạng Thường vs Đại Tuyệt Kỹ 4D khi Thức Tỉnh (Phím F / Nút 🔥)
 *  - Hệ thống Quái & Boss có Thanh Máu (HP tăng dần theo màn) + Cơ chế Giẫm Đầu & Tinh Linh cho Skin Thường
 *  - Siết chặt độ khó Map Vũ Trụ & Đại Dương: Vách Chắn Laser từ trần xuống đáy + Xoáy Nước + Cổng Nút Bấm
 */
'use strict';
const fs = require('fs');
const path = require('path');

const pubDir = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const gamePath = path.join(pubDir, 'game.js');
const heroesPath = path.join(pubDir, 'anime_heroes.js');
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
// KHỐI 1: TỰ ĐỘNG SINH FILE `public/anime_heroes.js` (CHUẨN ANIME 4D & BOSS AI)
// ============================================================================
const animeHeroesPartA = `/**
 * TETHER BUNNIES v22.0 - TRUE ANIME 4D PROPORTIONS, DUAL-STATE SKILLS & BOSS ENGINE
 */
(function () {
  'use strict';

  const FX4D = {
    slashes: [],
    afterimages: [],
    clones: [],
    domainFlash: 0,
    domainCol: '#38bdf8',
  };
  window.TB_FX4D = FX4D;

  function spawn4DSlash(x, y, ang, len, col1, col2) {
    FX4D.slashes.push({ x, y, ang, len, col1, col2, life: 0.45, maxLife: 0.45 });
  }
  window.TB_Spawn4DSlash = spawn4DSlash;

  // BỘ VẼ CƠ THỂ ANIME CHIBI 4D (Thân hình cân đối, áo khoác nhiều lớp bay theo gió, bóng đổ 3D):
  function draw3DChibiLimbs(ctx, bob, ph, run, air, T, cfg) {
    const fo = run ? Math.sin(ph) * 5.8 : 0;
    const fy = air ? -3.5 : -1.2;
    const breath = Math.sin(T * 5.2) * 0.65;
    const armSwing = run ? Math.cos(ph) * 5.0 : Math.sin(T * 4.5) * 1.8;

    // Bóng đổ mềm dưới mặt đất
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 4.2, 0, 0, 6.3);
    ctx.fill();

    // Đôi giày Anime có đế & mũi giày rõ nét
    ctx.fillStyle = cfg.shoe || '#0f172a';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-6 + fo, fy, 6.2, 3.5, 0, 0, 6.3);
    ctx.ellipse(6 - fo, fy, 6.2, 3.5, 0, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Quần nhân vật
    ctx.fillStyle = cfg.pants || '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-11, -14 + bob, 22, 12.5 - bob * 0.3, 5);
    ctx.fill();
    ctx.stroke();

    // Tay sau
    ctx.fillStyle = cfg.sleeve || cfg.shirt || '#334155';
    ctx.beginPath();
    ctx.ellipse(-12 - armSwing * 0.5, -19.5 + bob, 4, 6, 0.28, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Thân áo đổ bóng khối 3D
    const bg = ctx.createLinearGradient(-12, -28 + bob, 12, -11 + bob);
    bg.addColorStop(0, cfg.shirtHi || cfg.shirt || '#475569');
    bg.addColorStop(0.55, cfg.shirt || '#1e293b');
    bg.addColorStop(1, cfg.shirtDark || '#090d16');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(-12, -27 + bob + breath * 0.4, 24, 15, 6.5);
    ctx.fill();
    ctx.stroke();

    // Tà áo khoác ngoài (Coat Flaps) bay nhẹ hai bên hông nếu có
    if (cfg.coatCol) {
      const sway = Math.sin(T * 7) * 2.5;
      ctx.fillStyle = cfg.coatCol;
      ctx.beginPath();
      ctx.moveTo(-11, -20 + bob);
      ctx.lineTo(-16 - sway, -5 + bob);
      ctx.lineTo(-7, -7 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(11, -20 + bob);
      ctx.lineTo(16 + sway, -5 + bob);
      ctx.lineTo(7, -7 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (cfg.belt) {
      ctx.fillStyle = cfg.belt;
      ctx.fillRect(-11.5, -14.8 + bob, 23, 3.5);
    }

    // Tay trước
    ctx.fillStyle = cfg.sleeve || cfg.shirtHi || cfg.shirt || '#334155';
    ctx.beginPath();
    ctx.ellipse(12 + armSwing * 0.5, -19.5 + bob, 4, 6, -0.28, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  }

  // BỘ VẼ KHUÔN MẶT ANIME V-LINE SẮC NÉT (Không còn giống cục vuông! Có cằm thon, mắt Anime đa tầng & biểu cảm):
  function draw3DChibiHead(ctx, bob, T, cfg) {
    const breath = Math.sin(T * 5.2) * 0.55;
    const hy = -45 + bob + breath;

    const fg = ctx.createRadialGradient(-3, hy + 6, 2, 0, hy + 11, 20);
    fg.addColorStop(0, cfg.skinHi || '#fff7ed');
    fg.addColorStop(0.7, cfg.skin || '#ffe4d0');
    fg.addColorStop(1, '#f3c6a5');
    ctx.fillStyle = fg;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;

    // Đường viền khuôn mặt Anime có gò má bầu và cằm V-line tự nhiên ở giữa (x = 3)
    ctx.beginPath();
    ctx.moveTo(-14, hy + 7);
    ctx.quadraticCurveTo(-14, hy - 1, 0, hy - 1);
    ctx.quadraticCurveTo(14.5, hy - 1, 14.5, hy + 7);
    ctx.quadraticCurveTo(14.5, hy + 18, 3, hy + 21.5);
    ctx.quadraticCurveTo(-14, hy + 18, -14, hy + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Đôi tai Anime hai bên
    ctx.fillStyle = cfg.skin || '#ffe4d0';
    ctx.beginPath();
    ctx.arc(-14.2, hy + 11, 3, 0, 6.3);
    ctx.arc(14.2, hy + 11, 3, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    if (cfg.baldFacial) {
      if (!cfg.awakened) {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0.5, hy + 10.5, 1.9, 0, 6.3);
        ctx.arc(9.0, hy + 10.5, 1.9, 0, 6.3);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0.5, hy + 7, 2.5, 3.4, 6.0);
        ctx.moveTo(7.0, hy + 7);
        ctx.arc(9.0, hy + 7, 2.5, 3.4, 6.0);
        ctx.moveTo(3.5, hy + 15.5);
        ctx.lineTo(7.0, hy + 15.5);
        ctx.stroke();
      } else {
        const sg = ctx.createLinearGradient(0, hy, 0, hy + 12);
        sg.addColorStop(0, 'rgba(15,23,42,.58)');
        sg.addColorStop(1, 'rgba(15,23,42,0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.roundRect(-13.5, hy + 1, 27, 11, 7);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3, hy + 8.8);
        ctx.lineTo(4.2, hy + 10.8);
        ctx.lineTo(3.6, hy + 13.2);
        ctx.lineTo(-2.2, hy + 12.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(13, hy + 8.8);
        ctx.lineTo(6.0, hy + 10.8);
        ctx.lineTo(6.6, hy + 13.2);
        ctx.lineTo(12.4, hy + 12.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(1.8, hy + 11.4, 1.2, 0, 6.3);
        ctx.arc(8.4, hy + 11.4, 1.2, 0, 6.3);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-3.5, hy + 6.5);
        ctx.lineTo(5.0, hy + 9.8);
        ctx.lineTo(13.5, hy + 6.5);
        ctx.moveTo(2.0, hy + 17);
        ctx.lineTo(8.2, hy + 16.5);
        ctx.stroke();
      }
      return;
    }

    if (!cfg.hideEyes) {
      // Đôi mắt Anime to sắc sảo có mí mắt trên dày và 2 đốm sáng phản quang
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0.5, hy + 11, 3.8, 4.3, 0, 0, 6.3);
      ctx.ellipse(9.2, hy + 11, 3.8, 4.3, 0, 0, 6.3);
      ctx.fill();

      ctx.fillStyle = cfg.eye || '#0f172a';
      ctx.beginPath();
      ctx.arc(1.1, hy + 11.2, 2.5, 0, 6.3);
      ctx.arc(9.8, hy + 11.2, 2.5, 0, 6.3);
      ctx.fill();

      // Đốm sáng mắt Anime
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0.1, hy + 9.6, 1.2, 0, 6.3);
      ctx.arc(8.8, hy + 9.6, 1.2, 0, 6.3);
      ctx.arc(2.0, hy + 12.4, 0.65, 0, 6.3);
      ctx.arc(10.6, hy + 12.4, 0.65, 0, 6.3);
      ctx.fill();

      // Hàng lông mi trên đậm chuẩn Anime
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0.5, hy + 10.5, 3.9, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(9.2, hy + 10.5, 3.9, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      ctx.strokeStyle = cfg.brow || '#0f172a';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      if (cfg.serious) {
        ctx.moveTo(-3.2, hy + 5.8);
        ctx.lineTo(3.5, hy + 7.8);
        ctx.moveTo(13.2, hy + 5.8);
        ctx.lineTo(6.8, hy + 7.8);
      } else {
        ctx.moveTo(-2.2, hy + 6.2);
        ctx.lineTo(3.2, hy + 6.2);
        ctx.moveTo(7.2, hy + 6.2);
        ctx.lineTo(12.2, hy + 6.2);
      }
      ctx.stroke();
    }

    if (cfg.faceMarks === 'sukuna') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(1.5, hy + 3);
      ctx.lineTo(5.2, hy + 5);
      ctx.lineTo(8.5, hy + 3);
      ctx.moveTo(-2.5, hy + 14.5);
      ctx.lineTo(0.5, hy + 15.5);
      ctx.moveTo(10.5, hy + 14.5);
      ctx.lineTo(13.5, hy + 15.5);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.6;
    if (cfg.bigLaugh) {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(5.0, hy + 14.8, 5.0, 0.05, Math.PI - 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1.2, hy + 14.9, 7.6, 2.2);
    } else if (cfg.serious) {
      // Biểu cảm lạnh lùng ngầu chuẩn Anime khi Thức Tỉnh (không cười ngơ ngác!)
      ctx.beginPath();
      ctx.moveTo(2.5, hy + 16.2);
      ctx.lineTo(7.5, hy + 15.8);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(5.0, hy + 15.4, 2.2, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }

  window.TB_Draw3DLimbs = draw3DChibiLimbs;
  window.TB_Draw3DHead = draw3DChibiHead;

  window.TB_InitAllMultiverseHeroes = function (TB_RegisterSkin) {
    // 1. SATORU GOJO (30.000 XU + 400 KIM CƯƠNG)
    TB_RegisterSkin({
      id: 'gojo',
      tier: 'transcendent',
      name: 'Satoru Gojo (Lục Nhãn Vô Cực)',
      awakenedTitle: 'GOJO SATORU — VÔ LƯƠNG KHÔNG XỨ & HƯ THỨC: TỬ 4D',
      icon: '🌌',
      coins: 30000,
      dia: 400,
      env: {
        name: 'Lãnh Địa Vô Lương Không Xứ 4D',
        desc: 'Dạng thường bắn Thương/Hách <-> Thức Tỉnh (F) mở Lục Nhãn, Vô Hạ Hạn Vĩnh Viễn & bắn Đại Hư Thức: Tử 4D!',
        sky: 'cosmic',
        solidHue: 255,
        grassHue: 195,
        tint: 'rgba(56,189,248,.06)',
        fx: 'stars',
        rate: 32,
      },
      passive: {
        id: 'limitless',
        name: 'Thương (Hút) · Hách (Đẩy) · Vô Hạ Hạn Vĩnh Viễn',
        desc: '🔵 Cầu Xanh HÚT toàn bộ Xu/Kim Cương/Chìa Khóa! 🔴 Cầu Đỏ ĐẨY VĂNG bẫy áp sát! 🌌 Khi Thức Tỉnh (nhấn F): Mở băng bịt mắt lộ Lục Nhãn, Vô Hạ Hạn bật VĨNH VIỄN (Bất tử 100%) & Tự động phóng Đại Hư Thức: Tử 4D càn quét bản đồ!',
      },
      trail: ['#38bdf8', '#c084fc', '#ef4444'],
      pal: { body: '#0f172a', edge: '#38bdf8', inner: '#a855f7', belly: 'rgba(56,189,248,.5)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const awk = !!(P && P.awakened);
        const sway = Math.sin(T * 6.5) * 2.2 - Math.max(-3.5, Math.min(3.5, vx * 0.45));
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (awk) {
          ctx.save();
          const dg = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 56);
          dg.addColorStop(0, 'rgba(255,255,255,.72)');
          dg.addColorStop(0.35, 'rgba(56,189,248,.48)');
          dg.addColorStop(0.7, 'rgba(147,51,234,.38)');
          dg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(0, -24 + bob, 56, 0, 6.3);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,245,212,.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, -24 + bob, 40, 12, T * 3.2, 0, 6.3);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(239,68,68,.8)';
          ctx.beginPath();
          ctx.ellipse(0, -24 + bob, 40, 12, -T * 3.2, 0, 6.3);
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: '#0f172a',
          shirtHi: awk ? '#4c1d95' : '#312e81',
          shirt: '#0f172a',
          shirtDark: '#020617',
          coatCol: awk ? '#1e1b4b' : null,
        });
        ctx.fillStyle = '#facc15';
        for (let b = 0; b < 4; b++) {
          ctx.beginPath();
          ctx.arc(3.5, -24 + b * 3.2 + bob, 1.3, 0, 6.3);
          ctx.fill();
        }

        draw3DChibiHead(ctx, bob, T, {
          skin: '#fff1e6',
          eye: '#00f5d4',
          brow: '#ffffff',
          hideEyes: !awk,
          serious: true,
        });
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-13.5, -27 + bob, 27, 5.5, 2.5);
        ctx.fill();
        ctx.stroke();

        if (!awk) {
          ctx.fillStyle = '#090d16';
          ctx.beginPath();
          ctx.roundRect(-14.5, hy + 6.5, 29, 8.2, 3.5);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#00f5d4';
          ctx.beginPath();
          ctx.roundRect(-1, hy + 8.2, 5.5, 4.6, 2);
          ctx.roundRect(7, hy + 8.2, 5.5, 4.6, 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#00f5d4';
          ctx.beginPath();
          ctx.arc(1.1, hy + 11, 2.8, 0, 6.3);
          ctx.arc(9.8, hy + 11, 2.8, 0, 6.3);
          ctx.fill();
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(1, hy + 10);
          ctx.lineTo(-12 - sway, hy + 3);
          ctx.moveTo(10, hy + 10);
          ctx.lineTo(23 - sway, hy + 3);
          ctx.stroke();
          ctx.restore();
        }

        // Mái tóc bạch kim mềm mại từng lọn cong Bezier
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = awk ? '#38bdf8' : '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14.5, hy + 7);
        ctx.quadraticCurveTo(-20, hy + 2, -24 + sway, hy - 3);
        ctx.lineTo(-13, hy - 1);
        ctx.quadraticCurveTo(-18, hy - 8, -20 + sway, hy - 14);
        ctx.lineTo(-7, hy - 4);
        ctx.quadraticCurveTo(-5, hy - 12, -3 + sway * 1.2, hy - 19);
        ctx.lineTo(3, hy - 5);
        ctx.quadraticCurveTo(8, hy - 12, 11 + sway, hy - 17);
        ctx.lineTo(11, hy - 4);
        ctx.lineTo(22 + sway * 0.8, hy - 6);
        ctx.lineTo(14.5, hy + 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const blueX = 22 + Math.cos(T * 5) * 3;
        const blueY = -20 + bob + Math.sin(T * 5) * 4;
        const redX = -22 - Math.cos(T * 5) * 3;
        const redY = -22 + bob - Math.sin(T * 5) * 4;

        const bgBlue = ctx.createRadialGradient(blueX, blueY, 1, blueX, blueY, 12);
        bgBlue.addColorStop(0, '#ffffff');
        bgBlue.addColorStop(0.45, '#00f5d4');
        bgBlue.addColorStop(0.8, '#0284c7');
        bgBlue.addColorStop(1, 'rgba(2,132,199,0)');
        ctx.fillStyle = bgBlue;
        ctx.beginPath();
        ctx.arc(blueX, blueY, 12, 0, 6.3);
        ctx.fill();

        const bgRed = ctx.createRadialGradient(redX, redY, 1, redX, redY, 12);
        bgRed.addColorStop(0, '#ffffff');
        bgRed.addColorStop(0.45, '#ff4d6d');
        bgRed.addColorStop(0.8, '#dc2626');
        bgRed.addColorStop(1, 'rgba(220,38,38,0)');
        ctx.fillStyle = bgRed;
        ctx.beginPath();
        ctx.arc(redX, redY, 12, 0, 6.3);
        ctx.fill();
      },
    });

    // ==========================================================================
    // 2. RIMURU TEMPEST (28.000 XU + 380 KIM CƯƠNG — LÀM LẠI 100% CHUẨN ANIME!)
    //    - Dạng Thường: Slime 3D trong suốt bóng bẩy có vệt lóa sáng
    //    - Dạng Thức Tỉnh (F): Chân Ma Vương Rimuru (Tóc xanh bạc dài suôn mượt ôm sát má,
    //      Mặt nạ kháng ma cài nghiêng bên thái dương, Áo choàng đen Ma Vương cổ lông trắng,
    //      Đôi Cánh Rồng Đen sải rộng phía sau lưng, Thanh kiếm Katana bên hông & Lỗ đen Azathoth dưới chân!)
    // ==========================================================================
    TB_RegisterSkin({
      id: 'rimuru',
      tier: 'transcendent',
      name: 'Rimuru Tempest (Slime ↔ Ma Vương)',
      awakenedTitle: 'RIMURU — HƯ KHÔNG THẦN AZATHOTH (CHÂN MA VƯƠNG)',
      icon: '💧',
      coins: 28000,
      dia: 380,
      env: {
        name: 'Jura Tempest Federation',
        desc: 'Dạng Thường là Slime 3D phun Thủy Nhận <-> Nhấn F hóa Chân Ma Vương Tóc Xanh Bạc Dài & Lỗ Đen Azathoth nuốt chửng mọi bẫy!',
        sky: 'aurora',
        solidHue: 195,
        grassHue: 165,
        tint: 'rgba(0,245,212,.05)',
        fx: 'bubbles',
        rate: 28,
      },
      passive: {
        id: 'azathoth',
        name: 'Bạo Thực Vương Beelzebuth & Hư Không Azathoth',
        desc: '💧 Dạng Slime: Nảy qua gai & bắn Thủy Nhận! 🌌 Khi Thức Tỉnh Chân Ma Vương (nhấn F): Cánh Rồng Đen sải rộng, triệu hồi Hắc Lôi & Lỗ Đen Azathoth tự động HÚT & NUỐT CHỬNG mọi bẫy/quái vật trên đường đi + Bất tử hoàn toàn!',
      },
      trail: ['#00f5d4', '#38bdf8', '#7209b7'],
      pal: { body: '#38bdf8', edge: '#0284c7', inner: '#fde047', belly: 'rgba(224,242,254,.88)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const demonLord = !!(P && P.awakened);

        if (!demonLord) {
          // DẠNG SLIME 3D TRONG SUỐT ĐÀN HỒI MỀM MẠI
          const jiggleX = Math.sin(T * 10 + (run ? ph : 0)) * 2.6;
          const jiggleY = Math.cos(T * 10 + (run ? ph : 0)) * 2.2;
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,.24)';
          ctx.beginPath();
          ctx.ellipse(0, 1, 15, 4, 0, 0, 6.3);
          ctx.fill();

          const sg = ctx.createRadialGradient(-5, -18 + bob, 2, 0, -14 + bob, 20);
          sg.addColorStop(0, 'rgba(224,242,254,.96)');
          sg.addColorStop(0.45, 'rgba(56,189,248,.92)');
          sg.addColorStop(0.85, 'rgba(2,132,199,.90)');
          sg.addColorStop(1, 'rgba(3,105,161,.95)');
          ctx.fillStyle = sg;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 2.4;

          ctx.beginPath();
          ctx.moveTo(-16 - jiggleX, -6 + bob);
          ctx.bezierCurveTo(-18 - jiggleX, -24 + bob + jiggleY, -8, -32 + bob - jiggleY, 0, -33 + bob - jiggleY);
          ctx.bezierCurveTo(8, -32 + bob - jiggleY, 18 + jiggleX, -24 + bob + jiggleY, 16 + jiggleX, -6 + bob);
          ctx.quadraticCurveTo(0, -1 + bob, -16 - jiggleX, -6 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(255,255,255,.82)';
          ctx.beginPath();
          ctx.ellipse(-7, -23 + bob, 5.0, 2.6, -0.45, 0, 6.3);
          ctx.fill();

          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(1.5, -16 + bob, 3, 3.3, 6.1);
          ctx.moveTo(7.5, -16 + bob);
          ctx.arc(10, -16 + bob, 3, 3.3, 6.1);
          ctx.stroke();
          ctx.restore();
        } else {
          // DẠNG CHÂN MA VƯƠNG RIMURU (CHUẨN ANIME — Tóc dài suôn mượt, Cánh Rồng Đen lớn phía sau, Lỗ Đen dưới chân!)
          const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;
          const flap = Math.sin(T * 7.5) * 7;
          const sway = Math.sin(T * 6) * 2.8 - Math.max(-4.5, Math.min(4.5, vx * 0.55));

          ctx.save();
          // 1. Vòng xoáy Lỗ Đen Hư Không Beelzebuth / Azathoth nằm DƯỚI ĐẤT (Không bao giờ cắt ngang mặt!)
          const vg = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
          vg.addColorStop(0, '#090d16');
          vg.addColorStop(0.55, 'rgba(114,9,183,.65)');
          vg.addColorStop(1, 'rgba(0,245,212,0)');
          ctx.fillStyle = vg;
          ctx.beginPath();
          ctx.ellipse(0, 0, 32, 9, 0, 0, 6.3);
          ctx.fill();

          // 2. ĐÔI CÁNH RỒNG ĐEN KHỔNG LỒ (Black Bat/Dragon Wings) sải rộng ở lớp sau lưng:
          ctx.fillStyle = 'rgba(15,23,42,.94)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          [-1, 1].forEach((dir) => {
            ctx.beginPath();
            ctx.moveTo(dir * 5, -22 + bob);
            ctx.quadraticCurveTo(dir * 26, -48 + bob + flap, dir * 44, -38 + bob + flap);
            ctx.quadraticCurveTo(dir * 34, -26 + bob + flap * 0.6, dir * 38, -14 + bob + flap * 0.3);
            ctx.quadraticCurveTo(dir * 24, -18 + bob, dir * 22, -6 + bob);
            ctx.quadraticCurveTo(dir * 14, -14 + bob, dir * 6, -15 + bob);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          });

          // 3. Mái tóc dài màu Xanh Bạc suôn mượt chảy dài xuống tận gót chân ở lớp sau lưng:
          const backHairG = ctx.createLinearGradient(0, hy, 0, -2 + bob);
          backHairG.addColorStop(0, '#bae6fd');
          backHairG.addColorStop(0.5, '#7dd3fc');
          backHairG.addColorStop(1, '#0284c7');
          ctx.fillStyle = backHairG;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-13, hy + 8);
          ctx.bezierCurveTo(-22 + sway, hy + 20, -24 + sway * 1.4, -12 + bob, -18 + sway * 1.6, -2 + bob);
          ctx.quadraticCurveTo(0, 2 + bob, 16 + sway * 1.2, -3 + bob);
          ctx.bezierCurveTo(20 + sway, -14 + bob, 18 + sway, hy + 18, 13, hy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 4. Trang phục Áo Choàng Đen Ma Vương có tà áo bay + Cổ khăn lông trắng phồng xốp + Kiếm Katana bên hông:
          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
            shoe: '#090d16',
            pants: '#0f172a',
            shirtHi: '#1e293b',
            shirt: '#090d16',
            belt: '#eab308',
            coatCol: '#0f172a',
          });
          // Thanh kiếm Ma Vương giắt chéo bên hông
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(-8, -14 + bob);
          ctx.lineTo(-26, -6 + bob);
          ctx.stroke();

          // Khăn choàng lông trắng bồng bềnh quanh cổ Rimuru
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.8;
          [-9, -3, 3, 9].forEach((cx) => {
            ctx.beginPath();
            ctx.arc(cx, -25.5 + bob, 4.5, 0, 6.3);
            ctx.fill();
            ctx.stroke();
          });

          // 5. Khuôn mặt Anime V-Line với đôi mắt Hoàng Kim sắc lạnh của Chân Ma Vương Rimuru:
          draw3DChibiHead(ctx, bob, T, {
            skin: '#fff5eb',
            eye: '#eab308',
            brow: '#0284c7',
            serious: true,
          });

          // 6. Tóc mái chia lọn mềm mại ôm lấy 2 bên má & vòm đầu tròn (Không còn nhọn như vương miện!):
          const topHairG = ctx.createLinearGradient(0, hy - 8, 0, hy + 18);
          topHairG.addColorStop(0, '#e0f2fe');
          topHairG.addColorStop(0.55, '#7dd3fc');
          topHairG.addColorStop(1, '#38bdf8');
          ctx.fillStyle = topHairG;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 1.9;
          ctx.beginPath();
          // Vòm đầu tròn mềm mại
          ctx.moveTo(-14.5, hy + 9);
          ctx.bezierCurveTo(-16, hy - 6, 16, hy - 6, 14.5, hy + 9);
          // Lọn tóc mai bên phải rủ xuống má
          ctx.quadraticCurveTo(16 + sway * 0.4, hy + 18, 12 + sway * 0.4, hy + 23);
          ctx.quadraticCurveTo(11, hy + 14, 10, hy + 7);
          // Các lọn tóc mái mềm rủ trước trán
          ctx.lineTo(6, hy + 10);
          ctx.lineTo(3, hy + 5);
          ctx.lineTo(-1, hy + 11);
          ctx.lineTo(-5, hy + 5);
          ctx.lineTo(-9, hy + 9);
          // Lọn tóc mai bên trái dài rủ xuống vai
          ctx.quadraticCurveTo(-11, hy + 15, -12 + sway * 0.4, hy + 24);
          ctx.quadraticCurveTo(-16 + sway * 0.4, hy + 18, -14.5, hy + 9);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 7. Chiếc Mặt Nạ Kháng Ma của Shizu cài nghiêng bên thái dương trái chuẩn thiết kế Rimuru!
          ctx.save();
          ctx.translate(-11, hy + 1);
          ctx.rotate(-0.42);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(0, 0, 5.5, 6.5, 0, 0, 6.3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      },
    });

    // 3. RORONOA ZORO (18.000 XU + 250 KIM CƯƠNG — QUỶ THẦN ASURA 3 ĐẦU 6 TAY 9 KIẾM)
    TB_RegisterSkin({
      id: 'zoro',
      tier: 'supreme',
      name: 'Roronoa Zoro (Asura 3 Đầu 9 Kiếm)',
      awakenedTitle: 'ZORO — QUỶ THẦN ASURA 3 ĐẦU 6 TAY (CỬU KIẾM PHÁI)',
      icon: '⚔️',
      coins: 18000,
      dia: 250,
      env: {
        name: 'Onigashima King of Hell',
        desc: 'Dạng thường Tam Kiếm <-> Nhấn F hóa Quỷ Thần Asura 3 Đầu 6 Tay cầm 9 Kiếm chém đứt không gian 4D!',
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
        desc: '⚔️ Dạng Thường: Tự động phóng 1 luồng kiếm khí xanh! 👹 Khi Thức Tỉnh (nhấn F): Hiện thân Quỷ Thần Asura 3 Đầu 6 Tay 9 Kiếm bọc Haki Bá Vương — Tự động tung Cửu Kiếm Trảm 4D chữ X xóa sổ mọi cạm bẫy & Boss!',
      },
      trail: ['#10b981', '#a855f7', '#ef4444'],
      pal: { body: '#15803d', edge: '#052e16', inner: '#a855f7', belly: 'rgba(16,185,129,.7)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const asura = !!(P && P.awakened);
        const hy = -45 + bob + Math.sin(T * 5.2) * 0.55;

        if (asura) {
          ctx.save();
          const ag = ctx.createRadialGradient(0, -26 + bob, 4, 0, -26 + bob, 50);
          ag.addColorStop(0, 'rgba(168,85,247,.68)');
          ag.addColorStop(0.5, 'rgba(220,38,38,.38)');
          ag.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(0, -26 + bob, 50, 0, 6.3);
          ctx.fill();

          for (let s = 0; s < 6; s++) {
            const ang = -2.5 + (s / 5) * 2.0 + Math.sin(T * 10 + s) * 0.08;
            ctx.save();
            ctx.translate(0, -20 + bob);
            ctx.rotate(ang);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(8, -2, 8, 4);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(15, -5, 2.5, 10);
            ctx.fillStyle = '#090d16';
            ctx.strokeStyle = s % 2 === 0 ? '#10b981' : '#c084fc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(17, -2.5);
            ctx.lineTo(44, 0);
            ctx.lineTo(17, 2.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }

          [-18, 18].forEach((ox) => {
            ctx.save();
            ctx.translate(ox, 4);
            ctx.scale(0.75, 0.75);
            draw3DChibiHead(ctx, bob, T, { skin: '#ffedd5', eye: '#ef4444', serious: true });
            ctx.fillStyle = '#090d16';
            ctx.fillRect(-14, hy, 28, 7);
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
          coatCol: '#064e3b',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          eye: asura ? '#ef4444' : '#0f172a',
          serious: true,
        });

        if (asura) {
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(-14.5, hy - 1, 29, 9, 4);
          ctx.fill();
          ctx.stroke();
        } else {
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
        }

        ctx.strokeStyle = asura ? '#c084fc' : '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(4, -27 + bob);
        ctx.lineTo(28, -29 + bob + Math.sin(T * 12) * 2);
        ctx.stroke();
      },
    });
`;
// === KẾT THÚC PHẦN 1 / 4 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 2 / 4 DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 2 / 4 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 1 / 4 ===
const animeHeroesPartB = `
    // 4. RYOMEN SUKUNA (29.000 XU + 390 KIM CƯƠNG — CHÂN THÂN 4 TAY & PHỤC MA NGỰ TRÙ TỬ)
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
        desc: 'Dạng thường phóng Giải (Dismantle) <-> Nhấn F hóa Chân Thân 4 Tay & mở Phục Ma Ngự Trù Tử chém nát vạn vật!',
        sky: 'hell',
        solidHue: 0,
        grassHue: 350,
        tint: 'rgba(220,38,38,.06)',
        fx: 'embers',
        rate: 30,
      },
      passive: {
        id: 'shrine',
        name: 'Phục Ma Ngự Trù Tử & Trảm Kích Không Gian 4D',
        desc: '🩸 Tự động phóng lưới trảm kích Giải & Bát chém nát mọi đá lăn, thạch nhũ, cá mập phía trước! Khi Thức Tỉnh (nhấn F): Mọc 4 Cánh Tay Heian, mở Lãnh Địa chém tự động 360° toàn màn hình & Bất tử hoàn toàn!',
      },
      trail: ['#ef4444', '#090d16', '#f97316'],
      pal: { body: '#f8fafc', edge: '#991b1b', inner: '#ef4444', belly: 'rgba(15,23,42,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const heian = !!(P && P.awakened);

        if (heian) {
          ctx.save();
          const sg = ctx.createRadialGradient(0, -26 + bob, 4, 0, -26 + bob, 48);
          sg.addColorStop(0, 'rgba(220,38,38,.65)');
          sg.addColorStop(0.6, 'rgba(9,13,22,.45)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(0, -26 + bob, 48, 0, 6.3);
          ctx.fill();

          ctx.fillStyle = '#450a0a';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-26, -42 + bob);
          ctx.quadraticCurveTo(0, -36 + bob, 26, -42 + bob);
          ctx.lineTo(20, -34 + bob);
          ctx.lineTo(-20, -34 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffe0c8';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(-16, -15 + bob + Math.sin(T * 8) * 2, 4, 6, 0.5, 0, 6.3);
          ctx.ellipse(16, -15 + bob - Math.sin(T * 8) * 2, 4, 6, -0.5, 0, 6.3);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: '#1e293b',
          shirtHi: '#f8fafc',
          shirt: '#e2e8f0',
          belt: '#991b1b',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffe0c8',
          eye: '#ef4444',
          brow: '#991b1b',
          serious: true,
          faceMarks: 'sukuna',
        });
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(1.5, hy + 15, 1.3, 0, 6.3);
        ctx.arc(10.5, hy + 15, 1.3, 0, 6.3);
        ctx.fill();

        ctx.fillStyle = '#fb7185';
        ctx.strokeStyle = '#881337';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, hy + 6);
        ctx.lineTo(-21, hy - 5);
        ctx.lineTo(-10, hy - 3);
        ctx.lineTo(-12, hy - 14);
        ctx.lineTo(-2, hy - 6);
        ctx.lineTo(5, hy - 15);
        ctx.lineTo(9, hy - 5);
        ctx.lineTo(19, hy - 8);
        ctx.lineTo(14, hy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    });

    // 5. UCHIHA MADARA (27.000 XU + 360 KIM CƯƠNG — SUSANOO ↔ LỤC ĐẠO TIÊN NHÂN)
    TB_RegisterSkin({
      id: 'madara',
      tier: 'transcendent',
      name: 'Uchiha Madara (Susanoo ↔ Lục Đạo)',
      awakenedTitle: 'MADARA — LỤC ĐẠO TIÊN NHÂN & THIÊN CHƯỚNG TINH',
      icon: '👁️',
      coins: 27000,
      dia: 360,
      env: {
        name: 'Infinite Tsukuyomi Moon',
        desc: 'Dạng thường bọc Susanoo Xanh <-> Nhấn F hóa Lục Đạo Tiên Nhân 9 Hắc Cầu Đạo Ngọc xóa sổ mọi bẫy!',
        sky: 'galaxy',
        solidHue: 265,
        grassHue: 290,
        tint: 'rgba(168,85,247,.06)',
        fx: 'sparks',
        rate: 28,
      },
      passive: {
        id: 'sixpaths',
        name: 'Susanoo Hoàn Mỹ & Lục Đạo Cầu Đạo Ngọc',
        desc: '👁️ Dạng Thường: Khung xương Susanoo chặn đòn & chém kiếm khí xanh! 🌑 Khi Thức Tỉnh Lục Đạo (nhấn F): 9 Hắc Cầu Đạo Ngọc xoay quanh người tự động bắn tan xác mọi bẫy phía trước & Bất tử hoàn toàn!',
      },
      trail: ['#a855f7', '#38bdf8', '#090d16'],
      pal: { body: '#991b1b', edge: '#090d16', inner: '#a855f7', belly: 'rgba(255,255,255,.9)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const rikudo = !!(P && P.awakened);
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;
        const sway = Math.sin(T * 6) * 2.2 - Math.max(-4, Math.min(4, vx * 0.45));

        if (!rikudo) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56,189,248,.65)';
          ctx.lineWidth = 3;
          for (let r = 0; r < 3; r++) {
            ctx.beginPath();
            ctx.ellipse(0, -22 + r * 6 + bob, 20, 5, 0, 0, Math.PI);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.save();
          for (let k = 0; k < 9; k++) {
            const a = (k / 9) * Math.PI * 2 + T * 2.5;
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
          ctx.moveTo(15, -38 + bob);
          ctx.lineTo(15, -2 + bob);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(15, -42 + bob, 5, 0, 6.3);
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: rikudo ? '#f8fafc' : '#1e1b4b',
          shirtHi: rikudo ? '#ffffff' : '#dc2626',
          shirt: rikudo ? '#e2e8f0' : '#991b1b',
          belt: rikudo ? '#090d16' : '#f8fafc',
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#f8fafc',
          eye: '#a855f7',
          serious: true,
        });

        ctx.fillStyle = rikudo ? '#f1f5f9' : '#0f172a';
        ctx.strokeStyle = rikudo ? '#94a3b8' : '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14.5, hy + 6);
        ctx.quadraticCurveTo(-25 + sway, hy + 18, -19 + sway, hy + 30);
        ctx.lineTo(-11, hy + 16);
        ctx.lineTo(-20 + sway, hy - 5);
        ctx.lineTo(-9, hy - 4);
        ctx.lineTo(-11 + sway, hy - 16);
        ctx.lineTo(-1, hy - 6);
        ctx.lineTo(6 + sway, hy - 17);
        ctx.lineTo(10, hy - 4);
        ctx.lineTo(20 + sway, hy - 7);
        ctx.lineTo(14.5, hy + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      },
    });

    // 6. SON GOKU (15.000 XU + 220 KIM CƯƠNG — BASE ↔ MASTERED ULTRA INSTINCT)
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
        desc: 'Nhấn F (hoặc đứng gồng Ki) hóa Bản Năng Vô Cực Tóc Bạc + Tự động bắn Kamehameha kéo dài!',
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
        desc: 'Tự động lướt né sát thương chí mạng + Tự động phóng Tia Chưởng Kamehameha Xanh-Trắng xuyên phá bẫy phía trước! Nhấn F để chuyển đổi Tóc Đen ↔ Tóc Bạc Ultra Instinct!',
      },
      trail: ['#e2e8f0', '#38bdf8', '#a855f7'],
      pal: { body: '#f97316', edge: '#9a3412', inner: '#1d4ed8', belly: 'rgba(30,64,175,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const mui = !!(P && (P.awakened || (P.gokuForm || 0) >= 3));
        const sway = Math.sin(T * 6.5) * 1.6 - Math.max(-3, Math.min(3, vx * 0.35));
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

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

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
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
        draw3DChibiHead(ctx, bob, T, {
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
    });

    // 7. LUFFY (14.000 XU + 200 KIM CƯƠNG — DẠNG THƯỜNG MŨ RƠM ↔ GEAR 5 THẦN NIKA)
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
        desc: 'Dạng thường đội Nón Rơm áo đỏ -> Nhấn F hóa Gear 5 Nika + Tự phóng Nắm Đấm Cao Su Haki Khổng Lồ!',
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
        desc: 'Chạm vào gai nhọn, cưa máy hay búa đập sẽ biến thành cao su bật Luffy nảy lên trời + Tự động phóng Cánh Tay Cao Su Khổng Lồ bọc Haki Sét Đỏ-Đen phá bẫy! Nhấn F để hóa Gear 5!',
      },
      trail: ['#ffffff', '#e0aaff', '#ff0055'],
      pal: { body: '#ffffff', edge: '#7e22ce', inner: '#ef4444', belly: 'rgba(243,232,255,.95)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const gear5 = !!(P && P.awakened);
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

        if (!gear5) {
          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
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

          draw3DChibiHead(ctx, bob, T, {
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
          ctx.fillStyle = 'rgba(255,255,255,.95)';
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
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(-15, -22 + bob, 5.5, 11, -0.35, 0, 6.3);
          ctx.fill();
          ctx.stroke();

          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
            shoe: '#78350f',
            pants: '#ffffff',
            shirtHi: '#ffffff',
            shirt: '#f1f5f9',
            belt: '#9333ea',
          });
          draw3DChibiHead(ctx, bob, T, {
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
    });

    // 8. SAITAMA (12.000 XU + 180 KIM CƯƠNG — NGƠ NGÁC ↔ SERIOUS MODE HẮC HỎA & NẮM ĐẤM 3D)
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
        desc: 'Khi ở Serious Mode (nhấn F hoặc sau khi chết 1 lần): Bốc sát khí Đỏ-Đen, đá bay lơ lửng quanh chân & Tự động phóng Nắm Đấm Găng Đỏ 3D Khổng Lồ nghiền nát bẫy phía trước!',
      },
      trail: ['#ffd43b', '#ef4444', '#ffffff'],
      pal: { body: '#ffd43b', edge: '#b45309', inner: '#ef4444', belly: 'rgba(255,255,255,.9)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const serious = !!(P && (P.awakened || G.deaths >= 1 || P.attackAnimT > 0));
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

        if (serious) {
          const sg = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 44);
          sg.addColorStop(0, 'rgba(220,38,38,.55)');
          sg.addColorStop(0.5, 'rgba(15,23,42,.45)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(0, -24 + bob, 44, 0, 6.3);
          ctx.fill();

          ctx.fillStyle = '#64748b';
          for (let r = 0; r < 4; r++) {
            const rx = -22 + r * 14;
            const ry = -6 - ((T * 35 + r * 9) % 28);
            ctx.fillRect(rx, ry, 4, 4);
          }
        }

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
          ctx.moveTo(-10, -27 + bob);
          const topX = -34 - wind;
          const topY = -36 + bob + Math.sin(T * 12) * 5;
          ctx.quadraticCurveTo(-24 - wind * 0.5, -34 + bob, topX, topY);
          for (let k = 1; k <= 4; k++) {
            const u = k / 4;
            const px = topX + (-12 - topX) * u + Math.sin(T * 14 + k * 1.6) * 4;
            const py = topY + (-2 + bob - topY) * u;
            ctx.lineTo(px, py);
          }
          ctx.lineTo(8, -4 + bob);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
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

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          baldFacial: true,
          awakened: serious,
        });
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath();
        ctx.ellipse(-4, hy + 4, 5, 2.4, -0.3, 0, 6.3);
        ctx.fill();

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
    });

    // 9. NARUTO (12.000 XU + 180 KIM CƯƠNG — PHÂN THÂN THỰC THỂ & 9 ĐUÔI BARYON KURAMA)
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
        desc: 'Tự động gọi 2 Phân Thân chạy trước dò bẫy & gom xu + Nhấn F bật 9 đuôi Cửu Vĩ uốn lượn mềm mại!',
        sky: 'ember',
        solidHue: 25,
        grassHue: 115,
        tint: 'rgba(255,140,0,.05)',
        fx: 'embers',
        rate: 22,
      },
      passive: {
        id: 'kurama',
        name: 'Đa Trọng Ảnh Phân Thân & Phong Độn Rasenshuriken',
        desc: '🦊 Tự động gọi 2 Phân Thân Ảnh chạy phía trước ăn xu & cảm tử phá bẫy hộ bạn! Tự động phóng Rasenshuriken 4 cánh xoay! Nhấn F để bật 9 đuôi lửa Baryon Kurama uốn lượn!',
      },
      trail: ['#ff922b', '#ef4444', '#38bdf8'],
      pal: { body: '#fb923c', edge: '#1e293b', inner: '#facc15', belly: 'rgba(30,41,59,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const baryon = !!(P && P.awakened);
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

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

        draw3DChibiHead(ctx, bob, T, {
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
        ctx.beginPath();
        ctx.roundRect(-14, hy + 1.5, 28, 5.8, 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(-2, hy + 2.2, 12, 4.4, 1.5);
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
    });

    // 10. PIKACHU (10.000 XU + 150 KIM CƯƠNG — GIGANTAMAX VOLT)
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
        desc: 'Tai và đuôi tia chớp đung đưa đàn hồi mượt mà + Tự động phóng mũi lao Sấm Sét 100.000V!',
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
        desc: 'Chạy siêu tốc +35%, Nhảy Đôi & Tự động phóng Mũi Lao Sấm Sét 100.000V hủy diệt bẫy và cá mập phía trước! Nhấn F để bật trạng thái Gigantamax Super Charged!',
      },
      trail: ['#ffe066', '#ffd43b', '#38bdf8'],
      pal: { body: '#fde047', edge: '#854d0e', inner: '#ef4444', belly: 'rgba(254,249,195,.9)' },
      renderCharacter(ctx, { bob, ph, run, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
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
        ctx.beginPath();
        ctx.roundRect(-14.5, -37 + bob, 29, 36 - bob, 14);
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

  window.TB_RunMultiverseAutoCombat = function (P, L, G, curPassive, v20LaunchUniqueSkill, v20FindFrontOrOverheadThreat, v20DestroyTarget, sparkle, puff, Snd, STEP, PW, PH) {
    if (!P || !L || P.dead || G.won) return;
    const cx = P.x + PW / 2, cy = P.y + PH / 2, face = P.face >= 0 ? 1 : -1;

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
      const nearThreat = v20FindFrontOrOverheadThreat(P, L, 165);
      if (nearThreat) {
        sparkle(nearThreat.x, nearThreat.y, 16, 1.6, '#ff4d6d');
        G.groundShockwaves.push({ x: nearThreat.x, y: nearThreat.y, r: 8, maxR: 95, col: '#ef4444', life: 0.3 });
        v20DestroyTarget(L, nearThreat);
      }
    }

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

    if (curPassive === 'kurama') {
      while (FX4D.clones.length < 2) {
        FX4D.clones.push({ offX: (FX4D.clones.length + 1) * 62, x: cx + face * 60, y: P.y, respawnT: 0 });
      }
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
          cl.respawnT = 1.8;
        }
      }
    } else if (FX4D.clones.length > 0) FX4D.clones.length = 0;

    const cdTarget = P.awakened ? 1.35 : 2.4;
    if (!(P.skillCd > 0)) {
      const threat = v20FindFrontOrOverheadThreat(P, L, 410);
      if (threat) {
        const ang = Math.atan2(threat.y - cy, threat.x - cx);
        if (curPassive === 'shrine' || (curPassive === 'santoryu' && P.awakened)) {
          P.skillCd = cdTarget;
          spawn4DSlash(threat.x, threat.y, ang, 110, curPassive === 'shrine' ? '#ef4444' : '#a855f7', '#ffffff');
          spawn4DSlash(threat.x, threat.y, ang + 1.2, 95, '#090d16', '#00f5d4');
          v20DestroyTarget(L, threat);
          Snd.slam();
        } else {
          const styleMap = {
            limitless: { speed: 16, r: P.awakened ? 38 : 26, kind: 'hollow_purple', life: 1.2, cd: cdTarget },
            azathoth: { speed: 15.5, r: P.awakened ? 36 : 24, kind: 'hollow_purple', life: 1.15, cd: cdTarget },
            sixpaths: { speed: 16.5, r: 32, kind: 'hollow_purple', life: 1.15, cd: cdTarget },
            saiyan: { speed: 16.5, r: P.awakened ? 32 : 24, kind: 'kamehameha', life: 1.1, cd: cdTarget },
            onepunch: { speed: 17, r: P.awakened ? 38 : 28, kind: 'serious_fist', life: 1.0, cd: cdTarget },
            nika: { speed: 15, r: P.awakened ? 34 : 26, kind: 'bajrang_fist', life: 1.0, cd: cdTarget },
            kurama: { speed: 15.5, r: P.awakened ? 32 : 24, kind: 'rasenshuriken', life: 1.15, cd: cdTarget },
            pikachu: { speed: 18, r: P.awakened ? 32 : 24, kind: 'thunderbolt', life: 0.95, cd: cdTarget },
            santoryu: { speed: 16, r: 28, kind: 'dragon_slash', life: 1.0, cd: cdTarget },
          };
          const st = styleMap[curPassive];
          if (st) v20LaunchUniqueSkill(P, L, st, false);
        }
      }
    }
  };

  window.TB_DrawMultiverse4DFX = function (ctx, G, drawBunny, PW, PH) {
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

fs.writeFileSync(heroesPath, animeHeroesPartA, 'utf8');
console.log('✅ [V22.0] Đã tạo thành công file riêng public/anime_heroes.js!');

const v22MasterPayload = `
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

G.skillShots = [];
G.groundShockwaves = [];
G.cursedConsumed = new Set();
G.chaosSeed = 1;

const SKILL_COOLDOWN = 2.4;
const GUARD_COOLDOWN = 5.0;

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
  const cx = P.x + PW / 2, cy = P.y + PH / 2;
  sparkle(cx, cy, 32, 2.2, (cfg.trail && cfg.trail[0]) || '#00f5d4');
  G.groundShockwaves.push({
    x: cx, y: P.y + PH, r: 10, maxR: 155,
    col: (cfg.trail && cfg.trail[0]) || '#38bdf8', life: 0.45,
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

// HỆ THỐNG CLOUD SYNC TỰ PHỤC HỒI KHI NOT_FOUND & MÃ SAO LƯU VĨNH VIỄN:
(function patchCloudSyncWithErrorRecovery() {
  const origSync = window.doCloudSync || window.syncCloud;
  window.doCloudSync = async function(isUpload) {
    try {
      if (typeof origSync === 'function') return await origSync(isUpload);
    } catch (err) {
      if (err && String(err).includes('not_found')) {
        toast('☁️ Mã Cloud chưa tồn tại — Đang tự đăng ký mã mới trên Server…');
        try {
          const res = await fetch('/api/sync/create', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Save.exportAll()) });
          const json = await res.json();
          if (json && json.ok) {
            toast('✅ Đã tạo & đồng bộ Cloud thành công!');
            return true;
          }
        } catch (e2) {}
      }
      toast('⚠️ Lỗi đồng bộ Cloud (Đã lưu cục bộ an toàn)');
    }
  };
})();

function v20FindFrontOrOverheadThreat(P, L, maxRange) {
  if (!P || !L) return null;
  const cx = P.x + PW / 2, cy = P.y + PH / 2, face = P.face >= 0 ? 1 : -1;
  let best = null, bestDist = maxRange || 420;

  const checkTarget = (tx, ty, kind, ref) => {
    const dx = tx - cx, dy = ty - cy, dist = Math.hypot(dx, dy);
    if (dist > (maxRange || 420) || dist < 12) return;
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
  (L.navalMines || []).forEach((mn) => checkTarget(mn.x, mn.y, 'naval_mine', mn));
  (L.jellyfish || []).forEach((jf) => checkTarget(jf.x, jf.y, 'jellyfish', jf));
  (L.stageBosses || []).forEach((bs) => checkTarget(bs.x, bs.y, 'boss', bs));
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
  const removeFrom = (arr) => {
    if (!arr) return;
    const idx = arr.indexOf(ref);
    if (idx >= 0) arr.splice(idx, 1);
  };
  if (kind === 'stalactite') removeFrom(L.stalactites);
  else if (kind === 'boulder') removeFrom(L.boulders);
  else if (kind === 'shark') removeFrom(L.sharks);
  else if (kind === 'laser') removeFrom(L.lasers);
  else if (kind === 'turret') removeFrom(L.turrets);
  else if (kind === 'pendulum') removeFrom(L.pendulums);
  else if (kind === 'naval_mine') removeFrom(L.navalMines);
  else if (kind === 'jellyfish') removeFrom(L.jellyfish);
  else if (kind === 'boss') removeFrom(L.stageBosses);
  else if (kind === 'doppel' && L.anomalies) {
    G.cursedConsumed.add(ref.id);
    removeFrom(L.anomalies.doppels);
  } else if (kind === 'ghost' && L.anomalies) {
    G.cursedConsumed.add(ref.id);
    removeFrom(L.anomalies.ghosts);
  } else if (kind === 'glob') ref.glob = null;
  else if (kind === 'spitter' && L.anomalies) removeFrom(L.anomalies.spitters);
  else if (kind === 'mimic_coin') {
    G.cursedConsumed.add(ref.cid);
    ref.anomaly = 0;
    ref.trig = false;
  }
}

function v20LaunchUniqueSkill(P, L, style, manual) {
  if (!P || !L || P.skillCd > 0) return false;
  const cx = P.x + PW / 2, cy = P.y + PH / 2, face = P.face >= 0 ? 1 : -1;
  const threat = v20FindFrontOrOverheadThreat(P, L, 390);
  if (!threat && !manual) return false;

  let dx = face, dy = 0;
  if (threat) { dx = threat.x - cx; dy = threat.y - cy; }
  const dist = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / dist, uy = dy / dist, spd = style.speed || 15;

  P.skillCd = style.cd || SKILL_COOLDOWN;
  P.attackAnimT = 0.42;

  G.skillShots.push({
    x0: cx + ux * 18, y0: cy + uy * 14,
    x: cx + ux * 22, y: cy + uy * 14,
    vx: ux * spd, vy: uy * spd,
    ang: Math.atan2(uy, ux),
    r: style.r || 28,
    kind: style.kind || 'hollow_purple',
    life: style.life || 0.95,
  });
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
        v20DestroyTarget(L, { x: tx, y: ty, kind, ref });
        hit = true;
      }
    };
    (L.stalactites || []).slice().forEach((q) => checkHit(q.x + q.w / 2, q.y + (q.fy || 0) + q.h / 2, 24, 'stalactite', q));
    (L.boulders || []).slice().forEach((b) => checkHit(b.cx, b.y - b.r, b.r, 'boulder', b));
    (L.sharks || []).slice().forEach((sh) => checkHit(sh.cx, sh.cy, 38, 'shark', sh));
    (L.lasers || []).slice().forEach((ls) => checkHit(ls.x, ls.y, 24, 'laser', ls));
    (L.turrets || []).slice().forEach((trt) => checkHit(trt.x, trt.y, 24, 'turret', trt));
    (L.navalMines || []).slice().forEach((mn) => checkHit(mn.x, mn.y, mn.r, 'naval_mine', mn));
    (L.jellyfish || []).slice().forEach((jf) => checkHit(jf.x, jf.y, 24, 'jellyfish', jf));
    (L.stageBosses || []).slice().forEach((bs) => checkHit(bs.x, bs.y, 36, 'boss', bs));
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

    if (s.kind === 'serious_fist') {
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
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = '#dc2626';
        rr(10, -16 + k * 8.2, 10, 7.5, 3.5);
        ctx.fill();
        ctx.stroke();
      }
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
      const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 36);
      rg.addColorStop(0, '#ffffff');
      rg.addColorStop(0.35, '#d8b4fe');
      rg.addColorStop(0.7, '#7e22ce');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }
}
`;
// === KẾT THÚC PHẦN 2 / 4 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 3 / 4 DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 3 / 4 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 2 / 4 ===
const v215CoreAndPhysicsPart3 = `
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
  L.navalMines = L.navalMines || [];
  L.jellyfish = L.jellyfish || [];
  L.stageBosses = L.stageBosses || [];
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
// === KẾT THÚC PHẦN 3 / 4 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 4 / 4 (PHẦN CUỐI) DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 4 / 4 (PHẦN CUỐI) — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 3 / 4 ===
const v215WorldAndLevelsPart4 = `
// ============================================================================
// 8. VÒNG LẶP STEPPLAYER, UPDATEWORLD, DIE (VÔ HẠN VĨNH VIỄN KHI THỨC TỈNH) & RESPAWN
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
    // SỬA TRIỆT ĐỂ LỖI KẸT TRÊN TRỜI / SÁT TRẦN Ở MÀN ĐẢO CHIỀU:
    // Kiểm tra xem đó thực sự là bề mặt thềm đất hay chỉ là va chạm cạnh trần:
    const isRoofHit = s[3] <= 90 && P.py >= s[1] + s[3] - 14 && P.vy < 0;
    if (isRoofHit) {
      P.y = s[1] + s[3];
      P.vy = 2.5; // Đẩy nhẹ xuống đất ngay lập tức, không bao giờ để kẹt sát trần!
    } else if (gDir > 0) {
      if (P.vy > 0 || feet0 <= s[1] + 28) {
        P.y = s[1] - PH;
        P.onGround = true;
        P.onIce = !!s.ice;
      } else {
        P.y = s[1] + s[3];
      }
    } else {
      if (P.vy < 0) {
        P.y = s[1] + s[3];
        P.onGround = true;
        P.onIce = !!s.ice;
      } else {
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

  // BẤT TỬ VĨNH VIỄN 100% KHI ĐANG THỨC TỈNH (0 GIÂY HỒI CHIÊU):
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
// 10. TRÌNH KIẾN TẠO 300 MÀN CHƠI (100 SOLO / 100 CO-OP / 100 PARTY)
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

  function makeV215Stage(mode, idx) {
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
          : '👻 CẢNH BÁO QUỶ DỊ: Nhấn F / 🔥 để Biến Hình Thức Tỉnh Anime — Kỹ năng tự động tìm diệt mục tiêu!',
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
        return makeV215Stage('solo', i);
      } finally {
        V11.ctx = null;
      }
    });
    LEVELS.coop.push(() => {
      V11.ctx = { mode: 'coop', i };
      try {
        return makeV215Stage('coop', i);
      } finally {
        V11.ctx = null;
      }
    });
    LEVELS.party.push(() => {
      V11.ctx = { mode: 'party', i };
      try {
        return makeV215Stage('party', i);
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
  v22MasterPayload +
  '\n' +
  animeHeroesPartB +
  '\n' +
  v215CoreAndPhysicsPart3 +
  '\n' +
  v215WorldAndLevelsPart4 +
  '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V22.0 ANIME 4D MASTER] Đã tích hợp hoàn chỉnh 100% public/anime_heroes.js & public/game.js!');

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
    html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=22.0');
  }
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V22.0] Đã tự động nhúng anime_heroes.js?v=22.0 và game.js?v=22.0 vào index.html');
}
