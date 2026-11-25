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

## 💳 Dodo Payments: automatic leaderboard fulfillment

Live checkout uses a server-created Dodo checkout session and a signed `payment.succeeded` webhook. The browser never receives the Dodo API key or Supabase service-role key. Supabase Realtime distributes the confirmed row to open boards; the returning checkout page checks confirmation once per second.

### One-time setup

1. In Dodo, create a **one-time USD product** with **Pay What You Want** enabled and a $1 minimum. Copy its product ID.
2. In Supabase, run `supabase/migrations/20261125000000_dodo_autolist.sql` in the SQL Editor.
3. From this repository, deploy the Edge Functions:

   ```bash
   supabase login
   supabase functions deploy dodo-create-checkout --project-ref upnbvommgourlstrilsa
   supabase functions deploy dodo-checkout-status --project-ref upnbvommgourlstrilsa
   supabase functions deploy dodo-webhook --project-ref upnbvommgourlstrilsa
   ```

4. Add the server secrets (never add these to Vite, GitHub Pages files, or the browser):

   ```bash
   supabase secrets set DODO_PAYMENTS_API_KEY="your-dodo-api-key" DODO_PRODUCT_ID="your-pwyw-product-id" DODO_ENVIRONMENT="live_mode" --project-ref upnbvommgourlstrilsa
   ```

   Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` inside Edge Functions. For Dodo test mode, use a test API key and set `DODO_ENVIRONMENT="test_mode"`.

5. In Dodo **Developer → Webhooks**, add:

   ```text
   https://upnbvommgourlstrilsa.supabase.co/functions/v1/dodo-webhook
   ```

   Subscribe to `payment.succeeded`, then save the signing secret in Supabase:

   ```bash
   supabase secrets set DODO_PAYMENTS_WEBHOOK_KEY="your-dodo-webhook-signing-secret" --project-ref upnbvommgourlstrilsa
   ```

6. Keep a non-empty checkout URL in the admin payment setting to enable live checkout. The old static URL is used only if the checkout Edge Function has not been deployed; static links cannot attach this form’s details, so they cannot auto-create the matching board entry.

Automatic fulfillment waits for Dodo’s signed webhook, never the browser redirect. Webhook delivery and network latency vary, so the app cannot promise a strict one-second end-to-end guarantee; it publishes immediately after confirmation and refreshes the returning page every second while waiting.

---

## 🚀 Deployment

- **GitHub Pages:** Included `.github/workflows/ci.yml` runs type-checking and deploys the `dist/` directory automatically whenever you push to `main`. Supabase migrations and Edge Functions are deployed separately as described above.
- **Vercel or Netlify:** Import the repository into [Vercel](https://vercel.com) or [Netlify](https://netlify.com). It will run `npm run build` and deploy to global CDN edge nodes automatically.

---

## 📄 License
MIT License. Created with supreme passion for doing absolutely nothing.
