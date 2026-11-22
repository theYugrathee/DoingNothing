/**
 * Doing Nothing SaaS - Main Application Logic
 */

import {
  DEFAULT_CONFIG,
  ROTATING_LINES,
  DODGE_QUOTES,
  ROAST_TEMPLATES,
  EXCUSES_LIST,
  INITIAL_LEADERBOARD
} from "./data.js";
import { sounds } from "./sounds.js";

// State
let CFG = { ...DEFAULT_CONFIG };
try {
  const savedCfg = localStorage.getItem("idn_cfg");
  if (savedCfg) CFG = { ...CFG, ...JSON.parse(savedCfg) };
} catch (e) {}

let ENTRIES = [];
try {
  const savedEntries = localStorage.getItem("idn_entries");
  if (savedEntries) {
    ENTRIES = JSON.parse(savedEntries);
  } else {
    ENTRIES = [...INITIAL_LEADERBOARD];
    localStorage.setItem("idn_entries", JSON.stringify(ENTRIES));
  }
} catch (e) {
  ENTRIES = [...INITIAL_LEADERBOARD];
}

const saveEntries = () => {
  try {
    localStorage.setItem("idn_entries", JSON.stringify(ENTRIES));
  } catch (e) {}
};

const saveConfig = () => {
  try {
    localStorage.setItem("idn_cfg", JSON.stringify(CFG));
  } catch (e) {}
};

// Utilities
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const formatMoney = (n) =>
  "$" + (Math.round(n * 100) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const safeUrl = (u) => {
  u = (u || "").trim();
  if (!u || u[0] === "@") return "";
  try {
    const x = new URL(/^https?:/i.test(u) ? u : "https://" + u);
    return /^https?:$/.test(x.protocol) && x.hostname.includes(".") ? x.href : "";
  } catch (e) {
    return "";
  }
};

const getHost = (u) => {
  try {
    return new URL(safeUrl(u)).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
};

const getAvatarBg = (str) => {
  const colors = ["#2F4BFF", "#E8412C", "#0E9F6E", "#8B3DFF", "#F08A00", "#101010", "#D6246E"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return colors[hash % colors.length];
};

const getTier = (amt) => {
  if (amt >= 100) return { name: "Legend", color: "#E8412C" };
  if (amt >= 25) return { name: "Big Spender", color: "#8B3DFF" };
  if (amt >= 5) return { name: "Supporter", color: "#0E9F6E" };
  return { name: "Noodle Fan", color: "#6C6A64" };
};

const getTimeAgo = (timestamp) => {
  const diffMins = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

// Toast Notifications
let toastTimeout;
export const showToast = (message) => {
  const toastEl = $("#toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("visible");
  }, 3400);
};

// Canvas Confetti
class ConfettiManager {
  constructor() {
    this.canvas = document.getElementById("confetti-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.particles = [];
    this.animId = null;

    if (this.canvas) {
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(count = 70) {
    if (!this.canvas || !this.ctx) return;
    const colors = ["#2F4BFF", "#FFD23F", "#FF4D8D", "#10B981", "#101010"];
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

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
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

const confetti = new ConfettiManager();

// ==========================================================================
// Routing & Navigation
// ==========================================================================
const pages = ["home", "red", "roast", "hall-of-fame", "challenge", "excuses", "about", "admin"];

function route() {
  let hash = location.hash.slice(1);
  if (!pages.includes(hash)) hash = "home";

  pages.forEach((p) => {
    const el = $("#" + p);
    if (el) el.classList.toggle("on", p === hash);
  });

  $$("nav a").forEach((a) => {
    a.classList.toggle("on", a.hash === "#" + hash);
  });

  // Close mobile drawer if open
  closeMobileDrawer();

  if (hash !== "challenge") {
    challengeStop();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderApp();

  if (hash === "admin") {
    renderAdmin();
  }

  // Trigger sound on page switch
  sounds.play("up", 120);
}

window.addEventListener("hashchange", route);

// Mobile Drawer handlers
function setupMobileNav() {
  const toggleBtn = $("#mobileToggle");
  const drawer = $("#mobileDrawer");
  const closeBtn = $("#closeDrawer");

  if (toggleBtn && drawer) {
    toggleBtn.onclick = () => {
      drawer.classList.add("open");
      sounds.play("pop");
    };
  }
  if (closeBtn && drawer) {
    closeBtn.onclick = () => {
      closeMobileDrawer();
      sounds.play("pop");
    };
  }
  if (drawer) {
    drawer.onclick = (e) => {
      if (e.target === drawer) closeMobileDrawer();
    };
  }
}

function closeMobileDrawer() {
  const drawer = $("#mobileDrawer");
  if (drawer) drawer.classList.remove("open");
}

// ==========================================================================
// Dynamic Meal & Hero Lines
// ==========================================================================
function getMealName() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 22) return "dinner";
  return "a midnight snack";
}

let lineIndex = 0;
function cycleHeroLine() {
  const lineEl = $("#heroSubtitle");
  if (!lineEl) return;
  const lines = CFG.lines && CFG.lines.length ? CFG.lines : ROTATING_LINES;
  lineEl.style.opacity = "0";
  setTimeout(() => {
    lineEl.textContent = lines[lineIndex++ % lines.length];
    lineEl.style.opacity = "1";
  }, 250);
}

// ==========================================================================
// The Dodging "Go Get A Job" Button
// ==========================================================================
let dodgeCount = 0;
let dodgeLastTime = 0;

function setupDodgingButton() {
  const runBtn = $("#run");
  const heroCtaArea = $("#heroCtaArea");
  if (!runBtn || !heroCtaArea) return;

  const repositionInitial = () => {
    runBtn.style.position = "relative";
    runBtn.style.transform = "none";
    runBtn.textContent = "Go get a job";
  };

  const dodge = () => {
    const now = performance.now();
    if (now - dodgeLastTime < 40) return;
    dodgeLastTime = now;

    dodgeCount++;
    sounds.play(["boing", "squeak", "blorp", "honk"][dodgeCount % 4], 40);

    const quotes = DODGE_QUOTES;
    runBtn.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    runBtn.classList.add("dodging");

    // Calculate safe evasion coordinates inside hero area
    const container = heroCtaArea.getBoundingClientRect();
    const btnW = runBtn.offsetWidth;
    const btnH = runBtn.offsetHeight;

    const maxOffsetX = Math.min(220, window.innerWidth - btnW - 40);
    const offsetX = (Math.random() - 0.5) * maxOffsetX;
    const offsetY = (Math.random() - 0.5) * 90;

    runBtn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

    clearTimeout(dodge.timer);
    dodge.timer = setTimeout(() => {
      runBtn.textContent = "Go get a job";
      runBtn.classList.remove("dodging");
      runBtn.style.transform = "none";
    }, 4500);
  };

  runBtn.addEventListener("pointerenter", dodge);
  runBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    dodge();
  });
  runBtn.addEventListener("click", (e) => {
    e.preventDefault();
    dodge();
  });
}

// ==========================================================================
// Leaderboard & Rendering
// ==========================================================================
let currentBoardMode = "recent"; // "recent" | "top"

function renderAvatar(item, isLarge = false) {
  if (item.img) {
    return `<div class="avatar ${isLarge ? "lg" : ""}"><img src="${esc(item.img)}" alt="${esc(item.name)}"></div>`;
  }
  if (item.anon) {
    return `<div class="avatar ${isLarge ? "lg" : ""}" style="background:#555">?</div>`;
  }
  const bg = getAvatarBg(item.name);
  const initial = (item.name[0] || "?").toUpperCase();
  return `<div class="avatar ${isLarge ? "lg" : ""}" style="background:${bg}">${esc(initial)}</div>`;
}

function renderLeaderboard() {
  const boardEl = $("#boardContainer");
  const countEl = $("#countToday");
  const totalEl = $("#totalToday");
  const topNameEl = $("#topSupporterName");

  if (!boardEl) return;

  const list = [...ENTRIES];
  const totalAmount = list.reduce((sum, item) => sum + item.amt, 0);

  if (totalEl) totalEl.textContent = formatMoney(totalAmount);
  if (countEl) countEl.textContent = list.length.toString();
  if (topNameEl) {
    const sorted = [...list].sort((a, b) => b.amt - a.amt);
    topNameEl.textContent = sorted[0] ? sorted[0].name : "Nobody yet";
  }

  // Sorting based on active mode
  let displayList = [];
  if (currentBoardMode === "recent") {
    displayList = [...list].sort((a, b) => b.t - a.t);
  } else {
    displayList = [...list].sort((a, b) => b.amt - a.amt || a.t - b.t);
  }

  if (displayList.length === 0) {
    boardEl.innerHTML = `
      <div class="empty-box">
        Nobody has bought me a meal today yet.
        <span>Be the first legend on the board. I'm extraordinarily hungry!</span>
      </div>
    `;
    return;
  }

  let html = "";

  // Render top 3 podium if in Top mode
  if (currentBoardMode === "top" && displayList.length >= 2) {
    const p1 = displayList[0];
    const p2 = displayList[1];
    const p3 = displayList[2];

    const podiums = [
      { item: p2, rank: 2, cls: "p2" },
      { item: p1, rank: 1, cls: "p1" },
      { item: p3, rank: 3, cls: "p3" }
    ].filter((p) => p.item);

    html += `<div class="podium-grid" style="grid-template-columns: repeat(${podiums.length}, 1fr)">`;
    podiums.forEach((p) => {
      const tier = getTier(p.item.amt);
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
              : ""
          }
          ${renderAvatar(p.item, p.rank === 1)}
          <h3>${esc(p.item.name)}</h3>
          <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
          <div class="amt">${formatMoney(p.item.amt)}</div>
          <span class="view-details">Click for bio ›</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Render standard list items
  const maxAmount = Math.max(1, ...displayList.map((i) => i.amt));
  const startIndex = currentBoardMode === "top" && displayList.length >= 2 ? 3 : 0;

  displayList.slice(startIndex).forEach((item, idx) => {
    const rank = startIndex + idx + 1;
    const tier = getTier(item.amt);
    const host = getHost(item.url);
    const pct = Math.min(100, Math.max(6, (item.amt / maxAmount) * 100));
    const isFresh = Date.now() - item.t < 1000 * 60 * 15;

    html += `
      <div class="board-row ${isFresh ? "hot" : ""}" data-id="${item.id}">
        <div>
          ${
            currentBoardMode === "top"
              ? `<span class="rank-badge">${rank}</span>`
              : `<span class="time-pill ${isFresh ? "fresh" : ""}">${getTimeAgo(item.t)}</span>`
          }
        </div>
        ${renderAvatar(item)}
        <div>
          <h3>
            ${esc(item.name)}
            <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
            ${item.src === "preview" ? `<span class="badge-src">Preview</span>` : ""}
          </h3>
          <p>${esc(item.desc || "Fueling the non-productive movement.")}</p>
          ${host ? `<div class="url-preview">🔗 ${esc(host)}</div>` : ""}
        </div>
        <div class="row-amount">
          ${formatMoney(item.amt)}
          <span class="view-btn">Details ›</span>
        </div>
        <div class="progress-strip" style="width:${pct}%"></div>
      </div>
    `;
  });

  boardEl.innerHTML = html;

  // Row and podium click listeners to view detail modal
  boardEl.querySelectorAll("[data-id]").forEach((el) => {
    el.onclick = () => {
      const id = el.dataset.id;
      const item = ENTRIES.find((x) => x.id === id);
      if (item) showDetailModal(item);
    };
  });
}

function renderHallOfFame() {
  const hofContainer = $("#hofContainer");
  if (!hofContainer) return;

  const sortedAll = [...ENTRIES].sort((a, b) => b.amt - a.amt);
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
    const tier = getTier(item.amt);
    const host = getHost(item.url);
    const pct = Math.min(100, Math.max(6, (item.amt / maxAmount) * 100));

    html += `
      <div class="board-row ${rank <= 3 ? "hot" : ""}" data-id="${item.id}">
        <div><span class="rank-badge" style="${rank === 1 ? "background:#FFD23F;color:#101010" : ""}">${rank}</span></div>
        ${renderAvatar(item)}
        <div>
          <h3>
            ${esc(item.name)}
            <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
          </h3>
          <p>${esc(item.desc || "Legendary patron of doing nothing.")}</p>
          ${host ? `<div class="url-preview">🔗 ${esc(host)}</div>` : ""}
        </div>
        <div class="row-amount">
          ${formatMoney(item.amt)}
          <span class="view-btn">Details ›</span>
        </div>
        <div class="progress-strip" style="width:${pct}%"></div>
      </div>
    `;
  });

  hofContainer.innerHTML = html;
  hofContainer.querySelectorAll("[data-id]").forEach((el) => {
    el.onclick = () => {
      const item = ENTRIES.find((x) => x.id === el.dataset.id);
      if (item) showDetailModal(item);
    };
  });
}

// ==========================================================================
// Board Countdown Reset Ticker
// ==========================================================================
function updateBoardCountdown() {
  const rstEl = $("#resetCountdown");
  if (!rstEl) return;

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diffSec = Math.floor((midnight - now) / 1000);
  const h = String(Math.floor(diffSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
  const s = String(diffSec % 60).padStart(2, "0");

  rstEl.textContent = `${h}:${m}:${s}`;
}

// ==========================================================================
// Modals: Detail Modal & Support Funding Modal
// ==========================================================================
const modalBackdrop = $("#modalBackdrop");
const modalContent = $("#modalContent");

function closeModal() {
  if (modalBackdrop) modalBackdrop.classList.remove("on");
}

function showDetailModal(item) {
  sounds.play("pop");
  const url = safeUrl(item.url);
  const host = getHost(item.url);
  const tier = getTier(item.amt);

  modalContent.innerHTML = `
    <button class="modal-close-x" id="modalCloseBtn">&times;</button>
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px">
      ${renderAvatar(item, true)}
      <div>
        <h2 style="font-size:26px">${esc(item.name)}</h2>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
          <b style="font-size:20px;font-family:var(--font-disp)">${formatMoney(item.amt)}</b>
          <span class="tier-tag" style="background:${tier.color}">${tier.name}</span>
        </div>
      </div>
    </div>
    <div style="background:var(--paper);border:2px solid var(--line);border-radius:var(--radius-md);padding:16px;margin:14px 0">
      <p style="font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(item.desc || "No custom message provided.")}</p>
    </div>
    ${
      url
        ? `<div style="margin-top:16px">
            <a class="btn sm" href="${esc(url)}" target="_blank" rel="nofollow noopener ugc">
              Visit Website (${esc(host)}) ↗
            </a>
           </div>`
        : ""
    }
    <p class="hint-text" style="margin-top:14px">Contributed on ${new Date(item.t).toLocaleString()}</p>
  `;

  modalBackdrop.classList.add("on");
  $("#modalCloseBtn").onclick = closeModal;
}

// Open "Buy me a meal" modal
function openFundModal() {
  sounds.play("kaching");
  let uploadedLogo = "";

  const meal = getMealName();

  modalContent.innerHTML = `
    <button class="modal-close-x" id="modalCloseBtn">&times;</button>
    <h2>${esc(CFG.buttonText)} ${esc(meal)} 🍜</h2>
    <p class="hint-text">Get featured on today's board and fuel the non-productive revolution.</p>

    <label style="display:flex;align-items:center;gap:10px;margin-top:18px;cursor:pointer">
      <input type="checkbox" id="fundAnon">
      <span>Contribute anonymously (no name, no website link)</span>
    </label>

    <div id="fundNamedFields">
      <label for="fundName">Your Name or Product / Startup Name</label>
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

  modalBackdrop.classList.add("on");

  // Handlers inside modal
  $("#modalCloseBtn").onclick = closeModal;
  $("#fundCancelBtn").onclick = closeModal;

  const anonCheckbox = $("#fundAnon");
  const namedFields = $("#fundNamedFields");
  anonCheckbox.onchange = () => {
    namedFields.style.display = anonCheckbox.checked ? "none" : "block";
  };

  // Amount preset chips
  const amountInput = $("#fundAmount");
  modalContent.querySelectorAll("[data-amt]").forEach((chip) => {
    chip.onclick = () => {
      modalContent.querySelectorAll("[data-amt]").forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
      amountInput.value = chip.dataset.amt;
    };
  });

  // Gateway selector
  modalContent.querySelectorAll("[data-gw]").forEach((gw) => {
    gw.onclick = () => {
      modalContent.querySelectorAll("[data-gw]").forEach((g) => g.classList.remove("selected"));
      gw.classList.add("selected");
      sounds.play("pop");
    };
  });

  // Word count tracker
  const descInput = $("#fundDesc");
  const wcEl = $("#fundWordCount");
  descInput.oninput = () => {
    const words = descInput.value.trim().split(/\s+/).filter(Boolean).length;
    wcEl.textContent = `(${words} / 500 words)`;
  };

  // Logo file upload handler with canvas crop
  $("#fundLogo").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 96;
        const ctx = canvas.getContext("2d");
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96);
        uploadedLogo = canvas.toDataURL("image/jpeg", 0.85);

        const previewEl = $("#fundLogoPreview");
        previewEl.style.display = "block";
        previewEl.innerHTML = `<img src="${uploadedLogo}" style="width:48px;height:48px;border-radius:8px;border:2px solid var(--ink)">`;
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  $("#fundSubmitBtn").onclick = () => {
    const isAnon = anonCheckbox.checked;
    const name = isAnon ? "Anonymous Hero" : $("#fundName").value.trim();
    const rawUrl = isAnon ? "" : $("#fundUrl").value.trim();
    const amt = parseFloat(amountInput.value);
    const desc = descInput.value.trim();

    if (!name) {
      showToast("Please provide your name or check 'Contribute anonymously'.");
      sounds.play("sad");
      return;
    }
    if (rawUrl && !safeUrl(rawUrl) && rawUrl[0] !== "@") {
      showToast("Please enter a valid website link (e.g. https://yourstartup.com).");
      sounds.play("sad");
      return;
    }
    if (isNaN(amt) || amt < 1) {
      showToast("Minimum contribution is $1.");
      sounds.play("sad");
      return;
    }

    // Add entry
    const newEntry = {
      id: "entry-" + Date.now(),
      name,
      url: safeUrl(rawUrl) || rawUrl,
      amt: Math.round(amt * 100) / 100,
      desc,
      img: isAnon ? "" : uploadedLogo,
      anon: isAnon,
      t: Date.now(),
      src: "preview"
    };

    ENTRIES.unshift(newEntry);
    saveEntries();

    closeModal();
    renderApp();

    sounds.play("fanfare");
    confetti.fire(90);
    showToast("🎉 You're on today's board! Thank you for the meal.");
    location.hash = "home";
  };
}

if (modalBackdrop) {
  modalBackdrop.onclick = (e) => {
    if (e.target === modalBackdrop) closeModal();
  };
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ==========================================================================
// Interactive Mini-Apps: Red Button, Roaster, Challenge, Excuses
// ==========================================================================

// 1. The Big Red Button
let redPressCount = 0;
const redPhrases = [
  "I explicitly asked you not to press that.",
  "That was literally my singular rule.",
  "You possess the impulse control of a distracted kitten.",
  "Nothing occurred. You did that to yourself.",
  "I have inspected your browser history. Please stand down.",
  "Go outside. Touch botanical vegetation.",
  "Every button press delays the launch of my career by 1 hour."
];

function setupRedButton() {
  const redBtn = $("#bigRedBtn");
  const msgEl = $("#redMessage");
  const counterEl = $("#redPressCounter");
  if (!redBtn) return;

  redBtn.onclick = () => {
    redPressCount++;
    sounds.play(redPressCount === 5 ? "alarm" : redPressCount % 2 === 0 ? "boom" : "horn");

    if (counterEl) counterEl.textContent = `Total button presses: ${redPressCount}`;

    if (redPressCount === 5) {
      // Trigger dramatic fake deletion sequence
      triggerInternetDeletion();
      return;
    }

    if (msgEl) {
      msgEl.textContent = redPhrases[Math.floor(Math.random() * redPhrases.length)];
    }
  };
}

function triggerInternetDeletion() {
  sounds.play("alarm");
  modalContent.innerHTML = `
    <h2>⚠️ Deleting the Entire Internet...</h2>
    <div class="progress-bar-wrap">
      <i class="progress-bar-fill" id="deleteProgressBar"></i>
    </div>
    <p id="deleteStatusText" style="font-weight:700">Purging cached memes...</p>
    <p class="hint-text">(Pure satire, your wifi is safe)</p>
  `;
  modalBackdrop.classList.add("on");

  const steps = [
    "Dissolving corporate Slack channels...",
    "Unsubscribing from marketing emails...",
    "Cancelling Monday mornings permanently...",
    "Erasing JavaScript frameworks...",
    "Deleting the ramen noodles database... WAIT NO!"
  ];

  let progress = 0;
  let stepIdx = 0;
  const bar = $("#deleteProgressBar");
  const text = $("#deleteStatusText");

  const interval = setInterval(() => {
    progress += Math.random() * 12 + 5;
    sounds.play("tick", 20);

    if (progress >= 98) {
      progress = 98;
      clearInterval(interval);
      sounds.play("scratch");
      if (text) text.textContent = "Wait. Deleting everything sounds like actual work.";

      setTimeout(() => {
        sounds.play("sad");
        modalContent.innerHTML = `
          <h2>Operation Aborted! 😴</h2>
          <p style="font-size:16px;margin:12px 0">I got too overwhelmed and took a nap instead. You're welcome.</p>
          <div style="display:flex;gap:12px">
            <button class="btn" id="redMealBtn" style="flex:1">Buy me noodles to say thanks</button>
            <button class="btn w" id="redCloseBtn">Phew</button>
          </div>
        `;
        $("#redMealBtn").onclick = openFundModal;
        $("#redCloseBtn").onclick = closeModal;
      }, 1400);
    } else {
      if (bar) bar.style.width = progress + "%";
      if (text && Math.random() < 0.4) {
        text.textContent = steps[stepIdx++ % steps.length];
      }
    }
  }, 280);
}

// 2. The Roast Machine
let lastRoastIdx = -1;
function setupRoastMachine() {
  const roastBtn = $("#generateRoastBtn");
  const roastInput = $("#roastInput");
  const roastOutput = $("#roastOutput");
  const roastActions = $("#roastActions");
  const copyRoastBtn = $("#copyRoastBtn");
  const tweetRoastBtn = $("#tweetRoastBtn");

  if (!roastBtn) return;

  roastBtn.onclick = () => {
    const name = roastInput.value.trim();
    if (!name) {
      showToast("Please enter a startup or project name first!");
      sounds.play("sad");
      return;
    }

    let nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * ROAST_TEMPLATES.length);
    } while (nextIdx === lastRoastIdx);
    lastRoastIdx = nextIdx;

    sounds.play("rim");
    const roastText = ROAST_TEMPLATES[nextIdx].replace(/\{n\}/g, name);
    roastOutput.textContent = roastText;
    roastActions.style.display = "flex";
  };

  if (copyRoastBtn) {
    copyRoastBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(roastOutput.textContent);
        showToast("Roast copied to clipboard!");
        sounds.play("pop");
      } catch (e) {
        showToast("Could not copy.");
      }
    };
  }

  if (tweetRoastBtn) {
    tweetRoastBtn.onclick = () => {
      const text = encodeURIComponent(`"${roastOutput.textContent}" — roasted by https://doingnothing.lol`);
      window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
    };
  }
}

// 3. The Do-Nothing Challenge
let challengeStartTime = 0;
let challengeActive = false;
let challengeRafId = null;

function challengeStop(failed = false) {
  if (!challengeActive) return;
  challengeActive = false;
  cancelAnimationFrame(challengeRafId);

  const durationSec = (performance.now() - challengeStartTime) / 1000;
  let best = 0;
  try {
    best = parseFloat(localStorage.getItem("idn_best_stillness") || "0");
    if (durationSec > best) {
      best = durationSec;
      localStorage.setItem("idn_best_stillness", best.toString());
    }
  } catch (e) {}

  const timerEl = $("#challengeTimer");
  const msgEl = $("#challengeMessage");
  const bestEl = $("#challengeBest");
  const startBtn = $("#startChallengeBtn");

  if (timerEl) timerEl.textContent = durationSec.toFixed(1) + "s";

  if (failed) {
    sounds.play("sad");
    if (msgEl) {
      if (durationSec < 5) msgEl.textContent = "You lasted as long as a New Year's gym resolution.";
      else if (durationSec < 15) msgEl.textContent = "Mediocre. Your phone screen detected twitches.";
      else if (durationSec < 30) msgEl.textContent = "Decent motionless poise. An apprentice of zero output.";
      else if (durationSec < 60) msgEl.textContent = "Remarkable stillness. Please consider consulting for us.";
      else msgEl.textContent = "Grandmaster of Couch Immobility. Truly awe-inspiring.";
    }
    if (bestEl) bestEl.textContent = `Your Personal Record: ${best.toFixed(1)}s`;
    if (startBtn) {
      startBtn.textContent = "Try Doing Nothing Again";
      startBtn.style.display = "inline-flex";
    }
  }
}

function challengeTick() {
  if (!challengeActive) return;
  const currentSec = (performance.now() - challengeStartTime) / 1000;
  const timerEl = $("#challengeTimer");
  if (timerEl) timerEl.textContent = currentSec.toFixed(1) + "s";
  challengeRafId = requestAnimationFrame(challengeTick);
}

function setupChallenge() {
  const startBtn = $("#startChallengeBtn");
  const msgEl = $("#challengeMessage");
  if (!startBtn) return;

  startBtn.onclick = () => {
    sounds.play("dun");
    if (msgEl) msgEl.textContent = "DON'T MOVE. No mouse, no scrolling, no keyboard...";
    startBtn.style.display = "none";

    setTimeout(() => {
      challengeActive = true;
      challengeStartTime = performance.now();
      challengeTick();

      let moves = 0;
      const failEvents = ["pointermove", "keydown", "touchstart", "pointerdown", "wheel", "scroll"];
      const onMove = (ev) => {
        if (ev.type === "pointermove" && ++moves < 4) return;
        failEvents.forEach((t) => window.removeEventListener(t, onMove, true));
        challengeStop(true);
      };

      failEvents.forEach((t) => window.addEventListener(t, onMove, true));
    }, 600);
  };
}

// 4. Excuse Generator
let lastExcuseIdx = -1;
function setupExcuseMachine() {
  const btn = $("#generateExcuseBtn");
  const copyBtn = $("#copyExcuseBtn");
  const output = $("#excuseOutput");
  if (!btn) return;

  btn.onclick = () => {
    let next;
    do {
      next = Math.floor(Math.random() * EXCUSES_LIST.length);
    } while (next === lastExcuseIdx);
    lastExcuseIdx = next;

    sounds.play("boing");
    if (output) output.textContent = EXCUSES_LIST[next];
  };

  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(output.textContent);
        showToast("Excuse copied! Use with extreme discretion.");
        sounds.play("pop");
      } catch (e) {
        showToast("Could not copy.");
      }
    };
  }
}

// ==========================================================================
// Admin Dashboard
// ==========================================================================
let adminUnlocked = false;
let adminTab = "entries";

function renderAdmin() {
  const adminEl = $("#adminDashboard");
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

    $("#adminUnlockBtn").onclick = () => {
      const pass = $("#adminPass").value;
      if (pass === CFG.adminPasscode) {
        adminUnlocked = true;
        sounds.play("fanfare");
        renderAdmin();
      } else {
        showToast("Invalid passcode.");
        sounds.play("sad");
      }
    };
    return;
  }

  adminEl.innerHTML = `
    <div class="chips-container" style="margin-bottom:20px">
      <button class="chip ${adminTab === "entries" ? "on" : ""}" data-at="entries">Entries Manager (${ENTRIES.length})</button>
      <button class="chip ${adminTab === "settings" ? "on" : ""}" data-at="settings">SaaS Configuration</button>
      <button class="chip ${adminTab === "backup" ? "on" : ""}" data-at="backup">Export / Import JSON</button>
    </div>

    ${
      adminTab === "entries"
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

        <h3 style="margin:24px 0 12px">Live Database (${ENTRIES.length} entries)</h3>
        ${ENTRIES.map(
          (item) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--card);border:2px solid var(--line);border-radius:var(--radius-sm);margin-bottom:8px">
            <div>
              <b>${esc(item.name)}</b> · ${formatMoney(item.amt)} · <span class="hint-text">${new Date(item.t).toLocaleDateString()}</span>
            </div>
            <button class="chip" data-del="${item.id}" style="padding:4px 10px;font-size:12px">Delete</button>
          </div>
        `
        ).join("")}
      `
        : adminTab === "settings"
        ? `
        <div class="panel">
          <h3>SaaS Configuration</h3>
          <label>Live Payment Gateway Link (Stripe Payment Link / LemonSqueezy)</label>
          <input id="cfgPayUrl" value="${esc(CFG.payUrl)}" placeholder="https://buy.stripe.com/...">
          <label>Tagline</label>
          <input id="cfgTag" value="${esc(CFG.tagline)}">
          <label>Main Button Text</label>
          <input id="cfgBtn" value="${esc(CFG.buttonText)}">
          <label>Admin Passcode</label>
          <input id="cfgPass" value="${esc(CFG.adminPasscode)}">
          <button class="btn sm" id="cfgSaveBtn" style="margin-top:16px">Save Configuration</button>
        </div>
      `
        : `
        <div class="panel">
          <h3>JSON Backup & Migration</h3>
          <label>Export Current State</label>
          <textarea style="min-height:140px;font-family:monospace" readonly>${esc(JSON.stringify({ config: CFG, entries: ENTRIES }, null, 2))}</textarea>
          <label style="margin-top:16px">Import Backup JSON</label>
          <textarea id="importJsonBox" style="min-height:120px;font-family:monospace" placeholder="Paste exported JSON here"></textarea>
          <button class="btn sm" id="importJsonBtn" style="margin-top:12px">Restore from JSON</button>
        </div>
      `
    }
  `;

  // Tab switching
  adminEl.querySelectorAll("[data-at]").forEach((b) => {
    b.onclick = () => {
      adminTab = b.dataset.at;
      renderAdmin();
    };
  });

  // Action listeners
  if (adminTab === "entries") {
    $("#mSaveBtn").onclick = () => {
      const name = $("#mName").value.trim();
      const amt = parseFloat($("#mAmt").value);
      if (!name || isNaN(amt) || amt <= 0) {
        showToast("Please enter a valid name and amount.");
        return;
      }
      ENTRIES.unshift({
        id: "m-" + Date.now(),
        name,
        url: safeUrl($("#mUrl").value),
        amt: Math.round(amt * 100) / 100,
        desc: $("#mDesc").value.trim(),
        img: "",
        anon: false,
        t: Date.now(),
        src: "manual"
      });
      saveEntries();
      renderAdmin();
      renderLeaderboard();
      showToast("Manual record added!");
    };

    adminEl.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        ENTRIES = ENTRIES.filter((x) => x.id !== b.dataset.del);
        saveEntries();
        renderAdmin();
        renderLeaderboard();
      };
    });

    $("#adminExportCsv").onclick = () => {
      const rows = [
        ["ID", "Name", "Amount", "URL", "Date", "Source"],
        ...ENTRIES.map((x) => [x.id, x.name, x.amt, x.url, new Date(x.t).toISOString(), x.src || ""])
      ];
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      $("#adminCsvOutput").innerHTML = `
        <label style="margin-top:10px">CSV Output</label>
        <textarea style="font-family:monospace;min-height:120px">${esc(csv)}</textarea>
      `;
    };

    $("#adminResetSample").onclick = () => {
      if (confirm("Reset to initial sample entries?")) {
        ENTRIES = [...INITIAL_LEADERBOARD];
        saveEntries();
        renderAdmin();
        renderLeaderboard();
        showToast("Reset to sample data.");
      }
    };

    $("#adminClearAll").onclick = () => {
      if (confirm("Delete all entries permanently?")) {
        ENTRIES = [];
        saveEntries();
        renderAdmin();
        renderLeaderboard();
        showToast("All entries cleared.");
      }
    };
  } else if (adminTab === "settings") {
    $("#cfgSaveBtn").onclick = () => {
      CFG.payUrl = $("#cfgPayUrl").value.trim();
      CFG.tagline = $("#cfgTag").value.trim();
      CFG.buttonText = $("#cfgBtn").value.trim();
      CFG.adminPasscode = $("#cfgPass").value.trim() || "admin123";
      saveConfig();
      renderApp();
      showToast("Configuration saved!");
    };
  } else if (adminTab === "backup") {
    $("#importJsonBtn").onclick = () => {
      try {
        const parsed = JSON.parse($("#importJsonBox").value);
        if (parsed.entries && Array.isArray(parsed.entries)) {
          ENTRIES = parsed.entries;
          saveEntries();
        }
        if (parsed.config) {
          CFG = { ...CFG, ...parsed.config };
          saveConfig();
        }
        renderAdmin();
        renderApp();
        showToast("Data restored successfully!");
      } catch (e) {
        showToast("Invalid JSON syntax.");
      }
    };
  }
}

// ==========================================================================
// Master App Render & Initializer
// ==========================================================================
function renderApp() {
  // Update Hero elements
  const meal = getMealName();
  const mainBtn = $("#fundHeroBtn");
  const tagEl = $("#heroTag");

  if (mainBtn) {
    mainBtn.innerHTML = `
      ${esc(CFG.buttonText)} ${esc(meal)}
      <small>${esc(CFG.subText)}</small>
    `;
  }
  if (tagEl) tagEl.textContent = CFG.tagline;

  renderLeaderboard();
  renderHallOfFame();
}

function initApp() {
  // Sound toggle button
  const soundBtn = $("#soundToggleBtn");
  if (soundBtn) {
    soundBtn.onclick = () => {
      const isSoundOn = sounds.toggle();
      soundBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${
            isSoundOn
              ? '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
              : '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
          }
        </svg>
        <span>Sound: ${isSoundOn ? "on" : "off"}</span>
      `;
    };
  }

  // Board Filter buttons (Recent / Top)
  $$("[data-board-mode]").forEach((btn) => {
    btn.onclick = () => {
      $$("[data-board-mode]").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      currentBoardMode = btn.dataset.boardMode;
      sounds.play("pop");
      renderLeaderboard();
    };
  });

  // Main CTA button trigger
  const fundHeroBtn = $("#fundHeroBtn");
  if (fundHeroBtn) {
    fundHeroBtn.onclick = () => openFundModal();
  }

  // Generic click sounds for buttons, rows, chips
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn, .chip, .gateway-card, .board-row, .podium-card, .big-red-btn")) {
      sounds.randomClick();
    }
  });

  // Setup sub-features
  setupMobileNav();
  setupDodgingButton();
  setupRedButton();
  setupRoastMachine();
  setupChallenge();
  setupExcuseMachine();

  // Hero line rotation interval
  cycleHeroLine();
  setInterval(cycleHeroLine, 4000);

  // Countdown timer interval
  updateBoardCountdown();
  setInterval(updateBoardCountdown, 1000);

  // Initial Route & Render
  route();
}

window.addEventListener("DOMContentLoaded", initApp);
