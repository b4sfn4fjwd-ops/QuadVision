/* ═══════════════════════════════════════════════════════════
   QuadVision – main.js
   KMJ Innovation Expo KIE 2026
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────────────────────
let STATE = null;   // computed maths result
let ANIM  = null;   // animation controller
let SPEED = 1;      // playback speed multiplier

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '?';
  const r = Math.round(n * 1000) / 1000;
  return r === Math.round(r) ? String(Math.round(r)) : r.toString();
}

function lerp(a, b, t) { return a + (b - a) * t; }

function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function showBanner(type, msg) {
  const el = document.getElementById('banner');
  el.className = 'banner ' + type + ' show';
  el.textContent = msg;
}

function hideBanner() {
  const el = document.getElementById('banner');
  el.className = 'banner';
}

// ─────────────────────────────────────────────────────────────
//  MATHS ENGINE
// ─────────────────────────────────────────────────────────────
function computeState(a, b, c) {
  // Completing the square: a(x + b/2a)² + (c - b²/4a)
  const h       = -b / (2 * a);            // vertex x  (= -b/2a)
  const k       = c - (b * b) / (4 * a);  // vertex y
  const half_ba = b / (2 * a);             // b/(2a) — the shift inside bracket
  const corner  = (b * b) / (4 * a * a);  // (b/2a)² — corner piece
  const disc    = b * b - 4 * a * c;

  let roots = [];
  if (disc >= 0) {
    roots = [
      (-b + Math.sqrt(disc)) / (2 * a),
      (-b - Math.sqrt(disc)) / (2 * a)
    ];
  }

  return { a, b, c, h, k, half_ba, corner, disc, roots };
}

// ─────────────────────────────────────────────────────────────
//  BUILD STEPS TEXT
// ─────────────────────────────────────────────────────────────
function buildSteps(s) {
  const { a, b, c, h, k, half_ba, corner } = s;
  const sign_b = b >= 0 ? '+' : '−';
  const sign_c = c >= 0 ? '+' : '−';

  const steps = [];

  // 1 – original
  steps.push(
    `Begin with the quadratic: <span class="hl-b">f(x) = ${a === 1 ? '' : a}x² ${sign_b} ${Math.abs(b)}x ${sign_c} ${Math.abs(c)}</span>`
  );

  // 2 – factor a if needed
  if (a !== 1) {
    const b_a   = b / a;
    const sign_ba = b_a >= 0 ? '+' : '−';
    steps.push(
      `Factor out <span class="hl-a">${a}</span> from the x-terms: ` +
      `<span class="hl-a">${a}</span>(x² ${sign_ba} ${fmt(Math.abs(b_a))}x) ${sign_c} ${Math.abs(c)}`
    );
  }

  // 3 – half of b/a
  steps.push(
    `Take half the x-coefficient: <span class="hl-a">${fmt(b / a)} ÷ 2 = ${fmt(half_ba)}</span>`
  );

  // 4 – square it
  steps.push(
    `Square it — this is the <em>corner piece</em> we need: <span class="hl-p">(${fmt(half_ba)})² = ${fmt(corner)}</span>`
  );

  // 5 – add & subtract inside
  steps.push(
    `Add <span class="hl-p">+${fmt(corner)}</span> and subtract <span class="hl-p">−${fmt(corner)}</span> ` +
    `inside the expression — the equation stays balanced`
  );

  // 6 – perfect square trinomial
  const pSign = -half_ba >= 0 ? '+' : '−';
  steps.push(
    `The first three terms form a perfect square: <span class="hl-p">(x ${pSign} ${fmt(Math.abs(half_ba))})²</span>`
  );

  // 7 – vertex form
  const kSign = k >= 0 ? '+' : '−';
  steps.push(
    `Simplify to vertex form: <span class="hl-g">${a === 1 ? '' : a}(x ${pSign} ${fmt(Math.abs(half_ba))})² ${kSign} ${fmt(Math.abs(k))} = 0</span>`
  );

  return steps;
}

function buildStepsBM(s) {
  const { a, b, c, h, k, half_ba, corner } = s;
  const sign_b = b >= 0 ? '+' : '−';
  const sign_c = c >= 0 ? '+' : '−';
  const steps = [];

  steps.push(
    `Mulakan dengan persamaan kuadratik: <span class="hl-b">f(x) = ${a === 1 ? '' : a}x² ${sign_b} ${Math.abs(b)}x ${sign_c} ${Math.abs(c)}</span>`
  );

  if (a !== 1) {
    const b_a    = b / a;
    const sign_ba = b_a >= 0 ? '+' : '−';
    steps.push(
      `Faktorkan <span class="hl-a">${a}</span> daripada sebutan-x: ` +
      `<span class="hl-a">${a}</span>(x² ${sign_ba} ${fmt(Math.abs(b_a))}x) ${sign_c} ${Math.abs(c)}`
    );
  }

  steps.push(
    `Ambil separuh pekali-x: <span class="hl-a">${fmt(b / a)} ÷ 2 = ${fmt(half_ba)}</span>`
  );
  steps.push(
    `Kuasaduakannya — ini adalah <em>kepingan sudut</em> yang kita perlukan: <span class="hl-p">(${fmt(half_ba)})² = ${fmt(corner)}</span>`
  );
  steps.push(
    `Tambah <span class="hl-p">+${fmt(corner)}</span> dan tolak <span class="hl-p">−${fmt(corner)}</span> ` +
    `dalam ungkapan — persamaan kekal seimbang`
  );

  const pSign = -half_ba >= 0 ? '+' : '−';
  steps.push(
    `Tiga sebutan pertama membentuk kuasa dua sempurna: <span class="hl-p">(x ${pSign} ${fmt(Math.abs(half_ba))})²</span>`
  );

  const kSign = k >= 0 ? '+' : '−';
  steps.push(
    `Ringkaskan ke bentuk bucu: <span class="hl-g">${a === 1 ? '' : a}(x ${pSign} ${fmt(Math.abs(half_ba))})² ${kSign} ${fmt(Math.abs(k))} = 0</span>`
  );

  return steps;
}

// ─────────────────────────────────────────────────────────────
//  EQUATION HISTORY  (localStorage)
// ─────────────────────────────────────────────────────────────
const HIST_KEY     = 'qv_history';
const HIST_MAX     = 10;
let   _historyOpen = false;

function _loadHistData() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
}

function saveToHistory(state) {
  const { a, b, c, disc, roots, h, k } = state;
  const key = `${a},${b},${c}`;
  let hist = _loadHistData().filter(e => `${e.a},${e.b},${e.c}` !== key);
  hist.unshift({ a, b, c, disc, roots, h, k, ts: Date.now() });
  if (hist.length > HIST_MAX) hist.length = HIST_MAX;
  localStorage.setItem(HIST_KEY, JSON.stringify(hist));
  if (_historyOpen) renderHistory();
}

function toggleHistoryPanel() {
  _historyOpen = !_historyOpen;
  const panel = document.getElementById('historyPanel');
  const btn   = document.getElementById('historyBtn');
  panel.classList.toggle('hidden', !_historyOpen);
  btn.classList.toggle('active', _historyOpen);
  if (_historyOpen) {
    renderHistory();
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderHistory() {
  const hist    = _loadHistData();
  const listEl  = document.getElementById('histList');
  const emptyEl = document.getElementById('histEmpty');
  if (!listEl) return;

  if (hist.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = hist.map(e => {
    const eq      = _fmtEquation(e.a, e.b, e.c);
    const rootInfo = _fmtRoots(e);
    const badge    = e.disc > 0 ? 'real' : e.disc === 0 ? 'double' : 'complex';
    const badgeLbl = e.disc > 0 ? '2 roots' : e.disc === 0 ? 'double' : 'complex';
    return `
      <div class="hist-item" onclick="loadFromHistory(${e.a},${e.b},${e.c})">
        <div class="hist-item-body">
          <div class="hist-item-eq">${eq}</div>
          <div class="hist-item-meta">
            <span class="hist-roots ${badge}">${rootInfo}</span>
            <span class="hist-badge ${badge}">${badgeLbl}</span>
            <span class="hist-time">${_timeAgo(e.ts)}</span>
          </div>
        </div>
        <button class="hist-load-btn" onclick="event.stopPropagation(); loadFromHistory(${e.a},${e.b},${e.c})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Load
        </button>
      </div>`;
  }).join('');
}

function loadFromHistory(a, b, c) {
  document.getElementById('coeff-a').value = a;
  document.getElementById('coeff-b').value = b;
  document.getElementById('coeff-c').value = c;
  updateEqDisplay(a, b, c);
  updateLiveFormula(a, b, c);
  solve();
  document.getElementById('appSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearHistory() {
  localStorage.removeItem(HIST_KEY);
  renderHistory();
}

function _fmtEquation(a, b, c) {
  let s = '';
  if      (a ===  1) s = 'x²';
  else if (a === -1) s = '−x²';
  else               s = `${a}x²`;

  if      (b > 0) s += ` + ${b === 1 ? '' : b}x`;
  else if (b < 0) s += ` − ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;

  if      (c > 0) s += ` + ${c}`;
  else if (c < 0) s += ` − ${Math.abs(c)}`;

  return s + ' = 0';
}

function _fmtRoots(e) {
  if (e.disc > 0 && e.roots && e.roots.length === 2) {
    return `x = ${fmt(e.roots[0])},  x = ${fmt(e.roots[1])}`;
  } else if (e.disc === 0 && e.roots && e.roots.length >= 1) {
    return `x = ${fmt(e.roots[0])}  (double root)`;
  }
  return 'No real roots (complex)';
}

function _timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)           return 'just now';
  if (diff < 3600)         return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)        return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
}

// ─────────────────────────────────────────────────────────────
//  SOLVE & RENDER RESULTS
// ─────────────────────────────────────────────────────────────
function solve() {
  const a = parseFloat(document.getElementById('coeff-a').value);
  const b = parseFloat(document.getElementById('coeff-b').value);
  const c = parseFloat(document.getElementById('coeff-c').value);

  hideBanner();

  if (isNaN(a) || isNaN(b) || isNaN(c)) {
    showBanner('err', 'Please enter valid numbers for all coefficients.');
    return;
  }
  if (a === 0) {
    showBanner('err', 'Coefficient a cannot be 0 — that\'s not a quadratic!');
    return;
  }
  if (a !== 1) {
    showBanner('warn', 'Note: a ≠ 1. We factor out a first, then complete the square for the inner expression.');
  }

  STATE = computeState(a, b, c);
  saveToHistory(STATE);

  // Show live formula
  updateLiveFormula(a, b, c);

  // Completed square form
  const pSign  = STATE.h >= 0 ? '+' : '−';
  const kSign  = STATE.k >= 0 ? '+' : '−';
  document.getElementById('completedForm').textContent =
    `${a === 1 ? '' : a}(x ${pSign} ${fmt(Math.abs(STATE.half_ba))})² ${kSign} ${fmt(Math.abs(STATE.k))} = 0`;
  document.getElementById('completedForm').classList.add('show');

  // Vertex
  document.getElementById('vertexVal').textContent = `( ${fmt(STATE.h)}, ${fmt(STATE.k)} )`;

  // Roots
  let rootsHTML = '';
  if (STATE.disc > 0) {
    rootsHTML =
      `<div class="root-pill real"><div class="root-label">x₁</div><div class="root-val">${fmt(STATE.roots[0])}</div></div>` +
      `<div class="root-pill real"><div class="root-label">x₂</div><div class="root-val">${fmt(STATE.roots[1])}</div></div>`;
  } else if (STATE.disc === 0) {
    rootsHTML = `<div class="root-pill real"><div class="root-label">x (double root)</div><div class="root-val">${fmt(STATE.roots[0])}</div></div>`;
  } else {
    const re = fmt(-b / (2 * a));
    const im = fmt(Math.sqrt(-STATE.disc) / (2 * a));
    rootsHTML =
      `<div class="root-pill complex"><div class="root-label">x₁</div><div class="root-val">${re}+${im}i</div></div>` +
      `<div class="root-pill complex"><div class="root-label">x₂</div><div class="root-val">${re}−${im}i</div></div>`;
  }
  document.getElementById('rootsBox').innerHTML = rootsHTML;

  // Discriminant
  const discEl  = document.getElementById('discRow');
  const discClass = STATE.disc > 0 ? 'pos' : STATE.disc === 0 ? 'zero' : 'neg';
  const discNote  = STATE.disc > 0 ? '→ 2 real roots' : STATE.disc === 0 ? '→ 1 real root (double)' : '→ no real roots';
  discEl.innerHTML = `<span class="disc-val ${discClass}">Δ = ${fmt(STATE.disc)}</span><span style="color:var(--muted);font-size:.8em">${discNote}</span>`;

  // Steps
  const steps = currentLang === 'ms' ? buildStepsBM(STATE) : buildSteps(STATE);
  document.getElementById('stepsList').innerHTML = steps.map((s, i) =>
    `<li class="step-item" id="step${i}"><div class="step-num">${i + 1}</div><div class="step-text">${s}</div></li>`
  ).join('');

  // Stagger step animations
  steps.forEach((_, i) => setTimeout(() => {
    const el = document.getElementById('step' + i);
    if (el) el.classList.add('visible');
  }, 150 + i * 160));

  // Hide quiz until animation completes
  const quizSec = document.getElementById('quizSection');
  if (quizSec) quizSec.classList.add('hidden');

  // Init animation + graph
  setTimeout(() => {
    initAnimation();
    drawGraph();
    document.querySelector('.anim-stage-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 350);
}

// ─────────────────────────────────────────────────────────────
//  LIVE FORMULA
// ─────────────────────────────────────────────────────────────
function updateLiveFormula(a, b, c) {
  const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bAbs = Math.abs(b);
  const cAbs = Math.abs(c);
  const bSign = b >= 0 ? '+' : '−';
  const cSign = c >= 0 ? '+' : '−';
  const el = document.getElementById('liveFormula');
  el.textContent = `f(x) = ${aStr}x²  ${bSign} ${bAbs}x  ${cSign} ${cAbs}`;
  el.classList.add('show');
  updateEqDisplay(a, b, c);
}

function updateEqDisplay(a, b, c) {
  const aEl  = document.getElementById('eqValA');
  const bEl  = document.getElementById('eqValB');
  const cEl  = document.getElementById('eqValC');
  const bOp  = document.getElementById('eqOpB');
  const cOp  = document.getElementById('eqOpC');
  if (!aEl) return;

  const hasA = document.getElementById('coeff-a').value !== '';
  const hasB = document.getElementById('coeff-b').value !== '';
  const hasC = document.getElementById('coeff-c').value !== '';

  if (hasA) {
    aEl.classList.remove('eq-placeholder');
    aEl.textContent = a === 1 ? '' : a === -1 ? '−' : String(a);
  } else {
    aEl.classList.add('eq-placeholder');
    aEl.textContent = 'a';
  }

  if (hasB) {
    bEl.classList.remove('eq-placeholder');
    bOp.textContent = b < 0 ? '−' : '+';
    bEl.textContent = Math.abs(b) === 1 ? '' : String(Math.abs(b));
  } else {
    bEl.classList.add('eq-placeholder');
    bOp.textContent = '+';
    bEl.textContent = 'b';
  }

  if (hasC) {
    cEl.classList.remove('eq-placeholder');
    cOp.textContent = c < 0 ? '−' : '+';
    cEl.textContent = String(Math.abs(c));
  } else {
    cEl.classList.add('eq-placeholder');
    cOp.textContent = '+';
    cEl.textContent = 'c';
  }
}

// ─────────────────────────────────────────────────────────────
//  ═══════════════  ANIMATION ENGINE  ═══════════════
//
//  Geometry: the canvas draws a 2×2 grid of tiles.
//  All four tile pixel sizes are computed from the actual
//  equation values so the proportions are mathematically correct.
//
//  Layout (top-left origin = anchor point):
//
//    ┌──────────────┬──────────┐
//    │              │          │
//    │    x²        │  (b/2a)x │  ← xPx tall
//    │   (xPx×xPx)  │(bPx×xPx) │
//    │              │          │
//    ├──────────────┼──────────┤
//    │  (b/2a)x     │  (b/2a)² │  ← bPx tall
//    │ (xPx × bPx)  │(bPx×bPx) │
//    └──────────────┴──────────┘
//         xPx            bPx
//
//  The total square side = xPx + bPx, and the corner tile
//  is exactly bPx × bPx — a true square.
// ─────────────────────────────────────────────────────────────

const PHASE_CAPTIONS = [
  '<strong>Phase 1:</strong> We start with the <strong>x²</strong> tile — a square whose side length is x.',
  '<strong>Phase 2:</strong> The <strong>bx</strong> term splits into two equal rectangles of width <strong>b/(2a)</strong>, one on the right and one on the bottom.',
  '<strong>Phase 3:</strong> A corner gap appears, sized <strong>(b/2a)²</strong>. This is the missing piece!',
  '<strong>Phase 4:</strong> We drop in the <strong>(b/2a)²</strong> corner tile — the square is now complete.',
  '<strong>Phase 5:</strong> To keep the equation balanced, we subtract <strong>(b/2a)²</strong> elsewhere. No value changed, just rearranged.',
  '<strong>Done!</strong> The perfect square <strong>(x + b/2a)²</strong> is revealed. Its side length directly gives us the vertex of the parabola.',
];

const PHASE_CAPTIONS_MS = [
  '<strong>Fasa 1:</strong> Kita mulakan dengan jubin <strong>x²</strong> — sebuah segiempat yang panjang sisinya adalah x.',
  '<strong>Fasa 2:</strong> Sebutan <strong>bx</strong> dibahagi kepada dua segiempat tepat sama lebar <strong>b/(2a)</strong>, satu di kanan dan satu di bawah.',
  '<strong>Fasa 3:</strong> Terdapat ruang kosong di sudut, bersaiz <strong>(b/2a)²</strong>. Inilah kepingan yang hilang!',
  '<strong>Fasa 4:</strong> Kita masukkan jubin sudut <strong>(b/2a)²</strong> — segiempat kini lengkap.',
  '<strong>Fasa 5:</strong> Untuk mengimbangkan persamaan, kita tolak <strong>(b/2a)²</strong> di tempat lain. Nilainya tidak berubah, hanya disusun semula.',
  '<strong>Selesai!</strong> Kuasa dua sempurna <strong>(x + b/2a)²</strong> terbentuk. Panjang sisinya memberikan kita bucu parabola.',
];

const TOTAL_PHASES = PHASE_CAPTIONS.length;

const PHASE_LABELS    = ['x² Tile', '½bx Split', 'Gap Found', 'Fill Corner', 'Balance', 'Complete!'];
const PHASE_LABELS_MS = ['Jubin x²', 'Bahagi ½bx', 'Cari Ruang', 'Isi Sudut', 'Imbang', 'Selesai!'];

function getPhaseCaption(phase) {
  return (currentLang === 'ms' ? PHASE_CAPTIONS_MS : PHASE_CAPTIONS)[phase] || '';
}
function getPhaseLabels() {
  return currentLang === 'ms' ? PHASE_LABELS_MS : PHASE_LABELS;
}

function initAnimation() {
  if (!STATE) return;

  // --- canvas setup ---
  const canvas = document.getElementById('animCanvas');
  const dpr    = window.devicePixelRatio || 1;
  canvas.width  = canvas.offsetWidth  * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;

  // --- compute tile pixel sizes ---
  const maxSide = Math.min(W, H) * 0.72;
  const r = Math.min(Math.abs(STATE.half_ba), 2.5);
  const xPx = maxSide / (1 + r);
  const bPx = maxSide * r / (1 + r);
  const bPxFinal = Math.max(bPx, 28);
  const xPxFinal = maxSide - bPxFinal;

  const totalSide = xPxFinal + bPxFinal;
  const ox = W / 2 - totalSide / 2;
  const oy = H / 2 - totalSide / 2;

  const G = { ox, oy, xPx: xPxFinal, bPx: bPxFinal, W, H };

  // kill previous animation loop before creating new state
  if (ANIM) { ANIM.kill = true; if (ANIM.rafId) cancelAnimationFrame(ANIM.rafId); }

  ANIM = {
    ctx, canvas, G,
    phase: 0,
    playing: false,
    rafId: null,
    kill: false,
    pulseTick: 0,
    celebrated: false,
    confetti: null,
    confettiStart: null,
  };

  // show subtitle
  const { a, b, c } = STATE;
  document.getElementById('animSubtitle').textContent =
    `Visualising: ${fmt(a)}x\xB2 ${b >= 0 ? '+' : '−'} ${fmt(Math.abs(b))}x ${c >= 0 ? '+' : '−'} ${fmt(Math.abs(c))}`;

  // hide completion badge on reset
  const badge = document.getElementById('completionBadge');
  if (badge) badge.classList.add('hidden');

  drawPhase(ANIM, 0, 1);
  updatePhaseUI(0);

  // reset play button to Play state
  setPlayBtn(false);

  // wire buttons
  document.getElementById('btnPlay').onclick  = () => togglePlay();
  document.getElementById('btnNext').onclick  = () => stepPhase(1);
  document.getElementById('btnPrev').onclick  = () => stepPhase(-1);
  document.getElementById('btnReset').onclick = () => initAnimation();
}

function setPlayBtn(playing) {
  const btn = document.getElementById('btnPlay');
  if (!btn) return;
  const lbl = playing
    ? (currentLang === 'ms' ? 'Jeda' : 'Pause')
    : (currentLang === 'ms' ? 'Main' : 'Play');
  if (playing) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> ${lbl}`;
  } else {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg> ${lbl}`;
  }
}

function togglePlay() {
  if (!ANIM) return;
  if (ANIM.playing) pauseAnim(); else playAnim();
}

function pauseAnim() {
  if (!ANIM) return;
  ANIM.playing = false;
  if (ANIM.rafId) { cancelAnimationFrame(ANIM.rafId); ANIM.rafId = null; }
  setPlayBtn(false);
}

function playAnim() {
  if (!ANIM) return;
  ANIM.playing = true;
  setPlayBtn(true);
  advancePhaseAnim();
}

function stepPhase(dir) {
  if (!ANIM) return;
  pauseAnim();
  const next = Math.max(0, Math.min(TOTAL_PHASES - 1, ANIM.phase + dir));
  ANIM.phase = next;
  drawPhase(ANIM, next, 1);
  updatePhaseUI(next);
}

function advancePhaseAnim() {
  if (!ANIM || !ANIM.playing) return;
  if (ANIM.phase >= TOTAL_PHASES - 1) { pauseAnim(); return; }

  const toPhase  = ANIM.phase + 1;
  const duration = 900 / SPEED;
  const start    = performance.now();

  function tick(now) {
    if (ANIM.kill || !ANIM.playing) return;
    const t     = Math.min((now - start) / duration, 1);
    const eased = easeInOut(t);
    drawPhase(ANIM, toPhase, eased);
    if (t < 1) {
      ANIM.rafId = requestAnimationFrame(tick);
    } else {
      ANIM.phase = toPhase;
      updatePhaseUI(toPhase);
      if (toPhase < TOTAL_PHASES - 1) {
        setTimeout(() => { if (ANIM && ANIM.playing) advancePhaseAnim(); }, 1100 / SPEED);
      } else {
        pauseAnim();
      }
    }
  }
  ANIM.rafId = requestAnimationFrame(tick);
}

function updatePhaseUI(phase) {
  const ind = document.getElementById('phaseIndicator');
  if (ind) {
    const checkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><path d="M20 6L9 17l-5-5"/></svg>`;
    const labels = getPhaseLabels();
    ind.innerHTML = labels.map((label, i) => {
      const cls = i < phase ? 'done' : i === phase ? 'active' : '';
      const dot = i < phase ? checkSVG : String(i + 1);
      return `<div class="stepper-step ${cls}" id="pd${i}"><div class="stepper-dot">${dot}</div><div class="stepper-label">${label}</div></div>`
           + (i < TOTAL_PHASES - 1 ? `<div class="stepper-connector ${i < phase ? 'done' : ''}"></div>` : '');
    }).join('');
  }

  document.getElementById('phaseCaption').innerHTML = getPhaseCaption(phase);

  // sync step highlight
  syncStepHighlight(phase);

  // completion badge + confetti + quiz
  if (phase === TOTAL_PHASES - 1 && STATE) {
    const badge = document.getElementById('completionBadge');
    if (badge) {
      badge.classList.remove('hidden');
      const bv = document.getElementById('badgeVertex');
      if (bv) bv.textContent = `${fmt(STATE.h)}, ${fmt(STATE.k)}`;
    }
    if (ANIM && !ANIM.celebrated) {
      ANIM.celebrated    = true;
      ANIM.confetti      = spawnConfetti(ANIM.G);
      ANIM.confettiStart = performance.now();
    }
    generateQuiz();
  }
}

// ─────────────────────────────────────────────────────────────
//  CONFETTI
// ─────────────────────────────────────────────────────────────
function spawnConfetti(G) {
  const colours = ['#3B82F6','#F59E0B','#8B5CF6','#10B981','#EF4444','#60A5FA','#FCD34D','#34D399'];
  return Array.from({ length: 80 }, () => ({
    x0: Math.random() * G.W,
    y0: -20 - Math.random() * 60,
    vx: (Math.random() - 0.5) * 320,
    vy: Math.random() * 160 + 60,
    color: colours[Math.floor(Math.random() * colours.length)],
    size: Math.random() * 7 + 3,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 12,
  }));
}

function drawConfettiParticles(ctx, G, particles, elapsed, cduration) {
  const t = elapsed / 1000;
  const fadeStart = cduration * 0.6;
  particles.forEach(p => {
    const x = p.x0 + p.vx * t;
    const y = p.y0 + p.vy * t + 0.5 * 220 * t * t;
    if (y > G.H + 20 || x < -30 || x > G.W + 30) return;
    const life = elapsed > fadeStart ? 1 - (elapsed - fadeStart) / (cduration - fadeStart) : 1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, life) * 0.88;
    ctx.fillStyle = p.color;
    ctx.translate(x, y);
    ctx.rotate(p.rotation + t * p.spin);
    ctx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
    ctx.restore();
  });
}

// ─────────────────────────────────────────────────────────────
//  DRAW PHASE
//  phase = destination phase index (0–5)
//  t     = 0..1, eased progress INTO that phase
// ─────────────────────────────────────────────────────────────
function drawPhase(anim, phase, t) {
  if (!anim || anim.kill) return;
  const { ctx, G } = anim;
  const { W, H, ox, oy, xPx, bPx } = G;

  // clear
  ctx.clearRect(0, 0, W, H);
  drawGrid(ctx, W, H);

  // Each phase builds on the previous — we draw the "complete" state
  // of phases < current, then animate the arriving elements of `phase`.

  if (phase === 0) {
    // Just the x² square, fading/scaling in
    drawX2(ctx, G, t);

  } else if (phase === 1) {
    // x² (done) + two bx rects sliding in
    drawX2(ctx, G, 1);
    drawBxRight(ctx, G, t);   // slides from right
    drawBxBottom(ctx, G, t);  // slides from bottom

  } else if (phase === 2) {
    // x² + both rects (done) + corner gap pulses in
    drawX2(ctx, G, 1);
    drawBxRight(ctx, G, 1);
    drawBxBottom(ctx, G, 1);
    drawCornerGap(ctx, G, t, anim);

  } else if (phase === 3) {
    // everything + corner piece drops in
    drawX2(ctx, G, 1);
    drawBxRight(ctx, G, 1);
    drawBxBottom(ctx, G, 1);
    drawCornerDrop(ctx, G, t);

  } else if (phase === 4) {
    // full grid + subtraction note appears
    drawX2(ctx, G, 1);
    drawBxRight(ctx, G, 1);
    drawBxBottom(ctx, G, 1);
    drawCornerFull(ctx, G, 1);
    drawSubtractNote(ctx, G, t);

  } else if (phase === 5) {
    // final complete square with annotations
    drawFinalSquare(ctx, G, t);
  }
}

// ─────────────────────────────────────────────────────────────
//  TILE DRAWING HELPERS
// ─────────────────────────────────────────────────────────────

function drawGrid(ctx, W, H) {
  ctx.save();
  ctx.strokeStyle = 'rgba(59,130,246,0.055)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

function glow(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
}

function tile(ctx, x, y, w, h, fill, stroke, alpha = 1, radius = 8) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function tileLabel(ctx, x, y, w, h, text, color = '#fff', size = 13) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // clip label inside tile
  ctx.beginPath();
  ctx.rect(x + 4, y + 4, w - 8, h - 8);
  ctx.clip();
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

// ─── PHASE DRAW FUNCTIONS ───

function drawX2(ctx, G, t) {
  const { ox, oy, xPx, W, H } = G;
  const scale = easeOut(t);
  const cx = ox + xPx / 2;
  const cy = oy + xPx / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  glow(ctx, cx, cy, xPx * 0.8, `rgba(37,99,235,${0.2 * t})`);
  tile(ctx, ox, oy, xPx, xPx, '#1D4ED8', '#3B82F6', 1, 10);
  tileLabel(ctx, ox, oy, xPx, xPx, 'x²', '#93C5FD', Math.max(16, xPx * 0.15));
  ctx.restore();

  // dimension tick – top
  if (t > 0.8) {
    ctx.save();
    ctx.globalAlpha = (t - 0.8) / 0.2;
    ctx.fillStyle = 'rgba(147,197,253,0.7)';
    ctx.font = '500 11px Outfit';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('x', ox + xPx / 2, oy - 6);
    ctx.restore();
  }
}

function drawBxRight(ctx, G, t) {
  // slides in from the right
  const { ox, oy, xPx, bPx, W } = G;
  const destX = ox + xPx;
  const startX = W + 60;
  const x = lerp(startX, destX, easeOut(t));
  tile(ctx, x, oy, bPx, xPx, '#92400E', '#F59E0B', Math.min(1, t * 1.4), 8);
  if (t > 0.5) {
    const alpha = Math.min(1, (t - 0.5) * 2);
    tileLabel(ctx, x, oy, bPx, xPx, `b\n2a·x`, '#FDE68A', 11);
  }
  if (t >= 1) {
    // dimension tick
    ctx.save();
    ctx.fillStyle = 'rgba(253,230,138,0.7)';
    ctx.font = '500 11px Outfit';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('b/2a', ox + xPx + bPx / 2, oy - 6);
    ctx.restore();
  }
}

function drawBxBottom(ctx, G, t) {
  // slides in from the bottom
  const { ox, oy, xPx, bPx, H } = G;
  const destY = oy + xPx;
  const startY = H + 60;
  const y = lerp(startY, destY, easeOut(t));
  tile(ctx, ox, y, xPx, bPx, '#92400E', '#F59E0B', Math.min(1, t * 1.4), 8);
  if (t > 0.5) {
    tileLabel(ctx, ox, y, xPx, bPx, `b/2a·x`, '#FDE68A', 11);
  }
  if (t >= 1) {
    // dimension tick – left side
    ctx.save();
    ctx.save();
    ctx.translate(ox - 10, oy + xPx + bPx / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(253,230,138,0.7)';
    ctx.font = '500 11px Outfit';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('b/2a', 0, 0);
    ctx.restore();
    ctx.restore();
  }
}

function drawCornerGap(ctx, G, t, anim) {
  // pulsing dashed gap
  const { ox, oy, xPx, bPx } = G;
  const cx = ox + xPx + bPx / 2;
  const cy = oy + xPx + bPx / 2;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 280);

  ctx.save();
  ctx.globalAlpha = t;
  ctx.fillStyle = `rgba(239,68,68,${0.08 + 0.06 * pulse})`;
  ctx.fillRect(ox + xPx, oy + xPx, bPx, bPx);

  ctx.strokeStyle = `rgba(239,68,68,${0.6 + 0.35 * pulse})`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(ox + xPx + 1, oy + xPx + 1, bPx - 2, bPx - 2);
  ctx.setLineDash([]);

  ctx.fillStyle = `rgba(252,165,165,${0.55 + 0.35 * pulse})`;
  ctx.font = `bold ${Math.min(bPx * 0.4, 24)}px Outfit`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy);
  ctx.restore();

  // label
  if (t > 0.6) {
    ctx.save();
    ctx.globalAlpha = (t - 0.6) / 0.4;
    ctx.fillStyle = 'rgba(252,165,165,0.8)';
    ctx.font = '500 11px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('(b/2a)²', cx, oy + xPx + bPx + 8);
    ctx.restore();
  }

  // re-request frame for pulse
  anim.pulseTick++;
  if (anim.phase === 2) {
    anim.rafId = requestAnimationFrame(() => {
      if (!anim.kill && anim.phase === 2) {
        ctx.clearRect(0, 0, G.W, G.H);
        drawGrid(ctx, G.W, G.H);
        drawX2(ctx, G, 1);
        drawBxRight(ctx, G, 1);
        drawBxBottom(ctx, G, 1);
        drawCornerGap(ctx, G, 1, anim);
      }
    });
  }
}

function drawCornerDrop(ctx, G, t) {
  // corner piece drops from above
  const { ox, oy, xPx, bPx } = G;
  const destY = oy + xPx;
  const startY = oy - bPx - 40;
  const y = lerp(startY, destY, easeOut(t));
  const alpha = Math.min(1, t * 1.5);

  tile(ctx, ox + xPx, y, bPx, bPx, '#5B21B6', '#8B5CF6', alpha, 6);
  if (t > 0.5) {
    const { half_ba } = STATE;
    tileLabel(ctx, ox + xPx, y, bPx, bPx, `(b/2a)²`, '#DDD6FE', 10);
  }

  // value label
  if (t > 0.7) {
    ctx.save();
    ctx.globalAlpha = (t - 0.7) / 0.3;
    ctx.fillStyle = 'rgba(196,181,253,0.9)';
    ctx.font = '600 11px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`= ${fmt(STATE.corner)}`, ox + xPx + bPx / 2, destY + bPx + 8);
    ctx.restore();
  }
}

function drawCornerFull(ctx, G, t) {
  const { ox, oy, xPx, bPx } = G;
  tile(ctx, ox + xPx, oy + xPx, bPx, bPx, '#5B21B6', '#8B5CF6', 1, 6);
  tileLabel(ctx, ox + xPx, oy + xPx, bPx, bPx, `(b/2a)²`, '#DDD6FE', 10);
}

function drawSubtractNote(ctx, G, t) {
  const { ox, oy, xPx, bPx, W, H } = G;

  // full grid visible
  drawCornerFull(ctx, G, 1);

  // outer glow to signal "complete"
  ctx.save();
  ctx.globalAlpha = t * 0.6;
  ctx.strokeStyle = 'rgba(139,92,246,0.6)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(ox - 2, oy - 2, xPx + bPx + 4, xPx + bPx + 4);
  ctx.restore();

  // subtraction note floating out to the side
  const noteX = lerp(ox + xPx + bPx + 10, ox + xPx + bPx + 80, easeOut(t));
  const noteY = oy + xPx + bPx / 2;
  ctx.save();
  ctx.globalAlpha = t;
  ctx.fillStyle = '#EF4444';
  ctx.font = 'bold 13px JetBrains Mono';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`− ${fmt(STATE.corner)}`, noteX, noteY);
  ctx.restore();

  // balance equation below
  if (t > 0.5) {
    ctx.save();
    ctx.globalAlpha = (t - 0.5) * 2;
    ctx.fillStyle = 'rgba(167,139,250,0.85)';
    ctx.font = '500 12px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const label = `+${fmt(STATE.corner)} − ${fmt(STATE.corner)} = 0  ✓`;
    ctx.fillText(label, W / 2, oy + xPx + bPx + 18);
    ctx.restore();
  }
}

function drawFinalSquare(ctx, G, t) {
  // Transition: tiles merge into one outlined square, then annotations appear
  const { ox, oy, xPx, bPx, W, H } = G;
  const side = xPx + bPx;
  const cx = ox + side / 2;
  const cy = oy + side / 2;

  // glow pulse
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
  glow(ctx, cx, cy, side * 0.85, `rgba(139,92,246,${0.18 * t})`);
  glow(ctx, cx, cy, side * 0.5,  `rgba(59,130,246,${0.12 * t})`);

  // draw all 4 tiles (fade in)
  tile(ctx, ox,        oy,        xPx, xPx, '#1D4ED8', '#3B82F6', t, 0);
  tile(ctx, ox + xPx,  oy,        bPx, xPx, '#92400E', '#F59E0B', t, 0);
  tile(ctx, ox,        oy + xPx,  xPx, bPx, '#92400E', '#F59E0B', t, 0);
  tile(ctx, ox + xPx,  oy + xPx,  bPx, bPx, '#5B21B6', '#8B5CF6', t, 0);

  // labels
  if (t > 0.4) {
    const la = Math.min(1, (t - 0.4) / 0.4);
    ctx.save(); ctx.globalAlpha = la;
    tileLabel(ctx, ox,       oy,       xPx, xPx, 'x²',      '#93C5FD', Math.max(14, xPx * 0.13));
    tileLabel(ctx, ox + xPx, oy,       bPx, xPx, 'b/2a·x',  '#FDE68A', 10);
    tileLabel(ctx, ox,       oy + xPx, xPx, bPx, 'b/2a·x',  '#FDE68A', 10);
    tileLabel(ctx, ox + xPx, oy + xPx, bPx, bPx, '(b/2a)²', '#DDD6FE', 10);
    ctx.restore();
  }

  // outer border — the perfect square
  ctx.save();
  ctx.globalAlpha = t;
  ctx.strokeStyle = `rgba(167,139,250,${0.7 + 0.25 * pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.strokeRect(ox, oy, side, side);
  ctx.restore();

  // dimension labels on outside
  if (t > 0.6) {
    const la = Math.min(1, (t - 0.6) / 0.4);
    const { h, half_ba } = STATE;
    const pSign = half_ba >= 0 ? '+' : '−';
    const sideLabel = `x ${pSign} ${fmt(Math.abs(half_ba))}`;

    ctx.save();
    ctx.globalAlpha = la;
    ctx.fillStyle = 'rgba(196,181,253,0.9)';
    ctx.font = '600 12px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(sideLabel, cx, oy - 10);

    ctx.save();
    ctx.translate(ox - 14, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(sideLabel, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  // equation below
  if (t > 0.75) {
    const la = Math.min(1, (t - 0.75) / 0.25);
    const { half_ba } = STATE;
    const pSign = half_ba >= 0 ? '+' : '−';
    const eqText = `(x ${pSign} ${fmt(Math.abs(half_ba))})²`;
    ctx.save();
    ctx.globalAlpha = la;
    ctx.fillStyle = '#A78BFA';
    ctx.font = 'bold 16px JetBrains Mono';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(`= ${eqText}`, cx, oy + side + 14);
    ctx.restore();
  }

  // confetti celebration
  if (ANIM && ANIM.confetti && ANIM.confettiStart) {
    const elapsed   = performance.now() - ANIM.confettiStart;
    const cduration = 4000;
    if (elapsed < cduration) drawConfettiParticles(ctx, G, ANIM.confetti, elapsed, cduration);
  }

  // keep re-drawing for pulse + confetti
  if (ANIM && ANIM.phase === 5 && !ANIM.playing) {
    ANIM.rafId = requestAnimationFrame(() => {
      if (ANIM && !ANIM.kill && ANIM.phase === 5) {
        ctx.clearRect(0, 0, G.W, G.H);
        drawGrid(ctx, G.W, G.H);
        drawFinalSquare(ctx, G, 1);
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  PARABOLA GRAPH
// ─────────────────────────────────────────────────────────────
function drawGraph() {
  if (!STATE) return;
  const gc   = document.getElementById('graphCanvas');
  const dpr  = window.devicePixelRatio || 1;
  gc.width   = gc.offsetWidth  * dpr;
  gc.height  = gc.offsetHeight * dpr;
  const gctx = gc.getContext('2d');
  gctx.scale(dpr, dpr);

  const W = gc.offsetWidth, H = gc.offsetHeight;
  const { a, b, c, h, k, roots } = STATE;

  const PAD = { l: 42, r: 20, t: 20, b: 32 };
  const IW = W - PAD.l - PAD.r;
  const IH = H - PAD.t - PAD.b;

  // domain
  const span = Math.max(5, Math.abs(STATE.half_ba) + 4);
  const xMin = h - span, xMax = h + span;

  // compute y range
  const pts = [];
  for (let x = xMin; x <= xMax; x += (xMax - xMin) / 200)
    pts.push(a * x * x + b * x + c);
  const yPad  = Math.max(1, (Math.max(...pts) - Math.min(...pts)) * 0.15);
  const yMin  = Math.min(...pts) - yPad;
  const yMax  = Math.max(...pts) + yPad;

  const toX = x => PAD.l + ((x - xMin) / (xMax - xMin)) * IW;
  const toY = y => PAD.t + IH - ((y - yMin) / (yMax - yMin)) * IH;

  // grid
  gctx.strokeStyle = 'rgba(59,130,246,0.08)'; gctx.lineWidth = 1;
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const cx = toX(x);
    gctx.beginPath(); gctx.moveTo(cx, PAD.t); gctx.lineTo(cx, H - PAD.b); gctx.stroke();
    gctx.fillStyle = 'rgba(123,144,184,0.7)'; gctx.font = '10px Outfit';
    gctx.textAlign = 'center'; gctx.textBaseline = 'top';
    gctx.fillText(x, cx, H - PAD.b + 4);
  }

  // axes
  gctx.strokeStyle = 'rgba(240,244,255,0.15)'; gctx.lineWidth = 1.5;
  const zeroY = toY(0), zeroX = toX(0);
  if (zeroY >= PAD.t && zeroY <= H - PAD.b) {
    gctx.beginPath(); gctx.moveTo(PAD.l, zeroY); gctx.lineTo(W - PAD.r, zeroY); gctx.stroke();
    gctx.fillStyle = 'rgba(123,144,184,0.6)'; gctx.font = '10px Outfit';
    gctx.textAlign = 'right'; gctx.textBaseline = 'middle';
    gctx.fillText('0', PAD.l - 4, zeroY);
  }
  if (zeroX >= PAD.l && zeroX <= W - PAD.r) {
    gctx.beginPath(); gctx.moveTo(zeroX, PAD.t); gctx.lineTo(zeroX, H - PAD.b); gctx.stroke();
  }

  // axis labels
  gctx.fillStyle = 'rgba(123,144,184,0.7)'; gctx.font = '11px Outfit';
  gctx.textAlign = 'center'; gctx.textBaseline = 'top';
  gctx.fillText('x', W - PAD.r, H - PAD.b + 4);
  gctx.textAlign = 'left'; gctx.textBaseline = 'top';
  gctx.fillText('f(x)', PAD.l + 4, PAD.t);

  // parabola with gradient
  const grad = gctx.createLinearGradient(PAD.l, 0, W - PAD.r, 0);
  grad.addColorStop(0,   'rgba(59,130,246,0.5)');
  grad.addColorStop(0.5, '#60A5FA');
  grad.addColorStop(1,   'rgba(59,130,246,0.5)');
  gctx.beginPath();
  let first = true;
  for (let x = xMin; x <= xMax; x += (xMax - xMin) / 300) {
    const y  = a * x * x + b * x + c;
    const cx = toX(x), cy = toY(y);
    if (first) { gctx.moveTo(cx, cy); first = false; } else { gctx.lineTo(cx, cy); }
  }
  gctx.strokeStyle = grad; gctx.lineWidth = 2.5; gctx.stroke();

  // vertex
  const vx = toX(h), vy = toY(k);
  gctx.beginPath(); gctx.arc(vx, vy, 5.5, 0, Math.PI * 2);
  gctx.fillStyle = '#F59E0B'; gctx.fill();
  gctx.fillStyle = '#FCD34D';
  gctx.font = 'bold 11px Outfit'; gctx.textAlign = 'center';
  gctx.textBaseline = k > yMin + (yMax - yMin) * 0.15 ? 'bottom' : 'top';
  gctx.fillText(`V(${fmt(h)}, ${fmt(k)})`, vx, vy + (k > yMin + (yMax - yMin) * 0.15 ? -8 : 8));

  // roots
  roots.forEach(rx => {
    if (rx < xMin || rx > xMax) return;
    const cx = toX(rx), cy = toY(0);
    gctx.beginPath(); gctx.arc(cx, cy, 5, 0, Math.PI * 2);
    gctx.fillStyle = '#10B981'; gctx.fill();
    gctx.fillStyle = '#34D399';
    gctx.font = '10px Outfit'; gctx.textAlign = 'center'; gctx.textBaseline = 'bottom';
    gctx.fillText(fmt(rx), cx, cy - 7);
  });
}

// ─────────────────────────────────────────────────────────────
//  SIDEBAR NAVIGATION
// ─────────────────────────────────────────────────────────────
function sidebarScrollTo(targetId, el) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
}

// update active sidebar item on scroll
const sidebarSections = [
  { id: 'hero',          navId: 'sNav-home'  },
  { id: 'appSection',    navId: 'sNav-app'   },
  { id: 'resultsSection',navId: 'sNav-steps' },
  { id: 'teamSection',   navId: 'sNav-team'  },
];

window.addEventListener('scroll', () => {
  const scrollMid = window.scrollY + window.innerHeight / 3;
  let activeNav = 'sNav-home';
  for (const sec of sidebarSections) {
    const el = document.getElementById(sec.id);
    if (el && el.offsetTop <= scrollMid) activeNav = sec.navId;
  }
  document.querySelectorAll('.sidebar-item[id^="sNav"]').forEach(i => i.classList.remove('active'));
  const active = document.getElementById(activeNav);
  if (active) active.classList.add('active');
}, { passive: true });

// ─────────────────────────────────────────────────────────────
//  FLOATING EQUATIONS (hero)
// ─────────────────────────────────────────────────────────────
const FLOAT_EQS = ['x²+6x+5','(x+3)²−4','ax²+bx+c','Δ=b²−4ac','(x+b/2a)²','x=−b±√Δ','2a','∫f(x)dx'];
function spawnFloat() {
  if (!_floatEnabled) return;
  const el = document.createElement('div');
  el.className = 'float-eq';
  el.textContent = FLOAT_EQS[Math.floor(Math.random() * FLOAT_EQS.length)];
  el.style.left   = Math.random() * 100 + 'vw';
  el.style.bottom = '-2rem';
  el.style.animationDuration = (13 + Math.random() * 12) + 's';
  document.getElementById('hero').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
for (let i = 0; i < 5; i++) setTimeout(spawnFloat, i * 2000);
setInterval(spawnFloat, 2000);

// ─────────────────────────────────────────────────────────────
//  SCROLL REVEAL
// ─────────────────────────────────────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('shown'); });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ─────────────────────────────────────────────────────────────
//  LIVE FORMULA ON INPUT
// ─────────────────────────────────────────────────────────────
['coeff-a', 'coeff-b', 'coeff-c'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const a = parseFloat(document.getElementById('coeff-a').value) || 0;
    const b = parseFloat(document.getElementById('coeff-b').value) || 0;
    const c = parseFloat(document.getElementById('coeff-c').value) || 0;
    updateEqDisplay(a, b, c);
    updateLiveFormula(a, b, c);
  });
});

// ─────────────────────────────────────────────────────────────
//  WIRE SOLVE BUTTON + KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────────────────────
document.getElementById('btnSolve').addEventListener('click', solve);

document.addEventListener('keydown', e => {
  const inInput = document.activeElement.closest('#inputPanel');
  if (inInput) {
    if (e.key === 'Enter') solve();
    return;
  }
  if (e.key === 'ArrowRight') { e.preventDefault(); stepPhase(1); }
  else if (e.key === 'ArrowLeft')  { e.preventDefault(); stepPhase(-1); }
  else if (e.key === ' ')          { e.preventDefault(); togglePlay(); }
  else if (e.key === 'r' || e.key === 'R') { if (ANIM) initAnimation(); }
});

// ─────────────────────────────────────────────────────────────
//  RESIZE
// ─────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (STATE) { initAnimation(); drawGraph(); }
});

// ─────────────────────────────────────────────────────────────
//  AUTO-RUN DEMO ON LOAD
// ─────────────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const slider = document.getElementById('speedSlider');
  if (slider) {
    slider.addEventListener('input', function () {
      SPEED = parseFloat(this.value);
      document.getElementById('speedVal').textContent = SPEED + '\xD7';
    });
  }

  // Read equation from URL params if shared
  const params = new URLSearchParams(window.location.search);
  const pa = parseFloat(params.get('a')), pb = parseFloat(params.get('b')), pc = parseFloat(params.get('c'));
  if (!isNaN(pa) && !isNaN(pb) && !isNaN(pc) && pa !== 0) {
    document.getElementById('coeff-a').value = pa;
    document.getElementById('coeff-b').value = pb;
    document.getElementById('coeff-c').value = pc;
    updateLiveFormula(pa, pb, pc);
    setTimeout(solve, 700);
  }

  initHeroCanvas();
  initPresets();
  initShareButton();
  initPhotoUpload();
  initLangToggle();
  initTitleTyping();
  drawCanvasPlaceholders();
});

// ─────────────────────────────────────────────────────────────
//  PRESET BUTTONS
// ─────────────────────────────────────────────────────────────
function initPresets() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = parseFloat(btn.dataset.a);
      const b = parseFloat(btn.dataset.b);
      const c = parseFloat(btn.dataset.c);
      document.getElementById('coeff-a').value = a;
      document.getElementById('coeff-b').value = b;
      document.getElementById('coeff-c').value = c;
      document.querySelectorAll('.preset-btn').forEach(b2 => b2.classList.remove('active'));
      btn.classList.add('active');
      updateLiveFormula(a, b, c);
      solve();
      document.getElementById('appSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  SHARE BUTTON — encode a,b,c into URL
// ─────────────────────────────────────────────────────────────
function initShareButton() {
  const btn = document.getElementById('btnShare');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const a = document.getElementById('coeff-a').value;
    const b = document.getElementById('coeff-b').value;
    const c = document.getElementById('coeff-c').value;
    const url = `${location.origin}${location.pathname}?a=${a}&b=${b}&c=${c}`;
    navigator.clipboard.writeText(url).then(() => {
      const toast = document.getElementById('shareToast');
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2400);
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  PHOTO SCAN FEATURE
// ─────────────────────────────────────────────────────────────
let _photoOpen = false;

function togglePhotoSection() {
  _photoOpen = !_photoOpen;
  const sec = document.getElementById('photoSection');
  const btn = document.getElementById('scanPhotoBtn');
  sec.classList.toggle('hidden', !_photoOpen);
  btn.classList.toggle('active', _photoOpen);
}

function setPhotoState(state) {
  document.getElementById('pzIdle').classList.toggle('hidden', state !== 'idle');
  document.getElementById('pzProcessing').classList.toggle('hidden', state !== 'processing');
  document.getElementById('pzDone').classList.toggle('hidden', state !== 'done');
}

function resetPhotoZone() {
  setPhotoState('idle');
  document.getElementById('photoFileInput').value = '';
}

function initPhotoUpload() {
  const zone      = document.getElementById('photoZone');
  const fileInput = document.getElementById('photoFileInput');
  if (!zone || !fileInput) return;

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handlePhotoFile(fileInput.files[0]);
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', e => {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handlePhotoFile(file);
  });
}

async function handlePhotoFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('Image too large — please use a file under 10 MB.');
    return;
  }
  const url = URL.createObjectURL(file);
  document.getElementById('pzThumb').src     = url;
  document.getElementById('pzDoneThumb').src = url;
  setPhotoState('processing');

  const labelEl = document.getElementById('pzProcLabel');
  const subEl   = document.getElementById('pzProcSub');

  try {
    if (!window.Tesseract) {
      labelEl.textContent = 'Loading OCR engine…';
      subEl.textContent   = 'Downloading ~10 MB on first use';
      await _loadTesseract();
    }
    labelEl.textContent = 'Scanning equation…';
    subEl.textContent   = '';

    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          labelEl.textContent = 'Scanning… ' + Math.round(m.progress * 100) + '%';
        }
      }
    });

    const rawText = text.trim();
    const found   = parseQuadraticFromText(rawText);
    const ocrEl   = document.getElementById('pzOcrText');
    const resEl   = document.getElementById('pzEqResult');

    ocrEl.textContent = rawText || '(no text detected)';
    setPhotoState('done');

    if (found) {
      const { a, b, c } = found;
      resEl.className = 'pz-eq-result success';
      resEl.innerHTML = `&#10003; Found <strong>a=${a}, b=${b}, c=${c}</strong> &mdash; filling equation&hellip;`;

      document.getElementById('coeff-a').value = a;
      document.getElementById('coeff-b').value = b;
      document.getElementById('coeff-c').value = c;
      updateEqDisplay(a, b, c);
      updateLiveFormula(a, b, c);

      setTimeout(() => {
        solve();
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 700);
    } else {
      resEl.className = 'pz-eq-result fail';
      resEl.innerHTML = '&#10007; No quadratic found.<br><small>Tips: ensure the equation (e.g. x²+6x+5=0) is clearly visible and well-lit.</small>';
    }
  } catch (err) {
    setPhotoState('done');
    document.getElementById('pzOcrText').textContent = '';
    const resEl = document.getElementById('pzEqResult');
    resEl.className = 'pz-eq-result fail';
    resEl.textContent = '✗ Error: ' + (err.message || 'Could not scan image');
  }
  URL.revokeObjectURL(url);
}

function _loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js';
    s.onload  = resolve;
    s.onerror = () => reject(new Error('Could not load OCR library. Check your internet connection.'));
    document.head.appendChild(s);
  });
}

// Parse a quadratic equation from OCR raw text
function parseQuadraticFromText(raw) {
  const lines = raw.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 2);
  for (const line of lines) {
    const r = _tryParseQuadraticLine(line);
    if (r) return r;
  }
  return _tryParseQuadraticLine(raw.replace(/[\r\n\s]+/g, ' '));
}

function _tryParseQuadraticLine(line) {
  let s = line
    .replace(/[²²]/g, '^2')
    .replace(/[−–—‐‑]/g, '-')
    .replace(/\s+/g, '')
    .toLowerCase();

  s = s.replace(/=.*$/, '');
  if (!s) return null;

  // Normalise x² variants to token Q
  s = s.replace(/x\^2/g, 'Q').replace(/x2(?!\d)/g, 'Q');
  if (!s.includes('Q')) return null;

  if (!/^[+-]/.test(s)) s = '+' + s;

  const tokens = s.match(/[+-][^+-]*/g) || [];
  let a = 0, b = 0, c = 0;

  for (const tok of tokens) {
    const mQ = tok.match(/^([+-])(\d*\.?\d*)Q$/);
    const mX = tok.match(/^([+-])(\d*\.?\d*)x$/);
    const mC = tok.match(/^([+-]\d+\.?\d*)$/);

    const toCoeff = (sign, num) => (sign === '-' ? -1 : 1) * (num === '' ? 1 : (parseFloat(num) || 1));

    if (mQ)      a += toCoeff(mQ[1], mQ[2]);
    else if (mX) b += toCoeff(mX[1], mX[2]);
    else if (mC) c += parseFloat(mC[1]);
  }

  if (a === 0) return null;
  const rnd = n => Math.round(n * 1000) / 1000;
  return { a: rnd(a), b: rnd(b), c: rnd(c) };
}

// ─────────────────────────────────────────────────────────────
//  LANGUAGE TOGGLE (EN / BM)
// ─────────────────────────────────────────────────────────────
let currentLang = 'en';

function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ms' : 'en';
    document.getElementById('langLabel').textContent = currentLang === 'en' ? 'BM' : 'EN';

    // Spin the globe icon
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 420);

    // Fade overlay → swap text → fade out
    document.body.classList.add('lang-transitioning');
    setTimeout(() => {
      applyLang(currentLang);
      document.body.classList.remove('lang-transitioning');
    }, 140);
  });
}

function applyLang(lang) {
  // Update all elements with data-en / data-ms attributes
  document.querySelectorAll('[data-en]').forEach(el => {
    const val = el.dataset[lang] || el.dataset.en;
    if (!val) return;
    if (el.children.length === 0) {
      el.textContent = val;
    }
  });

  // Hero h1 accent words (inside spans, handled separately)
  const heroW1 = document.getElementById('heroWord1');
  const heroW2 = document.getElementById('heroWord2');
  if (heroW1) heroW1.textContent = lang === 'ms' ? 'Segiempat' : 'Square';
  if (heroW2) heroW2.textContent = lang === 'ms' ? 'Persamaan' : 'Equation';

  // Play button label
  if (ANIM) setPlayBtn(ANIM.playing);

  // Discriminant note
  if (STATE) {
    const discNote = STATE.disc > 0
      ? (lang === 'ms' ? '→ 2 punca nyata' : '→ 2 real roots')
      : STATE.disc === 0
        ? (lang === 'ms' ? '→ 1 punca nyata (berganda)' : '→ 1 real root (double)')
        : (lang === 'ms' ? '→ tiada punca nyata' : '→ no real roots');
    const discEl = document.getElementById('discRow');
    if (discEl) {
      const discClass = STATE.disc > 0 ? 'pos' : STATE.disc === 0 ? 'zero' : 'neg';
      discEl.innerHTML = `<span class="disc-val ${discClass}">Δ = ${fmt(STATE.disc)}</span><span style="color:var(--muted);font-size:.8em">${discNote}</span>`;
    }

    // Roots labels
    const rootsBox = document.getElementById('rootsBox');
    if (rootsBox) {
      const { a, b, disc } = STATE;
      if (disc > 0) {
        rootsBox.innerHTML =
          `<div class="root-pill real"><div class="root-label">x₁</div><div class="root-val">${fmt(STATE.roots[0])}</div></div>` +
          `<div class="root-pill real"><div class="root-label">x₂</div><div class="root-val">${fmt(STATE.roots[1])}</div></div>`;
      } else if (disc === 0) {
        const dbl = lang === 'ms' ? 'punca berganda' : 'double root';
        rootsBox.innerHTML = `<div class="root-pill real"><div class="root-label">x (${dbl})</div><div class="root-val">${fmt(STATE.roots[0])}</div></div>`;
      } else {
        const re = fmt(-b / (2 * a));
        const im = fmt(Math.sqrt(-disc) / (2 * a));
        rootsBox.innerHTML =
          `<div class="root-pill complex"><div class="root-label">x₁</div><div class="root-val">${re}+${im}i</div></div>` +
          `<div class="root-pill complex"><div class="root-label">x₂</div><div class="root-val">${re}−${im}i</div></div>`;
      }
    }

    // Steps
    const steps = lang === 'ms' ? buildStepsBM(STATE) : buildSteps(STATE);
    const stepsList = document.getElementById('stepsList');
    if (stepsList) {
      stepsList.innerHTML = steps.map((s, i) =>
        `<li class="step-item visible" id="step${i}"><div class="step-num">${i + 1}</div><div class="step-text">${s}</div></li>`
      ).join('');
    }

    // Phase caption + stepper
    if (ANIM) updatePhaseUI(ANIM.phase);

    // Quiz card title
    const qTitle = document.getElementById('quizCardTitle');
    if (qTitle) qTitle.textContent = lang === 'ms' ? 'Uji Kefahaman Anda' : 'Test Your Understanding';

    // Vertex label
    const vLabel = document.querySelector('.vertex-label');
    if (vLabel) vLabel.textContent = lang === 'ms' ? 'Bucu =' : 'Vertex =';
  }
}

// ─────────────────────────────────────────────────────────────
//  TITLE TYPEWRITER ANIMATION
// ─────────────────────────────────────────────────────────────
function initTitleTyping() {
  const lines = document.querySelectorAll('.hero-line');
  if (!lines.length) return;

  lines.forEach((line, i) => {
    setTimeout(() => {
      line.classList.add('line-in');
    }, 300 + i * 380);
  });
}

// ─────────────────────────────────────────────────────────────
//  INSIGHT CARD — what the equation tells us
// ─────────────────────────────────────────────────────────────
function generateInsight() {
  const card = document.getElementById('insightCard');
  const content = document.getElementById('insightContent');
  if (!card || !content || !STATE) return;

  const { a, b, c, h, k, disc, roots } = STATE;
  const ms = currentLang === 'ms';

  const items = [
    {
      icon: a > 0 ? '📈' : '📉',
      text: ms
        ? `Parabola <strong>${a > 0 ? 'terbuka ke atas' : 'terbuka ke bawah'}</strong> (a ${a > 0 ? '> 0' : '< 0'}) — titik pusingan <strong>${a > 0 ? 'minimum' : 'maksimum'}</strong>`
        : `Parabola <strong>${a > 0 ? 'opens upward' : 'opens downward'}</strong> (a ${a > 0 ? '> 0' : '< 0'}) — <strong>${a > 0 ? 'minimum' : 'maximum'}</strong> turning point`,
    },
    {
      icon: '📍',
      text: ms
        ? `Bucu (titik pusingan) berada di <strong>(${fmt(h)}, ${fmt(k)})</strong>`
        : `Vertex (turning point) is at <strong>(${fmt(h)}, ${fmt(k)})</strong>`,
    },
    disc > 0 ? {
      icon: '✂️',
      text: ms
        ? `Memotong paksi-x di <strong>2 titik</strong>: x = ${fmt(roots[0])} dan x = ${fmt(roots[1])}`
        : `Crosses the x-axis at <strong>2 points</strong>: x = ${fmt(roots[0])} and x = ${fmt(roots[1])}`,
    } : disc === 0 ? {
      icon: '💫',
      text: ms
        ? `<strong>Menyentuh</strong> paksi-x di satu titik: x = ${fmt(roots[0])} (punca berganda)`
        : `<strong>Touches</strong> the x-axis at exactly one point: x = ${fmt(roots[0])} (double root)`,
    } : {
      icon: '🚫',
      text: ms
        ? `<strong>Tidak memotong</strong> paksi-x — tiada punca nyata (punca kompleks)`
        : `<strong>Does not cross</strong> the x-axis — no real roots (complex roots)`,
    },
    {
      icon: '📌',
      text: ms
        ? `Pintasan-y pada <strong>(0, ${fmt(c)})</strong> — ini adalah nilai pekali c`
        : `Y-intercept at <strong>(0, ${fmt(c)})</strong> — this is the value of coefficient c`,
    },
  ];

  content.innerHTML = items.map(item =>
    `<div class="insight-item">
       <span class="insight-icon">${item.icon}</span>
       <span class="insight-text">${item.text}</span>
     </div>`
  ).join('');

  card.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────
//  QUIZ — generated after animation completes
// ─────────────────────────────────────────────────────────────
function generateQuiz() {
  const sec = document.getElementById('quizSection');
  const container = document.getElementById('quizQuestions');
  const resultDiv = document.getElementById('quizResult');
  if (!sec || !container || !STATE) return;

  sec.classList.remove('hidden');
  if (resultDiv) resultDiv.classList.add('hidden');

  const { a, b, c, h, k, disc, roots } = STATE;
  const ms = currentLang === 'ms';

  const shuffle = arr => arr.sort(() => Math.random() - 0.5);

  const questions = [
    {
      q: ms ? 'Apakah bucu (titik pusingan) parabola ini?' : 'What is the vertex (turning point) of this parabola?',
      options: shuffle([
        { text: `(${fmt(h)}, ${fmt(k)})`, correct: true },
        { text: `(${fmt(-h)}, ${fmt(k)})`, correct: false },
        { text: `(${fmt(h)}, ${fmt(-k)})`, correct: false },
        { text: `(${fmt(-h)}, ${fmt(-k)})`, correct: false },
      ]),
      explain: ms
        ? `Bucu ialah (h, k) dalam bentuk bucu. Di sini h = ${fmt(h)}, k = ${fmt(k)}.`
        : `The vertex is (h, k) in vertex form. Here h = ${fmt(h)}, k = ${fmt(k)}.`,
    },
    {
      q: ms ? 'Berapa banyak punca nyata yang ada untuk persamaan ini?' : 'How many real roots does this equation have?',
      options: shuffle([
        { text: ms ? '0 (tiada punca nyata)' : '0 (no real roots)', correct: disc < 0 },
        { text: ms ? '1 (punca berganda)' : '1 (double root)', correct: disc === 0 },
        { text: ms ? '2 punca nyata' : '2 real roots', correct: disc > 0 },
      ]),
      explain: ms
        ? `Pembeza Δ = ${fmt(disc)}. ${disc > 0 ? 'Δ > 0 → 2 punca nyata.' : disc === 0 ? 'Δ = 0 → 1 punca nyata (berganda).' : 'Δ < 0 → tiada punca nyata.'}`
        : `Discriminant Δ = ${fmt(disc)}. ${disc > 0 ? 'Δ > 0 → 2 real roots.' : disc === 0 ? 'Δ = 0 → 1 real root (double).' : 'Δ < 0 → no real roots.'}`,
    },
    {
      q: ms ? `Pekali a = ${fmt(a)}. Apakah kesannya terhadap parabola?` : `The coefficient a = ${fmt(a)}. What does this tell you?`,
      options: shuffle([
        {
          text: a > 0
            ? (ms ? 'Terbuka ke atas — titik minimum' : 'Opens upward — minimum point')
            : (ms ? 'Terbuka ke bawah — titik maksimum' : 'Opens downward — maximum point'),
          correct: true,
        },
        {
          text: a > 0
            ? (ms ? 'Terbuka ke bawah — titik maksimum' : 'Opens downward — maximum point')
            : (ms ? 'Terbuka ke atas — titik minimum' : 'Opens upward — minimum point'),
          correct: false,
        },
        {
          text: ms ? 'Menentukan pintasan-y sahaja' : 'Determines only the y-intercept',
          correct: false,
        },
      ]),
      explain: ms
        ? `a = ${fmt(a)} ${a > 0 ? '> 0, jadi parabola terbuka ke atas → titik minimum.' : '< 0, jadi parabola terbuka ke bawah → titik maksimum.'}`
        : `a = ${fmt(a)} ${a > 0 ? '> 0, so the parabola opens upward → minimum point.' : '< 0, so parabola opens downward → maximum point.'}`,
    },
  ];

  window._quiz = { questions, answered: new Array(questions.length).fill(false), correct: 0 };

  container.innerHTML = questions.map((q, qi) => `
    <div class="quiz-q" id="qq${qi}">
      <div class="quiz-q-label">${ms ? 'Soalan' : 'Q'}${qi + 1}</div>
      <div class="quiz-q-text">${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((opt) =>
          `<button class="quiz-opt" data-qi="${qi}" data-correct="${opt.correct}" onclick="answerQuiz(this,${qi},${opt.correct})">${opt.text}</button>`
        ).join('')}
      </div>
      <div class="quiz-explain hidden" id="qex${qi}">${q.explain}</div>
    </div>
  `).join('');

  const retryBtn = document.getElementById('quizRetry');
  if (retryBtn) retryBtn.onclick = generateQuiz;
}

function answerQuiz(btn, qi, isCorrect) {
  if (!window._quiz || window._quiz.answered[qi]) return;
  window._quiz.answered[qi] = true;

  const qDiv = document.getElementById(`qq${qi}`);
  qDiv.querySelectorAll('.quiz-opt').forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') b.classList.add('correct');
    else if (b === btn && !isCorrect) b.classList.add('incorrect');
  });

  if (isCorrect) window._quiz.correct++;

  document.getElementById(`qex${qi}`).classList.remove('hidden');

  if (window._quiz.answered.every(Boolean)) {
    showQuizResult(window._quiz.correct, window._quiz.questions.length);
  }
}

function showQuizResult(score, total) {
  const result = document.getElementById('quizResult');
  if (!result) return;
  result.classList.remove('hidden');

  const ms = currentLang === 'ms';
  const badge = document.getElementById('quizScoreBadge');
  const msg   = document.getElementById('quizResultMsg');

  badge.textContent = `${score} / ${total}`;
  badge.className = 'quiz-score-badge ' + (score === total ? 'perfect' : score >= Math.ceil(total / 2) ? 'good' : 'low');

  if (score === total) {
    msg.textContent = ms ? '🎉 Cemerlang! Anda memahaminya dengan baik!' : '🎉 Excellent! You understand it well!';
  } else if (score >= Math.ceil(total / 2)) {
    msg.textContent = ms ? '👍 Bagus! Teruskan berlatih!' : '👍 Good job! Keep practicing!';
  } else {
    msg.textContent = ms ? '📚 Cuba lagi! Tonton animasi sekali lagi dan semak setiap fasa.' : '📚 Try again! Watch the animation again and review each phase.';
  }
}

// ─────────────────────────────────────────────────────────────
//  STEP HIGHLIGHT SYNC — syncs the active step card with phase
// ─────────────────────────────────────────────────────────────
// Map phase index → step index
const PHASE_TO_STEP = [0, 2, 3, 3, 4, 6];

function syncStepHighlight(phase) {
  document.querySelectorAll('.step-item').forEach(el => el.classList.remove('synced'));
  const stepIdx = PHASE_TO_STEP[Math.min(phase, PHASE_TO_STEP.length - 1)];
  const el = document.getElementById('step' + stepIdx);
  if (el) el.classList.add('synced');
}

// ─────────────────────────────────────────────────────────────
//  CANVAS PLACEHOLDERS — shown before any equation is entered
// ─────────────────────────────────────────────────────────────
function drawCanvasPlaceholders() {
  function placeholder(id, msg) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    // dashed border rect
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(59,130,246,0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 16, W - 32, H - 32);
    ctx.setLineDash([]);
    // label
    ctx.fillStyle = 'rgba(148,163,184,0.35)';
    ctx.font = `500 13px "Outfit", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, W / 2, H / 2);
  }
  placeholder('animCanvas',  'Enter an equation above to begin');
  placeholder('graphCanvas', 'Parabola will appear here');
}

// ─────────────────────────────────────────────────────────────
//  HERO MINI CANVAS — looping tile animation
// ─────────────────────────────────────────────────────────────
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = 220 * dpr;
  canvas.height = 220 * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  let tick = 0;
  let rafId;

  function drawHero() {
    const W = 220, H = 220;
    ctx.clearRect(0, 0, W, H);

    // subtle grid
    ctx.strokeStyle = 'rgba(59,130,246,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // 8-second loop
    const LOOP = 8;
    const t = (tick % (LOOP * 60)) / (LOOP * 60); // 0..1

    const cx = W / 2, cy = H / 2;
    const maxSz = 130;
    const r = 0.45; // b/2a ratio
    const xSz = maxSz / (1 + r);
    const bSz = maxSz - xSz;
    const ox = cx - (xSz + bSz) / 2;
    const oy = cy - (xSz + bSz) / 2;

    // Phase timing
    const p0end = 0.18, p1end = 0.36, p2end = 0.54, p3end = 0.70, p4end = 0.82, p5end = 0.95;

    function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
    function clamp01(v) { return Math.min(1, Math.max(0, v)); }
    function pct(start, end) { return ease(clamp01((t - start) / (end - start))); }

    // draw tile helper
    function drawTile(x, y, w, h, fill, stroke, alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 6);
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.restore();
    }
    function drawLabel(x, y, w, h, text, color, alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.font = `700 ${Math.max(10, w * 0.18)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x + w/2, y + h/2);
      ctx.restore();
    }

    // Phase 0 – x² appears (0..p0end)
    if (t < p5end) {
      const a0 = t < p0end ? pct(0, p0end) : 1;
      const s = 0.6 + 0.4 * (t < p0end ? pct(0, p0end) : 1);
      ctx.save(); ctx.translate(ox + xSz/2, oy + xSz/2);
      ctx.scale(s, s); ctx.translate(-(ox + xSz/2), -(oy + xSz/2));
      drawTile(ox, oy, xSz, xSz, '#1D4ED8', '#3B82F6', a0);
      drawLabel(ox, oy, xSz, xSz, 'x²', '#93C5FD', a0);
      ctx.restore();
    }

    // Phase 1 – bx rects slide in (p0end..p1end)
    if (t >= p0end) {
      const a1 = pct(p0end, p1end);
      const rightX = ox + xSz + bSz * (1 - a1) * 0.6;
      const botY   = oy + xSz + bSz * (1 - a1) * 0.6;
      drawTile(rightX, oy, bSz, xSz, '#92400E', '#F59E0B', Math.min(1, a1 * 1.5));
      if (a1 > 0.5) drawLabel(rightX, oy, bSz, xSz, 'b·x', '#FDE68A', (a1 - 0.5) * 2);
      drawTile(ox, botY, xSz, bSz, '#92400E', '#F59E0B', Math.min(1, a1 * 1.5));
      if (a1 > 0.5) drawLabel(ox, botY, xSz, bSz, 'b·x', '#FDE68A', (a1 - 0.5) * 2);
    }

    // Phase 1 fully shown — keep bx tiles for phases 2–4
    if (t >= p1end && t < p5end) {
      drawTile(ox + xSz, oy, bSz, xSz, '#92400E', '#F59E0B', 1);
      drawLabel(ox + xSz, oy, bSz, xSz, 'b·x', '#FDE68A', 1);
      drawTile(ox, oy + xSz, xSz, bSz, '#92400E', '#F59E0B', 1);
      drawLabel(ox, oy + xSz, xSz, bSz, 'b·x', '#FDE68A', 1);
    }

    // Phase 2 – gap pulses (p1end..p2end)
    if (t >= p1end && t < p3end) {
      const pulse = 0.5 + 0.5 * Math.sin(tick / 8);
      const a2 = t < p2end ? pct(p1end, p2end) : 1;
      ctx.save(); ctx.globalAlpha = a2 * (0.07 + 0.05 * pulse);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(ox + xSz, oy + xSz, bSz, bSz);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = a2 * (0.6 + 0.3 * pulse);
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
      ctx.strokeRect(ox + xSz + 1, oy + xSz + 1, bSz - 2, bSz - 2);
      ctx.setLineDash([]);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = a2 * (0.5 + 0.4 * pulse);
      ctx.fillStyle = '#FCA5A5';
      ctx.font = `bold ${bSz * 0.45}px Outfit`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', ox + xSz + bSz/2, oy + xSz + bSz/2);
      ctx.restore();
    }

    // Phase 3 – corner drops in (p2end..p3end)
    if (t >= p2end) {
      const a3 = pct(p2end, p3end);
      const dropY = oy + xSz - bSz * 0.5 * (1 - a3);
      drawTile(ox + xSz, dropY, bSz, bSz, '#5B21B6', '#8B5CF6', Math.min(1, a3 * 1.5));
      if (a3 > 0.5) drawLabel(ox + xSz, dropY, bSz, bSz, '²', '#DDD6FE', (a3-0.5)*2);
    }

    // Phase 4-5 – completed square glows (p3end..p5end)
    if (t >= p3end) {
      const a4 = pct(p3end, p4end);
      const pulse = 0.5 + 0.5 * Math.sin(tick / 12);
      const side = xSz + bSz;
      ctx.save(); ctx.globalAlpha = a4 * (0.4 + 0.3 * pulse);
      ctx.strokeStyle = '#A78BFA'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(ox, oy, side, side, 8); ctx.stroke();
      ctx.restore();
    }

    // Phase 5 – fade out and reset (p4end..p5end)
    if (t >= p4end) {
      const fadeOut = 1 - pct(p4end, p5end);
      ctx.save(); ctx.globalAlpha = fadeOut * 0.4;
      ctx.fillStyle = '#080F1E';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    tick++;
    rafId = requestAnimationFrame(drawHero);
  }

  drawHero();
  window.addEventListener('unload', () => cancelAnimationFrame(rafId));
}

// ─────────────────────────────────────────────────────────────
//  THEME TOGGLE
// ─────────────────────────────────────────────────────────────
let _floatEnabled = true;

function toggleTheme() {
  const html  = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');

  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (isLight) {
    // switching to dark — show sun (to switch back to light)
    if (icon) {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round"/>';
    }
    if (label) label.textContent = 'Light';
  } else {
    // switching to light — show moon (to switch back to dark)
    if (icon) {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
    if (label) label.textContent = 'Dark';
  }
}