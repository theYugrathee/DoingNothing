import '../css/style.css';
import {
  AppConfig,
  LeaderboardEntry,
  BoardFilterMode,
  AppPage,
  PaymentGateway
} from './types';
import { StorageService } from './services/storage';
import { AnalyticsService } from './services/analytics';
import { PaymentService } from './services/payments';
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

// Toast Notifications
let toastTimeout: number | undefined;
export const showToast = (message: string): void => {
  const toastEl = $('#toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 3400);
};

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
  lineEl.style.opacity = '0';
  setTimeout(() => {
    lineEl.textContent = ROTATING_LINES[lineIndex++ % ROTATING_LINES.length];
    lineEl.style.opacity = '1';
  }, 250);
}

// ==========================================================================
// Dodging "Go Get A Job" Button
// ==========================================================================
let dodgeCount = 0;
let dodgeLastTime = 0;

function setupDodgingButton(): void {
  const runBtn = $('#run');
  const heroCtaArea = $('#heroCtaArea');
  if (!runBtn || !heroCtaArea) return;

  const dodge = (): void => {
    const now = performance.now();
    if (now - dodgeLastTime < 40) return;
    dodgeLastTime = now;

    dodgeCount++;
    const soundsList: Array<'boing' | 'squeak' | 'blorp' | 'honk'> = ['boing', 'squeak', 'blorp', 'honk'];
    sound.play(soundsList[dodgeCount % soundsList.length], 40);

    runBtn.textContent = DODGE_QUOTES[Math.floor(Math.random() * DODGE_QUOTES.length)];
    runBtn.classList.add('dodging');

    const btnW = runBtn.offsetWidth;
    const maxOffsetX = Math.min(200, window.innerWidth - btnW - 40);
    const offsetX = (Math.random() - 0.5) * maxOffsetX;
    const offsetY = (Math.random() - 0.5) * 80;

    runBtn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    window.clearTimeout((dodge as { timer?: number }).timer);
    (dodge as { timer?: number }).timer = window.setTimeout(() => {
      runBtn.textContent = 'Go get a job';
      runBtn.classList.remove('dodging');
      runBtn.style.transform = 'none';
    }, 4500);
  };

  runBtn.addEventListener('pointerenter', dodge);
  runBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    dodge();
  });
  runBtn.addEventListener('click', (e) => {
    e.preventDefault();
    dodge();
  });
}

// ==========================================================================
// Leaderboard & Today's Board Rendering
// ==========================================================================
function renderAvatar(item: LeaderboardEntry, isLarge: boolean = false): string {
  if (item.img) {
    return `<div class="avatar ${isLarge ? 'lg' : ''}"><img src="${AnalyticsService.escapeHtml(item.img)}" alt="${AnalyticsService.escapeHtml(item.name)}"></div>`;
  }
  if (item.anon) {
    return `<div class="avatar ${isLarge ? 'lg' : ''}" style="background:#555">?</div>`;
  }
  const colors = ['#2F4BFF', '#E8412C', '#0E9F6E', '#8B3DFF', '#F08A00', '#101010', '#D6246E'];
  let hash = 0;
  for (let i = 0; i < item.name.length; i++) hash += item.name.charCodeAt(i);
  const bg = colors[hash % colors.length];
  const initial = (item.name[0] || '?').toUpperCase();
  return `<div class="avatar ${isLarge ? 'lg' : ''}" style="background:${bg}">${AnalyticsService.escapeHtml(initial)}</div>`;
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
  if (topNameEl) topNameEl.textContent = stats.topSupporter;

  const displayList = AnalyticsService.getSortedBoard(entries, currentBoardMode);

  if (displayList.length === 0) {
    boardEl.innerHTML = `
      <div class="empty-box">
        Nobody has bought me a meal today yet.
        <span>Be the first legend on the board. I'm extraordinarily hungry!</span>
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

    html += `<div class="podium-grid" style="grid-template-columns: repeat(${podiums.length}, 1fr)">`;
    podiums.forEach((p) => {
      const tier = AnalyticsService.getTier(p.item.amt);
      html += `
        <div class="podium-card ${p.cls}" data-id="${p.item.id}">
          <span class="medal-badge">${p.rank}</span>
          ${
            p.rank === 1
              ? `<div class="crown-icon">
                  <svg viewBox="0 0 24 24" width="36" height="36">
                    <path d="M3 18h18l1-10-5 4-5-8-5 8-5-4z" fill="#FFD23F" stroke="#101010" stroke-width="1.8" stroke-linejoin="round"/>
                  </svg>
                </div>`
              : ''
          }
          ${renderAvatar(p.item, p.rank === 1)}
          <h3>${AnalyticsService.escapeHtml(p.item.name)}</h3>
          <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
          <div class="amt">${AnalyticsService.formatMoney(p.item.amt)}</div>
          <span class="view-details">Click for bio ›</span>
        </div>
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
    const pct = Math.min(100, Math.max(6, (item.amt / maxAmount) * 100));
    const isFresh = Date.now() - item.t < 1000 * 60 * 15;

    html += `
      <div class="board-row ${isFresh ? 'hot' : ''}" data-id="${item.id}">
        <div>
          ${
            currentBoardMode === 'top'
              ? `<span class="rank-badge">${rank}</span>`
              : `<span class="time-pill ${isFresh ? 'fresh' : ''}">${AnalyticsService.getTimeAgo(item.t)}</span>`
          }
        </div>
        ${renderAvatar(item)}
        <div>
          <h3>
            ${AnalyticsService.escapeHtml(item.name)}
            <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
            ${item.src === 'preview' ? `<span class="badge-src">Preview</span>` : ''}
          </h3>
          <p>${AnalyticsService.escapeHtml(item.desc || 'Fueling the non-productive movement.')}</p>
          ${host ? `<div class="url-preview">🔗 ${AnalyticsService.escapeHtml(host)}</div>` : ''}
        </div>
        <div class="row-amount">
          ${AnalyticsService.formatMoney(item.amt)}
          <span class="view-btn">Details ›</span>
        </div>
        <div class="progress-strip" style="width:${pct}%"></div>
      </div>
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
      <div class="empty-box">
        The Hall of Fame is awaiting its first hero.
        <span>Contributions of all time will be recorded here eternally.</span>
      </div>
    `;
    return;
  }

  let html = `<p class="hint-text" style="margin-bottom:14px">Showing the top ${sortedAll.length} all-time supporters.</p>`;

  sortedAll.forEach((item, idx) => {
    const rank = idx + 1;
    const tier = AnalyticsService.getTier(item.amt);
    const host = AnalyticsService.getHost(item.url);
    const pct = Math.min(100, Math.max(6, (item.amt / maxAmount) * 100));

    html += `
      <div class="board-row ${rank <= 3 ? 'hot' : ''}" data-id="${item.id}">
        <div><span class="rank-badge" style="${rank === 1 ? 'background:#FFD23F;color:#101010' : ''}">${rank}</span></div>
        ${renderAvatar(item)}
        <div>
          <h3>
            ${AnalyticsService.escapeHtml(item.name)}
            <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
          </h3>
          <p>${AnalyticsService.escapeHtml(item.desc || 'Legendary patron of doing nothing.')}</p>
          ${host ? `<div class="url-preview">🔗 ${AnalyticsService.escapeHtml(host)}</div>` : ''}
        </div>
        <div class="row-amount">
          ${AnalyticsService.formatMoney(item.amt)}
          <span class="view-btn">Details ›</span>
        </div>
        <div class="progress-strip" style="width:${pct}%"></div>
      </div>
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
  const tier = AnalyticsService.getTier(item.amt);

  modalContent.innerHTML = `
    <button class="modal-close-x" id="modalCloseBtn">&times;</button>
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
      ${renderAvatar(item, true)}
      <div>
        <h2 style="font-size:26px">${AnalyticsService.escapeHtml(item.name)}</h2>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
          <b style="font-size:20px;font-family:var(--font-disp)">${AnalyticsService.formatMoney(item.amt)}</b>
          <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
        </div>
      </div>
    </div>
    <div style="background:var(--paper);border:2px solid var(--line);border-radius:var(--radius-md);padding:16px;margin:14px 0">
      <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${AnalyticsService.escapeHtml(item.desc || 'No custom message provided.')}</p>
    </div>
    ${
      url
        ? `<div style="margin-top:16px">
            <a class="btn sm" href="${AnalyticsService.escapeHtml(url)}" target="_blank" rel="nofollow noopener ugc">
              Visit Website (${AnalyticsService.escapeHtml(host)}) ↗
            </a>
           </div>`
        : ''
    }
    <p class="hint-text" style="margin-top:14px">Contributed on ${new Date(item.t).toLocaleString()}</p>
  `;

  modalBackdrop.classList.add('on');
  const closeBtn = $('#modalCloseBtn');
  if (closeBtn) closeBtn.onclick = closeModal;
}

function openFundModal(): void {
  if (!modalContent || !modalBackdrop) return;
  sound.play('kaching');
  let uploadedLogo = '';
  let selectedGateway: PaymentGateway = 'stripe';

  const meal = AnalyticsService.getMealName();

  modalContent.innerHTML = `
    <button class="modal-close-x" id="modalCloseBtn">&times;</button>
    <h2>${AnalyticsService.escapeHtml(config.buttonText)} ${AnalyticsService.escapeHtml(meal)} 🍜</h2>
    <p class="hint-text">Get featured on today's board and fuel the non-productive revolution.</p>

    <label style="display:flex;align-items:center;gap:10px;margin-top:18px;cursor:pointer">
      <input type="checkbox" id="fundAnon">
      <span>Contribute anonymously (no name, no website link)</span>
    </label>

    <div id="fundNamedFields">
      <label for="fundName">Your Name or Startup Name</label>
      <input id="fundName" maxlength="60" placeholder="e.g. Acme Analytics or John Doe">

      <label for="fundUrl">Website or Social Profile URL</label>
      <input id="fundUrl" maxlength="140" placeholder="https://yourstartup.com or https://x.com/username">
      <p class="hint-text">Visitors can click through directly to your product or profile.</p>

      <label for="fundLogo">Upload Logo / Avatar (optional)</label>
      <input id="fundLogo" type="file" accept="image/*">
      <div id="fundLogoPreview" style="margin-top:8px;display:none"></div>
    </div>

    <label for="fundAmount">Contribution Amount (USD)</label>
    <div class="amount-presets">
      <button class="chip" data-amt="5">$5</button>
      <button class="chip on" data-amt="10">$10</button>
      <button class="chip" data-amt="25">$25</button>
      <button class="chip" data-amt="50">$50</button>
      <button class="chip" data-amt="100">$100</button>
    </div>
    <input id="fundAmount" type="number" min="1" step="1" value="10" placeholder="Custom amount (min $1)">

    <label for="fundDesc">Message / Product Pitch <span id="fundWordCount" class="hint-text" style="display:inline">(0 / 500 words)</span></label>
    <textarea id="fundDesc" placeholder="Tell the world what you're building, or share your favorite nap technique."></textarea>

    <label>Select Payment Method (Simulation / Live Ready)</label>
    <div class="gateway-grid">
      <div class="gateway-card selected" data-gw="stripe">
        <span>💳 Stripe Card</span>
      </div>
      <div class="gateway-card" data-gw="razorpay">
        <span>🇮🇳 UPI / Razorpay</span>
      </div>
      <div class="gateway-card" data-gw="paypal">
        <span>🅿️ PayPal</span>
      </div>
      <div class="gateway-card" data-gw="crypto">
        <span>⚡ Crypto</span>
      </div>
    </div>

    <div class="banner-note" id="fundNotice">
      <b>🚀 Instant Preview Mode:</b> Contributions instantly render on today's live leaderboard. When your live Stripe/Razorpay keys are connected, it automatically switches to live payment processing!
    </div>

    <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
      <button class="btn" id="fundSubmitBtn" style="flex:1;text-align:center">
        Complete & Get on Board 🚀
      </button>
      <button class="btn w" id="fundCancelBtn">Cancel</button>
    </div>
  `;

  modalBackdrop.classList.add('on');

  const closeBtn = $('#modalCloseBtn');
  const cancelBtn = $('#fundCancelBtn');
  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;

  const anonCheckbox = $('#fundAnon') as HTMLInputElement | null;
  const namedFields = $('#fundNamedFields');
  if (anonCheckbox && namedFields) {
    anonCheckbox.onchange = () => {
      namedFields.style.display = anonCheckbox.checked ? 'none' : 'block';
    };
  }

  const amountInput = $('#fundAmount') as HTMLInputElement | null;
  modalContent.querySelectorAll<HTMLButtonElement>('[data-amt]').forEach((chip) => {
    chip.onclick = () => {
      modalContent.querySelectorAll('[data-amt]').forEach((c) => c.classList.remove('on'));
      chip.classList.add('on');
      if (amountInput) amountInput.value = chip.getAttribute('data-amt') || '10';
    };
  });

  modalContent.querySelectorAll<HTMLElement>('[data-gw]').forEach((gw) => {
    gw.onclick = () => {
      modalContent.querySelectorAll('[data-gw]').forEach((g) => g.classList.remove('selected'));
      gw.classList.add('selected');
      selectedGateway = (gw.getAttribute('data-gw') as PaymentGateway) || 'stripe';
      sound.play('pop');
    };
  });

  const descInput = $('#fundDesc') as HTMLTextAreaElement | null;
  const wcEl = $('#fundWordCount');
  if (descInput && wcEl) {
    descInput.oninput = () => {
      const words = descInput.value.trim().split(/\s+/).filter(Boolean).length;
      wcEl.textContent = `(${words} / 500 words)`;
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
            uploadedLogo = canvas.toDataURL('image/jpeg', 0.85);

            const previewEl = $('#fundLogoPreview');
            if (previewEl) {
              previewEl.style.display = 'block';
              previewEl.innerHTML = `<img src="${uploadedLogo}" style="width:48px;height:48px;border-radius:8px;border:2px solid var(--ink)">`;
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
      const urlInput = $('#fundUrl') as HTMLInputElement | null;
      const name = isAnon ? 'Anonymous Hero' : (nameInput?.value.trim() || '');
      const rawUrl = isAnon ? '' : (urlInput?.value.trim() || '');
      const amt = parseFloat(amountInput?.value || '0');
      const desc = descInput?.value.trim() || '';

      if (!name) {
        showToast("Please provide your name or check 'Contribute anonymously'.");
        sound.play('sad');
        return;
      }
      if (rawUrl && !AnalyticsService.safeUrl(rawUrl) && rawUrl[0] !== '@') {
        showToast('Please enter a valid website link (e.g. https://yourstartup.com).');
        sound.play('sad');
        return;
      }
      if (isNaN(amt) || amt < 1) {
        showToast('Minimum contribution is $1.');
        sound.play('sad');
        return;
      }

      const result = await PaymentService.processPayment({
        name,
        url: rawUrl,
        amount: amt,
        desc,
        img: uploadedLogo,
        anon: isAnon,
        gateway: selectedGateway
      });

      if (result.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener');
        closeModal();
        showToast('Complete payment on checkout page.');
        return;
      }

      if (result.success && result.entry) {
        entries = StorageService.getEntries();
        closeModal();
        renderApp();
        sound.play('fanfare');
        confetti.fire(95);
        showToast("🎉 You're on today's board! Thank you for the meal.");
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
  'I explicitly asked you not to press that.',
  'That was literally my singular rule.',
  'You possess the impulse control of a distracted kitten.',
  'Nothing occurred. You did that to yourself.',
  'I have inspected your browser history. Please stand down.',
  'Go outside. Touch botanical vegetation.',
  'Every button press delays the launch of my career by 1 hour.'
];

function setupRedButton(): void {
  const redBtn = $('#bigRedBtn');
  const msgEl = $('#redMessage');
  const counterEl = $('#redPressCounter');
  if (!redBtn) return;

  redBtn.onclick = () => {
    redPressCount++;
    sound.play(redPressCount === 5 ? 'alarm' : redPressCount % 2 === 0 ? 'boom' : 'horn');

    if (counterEl) counterEl.textContent = `Total button presses: ${redPressCount}`;

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
    <h2>⚠️ Deleting the Entire Internet...</h2>
    <div class="progress-bar-wrap">
      <i class="progress-bar-fill" id="deleteProgressBar"></i>
    </div>
    <p id="deleteStatusText" style="font-weight:700">Purging cached memes...</p>
    <p class="hint-text">(Pure satire, your wifi is safe)</p>
  `;
  modalBackdrop.classList.add('on');

  const steps = [
    'Dissolving corporate Slack channels...',
    'Unsubscribing from marketing emails...',
    'Cancelling Monday mornings permanently...',
    'Erasing JavaScript frameworks...',
    'Deleting the ramen noodles database... WAIT NO!'
  ];

  let progress = 0;
  let stepIdx = 0;
  const bar = $('#deleteProgressBar');
  const text = $('#deleteStatusText');

  const interval = window.setInterval(() => {
    progress += Math.random() * 12 + 5;
    sound.play('tick', 20);

    if (progress >= 98) {
      progress = 98;
      window.clearInterval(interval);
      sound.play('scratch');
      if (text) text.textContent = 'Wait. Deleting everything sounds like actual work.';

      setTimeout(() => {
        sound.play('sad');
        if (!modalContent) return;
        modalContent.innerHTML = `
          <h2>Operation Aborted! 😴</h2>
          <p style="font-size:16px;margin:12px 0">I got too overwhelmed and took a nap instead. You're welcome.</p>
          <div style="display:flex;gap:12px">
            <button class="btn" id="redMealBtn" style="flex:1">Buy me noodles to say thanks</button>
            <button class="btn w" id="redCloseBtn">Phew</button>
          </div>
        `;
        const mealBtn = $('#redMealBtn');
        const closeB = $('#redCloseBtn');
        if (mealBtn) mealBtn.onclick = openFundModal;
        if (closeB) closeB.onclick = closeModal;
      }, 1400);
    } else {
      if (bar) bar.style.width = progress + '%';
      if (text && Math.random() < 0.4) {
        text.textContent = steps[stepIdx++ % steps.length];
      }
    }
  }, 280);
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
      showToast('Please enter a startup or project name first!');
      sound.play('sad');
      return;
    }

    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * ROAST_TEMPLATES.length);
    } while (nextIdx === lastRoastIdx);
    lastRoastIdx = nextIdx;

    sound.play('rim');
    const roastText = ROAST_TEMPLATES[nextIdx].replace(/\{n\}/g, name);
    if (roastOutput) roastOutput.textContent = roastText;
    if (roastActions) roastActions.style.display = 'flex';
  };

  if (copyRoastBtn && roastOutput) {
    copyRoastBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(roastOutput.textContent || '');
        showToast('Roast copied to clipboard!');
        sound.play('pop');
      } catch {
        showToast('Could not copy.');
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
      if (durationSec < 5) msgEl.textContent = "You lasted as long as a New Year's gym resolution.";
      else if (durationSec < 15) msgEl.textContent = 'Mediocre. Your phone screen detected twitches.';
      else if (durationSec < 30) msgEl.textContent = 'Decent motionless poise. An apprentice of zero output.';
      else if (durationSec < 60) msgEl.textContent = 'Remarkable stillness. Please consider consulting for us.';
      else msgEl.textContent = 'Grandmaster of Couch Immobility. Truly awe-inspiring.';
    }
    if (bestEl) bestEl.textContent = `Your Personal Record: ${best.toFixed(1)}s`;
    if (startBtn) {
      startBtn.textContent = 'Try Doing Nothing Again';
      startBtn.style.display = 'inline-flex';
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

  startBtn.onclick = () => {
    sound.play('dun');
    if (msgEl) msgEl.textContent = "DON'T MOVE. No mouse, no scrolling, no keyboard...";
    startBtn.style.display = 'none';

    setTimeout(() => {
      challengeActive = true;
      challengeStartTime = performance.now();
      challengeTick();

      let moves = 0;
      const failEvents = ['pointermove', 'keydown', 'touchstart', 'pointerdown', 'wheel', 'scroll'];
      const onMove = (ev: Event): void => {
        if (ev.type === 'pointermove' && ++moves < 4) return;
        failEvents.forEach((t) => window.removeEventListener(t, onMove, true));
        challengeStop(true);
      };

      failEvents.forEach((t) => window.addEventListener(t, onMove, true));
    }, 600);
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
    let next: number;
    do {
      next = Math.floor(Math.random() * EXCUSES_LIST.length);
    } while (next === lastExcuseIdx);
    lastExcuseIdx = next;

    sound.play('boing');
    if (output) output.textContent = EXCUSES_LIST[next];
  };

  if (copyBtn && output) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(output.textContent || '');
        showToast('Excuse copied! Use with extreme discretion.');
        sound.play('pop');
      } catch {
        showToast('Could not copy.');
      }
    };
  }
}

// ==========================================================================
// Admin Dashboard
// ==========================================================================
let adminUnlocked = false;
let adminTab: 'entries' | 'settings' | 'backup' = 'entries';

function renderAdmin(): void {
  const adminEl = $('#adminDashboard');
  if (!adminEl) return;

  if (!adminUnlocked) {
    adminEl.innerHTML = `
      <div class="panel" style="max-width:440px">
        <h3>Admin Authentication</h3>
        <p class="hint-text">Default passcode: <code>admin123</code></p>
        <label for="adminPass">Passcode</label>
        <input type="password" id="adminPass" placeholder="Enter admin passcode">
        <button class="btn sm" id="adminUnlockBtn" style="margin-top:16px">Unlock Console</button>
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
          showToast('Invalid passcode.');
          sound.play('sad');
        }
      };
    }
    return;
  }

  adminEl.innerHTML = `
    <div class="chips-container" style="margin-bottom:20px">
      <button class="chip ${adminTab === 'entries' ? 'on' : ''}" data-at="entries">Entries Manager (${entries.length})</button>
      <button class="chip ${adminTab === 'settings' ? 'on' : ''}" data-at="settings">SaaS Configuration</button>
      <button class="chip ${adminTab === 'backup' ? 'on' : ''}" data-at="backup">Export / Import JSON</button>
    </div>

    ${
      adminTab === 'entries'
        ? `
        <div class="panel">
          <h3>Record Real Payment / Manual Entry</h3>
          <p class="hint-text">Add cash, direct UPI, or off-platform contributions directly to the board.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label>Name or Startup</label>
              <input id="mName" placeholder="Acme Inc">
            </div>
            <div>
              <label>Amount (USD)</label>
              <input id="mAmt" type="number" step="0.01" value="25">
            </div>
          </div>
          <label>Website URL</label>
          <input id="mUrl" placeholder="https://...">
          <label>Description</label>
          <textarea id="mDesc" placeholder="Supporter note"></textarea>
          <button class="btn sm" id="mSaveBtn" style="margin-top:14px">Add Record</button>
        </div>

        <div style="display:flex;gap:10px;margin:16px 0;flex-wrap:wrap">
          <button class="chip" id="adminExportCsv">Export CSV</button>
          <button class="chip" id="adminResetSample">Reset to Sample Data</button>
          <button class="chip" id="adminClearAll">Clear All Entries</button>
        </div>

        <div id="adminCsvOutput"></div>

        <h3 style="margin:24px 0 12px">Live Database (${entries.length} entries)</h3>
        ${entries
          .map(
            (item) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--card);border:2px solid var(--line);border-radius:var(--radius-sm);margin-bottom:8px">
            <div>
              <b>${AnalyticsService.escapeHtml(item.name)}</b> · ${AnalyticsService.formatMoney(item.amt)} · <span class="hint-text">${new Date(item.t).toLocaleDateString()}</span>
            </div>
            <button class="chip" data-del="${item.id}" style="padding:4px 10px;font-size:12px">Delete</button>
          </div>
        `
          )
          .join('')}
      `
        : adminTab === 'settings'
        ? `
        <div class="panel">
          <h3>SaaS Configuration</h3>
          <label>Live Payment Gateway Link (Stripe Payment Link / LemonSqueezy)</label>
          <input id="cfgPayUrl" value="${AnalyticsService.escapeHtml(config.payUrl)}" placeholder="https://buy.stripe.com/...">
          <label>Tagline</label>
          <input id="cfgTag" value="${AnalyticsService.escapeHtml(config.tagline)}">
          <label>Main Button Text</label>
          <input id="cfgBtn" value="${AnalyticsService.escapeHtml(config.buttonText)}">
          <label>Admin Passcode</label>
          <input id="cfgPass" value="${AnalyticsService.escapeHtml(config.adminPasscode)}">
          <button class="btn sm" id="cfgSaveBtn" style="margin-top:16px">Save Configuration</button>
        </div>
      `
        : `
        <div class="panel">
          <h3>JSON Backup & Migration</h3>
          <label>Export Current State</label>
          <textarea style="min-height:140px;font-family:monospace" readonly>${AnalyticsService.escapeHtml(JSON.stringify({ config, entries }, null, 2))}</textarea>
          <label style="margin-top:16px">Import Backup JSON</label>
          <textarea id="importJsonBox" style="min-height:120px;font-family:monospace" placeholder="Paste exported JSON here"></textarea>
          <button class="btn sm" id="importJsonBtn" style="margin-top:12px">Restore from JSON</button>
        </div>
      `
    }
  `;

  adminEl.querySelectorAll<HTMLElement>('[data-at]').forEach((b) => {
    b.onclick = () => {
      adminTab = (b.getAttribute('data-at') as typeof adminTab) || 'entries';
      renderAdmin();
    };
  });

  if (adminTab === 'entries') {
    const saveBtn = $('#mSaveBtn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const name = ($('#mName') as HTMLInputElement | null)?.value.trim() || '';
        const amt = parseFloat(($('#mAmt') as HTMLInputElement | null)?.value || '0');
        if (!name || isNaN(amt) || amt <= 0) {
          showToast('Please enter a valid name and amount.');
          return;
        }
        const newManual: LeaderboardEntry = {
          id: 'm-' + Date.now(),
          name,
          url: AnalyticsService.safeUrl(($('#mUrl') as HTMLInputElement | null)?.value),
          amt: Math.round(amt * 100) / 100,
          desc: ($('#mDesc') as HTMLTextAreaElement | null)?.value.trim() || '',
          img: '',
          anon: false,
          t: Date.now(),
          src: 'manual'
        };
        entries = StorageService.addEntry(newManual);
        renderAdmin();
        renderLeaderboard();
        showToast('Manual record added!');
      };
    }

    adminEl.querySelectorAll<HTMLElement>('[data-del]').forEach((b) => {
      b.onclick = () => {
        const delId = b.getAttribute('data-del');
        entries = entries.filter((x) => x.id !== delId);
        StorageService.saveEntries(entries);
        renderAdmin();
        renderLeaderboard();
      };
    });

    const exportBtn = $('#adminExportCsv');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const rows = [
          ['ID', 'Name', 'Amount', 'URL', 'Date', 'Source'],
          ...entries.map((x) => [x.id, x.name, x.amt, x.url, new Date(x.t).toISOString(), x.src || ''])
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const csvOut = $('#adminCsvOutput');
        if (csvOut) {
          csvOut.innerHTML = `
            <label style="margin-top:10px">CSV Output</label>
            <textarea style="font-family:monospace;min-height:120px">${AnalyticsService.escapeHtml(csv)}</textarea>
          `;
        }
      };
    }

    const resetBtn = $('#adminResetSample');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('Reset to initial sample entries?')) {
          entries = [...INITIAL_LEADERBOARD];
          StorageService.saveEntries(entries);
          renderAdmin();
          renderLeaderboard();
          showToast('Reset to sample data.');
        }
      };
    }

    const clearBtn = $('#adminClearAll');
    if (clearBtn) {
      clearBtn.onclick = () => {
        if (confirm('Delete all entries permanently?')) {
          entries = [];
          StorageService.saveEntries(entries);
          renderAdmin();
          renderLeaderboard();
          showToast('All entries cleared.');
        }
      };
    }
  } else if (adminTab === 'settings') {
    const cfgSave = $('#cfgSaveBtn');
    if (cfgSave) {
      cfgSave.onclick = () => {
        config.payUrl = ($('#cfgPayUrl') as HTMLInputElement | null)?.value.trim() || '';
        config.tagline = ($('#cfgTag') as HTMLInputElement | null)?.value.trim() || '';
        config.buttonText = ($('#cfgBtn') as HTMLInputElement | null)?.value.trim() || '';
        config.adminPasscode = ($('#cfgPass') as HTMLInputElement | null)?.value.trim() || 'admin123';
        StorageService.saveConfig(config);
        renderApp();
        showToast('Configuration saved!');
      };
    }
  } else if (adminTab === 'backup') {
    const importBtn = $('#importJsonBtn');
    if (importBtn) {
      importBtn.onclick = () => {
        try {
          const val = ($('#importJsonBox') as HTMLTextAreaElement | null)?.value || '';
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
          showToast('Data restored successfully!');
        } catch {
          showToast('Invalid JSON syntax.');
        }
      };
    }
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

function initApp(): void {
  const soundBtn = $('#soundToggleBtn');
  if (soundBtn) {
    soundBtn.onclick = () => {
      const isSoundOn = sound.toggle();
      soundBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${
            isSoundOn
              ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
              : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
          }
        </svg>
        <span>Sound: ${isSoundOn ? 'on' : 'off'}</span>
      `;
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
    if (target?.closest('.btn, .chip, .gateway-card, .board-row, .podium-card, .big-red-btn')) {
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
  window.setInterval(cycleHeroLine, 4000);

  window.setInterval(() => {
    const stats = AnalyticsService.calculateDailyStats(entries, config.targetGoal);
    const rstEl = $('#resetCountdown');
    if (rstEl) rstEl.textContent = stats.resetCountdownFormatted;
  }, 1000);

  route();
}

window.addEventListener('DOMContentLoaded', initApp);
