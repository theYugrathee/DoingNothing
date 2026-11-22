import '../css/style.css';
import {
  AppConfig,
  LeaderboardEntry,
  BoardFilterMode,
  AppPage
} from './types';
import { StorageService } from './services/storage';
import { AnalyticsService } from './services/analytics';
import { PaymentService } from './services/payments';
import { SupabaseService } from './services/supabase';
import { resolveAvatarUrl } from './services/avatar';
import { sound } from './services/sound';
import {
  ROTATING_LINES,
  DODGE_QUOTES,
  ROAST_TEMPLATES,
  EXCUSES_LIST,
  INITIAL_LEADERBOARD
} from './data/defaults';

// ==========================================================================
// Application State
// ==========================================================================
let config: AppConfig = StorageService.getConfig();
let entries: LeaderboardEntry[] = StorageService.getEntries();
let currentBoardMode: BoardFilterMode = 'recent';

// DOM Selectors Helper
const $ = <T extends HTMLElement = HTMLElement>(sel: string): T | null => document.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string): T[] => Array.from(document.querySelectorAll<T>(sel));

// ==========================================================================
// Toast Notification
// ==========================================================================
let toastTimeout: number | undefined;
export const showToast = (message: string): void => {
  const toastEl = $('#toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.style.display = 'block';
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.style.display = 'none';
  }, 3200);
};

// ==========================================================================
// Particle Confetti Engine
// ==========================================================================
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rSpeed: number;
  life: number;
  decay: number;
}

class ConfettiEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: ConfettiParticle[] = [];
  private animId: number | null = null;

  constructor() {
    this.canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  private resize(): void {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public fire(count: number = 75): void {
    if (!this.canvas || !this.ctx) return;
    const colors = ['#2F4BFF', '#FFD23F', '#FF4D8D', '#10B981', '#101010'];
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: w / 2 + (Math.random() * 200 - 100),
        y: h / 2 - 50 + (Math.random() * 80 - 40),
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 1.5) * 14,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 12,
        life: 1,
        decay: Math.random() * 0.015 + 0.01
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  private loop(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.98;
      p.rotation += p.rSpeed;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
    }
  }
}

const confetti = new ConfettiEngine();

// ==========================================================================
// Routing & Mobile Drawer
// ==========================================================================
const PAGES: readonly AppPage[] = ['home', 'red', 'roast', 'hall-of-fame', 'challenge', 'excuses', 'about', 'admin'];

function route(): void {
  let hash = location.hash.slice(1) as AppPage;
  if (!PAGES.includes(hash)) hash = 'home';

  PAGES.forEach((p) => {
    const el = $('#' + p);
    if (el) el.classList.toggle('on', p === hash);
  });

  $$('nav a').forEach((a) => {
    a.classList.toggle('on', a.getAttribute('href') === '#' + hash);
  });

  closeMobileDrawer();

  if (hash !== 'challenge') {
    challengeStop();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderApp();

  if (hash === 'admin') {
    renderAdmin();
  }

  sound.play('up', 120);
  setTimeout(resetDodgeHome, 60);
}

window.addEventListener('hashchange', route);

function setupMobileNav(): void {
  const toggleBtn = $('#mobileToggle');
  const drawer = $('#mobileDrawer');
  const closeBtn = $('#closeDrawer');

  if (toggleBtn && drawer) {
    toggleBtn.onclick = () => {
      drawer.classList.add('open');
      sound.play('pop');
    };
  }
  if (closeBtn && drawer) {
    closeBtn.onclick = () => {
      closeMobileDrawer();
      sound.play('pop');
    };
  }
  if (drawer) {
    drawer.onclick = (e) => {
      if (e.target === drawer) closeMobileDrawer();
    };
  }
}

function closeMobileDrawer(): void {
  const drawer = $('#mobileDrawer');
  if (drawer) drawer.classList.remove('open');
}

// ==========================================================================
// Dynamic Meal & Hero Rotation
// ==========================================================================
let lineIndex = 0;
function cycleHeroLine(): void {
  const lineEl = $('#heroSubtitle');
  if (!lineEl) return;
  const lines = config.lines && config.lines.length ? config.lines : ROTATING_LINES;
  lineEl.style.opacity = '0';
  setTimeout(() => {
    lineEl.textContent = lines[lineIndex++ % lines.length];
    lineEl.style.opacity = '1';
  }, 250);
}

// ==========================================================================
// Precision Dodging "Go Get A Job" Button (Restored Original Mechanics)
// Moves strictly along the horizontal section and avoids overlapping buttons!
// ==========================================================================
let px = -999;
let py = -999;
let lt = 0;
let hy = 0;

function resetDodgeHome(): void {
  const run = $('#run');
  const hero = $('.hero');
  const slot = $('#slot');
  if (!hero || !slot || !run) return;
  const s = slot.getBoundingClientRect();
  const h = hero.getBoundingClientRect();
  run.style.left = (s.left - h.left) + 'px';
  run.style.top = (s.top - h.top) + 'px';
  hy = s.top - h.top;
}

function getProtectedRects(): DOMRect[] {
  const hero = $('.hero');
  if (!hero) return [];
  const list: DOMRect[] = [];
  hero.querySelectorAll('#fundHeroBtn, #heroTag').forEach((e) => list.push(e.getBoundingClientRect()));
  ['h1.big', '.line'].forEach((q) => {
    const el = hero.querySelector(q);
    if (el) {
      const rg = document.createRange();
      rg.selectNodeContents(el);
      list.push(...Array.from(rg.getClientRects()));
    }
  });
  return list.filter((r) => r.width > 0);
}

function flee(): void {
  const run = $('#run');
  const hero = $('.hero');
  if (!run || !hero) return;

  const soundsList: Array<'boing' | 'squeak' | 'blorp' | 'honk'> = ['boing', 'squeak', 'blorp', 'honk'];
  sound.play(soundsList[Math.floor(Math.random() * soundsList.length)], 40);

  const quotes = config.dodgeQuotes && config.dodgeQuotes.length ? config.dodgeQuotes : DODGE_QUOTES;
  run.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  const h = hero.getBoundingClientRect();
  const W = run.offsetWidth;
  const H = run.offsetHeight;
  const R = getProtectedRects();
  const pad = 14;

  let best: [number, number] | null = null;
  let bd = -1;

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * Math.max(0, h.width - W);
    const y = Math.min(Math.max(0, hy - 14 + (Math.random() * 32 - 16)), Math.max(0, h.height - H));
    const L = h.left + x;
    const T = h.top + y;

    if (R.some((r) => L < r.right + pad && L + W > r.left - pad && T < r.bottom + pad && T + H > r.top - pad)) {
      continue;
    }

    const d = Math.hypot(L + W / 2 - px, T + H / 2 - py);
    if (d > bd) {
      bd = d;
      best = [x, y];
    }
  }

  if (best) {
    run.style.left = best[0] + 'px';
    run.style.top = best[1] + 'px';
  }

  window.clearTimeout((flee as { t?: number }).t);
  (flee as { t?: number }).t = window.setTimeout(() => {
    if (run) run.textContent = 'Go get a job';
  }, 6000);
}

const isNearButton = (): boolean => {
  const run = $('#run');
  if (!run) return false;
  const b = run.getBoundingClientRect();
  const m = 12;
  const homeEl = $('#home');
  return !!(homeEl?.classList.contains('on') && px > b.left - m && px < b.right + m && py > b.top - m && py < b.bottom + m);
};

function setupDodgingButton(): void {
  window.addEventListener(
    'pointermove',
    (e) => {
      px = e.clientX;
      py = e.clientY;
      if (isNearButton()) {
        const n = performance.now();
        if (n - lt > 30) {
          lt = n;
          flee();
        }
      }
    },
    { passive: true }
  );

  (['pointerdown', 'touchstart'] as const).forEach((v) => {
    document.addEventListener(
      v,
      (e) => {
        const touch = 'touches' in e && e.touches.length ? e.touches[0] : (e as PointerEvent);
        px = touch.clientX;
        py = touch.clientY;
        if (isNearButton()) {
          lt = performance.now();
          flee();
          if ((e.target as HTMLElement)?.closest('#run')) e.preventDefault();
        }
      },
      { passive: false }
    );
  });

  const run = $('#run');
  if (run) {
    run.addEventListener('click', (e) => {
      e.preventDefault();
      flee();
    });
  }

  window.addEventListener('resize', resetDodgeHome);
  if (document.fonts) {
    document.fonts.ready.then(resetDodgeHome);
  }
}

// ==========================================================================
// Leaderboard & Today's Board Rendering (with Auto-Fetched Logos/Avatars)
// ==========================================================================
const CROWN_SVG = '<svg class="crown" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M3 18h18l1-10-5 4-5-8-5 8-5-4z" fill="#FFD23F" stroke="#101010" stroke-width="1.6" stroke-linejoin="round"/></svg>';

function renderAvatar(item: LeaderboardEntry): string {
  if (item.anon) {
    return `<div class="av anon-av">?</div>`;
  }

  // Automatically fetch logo / favicon / profile picture if image or url exists
  const avatarUrl = resolveAvatarUrl(item.url, item.img);
  const initial = (item.name[0] || '?').toUpperCase();

  if (avatarUrl) {
    return `<div class="av logo-av"><img src="${AnalyticsService.escapeHtml(avatarUrl)}" alt="${AnalyticsService.escapeHtml(item.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'fallback-letter\\'>${AnalyticsService.escapeHtml(initial)}</span>';"></div>`;
  }

  return `<div class="av letter-av"><span class="fallback-letter">${AnalyticsService.escapeHtml(initial)}</span></div>`;
}

function renderLeaderboard(): void {
  const boardEl = $('#boardContainer');
  const countEl = $('#countToday');
  const totalEl = $('#totalToday');
  const topNameEl = $('#topSupporterName');

  if (!boardEl) return;

  const stats = AnalyticsService.calculateDailyStats(entries, config.targetGoal);
  if (totalEl) totalEl.textContent = AnalyticsService.formatMoney(stats.collectedToday);
  if (countEl) countEl.textContent = stats.feedersToday.toString();
  if (topNameEl) {
    if (stats.topSupporter && stats.topSupporter !== 'Nobody yet' && stats.topSupporter !== 'Nobody') {
      topNameEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px"><span style="font-size:16px;line-height:1">👑</span><span>${AnalyticsService.escapeHtml(stats.topSupporter)}</span></span>`;
    } else {
      topNameEl.textContent = 'Nobody yet';
    }
  }

  const displayList = AnalyticsService.getSortedBoard(entries, currentBoardMode);

  if (displayList.length === 0) {
    boardEl.innerHTML = `
      <div class="empty">
        Nobody has bought me a meal today.<br>
        <span style="font:500 15px 'DM Sans'">Be the first name on the board. I’m very hungry.</span>
      </div>
    `;
    return;
  }

  let html = '';

  // Render top 3 podium in Top mode
  if (currentBoardMode === 'top' && displayList.length >= 2) {
    const podiums = [
      { item: displayList[1], rank: 2, cls: 'p2' },
      { item: displayList[0], rank: 1, cls: 'p1' },
      { item: displayList[2], rank: 3, cls: 'p3' }
    ].filter((p) => p.item);

    html += `<div class="pod" style="grid-template-columns: repeat(${podiums.length}, minmax(0, 1fr))">`;
    podiums.forEach((p) => {
      const tier = AnalyticsService.getTier(p.item.amt);
      html += `
        <button class="pc ${p.cls}" data-id="${p.item.id}">
          <span class="medal">${p.rank}</span>
          ${p.rank === 1 ? CROWN_SVG : ''}
          ${renderAvatar(p.item)}
          <h3>${AnalyticsService.escapeHtml(p.item.name)}</h3>
          <span class="tc" style="background:${tier.color}">${tier.name}</span>
          <div class="amt">${AnalyticsService.formatMoney(p.item.amt)}</div>
          <span class="go">Details ›</span>
        </button>
      `;
    });
    html += `</div>`;
  }

  const maxAmount = Math.max(1, ...displayList.map((i) => i.amt));
  const startIndex = currentBoardMode === 'top' && displayList.length >= 2 ? 3 : 0;

  displayList.slice(startIndex).forEach((item, idx) => {
    const rank = startIndex + idx + 1;
    const tier = AnalyticsService.getTier(item.amt);
    const host = AnalyticsService.getHost(item.url);
    const pct = Math.min(100, Math.max(3, (item.amt / maxAmount) * 100));
    const isFresh = Date.now() - item.t < 120000;

    html += `
      <button class="lr ${currentBoardMode === 'recent' && idx === 0 ? 'hot' : ''}" data-id="${item.id}">
        <div class="lk">
          ${
            currentBoardMode === 'top'
              ? `<b class="rank-badge ${rank <= 3 ? 'rank-' + rank : ''}">#${rank}</b>`
              : `<span class="tp ${isFresh ? 'nw' : ''}">⏱️ ${AnalyticsService.getTimeAgo(item.t)}</span>`
          }
        </div>
        ${renderAvatar(item)}
        <div style="min-width:0;flex:1">
          <div class="lr-title-row">
            <h3 class="lr-name">${AnalyticsService.escapeHtml(item.name)}</h3>
            <span class="tc" style="background:${tier.color}">${tier.name}</span>
          </div>
          <p class="lr-desc">${AnalyticsService.escapeHtml(item.desc || '')}</p>
          ${host ? `<div class="lr-link"><span>↗</span> ${AnalyticsService.escapeHtml(host)}</div>` : ''}
        </div>
        <div class="lp">
          <div class="lp-amt">${AnalyticsService.formatMoney(item.amt)}</div>
          <span class="go">Details ›</span>
        </div>
        <i class="lbar" style="width:${pct}%"></i>
      </button>
    `;
  });

  boardEl.innerHTML = html;

  boardEl.querySelectorAll('[data-id]').forEach((el) => {
    (el as HTMLElement).onclick = () => {
      const id = el.getAttribute('data-id');
      const item = entries.find((x) => x.id === id);
      if (item) showDetailModal(item);
    };
  });
}

function renderHallOfFame(): void {
  const hofContainer = $('#hofContainer');
  if (!hofContainer) return;

  const sortedAll = AnalyticsService.getHallOfFame(entries);
  const maxAmount = Math.max(1, ...sortedAll.map((i) => i.amt));

  if (sortedAll.length === 0) {
    hofContainer.innerHTML = `
      <div class="empty">
        Nobody in the hall of fame yet.<br>
        <span style="font:500 15px 'DM Sans'">The biggest payers of all time will live here.</span>
      </div>
    `;
    return;
  }

  let html = `<p class="hint" style="margin-bottom:10px">${entries.length} payments so far. Showing the top ${sortedAll.length}.</p>`;

  sortedAll.forEach((item, idx) => {
    const rank = idx + 1;
    const tier = AnalyticsService.getTier(item.amt);
    const host = AnalyticsService.getHost(item.url);
    const pct = Math.min(100, Math.max(3, (item.amt / maxAmount) * 100));

    html += `
      <button class="lr ${rank <= 3 ? 'hot' : ''}" data-id="${item.id}">
        <div class="lk"><b>${rank}</b></div>
        ${renderAvatar(item)}
        <div style="min-width:0">
          <h3>
            ${AnalyticsService.escapeHtml(item.name)}
            <span class="tc" style="background:${tier.color}">${tier.name}</span>
          </h3>
          <p>${AnalyticsService.escapeHtml(item.desc || '')}</p>
          <div class="d">${AnalyticsService.escapeHtml(host || item.url || '')}</div>
        </div>
        <div class="lp">
          ${AnalyticsService.formatMoney(item.amt)}
          <span class="go">Details ›</span>
        </div>
        <i class="lbar" style="width:${pct}%"></i>
      </button>
    `;
  });

  hofContainer.innerHTML = html;
  hofContainer.querySelectorAll('[data-id]').forEach((el) => {
    (el as HTMLElement).onclick = () => {
      const id = el.getAttribute('data-id');
      const item = entries.find((x) => x.id === id);
      if (item) showDetailModal(item);
    };
  });
}

// ==========================================================================
// Modals & Popups
// ==========================================================================
const modalBackdrop = $('#modalBackdrop');
const modalContent = $('#modalContent');

function closeModal(): void {
  if (modalBackdrop) modalBackdrop.classList.remove('on');
}

function showDetailModal(item: LeaderboardEntry): void {
  if (!modalContent || !modalBackdrop) return;
  sound.play('pop');

  const url = AnalyticsService.safeUrl(item.url);
  const host = AnalyticsService.getHost(item.url);

  modalContent.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      ${renderAvatar(item)}
      <div>
        <h2 style="font-size:24px">${AnalyticsService.escapeHtml(item.name)}</h2>
        <b>${AnalyticsService.formatMoney(item.amt)}</b>
      </div>
    </div>
    <p style="white-space:pre-wrap;margin:12px 0;font-size:14.5px">${AnalyticsService.escapeHtml(item.desc || 'No description.')}</p>
    ${
      url
        ? `<p><a class="btn sm" href="${AnalyticsService.escapeHtml(url)}" target="_blank" rel="nofollow noopener ugc">Visit ${AnalyticsService.escapeHtml(host)}</a></p>`
        : item.url
        ? `<p><b>${AnalyticsService.escapeHtml(item.url)}</b></p>`
        : ''
    }
    <p><button class="chip" id="modalCloseChip">Close</button></p>
  `;

  modalBackdrop.classList.add('on');
  const closeChip = $('#modalCloseChip');
  if (closeChip) closeChip.onclick = closeModal;
}

function openFundModal(): void {
  if (!modalContent || !modalBackdrop) return;
  sound.play('kaching');
  let uploadedLogo = '';

  const meal = AnalyticsService.getMealName();
  const presets = config.presets && config.presets.length ? config.presets : [5, 10, 25, 50, 100];

  modalContent.innerHTML = `
    <h2>${AnalyticsService.escapeHtml(config.buttonText)} ${AnalyticsService.escapeHtml(meal)}</h2>
    <p style="margin:0;color:var(--mut);font-size:14px">Put your name or product on today’s board, or stay anonymous.</p>

    <label style="display:flex;align-items:center;margin-top:14px;cursor:pointer">
      <input type="checkbox" id="fundAnon">
      Pay anonymously (no name, no link, no logo)
    </label>

    <div id="fundNamedFields">
      <label for="fundName">Your name or product name</label>
      <input type="text" id="fundName" maxlength="60" placeholder="e.g. Acme Analytics">

      <label for="fundUrl">One link (website, X, or GitHub profile)</label>
      <input type="text" id="fundUrl" maxlength="140" placeholder="https://yourproduct.com or https://x.com/username">
      <div id="avatarAutoPreview" style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <div id="fundLogoPreview"></div>
        <p class="hint" id="avatarHint" style="margin:0">Logo & favicon will be automatically fetched from your link.</p>
      </div>

      <label for="fundLogo" style="margin-top:10px">Custom logo upload (optional)</label>
      <input type="file" id="fundLogo" accept="image/*">
    </div>

    <label for="fundAmount">How much do you want to pay? (USD)</label>
    <div class="chips" id="quickAmountChips">
      ${presets
        .map(
          (amt, idx) =>
            `<button class="chip ${idx === 1 ? 'on' : ''}" data-amt="${amt}">$${amt}</button>`
        )
        .join('')}
    </div>
    <input type="number" id="fundAmount" min="${config.minAmount || 1}" step="1" value="${presets[1] || 10}" placeholder="Any amount, $1 or more">

    <label for="fundDesc">Short description or message <span id="fundWordCount" class="hint" style="display:inline">0 / 500 words</span></label>
    <textarea id="fundDesc" placeholder="What are you building? Or just say hi."></textarea>

    ${
      config.payUrl
        ? `<div class="note">You’ll continue to the payment page. You appear on the board once the payment is verified.</div>`
        : `<div class="note"><b>Live mode:</b> Your contribution connects with Supabase and renders on the board immediately!</div>`
    }

    <p style="display:flex;gap:10px;margin-top:16px">
      <button class="btn" id="fundSubmitBtn" style="flex:1;text-align:center">
        ${config.payUrl ? 'Continue to payment' : 'Add to board'}
      </button>
      <button class="btn w" id="fundCancelBtn">Cancel</button>
    </p>
  `;

  modalBackdrop.classList.add('on');

  const cancelBtn = $('#fundCancelBtn');
  if (cancelBtn) cancelBtn.onclick = closeModal;

  const anonCheckbox = $('#fundAnon') as HTMLInputElement | null;
  const namedFields = $('#fundNamedFields');
  if (anonCheckbox && namedFields) {
    anonCheckbox.onchange = () => {
      namedFields.style.display = anonCheckbox.checked ? 'none' : 'block';
    };
  }

  // Auto-fetch logo in real-time as user types link
  const urlInput = $('#fundUrl') as HTMLInputElement | null;
  const previewDiv = $('#fundLogoPreview');
  const avatarHint = $('#avatarHint');

  const updateAutoAvatar = (): void => {
    if (uploadedLogo) return; // Custom upload takes precedence
    const raw = urlInput?.value.trim() || '';
    const autoUrl = resolveAvatarUrl(raw);
    if (autoUrl && previewDiv) {
      previewDiv.innerHTML = `<img src="${AnalyticsService.escapeHtml(autoUrl)}" style="width:36px;height:36px;border-radius:9px;border:2px solid var(--ink);object-fit:cover" onerror="this.parentElement.innerHTML=''">`;
      if (avatarHint) avatarHint.textContent = 'Auto-detected logo / profile image!';
    } else if (previewDiv) {
      previewDiv.innerHTML = '';
      if (avatarHint) avatarHint.textContent = 'Logo & favicon will be automatically fetched from your link.';
    }
  };

  if (urlInput) {
    urlInput.oninput = updateAutoAvatar;
    urlInput.onblur = updateAutoAvatar;
  }

  const amountInput = $('#fundAmount') as HTMLInputElement | null;
  modalContent.querySelectorAll<HTMLButtonElement>('[data-amt]').forEach((chip) => {
    chip.onclick = () => {
      modalContent.querySelectorAll('[data-amt]').forEach((c) => c.classList.remove('on'));
      chip.classList.add('on');
      if (amountInput) amountInput.value = chip.getAttribute('data-amt') || '10';
    };
  });

  const descInput = $('#fundDesc') as HTMLTextAreaElement | null;
  const wcEl = $('#fundWordCount');
  if (descInput && wcEl) {
    descInput.oninput = () => {
      const words = descInput.value.trim().split(/\s+/).filter(Boolean).length;
      wcEl.textContent = `${words} / 500 words`;
    };
  }

  const fileInput = $('#fundLogo') as HTMLInputElement | null;
  if (fileInput) {
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 96;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const s = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96);
            uploadedLogo = canvas.toDataURL('image/jpeg', 0.8);

            if (previewDiv) {
              previewDiv.innerHTML = `<img src="${uploadedLogo}" style="width:36px;height:36px;border-radius:9px;border:2px solid var(--ink);object-fit:cover">`;
              if (avatarHint) avatarHint.textContent = 'Custom logo loaded.';
            }
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };
  }

  const submitBtn = $('#fundSubmitBtn');
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const isAnon = anonCheckbox?.checked ?? false;
      const nameInput = $('#fundName') as HTMLInputElement | null;
      const name = isAnon ? 'Anonymous legend' : (nameInput?.value.trim() || '');
      const rawUrl = isAnon ? '' : (urlInput?.value.trim() || '');
      const amt = parseFloat(amountInput?.value || '0');
      const desc = descInput?.value.trim() || '';

      if (!name) {
        showToast('Add your name or product name, or tick “Pay anonymously”.');
        sound.play('sad');
        return;
      }
      if (rawUrl && !AnalyticsService.safeUrl(rawUrl) && rawUrl[0] !== '@') {
        showToast('That link doesn’t look valid. Use https://…');
        sound.play('sad');
        return;
      }
      if (isNaN(amt) || amt < (config.minAmount || 1)) {
        showToast(`Enter an amount of $${config.minAmount || 1} or more.`);
        sound.play('sad');
        return;
      }

      // If user didn't upload a custom file, auto-resolve their logo from their link!
      const finalAvatar = isAnon ? '' : (uploadedLogo || resolveAvatarUrl(rawUrl));

      const result = await PaymentService.processPayment({
        name,
        url: rawUrl,
        amount: amt,
        desc,
        img: finalAvatar,
        anon: isAnon,
        gateway: 'stripe'
      });

      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener');
        closeModal();
        showToast('Complete the payment. You’ll appear once it’s verified.');
        return;
      }

      if (result.success && result.entry) {
        entries = StorageService.getEntries();
        closeModal();
        renderApp();
        renderLeaderboard();
        sound.play('fanfare');
        confetti.fire(95);
        showToast("Added to the board! Thank you for the meal.");
        location.hash = 'home';
      }
    };
  }
}

if (modalBackdrop) {
  modalBackdrop.onclick = (e) => {
    if (e.target === modalBackdrop) closeModal();
  };
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ==========================================================================
// Mini-Apps: Red Button, Roaster, Challenge, Excuses
// ==========================================================================
let redPressCount = 0;
const RED_PHRASES: readonly string[] = [
  'bro i said don\'t press it',
  'why are you still clicking this',
  'you really have nothing better to do huh',
  'leave the button alone',
  'click one more time and see what happens',
  'go drink some water instead',
  'every click adds 1 hour to my afternoon nap'
];

function setupRedButton(): void {
  const redBtn = $('#bigRedBtn');
  const msgEl = $('#redMessage');
  const counterEl = $('#redPressCounter');
  if (!redBtn) return;

  redBtn.onclick = () => {
    redPressCount++;
    sound.play(redPressCount === 5 ? 'alarm' : redPressCount % 2 === 0 ? 'boom' : 'horn');

    if (counterEl) counterEl.textContent = `Presses: ${redPressCount}`;

    if (redPressCount === 5) {
      triggerInternetDeletion();
      return;
    }

    if (msgEl) {
      msgEl.textContent = RED_PHRASES[Math.floor(Math.random() * RED_PHRASES.length)];
    }
  };
}

function triggerInternetDeletion(): void {
  if (!modalContent || !modalBackdrop) return;
  sound.play('alarm');

  modalContent.innerHTML = `
    <h2>Deleting the internet…</h2>
    <div class="bar2">
      <i id="deleteProgressBar"></i>
    </div>
    <p id="deleteStatusText" class="hint">Starting…</p>
    <p class="hint">(not real, obviously)</p>
  `;
  modalBackdrop.classList.add('on');

  const steps = [
    'Removing cat videos…',
    'Deleting group chats… you’re welcome',
    'Cancelling Mondays…',
    'Unsubscribing from newsletters…',
    'Deleting the noodle recipes… no, wait'
  ];

  let progress = 0;
  let stepIdx = 0;
  const bar = $('#deleteProgressBar');
  const text = $('#deleteStatusText');

  const interval = window.setInterval(() => {
    progress += Math.random() * 9 + 3;
    sound.play('tick', 20);

    if (progress >= 99) {
      progress = 99;
      window.clearInterval(interval);
      sound.play('scratch');
      if (text) text.textContent = 'Wait. That’s a lot of work.';

      setTimeout(() => {
        sound.play('sad');
        if (!modalContent) return;
        modalContent.innerHTML = `
          <h2>Cancelled.</h2>
          <p>I’m too lazy to finish deleting the internet. You’re welcome.</p>
          <p style="display:flex;gap:10px">
            <button class="btn" id="redMealBtn" style="flex:1;text-align:center">Buy me a noodle</button>
            <button class="btn w" id="redCloseBtn">Phew</button>
          </p>
        `;
        const mealBtn = $('#redMealBtn');
        const closeB = $('#redCloseBtn');
        if (mealBtn) mealBtn.onclick = openFundModal;
        if (closeB) closeB.onclick = closeModal;
      }, 1500);
    } else {
      if (bar) bar.style.width = progress + '%';
      if (text && Math.random() < 0.5) {
        text.textContent = steps[stepIdx++ % steps.length];
      }
    }
  }, 350);
}

// 2. Roast Machine
let lastRoastIdx = -1;
function setupRoastMachine(): void {
  const roastBtn = $('#generateRoastBtn');
  const roastInput = $('#roastInput') as HTMLInputElement | null;
  const roastOutput = $('#roastOutput');
  const roastActions = $('#roastActions');
  const copyRoastBtn = $('#copyRoastBtn');
  const tweetRoastBtn = $('#tweetRoastBtn');

  if (!roastBtn) return;

  roastBtn.onclick = () => {
    const name = roastInput?.value.trim() || '';
    if (!name) {
      showToast('Type a name or product first.');
      sound.play('sad');
      return;
    }

    const templates = config.roastTemplates && config.roastTemplates.length ? config.roastTemplates : ROAST_TEMPLATES;
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * templates.length);
    } while (nextIdx === lastRoastIdx);
    lastRoastIdx = nextIdx;

    sound.play('rim');
    const roastText = templates[nextIdx].replace(/\{n\}/g, name);
    if (roastOutput) roastOutput.textContent = roastText;
    if (roastActions) roastActions.style.display = 'block';
  };

  if (copyRoastBtn && roastOutput) {
    copyRoastBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(roastOutput.textContent || '');
        showToast('Roast copied.');
        sound.play('pop');
      } catch {
        showToast('Couldn’t copy.');
      }
    };
  }

  if (tweetRoastBtn && roastOutput) {
    tweetRoastBtn.onclick = () => {
      const text = encodeURIComponent(`"${roastOutput.textContent}" — roasted by https://doingnothing.lol`);
      window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
    };
  }
}

// 3. Do-Nothing Challenge
let challengeStartTime = 0;
let challengeActive = false;
let challengeRafId: number | null = null;

function challengeStop(failed: boolean = false): void {
  if (!challengeActive) return;
  challengeActive = false;
  if (challengeRafId) cancelAnimationFrame(challengeRafId);

  const durationSec = (performance.now() - challengeStartTime) / 1000;
  StorageService.saveBestStillness(durationSec);
  const best = StorageService.getBestStillness();

  const timerEl = $('#challengeTimer');
  const msgEl = $('#challengeMessage');
  const bestEl = $('#challengeBest');
  const startBtn = $('#startChallengeBtn');

  if (timerEl) timerEl.textContent = durationSec.toFixed(1) + 's';

  if (failed) {
    sound.play('sad');
    if (msgEl) {
      if (durationSec < 5) msgEl.textContent = 'You lasted about as long as a New Year’s resolution.';
      else if (durationSec < 15) msgEl.textContent = 'Decent. Your phone is judging you.';
      else if (durationSec < 30) msgEl.textContent = 'Impressive. A true beginner of nothing.';
      else if (durationSec < 60) msgEl.textContent = 'Elite stillness. Please consider a career in nothing.';
      else msgEl.textContent = 'Legendary. I’m honestly a little jealous.';
    }
    if (bestEl) bestEl.textContent = `Your best: ${best.toFixed(1)}s (stored on this device)`;
    if (startBtn) {
      startBtn.textContent = 'Try again';
      startBtn.style.visibility = 'visible';
    }
  }
}

function challengeTick(): void {
  if (!challengeActive) return;
  const currentSec = (performance.now() - challengeStartTime) / 1000;
  const timerEl = $('#challengeTimer');
  if (timerEl) timerEl.textContent = currentSec.toFixed(1) + 's';
  challengeRafId = requestAnimationFrame(challengeTick);
}

function setupChallenge(): void {
  const startBtn = $('#startChallengeBtn');
  const msgEl = $('#challengeMessage');
  if (!startBtn) return;

  startBtn.onclick = (e) => {
    e.preventDefault();
    sound.play('dun');
    if (msgEl) msgEl.textContent = 'Don’t touch anything...';
    startBtn.style.visibility = 'hidden';

    setTimeout(() => {
      challengeActive = true;
      challengeStartTime = performance.now();
      challengeTick();

      let moves = 0;
      const failEvents = ['pointermove', 'keydown', 'touchstart', 'pointerdown', 'wheel', 'scroll'];
      const onMove = (ev: Event): void => {
        if (ev.type === 'pointermove' && ++moves < 4) return;
        failEvents.forEach((t) => window.removeEventListener(t, onMove, true));
        startBtn.style.visibility = 'visible';
        challengeStop(true);
      };

      failEvents.forEach((t) => window.addEventListener(t, onMove, true));
    }, 500);
  };
}

// 4. Excuse Generator
let lastExcuseIdx = -1;
function setupExcuseMachine(): void {
  const btn = $('#generateExcuseBtn');
  const copyBtn = $('#copyExcuseBtn');
  const output = $('#excuseOutput');
  if (!btn) return;

  btn.onclick = () => {
    const list = config.excusesList && config.excusesList.length ? config.excusesList : EXCUSES_LIST;
    let next: number;
    do {
      next = Math.floor(Math.random() * list.length);
    } while (next === lastExcuseIdx);
    lastExcuseIdx = next;

    sound.play('boing');
    if (output) output.textContent = list[next];
  };

  if (copyBtn && output) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(output.textContent || '');
        showToast('Copied. Use it wisely.');
        sound.play('pop');
      } catch {
        showToast('Couldn’t copy.');
      }
    };
  }
}

// ==========================================================================
// Hidden Admin Command Center (Accessible directly via #admin)
// ==========================================================================
let adminUnlocked = false;
type AdminTab = 'entries' | 'hero' | 'dodge' | 'roasts' | 'pricing' | 'database' | 'backup';
let adminTab: AdminTab = 'entries';

function renderAdmin(): void {
  const adminEl = $('#adminDashboard');
  if (!adminEl) return;

  if (!adminUnlocked) {
    adminEl.innerHTML = `
      <div class="panel" style="max-width:400px">
        <label for="adminPass">Passcode</label>
        <input type="password" id="adminPass" placeholder="Enter admin passcode">
        <p style="margin-top:12px"><button class="btn sm" id="adminUnlockBtn">Unlock</button></p>
        <p class="hint">Passcode: <code>admin123</code></p>
      </div>
    `;

    const unlockBtn = $('#adminUnlockBtn');
    if (unlockBtn) {
      unlockBtn.onclick = () => {
        const pass = ($('#adminPass') as HTMLInputElement | null)?.value || '';
        if (pass === config.adminPasscode) {
          adminUnlocked = true;
          sound.play('fanfare');
          renderAdmin();
        } else {
          showToast('Wrong passcode.');
          sound.play('sad');
        }
      };
    }
    return;
  }

  adminEl.innerHTML = `
    <div class="chips" style="margin-bottom:12px">
      <button class="chip ${adminTab === 'entries' ? 'on' : ''}" data-at="entries">Entries (${entries.length})</button>
      <button class="chip ${adminTab === 'hero' ? 'on' : ''}" data-at="hero">Hero Lines</button>
      <button class="chip ${adminTab === 'dodge' ? 'on' : ''}" data-at="dodge">Dodge Quotes</button>
      <button class="chip ${adminTab === 'roasts' ? 'on' : ''}" data-at="roasts">Roasts & Excuses</button>
      <button class="chip ${adminTab === 'pricing' ? 'on' : ''}" data-at="pricing">Settings</button>
      <button class="chip ${adminTab === 'database' ? 'on' : ''}" data-at="database">Supabase</button>
      <button class="chip ${adminTab === 'backup' ? 'on' : ''}" data-at="backup">Backup</button>
    </div>

    ${
      adminTab === 'entries'
        ? `
        <div class="panel">
          <h3>Record an entry</h3>
          <p class="hint">Record payments received outside the site (UPI, PayPal, cash).</p>
          <label>Name or product</label>
          <input type="text" id="mName" placeholder="Acme Inc">
          <label>Link</label>
          <input type="text" id="mUrl" placeholder="https://...">
          <label>Amount (USD)</label>
          <input type="number" id="mAmt" step="0.01" value="25">
          <label>Description</label>
          <textarea id="mDesc" placeholder="Note"></textarea>
          <p style="margin-top:12px"><button class="btn sm" id="mSaveBtn">Add entry</button></p>
        </div>

        <div class="chips" style="margin:12px 0">
          <button class="chip" id="adminExportCsv">Show CSV</button>
          <button class="chip" id="adminResetSample">Reset to sample</button>
          <button class="chip" id="adminClearAll">Delete all entries</button>
        </div>
        <div id="adminCsvOutput"></div>

        <h3 style="margin-top:16px">${entries.length} entries</h3>
        ${entries
          .map(
            (item) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1.5px solid var(--line);gap:8px;flex-wrap:wrap">
            <span style="font-size:13.5px"><b>${AnalyticsService.escapeHtml(item.name)}</b> · ${AnalyticsService.formatMoney(item.amt)} · ${new Date(item.t).toLocaleDateString()}</span>
            <div style="display:flex;gap:4px">
              <button class="chip" data-edit="${item.id}" style="padding:3px 8px;font-size:11.5px">Edit</button>
              <button class="chip" data-del="${item.id}" style="padding:3px 8px;font-size:11.5px">Delete</button>
            </div>
          </div>
        `
          )
          .join('')}
      `
        : adminTab === 'hero'
        ? `
        <div class="panel">
          <label>Hero Tag</label>
          <input type="text" id="cfgTag" value="${AnalyticsService.escapeHtml(config.tagline)}">
          <label>Main Button Text</label>
          <input type="text" id="cfgBtn" value="${AnalyticsService.escapeHtml(config.buttonText)}">
          <label>Small Subtitle Under Main Button</label>
          <input type="text" id="cfgSub" value="${AnalyticsService.escapeHtml(config.subText)}">
          <label>Rotating Hero Lines (one per line)</label>
          <textarea id="cfgLines" style="min-height:180px">${AnalyticsService.escapeHtml((config.lines || ROTATING_LINES).join('\n'))}</textarea>
          <p style="margin-top:12px"><button class="btn sm" id="cfgSaveHeroBtn">Save Hero Lines</button></p>
        </div>
      `
        : adminTab === 'dodge'
        ? `
        <div class="panel">
          <label>“Go get a job” button texts (one per line)</label>
          <textarea id="cfgDodgeQuotes" style="min-height:220px">${AnalyticsService.escapeHtml((config.dodgeQuotes || DODGE_QUOTES).join('\n'))}</textarea>
          <p style="margin-top:12px"><button class="btn sm" id="cfgSaveDodgeBtn">Save Dodge Quotes</button></p>
        </div>
      `
        : adminTab === 'roasts'
        ? `
        <div class="panel">
          <label>Roast templates (use {n} for name, one per line)</label>
          <textarea id="cfgRoasts" style="min-height:160px">${AnalyticsService.escapeHtml((config.roastTemplates || ROAST_TEMPLATES).join('\n'))}</textarea>
          <label style="margin-top:12px">Excuses (one per line)</label>
          <textarea id="cfgExcuses" style="min-height:160px">${AnalyticsService.escapeHtml((config.excusesList || EXCUSES_LIST).join('\n'))}</textarea>
          <p style="margin-top:12px"><button class="btn sm" id="cfgSaveRoastsBtn">Save Roasts & Excuses</button></p>
        </div>
      `
        : adminTab === 'pricing'
        ? `
        <div class="panel">
          <label>Payment link (empty = preview mode)</label>
          <input type="text" id="cfgPayUrl" value="${AnalyticsService.escapeHtml(config.payUrl)}" placeholder="https://...">
          <label>Presets (comma separated)</label>
          <input type="text" id="cfgPresets" value="${(config.presets || [5, 10, 25, 50, 100]).join(', ')}">
          <label>Admin passcode</label>
          <input type="text" id="cfgPass" value="${AnalyticsService.escapeHtml(config.adminPasscode)}">
          <p style="margin-top:12px"><button class="btn sm" id="cfgSavePricingBtn">Save settings</button></p>
        </div>
      `
        : adminTab === 'database'
        ? `
        <div class="panel">
          <h3>Supabase Database</h3>
          <p class="hint">URL: <code>https://upnbvommgourlstrilsa.supabase.co</code></p>
          <div class="chips" style="margin:10px 0">
            <button class="chip" id="btnTestSupabase">Test Connection</button>
            <button class="chip" id="btnPushSupabase">Push Local to Supabase</button>
            <button class="chip" id="btnPullSupabase">Pull from Supabase</button>
          </div>
          <div id="supabaseTestResult" style="margin-top:6px"></div>

          <label style="margin-top:14px">SQL Schema for Supabase Editor</label>
          <textarea style="min-height:120px;font-family:monospace;font-size:11.5px" readonly>${AnalyticsService.escapeHtml(SupabaseService.getCreateSqlSchema())}</textarea>
          <p style="margin-top:8px"><button class="chip" id="btnCopySql">Copy SQL</button></p>
        </div>
      `
        : `
        <div class="panel">
          <label>Export (copy this)</label>
          <textarea style="min-height:120px;font-family:monospace;font-size:11.5px" readonly>${AnalyticsService.escapeHtml(JSON.stringify({ config, entries }))}</textarea>
          <label style="margin-top:12px">Import (paste here)</label>
          <textarea id="importJsonBox" style="min-height:100px;font-family:monospace;font-size:11.5px"></textarea>
          <p style="margin-top:8px"><button class="btn sm" id="importJsonBtn">Import</button></p>
        </div>
      `
    }
  `;

  adminEl.querySelectorAll<HTMLElement>('[data-at]').forEach((b) => {
    b.onclick = () => {
      adminTab = (b.getAttribute('data-at') as AdminTab) || 'entries';
      renderAdmin();
    };
  });

  if (adminTab === 'entries') {
    const saveBtn = $('#mSaveBtn');
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const name = ($('#mName') as HTMLInputElement | null)?.value.trim() || '';
        const amt = parseFloat(($('#mAmt') as HTMLInputElement | null)?.value || '0');
        if (!name || isNaN(amt) || amt <= 0) {
          showToast('Name and a positive amount are required.');
          return;
        }
        const rawUrl = ($('#mUrl') as HTMLInputElement | null)?.value || '';
        const newManual: LeaderboardEntry = {
          id: 'm-' + Date.now(),
          name,
          url: AnalyticsService.safeUrl(rawUrl),
          amt: Math.round(amt * 100) / 100,
          desc: ($('#mDesc') as HTMLTextAreaElement | null)?.value.trim() || '',
          img: resolveAvatarUrl(rawUrl),
          anon: false,
          t: Date.now(),
          src: 'manual'
        };
        entries = await StorageService.addEntry(newManual);
        renderAdmin();
        renderLeaderboard();
        showToast('Saved.');
      };
    }

    adminEl.querySelectorAll<HTMLElement>('[data-del]').forEach((b) => {
      b.onclick = async () => {
        const delId = b.getAttribute('data-del');
        if (delId) {
          entries = await StorageService.deleteEntry(delId);
          renderAdmin();
          renderLeaderboard();
        }
      };
    });

    adminEl.querySelectorAll<HTMLElement>('[data-edit]').forEach((b) => {
      b.onclick = () => {
        const editId = b.getAttribute('data-edit');
        const item = entries.find((x) => x.id === editId);
        if (!item || !modalContent || !modalBackdrop) return;

        modalContent.innerHTML = `
          <h2>Edit entry</h2>
          <label>Name</label>
          <input type="text" id="edName" value="${AnalyticsService.escapeHtml(item.name)}">
          <label>Amount (USD)</label>
          <input type="number" id="edAmt" value="${item.amt}">
          <label>Link</label>
          <input type="text" id="edUrl" value="${AnalyticsService.escapeHtml(item.url)}">
          <label>Description</label>
          <textarea id="edDesc">${AnalyticsService.escapeHtml(item.desc)}</textarea>
          <p style="display:flex;gap:10px;margin-top:14px">
            <button class="btn sm" id="edSaveBtn">Save changes</button>
            <button class="btn sm w" id="edCancelBtn">Cancel</button>
          </p>
        `;
        modalBackdrop.classList.add('on');
        $('#edCancelBtn')!.onclick = closeModal;
        $('#edSaveBtn')!.onclick = async () => {
          const updName = ($('#edName') as HTMLInputElement).value.trim();
          const updAmt = parseFloat(($('#edAmt') as HTMLInputElement).value);
          const updUrl = ($('#edUrl') as HTMLInputElement).value.trim();
          const updDesc = ($('#edDesc') as HTMLTextAreaElement).value.trim();

          entries = await StorageService.updateEntry(item.id, {
            name: updName,
            amt: updAmt,
            url: AnalyticsService.safeUrl(updUrl),
            desc: updDesc,
            img: resolveAvatarUrl(updUrl, item.img)
          });
          closeModal();
          renderAdmin();
          renderLeaderboard();
          showToast('Saved.');
        };
      };
    });

    const exportBtn = $('#adminExportCsv');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const rows = [
          ['name', 'url', 'amount', 'date', 'source'],
          ...entries.map((x) => [x.name, x.url, x.amt, new Date(x.t).toISOString(), x.src || ''])
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const csvOut = $('#adminCsvOutput');
        if (csvOut) {
          csvOut.innerHTML = `<textarea style="min-height:120px;margin-top:10px">${AnalyticsService.escapeHtml(csv)}</textarea>`;
        }
      };
    }

    const resetBtn = $('#adminResetSample');
    if (resetBtn) {
      resetBtn.onclick = () => {
        entries = [...INITIAL_LEADERBOARD];
        StorageService.saveEntries(entries);
        renderAdmin();
        renderLeaderboard();
        showToast('Reset.');
      };
    }

    const clearBtn = $('#adminClearAll');
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm('Delete all entries?')) {
          entries = [];
          StorageService.saveEntries(entries);
          renderAdmin();
          renderLeaderboard();
          showToast('Cleared.');
        }
      };
    }
  } else if (adminTab === 'hero') {
    $('#cfgSaveHeroBtn')!.onclick = () => {
      config.tagline = ($('#cfgTag') as HTMLInputElement).value.trim();
      config.buttonText = ($('#cfgBtn') as HTMLInputElement).value.trim();
      config.subText = ($('#cfgSub') as HTMLInputElement).value.trim();

      const linesRaw = ($('#cfgLines') as HTMLTextAreaElement).value;
      config.lines = linesRaw.split('\n').map((s) => s.trim()).filter(Boolean);

      StorageService.saveConfig(config);
      renderApp();
      showToast('Lines saved.');
    };
  } else if (adminTab === 'dodge') {
    $('#cfgSaveDodgeBtn')!.onclick = () => {
      const dodgeRaw = ($('#cfgDodgeQuotes') as HTMLTextAreaElement).value;
      config.dodgeQuotes = dodgeRaw.split('\n').map((s) => s.trim()).filter(Boolean);
      StorageService.saveConfig(config);
      showToast('Saved.');
    };
  } else if (adminTab === 'roasts') {
    $('#cfgSaveRoastsBtn')!.onclick = () => {
      const roastsRaw = ($('#cfgRoasts') as HTMLTextAreaElement).value;
      const excusesRaw = ($('#cfgExcuses') as HTMLTextAreaElement).value;
      config.roastTemplates = roastsRaw.split('\n').map((s) => s.trim()).filter(Boolean);
      config.excusesList = excusesRaw.split('\n').map((s) => s.trim()).filter(Boolean);
      StorageService.saveConfig(config);
      showToast('Saved.');
    };
  } else if (adminTab === 'pricing') {
    $('#cfgSavePricingBtn')!.onclick = () => {
      config.payUrl = ($('#cfgPayUrl') as HTMLInputElement).value.trim();
      const presetsRaw = ($('#cfgPresets') as HTMLInputElement).value;
      config.presets = presetsRaw
        .split(',')
        .map((n) => parseFloat(n.trim()))
        .filter((n) => !isNaN(n) && n > 0);
      config.adminPasscode = ($('#cfgPass') as HTMLInputElement).value.trim() || 'admin123';
      StorageService.saveConfig(config);
      renderApp();
      showToast('Settings saved.');
    };
  } else if (adminTab === 'database') {
    $('#btnTestSupabase')!.onclick = async () => {
      const out = $('#supabaseTestResult');
      if (out) out.innerHTML = `<span class="hint">Testing...</span>`;
      const res = await SupabaseService.testConnection();
      if (out) {
        out.innerHTML = `<div class="note" style="background:${res.ok ? '#DCFCE7' : '#FEE2E2'}">${AnalyticsService.escapeHtml(res.message)}</div>`;
      }
    };

    $('#btnPushSupabase')!.onclick = async () => {
      let count = 0;
      for (const entry of entries) {
        const ok = await SupabaseService.insertEntry(entry);
        if (ok) count++;
      }
      showToast(`Pushed ${count} to Supabase.`);
    };

    $('#btnPullSupabase')!.onclick = async () => {
      const fresh = await StorageService.syncFromSupabase();
      entries = fresh;
      renderLeaderboard();
      renderAdmin();
      showToast(`Pulled ${fresh.length} entries.`);
    };

    $('#btnCopySql')!.onclick = async () => {
      try {
        await navigator.clipboard.writeText(SupabaseService.getCreateSqlSchema());
        showToast('Copied.');
      } catch {
        showToast('Couldn’t copy.');
      }
    };
  } else if (adminTab === 'backup') {
    $('#importJsonBtn')!.onclick = () => {
      try {
        const val = ($('#importJsonBox') as HTMLTextAreaElement).value || '';
        const parsed = JSON.parse(val);
        if (parsed.entries && Array.isArray(parsed.entries)) {
          entries = parsed.entries;
          StorageService.saveEntries(entries);
        }
        if (parsed.config) {
          config = { ...config, ...parsed.config };
          StorageService.saveConfig(config);
        }
        renderAdmin();
        renderApp();
        showToast('Imported.');
      } catch {
        showToast('Invalid JSON.');
      }
    };
  }
}

// ==========================================================================
// Master App Render & Initializer
// ==========================================================================
function renderApp(): void {
  const meal = AnalyticsService.getMealName();
  const mainBtn = $('#fundHeroBtn');
  const tagEl = $('#heroTag');

  if (mainBtn) {
    mainBtn.innerHTML = `
      ${AnalyticsService.escapeHtml(config.buttonText)} ${AnalyticsService.escapeHtml(meal)}
      <small>${AnalyticsService.escapeHtml(config.subText)}</small>
    `;
  }
  if (tagEl) tagEl.textContent = config.tagline;

  renderLeaderboard();
  renderHallOfFame();
}

async function initApp(): Promise<void> {
  const soundBtn = $('#soundToggleBtn');
  if (soundBtn) {
    soundBtn.onclick = () => {
      const isSoundOn = sound.toggle();
      soundBtn.textContent = 'Sound: ' + (isSoundOn ? 'on' : 'off');
    };
  }

  $$<HTMLElement>('[data-board-mode]').forEach((btn) => {
    btn.onclick = () => {
      $$('[data-board-mode]').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      currentBoardMode = (btn.getAttribute('data-board-mode') as BoardFilterMode) || 'recent';
      sound.play('pop');
      renderLeaderboard();
    };
  });

  const fundHeroBtn = $('#fundHeroBtn');
  if (fundHeroBtn) {
    fundHeroBtn.onclick = () => openFundModal();
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('.btn, .chip, .lr, .pc, .rbtn')) {
      sound.randomClick();
    }
  });

  setupMobileNav();
  setupDodgingButton();
  setupRedButton();
  setupRoastMachine();
  setupChallenge();
  setupExcuseMachine();

  cycleHeroLine();
  window.setInterval(cycleHeroLine, 3800);

  window.setInterval(() => {
    const stats = AnalyticsService.calculateDailyStats(entries, config.targetGoal);
    const rstEl = $('#resetCountdown');
    if (rstEl) rstEl.textContent = stats.resetCountdownFormatted;
  }, 1000);

  // Supabase background sync and realtime subscription
  try {
    const remoteEntries = await StorageService.syncFromSupabase();
    if (remoteEntries && remoteEntries.length > 0) {
      entries = remoteEntries;
      renderLeaderboard();
    }
    SupabaseService.subscribeToEntries(async () => {
      const updated = await StorageService.syncFromSupabase();
      entries = updated;
      renderLeaderboard();
      renderHallOfFame();
    });
  } catch (err) {
    console.warn('Initial Supabase sync fallback:', err);
  }

  route();
}

window.addEventListener('DOMContentLoaded', initApp);
