/**
 * Tether Bunnies v21.0 - 4D ANIME MULTIVERSE & BIOME-EXCLUSIVE ARCHITECTURE (PHẦN 1 / 3)
 *  - Tự động sinh file riêng `public/anime_heroes.js` chuyên trách Hệ thống Skill Tự Động & Đồ họa 3D/4D
 *  - Gojo Satoru chuẩn nguyên tác:
 *      + Cầu Xanh (Blue): Tự động HÚT toàn bộ Xu, Kim Cương, Chìa khóa & gom bẫy nhỏ
 *      + Cầu Đỏ (Red): Tự động ĐẨY BẬT mọi đá lăn, cá mập, thạch nhũ, quái vật áp sát
 *      + Khi Thức Tỉnh (F): Vô Hạ Hạn bật VĨNH VIỄN (0s hồi chiêu, bất tử hoàn toàn) + Tự động bắn Hư Thức: Tử 4D!
 *  - Rimuru Tempest: Dạng Thường là Slime 3D trong suốt đàn hồi <-> Thức Tỉnh hóa Chân Ma Vương Cánh Rồng Đen Azathoth!
 *  - Roronoa Zoro: Dạng Thường 1 đầu <-> Thức Tỉnh hóa Quỷ Khí Asura 3 Đầu 6 Tay 9 Kiếm chém rách không gian!
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
].forEach((mk) => {
  if (code.includes(mk)) code = code.slice(0, code.indexOf(mk)) + '})();\n';
});

const lastClose = code.lastIndexOf('})();');
if (lastClose === -1) {
  console.error('❌ Không tìm thấy })(); ở cuối game.js');
  process.exit(0);
}

// ============================================================================
// FILE RIÊNG 1: public/anime_heroes.js (CHUYÊN BIỆT CHO SKILL & HIỆU ỨNG 3D/4D)
// ============================================================================
const animeHeroesFileContent = `/**
 * TETHER BUNNIES - ANIME HEROES & 4D VISUAL FX ENGINE (public/anime_heroes.js)
 * File độc lập chuyên xử lý:
 *  - Tạo hình 2 trạng thái (Dạng Thường <-> Dạng Thức Tỉnh) hoàn toàn khác biệt
 *  - Kỹ năng Tự Động Tìm & Diệt Mục Tiêu (Auto-Combat AI) không cần bấm phím E
 *  - Hiệu ứng 3D/4D: Nứt vỡ không gian (Spatial Shatter), Bóng ma tốc độ (Afterimage Trail),
 *    Phân thân thực thể (Naruto Clones), Lực Hút Thương (Blue) & Lực Đẩy Hách (Red) của Gojo
 */
(function () {
  'use strict';

  const FX4D = {
    slashes: [],
    afterimages: [],
    clones: [],
    blackHoles: [],
    domainFlash: 0,
    domainCol: '#38bdf8',
  };
  window.TB_FX4D = FX4D;

  // Thêm vết chém nứt vỡ không gian 4D (Dùng cho Zoro Asura, Sukuna, Gojo, Madara):
  function spawn4DSlash(x, y, ang, len, col1, col2) {
    FX4D.slashes.push({ x, y, ang, len, col1, col2, life: 0.42, maxLife: 0.42 });
  }
  window.TB_Spawn4DSlash = spawn4DSlash;

  // Vẽ nền 3D Chibi có đổ bóng Specular Lighting & Quần áo nhiều lớp:
  function draw3DChibiLimbs(ctx, bob, ph, run, air, T, cfg) {
    const fo = run ? Math.sin(ph) * 5.6 : 0;
    const fy = air ? -3.5 : -1.2;
    const breath = Math.sin(T * 5.2) * 0.65;
    const armSwing = run ? Math.cos(ph) * 4.8 : Math.sin(T * 4.5) * 1.6;

    // Bóng đổ 3D dưới mặt đất
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 4, 0, 0, 6.3);
    ctx.fill();

    // Đôi giày có vệt sáng 3D
    ctx.fillStyle = cfg.shoe || '#0f172a';
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-6 + fo, fy, 6, 3.4, 0, 0, 6.3);
    ctx.ellipse(6 - fo, fy, 6, 3.4, 0, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Quần 3D
    ctx.fillStyle = cfg.pants || '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-11.5, -13.5 + bob, 23, 12 - bob * 0.3, 5.5);
    ctx.fill();
    ctx.stroke();

    // Tay sau
    ctx.fillStyle = cfg.sleeve || cfg.shirt || '#334155';
    ctx.beginPath();
    ctx.ellipse(-11.5 - armSwing * 0.5, -19 + bob, 3.8, 5.6, 0.25, 0, 6.3);
    ctx.fill();
    ctx.stroke();

    // Thân áo 3D (3-stop gradient tạo độ cong khối trụ)
    const bg = ctx.createLinearGradient(-12, -27 + bob, 12, -11 + bob);
    bg.addColorStop(0, cfg.shirtHi || cfg.shirt || '#475569');
    bg.addColorStop(0.5, cfg.shirt || '#1e293b');
    bg.addColorStop(1, cfg.shirtDark || '#090d16');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(-12.5, -26.5 + bob + breath * 0.4, 25, 14.5, 6.5);
    ctx.fill();
    ctx.stroke();

    if (cfg.belt) {
      ctx.fillStyle = cfg.belt;
      ctx.fillRect(-12, -14.5 + bob, 24, 3.5);
    }

    // Tay trước
    ctx.fillStyle = cfg.sleeve || cfg.shirtHi || cfg.shirt || '#334155';
    ctx.beginPath();
    ctx.ellipse(11.5 + armSwing * 0.5, -19 + bob, 3.8, 5.6, -0.25, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  }

  function draw3DChibiHead(ctx, bob, T, cfg) {
    const breath = Math.sin(T * 5.2) * 0.55;
    const hy = -44.5 + bob + breath;

    const fg = ctx.createRadialGradient(-4, hy + 6, 2, 0, hy + 10, 19);
    fg.addColorStop(0, cfg.skinHi || '#fff7ed');
    fg.addColorStop(0.7, cfg.skin || '#ffe0c8');
    fg.addColorStop(1, '#f5cba7');
    ctx.fillStyle = fg;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-14.5, hy, 29, 21, 10.5);
    ctx.fill();
    ctx.stroke();

    // Viền sáng 3D Rim Light bên sườn mặt
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-6, hy + 8, 7, Math.PI * 0.9, Math.PI * 1.45);
    ctx.stroke();

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
      ctx.arc(1.3, hy + 9.6, 1.1, 0, 6.3);
      ctx.arc(9.3, hy + 9.6, 1.1, 0, 6.3);
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

    // Vết ấn chú Sukuna hoặc Rinnegan (nếu có)
    if (cfg.faceMarks === 'sukuna') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, hy + 3);
      ctx.lineTo(6, hy + 5);
      ctx.lineTo(9, hy + 3);
      ctx.moveTo(-2, hy + 14);
      ctx.lineTo(1, hy + 15);
      ctx.moveTo(11, hy + 14);
      ctx.lineTo(14, hy + 15);
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

  window.TB_Draw3DLimbs = draw3DChibiLimbs;
  window.TB_Draw3DHead = draw3DChibiHead;

  // Khởi tạo danh sách Anh Hùng & Ma Vương khi Engine sẵn sàng:
  window.TB_InitAllMultiverseHeroes = function (TB_RegisterSkin) {
    // ==========================================================================
    // 1. SATORU GOJO (BẬC VÔ HẠN ✦ ĐỘC TÔN — 30.000 XU + 400 KIM CƯƠNG)
    //    - Cầu Xanh (Blue): Tự động HÚT xu, kim cương, chìa khóa & gom mục tiêu
    //    - Cầu Đỏ (Red): Tự động ĐẨY BẬT mọi đá lăn, cá mập, đạn độc, thạch nhũ
    //    - Khi Thức Tỉnh (F): Vô Hạ Hạn bật VĨNH VIỄN (Bất tử 100%, không cần hồi!)
    //      & Cầu Đỏ + Cầu Xanh tự động hợp nhất bắn Hư Thức: Tử 4D!
    // ==========================================================================
    TB_RegisterSkin({
      id: 'gojo',
      tier: 'transcendent',
      name: 'Satoru Gojo (Lục Nhãn Vô Cực)',
      awakenedTitle: 'GOJO SATORU — VÔ LƯƠNG KHÔNG XỨ & HƯ THỨC: TỬ',
      icon: '🌌',
      coins: 30000,
      dia: 400,
      env: {
        name: 'Lãnh Địa Vô Lương Không Xứ 4D',
        desc: 'Cầu Xanh HÚT vật phẩm, Cầu Đỏ ĐẨY BẬT cạm bẫy; khi Thức Tỉnh (F) Vô Hạ Hạn bảo vệ VĨNH VIỄN + Tự bắn Hư Thức: Tử!',
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
        desc: '🔵 Cầu Xanh tự động HÚT toàn bộ Xu/Kim Cương/Chìa Khóa về người! 🔴 Cầu Đỏ tự động ĐẨY VĂNG đá lăn, cá mập, thạch nhũ áp sát! 🌌 Khi Thức Tỉnh (nhấn F): Vô Hạ Hạn bật VĨNH VIỄN (Bất tử 100% không hồi chiêu) & Tự động bắn Hư Thức: Tử xóa sổ mọi bẫy!',
      },
      trail: ['#38bdf8', '#c084fc', '#ef4444'],
      pal: { body: '#0f172a', edge: '#38bdf8', inner: '#a855f7', belly: 'rgba(56,189,248,.5)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const awk = !!(P && P.awakened);
        const sway = Math.sin(T * 6.5) * 2.0 - Math.max(-3.5, Math.min(3.5, vx * 0.45));
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

        // Vòm Không Gian Vô Hạ Hạn 4D (Khi Thức Tỉnh biến thành lỗ đen ngân hà đa tầng!)
        if (awk) {
          ctx.save();
          const dg = ctx.createRadialGradient(0, -24 + bob, 4, 0, -24 + bob, 52);
          dg.addColorStop(0, 'rgba(255,255,255,.65)');
          dg.addColorStop(0.35, 'rgba(56,189,248,.45)');
          dg.addColorStop(0.7, 'rgba(147,51,234,.35)');
          dg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = dg;
          ctx.beginPath();
          ctx.arc(0, -24 + bob, 52, 0, 6.3);
          ctx.fill();
          // Vòng kết giới không gian xoay ngược chiều nhau
          ctx.strokeStyle = 'rgba(0,245,212,.75)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(0, -24 + bob, 38, 12, T * 3, 0, 6.3);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(239,68,68,.75)';
          ctx.beginPath();
          ctx.ellipse(0, -24 + bob, 38, 12, -T * 3, 0, 6.3);
          ctx.stroke();
          ctx.restore();
        }

        draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
          shoe: '#090d16',
          pants: '#0f172a',
          shirtHi: awk ? '#4c1d95' : '#312e81',
          shirt: '#0f172a',
          shirtDark: '#020617',
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
          // Dạng thường: Băng bịt mắt đen ánh Lục Nhãn ngầm
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
          // Dạng Thức Tỉnh: Lục Nhãn phát tia hào quang xanh biếc kéo dài!
          ctx.save();
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#00f5d4';
          ctx.beginPath();
          ctx.arc(2.1, hy + 11, 2.8, 0, 6.3);
          ctx.arc(10.1, hy + 11, 2.8, 0, 6.3);
          ctx.fill();
          ctx.strokeStyle = '#e0f2fe';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(2, hy + 10);
          ctx.lineTo(-10 - sway, hy + 4);
          ctx.moveTo(10, hy + 10);
          ctx.lineTo(22 - sway, hy + 4);
          ctx.stroke();
          ctx.restore();
        }

        // Mái tóc bạch kim uốn lượn mềm mại
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = awk ? '#38bdf8' : '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14.5, hy + 7);
        ctx.quadraticCurveTo(-19, hy + 2, -23 + sway, hy - 3);
        ctx.lineTo(-13, hy - 1);
        ctx.quadraticCurveTo(-17, hy - 8, -20 + sway, hy - 13);
        ctx.lineTo(-7, hy - 4);
        ctx.quadraticCurveTo(-5, hy - 12, -3 + sway * 1.2, hy - 18);
        ctx.lineTo(3, hy - 5);
        ctx.quadraticCurveTo(8, hy - 11, 11 + sway, hy - 16);
        ctx.lineTo(11, hy - 4);
        ctx.lineTo(22 + sway * 0.8, hy - 6);
        ctx.lineTo(14.5, hy + 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 🔵 CẦU XANH (THƯƠNG - HÚT) ở phía trước & 🔴 CẦU ĐỎ (HÁCH - ĐẨY) ở phía sau:
        const blueX = 22 + Math.cos(T * 5) * 3;
        const blueY = -20 + bob + Math.sin(T * 5) * 4;
        const redX = -22 - Math.cos(T * 5) * 3;
        const redY = -22 + bob - Math.sin(T * 5) * 4;

        // Vẽ xoáy hút của Cầu Xanh (Blue)
        const bgBlue = ctx.createRadialGradient(blueX, blueY, 1, blueX, blueY, 12);
        bgBlue.addColorStop(0, '#ffffff');
        bgBlue.addColorStop(0.45, '#00f5d4');
        bgBlue.addColorStop(0.8, '#0284c7');
        bgBlue.addColorStop(1, 'rgba(2,132,199,0)');
        ctx.fillStyle = bgBlue;
        ctx.beginPath();
        ctx.arc(blueX, blueY, 12, 0, 6.3);
        ctx.fill();

        // Vẽ xung lực đẩy của Cầu Đỏ (Red)
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
    // 2. RIMURU TEMPEST (BẬC VÔ HẠN ✦ ĐỘC TÔN — 28.000 XU + 380 KIM CƯƠNG)
    //    - Dạng Thường: Slime Chibi 3D trong suốt bóng bẩy cực đáng yêu
    //    - Dạng Thức Tỉnh (F): Chân Ma Vương / Hư Không Thần Azathoth (Hình người tóc xanh bạc dài, 4 Cánh Rồng Đen, Vòng Halo Hư Không)
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
        desc: 'Dạng Thường là Slime 3D bóng bẩy <-> Nhấn F hóa Chân Ma Vương Cánh Rồng Đen & Lỗ Đen Azathoth nuốt chửng mọi bẫy!',
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
        desc: '💧 Dạng Slime: Tự động nảy qua gai nhọn & phun Thủy Nhận cắt bẫy! 🌌 Khi Thức Tỉnh Ma Vương (nhấn F): Mở Lỗ Đen Hư Không Azathoth tự động HÚT & NUỐT CHỬNG toàn bộ đá lăn, thạch nhũ, cá mập, tia laser trên đường đi + Bất tử trước mọi đòn đánh!',
      },
      trail: ['#00f5d4', '#38bdf8', '#7209b7'],
      pal: { body: '#38bdf8', edge: '#0284c7', inner: '#fde047', belly: 'rgba(224,242,254,.88)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const demonLord = !!(P && P.awakened);

        if (!demonLord) {
          // DẠNG THƯỜNG: SLIME CHIBI 3D TRONG SUỐT ĐÀN HỒI MỀM MẠI (Jiggle Physics!)
          const jiggleX = Math.sin(T * 10 + (run ? ph : 0)) * 2.5;
          const jiggleY = Math.cos(T * 10 + (run ? ph : 0)) * 2.2;
          ctx.save();
          ctx.fillStyle = 'rgba(0,0,0,.22)';
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

          // Hình giọt nước Slime bầu bĩnh uốn lượn
          ctx.beginPath();
          ctx.moveTo(-16 - jiggleX, -6 + bob);
          ctx.bezierCurveTo(-18 - jiggleX, -24 + bob + jiggleY, -8, -32 + bob - jiggleY, 0, -33 + bob - jiggleY);
          ctx.bezierCurveTo(8, -32 + bob - jiggleY, 18 + jiggleX, -24 + bob + jiggleY, 16 + jiggleX, -6 + bob);
          ctx.quadraticCurveTo(0, -1 + bob, -16 - jiggleX, -6 + bob);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Điểm lóa sáng 3D trong suốt trên thân Slime
          ctx.fillStyle = 'rgba(255,255,255,.78)';
          ctx.beginPath();
          ctx.ellipse(-7, -23 + bob, 4.8, 2.5, -0.45, 0, 6.3);
          ctx.fill();

          // Đôi mắt đường kẻ vàng kim đặc trưng của Slime Rimuru + Má hồng
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(1.5, -16 + bob, 3, 3.3, 6.1);
          ctx.moveTo(7.5, -16 + bob);
          ctx.arc(10, -16 + bob, 3, 3.3, 6.1);
          ctx.stroke();
          ctx.fillStyle = 'rgba(244,114,182,.45)';
          ctx.beginPath();
          ctx.ellipse(-2, -13 + bob, 2.8, 1.5, 0, 0, 6.3);
          ctx.ellipse(13, -13 + bob, 2.8, 1.5, 0, 0, 6.3);
          ctx.fill();
          ctx.restore();
        } else {
          // DẠNG THỨC TỈNH: CHÂN MA VƯƠNG RIMURU (Cánh Rồng Đen 4D, Vòng Halo Hư Không, Tóc Xanh Bạc Dài & Kiếm Ma Vương!)
          const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;
          const flap = Math.sin(T * 8) * 6;
          const sway = Math.sin(T * 6) * 2.5 - Math.max(-4, Math.min(4, vx * 0.5));

          // Vòng Halo Hư Không Azathoth xoay sau lưng
          ctx.save();
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, -28 + bob, 32 + Math.sin(T * 10) * 2, 0, 6.3);
          ctx.stroke();

          // Đôi Cánh Rồng Đen Hư Không (Black Dragon Wings) sải rộng 2 bên
          ctx.fillStyle = 'rgba(15,23,42,.92)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.8;
          [-1, 1].forEach((dir) => {
            ctx.beginPath();
            ctx.moveTo(dir * 6, -24 + bob);
            ctx.quadraticCurveTo(dir * 28, -44 + bob + flap, dir * 38, -32 + bob + flap);
            ctx.lineTo(dir * 28, -22 + bob + flap * 0.5);
            ctx.lineTo(dir * 34, -12 + bob);
            ctx.lineTo(dir * 8, -16 + bob);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          });
          ctx.restore();

          // Áo choàng đen Ma Vương viền vàng kim + Khăn lông trắng
          draw3DChibiLimbs(ctx, bob, ph, run, air, T, {
            shoe: '#090d16',
            pants: '#0f172a',
            shirtHi: '#1e1b4b',
            shirt: '#090d16',
            belt: '#eab308',
          });
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(-13.5, -28 + bob, 27, 5, 2.5);
          ctx.fill();

          draw3DChibiHead(ctx, bob, T, {
            skin: '#fff1e6',
            eye: '#eab308', // Mắt Hoàng Kim của Chân Ma Vương Rimuru!
            brow: '#38bdf8',
            serious: true,
          });

          // Mái tóc xanh bạc dài thướt tha uốn lượn mềm mại theo gió
          const hg = ctx.createLinearGradient(0, hy - 12, 0, hy + 28);
          hg.addColorStop(0, '#e0f2fe');
          hg.addColorStop(0.5, '#7dd3fc');
          hg.addColorStop(1, '#38bdf8');
          ctx.fillStyle = hg;
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-14.5, hy + 6);
          ctx.quadraticCurveTo(-24 + sway, hy + 16, -20 + sway * 1.4, hy + 28);
          ctx.lineTo(-12, hy + 18);
          ctx.lineTo(-18 + sway, hy - 4);
          ctx.lineTo(-8, hy - 3);
          ctx.lineTo(-3 + sway, hy - 14);
          ctx.lineTo(4, hy - 4);
          ctx.lineTo(12 + sway, hy - 12);
          ctx.lineTo(15, hy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      },
    });

    // ==========================================================================
    // 3. RORONOA ZORO (18.000 XU + 250 KIM CƯƠNG)
    //    - Dạng Thường: Kiếm sĩ 1 đầu áo xanh lục Wano
    //    - Dạng Thức Tỉnh (F): QUỶ KHÍ ASURA 3 ĐẦU 6 TAY 9 THANH KIẾM bọc lửa Haki Đen-Đỏ-Tím!
    // ==========================================================================
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
        desc: '⚔️ Dạng Thường: Tự động phóng kiếm khí Phi Long Hoả! 👹 Khi Thức Tỉnh (nhấn F): Hiện thân Quỷ Thần Asura 3 Đầu 6 Tay 9 Kiếm bọc Haki Bá Vương — Tự động tung vết chém không gian 4D chữ X xóa sổ mọi cạm bẫy trong tầm nhìn!',
      },
      trail: ['#10b981', '#a855f7', '#ef4444'],
      pal: { body: '#15803d', edge: '#052e16', inner: '#a855f7', belly: 'rgba(16,185,129,.7)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const asura = !!(P && P.awakened);
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

        if (asura) {
          // DẠNG THỨC TỈNH ASURA: Hào quang Quỷ Thần Tím-Đỏ + 2 ĐẦU PHỤ HAI BÊN + 6 CÁNH TAY CẦM KIẾM XOÈ RỘNG!
          ctx.save();
          const ag = ctx.createRadialGradient(0, -26 + bob, 4, 0, -26 + bob, 48);
          ag.addColorStop(0, 'rgba(168,85,247,.65)');
          ag.addColorStop(0.5, 'rgba(220,38,38,.35)');
          ag.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(0, -26 + bob, 48, 0, 6.3);
          ctx.fill();

          // 6 Thanh Kiếm trên 6 Cánh Tay Asura xoè hình quạt phía sau lưng, lưỡi kiếm bốc lửa Haki Đen-Tím-Xanh!
          for (let s = 0; s < 6; s++) {
            const ang = -2.5 + (s / 5) * 2.0 + Math.sin(T * 10 + s) * 0.08;
            ctx.save();
            ctx.translate(0, -20 + bob);
            ctx.rotate(ang);
            // Chuôi kiếm & Chắn kiếm vàng
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(8, -2, 8, 4);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(15, -5, 2.5, 10);
            // Lưỡi kiếm bọc Haki Diêm Vương
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

          // 2 Chiếc Đầu Phụ của Asura nhìn sang 2 bên trái/phải
          [-18, 18].forEach((ox) => {
            ctx.save();
            ctx.translate(ox, 4);
            ctx.scale(0.75, 0.75);
            draw3DChibiHead(ctx, bob, T, { skin: '#ffedd5', eye: '#ef4444', serious: true });
            ctx.fillStyle = '#090d16';
            ctx.fillRect(-14, hy, 28, 7); // Khăn trùm đầu đen của Zoro khi nghiêm túc!
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
        });

        draw3DChibiHead(ctx, bob, T, {
          skin: '#ffedd5',
          eye: asura ? '#ef4444' : '#0f172a',
          serious: true,
        });

        if (asura) {
          // Khi Thức Tỉnh Asura: Đội khăn bandana đen trùm đầu chiến đấu!
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(-14.5, hy - 1, 29, 9, 4);
          ctx.fill();
          ctx.stroke();
        } else {
          // Dạng thường: Tóc xanh rêu Marimo
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

        // Thanh kiếm Hòa Đạo Nhất Văn ngậm ở miệng
        ctx.strokeStyle = asura ? '#c084fc' : '#e2e8f0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(4, -27 + bob);
        ctx.lineTo(28, -29 + bob + Math.sin(T * 12) * 2);
        ctx.stroke();
      },
    });
`;
// === KẾT THÚC PHẦN 1 / 3 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 2 / 3 DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 2 / 3 — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 1 / 3 ===
const animeHeroesPart2 = `
    // ==========================================================================
    // 4. RYOMEN SUKUNA (VUA NGUYỀN HỒN — 29.000 XU + 390 KIM CƯƠNG)
    //    - Dạng Thường: Áo kimono trắng, ấn chú đen, tự phóng Trảm Kích
    //    - Dạng Thức Tỉnh (F): Chân Thân Heian 4 Cánh Tay + Lãnh Địa Phục Ma Ngự Trù Tử chém lưới 4D!
    // ==========================================================================
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
        desc: '🩸 Tự động phóng lưới trảm kích Giải & Bát chém nát mọi đá lăn, thạch nhũ, cá mập phía trước! Khi Thức Tỉnh (nhấn F): Mọc 4 Cánh Tay Heian, mở Lãnh Địa chém tự động 360° toàn màn hình & Bất tử hoàn toàn trước mọi bẫy!',
      },
      trail: ['#ef4444', '#090d16', '#f97316'],
      pal: { body: '#f8fafc', edge: '#991b1b', inner: '#ef4444', belly: 'rgba(15,23,42,.85)' },
      renderCharacter(ctx, { bob, ph, run, air, T, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const heian = !!(P && P.awakened);
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;

        if (heian) {
          // Bóng cổng Đền Thờ Phục Ma Ngự Trù Tử Đỏ-Đen phía sau lưng Sukuna
          ctx.save();
          const sg = ctx.createRadialGradient(0, -26 + bob, 4, 0, -26 + bob, 48);
          sg.addColorStop(0, 'rgba(220,38,38,.65)');
          sg.addColorStop(0.6, 'rgba(9,13,22,.45)');
          sg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(0, -26 + bob, 48, 0, 6.3);
          ctx.fill();

          // Mái đền ma quái phía sau + Cặp tay phụ thứ 2 cầm Kim Cang Chử (Kamutoke)
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

          // Đôi cánh tay thứ 2 mọc thêm ở hai bên sườn kết ấn Lãnh Địa
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
        // Đôi mắt phụ thứ 2 của Sukuna dưới gò má
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(1.5, hy + 15, 1.3, 0, 6.3);
        ctx.arc(10.5, hy + 15, 1.3, 0, 6.3);
        ctx.fill();

        // Tóc hồng cá hồi dựng ngược sắc nhọn
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

    // ==========================================================================
    // 5. UCHIHA MADARA (LỤC ĐẠO TIÊN NHÂN — 27.000 XU + 360 KIM CƯƠNG)
    //    - Dạng Thường: Giáp chiến quốc đỏ + Khung xương Susanoo xanh bảo vệ
    //    - Dạng Thức Tỉnh (F): Lục Đạo Tiên Nhân Bạch Y + 9 Hắc Cầu Đạo Ngọc (Gudoudama) xoay sau lưng!
    // ==========================================================================
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
        desc: '👁️ Dạng Thường: Khung xương Susanoo chặn đòn & chém kiếm khí xanh! 🌑 Khi Thức Tỉnh Lục Đạo (nhấn F): 9 Hắc Cầu Đạo Ngọc xoay quanh người tự động bắn tan xác mọi bẫy phía trước & Bất tử trước mọi sát thương!',
      },
      trail: ['#a855f7', '#38bdf8', '#090d16'],
      pal: { body: '#991b1b', edge: '#090d16', inner: '#a855f7', belly: 'rgba(255,255,255,.9)' },
      renderCharacter(ctx, { bob, ph, run, air, T, vx, o, G }) {
        const P = G.me && o.slot === G.myslot ? G.me : null;
        const rikudo = !!(P && P.awakened);
        const hy = -44.5 + bob + Math.sin(T * 5.2) * 0.55;
        const sway = Math.sin(T * 6) * 2.2 - Math.max(-4, Math.min(4, vx * 0.45));

        if (!rikudo) {
          // Dạng thường: Hào quang khung xương Susanoo màu xanh lam bao bọc quanh người
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
          // Dạng Thức Tỉnh Lục Đạo: 9 Hắc Cầu Đạo Ngọc (Truth-Seeking Orbs) lơ lửng thành vòng tròn hoàn hảo sau lưng!
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
          // Quyền trượng Lục Đạo màu đen cầm bên tay phải
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
          eye: '#a855f7', // Mắt Rinnegan tím
          serious: true,
        });

        // Mái tóc dài nhọn huyền thoại của Madara (Đen ở dạng thường -> Trắng bạc ở dạng Lục Đạo!)
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
  };

  // ============================================================================
  // 6. BỘ AI TỰ ĐỘNG CHIẾN ĐẤU & HIỆU ỨNG VẬT LÝ 4D (AUTO-COMBAT & CLONES)
  // ============================================================================
  window.TB_RunMultiverseAutoCombat = function (P, L, G, curPassive, v20LaunchUniqueSkill, v20FindFrontOrOverheadThreat, v20DestroyTarget, sparkle, puff, Snd, STEP, PW, PH, GY, WORLD_H) {
    if (!P || !L || P.dead || G.won) return;
    const cx = P.x + PW / 2;
    const cy = P.y + PH / 2;
    const face = P.face >= 0 ? 1 : -1;

    // 1. Lưu vệt bóng mờ tốc độ 4D (Afterimage Trail) khi nhân vật đang Thức Tỉnh và chạy/nhảy nhanh:
    if (P.awakened && (Math.abs(P.vx) > 3.2 || Math.abs(P.vy) > 4.5)) {
      FX4D.afterimages.push({
        x: P.x,
        y: P.y,
        face: P.face,
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

    // 2. CƠ CHẾ RIÊNG CỦA GOJO SATORU:
    //    🔵 CẦU XANH (BLUE): Tự động HÚT toàn bộ Tiền Xu, Kim Cương, Chìa khóa trong tầm 360px bay về phía Gojo!
    //    🔴 CẦU ĐỎ (RED): Tự động ĐẨY BẬT mọi đá lăn, cá mập, đạn độc, thạch nhũ áp sát trong tầm 165px!
    if (curPassive === 'limitless') {
      for (const c of L.coins || []) {
        if (!c.got && !c.anomaly) {
          const dx = cx - c.x;
          const dy = cy - c.y;
          const d = Math.hypot(dx, dy);
          if (d < 360 && d > 6) {
            c.x += (dx / d) * 8.5;
            c.y += (dy / d) * 8.5;
          }
        }
      }
      if (!G.keyGot && L.key) {
        const dx = cx - L.key.x;
        const dy = cy - L.key.y;
        const d = Math.hypot(dx, dy);
        if (d < 320 && d > 8) {
          L.key.x += (dx / d) * 6.5;
          L.key.y += (dy / d) * 6.5;
        }
      }
      // Cầu Đỏ (Hách - Red) tự động phát xung lực ĐẨY VĂNG mọi mối nguy hiểm lại gần < 165px:
      const nearThreat = v20FindFrontOrOverheadThreat(P, L, 165);
      if (nearThreat) {
        sparkle(nearThreat.x, nearThreat.y, 16, 1.6, '#ff4d6d');
        G.groundShockwaves.push({ x: nearThreat.x, y: nearThreat.y, r: 8, maxR: 95, col: '#ef4444', life: 0.3 });
        v20DestroyTarget(L, nearThreat);
      }
    }

    // 3. CƠ CHẾ RIÊNG CỦA RIMURU TEMPEST (BẠO THỰC VƯƠNG BEELZEBUTH / AZATHOTH):
    //    Khi Thức Tỉnh Ma Vương: Mở vùng Hư Không tự động HÚT & NUỐT CHỬNG mọi cạm bẫy trong bán kính 230px!
    if (curPassive === 'azathoth') {
      for (const c of L.coins || []) {
        if (!c.got && !c.anomaly && Math.hypot(cx - c.x, cy - c.y) < 340) {
          c.x = c.x + (cx - c.x) * 0.22;
          c.y = c.y + (cy - c.y) * 0.22;
        }
      }
      if (P.awakened) {
        const t = v20FindFrontOrOverheadThreat(P, L, 240);
        if (t) {
          sparkle(t.x, t.y, 18, 1.7, '#00f5d4');
          v20DestroyTarget(L, t);
        }
      }
    }

    // 4. CƠ CHẾ RIÊNG CỦA NARUTO (KAGE BUNSHIN - PHÂN THÂN ẢNH THỰC THỂ):
    //    Tự động duy trì 2 Phân Thân chạy phía trước mặt Naruto (+65px và +125px) để dẫm bẫy, gom xu & phá chướng ngại vật hộ bạn!
    if (curPassive === 'kurama') {
      while (FX4D.clones.length < 2) {
        FX4D.clones.push({
          offX: (FX4D.clones.length + 1) * 62,
          x: cx + face * 60,
          y: P.y,
          respawnT: 0,
        });
      }
      for (const cl of FX4D.clones) {
        if (cl.respawnT > 0) {
          cl.respawnT -= STEP;
          if (cl.respawnT <= 0) puff(cx + face * cl.offX, P.y + PH / 2, 8, '#ffffff', 1.3);
          continue;
        }
        const targetX = P.x + face * cl.offX;
        cl.x += (targetX - cl.x) * 0.25;
        cl.y += (P.y - cl.y) * 0.28;
        // Phân thân tự động nhặt xu hộ Naruto:
        for (const c of L.coins || []) {
          if (!c.got && Math.hypot(cl.x + PW / 2 - c.x, cl.y + PH / 2 - c.y) < 32) {
            c.anomaly = 0;
            c.x = cx;
            c.y = cy;
          }
        }
        // Phân thân tự động lao vào cảm tử phá hủy bẫy phía trước Naruto:
        const clThreat = v20FindFrontOrOverheadThreat({ x: cl.x, y: cl.y, face }, L, 95);
        if (clThreat) {
          puff(cl.x + PW / 2, cl.y + PH / 2, 12, '#ffffff', 1.5);
          v20DestroyTarget(L, clThreat);
          cl.respawnT = 1.8; // Phân thân bốc khói biến mất rồi 1.8s sau tự tạo lại!
        }
      }
    } else if (FX4D.clones.length > 0) {
      FX4D.clones.length = 0;
    }

    // 5. HỆ THỐNG TỰ ĐỘNG TẤN CÔNG (AUTO-ATTACK AI - KHÔNG CẦN BẤM PHÍM E!):
    //    Tự động quét mục tiêu trong tầm 410px và tung chiêu theo đúng trạng thái Thường vs Thức Tỉnh!
    const cdTarget = P.awakened ? 1.35 : 2.4;
    if (!(P.skillCd > 0)) {
      const threat = v20FindFrontOrOverheadThreat(P, L, 410);
      if (threat) {
        const ang = Math.atan2(threat.y - cy, threat.x - cx);
        if (curPassive === 'shrine' || (curPassive === 'santoryu' && P.awakened)) {
          // Sukuna & Zoro Asura: Tự động tung Trảm Kích Không Gian 4D chém đứt mục tiêu ngay lập tức!
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

  // Vẽ các hiệu ứng 4D (Phân thân Naruto, Bóng mờ tốc độ, Vết chém nứt vỡ không gian):
  window.TB_DrawMultiverse4DFX = function (ctx, G, drawBunny, PW, PH) {
    const T = G.lt;
    // 1. Vẽ vệt bóng mờ tốc độ (Afterimages)
    for (const ai of FX4D.afterimages) {
      ctx.save();
      ctx.globalAlpha = ai.life * 1.4;
      ctx.fillStyle = ai.col;
      ctx.beginPath();
      ctx.roundRect(ai.x + 2, ai.y - 6, PW - 4, PH + 4, 10);
      ctx.fill();
      ctx.restore();
    }
    // 2. Vẽ Phân thân Ảnh của Naruto (Shadow Clones)
    if (G.me && FX4D.clones.length > 0) {
      for (const cl of FX4D.clones) {
        if (cl.respawnT > 0) continue;
        ctx.save();
        ctx.globalAlpha = 0.78;
        drawBunny(cl.x, cl.y, {
          slot: G.myslot,
          skin: 'naruto',
          face: G.me.face,
          vx: G.me.vx,
          vy: G.me.vy,
          ground: G.me.onGround,
          runT: G.me.runT + 0.8,
          name: '🦊 Phân Thân',
        });
        ctx.restore();
      }
    }
    // 3. Vẽ vết chém không gian 4D (Dimensional Slashes)
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

fs.writeFileSync(heroesPath, animeHeroesFileContent + '\n' + animeHeroesPart2, 'utf8');
console.log('✅ [V21.0] Đã tạo thành công file riêng public/anime_heroes.js!');
// === KẾT THÚC PHẦN 2 / 3 — NHẮN "TIẾP" ĐỂ LẤY PHẦN 3 / 3 (PHẦN CUỐI) DÁN NGAY DƯỚI DÒNG NÀY ===
// === BẮT ĐẦU PHẦN 3 / 3 (PHẦN CUỐI) — DÁN NỐI TIẾP NGAY DƯỚI DÒNG CUỐI CỦA PHẦN 2 / 3 ===

// ============================================================================
// 7. VẬT LÝ DÂY NGẮN, ĐỒ HỌA MÂY 3D / ĐÁY BIỂN, BOSS DỌC ĐƯỜNG & 300 MÀN CHƠI
// ============================================================================
const v21EnginePart3 = `
const V15_ROPE_REST = 60, V15_ROPE_SPRING = 78, V15_ROPE_MAX = 96, V15_PIT_SAFE_DROP = 76;

function v15GetSquadLinks(P) {
  if (G.mode !== 'coop' || P.rope || G.remotes.size === 0) return null;
  let groundedPower = P.onGround ? (input.d ? 3.2 : 1.4) : 0, fallingCount = P.onGround ? 0 : 1;
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
  const idx = slots.indexOf(P.slot), links = [];
  if (idx > 0) { const r = G.remotes.get(slots[idx - 1]); if (r && !r.dead && !r.ropeOn) links.push(r); }
  if (idx < slots.length - 1) { const r = G.remotes.get(slots[idx + 1]); if (r && !r.dead && !r.ropeOn) links.push(r); }
  return { links, bestAnchor, rescueRatio: groundedPower / Math.max(1, fallingCount) };
}

function applyTether(P) {
  const st = v15GetSquadLinks(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st, meGrounded = !!(P.onGround || input.d);
  for (const r of links) {
    const ax = P.x + PW / 2, ay = P.y + PH / 2, bx = r.x + PW / 2, by = r.y + PH / 2;
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d <= V15_ROPE_REST || d < 1) continue;
    const nx = dx / d, ny = dy / d, stretch = d - V15_ROPE_REST, partnerGrounded = !!(r.onGround || r.anch);
    let scale = 1.0;
    if (meGrounded && !partnerGrounded) {
      if (input.d) scale = 0.0;
      else if (rescueRatio >= 0.9) scale = 0.04 / rescueRatio;
      else scale = clamp(0.8 * (1.05 - rescueRatio), 0.24, 0.85);
    } else if (!meGrounded && (partnerGrounded || bestAnchor)) {
      scale = clamp(2.1 * Math.sqrt(Math.max(0.6, rescueRatio)), 1.4, 3.6);
    } else scale = 0.85;
    const f = Math.min(stretch * (d > V15_ROPE_SPRING ? 0.085 : 0.048), 5.5) * scale;
    P.vx += nx * f; P.vy += ny * f * (ny < 0 ? 1.85 : 0.25);
  }
  if (!meGrounded && bestAnchor && P.y > bestAnchor.y + 14) {
    const dxA = (bestAnchor.x + PW / 2) - (P.x + PW / 2), dyA = (bestAnchor.y + PH / 2) - (P.y + PH / 2);
    const distA = Math.max(1, Math.hypot(dxA, dyA)), lift = clamp(rescueRatio, 0.85, 2.6);
    P.vy -= Math.min(GRAV * 1.7 * lift, 2.2);
    if (Math.abs(bestAnchor.tvx || 0) > 0.45 || (bestAnchor.vy || 0) < -1.8 || bestAnchor.anch || distA > V15_ROPE_SPRING) {
      P.vy = Math.max(P.vy - 1.25 * lift, -12.2); P.vx += (dxA / distA) * 0.85 * lift;
    }
  }
}

function v15EnforceRopeAfterMove(P) {
  const st = v15GetSquadLinks(P);
  if (!st || !st.links.length) return;
  const { links, bestAnchor, rescueRatio } = st, meGrounded = !!(P.onGround || input.d);
  if (!P.onGround && bestAnchor && P.y > bestAnchor.y + V15_PIT_SAFE_DROP) {
    const maxY = bestAnchor.y + V15_PIT_SAFE_DROP;
    if (nearSolids(P.x, maxY, PW, PH).length === 0) { P.y = maxY; if (P.vy > 0) P.vy = -P.vy * 0.55 - 3.4; }
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
      if (nearSolids(P.x + nx * over, P.y, PW, PH).length === 0) P.x += nx * over;
      if (nearSolids(P.x, P.y + ny * over, PW, PH).length === 0) P.y += ny * over;
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

// ============================================================================
// 8. ĐỒ HỌA ĐỊA HÌNH 3D THEO CHỦ ĐỀ (MÂY THIÊN ĐƯỜNG PHỒNG XỐP, RẠN SAN HÔ, NÚI LỬA)
// ============================================================================
drawSolid = function (L, s) {
  if (s.ice || L.biome === 'ice') { drawIceSolid(L, s); return; }
  const x = s[0], y = s[1], w = s[2], h = s[3], T = G.lt;
  const biome = L.biome || 'normal';

  // 1. MÀN THIÊN ĐƯỜNG TRÊN MÂY: Vẽ Thềm Mây Trắng-Vàng 3D Phồng Xốp Bồng Bềnh (Không còn khối đất phẳng!)
  if (biome === 'heaven') {
    ctx.save();
    const cg = ctx.createLinearGradient(0, y - 14, 0, y + Math.min(h, 95));
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.55, '#fef9c3');
    cg.addColorStop(1, 'rgba(186,230,253,.15)');
    ctx.fillStyle = cg;
    rr(x, y, w, Math.min(h, 90), 22);
    ctx.fill();

    // Các búp mây tròn phồng xốp dọc toàn bộ bề mặt thềm mây
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
    // Đường viền hào quang vàng Thiên Giới
    ctx.fillStyle = 'rgba(250,204,21,.45)';
    rr(x + 6, y + 6, Math.max(8, w - 12), 8, 4);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 2. MÀN ĐẠI DƯƠNG: Vách Đá Ngầm San Hô 3D Gồ Ghề (Có cả vách trần & mỏm đá ngầm)
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

    // San hô phát quang & Rong biển uốn lượn trên mỏm đá ngầm
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

  // 3. MÀN ĐẦM LẦY ĐỘC & ĐỊA NGỤC: Mặt đất gồ ghề 3D có gờ đá nhấp nhô tự nhiên
  if (biome === 'toxic' || biome === 'hell') {
    const isHell = biome === 'hell';
    const gr = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 260));
    gr.addColorStop(0, isHell ? '#3b0a0a' : '#1b4332');
    gr.addColorStop(0.5, isHell ? '#1f0505' : '#081c15');
    gr.addColorStop(1, '#050505');
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);

    // Gờ đá 3D gồ ghề nhấp nhô trên mặt đất (không phẳng lì!)
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

  // Địa hình cỏ hoa 3D có gờ cỏ nhấp nhô sống động:
  const sh = curEnv ? curEnv.solidHue : L.hue + 25, gh = curEnv ? curEnv.grassHue : 105;
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
};

function drawNaturalStoneBoulder(cx, cy, r, rot, isLava) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  const pts = 24;
  ctx.beginPath();
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rad = r * (0.97 + 0.03 * Math.sin(i * 3) + 0.02 * Math.cos(i * 5));
    const vx = Math.cos(a) * rad, vy = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  const gr = ctx.createRadialGradient(-r * 0.32, -r * 0.32, r * 0.08, 0, 0, r * 1.02);
  gr.addColorStop(0, '#cbd5e1'); gr.addColorStop(0.52, '#64748b'); gr.addColorStop(1, '#1e293b');
  ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#0f172a'; ctx.stroke();
  ctx.restore();
}
drawBoulder = function (b, bcx, brot) { drawNaturalStoneBoulder(bcx, b.y - b.r, b.r, brot, true); };
drawFerry = function (t) {
  const a = G.alpha === undefined ? 1 : G.alpha, cx = t.cx - (t.dx || 0) * (1 - a);
  drawNaturalStoneBoulder(cx, t.cy, t.R, t.rot + ((t.dx || 0) * (a - 1)) / t.R, false);
};
drawRocks = function (L, lt) {
  for (const r of L.rocks || []) { const p = rockAt(r, lt); if (p) drawNaturalStoneBoulder(p.x, p.y, r.r, p.rot, true); }
};

function v18IsInSwimPit(P, L) {
  if (!P || !L) return false;
  if (L.biome === 'water') return true;
  const cx = P.x + PW / 2, feet = P.y + PH;
  for (const s of L.spikes || []) {
    if (s.swimPit && cx >= s.x - 16 && cx <= s.x + s.w + 16 && feet >= GY + 12) return true;
  }
  return false;
}

const _origDrawBunnyV10 = drawBunny;
drawBunny = function (x, y, o) {
  const L = G.L, skin = o.skin || 'classic', customCfg = CUSTOM_SKINS.get(skin);
  const inWater = !!(L && (L.biome === 'water' || v18IsInSwimPit({ x, y }, L)));
  const face = o.face >= 0 ? 1 : -1, vx = o.vx || 0, vy = o.vy || 0;
  const sq = clamp(o.sq || 0, -0.4, 0.4), run = o.ground && Math.abs(vx) > 0.8, air = !o.ground;
  const ph = (o.runT || 0) * 3, bob = run ? -Math.abs(Math.sin(ph)) * 2.4 : 0;

  let gDir = 1;
  if (L && L.gravZones) {
    const cx = x + PW / 2, cy = y + PH / 2;
    for (const gz of L.gravZones) if (cx >= gz.x0 && cx <= gz.x1 && cy >= gz.y0 - 45 && cy <= gz.y1 + 45) { gDir = -1; break; }
  }

  ctx.save();
  if (gDir < 0) { const cy = y + PH / 2; ctx.translate(0, cy * 2); ctx.scale(1, -1); }
  if (inWater && (!o.ground || Math.abs(vx) > 0.35)) {
    const cx = x + PW / 2, cy = y + PH / 2;
    const tilt = face * 1.05 + clamp(vy * 0.04, -0.4, 0.4) * face;
    ctx.translate(cx, cy); ctx.rotate(tilt); ctx.translate(-cx, -cy);
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

    if (o.name) {
      ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center';
      const w = ctx.measureText(o.name).width + 10;
      ctx.fillStyle = 'rgba(255,255,255,.88)'; rr(x + PW / 2 - w / 2, y - 50, w, 16, 8); ctx.fill();
      ctx.fillStyle = '#1e293b'; ctx.fillText(o.name, x + PW / 2, y - 38);
    }
    ctx.restore();
    return;
  }

  _origDrawBunnyV10(x, y, o);
  ctx.restore();
};

// ============================================================================
// 9. BẪY ĐẶC TRƯNG RIÊNG THEO CHỦ ĐỀ (THỦY LÔI, SỨA ĐIỆN, BOSS THIÊN THẦN / RỒNG XƯƠNG)
// ============================================================================
function v21UpdateBiomeExclusiveHazards(L, me) {
  if (!L || !me || me.dead || G.won) return;
  const cx = me.x + PW / 2, cy = me.y + PH / 2, T = G.lt;
  const immune = (curPassive === 'limitless' && me.awakened) || (curPassive === 'azathoth' && me.awakened) || (curPassive === 'shrine' && me.awakened);

  // 1. Sứa Điện Phát Quang (Electric Jellyfish - Màn Đại Dương):
  for (const jf of L.jellyfish || []) {
    jf.y = jf.y0 + Math.sin(T * jf.spd + jf.off) * jf.amp;
    if (!immune && Math.hypot(cx - jf.x, cy - jf.y) < 30) { die('jellyfish'); return; }
  }
  // 2. Thủy Lôi Dây Xích (Naval Mines - Màn Đại Dương):
  for (const mn of L.navalMines || []) {
    mn.x = mn.x0 + Math.sin(T * 1.8 + mn.off) * 18;
    if (!immune && Math.hypot(cx - mn.x, cy - mn.y) < mn.r + 12) { die('naval_mine'); return; }
  }
  // 3. Boss Dọc Đường (Stage Bosses: Thiên Thần Seraphim ở Thiên Đường / Rồng Hắc Ám ở Địa Ngục):
  for (const bs of L.stageBosses || []) {
    bs.x = pingPong(bs.x0, bs.x1, bs.spd, bs.off, T);
    bs.y = bs.y0 + Math.sin(T * 3.2 + bs.off) * 35;
    if (!immune && Math.hypot(cx - bs.x, cy - bs.y) < 42) { die('boss'); return; }
  }
}

function v21DrawBiomeExclusiveHazards(ctx, L) {
  const T = G.lt;
  // 1. Vẽ Thủy Lôi Dây Xích dưới đáy biển:
  for (const mn of L.navalMines || []) {
    ctx.save();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(mn.x0, WORLD_H); ctx.lineTo(mn.x, mn.y); ctx.stroke();
    const mg = ctx.createRadialGradient(mn.x - 6, mn.y - 6, 2, mn.x, mn.y, mn.r);
    mg.addColorStop(0, '#64748b'); mg.addColorStop(1, '#0f172a');
    ctx.fillStyle = mg; ctx.strokeStyle = '#020617'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(mn.x, mn.y, mn.r, 0, 6.3); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + T * 0.5;
      ctx.beginPath();
      ctx.moveTo(mn.x + Math.cos(a) * (mn.r - 2), mn.y + Math.sin(a) * (mn.r - 2));
      ctx.lineTo(mn.x + Math.cos(a) * (mn.r + 9), mn.y + Math.sin(a) * (mn.r + 9));
      ctx.stroke();
    }
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(mn.x, mn.y, 4 + Math.sin(T * 10) * 1.5, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  // 2. Vẽ Sứa Điện Phát Quang Đại Dương:
  for (const jf of L.jellyfish || []) {
    ctx.save();
    ctx.translate(jf.x, jf.y);
    ctx.fillStyle = 'rgba(0,245,212,.75)'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let t = -2; t <= 2; t++) {
      ctx.beginPath(); ctx.moveTo(t * 6, 0);
      ctx.quadraticCurveTo(t * 6 + Math.sin(T * 10 + t) * 6, 14, t * 6 - Math.sin(T * 10 + t) * 5, 28);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Vẽ Boss Thiên Thần 6 Cánh (Thiên Đường) & Boss Rồng Hắc Ám (Địa Ngục / Độc):
  for (const bs of L.stageBosses || []) {
    ctx.save();
    ctx.translate(bs.x, bs.y);
    const flap = Math.sin(T * 9) * 12;
    if (bs.kind === 'seraphim') {
      // Thiên Thần Phán Quyết 6 Cánh Vàng Rực
      ctx.fillStyle = 'rgba(254,240,138,.9)'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 2;
      [-1, 1].forEach((d) => {
        for (let w = 0; w < 3; w++) {
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(d * (32 + w * 10), -26 + w * 14 + flap, d * (48 + w * 8), -8 + w * 14 + flap);
          ctx.lineTo(0, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      });
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#00f5d4'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.3); ctx.fill();
    } else {
      // Rồng Hắc Ám Địa Ngục 3D
      ctx.fillStyle = '#450a0a'; ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5;
      [-1, 1].forEach((d) => {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.lineTo(d * 46, -24 + flap); ctx.lineTo(d * 34, 12 + flap * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(-7, -3, 4, 0, 6.3); ctx.arc(7, -3, 4, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }
}

// Tích hợp vào drawTraps, stepPlayer & die:
const _prevDrawTrapsV20 = drawTraps;
drawTraps = function (L) {
  _prevDrawTrapsV20(L);
  v21DrawBiomeExclusiveHazards(ctx, L);
  if (typeof window.TB_DrawMultiverse4DFX === 'function') {
    window.TB_DrawMultiverse4DFX(ctx, G, drawBunny, PW, PH);
  }
};

const _prevStepPlayerV20 = stepPlayer;
stepPlayer = function () {
  const P = G.me, L = G.L;
  if (P && L && !P.dead && !G.won) {
    v21UpdateBiomeExclusiveHazards(L, P);
    if (typeof window.TB_RunMultiverseAutoCombat === 'function') {
      window.TB_RunMultiverseAutoCombat(
        P, L, G, curPassive, v20LaunchUniqueSkill, v20FindFrontOrOverheadThreat,
        v20DestroyTarget, sparkle, puff, Snd, STEP, PW, PH, GY, WORLD_H
      );
    }
  }
  _prevStepPlayerV20();
};

const _prevDieV20 = die;
die = function (cause) {
  const P = G.me;
  if (!P || P.dead || G.won) return;
  // KHI GOJO, RIMURU, SUKUNA, MADARA HOẶC LUFFY GEAR 5 ĐANG BẬT THỨC TỈNH (P.awakened === true):
  // VÔ HẠN HỘ THỂ VĨNH VIỄN (0 GIÂY HỒI CHIÊU — Không bao giờ chết bởi bẫy!):
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
  return _prevDieV20(cause);
};

// ============================================================================
// 10. BỘ KIẾN TẠO MÀN ĐẠI DƯƠNG (KHÔNG MẶT ĐẤT PHẲNG, KHÔNG LỒNG CƯA) & MÂY 3D
// ============================================================================
(() => {
  if (typeof window.TB_InitAllMultiverseHeroes === 'function') {
    window.TB_InitAllMultiverseHeroes(TB_RegisterSkin);
  }

  // MÀN ĐẠI DƯƠNG ĐẶC BIỆT (100% BƠI DƯỚI ĐÁY BIỂN, CÓ TRẦN SAN HÔ CHẮN TRÊN ĐẦU, THỦY LÔI, SỨA ĐIỆN & CÁ MẬP):
  function buildOceanAbyssStage(title, seed, mode, d) {
    const W = 4400;
    const b = new LB(
      title,
      '🌊 ĐẠI DƯƠNG SÂU THẲM: Bơi qua hẻm núi san hô, Thủy Lôi, Sứa Điện & Cá Mập Megalodon!',
      195,
      mode === 'coop'
    );
    b.x = W;
    // Bệ đá ngầm xuất phát và bệ cửa đích
    b.solids.push([0, GY - 20, 320, 260]);
    b.spawn = [110, GY - 20 - PH];
    // Trần đá ngầm san hô suốt chiều dài bản đồ để người chơi KHÔNG THỂ bơi ăn gian lên nóc màn hình!
    b.solids.push([0, 0, W, 95]);

    const navalMines = [], jellyfish = [], sharks = [];
    let curX = 420;
    let step = 0;
    while (curX < W - 650) {
      const hTop = 120 + ((step * 53 + seed * 19) % 140);
      const gapSwim = 210 - Math.round(d * 25);
      // Cột đá ngầm san hô từ trần xuống và từ đáy biển lên tạo thành Hẻm Núi Bơi Lặn
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
        x0: sx, x1: Math.min(W - 550, sx + 780),
        baseY: 360, minY: 160, maxY: GY - 40,
        cx: sx, cy: 360, speed: 3.6 + d * 1.4, off: sx * 0.01, dir: 1,
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

  // Nâng cấp 300 màn chơi: Màn Nước dùng Hẻm Núi Đại Dương riêng; Màn Thiên Đường / Địa Ngục có Boss canh giữ!
  ['solo', 'coop', 'party'].forEach((mode) => {
    const origArr = LEVELS[mode].slice();
    LEVELS[mode].length = 0;
    for (let i = 0; i < 100; i++) {
      LEVELS[mode].push(() => {
        const d = clamp(i / 99, 0.25, 1.0);
        const lv = origArr[i]();
        if (lv && lv.biome === 'water') {
          return buildOceanAbyssStage(lv.name, i + 1, mode, d);
        }
        if (lv && (lv.biome === 'heaven' || lv.biome === 'hell' || lv.biome === 'toxic')) {
          lv.stageBosses = [];
          for (let bx = 950; bx < lv.w - 800; bx += 1350) {
            lv.stageBosses.push({
              kind: lv.biome === 'heaven' ? 'seraphim' : 'dragon',
              x0: bx, x1: Math.min(lv.w - 500, bx + 550),
              x: bx, y0: GY - 165, y: GY - 165, spd: 3.2 + d, off: bx * 0.01,
            });
          }
        }
        return lv;
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
`;

code = code.slice(0, lastClose) + v20MasterPayload + '\n' + v21EnginePart3 + '\n})();\n';
fs.writeFileSync(gamePath, code, 'utf8');
console.log('✅ [V21.0 4D MULTIVERSE] Đã nâng cấp thành công public/game.js & public/anime_heroes.js!');

if (fs.existsSync(cssPath)) {
  let css = fs.readFileSync(cssPath, 'utf8');
  if (!css.includes('.preview-rimuru')) {
    css += `\n.preview-rimuru{background:radial-gradient(circle,#00f5d4,#0284c7);border-color:#fde047;box-shadow:0 0 16px #00f5d4}
.preview-sukuna{background:radial-gradient(circle,#ef4444,#090d16);border-color:#ef4444;box-shadow:0 0 16px #ef4444}
.preview-madara{background:radial-gradient(circle,#a855f7,#1e1b4b);border-color:#c084fc;box-shadow:0 0 16px #a855f7}\n`;
    fs.writeFileSync(cssPath, css, 'utf8');
  }
}

if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  // Nhúng file anime_heroes.js ngay trước game.js để tự động nạp toàn bộ Anh Hùng & Ma Vương:
  if (!html.includes('anime_heroes.js')) {
    html = html.replace(/<script src="game\.js[^"]*"><\/script>/, '<script src="anime_heroes.js?v=21.0"></script>\n  <script src="game.js?v=21.0"></script>');
  } else {
    html = html.replace(/anime_heroes\.js(\?v=[^"']*)?/, 'anime_heroes.js?v=21.0');
    html = html.replace(/game\.js(\?v=[^"']*)?/, 'game.js?v=21.0');
  }
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ [V21.0] Đã tự động nhúng anime_heroes.js?v=21.0 và game.js?v=21.0 vào index.html');
}
