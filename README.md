# Doing Nothing: A Full-Time Career 🛋️🚀

> **"I do nothing for a living. Buy me a meal and feature your startup, profile, or link on today's board."**

A modern, viral, neo-brutalist micro-SaaS web application built with **TypeScript**, **Vite**, and **Modern CSS**. Features interactive gamification, live daily leaderboards, procedural sound synthesis, and full mobile-first responsiveness.

---

## 🌟 Key Features

1. **Live Daily Leaderboard & Metrics:**
   - Real-time ticker: **Collected Today**, **Feeders Today**, **Top Patron**, and **Board Reset Countdown**.
   - Dual view filters: `⚡ Recent Today` and `🔥 Top Patrons`.
   - Dynamic 1st, 2nd, and 3rd place podium with gold crown, silver, and bronze medals.
   - Supporter detail cards with clickable website links, social handles, and contribution badges (`Legend`, `Big Spender`, `Supporter`, `Noodle Fan`).

2. **Interactive Support / Funding Flow:**
   - One-click contribution presets ($5, $10, $25, $50, $100) + custom amount input.
   - Dynamic meal calculation based on time of day (Breakfast, Lunch, Dinner, Midnight snack).
   - Anonymous support toggle.
   - Brand logo / avatar upload with client-side canvas square-crop and preview.
   - Pitch / message input with 500-word limit counter.
   - Multi-gateway selector (Stripe Card, UPI/Razorpay, PayPal, Crypto simulation).
   - Celebratory Web Audio fanfares and real-time confetti cannon.

3. **The Dodging "Go Get A Job" Button:**
   - Tactile button with intelligent viewport boundary collision avoidance.
   - Evasive micro-animations and 25+ humorous randomized rebuttals.

4. **Viral Mini-Apps & Gamification:**
   - **🚨 Don’t Press The Big Red Button:** Escalating comedic warnings, tactile push feedback, and a satirical "Deleting the Entire Internet..." progress bar sequence.
   - **🔥 The Startup & Founder Roaster:** Generates witty, unvarnished roasts for any startup name with 1-click clipboard copy and Twitter/X sharing.
   - **⏱️ The Do-Nothing Challenge:** High-precision stillness timer measuring uninterrupted immobility. Fails upon any mouse move, touch, key press, or scroll. Saves personal bests locally.
   - **💬 The Excuse Machine:** One-click generator for creative productivity delay rationales.

5. **Built-in Procedural Audio Synthesizer:**
   - Custom Web Audio API procedural sound engine with 15+ retro sound effects (`pop`, `bonk`, `boing`, `kaching`, `horn`, `fanfare`, `alarm`, `boom`, `scratch`).
   - Zero external MP3/WAV dependencies; loads instantly offline.
   - Sound toggle button with interactive SVG wave status.

6. **Admin Management Console:**
   - Passcode protection (default: `admin123`).
   - Record manual offline payments (cash, direct UPI, bank transfer).
   - Export contributions to CSV.
   - Backup & restore state via JSON.

---

## 🏗️ Architecture & TypeScript Structure

The project is built on **TypeScript (Strict Mode)** and bundled with **Vite** for sub-millisecond HMR and optimized production treeshaking:

```
├── .github/workflows/ci.yml # Automated CI & GitHub Pages deploy workflow
├── src/
│   ├── types/
│   │   └── index.ts        # Strongly typed data contracts (Patrons, Gateways, Stats)
│   ├── services/
│   │   ├── analytics.ts    # Stats computation, currency & time formatting
│   │   ├── payments.ts     # Pluggable Stripe / Razorpay gateway driver
│   │   ├── sound.ts        # Typed Web Audio API sound synthesizer
│   │   └── storage.ts      # Validated localStorage & schema migration
│   ├── data/
│   │   └── defaults.ts     # Typed quotes, roasts, excuses, and seed data
│   ├── main.ts             # DOM event orchestrator & confetti particle engine
│   └── vite-env.d.ts       # Vite client and CSS ambient types
├── css/
│   └── style.css           # Neo-Brutalist responsive design system
├── index.html              # HTML5 root shell
├── tsconfig.json           # Strict TypeScript compiler options
├── vite.config.ts          # Optimized bundler configuration
└── package.json
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server with instant HMR
npm run dev

# 3. Type-check with TypeScript compiler
npm run typecheck

# 4. Build optimized production bundle
npm run build

# 5. Preview the production build locally
npm run preview
```

---

## 🔌 Connecting Live Services (Future Roadmap)

### 1. Live Payments (Stripe / Razorpay)
- **Stripe Payment Links (No-Code):**
  Create a Payment Link in your [Stripe Dashboard](https://dashboard.stripe.com/payment-links), then open the **Admin Console** (`#admin`) on the site and paste your link into **Live Payment Gateway Link**.
- **Stripe Checkout API / Webhooks:**
  The `PaymentService` in `src/services/payments.ts` is typed and ready to call your `/api/checkout` endpoint when you deploy a server or serverless backend.

### 2. Authentication
- **Clerk / Supabase Auth:**
  Add Google/GitHub login or passwordless magic links so patrons can edit their profile, bio, or links post-contribution.

### 3. Real-Time Stats & Multi-User Database
- **Supabase (PostgreSQL) or Firebase:**
  Replace `StorageService` in `src/services/storage.ts` with a Supabase client (`supabase.from('entries')`). All connected clients worldwide will update instantaneously via WebSockets!

---

## 🚀 Deployment

- **GitHub Pages:** Included `.github/workflows/ci.yml` runs type-checking and deploys the `dist/` directory automatically whenever you push to `main`.
- **Vercel or Netlify:** Import the repository into [Vercel](https://vercel.com) or [Netlify](https://netlify.com). It will run `npm run build` and deploy to global CDN edge nodes automatically.

---

## 📄 License
MIT License. Created with supreme passion for doing absolutely nothing.
