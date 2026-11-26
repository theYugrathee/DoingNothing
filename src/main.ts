// @ts-nocheck
import '../css/style.css';
import { StorageService } from './services/storage';
import { SupabaseService, SUPABASE_ANON_KEY, SUPABASE_URL } from './services/supabase';
import { LeaderboardEntry } from './types';

declare global {
  interface Window {
    THREE: any;
    burstAt: (x: number, y: number) => void;
    shock: (x: number, y: number, p?: number) => void;
  }
}


        // ===== DEFAULTS (the Admin page can override these in this browser; use Backup > Export to bake them in for everyone) =====
        const DEF = {
            pay: "dodo", tz: "Asia/Kolkata", tag: "Unemployed since 2026. Proud of it.", btn: "Keep me unemployed", sub: "",
            lines: ["Today I ate: nothing. Yesterday: instant noodles. Progress.", "Employee of the month at my own couch.", "Unemployed, undefeated, underfed.", "My diet is 80% noodles, 20% excuses.", "Current net worth: one cup of noodles.", "Last meal: spaghetti with ketchup. Michelin-adjacent.", "I’m not unemployed. I’m pre-productive.", "The cheapest meal in Europe? I’ve had it. Twice.", "My LinkedIn says open to nothing.", "I once tried to work. It was a weekend.", "Hustle culture called. I let it go to voicemail.", "I’m the reason the word “lazy” exists.", "Dinner tonight: cup noodles. Dessert: water.", "The worst employee you’ll never hire.", "Professional couch tester. Also unpaid.", "Hunger level: noodle emergency.", "My fridge light is the only thing working.", "I have a five-year plan. It’s mostly sleeping.", "I eat ramen like it’s a personality.", "Day 1 of my career. Day 1,000 of my nap.", "My bank account is a rumour.", "I’m self-employed. Salary: vibes.", "Lunch is a state of mind. Mine is empty.", "I’m between naps, jobs and meals.", "Cheapest food in America? I’m a regular.", "My cooking skills: boil, wait, regret.", "Plot twist: the noodles were breakfast.", "Not lazy. Just on energy-saving mode.", "I put “napping” under skills. Recruiters agree.", "Currently accepting applications for my next meal."],
            dodge: ["But no one hired me!", "Please don’t do that!", "I’m lazy.", "My last interview ended with a nap.", "HR still has my cover letter: “hi.”", "I have a degree in ceilings.", "Resume: one line. It says nap.", "My skills: horizontal.", "I’m overqualified for nothing.", "I put “Nap” under Experience.", "Even LinkedIn left me on read.", "I got ghosted by a chatbot.", "My LinkedIn says “Open to nap”.", "I’d work, but it’s Tuesday.", "Every day is a bad day to start.", "Employee of the month: nobody.", "Day 412 of unemployment. Thriving.", "Noodles don’t buy themselves.", "Dinner: noodles. Dessert: hope.", "Salary expectations: noodles.", "Today’s menu: spaghetti, again.", "I’m a $1 pasta connoisseur.", "Cup noodles are my personality.", "My fridge has an echo.", "Rent due. Motivation overdue.", "My bank account is a rumour.", "Career goals: a bigger couch.", "CEO of lying down.", "Founder of Doing Nothing Inc.", "Chief Napping Officer here.", "My KPI is staying horizontal.", "Synergy? I barely have energy.", "Let me circle back never.", "Can this be an email? No.", "Per my last nap...", "Quiet quitting before hiring.", "I’m disrupting employment.", "Even my cat got a promotion.", "My houseplant earns more.", "My goldfish has better prospects.", "I’m not broke. I’m minimalist.", "Stress is for the employed.", "Bills called. I didn’t answer.", "My calendar is empty by design.", "I mastered the art of waiting.", "Sorry, I’m buffering.", "Loading motivation... 3%.", "Low battery. Needs 14 hours.", "Out of office. Always.", "Auto-reply: still resting.", "Job? I thought you said jog.", "The word “job” gives me hives.", "I need a nap after that word.", "Triggered. Brb, napping.", "That’s offensive. Also true.", "Nope. Not in this timeline.", "Job offers go to my spam.", "Will work for noodles. Maybe.", "Will not work for noodles. Yet.", "Even my shadow is lazy.", "My alarm gave up on me.", "I peaked at naptime.", "This is my final form.", "Please pay me to stop.", "Don’t tell my mom you found me.", "Ask me after I wake up.", "Fine, but only horizontally.", "Free trial of me ends today.", "Sorry. Booked by my bed."]
        };
        let CFG = Object.assign({}, DEF); try { Object.assign(CFG, JSON.parse(localStorage.getItem("idn_cfg") || "{}")) } catch (e) { }
        // Replace the old default wording while preserving any custom admin copy.
        if (["Buy me", "Tip the nap department", "Help me dodge work", "My couch says get a job"].includes(CFG.btn)) CFG.btn = DEF.btn;
        if (["and get on today’s board", "Support the site. Get your name on today’s board.", "Your tip keeps this silly site going—and gets you on the board.", "I told it to mind its business. Your tip keeps this site going and gets you on the board."].includes(CFG.sub)) CFG.sub = DEF.sub;
        if (!CFG.pay) CFG.pay = DEF.pay;
        const saveCfg = () => { try { localStorage.setItem("idn_cfg", JSON.stringify(CFG)) } catch (e) { } };
        StorageService.removeLocalPreviewEntries();
        const DATA: { entries: LeaderboardEntry[] } = { entries: [] };  // public leaderboard entries come only from Supabase
        // =====================================================================================================================
        const $ = (s: string): any => document.querySelector(s);
        const $$ = (s: string): any[] => [...document.querySelectorAll(s)];
        const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        const toast = t => { if (/^(Add |That |Enter |Type |Wrong |Name and|Couldn)/.test(t)) snd("sad", 300); const e = $("#toast"); e.textContent = t; e.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(() => e.style.display = "none", 3200) };

        function applyTheme(theme: string) {
            const isDark = theme === "dark";
            document.documentElement.dataset.theme = isDark ? "dark" : "light";
            const button = $("#themeToggle");
            if (button) {
                button.textContent = isDark ? "☀️ Light" : "🌙 Dark";
                button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
                button.setAttribute("aria-pressed", String(isDark));
            }
        }
        applyTheme(document.documentElement.dataset.theme || "light");
        $("#themeToggle").onclick = () => {
            const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            try { localStorage.setItem("idn_site_theme", next); } catch (e) { }
            applyTheme(next);
        };

        // ===== SOUNDS: original effects synthesized in the browser. Real meme clips are copyrighted and can't be loaded here. Mute button in the header. =====
        let SOUND = true; try { SOUND = localStorage.getItem("idn_snd") !== "off" } catch (e) { }
        let AC = null, MG = null, welcomed = false; const lastS = {};
        function ctx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); MG = AC.createGain(); MG.gain.value = .35; MG.connect(AC.destination) } catch (e) { return null } } if (AC.state === "suspended") AC.resume().catch(() => { }); return AC }
        function tone(f, d, type = "sine", v = .4, to = null, at = 0) { const c = ctx(); if (!c) return; const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(MG); o.start(t); o.stop(t + d + .02) }
        function noise(d, v = .3, f = 1500, at = 0) { const c = ctx(); if (!c) return; const t = c.currentTime + at, n = Math.floor(c.sampleRate * d), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++)a[i] = Math.random() * 2 - 1; const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; fl.type = "bandpass"; fl.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(fl); fl.connect(g); g.connect(MG); s.start(t) }
        const SND = { pop: () => tone(700, .07, "sine", .4, 300), bonk: () => tone(260, .13, "triangle", .6, 80), squeak: () => tone(1300, .09, "square", .12, 2000), boing: () => { tone(200, .22, "sine", .5, 700); tone(700, .3, "sine", .4, 240, .2) }, blorp: () => tone(150, .22, "sawtooth", .2, 55), honk: () => { tone(233, .3, "sawtooth", .18); tone(247, .3, "sawtooth", .18) }, up: () => tone(300, .25, "sine", .35, 1500), tick: () => tone(1500, .02, "square", .07), kaching: () => { tone(1568, .12, "sine", .4); tone(2093, .35, "sine", .4, null, .1); noise(.08, .15, 6000) }, sad: () => [[293, .3, 0], [277, .3, .32], [261, .3, .64], [233, .9, .96]].forEach(([f, d, a]) => tone(f, d, "sawtooth", .18, f * .92, a)), rim: () => { tone(130, .12, "triangle", .7, 70); tone(110, .12, "triangle", .7, 60, .18); noise(.5, .35, 5000, .4) }, horn: () => { [440, 554, 659].forEach(f => tone(f, .6, "sawtooth", .14, f * .9)); noise(.15, .1, 3000) }, boom: () => { tone(80, .7, "sine", .9, 30); noise(.25, .35, 200) }, alarm: () => { for (let i = 0; i < 4; i++)tone(i % 2 ? 660 : 880, .12, "square", .12, null, i * .14) }, scratch: () => noise(.35, .4, 2500), fan: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, "triangle", .4, null, i * .09)), dun: () => [[196, 0], [196, .28], [165, .6]].forEach(([f, a]) => tone(f, .4, "sawtooth", .2, f * .97, a)), yay: () => { tone(400, .15, "sine", .4, 900); tone(900, .2, "sine", .4, 1300, .14) } };
        const arp = (n, st, ty = "sine", v = .35, d = .16) => n.forEach((f, i) => tone(f, d, ty, v, null, i * st));
        const clack = (f = 1) => { tone(270 + Math.random() * 40, .05, "triangle", .42 * f, 140); tone(620 + Math.random() * 80, .025, "sine", .22 * f, 280); };
        Object.assign(SND, {
            coin: () => { tone(988, .08, "square", .18); tone(1319, .3, "square", .18, null, .08) }, jump: () => tone(300, .14, "square", .2, 800), laser: () => tone(1800, .22, "sawtooth", .18, 200), zap: () => { noise(.12, .3, 3000); tone(700, .18, "sawtooth", .16, 90) }, whoosh: () => noise(.35, .35, 900),
            bubble: () => { tone(400, .09, "sine", .4, 900); tone(500, .09, "sine", .35, 1100, .1) }, drip: () => tone(1300, .1, "sine", .4, 500), ding: () => tone(1760, .6, "sine", .35), bell: () => [880, 1320, 1760].forEach((f, i) => tone(f, .9 - i * .15, "sine", .22)), chime: () => arp([784, 988, 1175], .1, "triangle", .3, .5),
            harp: () => arp([392, 494, 587, 740, 880, 988], .07, "sine", .3, .5), cricket: () => { for (let i = 0; i < 4; i++)tone(4200, .03, "square", .05, null, i * .06) }, meow: () => { tone(600, .14, "sawtooth", .14, 950); tone(950, .32, "sawtooth", .14, 430, .14) }, quack: () => { tone(360, .12, "sawtooth", .22, 270); tone(340, .12, "sawtooth", .22, 260, .15) }, whistle: () => tone(1200, .28, "sine", .3, 1900),
            slidedown: () => tone(1500, .4, "sine", .35, 200), woo: () => { tone(300, .2, "sine", .4, 620); tone(620, .22, "sine", .4, 300, .2) }, gulp: () => { tone(320, .1, "sine", .5, 120); tone(280, .1, "sine", .5, 110, .14) }, kazoo: () => tone(440, .35, "sawtooth", .14, 470), wah: () => tone(233, .5, "sawtooth", .2, 170),
            clap: () => [0, .03, .06].forEach(a => noise(.08, .35, 1600, a)), snare: () => { noise(.16, .4, 3000); tone(190, .1, "triangle", .4, 110) }, kick: () => tone(160, .22, "sine", .9, 40), hihat: () => noise(.05, .25, 8500), cymbal: () => noise(.7, .25, 7000),
            tom: () => tone(220, .28, "sine", .7, 80), cowbell: () => { tone(800, .25, "square", .12); tone(540, .25, "square", .12) }, glock: () => tone(2093, .35, "triangle", .3), xylo: () => { tone(1046, .15, "sine", .4); tone(1318, .2, "sine", .35, null, .1) }, blip: () => tone(880, .05, "square", .12),
            beep2: () => { tone(1000, .06, "square", .12); tone(1000, .06, "square", .12, null, .09) }, buzz: () => { tone(120, .3, "square", .18); tone(126, .3, "square", .18) }, dingding: () => { tone(1319, .15, "sine", .4); tone(1760, .35, "sine", .4, null, .14) }, powerup: () => arp([262, 330, 392, 523, 659, 784], .05, "square", .14, .1), powerdown: () => arp([784, 659, 523, 392, 330, 262], .06, "square", .14, .1),
            spring: () => { tone(100, .3, "sine", .5, 1000); tone(1000, .3, "sine", .4, 150, .3) }, squeeze: () => { tone(600, .08, "sine", .4, 900); tone(900, .12, "sine", .4, 500, .08) }, pew: () => tone(1500, .13, "sawtooth", .14, 300), thunder: () => { noise(.9, .5, 140); tone(55, .9, "sine", .7, 30) }, rain: () => noise(.5, .2, 6500),
            wind: () => noise(.7, .25, 420), rev: () => tone(60, .6, "sawtooth", .25, 220), siren: () => { for (let i = 0; i < 4; i++)tone(i % 2 ? 900 : 600, .22, "sine", .3, i % 2 ? 600 : 900, i * .22) }, ufo: () => { tone(500, .5, "sine", .3, 900); tone(900, .5, "sine", .3, 500, .5) }, robot: () => arp([200, 260, 200, 340, 200], .07, "square", .14, .08),
            typeding: () => tone(2000, .35, "sine", .3), bubblepop: () => { tone(900, .05, "sine", .4, 300); noise(.03, .2, 4000) }, angels: () => [261, 329, 392, 523].forEach(f => tone(f, 1, "sine", .12)), raspberry: () => { noise(.3, .3, 300); tone(85, .3, "sawtooth", .2, 45) }, snore: () => { noise(.5, .2, 220); tone(70, .5, "triangle", .3, 55) },
            yawn: () => tone(420, .7, "sine", .3, 240), twinkle: () => tone(2400, .06, "sine", .12, 3300), swish: () => noise(.07, .07, 2400),
            clack: () => clack(1), spaceclack: () => { noise(.06, .35, 1800); tone(90, .09, "square", .2, 50) }, enterclack: () => { clack(1.3); tone(110, .12, "square", .18, 60, .03) }, tk: () => tone(1800 + Math.random() * 300, .018, "square", .06)
        });
        const CURSOR_NOTES = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
        SND.softnote = () => { const f = CURSOR_NOTES[Math.floor(Math.random() * CURSOR_NOTES.length)]; tone(f, .55, "sine", .07); tone(f * 2, .3, "triangle", .02); };
        function snd(n, gap = 60) { if (!SOUND || CFG.soundsEnabled === false) return; const t = performance.now(); if (lastS[n] && t - lastS[n] < gap) return; lastS[n] = t; try { SND[n]() } catch (e) { } }
        const CLK = ["pop", "bonk", "squeak", "boing", "blorp", "yay", "coin", "bubble", "blip", "drip", "xylo", "glock", "jump", "spring", "squeeze", "pew", "quack", "meow", "kazoo", "clap", "dingding", "gulp", "whistle", "woo", "bubblepop", "cowbell"];
        const welcome = () => { if (welcomed) return; welcomed = true; snd("fan") };["pointerdown", "keydown", "touchstart"].forEach(v => addEventListener(v, welcome, { passive: true }));
        document.addEventListener("click", e => {
            const btn = e.target.closest("button, .btn, .chip, .rbtn, .pc, .lr, a, .opt");
            if (btn) {
                if (!RM2) {
                    // Crisp spring scale bounce
                    btn.animate([
                        { transform: "scale(0.94)" },
                        { transform: "scale(1.12)" },
                        { transform: "scale(1)" }
                    ], { duration: 200, easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" });

                    // Single clean celebratory burst (not messy or clustered)
                    const r = btn.getBoundingClientRect();
                    const bx = e.clientX || (r.left + r.width / 2);
                    const by = e.clientY || (r.top + r.height / 2);
                    if (window.burstAt) {
                        window.burstAt(bx, by);
                        if (window.shock) shock(bx, by, 1.15);
                    }
                }
            }
            if (e.target.closest("#snd,#mot,#sbg")) return;
            if (btn) snd(CLK[Math.floor(Math.random() * CLK.length)], 30);
        }, true);
        let hv = null; // hover tick removed for clean cursor movement
        const sb = document.getElementById("snd"); const sbl = () => sb.textContent = CFG.soundsEnabled === false ? "Sound: disabled" : "Sound: " + (SOUND ? "on" : "off"); sbl(); sb.onclick = () => { if (CFG.soundsEnabled === false) return; SOUND = !SOUND; try { localStorage.setItem("idn_snd", SOUND ? "on" : "off") } catch (e) { } sbl(); welcomed = true; snd("pop") };
        const money = n => (CFG.cur || "$") + (Math.round(n * 100) / 100).toLocaleString();
        const safeUrl = u => { u = (u || "").trim(); if (!u || u[0] === "@") return ""; try { const x = new URL(/^https?:/i.test(u) ? u : "https://" + u); return /^https?:$/.test(x.protocol) && x.hostname.includes(".") ? x.href : "" } catch (e) { return "" } };
        const host = u => { try { return new URL(safeUrl(u)).hostname.replace(/^www\./, "") } catch (e) { return "" } };
        const tz = () => { try { new Intl.DateTimeFormat("en", { timeZone: CFG.tz }); return CFG.tz } catch (e) { return "UTC" } };
        const COL = ["#2F4BFF", "#E8412C", "#0E9F6E", "#8B3DFF", "#F08A00", "#101010", "#D6246E"]; const hue = s => COL[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COL.length];
        interface SocialDef { name: string; bg: string; svg: string; }
        const SOCIAL_MAP: Record<string, SocialDef> = {
            "x.com": { name: "X", bg: "#000000", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
            "twitter.com": { name: "Twitter", bg: "#1DA1F2", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.52 8.52 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>' },
            "instagram.com": { name: "Instagram", bg: "linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' },
            "facebook.com": { name: "Facebook", bg: "#1877F2", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
            "fb.com": { name: "Facebook", bg: "#1877F2", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
            "linkedin.com": { name: "LinkedIn", bg: "#0A66C2", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
            "github.com": { name: "GitHub", bg: "#161b22", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>' },
            "youtube.com": { name: "YouTube", bg: "#FF0000", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
            "youtu.be": { name: "YouTube", bg: "#FF0000", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
            "tiktok.com": { name: "TikTok", bg: "#010101", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>' },
            "reddit.com": { name: "Reddit", bg: "#FF4500", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>' },
            "medium.com": { name: "Medium", bg: "#000000", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/></svg>' },
            "threads.net": { name: "Threads", bg: "#000000", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.829.433 4.146-1.278 5.907C17.908 23.054 15.302 24 12.186 24zm-.145-10.86c-.899.05-1.6.299-2.085.733-.47.42-.698.98-.665 1.58.062 1.147 1.182 1.812 2.738 1.724 1.147-.063 2.011-.45 2.57-1.152.419-.523.651-1.264.69-2.212a11.413 11.413 0 0 0-3.248-.673z"/></svg>' },
            "discord.com": { name: "Discord", bg: "#5865F2", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.11 18.1.128 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' },
            "discord.gg": { name: "Discord", bg: "#5865F2", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.11 18.1.128 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' },
            "producthunt.com": { name: "Product Hunt", bg: "#DA552F", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M13.604 8.4h-3.405V12h3.405c.993 0 1.8-.807 1.8-1.8 0-.993-.807-1.8-1.8-1.8zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.8V6h5.804c2.319 0 4.2 1.881 4.2 4.2 0 2.319-1.881 4.2-4.2 4.2z"/></svg>' },
            "twitch.tv": { name: "Twitch", bg: "#9146FF", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>' },
            "substack.com": { name: "Substack", bg: "#FF6719", svg: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>' }
        };
        const SOCIAL_HOST_ALIASES: Record<string, string> = {
            'instagr.am': 'instagram.com',
            'twitter.com': 'x.com',
            'lnkd.in': 'linkedin.com',
            'redd.it': 'reddit.com',
            'threads.com': 'threads.net'
        };
        const getSocialInfo = (u: string): SocialDef | null => {
            if (!u) return null;
            const raw = String(u).trim();
            let h = '';
            try {
                h = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, '');
            } catch (e) {
                h = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split(/[/?#]/)[0].toLowerCase();
            }
            const alias = Object.keys(SOCIAL_HOST_ALIASES).find(domain => h === domain || h.endsWith('.' + domain));
            const normalizedHost = alias ? SOCIAL_HOST_ALIASES[alias] : h;
            const k = Object.keys(SOCIAL_MAP).find(key => normalizedHost === key || normalizedHost.endsWith('.' + key));
            return k ? SOCIAL_MAP[k] : null;
        };
        const soc = (u: string) => { const s = getSocialInfo(u); return s ? [s.name, s.bg] : null; };
        // Local rows are retained only for admin recovery. The public leaderboard reads Supabase rows only.
        let LOCAL: LeaderboardEntry[] = StorageService.getEntries();
        let liveBoardStatus: "loading" | "live" | "error" = "loading";
        let REMOTE_BLOCKLIST: string[] = [];
        let REMOTE_DELETED_IDS: string[] = [];
        const saveLocal = () => { StorageService.saveEntries(LOCAL); };
        const entryIsBlocked = (item: LeaderboardEntry) => {
            const values = [item.id, item.name, item.url, host(item.url)].map(v => String(v || "").trim().toLowerCase()).filter(Boolean);
            return REMOTE_BLOCKLIST.some(raw => {
                const rule = String(raw || "").trim().toLowerCase();
                return rule && values.some(value => value === rule || (rule.includes(".") && value.includes(rule)));
            });
        };
        const all = () => {
            const seen = new Set<string>();
            const list: LeaderboardEntry[] = [];
            const pool = DATA.entries || [];
            for (const item of pool) {
                if (!item || item.src === "pending" || REMOTE_DELETED_IDS.includes(String(item.id)) || REMOTE_DELETED_IDS.includes(deletedEntryKey(item)) || entryIsBlocked(item)) continue;
                const idKey = item.id ? "id:" + item.id : "";
                if (idKey && seen.has(idKey)) continue;
                if (idKey) seen.add(idKey);
                else {
                    const contentKey = "c:" + (item.name || "").trim().toLowerCase() + "_" + item.amt + "_" + Math.floor(item.t / 300000);
                    if (seen.has(contentKey)) continue;
                    seen.add(contentKey);
                }
                list.push(item);
            }
            return list;
        };
        const tagOf = x => x.src === "sample" ? "sample" : x.src === "preview" ? "preview" : "";

        function normalizeLink(u) {
            if (!u) return "";
            try {
                const raw = String(u).trim().toLowerCase();
                const parsed = new URL(/^https?:/i.test(raw) ? raw : "https://" + raw);
                return (parsed.hostname.replace(/^www\./, "") + parsed.pathname.replace(/\/$/, "")).toLowerCase();
            } catch (e) {
                return String(u).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
            }
        }

        function deletedEntryKey(item: LeaderboardEntry) {
            const name = String(item.name || "").trim().toLowerCase();
            const link = normalizeLink(item.url || "");
            return `content:${name}|${link}|${Number(item.amt || 0).toFixed(2)}`;
        }

        function getDonorKey(x) {
            const link = normalizeLink(x.url);
            if (link) return "link:" + link;
            if (x.anon) return "anon:" + (x.id || Math.random());
            return "name:" + (x.name || "anon").trim().toLowerCase();
        }

        function getDonorMap(entries) {
            const map = new Map();
            for (const x of entries) {
                const k = getDonorKey(x);
                if (!map.has(k)) {
                    map.set(k, { totalAmt: 0, count: 0, latestT: 0, latestAmt: 0, latestEntry: x });
                }
                const d = map.get(k);
                d.totalAmt = Math.round((d.totalAmt + Number(x.amt || 0)) * 100) / 100;
                d.count += 1;
                if (x.t >= d.latestT) {
                    d.latestT = x.t;
                    d.latestAmt = x.amt;
                    d.latestEntry = x;
                }
            }
            return map;
        }

        let bmode = "recent";
        let currentPage = 1;
        const PAGE_SIZE = 100;

        const recentList = () => {
            // Keep each donation as its own entry, newest first, so pages show
            // the complete history rather than one card per donor.
            const list = all().slice().sort((a, b) => b.t - a.t);
            const donorMap = getDonorMap(list);
            return list.map(item => {
                const d = donorMap.get(getDonorKey(item));
                return {
                    ...item,
                    latestAmt: item.amt,
                    totalAmt: d ? d.totalAmt : item.amt,
                    donorCount: d ? d.count : 1
                };
            });
        };

        const topPlayersList = () => {
            const pool = all();
            const donorMap = getDonorMap(pool);
            const result = [];
            for (const d of donorMap.values()) {
                result.push({
                    ...d.latestEntry,
                    amt: d.totalAmt, // Total accumulated amount for top players ranking
                    totalAmt: d.totalAmt,
                    latestAmt: d.latestAmt,
                    donorCount: d.count
                });
            }
            return result.sort((a, b) => b.amt - a.amt || a.t - b.t);
        };

        // routing with clean URLs (no #)
        const pages = ["home", "red", "roast", "challenge", "excuses", "soundboard", "about", "rules", "privacy", "terms"];
        const PATH_MAP = {
            "/": "home",
            "/home": "home",
            "/dont-press": "red",
            "/red": "red",
            "/get-roasted": "roast",
            "/roast": "roast",
            "/challenge": "challenge",
            "/excuses": "excuses",
            "/soundboard": "soundboard",
            "/about": "about",
            "/rules": "rules",
            "/privacy": "privacy",
            "/terms": "terms"
        };
        const PAGE_URLS = {
            home: "/",
            red: "/dont-press",
            roast: "/get-roasted",
            challenge: "/challenge",
            excuses: "/excuses",
            soundboard: "/soundboard",
            about: "/about",
            rules: "/rules",
            privacy: "/privacy",
            terms: "/terms"
        };
        const PAGE_SEO = {
            home: ["Doing Nothing – Procrastination Games & Stillness Challenge", "Doing nothing today? Take a playful break with the stillness challenge, excuse machine, and big red button. Meet the live supporter board at doingnothing.lol."],
            red: ["Do Not Press the Red Button | Doing Nothing", "A tiny interactive game built around one terrible idea: press the big red button and see what happens."],
            roast: ["Startup & Name Roast Generator | Doing Nothing", "Get a quick, playful roast for your startup, product, or name. No account needed—just type it in and see what it says."],
            challenge: ["Stillness Challenge: How Long Can You Stay Still? | Doing Nothing", "Start a browser stillness challenge and see how long you can go without moving the mouse, typing, tapping, or scrolling."],
            excuses: ["Work Excuse Generator | Doing Nothing", "Generate a silly workplace excuse for a laugh when your to-do list is winning."],
            soundboard: ["Funny Browser Soundboard | Doing Nothing", "Play quirky sound effects made right in your browser on the Doing Nothing soundboard."],
            about: ["About Doing Nothing | Games, Board Rules & FAQ", "About the founder, supporter board rules, and straight answers about doingnothing.lol."],
            rules: ["Supporter Board Rules | Doing Nothing", "Learn how paid board listings, Recent, Top Players, entry content, and complaints work."],
            privacy: ["Privacy Notice | Doing Nothing", "Learn what browser settings and supporter listing details this site uses, and how to contact the operator."],
            terms: ["Terms of Use | Doing Nothing", "Read the terms for using the games and purchasing a place on the supporter board."]
        };

        // The wipe is purely decorative and only runs after the first route is painted.
        let hasRoutedOnce = false;
        function playPageWipe() {
            if (RM2) return;
            let wipe = document.querySelector(".page-wipe");
            if (!wipe) {
                wipe = document.createElement("div");
                wipe.className = "page-wipe";
                wipe.setAttribute("aria-hidden", "true");
                document.body.appendChild(wipe);
            }
            wipe.classList.remove("play");
            void wipe.offsetWidth;
            wipe.classList.add("play");
        }

        function resolvePage(path) {
            const clean = (path || "/").replace(/\/$/, "") || "/";
            if (clean === "/hall-of-fame") {
                bmode = "top";
                return "home";
            }
            return PATH_MAP[clean] || PATH_MAP["/" + clean.split("/")[1]] || "home";
        }

        function routeTo(pageId, updateUrl = true) {
            if (pageId === "roast" && CFG.roastEnabled === false) pageId = "home";
            if (!pages.includes(pageId)) pageId = "home";
            const seo = PAGE_SEO[pageId];
            if (seo) {
                document.title = seo[0];
                document.querySelector('meta[name="description"]')?.setAttribute("content", seo[1]);
                document.querySelector('meta[property="og:title"]')?.setAttribute("content", seo[0]);
                document.querySelector('meta[property="og:description"]')?.setAttribute("content", seo[1]);
                document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", seo[0]);
                document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", seo[1]);
                const canonical = document.querySelector('link[rel="canonical"]');
                if (canonical) canonical.setAttribute("href", "https://doingnothing.lol" + (PAGE_URLS[pageId] || "/"));
                const ogUrl = document.querySelector('meta[property="og:url"]');
                if (ogUrl) ogUrl.setAttribute("content", "https://doingnothing.lol" + (PAGE_URLS[pageId] || "/"));
            }
            const routeChanged = hasRoutedOnce && !$("#" + pageId)?.classList.contains("on");
            if (routeChanged) playPageWipe();
            hasRoutedOnce = true;
            if (updateUrl) {
                const dest = PAGE_URLS[pageId] || "/";
                if (location.pathname !== dest) {
                    history.pushState(null, "", dest);
                }
            }
            pages.forEach(p => { const el = $("#" + p); if (el) el.classList.toggle("on", p === pageId); });
            $$("#nav a").forEach(a => {
                const r = a.getAttribute("data-route") || a.getAttribute("href");
                const isMatch = r === pageId || (pageId === "home" && (r === "/" || r === "home"));
                a.classList.toggle("on", isMatch);
            });
            if (pageId !== "challenge") stopCh();
            scrollTo(0, 0);
            render();
            if (pageId === "admin") renderAdmin();
            setTimeout(home, 60);
        }

        // Intercept internal link clicks for clean URL routing
        document.addEventListener("click", e => {
            const a = e.target.closest("a");
            if (!a) return;
            const href = a.getAttribute("href");
            if (href && (href.startsWith("/") || href.startsWith("#")) && !href.startsWith("//") && !a.target && !a.download) {
                e.preventDefault();
                snd("up", 150);
                if (window.shock) shock(innerWidth / 2, innerHeight / 2, .6);
                const targetPath = href.startsWith("#") ? "/" + href.slice(1) : href;
                const page = resolvePage(targetPath);
                routeTo(page, true);
            }
        });

        window.addEventListener("popstate", () => {
            routeTo(resolvePage(location.pathname), false);
        });

        // hero
        function meal() { const hour = new Date().getHours(); return hour >= 5 && hour < 11 ? "Breakfast money?" : hour >= 11 && hour < 16 ? "Lunch money?" : "Dinner money?" }
        function setMeal() { $("#fund").innerHTML = esc(CFG.btn) + `<small>${esc(String(CFG.sub || "").trim() || meal())}</small>`; $("#tag").textContent = CFG.tag }
        function applySiteConfig() {
            $("#heroHead").textContent = CFG.heroHead || "I do";
            $("#heroAccent").textContent = CFG.heroAccent || "nothing.";
            const roastLink = $("#nav [data-route='roast']");
            if (roastLink) roastLink.hidden = CFG.roastEnabled === false;
            sbl();
            setMeal();
        }
        let li = 0; const showLine = () => { const e = $("#line"), L = CFG.lines.length ? CFG.lines : DEF.lines; e.style.opacity = 0; setTimeout(() => { e.textContent = L[li++ % L.length]; e.style.opacity = 1 }, 300) };
        // the "Go get a job" button
        const run = $("#run"), hero = $(".hero"); let mi = 0, bag = [], px = -999, py = -999, moved = false, hy = 0;
        const pick = () => { const D = CFG.dodge.length ? CFG.dodge : DEF.dodge; if (mi < 3 && D[mi]) return D[mi]; if (!bag.length) bag = D.slice(3).sort(() => Math.random() - .5); return bag.pop() || D[0] };
        const prot = () => { const o = []; hero.querySelectorAll("#fund,#tag").forEach(e => o.push(e.getBoundingClientRect()));["h1.big", ".line"].forEach(q => { const rg = document.createRange(); rg.selectNodeContents(hero.querySelector(q));[...rg.getClientRects()].forEach(r => o.push(r)) }); return o.filter(r => r.width > 0) };
        function home() { if (!hero.offsetParent) return; const s = $("#slot").getBoundingClientRect(), h = hero.getBoundingClientRect(); run.style.left = (s.left - h.left) + "px"; run.style.top = (s.top - h.top) + "px"; hy = s.top - h.top; moved = false }
        function flee() {
            if (window.charReact && Math.random() < .35) window.charReact("nope");
            snd(["boing", "squeak", "blorp", "honk"][Math.floor(Math.random() * 4)], 40); moved = true; const h = hero.getBoundingClientRect(), W = run.offsetWidth, H = run.offsetHeight, R = prot(), pad = 12; let best = null, bd = -1;
            for (let i = 0; i < 90; i++) { const x = Math.random() * Math.max(0, h.width - W), y = Math.min(Math.max(0, hy - 18 + Math.random() * 60), Math.max(0, h.height - H)), L = h.left + x, T = h.top + y; if (R.some(r => L < r.right + pad && L + W > r.left - pad && T < r.bottom + pad && T + H > r.top - pad)) continue; const d = Math.hypot(L + W / 2 - px, T + H / 2 - py); if (d > bd) { bd = d; best = [x, y] } }
            if (best) { run.style.left = best[0] + "px"; run.style.top = best[1] + "px" }
        }
        const near = () => { const b = run.getBoundingClientRect(), m = 40; return $("#home").classList.contains("on") && px > b.left - m && px < b.right + m && py > b.top - m && py < b.bottom + m };
        addEventListener("pointermove", e => { px = e.clientX; py = e.clientY; if (near()) flee() }, { passive: true });
        ["pointerdown", "touchstart"].forEach(v => document.addEventListener(v, e => { const t = e.touches ? e.touches[0] : e; px = t.clientX; py = t.clientY; if (near()) { flee(); if (e.target.closest("#run")) e.preventDefault() } }, { passive: false, capture: true }));
        run.addEventListener("click", e => { e.preventDefault(); e.stopImmediatePropagation(); flee() });
        addEventListener("resize", home); document.fonts && document.fonts.ready.then(home);
        // counter
        let shown = 0; function setTotal(to) { const f = shown, s = performance.now(); shown = to; (function a(t) { const p = Math.min(1, (t - s) / 800); $("#tot").textContent = money(f + (to - f) * p); if (p < 1) requestAnimationFrame(a) })(s) }
        function avatar(x) {
            if (x.anon) return `<div class="av" style="background:#8a877d">?</div>`;
            const s = getSocialInfo(x.url);
            if (s) {
                return `<div class="av" style="background:${s.bg};display:grid;place-items:center">${s.svg}</div>`;
            }
            const h = host(x.url);
            const logoSrc = x.img || (h && h.includes('.') ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=128` : '');
            if (logoSrc) {
                return `<div class="av" style="background:#fff;display:grid;place-items:center"><img src="${esc(logoSrc)}" style="width:100%;height:100%;object-fit:contain;padding:4px" onerror="this.onerror=null;this.parentElement.style.background='${hue(x.name)}';this.parentElement.innerHTML='${esc((x.name[0]||'?').toUpperCase())}'" alt=""></div>`;
            }
            return `<div class="av" style="background:${hue(x.name)}">${esc((x.name[0] || "?").toUpperCase())}</div>`;
        }
        const tierOf = a => a >= 100 ? ["Legend", "#E8412C"] : a >= 25 ? ["Big spender", "#2F4BFF"] : a >= 5 ? ["Supporter", "#0E9F6E"] : ["Noodle", "#6c6a64"];
        const tierClass = a => tierOf(a)[0].toLowerCase().replace(/\s+/g, "-");
        const chipT = x => { const t = tierOf(x.amt); return `<span class="tc tc-${tierClass(x.amt)}" style="background:${t[1]}">${t[0]}</span>` };
        const visitControl = x => { const url = safeUrl(x.url); return url ? `<a class="entry-visit" data-visit href="${esc(url)}" target="_blank" rel="nofollow noopener ugc">Visit ↗</a>` : `<span class="entry-visit is-disabled" aria-disabled="true" title="No website link was added">Visit</span>` };
        const CROWN = '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M3 18h18l1-10-5 4-5-8-5 8-5-4z" fill="#FFD23F" stroke="#101010" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        
        function lbHTML(L, mode, at, startIndex = 0, showPodium = false) {
            const mx = Math.max(1, topPlayersList()[0]?.amt || 0); let h = "", st = 0;
            if (mode === "top" && showPodium) {
                const leader = L[0];
                h += `<div class="king-podium ${L.length < 2 ? "king-solo" : ""}">
                    ${leader ? `<article class="king-card">
                        <button class="king-main" ${at}="${startIndex}" aria-label="View details for the top supporter">
                            <span class="king-crown">${CROWN}</span>
                            <span class="king-avatar">${avatar(leader)}</span>
                            <span class="king-copy"><span class="king-eyebrow">Scoreboard leader · #1</span><strong class="king-name">${esc(leader.name)}</strong><span class="king-tier">${chipT(leader)}</span><span class="king-description">${esc(leader.desc || "Quietly leading the board.")}</span><span class="king-time">${ago(leader.t) === "now" ? "Last donation just now" : `Last donation ${ago(leader.t)} ago`}</span></span>
                            <span class="king-amount">${money(leader.amt)}${leader.donorCount > 1 ? `<small>${leader.donorCount} donations</small>` : ""}</span>
                        </button>
                        <div class="king-actions">${visitControl(leader)}<button class="king-cta" type="button" data-fund>Take the throne</button></div>
                    </article>` : ""}
                    <div class="runner-podium">${[1, 2].filter(i => L[i]).map(i => {
                        const x = L[i];
                        return `<article class="runner-card runner-${i + 1}" ${at}="${startIndex + i}"><span class="runner-medal">${i === 1 ? "🥈" : "🥉"}</span><span class="runner-avatar">${avatar(x)}</span><span class="runner-copy"><strong>${esc(x.name)}</strong>${chipT(x)}<small>${x.donorCount} ${x.donorCount === 1 ? "donation" : "donations"}</small></span><span class="runner-actions"><b>${money(x.amt)}</b>${visitControl(x)}<button type="button" class="runner-details" ${at}="${startIndex + i}">Details</button></span></article>`;
                    }).join("")}</div>
                </div>`;
                st = 3;
            }
            return h + L.slice(st).map((x, k) => {
                const i = k + st, rank = startIndex + i, fresh = mode === "recent" && Date.now() - x.t < 12e4;
                const hasRepeat = x.totalAmt && x.totalAmt > x.amt;
                return `<article class="lr tier-${tierClass(x.amt)} ${mode === "recent" && rank === 0 ? "hot" : ""}" ${at}="${rank}" style="animation-delay:${Math.min(k, 12) * 35}ms"><div class="lk">${mode === "top" ? `<b>${rank + 1}</b>` : `<span class="tp ${fresh ? "nw" : ""}">${ago(x.t)}</span>`}</div>${avatar(x)}<div style="min-width:0"><h3>${esc(x.name)} ${chipT(x)}${tagOf(x) ? `<span class="pv">${tagOf(x)}</span>` : ""}</h3><p>${esc(x.desc || "")}</p><div class="d">${esc(host(x.url) || x.url || "")}</div></div><div class="lp"><b class="nv" data-v="${x.amt}">${money(x.amt)}</b>${mode === "recent" && hasRepeat ? `<span class="tot-badge">Total ${money(x.totalAmt)}</span>` : ""}${mode === "top" && x.donorCount > 1 ? `<span class="tot-badge">${x.donorCount} donations</span>` : ""}${visitControl(x)}<button type="button" class="go" ${at}="${rank}">Details ›</button></div><i class="lbar" style="width:${Math.max(3, x.amt / mx * 100)}%"></i></article>`;
            }).join("");
        }

        const ago = t => { const m = Math.floor((Date.now() - t) / 6e4); return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.floor(m / 60) + "h" : Math.floor(m / 1440) + "d" };

        function render() {
            setMeal();
            if (!moved) home();
            const allItems = all();
            setTotal(allItems.reduce((a, b) => a + b.amt, 0));
            const dayFormatter = new Intl.DateTimeFormat("en", { timeZone: tz(), year: "numeric", month: "2-digit", day: "2-digit" });
            const dayKey = timestamp => dayFormatter.formatToParts(new Date(timestamp)).filter(p => p.type !== "literal").map(p => p.value).join("-");
            const todayKey = dayKey(Date.now());
            const todayTotal = allItems.reduce((sum, item) => sum + (dayKey(item.t) === todayKey ? Number(item.amt || 0) : 0), 0);
            $("#todayTot").textContent = money(todayTotal);
            $("#cnt").textContent = allItems.length;
            const topEntry = topPlayersList()[0];
            $("#topv").textContent = topEntry ? topEntry.name : "Nobody";
            const lastEntry = allItems.reduce((latest, item) => !latest || item.t > latest.t ? item : latest, null as LeaderboardEntry | null);
            $("#lastPaid").innerHTML = lastEntry
                ? `<span class="live-dot"></span>Last paid ${ago(lastEntry.t) === "now" ? "just now" : ago(lastEntry.t) + " ago"}`
                : '<span class="live-dot idle"></span>No payments yet';
            $("#pvBar").innerHTML = liveBoardStatus === "error"
                ? `<p class="hint" style="margin-bottom:12px"><b>Live leaderboard is temporarily unavailable.</b> The board will show Supabase entries when the connection returns.</p>`
                : !CFG.pay
                    ? `<p class="hint" style="margin-bottom:12px"><b>Payments are not configured.</b> The leaderboard only shows shared Supabase entries.</p>`
                    : "";

            // Update sliding switch active UI
            const sw = $("#lbSwitch");
            if (sw) {
                sw.setAttribute("data-active", bmode);
                const tabR = $("#tabRecent"), tabT = $("#tabTop");
                if (tabR) tabR.classList.toggle("on", bmode === "recent");
                if (tabT) tabT.classList.toggle("on", bmode === "top");
            }
            // Keep a styling hook in sync with the existing view toggle.
            $("#board").dataset.mode = bmode;

            if (bmode === "recent") {
                const fullList = bmode === "recent" ? recentList() : topPlayersList();
                const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE));
                if (currentPage > totalPages) currentPage = totalPages;
                if (currentPage < 1) currentPage = 1;
                const pageItems = fullList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

                let boardContent = pageItems.length ? lbHTML(pageItems, "recent", "data-i") : ghostHTML();
                if (totalPages > 1) {
                    boardContent += `<div class="pg-controls">
                        <button class="btn sm w" id="pgPrev" ${currentPage <= 1 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>‹ Previous</button>
                        <span class="pg-info">Page ${currentPage} of ${totalPages} (${fullList.length} total)</span>
                        <button class="btn sm" id="pgNext" ${currentPage >= totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed"' : ''}>Next ›</button>
                    </div>`;
                }
                $("#board").innerHTML = boardContent;
            } else {
                const topList = topPlayersList();
                const totalPages = Math.max(1, Math.ceil(topList.length / PAGE_SIZE));
                if (currentPage > totalPages) currentPage = totalPages;
                if (currentPage < 1) currentPage = 1;
                const startIndex = (currentPage - 1) * PAGE_SIZE;
                const pageItems = topList.slice(startIndex, startIndex + PAGE_SIZE);
                let boardContent = pageItems.length ? lbHTML(pageItems, "top", "data-i", startIndex, currentPage === 1) : ghostHTML();
                if (totalPages > 1) {
                    boardContent += '<div class="pg-controls">' +
                        '<button class="btn sm w" id="pgPrev" ' + (currentPage <= 1 ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + '>‹ Previous</button>' +
                        '<span class="pg-info">Page ' + currentPage + ' of ' + totalPages + ' (' + topList.length + ' total)</span>' +
                        '<button class="btn sm" id="pgNext" ' + (currentPage >= totalPages ? 'disabled style="opacity:0.4;cursor:not-allowed"' : '') + '>Next ›</button></div>';
                }
                $("#board").innerHTML = boardContent;
            }
        }

        function showDetail(x) {
            if (!x) return;
            const u = safeUrl(x.url);
            const totalInfo = x.totalAmt && x.totalAmt > x.amt ? `<div style="font-size:14px;color:var(--blue);font-weight:700;margin-top:4px;">Cumulative Lifetime Total: ${money(x.totalAmt)}</div>` : "";
            $("#mb").innerHTML = `<div style="display:flex;gap:14px;align-items:center">${avatar(x)}<div><h2 style="font-size:28px">${esc(x.name)}</h2><b>${money(x.amt)}</b>${totalInfo}</div></div><p style="white-space:pre-wrap">${esc(x.desc || "No description.")}</p>${u ? `<p><a class="btn sm detail-visit" href="${esc(u)}" target="_blank" rel="nofollow noopener ugc">Visit ${esc(host(x.url))}</a></p>` : (x.url ? `<p><b>${esc(x.url)}</b></p>` : "")}<p><button class="chip" id="cl">Close</button></p>`;
            $("#md").classList.add("on");
            $("#cl").onclick = close_;
        }

        $("#board").addEventListener("click", e => {
            if (e.target.closest("[data-visit]")) return;
            const prev = e.target.closest("#pgPrev");
            if (prev && !prev.hasAttribute("disabled")) {
                const fullList = bmode === "recent" ? recentList() : topPlayersList();
                const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE));
                if (currentPage > 1) {
                    currentPage--;
                    render();
                    const b = $("#board");
                    if (b) scrollTo({ top: b.offsetTop - 70, behavior: "smooth" });
                }
                return;
            }
            const next = e.target.closest("#pgNext");
            if (next && !next.hasAttribute("disabled")) {
                const fullList = bmode === "recent" ? recentList() : topPlayersList();
                const totalPages = Math.max(1, Math.ceil(fullList.length / PAGE_SIZE));
                if (currentPage < totalPages) {
                    currentPage++;
                    render();
                    const b = $("#board");
                    if (b) scrollTo({ top: b.offsetTop - 70, behavior: "smooth" });
                }
                return;
            }
            const r = e.target.closest("[data-i]");
            if (r) {
                const idx = +r.dataset.i;
                if (bmode === "recent") {
                    const fullList = recentList();
                    const pageItems = fullList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
                    showDetail(pageItems[idx]);
                } else {
                    showDetail(topPlayersList()[idx]);
                }
            }
        });

        const lbSwitch = $("#lbSwitch");
        if (lbSwitch) {
            lbSwitch.onclick = e => {
                const b = e.target.closest("[data-bm]");
                if (b) {
                    bmode = b.dataset.bm;
                    currentPage = 1;
                    render();
                }
            };
        }

        // payment modal
        let adminOpen = false;
        const close_ = () => { $("#md").classList.remove("on"); adminOpen = false; }; let img = "";
        function openFund() {
            snd("kaching"); img = ""; $("#mb").innerHTML = `<h2>${esc(CFG.btn)}</h2><p style="margin:0;color:var(--mut)">This payment buys a place on the supporter board. That’s the whole deal: no meal, charity, or other product is included. Staying anonymous is fine too.</p>
${CFG.anonAllowed === false ? "" : `<label style="display:flex;align-items:center;margin-top:16px;cursor:pointer"><input type="checkbox" id="an">Pay anonymously (no name, no link, no logo)</label>`}
<div id="idf"><label for="f1">Name</label><input id="f1" maxlength="60" placeholder="Acme Analytics"><label for="f2">Any link</label><input id="f2" maxlength="140" placeholder="https://yourproduct.com or https://x.com/you"><p class="hint">Social profiles show their brand icon. Websites show their logo automatically.</p><div id="logobox" style="display:none;margin:8px 0 12px;padding:8px 12px;background:#f7f5f0;border:1.5px solid #e2ded5;border-radius:12px;align-items:center;gap:12px"></div></div>
<label for="f3">How much do you want to pay? (USD)</label><input id="f3" type="number" min="1" step="1" inputmode="numeric" placeholder="Any amount, $1 or more"><div class="chips" id="qa"></div>
<label for="f4">Short description or message <span id="wc" class="hint" style="display:inline">0 / 500 words</span></label><textarea id="f4" placeholder="What are you building? Or just say hi."></textarea>
<div class="public-entry-consent"><label for="publicConsent"><input type="checkbox" id="publicConsent"><span>I agree to the <a href="/terms" data-route="terms">Terms</a> and <a href="/rules" data-route="rules">Board Rules</a>, have read the <a href="/privacy" data-route="privacy">Privacy Notice</a>, and consent to this listing being stored and shown publicly with its amount, message and entry time. Anonymous hides my name and link only. I confirm I’m 18 or older, or my parent/guardian has approved this listing and will complete checkout, and I have permission to submit its name, link and message.</span></label></div>
${CFG.pay ? `<div class="note">Dodo Payments securely processes checkout. Your board entry is added automatically after Dodo confirms the payment.</div>` : `<div class="note"><b>Checkout is unavailable.</b> Only confirmed Supabase entries appear on the leaderboard.</div>`}
<p style="display:flex;gap:10px;margin-top:16px"><button class="btn" id="go" style="flex:1;text-align:center" ${CFG.pay ? "" : "disabled"}>${CFG.pay ? "Continue to secure checkout" : "Checkout unavailable"}</button><button class="btn w" id="cl">Cancel</button></p>`;
            $("#md").classList.add("on"); $("#cl").onclick = close_;
            if ($("#an")) $("#an").onchange = () => { $("#idf").style.display = $("#an").checked ? "none" : "block" };
            $("#qa").innerHTML = [1, 5, 10, 25, 50].map(a => `<button class="chip" data-a="${a}">$${a}</button>`).join(""); $("#qa").onclick = e => { const c = e.target.closest("[data-a]"); if (c) $("#f3").value = c.dataset.a };
            const wc = () => $("#f4").value.trim().split(/\s+/).filter(Boolean).length; $("#f4").oninput = () => { $("#wc").textContent = wc() + " / 500 words" };

            // Instant logo detection within ms for social profiles or normal websites
            const updateLogoBox = () => {
                const u = ($("#f2").value || "").trim();
                const box = $("#logobox");
                if (!box) return;
                if (!u) { box.style.display = "none"; img = ""; return; }
                const s = getSocialInfo(u);
                if (s) {
                    img = "";
                    box.style.display = "flex";
                    box.innerHTML = `<div style="width:38px;height:38px;border-radius:10px;background:${s.bg};display:grid;place-items:center;flex-shrink:0">${s.svg}</div><div style="min-width:0;flex:1"><div style="font-size:13px;font-weight:700;color:var(--ink)">${esc(s.name)} profile</div><div style="font-size:11.5px;color:#0E9F6E;font-weight:600">Brand icon ✓</div></div>`;
                    return;
                }
                const clean = u.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
                const h = clean.split('/')[0].toLowerCase();
                if (h && h.includes('.')) {
                    const logoUrl = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(h) + '&sz=128';
                    img = logoUrl;
                    box.style.display = "flex";
                    box.innerHTML = `<div style="width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid #e5e3dc;display:grid;place-items:center;overflow:hidden;flex-shrink:0"><img src="${logoUrl}" style="width:26px;height:26px;object-fit:contain" onerror="this.src='https://icons.duckduckgo.com/ip3/${encodeURIComponent(h)}.ico'"></div><div style="min-width:0;flex:1"><div style="font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h)}</div><div style="font-size:11.5px;color:#0E9F6E;font-weight:600">Website logo ✓</div></div>`;
                    return;
                }
                box.style.display = "none"; img = "";
            };
            $("#f2").oninput = updateLogoBox;

            $("#go").onclick = async () => {
                const anon = Boolean($("#an")?.checked), n = anon ? "Anonymous legend" : $("#f1").value.trim(), u = anon ? "" : $("#f2").value.trim(), a = Math.round((+$("#f3").value) * 100) / 100, d = $("#f4").value.trim();
                if (!CFG.pay) return toast("Checkout is unavailable. Only confirmed Supabase entries appear on the board.");
                if (!$("#publicConsent").checked) return toast("Please agree to the terms and confirm you’re allowed to submit this listing.");
                if (!n) return toast("Add your name or product name, or tick “Pay anonymously”."); if (u && !safeUrl(u) && u[0] !== "@") return toast("That link doesn’t look valid. Use https://…"); if (!(a >= 1)) return toast("Enter an amount of $1 or more."); if (wc() > 500) return toast("That’s over 500 words.");
                if (CFG.pay) {
                    const button = $("#go");
                    button.disabled = true;
                    button.textContent = "Preparing secure checkout…";
                    try {
                        const response = await fetch(`${SUPABASE_URL}/functions/v1/dodo-create-checkout`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
                            body: JSON.stringify({ name: n, url: safeUrl(u) || u, amount: a, desc: d, img: anon ? "" : img, anon, consent: true })
                        });
                        if (response.ok) {
                            const result = await response.json();
                            if (!result.checkout_url) throw new Error("Dodo did not return a checkout link.");
                            window.location.assign(result.checkout_url);
                            return;
                        }
                        if (response.status !== 404) {
                            const result = await response.json().catch(() => ({}));
                            throw new Error(result.error || "Secure checkout could not be started.");
                        }
                        // Keep the configured legacy payment link usable until the
                        // Supabase checkout function has been deployed.
                        window.open(CFG.pay, "_blank", "noopener");
                        close_();
                        return toast("Checkout opened. Automatic listing activates after Dodo setup is finished.");
                    } catch (err) {
                        button.disabled = false;
                        button.textContent = "Continue to secure checkout";
                        return toast("Could not start checkout: " + (err instanceof Error ? err.message : String(err)));
                    }
                }
            }
        }
        $("#fund").onclick = () => openFund();
        $("#md").addEventListener("click", e => { if (e.target.id === "md") close_() }); addEventListener("keydown", e => { if (e.key === "Escape") close_() });
        // do-nothing challenge
        let chT = 0, chOn = false, chRaf; const cs = $("#cs");
        const tier = s => s < 5 ? "You lasted about as long as a New Year’s resolution." : s < 15 ? "Decent. Your phone is judging you." : s < 30 ? "Impressive. A true beginner of nothing." : s < 60 ? "Elite stillness. Please consider a career in nothing." : "Legendary. I’m honestly a little jealous.";
        function stopCh(fail) { if (!chOn) return; chOn = false; cancelAnimationFrame(chRaf); const s = (performance.now() - chT) / 1000; let b = 0; try { b = +localStorage.getItem("idn_best") || 0; if (s > b) { b = s; localStorage.setItem("idn_best", s) } } catch (e) { } $("#ct").textContent = s.toFixed(1) + "s"; if (fail) { snd("sad"); $("#cm").textContent = tier(s); $("#cb").textContent = "Your best: " + b.toFixed(1) + "s (stored on this device)"; cs.textContent = "Try again" } }
        function tick() { if (!chOn) return; $("#ct").textContent = ((performance.now() - chT) / 1000).toFixed(1) + "s"; chRaf = requestAnimationFrame(tick) }
        cs.onclick = e => { e.preventDefault(); snd("dun"); $("#cm").textContent = "Don’t touch anything..."; cs.style.visibility = "hidden"; setTimeout(() => { chOn = true; chT = performance.now(); tick(); let mv = 0; const E = ["pointermove", "keydown", "touchstart", "pointerdown", "wheel", "scroll", "visibilitychange"], f = ev => { if (ev.type === "pointermove" && ++mv < 4) return; E.forEach(t => removeEventListener(t, f, true)); cs.style.visibility = "visible"; stopCh(true) }; E.forEach(t => addEventListener(t, f, true)) }, 500) };
        // the big red button
        let rn = 0; const R1 = ["I said don’t.", "Wow. Rude.", "That was my one rule.", "Okay. Last warning."], R2 = ["Still here? The internet isn’t. Kidding, it’s fine.", "You have the self-control of a dropped ice cream.", "Nothing happened. You did that.", "Go outside. Or at least stand up.", "Impressive commitment to a bad decision.", "I’ve seen your browser history. Keep pressing."];
        function bomb() { const L = ["Removing cat videos…", "Deleting group chats… you’re welcome", "Cancelling Mondays…", "Unsubscribing from newsletters…", "Erasing your browser history… we saw it", "Shutting down the wifi…", "Deleting the noodle recipes… no, wait"]; $("#mb").innerHTML = `<h2>Deleting the internet…</h2><div class="bar2"><i id="pb"></i></div><p id="pl" class="hint">Starting…</p><p class="hint">(not real, obviously)</p>`; $("#md").classList.add("on"); let p = 0, k = 0; const t = setInterval(() => { p += Math.random() * 9 + 3; snd("tick", 20); if (p >= 99) { p = 99; clearInterval(t); snd("scratch"); $("#pl").textContent = "Wait. That’s a lot of work."; setTimeout(() => { snd("sad"); $("#mb").innerHTML = `<h2>Cancelled.</h2><p>I’m too lazy to finish deleting the internet. You’re welcome.</p><p style="display:flex;gap:10px"><button class="btn" id="b1" style="flex:1;text-align:center">${esc(CFG.btn)}</button><button class="btn w" id="b2">Phew</button></p>`; $("#b1").onclick = () => openFund(); $("#b2").onclick = close_ }, 1500) } else if (Math.random() < .5) $("#pl").textContent = L[k++ % L.length]; $("#pb").style.width = p + "%" }, 350) }
        $("#rb").onclick = () => { rn++; snd(rn === 5 ? "alarm" : rn % 2 ? "horn" : "boom"); $("#rc").textContent = "Presses: " + rn; if (rn === 5) return bomb(); $("#rm").textContent = rn < 5 ? R1[rn - 1] : R2[Math.floor(Math.random() * R2.length)] };
        // roast machine (roasts the name, never the person)
        const RO = ["{n} sounds like a startup with 3 users. Two of them are you.", "I looked up {n}. Even my search engine yawned.", "{n} has the energy of a Monday email.", "The roadmap for {n} is a screenshot in a Notes app.", "{n} pivoted so many times it forgot where it started.", "If {n} were a snack, it’d be the last rice cake in the pack.", "{n} is why “coming soon” exists.", "Bold to call it {n}. Bolder to launch on a Friday.", "{n} is doing great. In the founder’s head.", "I’m unemployed and even I’d ask {n} for a business plan.", "{n} has a five-year plan. Year one is still loading.", "{n}: 12 features, 0 users, 100% confidence.", "People say {n} is ahead of its time. Time is not interested.", "{n} walked so that someone else could run it properly.", "{n} is the kind of name that sounds funded. It isn’t."];
        let rl = -1; $("#rg").onclick = () => { const n = $("#ri").value.trim(); if (!n) return toast("Type a name or product first."); let k; do { k = Math.floor(Math.random() * RO.length) } while (k === rl); rl = k; snd("rim"); $("#ro").textContent = RO[k].replace(/\{n\}/g, n); $("#ra").style.display = "block"; $("#rf").textContent = CFG.btn };
        $("#rs").onclick = async () => { try { await navigator.clipboard.writeText($("#ro").textContent + " " + location.href); toast("Roast copied.") } catch (e) { toast("Couldn’t copy.") } }; $("#rf").onclick = () => openFund();
        // excuses
        const EX = ["I had a plan. The plan had a nap in it.", "The inbox and I are on a break.", "I was about to start, then lunch got in the way.", "There is one deadline. It’s next year.", "My to-do list is a work of fiction.", "Productivity is a lifestyle. I’m exploring other lifestyles.", "I’m waiting for the right moment. It’s been a while.", "I do my best work later. Much later.", "I could, but the couch has seniority.", "I’m saving my energy for something important. Not found yet.", "The wifi was too comfortable to leave.", "I’m not late. I’m early for tomorrow.", "I was going to start, but the noodles needed me.", "I can’t work on an empty stomach. Or a full one."];
        let xi = -1; $("#exb").onclick = () => { snd("boing"); let n; do { n = Math.floor(Math.random() * EX.length) } while (n === xi); xi = n; $("#ex").textContent = EX[n] };
        $("#exc").onclick = async () => { try { await navigator.clipboard.writeText($("#ex").textContent); toast("Copied. Use it wisely.") } catch (e) { toast("Couldn’t copy.") } };
        // exit intent (once)
        let ex1 = false; document.addEventListener("mouseout", e => { if (!e.relatedTarget && e.clientY <= 0 && !ex1 && !$("#md").classList.contains("on")) { ex1 = true; snd("dun"); $("#mb").innerHTML = `<div class="exit-pop"><div class="exit-wave" aria-hidden="true">👋</div><div class="exit-kicker">BEFORE YOU GO</div><h2>Already heading out?</h2><p>We barely got to know each other. I mean, I mostly sat here—but still.</p><div class="exit-note">Take care out there. Try not to get a job on the way.</div><div class="exit-actions"><button class="btn exit-primary" id="a1">Leave a noodle tip</button><button class="btn w exit-secondary" id="a2">Catch you later</button></div></div>`; $("#md").classList.add("on"); $("#a1").onclick = () => openFund(); $("#a2").onclick = () => { close_(); toast("Okay, bye. I’ll still be here.") } } });
        // ===== FOUNDER CONSOLE (Authenticated securely against Supabase; hidden from normal users) =====
        const ADMIN_SESSION_KEY = "dn_admin_unlocked_v1";
        let unlocked = false;
        try { unlocked = sessionStorage.getItem(ADMIN_SESSION_KEY) === "1"; } catch (e) { }
        let atab = "entries", editing = null;
        async function refreshAdminData() {
            try {
                const remote = await StorageService.syncFromSupabase();
                if (remote !== null) {
                    LOCAL = remote;
                    await refreshLiveLeaderboard();
                }
            } catch (err) {
                console.warn("Admin entry refresh failed:", err);
            }
            updateAdminDbStatus();
        }
        function updateAdminDbStatus() {
            const status = $("#adminDbStatus");
            if (!status) return;
            status.textContent = SupabaseService.isConnected
                ? "Supabase connected · entries shared across browsers"
                : "Supabase not connected · local data is not shared";
            status.style.color = SupabaseService.isConnected ? "#087e59" : "#b42318";
            status.title = SupabaseService.isConnected ? "" : SupabaseService.lastErrorMessage;
        }
        function adminEntryMarkup() {
            return LOCAL.map(x => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1.5px solid var(--ink);border-radius:10px;background:#fff;">
                <div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><b>${esc(x.name)}</b> - ${money(x.amt)} <small style="color:var(--mut);">(${new Date(x.t).toLocaleDateString()})</small>${x.src === "pending" ? `<small style="display:block;color:#b42318;font-weight:800">NOT SHARED · THIS BROWSER ONLY</small>` : ""}</div>
                <div style="display:flex;gap:6px;">${x.src === "pending" ? `<button class="btn sm" style="padding:4px 8px;font-size:12px;" data-sync="${esc(x.id)}">Sync</button>` : ""}<button class="btn sm" style="padding:4px 8px;font-size:12px;" data-ed="${esc(x.id)}">Edit</button><button class="btn sm w" style="padding:4px 8px;font-size:12px;" data-dl="${esc(x.id)}">Delete</button></div>
            </div>`).join("");
        }
        function bindAdminEntryActions() {
            $$('[data-ed]').forEach(b => b.onclick = () => { editing = LOCAL.find(x => x.id === b.dataset.ed); renderAdmin(); });
            $$('[data-dl]').forEach(b => b.onclick = async () => {
                const delId = b.dataset.dl;
                try {
                    await StorageService.deleteEntry(delId);
                    LOCAL = StorageService.getEntries();
                } catch (err) {
                    toast("Supabase delete failed: " + (err instanceof Error ? err.message : String(err)));
                    return;
                }
                renderAdmin();
                await refreshLiveLeaderboard();
                toast("Deleted from the shared board.");
            });
            $$('[data-sync]').forEach(b => b.onclick = async () => {
                const pending = LOCAL.find(x => x.id === b.dataset.sync);
                if (!pending) return;
                try {
                    LOCAL = await StorageService.addEntry({ ...pending, src: "manual" });
                    renderAdmin();
                    await refreshLiveLeaderboard();
                    toast("Entry synced to Supabase.");
                } catch (err) {
                    LOCAL = StorageService.getEntries();
                    refreshAdminEntryList();
                    toast("Sync failed: " + (err instanceof Error ? err.message : String(err)));
                }
            });
        }
        function refreshAdminEntryList() {
            const list = $("#adminEntriesList");
            if (!list) return;
            list.innerHTML = adminEntryMarkup();
            const entriesTab = $('[data-tab="entries"]');
            if (entriesTab) entriesTab.textContent = `Entries (${LOCAL.length})`;
            bindAdminEntryActions();
        }
        function openFounderConsole() {
            if (!unlocked) {
                adminOpen = false;
                $("#mb").innerHTML = `<h2>Founder Console</h2>
                <p style="color:var(--mut);margin:0 0 16px;">Passcode is verified securely against Supabase. No password is ever stored in code or URLs.</p>
                <label for="pw">Supabase Passcode</label>
                <input type="password" id="pw" placeholder="Enter passcode" style="margin-bottom:14px">
                <p style="display:flex;gap:10px;"><button class="btn sm" id="pwb" style="flex:1;">Unlock Console</button><button class="btn sm w" id="pwc">Cancel</button></p>`;
                $("#md").classList.add("on");
                $("#pwc").onclick = close_;
                $("#pwb").onclick = async () => {
                    const entered = $("#pw").value;
                    const btn = $("#pwb");
                    btn.textContent = "Verifying...";
                    btn.disabled = true;
                    const ok = await SupabaseService.verifyAdminPasscode(entered);
                    btn.disabled = false;
                    btn.textContent = "Unlock Console";
                    if (ok) {
                        unlocked = true;
                        try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch (e) { }
                        snd("fan");
                        await refreshAdminData();
                        renderAdmin();
                        toast("Welcome, Founder.");
                    } else {
                        snd("sad");
                        toast("Incorrect passcode.");
                        $("#pw").value = "";
                        $("#pw").focus();
                    }
                };
                $("#pw").onkeydown = (e) => { if (e.key === "Enter") $("#pwb").click(); };
                setTimeout(() => $("#pw")?.focus(), 120);
                return;
            }
            refreshAdminData().finally(() => renderAdmin());
        }

        function renderAdmin() {
            if (!unlocked) return openFounderConsole();
            adminOpen = true;
            $("#md").classList.add("on");
            let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div><h2 style="margin:0;">Founder Console</h2><small id="adminDbStatus" style="font-weight:800"></small></div>
                <button class="chip" id="adCl">Close</button>
            </div>
            <div class="tabs" style="margin-bottom:14px;">`;
            [["entries", "Entries (" + LOCAL.length + ")"], ["settings", "Settings"], ["backup", "Backup"]].forEach(([k, l]) => {
                h += `<button class="tab ${atab === k ? "on" : ""}" data-tab="${k}">${l}</button>`;
            });
            h += `</div>`;

            if (atab === "entries") {
                const E = editing || { name: "", url: "", amt: "", desc: "", t: Date.now(), anon: false };
                h += `<div class="panel" style="margin-bottom:14px;">
                    <h3>${editing ? "Edit entry" : "Add manual entry"}</h3>
                    <label>Name</label><input id="e1" value="${esc(E.name)}">
                    <label>URL (optional)</label><input id="e2" value="${esc(E.url)}">
                    <label>Amount (USD)</label><input id="e3" type="number" step="1" value="${E.amt || ""}">
                    <label>Message</label><textarea id="e4">${esc(E.desc || "")}</textarea>
                    <label style="display:flex;align-items:center;margin:8px 0;"><input type="checkbox" id="e6" ${E.anon ? "checked" : ""}> Anonymous</label>
                    <p style="display:flex;gap:8px;"><button class="btn sm" id="esv">Save entry</button>${editing ? `<button class="btn sm w" id="ecn">Cancel</button>` : ""}</p>
                </div>
                <div id="adminEntriesList" style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">${adminEntryMarkup()}</div>
                <p style="margin-top:12px;display:flex;gap:8px;"><button class="chip" id="cla">Clear local previews / pending</button><button class="chip" id="csv">Export CSV</button></p>
                <div id="csvo"></div>`;
            }

            if (atab === "settings") {
                h += `<div class="panel">
                    <label>Payment URL (optional checkout / stripe)</label><input id="s1" value="${esc(CFG.pay)}" placeholder="https://...">
                    <label>Timezone for daily reset</label><input id="s2" value="${esc(CFG.tz)}">
                    <label>Hero tag</label><input id="s3" value="${esc(CFG.tag)}">
                    <label>Main button label</label><input id="s4" value="${esc(CFG.btn)}">
                    <label>Small text under button (optional override)</label><input id="s5" value="${esc(CFG.sub)}" placeholder="Leave blank to show the local-time meal">
                    <p><button class="btn sm" id="ssv">Save Settings</button></p>
                </div>`;
            }

            if (atab === "backup") {
                h += `<div class="panel">
                    <label>Export JSON</label><textarea id="b1" style="min-height:120px;">${esc(JSON.stringify({ cfg: CFG, entries: LOCAL }))}</textarea>
                    <label>Import JSON</label><textarea id="b2" style="min-height:80px;"></textarea>
                    <p><button class="btn sm" id="bim">Import JSON</button></p>
                </div>`;
            }

            $("#mb").innerHTML = h;
            updateAdminDbStatus();
            $("#adCl").onclick = close_;
            $$("[data-tab]").forEach(b => b.onclick = () => { atab = b.dataset.tab; editing = null; renderAdmin(); });
            if (atab === "entries") bindAdminEntryActions();
            const on = (i, f) => { const el = $("#" + i); if (el) el.onclick = f; };

            on("esv", async () => {
                const n = $("#e1").value.trim(), a = +$("#e3").value;
                if (!n || !(a > 0)) return toast("Name and positive amount are required.");
                const o = { name: n, url: safeUrl($("#e2").value) || $("#e2").value.trim(), amt: a, desc: $("#e4").value.trim(), t: Date.now(), anon: $("#e6").checked, src: "manual" };
                const newM = { id: (editing && editing.id) ? editing.id : "m" + Date.now(), img: "", ...o };
                try {
                    if (editing && editing.id) {
                        await StorageService.updateEntry(editing.id, newM);
                    } else {
                        await StorageService.addEntry(newM);
                    }
                } catch (err) {
                    LOCAL = StorageService.getEntries();
                    refreshAdminEntryList();
                    toast("Supabase save failed: " + (err instanceof Error ? err.message : String(err)));
                    return;
                }
                LOCAL = StorageService.getEntries();
                editing = null;
                renderAdmin();
                await refreshLiveLeaderboard();
                toast("Saved to the shared Supabase board.");
            });

            on("ecn", () => { editing = null; renderAdmin(); });
            on("cla", () => { if (confirm("Clear only this browser’s preview and unsynced entries? Shared Supabase entries will remain.")) { LOCAL = LOCAL.filter(x => x.src !== "preview" && x.src !== "pending"); saveLocal(); renderAdmin(); render(); } });
            on("csv", () => { $("#csvo").innerHTML = `<textarea style="min-height:100px;margin-top:8px;">${esc("name,url,amount,date,source\n" + LOCAL.map(x => [x.name, x.url, x.amt, new Date(x.t).toISOString(), x.src].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n"))}</textarea>`; });
            on("ssv", async () => {
                const next = {
                    ...CFG,
                    pay: $("#s1").value.trim(),
                    tz: $("#s2").value.trim() || "Asia/Kolkata",
                    tag: $("#s3").value,
                    btn: $("#s4").value.trim() || DEF.btn,
                    sub: $("#s5").value
                };
                const keys = ["pay", "tz", "tag", "btn", "sub", "heroHead", "heroAccent", "cur", "anonAllowed", "roastEnabled", "soundsEnabled"];
                const shared = Object.fromEntries(keys.filter(key => Object.prototype.hasOwnProperty.call(next, key)).map(key => [key, next[key]]));
                if (Array.isArray(next.lines)) shared.lines = next.lines;
                if (Array.isArray(next.dodge)) shared.dodge = next.dodge;
                if (!await SupabaseService.savePublicSiteConfig(shared)) {
                    toast("Shared settings were not saved: " + (SupabaseService.lastErrorMessage || "Supabase rejected the write."));
                    return;
                }
                Object.assign(CFG, next);
                saveCfg();
                render();
                toast("Settings saved to Supabase for all browsers.");
            });
            on("bim", async () => {
                try {
                    const j = JSON.parse($("#b2").value);
                    if (j.cfg) {
                        const keys = ["pay", "tz", "tag", "btn", "sub", "heroHead", "heroAccent", "cur", "anonAllowed", "roastEnabled", "soundsEnabled"];
                        const shared = Object.fromEntries(keys.filter(key => Object.prototype.hasOwnProperty.call(j.cfg, key)).map(key => [key, j.cfg[key]]));
                        if (Array.isArray(j.cfg.lines)) shared.lines = j.cfg.lines;
                        if (Array.isArray(j.cfg.dodge)) shared.dodge = j.cfg.dodge;
                        if (!await SupabaseService.savePublicSiteConfig(shared)) throw new Error(SupabaseService.lastErrorMessage || "Could not save shared settings.");
                        Object.assign(CFG, j.cfg);
                        saveCfg();
                    }
                    if (Array.isArray(j.entries)) {
                        for (const entry of j.entries) await StorageService.addEntry({ ...entry, src: "manual" });
                        LOCAL = StorageService.getEntries();
                    }
                    renderAdmin();
                    render();
                    toast("Backup imported to Supabase.");
                } catch (e) {
                    toast("Import failed: " + (e instanceof Error ? e.message : "Invalid JSON format."));
                }
            });
        }

        // Keyboard shortcut removed for security

        // ===== CLICK EFFECTS: every click, even on empty space, bursts and shakes the 3D scene =====
        let RM2 = false; try { RM2 = localStorage.getItem("idn_motion") === "off" } catch (e) { }
        document.documentElement.classList.toggle("nomo", RM2);
        const mb = document.getElementById("mot"); const mbl = () => mb.textContent = "Motion: " + (RM2 ? "off" : "on"); mbl(); mb.onclick = () => { RM2 = !RM2; try { localStorage.setItem("idn_motion", RM2 ? "off" : "on") } catch (e) { } document.documentElement.classList.toggle("nomo", RM2); mbl() };
        (function () {
            const CL = ["#2F4BFF", "#FFD23F", "#101010", "#E8412C", "#0E9F6E"], WD = ["zzz", "nothing.", "nap?", "meh", "+0", "bruh", "nope", "lol", "still here?", "no work"];
            function burst(x, y) {
                if (RM2 || document.querySelectorAll(".cb").length > 140) return;
                const add = (el, kf, o) => { el.className += " cb"; el.style.left = x + "px"; el.style.top = y + "px"; document.body.appendChild(el); el.animate(kf, o).onfinish = () => el.remove() };
                const glow = document.createElement("div"); glow.style.cssText = "width:40px;height:40px;border-radius:50%;background:" + CL[Math.floor(Math.random() * 2)] + "55"; add(glow, [{ transform: "translate(-50%,-50%) scale(.3)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(6)", opacity: 0 }], { duration: 600, easing: "ease-out" });
                for (let k = 0; k < 2; k++) { const r = document.createElement("div"); r.className = "cr"; add(r, [{ transform: "translate(-50%,-50%) scale(.4)", opacity: .9 }, { transform: "translate(-50%,-50%) scale(" + (9 + k * 5) + ")", opacity: 0 }], { duration: 600 + k * 250, delay: k * 90, easing: "ease-out", fill: "backwards" }) }
                for (let i = 0; i < 22; i++) {
                    const p = document.createElement("div"), a = Math.random() * 6.283, d = 60 + Math.random() * 130, z = 7 + Math.random() * 10; p.style.cssText = `width:${z}px;height:${z}px;background:${CL[i % 5]};border:2px solid #101010;border-radius:${i % 3 ? "50%" : "3px"}`;
                    add(p, [{ transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px),calc(-50% + ${Math.sin(a) * d + 60}px)) scale(.3) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 700 + Math.random() * 600, easing: "cubic-bezier(.15,.8,.25,1)" })
                }
                if (Math.random() < .6) { const w = document.createElement("div"); w.className = "cw"; w.textContent = WD[Math.floor(Math.random() * WD.length)]; add(w, [{ transform: "translate(-50%,-30%) scale(.5) rotate(-6deg)", opacity: 0 }, { transform: "translate(-50%,-110%) scale(1.1) rotate(3deg)", opacity: 1, offset: .25 }, { transform: "translate(-50%,-230%) scale(1) rotate(0)", opacity: 0 }], { duration: 1300, easing: "ease-out" }) }
            }
            window.burstAt = burst; addEventListener("pointerdown", e => { burst(e.clientX, e.clientY); if (window.shock) shock(e.clientX, e.clientY, 1); if (!e.target.closest("a,button,.row,.lr,.pc,.opt,.chip,.rbtn,input,textarea,select")) snd(CLK[Math.floor(Math.random() * CLK.length)], 30) }, { passive: true })
        })();
        // ===== 3D BACKGROUND (Three.js): floating shapes that drift with scroll, follow the mouse and get knocked around by clicks =====
        (function () {
            try {
                const cv = document.getElementById("gl"), R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false, powerPreference: "high-performance" }); R.setPixelRatio(Math.min(devicePixelRatio, 1.25));
                const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(45, 1, .1, 100); C.position.z = 14;
                S.add(new THREE.AmbientLight(0xffffff, .7)); const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(4, 6, 8); S.add(dl);
                const blueLight = new THREE.PointLight(0x2F4BFF, 1.5, 40), yellowLight = new THREE.PointLight(0xFFD23F, 1.5, 40); S.add(blueLight, yellowLight);
                const COLS = [0x2F4BFF, 0xFFD23F, 0x101010, 0xE8412C, 0x0E9F6E, 0xffffff];
                const GEO = [() => new THREE.IcosahedronGeometry(1, 0), () => new THREE.OctahedronGeometry(1, 0), () => new THREE.BoxGeometry(1.3, 1.3, 1.3), () => new THREE.TorusGeometry(.8, .28, 12, 28), () => new THREE.ConeGeometry(.8, 1.5, 5), () => new THREE.SphereGeometry(.9, 16, 12), () => new THREE.DodecahedronGeometry(1, 0), () => new THREE.TorusKnotGeometry(.6, .2, 72, 8), () => new THREE.TetrahedronGeometry(1.1, 0), () => new THREE.CylinderGeometry(.7, .7, .4, 18)];
                let HW = 8, HH = 5.8, P = 35; const sh = [], N = innerWidth < 700 ? 20 : 38, mob = () => innerWidth < 700;
                function dims() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix(); HH = Math.tan(C.fov * Math.PI / 360) * C.position.z; HW = HH * C.aspect; P = 6 * HH } dims();
                for (let i = 0; i < N; i++) {
                    const wire = i % 5 === 4, m = new THREE.Mesh(GEO[i % GEO.length](), wire ? new THREE.MeshBasicMaterial({ color: 0x101010, wireframe: true }) : new THREE.MeshStandardMaterial({ color: COLS[i % COLS.length], flatShading: true, roughness: .4, metalness: .15 })); S.add(m);
                    sh.push({ m, x: (Math.random() < .5 ? -1 : 1) * (.35 + Math.random() * .65), f: i / N, z: -5 + Math.random() * 7, s: .35 + Math.random() * .55, rx: (Math.random() - .5) * 1.6, ry: (Math.random() - .5) * 2, o: [0, 0, 0], v: [0, 0, 0], pulse: 0, sp: 0 })
                }
                // one big hero shape, top right
                sh[7].x = .6; sh[7].f = .985; sh[7].z = -1; sh[7].s = 1.5;
                const PN = mob() ? 120 : 260, dustPos = new Float32Array(PN * 3), dustX = [], dustF = [];
                for (let i = 0; i < PN; i++) { dustX.push(Math.random() * 2 - 1); dustF.push(Math.random()); dustPos[i * 3 + 2] = -6 + Math.random() * 10; }
                const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
                const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x101010, size: .07, transparent: true, opacity: .5, sizeAttenuation: true })); dust.frustumCulled = false; S.add(dust);
                let px = 0, py = 0, cy = 0, scrollTop = window.scrollY, lastScrollAt = 0, lastFrame = performance.now();
                addEventListener("pointermove", e => { px = e.clientX / innerWidth * 2 - 1; py = -(e.clientY / innerHeight * 2 - 1) }, { passive: true });
                addEventListener("scroll", () => { scrollTop = window.scrollY; lastScrollAt = performance.now() }, { passive: true });
                addEventListener("resize", () => { dims(); frame(0, performance.now()) });
                window.shock = (cx, cyp, k = 1) => { if (RM2) return; const wx = (cx / innerWidth * 2 - 1) * HW, wy = cy + (-(cyp / innerHeight * 2 - 1)) * HH; sh.forEach(s => { const p = s.m.position, dx = p.x - wx, dy = p.y - wy, d = Math.hypot(dx, dy) || .01, f = k * 9 / (1 + d * d * .07); s.v[0] += dx / d * f; s.v[1] += dy / d * f; s.v[2] += (Math.random() - .4) * f * .5; s.sp += (Math.random() - .5) * f * 1.2; s.pulse = Math.max(s.pulse, Math.min(1, f / 6)) }) };
                function frame(dt, t) {
                    cy = -scrollTop / innerHeight * 2 * HH; C.position.set(px * .5, cy + py * .35, 14); C.lookAt(px * .2, cy, 0);
                    blueLight.position.set(Math.sin(t * .0007) * 9, cy + 4 + Math.cos(t * .0005) * 3, 6);
                    yellowLight.position.set(Math.cos(t * .0006) * 9, cy - 3 + Math.sin(t * .0008) * 3, 6);
                    const wx = px * HW, wy = cy + py * HH;
                    sh.forEach(s => {
                        const base = -s.f * P, off = (((base - cy) % P) + P) % P - P / 2;
                        const current = s.m.position;
                        if (dt) { const dx = current.x - wx, dy = current.y - wy, d = Math.hypot(dx, dy); if (d < 3.4) { const f = (3.4 - d) / 3.4 * 16 * dt; s.v[0] += dx / (d || .1) * f; s.v[1] += dy / (d || .1) * f; } }
                        for (let a = 0; a < 3; a++) { s.v[a] += -3 * s.o[a] * dt; s.v[a] *= Math.pow(.04, dt); s.o[a] += s.v[a] * dt }
                        s.sp *= Math.pow(.15, dt); s.pulse *= Math.pow(.02, dt);
                        s.m.position.set(s.x * HW * (mob() ? .9 : 1) + Math.cos(t * .0008 + s.f * 13) * .6 + s.o[0], cy + off + Math.sin(t * .0012 + s.f * 20) * .8 + s.o[1], s.z + s.o[2]);
                        s.m.rotation.x += (s.rx + s.sp) * dt; s.m.rotation.y += (s.ry + s.sp * .7) * dt;
                        s.m.scale.setScalar((mob() ? .75 : 1) * s.s * (1 + s.pulse * .35))
                    });
                    for (let i = 0; i < PN; i++) { dustPos[i * 3] = dustX[i] * HW * 1.3; dustPos[i * 3 + 1] = cy + (((-dustF[i] * P - cy) % P) + P) % P - P / 2 + Math.sin(t * .0004 + i) * .3; }
                    dustGeo.attributes.position.needsUpdate = true;
                    R.render(S, C)
                }
                (function loop(now) {
                    requestAnimationFrame(loop);
                    if (document.hidden) { lastFrame = now; return }
                    const scrolling = now - lastScrollAt < 140;
                    const interval = 1000 / (scrolling ? 24 : 45);
                    if (now - lastFrame < interval) return;
                    const dt = RM2 ? 0 : Math.min(.05, (now - lastFrame) / 1000);
                    lastFrame = now;
                    frame(dt, RM2 ? 0 : now)
                })(performance.now());
            } catch (e) { const c = document.getElementById("gl"); if (c) c.style.display = "none" }
        })();

        // ===== SOUNDBOARD, cursor effects, tap tag, leaderboard polish, easter eggs =====
        const ghostHTML = () => `<div class="pod gp">${[1, 0, 2].map(i => `<button class="pc gh p${i + 1}" data-fund style="animation-delay:${i * 120}ms"><span class="medal">${i + 1}</span>${i === 0 ? `<div class="crown">${CROWN}</div>` : ""}<div class="av gq">?</div><h3>Up for grabs</h3><div class="amt">$?</div><span class="go">Take it ›</span></button>`).join("")}</div><p class="hint" style="text-align:center;margin-bottom:6px">Nobody on the board yet. Tap a spot and claim it.</p>`;
        document.addEventListener("click", e => { if (e.target.closest("[data-fund]")) openFund() });
        $("#sbn").textContent = Object.keys(SND).length;
        $("#sbg").innerHTML = Object.keys(SND).map(n => `<button class="chip" data-sn="${n}">${n}</button>`).join("");
        $("#sbg").onclick = e => { const b = e.target.closest("[data-sn]"); if (!b) return; if (!SOUND) return toast("Sound is off. Turn it on in the header."); welcomed = true; try { SND[b.dataset.sn]() } catch (x) { } };
        // typing + scrolling sounds
        addEventListener("keydown", e => { if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /^(Shift|Control|Alt|Meta|CapsLock|Tab|Escape)$/.test(e.key)) return; snd(e.key === " " ? "spaceclack" : e.key === "Enter" ? "enterclack" : "clack", 30) });
        let sy0 = scrollY, sacc = 0; addEventListener("scroll", () => { sacc += Math.abs(scrollY - sy0); sy0 = scrollY; if (sacc > 110) { sacc = 0; snd("tk", 70) } }, { passive: true });
        // leaderboard: 3D tilt on hover + amounts count up
        const tilt = e => { const c = e.target.closest(".pc:not(.gh),.lr"); if (!c || RM2) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(700px) rotateX(${-y * 9}deg) rotateY(${x * 11}deg) translateY(-3px)` };
        ["#board", "#hof"].forEach(q => { $(q).addEventListener("pointermove", tilt); $(q).addEventListener("pointerout", e => { const c = e.target.closest(".pc,.lr"); if (c) c.style.transform = "" }) });
        let lastSig = ""; const countUp = () => { const els = $$(".nv"), sig = bmode + location.hash + els.length; if (sig === lastSig) return; lastSig = sig; if (RM2) return; els.forEach(el => { const v = +el.dataset.v, t0 = performance.now(); (function f(t) { const p = Math.min(1, (t - t0) / 800), q = 1 - Math.pow(1 - p, 3); el.textContent = money(v * q); if (p < 1) requestAnimationFrame(f) })(t0) }) };
        ["#board", "#hof"].forEach(q => new MutationObserver(countUp).observe($(q), { childList: true }));
        // cursor: star trail, swish sound and a spinning 3D cube that follows the pointer
        (function () {
            const cube = $("#cube"), fine = matchMedia("(pointer:fine)").matches, CL = ["#2F4BFF", "#FFD23F", "#E8412C", "#0E9F6E", "#101010"];
            let lx = -1, ly = -1, tx = -100, ty = -100, cx = -100, cy = -100, vx = 0, vy = 0, ax = 20, ay = 30, a1 = 0, a2 = 0;
            function spark(x, y) { if (document.querySelectorAll(".sk").length > 50) return; const p = document.createElement("div"), z = 8 + Math.random() * 9; p.className = "cb sk"; p.style.cssText = `left:${x}px;top:${y}px;width:${z}px;height:${z}px;background:${CL[Math.floor(Math.random() * 5)]}`; document.body.appendChild(p); p.animate([{ transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1 }, { transform: `translate(calc(-50% + ${(Math.random() - .5) * 50}px),calc(-50% + ${30 + Math.random() * 50}px)) scale(.1) rotate(${Math.random() * 360}deg)`, opacity: 0 }], { duration: 700 + Math.random() * 300, easing: "ease-out" }).onfinish = () => p.remove() }
            addEventListener("pointermove", e => {
                const x = e.clientX, y = e.clientY; if (lx < 0) { lx = x; ly = y } const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy); lx = x; ly = y; vx = dx; vy = dy; tx = x + 22; ty = y + 22;
                if (e.pointerType === "mouse") { a1 += d; if (a1 > 24 && !RM2) { a1 = 0; spark(x, y) } a2 += d; if (a2 > 230) { a2 = 0; snd("softnote", 130) } if (fine && !RM2) cube.style.display = "block"; }
            }, { passive: true });
            (function loop() { requestAnimationFrame(loop); if (RM2) { cube.style.display = "none"; return } cx += (tx - cx) * .2; cy += (ty - cy) * .2; ax += vy * .5 + .9; ay += vx * .5 + 1.6; vx *= .88; vy *= .88; cube.style.transform = `translate3d(${cx}px,${cy}px,0) perspective(300px) rotateX(${ax}deg) rotateY(${ay}deg)` })()
        })();
        // tap tag + milestones
        let taps = 0; const TM = { 10: "10 taps. Impressive dedication to nothing.", 25: "25 taps. You should be working.", 50: "50 taps. We’re basically friends.", 75: "75 taps. Your finger needs a nap.", 100: "100 taps. Please buy me a noodle." };
        addEventListener("pointerdown", () => {
            taps++; $("#tapT").textContent = taps === 1 ? "nice. keep tapping · 1" : "taps: " + taps; if (!RM2) $("#tapTag").animate([{ transform: "scale(1.3)" }, { transform: "scale(1)" }], { duration: 220 });
            if (TM[taps]) { toast(TM[taps]); snd("fan"); if (!RM2) for (let i = 0; i < 6; i++)setTimeout(() => window.burstAt(Math.random() * innerWidth, Math.random() * innerHeight * .8), i * 140) }
        }, { passive: true });
        // easter eggs: konami code, and poking the sleeper
        const KN = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let ki = 0;
        addEventListener("keydown", e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; ki = k === KN[ki] ? ki + 1 : (k === KN[0] ? 1 : 0); if (ki === KN.length) { ki = 0; snd("fan"); toast("Party mode. Absolutely nothing was achieved."); if (!RM2) for (let i = 0; i < 10; i++)setTimeout(() => { const x = Math.random() * innerWidth, y = Math.random() * innerHeight; window.burstAt(x, y); if (window.shock) shock(x, y, 1.6) }, i * 160) } });
        // Sleeper expressions and reactions are isolated from the site's data and payment logic.
        (function () {
            const get = id => document.getElementById(id), svg = get("chs"), body = get("chw"), bubble = get("bub");
            if (!svg || !body || !bubble) return;
            const ids = ["eLc", "eRc", "eLo", "eRo", "eH", "eB", "mF", "mO", "mS", "mG", "hts", "stm"];
            const faces = { sleep: ["eLc", "eRc", "mF"], peek: ["eLo", "eRc", "mF"], wake: ["eLo", "eRo", "mO"], yawn: ["eLc", "eRc", "mO"], dizzy: ["eLo", "eRo", "mO"], happy: ["eH", "mS", "hts"], angry: ["eLo", "eRo", "eB", "mG", "stm"] };
            let face = "sleep", busy = false, bubbleTimer, resetTimer, lastReaction = "", fastTaps = [];
            const setFace = next => { face = next; ids.forEach(id => { const node = get(id); if (node) node.style.display = (faces[next] || faces.sleep).includes(id) ? "" : "none"; }); svg.classList.toggle("awake", next !== "sleep" && next !== "peek"); };
            const say = (message, duration = 1900) => { clearTimeout(bubbleTimer); bubble.textContent = message; bubble.classList.toggle("on", !!message); if (message) bubbleTimer = setTimeout(() => bubble.classList.remove("on"), duration); };
            const motion = (frames, duration = 620) => { if (!RM2) body.animate(frames, { duration, easing: "ease-in-out" }); };
            const jump = () => motion([{ transform: "none" }, { transform: "translateY(-30px) scale(.94,1.1)", offset: .4 }, { transform: "translateY(0) scale(1.08,.9)", offset: .72 }, { transform: "none" }]);
            const shake = () => motion([{ transform: "none" }, { transform: "translateX(-9px)" }, { transform: "translateX(9px)" }, { transform: "translateX(-6px)" }, { transform: "none" }], 520);
            const reactions = {
                startle: () => { setFace("wake"); jump(); say("HUH?!"); snd("boing"); },
                yawn: () => { setFace("yawn"); motion([{ transform: "none" }, { transform: "scale(.95,1.16)" }, { transform: "none" }], 1300); say("Yaaawn…", 2200); snd("yawn"); },
                dizzy: () => { setFace("dizzy"); motion([{ transform: "rotate(0)" }, { transform: "rotate(-9deg)" }, { transform: "rotate(8deg)" }, { transform: "rotate(-6deg)" }, { transform: "none" }], 1100); say("Whoa. Everything is spinning."); snd("woo"); },
                hungry: () => { setFace("wake"); shake(); say("Is that food?"); snd("gulp"); },
                angry: () => { setFace("angry"); shake(); say("I was in a meeting. With my pillow.", 2300); snd("blorp"); },
                happy: () => { setFace("happy"); jump(); setTimeout(jump, 650); say("Aww. You’re nice."); snd("dingding"); },
                nope: () => { setFace("wake"); shake(); say("Nope. Not today.", 1400); }
            };
            window.charReact = kind => {
                if (RM2 || !$("#home").classList.contains("on") || busy && kind === "nope") return;
                clearTimeout(resetTimer); busy = true; (reactions[kind] || reactions.startle)();
                resetTimer = setTimeout(() => { busy = false; setFace("sleep"); say(""); }, kind === "nope" ? 1500 : 2400);
            };
            svg.addEventListener("click", () => {
                if (RM2) return;
                const choices = ["startle", "yawn", "dizzy", "hungry", "angry", "happy"];
                let next; do { next = choices[Math.floor(Math.random() * choices.length)]; } while (next === lastReaction);
                lastReaction = next; window.charReact(next);
            });
            addEventListener("pointermove", e => {
                if (RM2 || !svg.getBoundingClientRect().width) return;
                const r = svg.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy), n = Math.min(5, d / 60);
                svg.querySelectorAll(".pu").forEach(p => p.style.transform = `translate(${dx / (d || 1) * n}px,${dy / (d || 1) * n}px)`);
                if (busy) return;
                if (face === "sleep" && d < 150) setFace("peek"); else if (face === "peek" && d > 210) setFace("sleep");
            }, { passive: true });
            const sleepTalk = ["five more minutes…", "no… not the job…", "noodles…", "zzz", "I’m not asleep. I’m thinking.", "just resting my eyes…"];
            setInterval(() => { if (!RM2 && !busy && face === "sleep" && $("#home").classList.contains("on") && Math.random() < .6) say(sleepTalk[Math.floor(Math.random() * sleepTalk.length)], 2200); }, 14000);
            svg.addEventListener("pointerdown", () => { const now = performance.now(); fastTaps.push(now); while (fastTaps.length && now - fastTaps[0] > 2500) fastTaps.shift(); if (fastTaps.length >= 9) { fastTaps.length = 0; window.charReact("angry"); } }, { passive: true });
            setFace("sleep");
        })();
        // Small press and outline feedback, respecting the saved Motion setting.
        document.addEventListener("pointerdown", e => {
            const target = e.target.closest("a,button,.row,.lr,.pc,.opt,.chip,.rbtn");
            if (!target || RM2 || target.id === "run") return;
            target.animate([{ scale: "1" }, { scale: ".86" }, { scale: "1.1" }, { scale: "1" }], { duration: 430, easing: "cubic-bezier(.3,1.5,.5,1)" });
            const rect = target.getBoundingClientRect(), ring = document.createElement("div");
            ring.className = "press-ring"; ring.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;border-radius:${getComputedStyle(target).borderRadius}`;
            document.body.appendChild(ring); ring.animate([{ transform: "scale(1)", opacity: .9 }, { transform: "scale(1.35,1.6)", opacity: 0 }], { duration: 520, easing: "ease-out" }).onfinish = () => ring.remove();
        }, { passive: true });
        // Initial route handling
        if (location.search.includes("tab=top")) bmode = "top";
        if (location.hash) {
            const h = location.hash.replace("#", "");
            const page = resolvePage("/" + h);
            history.replaceState(null, "", PAGE_URLS[page] || "/");
            routeTo(page, false);
        } else {
            routeTo(resolvePage(location.pathname), false);
        }
        showLine();
        setInterval(showLine, 3800);
        const checkoutReturn = new URLSearchParams(location.search);
        const returnedOrderId = checkoutReturn.get("order_id");
        if (checkoutReturn.get("checkout") === "return" && returnedOrderId) {
            history.replaceState(null, "", location.pathname + location.hash);
            (async () => {
                for (let attempt = 0; attempt < 60; attempt++) {
                    try {
                        const response = await fetch(`${SUPABASE_URL}/functions/v1/dodo-checkout-status`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
                            body: JSON.stringify({ order_id: returnedOrderId })
                        });
                        if (response.ok && (await response.json()).status === "paid") {
                            await refreshLiveLeaderboard();
                            toast("Payment confirmed. Your board spot is live!");
                            return;
                        }
                    } catch (err) {
                        console.warn("Waiting for payment confirmation:", err);
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                toast("Payment received. The board is still waiting for Dodo’s confirmation; refresh in a moment.");
            })();
        }
        const SHARED_CONFIG_KEYS = ["pay", "tz", "tag", "btn", "sub", "heroHead", "heroAccent", "cur", "anonAllowed", "roastEnabled", "soundsEnabled"];
        async function refreshSharedSiteState() {
            const oldConfig = JSON.stringify(CFG);
            const oldBlocklist = JSON.stringify(REMOTE_BLOCKLIST);
            const oldDeletedIds = JSON.stringify(REMOTE_DELETED_IDS);
            const [remoteConfig, blocked, deletedIds] = await Promise.all([
                SupabaseService.getPublicSiteConfig(),
                SupabaseService.getPublicBlocklist(),
                SupabaseService.getPublicDeletedEntryIds()
            ]);
            if (remoteConfig) {
                for (const key of SHARED_CONFIG_KEYS) if (Object.prototype.hasOwnProperty.call(remoteConfig, key)) CFG[key] = remoteConfig[key];
                if (Array.isArray(remoteConfig.lines)) CFG.lines = remoteConfig.lines.filter(v => typeof v === "string");
                if (Array.isArray(remoteConfig.dodge)) CFG.dodge = remoteConfig.dodge.filter(v => typeof v === "string");
                applySiteConfig();
            }
            REMOTE_BLOCKLIST = blocked;
            REMOTE_DELETED_IDS = deletedIds;
            const changed = oldConfig !== JSON.stringify(CFG) || oldBlocklist !== JSON.stringify(blocked) || oldDeletedIds !== JSON.stringify(deletedIds);
            if (changed) {
                if (CFG.roastEnabled === false && location.pathname === "/get-roasted") routeTo("home", true);
                render();
                showLine();
            }
            return changed;
        }
        refreshSharedSiteState().catch(err => console.warn("Site settings fallback to defaults:", err));
    
// Public leaderboard reads only the live Supabase result. Browser storage is
// never used as a public fallback when the database is unreachable.
async function refreshLiveLeaderboard() {
    const previousStatus = liveBoardStatus;
    try {
        const remote = await SupabaseService.fetchEntries();
        if (remote === null) {
            liveBoardStatus = "error";
            if (previousStatus !== liveBoardStatus) render();
            if (adminOpen) updateAdminDbStatus();
            return false;
        }
        const cleaned = remote.filter(entry =>
            entry.src === "live" &&
            entry.src !== "seed" &&
            !String(entry.id).startsWith("seed-") &&
            entry.name !== "Alex Dev Studios" &&
            entry.name !== "PixelPulse SaaS" &&
            entry.name !== "@sarah_designs" &&
            entry.name !== "Chai & Chill Club"
        );
        const changed = JSON.stringify(cleaned) !== JSON.stringify(DATA.entries);
        DATA.entries = cleaned;
        liveBoardStatus = "live";
        if (adminOpen) {
            LOCAL = await StorageService.syncFromSupabase();
            if (atab === "entries") refreshAdminEntryList();
        }
        if (changed || previousStatus !== liveBoardStatus) render();
        if (adminOpen) updateAdminDbStatus();
        return true;
    } catch (err) {
        console.warn("Live Supabase leaderboard refresh failed:", err);
        liveBoardStatus = "error";
        if (previousStatus !== liveBoardStatus) render();
        if (adminOpen) updateAdminDbStatus();
        return false;
    }
}

(async () => {
    await refreshLiveLeaderboard();

    try {
        SupabaseService.subscribeToEntries(async () => {
            const deletedIds = await SupabaseService.getPublicDeletedEntryIds();
            REMOTE_DELETED_IDS = deletedIds;
            await refreshLiveLeaderboard();
            render();
            refreshSharedSiteState().catch(err => console.warn('Shared site settings refresh failed:', err));
        });
    } catch (err) {
        console.warn('Supabase realtime subscription fallback:', err);
    }
})();

// Realtime requires the Supabase table to be in the project's publication. Poll
// as a lightweight fallback so open pages still converge when realtime is off.
setInterval(async () => {
    if (document.visibilityState !== 'visible') return;
    try {
        const [deletedIds] = await Promise.all([
            SupabaseService.getPublicDeletedEntryIds(),
            refreshLiveLeaderboard()
        ]);
        const deletedChanged = JSON.stringify(deletedIds) !== JSON.stringify(REMOTE_DELETED_IDS);
        REMOTE_DELETED_IDS = deletedIds;
        if (deletedChanged) {
            render();
        }
        await refreshSharedSiteState();
        if (adminOpen) updateAdminDbStatus();
    } catch (err) {
        console.warn('Periodic Supabase refresh failed:', err);
        if (adminOpen) updateAdminDbStatus();
    }
}, 20000);
