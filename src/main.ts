// @ts-nocheck
import '../css/style.css';
import { StorageService } from './services/storage';
import { SupabaseService } from './services/supabase';
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
            pay: "", tz: "Asia/Kolkata", tag: "Unemployed since 2026. Proud of it.", btn: "Buy me", sub: "and get on today’s board",
            lines: ["Today I ate: nothing. Yesterday: instant noodles. Progress.", "Employee of the month at my own couch.", "Unemployed, undefeated, underfed.", "My diet is 80% noodles, 20% excuses.", "Current net worth: one cup of noodles.", "Last meal: spaghetti with ketchup. Michelin-adjacent.", "I’m not unemployed. I’m pre-productive.", "The cheapest meal in Europe? I’ve had it. Twice.", "My LinkedIn says open to nothing.", "I once tried to work. It was a weekend.", "Hustle culture called. I let it go to voicemail.", "I’m the reason the word “lazy” exists.", "Dinner tonight: cup noodles. Dessert: water.", "The worst employee you’ll never hire.", "Professional couch tester. Also unpaid.", "Hunger level: noodle emergency.", "My fridge light is the only thing working.", "I have a five-year plan. It’s mostly sleeping.", "I eat ramen like it’s a personality.", "Day 1 of my career. Day 1,000 of my nap.", "My bank account is a rumour.", "I’m self-employed. Salary: vibes.", "Lunch is a state of mind. Mine is empty.", "I’m between naps, jobs and meals.", "Cheapest food in America? I’m a regular.", "My cooking skills: boil, wait, regret.", "Plot twist: the noodles were breakfast.", "Not lazy. Just on energy-saving mode.", "I put “napping” under skills. Recruiters agree.", "Currently accepting applications for my next meal."],
            dodge: ["But no one hired me!", "Please don’t do that!", "I’m lazy.", "My last interview ended with a nap.", "HR still has my cover letter: “hi.”", "I have a degree in ceilings.", "Resume: one line. It says nap.", "My skills: horizontal.", "I’m overqualified for nothing.", "I put “Nap” under Experience.", "Even LinkedIn left me on read.", "I got ghosted by a chatbot.", "My LinkedIn says “Open to nap”.", "I’d work, but it’s Tuesday.", "Every day is a bad day to start.", "Employee of the month: nobody.", "Day 412 of unemployment. Thriving.", "Noodles don’t buy themselves.", "Dinner: noodles. Dessert: hope.", "Salary expectations: noodles.", "Today’s menu: spaghetti, again.", "I’m a $1 pasta connoisseur.", "Cup noodles are my personality.", "My fridge has an echo.", "Rent due. Motivation overdue.", "My bank account is a rumour.", "Career goals: a bigger couch.", "CEO of lying down.", "Founder of Doing Nothing Inc.", "Chief Napping Officer here.", "My KPI is staying horizontal.", "Synergy? I barely have energy.", "Let me circle back never.", "Can this be an email? No.", "Per my last nap...", "Quiet quitting before hiring.", "I’m disrupting employment.", "Even my cat got a promotion.", "My houseplant earns more.", "My goldfish has better prospects.", "I’m not broke. I’m minimalist.", "Stress is for the employed.", "Bills called. I didn’t answer.", "My calendar is empty by design.", "I mastered the art of waiting.", "Sorry, I’m buffering.", "Loading motivation... 3%.", "Low battery. Needs 14 hours.", "Out of office. Always.", "Auto-reply: still resting.", "Job? I thought you said jog.", "The word “job” gives me hives.", "I need a nap after that word.", "Triggered. Brb, napping.", "That’s offensive. Also true.", "Nope. Not in this timeline.", "Job offers go to my spam.", "Will work for noodles. Maybe.", "Will not work for noodles. Yet.", "Even my shadow is lazy.", "My alarm gave up on me.", "I peaked at naptime.", "This is my final form.", "Please pay me to stop.", "Don’t tell my mom you found me.", "Ask me after I wake up.", "Fine, but only horizontally.", "Free trial of me ends today.", "Sorry. Booked by my bed."]
        };
        let CFG = Object.assign({}, DEF); try { Object.assign(CFG, JSON.parse(localStorage.getItem("idn_cfg") || "{}")) } catch (e) { }
        const saveCfg = () => { try { localStorage.setItem("idn_cfg", JSON.stringify(CFG)) } catch (e) { } };
        const DATA: { entries: LeaderboardEntry[] } = { entries: StorageService.getEntries() };  // verified entries from your backend: {id,name,url,amt,desc,img,t}
        // =====================================================================================================================
        const $ = (s: string): any => document.querySelector(s);
        const $$ = (s: string): any[] => [...document.querySelectorAll(s)];
        const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        const toast = t => { if (/^(Add |That |Enter |Type |Wrong |Name and|Couldn)/.test(t)) snd("sad", 300); const e = $("#toast"); e.textContent = t; e.style.display = "block"; clearTimeout(toast.t); toast.t = setTimeout(() => e.style.display = "none", 3200) };

        // ===== SOUNDS: original effects synthesized in the browser. Real meme clips are copyrighted and can't be loaded here. Mute button in the header. =====
        let SOUND = true; try { SOUND = localStorage.getItem("idn_snd") !== "off" } catch (e) { }
        let AC = null, MG = null, welcomed = false; const lastS = {};
        function ctx() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); MG = AC.createGain(); MG.gain.value = .35; MG.connect(AC.destination) } catch (e) { return null } } if (AC.state === "suspended") AC.resume(); return AC }
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
        function snd(n, gap = 60) { if (!SOUND || !welcomed) return; const t = performance.now(); if (lastS[n] && t - lastS[n] < gap) return; lastS[n] = t; try { SND[n]() } catch (e) { } }
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
        const sb = document.getElementById("snd"); const sbl = () => sb.textContent = "Sound: " + (SOUND ? "on" : "off"); sbl(); sb.onclick = () => { SOUND = !SOUND; try { localStorage.setItem("idn_snd", SOUND ? "on" : "off") } catch (e) { } sbl(); welcomed = true; snd("pop") };
        const money = n => "$" + (Math.round(n * 100) / 100).toLocaleString();
        const safeUrl = u => { u = (u || "").trim(); if (!u || u[0] === "@") return ""; try { const x = new URL(/^https?:/i.test(u) ? u : "https://" + u); return /^https?:$/.test(x.protocol) && x.hostname.includes(".") ? x.href : "" } catch (e) { return "" } };
        const host = u => { try { return new URL(safeUrl(u)).hostname.replace(/^www\./, "") } catch (e) { return "" } };
        const tz = () => { try { new Intl.DateTimeFormat("en", { timeZone: CFG.tz }); return CFG.tz } catch (e) { return "UTC" } };
        const dayKey = t => new Date(t).toLocaleDateString("en-CA", { timeZone: tz() });
        const left = () => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: tz(), hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date()), g = t => +p.find(x => x.type === t).value; return 86400 - ((g("hour") % 24) * 3600 + g("minute") * 60 + g("second")) };
        const COL = ["#2F4BFF", "#E8412C", "#0E9F6E", "#8B3DFF", "#F08A00", "#101010", "#D6246E"]; const hue = s => COL[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % COL.length];
        const SOC = { "x.com": ["X", "#101010"], "twitter.com": ["X", "#101010"], "instagram.com": ["IG", "#D6246E"], "linkedin.com": ["in", "#0A66C2"], "github.com": ["GH", "#101010"], "youtube.com": ["YT", "#E00"], "youtu.be": ["YT", "#E00"], "tiktok.com": ["TT", "#101010"], "facebook.com": ["f", "#1877F2"], "producthunt.com": ["P", "#DA552F"], "reddit.com": ["R", "#FF4500"], "threads.net": ["@", "#101010"], "medium.com": ["M", "#101010"] };
        const soc = u => { const h = host(u), k = Object.keys(SOC).find(k => h === k || h.endsWith("." + k)); return k ? SOC[k] : null };
        // entries (src: preview | sample | manual). Visitors see preview/sample only in preview mode; manual entries (real payments you recorded) always show.
        let LOCAL: LeaderboardEntry[] = StorageService.getEntries();
        const saveLocal = () => { StorageService.saveEntries(LOCAL); };
        const all = () => {
            const seen = new Set<string>();
            const list: LeaderboardEntry[] = [];
            const pool = [...LOCAL, ...(DATA.entries || [])];
            for (const item of pool) {
                if (!item) continue;
                const idKey = item.id ? "id:" + item.id : "";
                const contentKey = "c:" + (item.name || "").trim().toLowerCase() + "_" + item.amt + "_" + Math.floor(item.t / 300000);
                if ((idKey && seen.has(idKey)) || seen.has(contentKey)) continue;
                if (idKey) seen.add(idKey);
                seen.add(contentKey);
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
            // Sort all entries newest-first, then deduplicate by donor key:
            // ONE card per unique URL/donor — always the LATEST donation.
            // latestAmt = what they just donated; totalAmt = lifetime sum.
            const list = all().slice().sort((a, b) => b.t - a.t);
            const donorMap = getDonorMap(list);
            const seen = new Set<string>();
            const deduped: Array<LeaderboardEntry & { totalAmt: number; donorCount: number; latestAmt: number }> = [];
            for (const item of list) {
                const dk = getDonorKey(item);
                if (seen.has(dk)) continue; // already captured the latest card for this donor
                seen.add(dk);
                const d = donorMap.get(dk);
                deduped.push({
                    ...item,
                    // Show the latest donation amount as the main $-figure on the card
                    amt: d ? d.latestAmt : item.amt,
                    latestAmt: d ? d.latestAmt : item.amt,
                    totalAmt: d ? d.totalAmt : item.amt,
                    donorCount: d ? d.count : 1
                });
            }
            return deduped;
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
            return result.sort((a, b) => b.amt - a.amt || a.t - b.t).slice(0, 100);
        };

        // routing with clean URLs (no #)
        const pages = ["home", "red", "roast", "challenge", "excuses", "soundboard", "about"];
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
            "/rules": "about",
            "/privacy": "about",
            "/terms": "about",
            "/founder-gate": "founder-gate"
        };
        const PAGE_URLS = {
            home: "/",
            red: "/dont-press",
            roast: "/get-roasted",
            challenge: "/challenge",
            excuses: "/excuses",
            soundboard: "/soundboard",
            about: "/about",
            admin: "/admin"
        };

        function resolvePage(path) {
            const clean = (path || "/").replace(/\/$/, "") || "/";
            if (clean === "/hall-of-fame") {
                bmode = "top";
                return "home";
            }
            if (clean === "/founder-gate") {
                window.location.replace("/admin/index.html");
                return "home";
            }
            return PATH_MAP[clean] || PATH_MAP["/" + clean.split("/")[1]] || "home";
        }

        function routeTo(pageId, updateUrl = true) {
            if (!pages.includes(pageId)) pageId = "home";
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
        function meal() { const h = new Date().getHours(); return h >= 5 && h < 11 ? "breakfast" : h >= 11 && h < 16 ? "lunch" : h >= 16 && h < 22 ? "dinner" : "a midnight snack" }
        function setMeal() { $("#fund").innerHTML = esc(CFG.btn + " " + meal()) + `<small>${esc(CFG.sub)}</small>`; $("#tag").textContent = CFG.tag }
        let li = 0; const showLine = () => { const e = $("#line"), L = CFG.lines.length ? CFG.lines : DEF.lines; e.style.opacity = 0; setTimeout(() => { e.textContent = L[li++ % L.length]; e.style.opacity = 1 }, 300) };
        // the "Go get a job" button
        const run = $("#run"), hero = $(".hero"); let mi = 0, bag = [], px = -999, py = -999, lt = 0, moved = false, hy = 0;
        const pick = () => { const D = CFG.dodge.length ? CFG.dodge : DEF.dodge; if (mi < 3 && D[mi]) return D[mi]; if (!bag.length) bag = D.slice(3).sort(() => Math.random() - .5); return bag.pop() || D[0] };
        const prot = () => { const o = []; hero.querySelectorAll("#fund,#tag").forEach(e => o.push(e.getBoundingClientRect()));["h1.big", ".line"].forEach(q => { const rg = document.createRange(); rg.selectNodeContents(hero.querySelector(q));[...rg.getClientRects()].forEach(r => o.push(r)) }); return o.filter(r => r.width > 0) };
        function home() { if (!hero.offsetParent) return; const s = $("#slot").getBoundingClientRect(), h = hero.getBoundingClientRect(); run.style.left = (s.left - h.left) + "px"; run.style.top = (s.top - h.top) + "px"; hy = s.top - h.top; moved = false }
        function flee() {
            snd(["boing", "squeak", "blorp", "honk"][Math.floor(Math.random() * 4)], 40); moved = true; const h = hero.getBoundingClientRect(), W = run.offsetWidth, H = run.offsetHeight, R = prot(), pad = 12; let best = null, bd = -1;
            for (let i = 0; i < 90; i++) { const x = Math.random() * Math.max(0, h.width - W), y = Math.min(Math.max(0, hy - 18 + Math.random() * 60), Math.max(0, h.height - H)), L = h.left + x, T = h.top + y; if (R.some(r => L < r.right + pad && L + W > r.left - pad && T < r.bottom + pad && T + H > r.top - pad)) continue; const d = Math.hypot(L + W / 2 - px, T + H / 2 - py); if (d > bd) { bd = d; best = [x, y] } }
            if (best) { run.style.left = best[0] + "px"; run.style.top = best[1] + "px" }
        }
        const near = () => { const b = run.getBoundingClientRect(), m = 10; return $("#home").classList.contains("on") && px > b.left - m && px < b.right + m && py > b.top - m && py < b.bottom + m };
        addEventListener("pointermove", e => { px = e.clientX; py = e.clientY; if (near()) { const n = performance.now(); if (n - lt > 30) { lt = n; flee() } } }, { passive: true });
        ["pointerdown", "touchstart"].forEach(v => document.addEventListener(v, e => { const t = e.touches ? e.touches[0] : e; px = t.clientX; py = t.clientY; if (near()) { lt = performance.now(); flee(); if (e.target.closest("#run")) e.preventDefault() } }, { passive: false }));
        run.addEventListener("click", e => { e.preventDefault(); flee() });
        addEventListener("resize", home); document.fonts && document.fonts.ready.then(home);
        // counter
        let shown = 0; function setTotal(to) { const f = shown, s = performance.now(); shown = to; (function a(t) { const p = Math.min(1, (t - s) / 800); $("#tot").textContent = money(f + (to - f) * p); if (p < 1) requestAnimationFrame(a) })(s) }
        function avatar(x) { const s = soc(x.url); if (x.img) return `<div class="av"><img src="${esc(x.img)}" alt=""></div>`; if (x.anon) return `<div class="av" style="background:#8a877d">?</div>`; if (s) return `<div class="av" style="background:${s[1]}">${esc(s[0])}</div>`; return `<div class="av" style="background:${hue(x.name)}">${esc((x.name[0] || "?").toUpperCase())}</div>` }
        const tierOf = a => a >= 100 ? ["Legend", "#E8412C"] : a >= 25 ? ["Big spender", "#8B3DFF"] : a >= 5 ? ["Supporter", "#0E9F6E"] : ["Noodle", "#6c6a64"];
        const chipT = x => { const t = tierOf(x.amt); return `<span class="tc" style="background:${t[1]}">${t[0]}</span>` };
        const CROWN = '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M3 18h18l1-10-5 4-5-8-5 8-5-4z" fill="#FFD23F" stroke="#101010" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        
        function lbHTML(L, mode, at) {
            const mx = Math.max(1, ...L.map(x => x.amt)); let h = "", st = 0;
            if (mode === "top") {
                const P = [1, 0, 2].filter(i => L[i]);
                h += `<div class="pod" style="grid-template-columns:repeat(${P.length},minmax(0,1fr))">` + P.map(i => {
                    const x = L[i];
                    return `<button class="pc p${i + 1}" ${at}="${i}" style="animation-delay:${i * 90}ms"><span class="medal">${i + 1}</span>${i === 0 ? `<div class="crown">${CROWN}</div><i class="sp s1"></i><i class="sp s2"></i><i class="sp s3"></i>` : ""}${avatar(x)}<h3>${esc(x.name)}</h3>${chipT(x)}<div class="amt"><b class="nv" data-v="${x.amt}">${money(x.amt)}</b>${x.donorCount > 1 ? `<div style="font-size:11.5px;font-weight:700;color:var(--mut);margin-top:2px;">${x.donorCount} donations</div>` : ""}</div><span class="go">Details ›</span></button>`;
                }).join("") + `</div>`;
                st = 3;
            }
            return h + L.slice(st).map((x, k) => {
                const i = k + st, fresh = mode === "recent" && Date.now() - x.t < 12e4;
                const hasRepeat = x.totalAmt && x.totalAmt > x.amt;
                return `<button class="lr ${mode === "recent" && i === 0 ? "hot" : ""}" ${at}="${i}" style="animation-delay:${Math.min(k, 12) * 35}ms"><div class="lk">${mode === "top" ? `<b>${i + 1}</b>` : `<span class="tp ${fresh ? "nw" : ""}">${ago(x.t)}</span>`}</div>${avatar(x)}<div style="min-width:0"><h3>${esc(x.name)} ${chipT(x)}${tagOf(x) ? `<span class="pv">${tagOf(x)}</span>` : ""}</h3><p>${esc(x.desc || "")}</p><div class="d">${esc(host(x.url) || x.url || "")}</div></div><div class="lp"><b class="nv" data-v="${x.amt}">${money(x.amt)}</b>${mode === "recent" && hasRepeat ? `<span class="tot-badge">Total ${money(x.totalAmt)}</span>` : ""}${mode === "top" && x.donorCount > 1 ? `<span class="tot-badge">${x.donorCount} donations</span>` : ""}<span class="go">Details ›</span></div><i class="lbar" style="width:${Math.max(3, x.amt / mx * 100)}%"></i></button>`;
            }).join("");
        }

        const ago = t => { const m = Math.floor((Date.now() - t) / 6e4); return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.floor(m / 60) + "h" : Math.floor(m / 1440) + "d" };

        function render() {
            setMeal();
            if (!moved) home();
            const allItems = all();
            setTotal(allItems.reduce((a, b) => a + b.amt, 0));
            $("#cnt").textContent = allItems.length;
            const topEntry = topPlayersList()[0];
            $("#topv").textContent = topEntry ? topEntry.name : "Nobody";
            $("#pvBar").innerHTML = CFG.pay ? "" : `<p class="hint" style="margin-bottom:12px"><b>Preview mode:</b> no real payments are connected. Entries shown here stay in this browser.</p>`;

            // Update sliding switch active UI
            const sw = $("#lbSwitch");
            if (sw) {
                sw.setAttribute("data-active", bmode);
                const tabR = $("#tabRecent"), tabT = $("#tabTop");
                if (tabR) tabR.classList.toggle("on", bmode === "recent");
                if (tabT) tabT.classList.toggle("on", bmode === "top");
            }

            if (bmode === "recent") {
                const fullList = recentList();
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
                $("#board").innerHTML = topList.length ? lbHTML(topList, "top", "data-i") : ghostHTML();
            }
        }

        setInterval(() => { const s = left(); $("#rst").textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, "0")).join(":"); }, 1000);

        function showDetail(x) {
            if (!x) return;
            const u = safeUrl(x.url);
            const totalInfo = x.totalAmt && x.totalAmt > x.amt ? `<div style="font-size:14px;color:var(--blue);font-weight:700;margin-top:4px;">Cumulative Lifetime Total: ${money(x.totalAmt)}</div>` : "";
            $("#mb").innerHTML = `<div style="display:flex;gap:14px;align-items:center">${avatar(x)}<div><h2 style="font-size:28px">${esc(x.name)}</h2><b>${money(x.amt)}</b>${totalInfo}</div></div><p style="white-space:pre-wrap">${esc(x.desc || "No description.")}</p>${u ? `<p><a class="btn sm" href="${esc(u)}" target="_blank" rel="nofollow noopener ugc">Visit ${esc(host(x.url))}</a></p>` : (x.url ? `<p><b>${esc(x.url)}</b></p>` : "")}<p><button class="chip" id="cl">Close</button></p>`;
            $("#md").classList.add("on");
            $("#cl").onclick = close_;
        }

        $("#board").addEventListener("click", e => {
            const prev = e.target.closest("#pgPrev");
            if (prev && !prev.hasAttribute("disabled")) {
                const fullList = recentList();
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
                const fullList = recentList();
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
                    if (bmode === "recent") currentPage = 1;
                    render();
                }
            };
        }

        // payment modal
        const close_ = () => $("#md").classList.remove("on"); let img = "";
        function openFund() {
            snd("kaching"); img = ""; $("#mb").innerHTML = `<h2>${esc(CFG.btn + " " + meal())}</h2><p style="margin:0;color:var(--mut)">Put your name or product on today’s board, or stay anonymous.</p>
<label style="display:flex;align-items:center;margin-top:16px;cursor:pointer"><input type="checkbox" id="an">Pay anonymously (no name, no link, no logo)</label>
<div id="idf"><label for="f1">Your name or product name</label><input id="f1" maxlength="60" placeholder="Acme Analytics"><label for="f2">One link (website or social profile)</label><input id="f2" maxlength="140" placeholder="https://yourproduct.com or https://x.com/you"><p class="hint">Social links show the platform icon automatically. Website links fetch the logo from your site.</p><div id="favprev" style="display:none;align-items:center;gap:10px;margin:8px 0 4px;min-height:52px"></div></div>
<label for="f3">How much do you want to pay? (USD)</label><input id="f3" type="number" min="1" step="1" inputmode="numeric" placeholder="Any amount, $1 or more"><div class="chips" id="qa"></div>
<label for="f4">Short description or message <span id="wc" class="hint" style="display:inline">0 / 500 words</span></label><textarea id="f4" placeholder="What are you building? Or just say hi."></textarea>
${CFG.pay ? `<div class="note">You’ll continue to the payment page. You appear on the board once the payment is verified.</div>` : `<div class="note"><b>Preview mode.</b> No money will move. Your entry only shows in this browser, so you can see how the board looks.</div>`}
<p style="display:flex;gap:10px;margin-top:16px"><button class="btn" id="go" style="flex:1;text-align:center">${CFG.pay ? "Continue to payment" : "Add to board (preview)"}</button><button class="btn w" id="cl">Cancel</button></p>`;
            $("#md").classList.add("on"); $("#cl").onclick = close_;
            $("#an").onchange = () => { $("#idf").style.display = $("#an").checked ? "none" : "block" };
            $("#qa").innerHTML = [1, 5, 10, 25, 50].map(a => `<button class="chip" data-a="${a}">$${a}</button>`).join(""); $("#qa").onclick = e => { const c = e.target.closest("[data-a]"); if (c) $("#f3").value = c.dataset.a };
            const wc = () => $("#f4").value.trim().split(/\s+/).filter(Boolean).length; $("#f4").oninput = () => { $("#wc").textContent = wc() + " / 500 words" };
            // Auto-fetch favicon when URL is typed
            const fetchFavicon = (u) => {
                img = ""; const prev = $("#favprev"); if (!prev) return;
                prev.style.display = "none";
                if (!u) return;
                // Check if social platform - letter badge handles those automatically
                const h = (u.replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0]).toLowerCase();
                const socials = ["x.com","twitter.com","instagram.com","facebook.com","linkedin.com",
                    "github.com","youtube.com","youtu.be","tiktok.com","producthunt.com","reddit.com",
                    "threads.net","medium.com","discord.gg","discord.com","twitch.tv","pinterest.com",
                    "snapchat.com","substack.com","beehiiv.com"];
                if (socials.some(s => h === s || h.endsWith('.'+s))) {
                    prev.style.display = "flex";
                    prev.innerHTML = '<span style="font-size:12px;color:var(--mut)">Platform icon will show automatically ✓</span>';
                    return;
                }
                if (!safeUrl(u)) return;
                prev.style.display = "flex";
                prev.innerHTML = '<span style="opacity:.5;font-size:12px">Fetching logo…</span>';
                const src = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(h) + '&sz=96';
                const ti = new Image(); ti.crossOrigin = "anonymous";
                ti.onload = () => {
                    try {
                        const c = document.createElement("canvas"); c.width = c.height = 96;
                        const ctx = c.getContext("2d"); ctx.drawImage(ti, 0, 0, 96, 96);
                        const px = ctx.getImageData(0, 0, 96, 96).data;
                        // Check if it's a real icon (not a grey placeholder)
                        let colorPx = 0;
                        for (let i = 0; i < px.length; i += 4) {
                            const r = px[i], g = px[i+1], b = px[i+2], a = px[i+3];
                            if (a > 10 && (Math.abs(r-g) > 15 || Math.abs(g-b) > 15 || Math.abs(r-b) > 15)) colorPx++;
                        }
                        if (colorPx < 20) {
                            img = ""; prev.innerHTML = '<span style="opacity:.5;font-size:12px">No logo found — a letter avatar will be used.</span>';
                        } else {
                            img = c.toDataURL("image/jpeg", 0.9);
                            prev.innerHTML = '<img src="' + img + '" style="width:48px;height:48px;border-radius:8px;object-fit:cover"><span style="font-size:12px;color:var(--mut)">Logo fetched ✓</span>';
                        }
                    } catch(e) {
                        img = ""; prev.innerHTML = '<span style="opacity:.5;font-size:12px">No logo found — a letter avatar will be used.</span>';
                    }
                };
                ti.onerror = () => { img = ""; prev.innerHTML = '<span style="opacity:.5;font-size:12px">No logo found — a letter avatar will be used.</span>'; };
                ti.src = src;
            };
            let _ft = null;
            $("#f2").oninput = () => { if (_ft) clearTimeout(_ft); _ft = setTimeout(() => fetchFavicon($("#f2").value.trim()), 700); };

            $("#go").onclick = () => {
                const anon = $("#an").checked, n = anon ? "Anonymous legend" : $("#f1").value.trim(), u = anon ? "" : $("#f2").value.trim(), a = Math.round((+$("#f3").value) * 100) / 100, d = $("#f4").value.trim();
                if (!n) return toast("Add your name or product name, or tick “Pay anonymously”."); if (u && !safeUrl(u) && u[0] !== "@") return toast("That link doesn’t look valid. Use https://…"); if (!(a >= 1)) return toast("Enter an amount of $1 or more."); if (wc() > 500) return toast("That’s over 500 words.");
                if (CFG.pay) { window.open(CFG.pay, "_blank", "noopener"); close_(); return toast("Complete the payment. You’ll appear once it’s verified.") }
                const newEntry: LeaderboardEntry = { id: "p" + Date.now(), name: n, url: safeUrl(u) || u, amt: a, desc: d, img: anon ? "" : img, anon, t: Date.now(), src: CFG.pay ? "live" : "preview" };
                LOCAL.unshift(newEntry);
                saveLocal();
                StorageService.addEntry(newEntry).then(() => {
                    DATA.entries = StorageService.getEntries();
                    render();
                });
                snd("horn");
                close_();
                render();
                toast(CFG.pay ? "Added to the board!" : "Preview only: added to the board. No money moved.");
                location.hash = "home";
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
        function bomb() { const L = ["Removing cat videos…", "Deleting group chats… you’re welcome", "Cancelling Mondays…", "Unsubscribing from newsletters…", "Erasing your browser history… we saw it", "Shutting down the wifi…", "Deleting the noodle recipes… no, wait"]; $("#mb").innerHTML = `<h2>Deleting the internet…</h2><div class="bar2"><i id="pb"></i></div><p id="pl" class="hint">Starting…</p><p class="hint">(not real, obviously)</p>`; $("#md").classList.add("on"); let p = 0, k = 0; const t = setInterval(() => { p += Math.random() * 9 + 3; snd("tick", 20); if (p >= 99) { p = 99; clearInterval(t); snd("scratch"); $("#pl").textContent = "Wait. That’s a lot of work."; setTimeout(() => { snd("sad"); $("#mb").innerHTML = `<h2>Cancelled.</h2><p>I’m too lazy to finish deleting the internet. You’re welcome.</p><p style="display:flex;gap:10px"><button class="btn" id="b1" style="flex:1;text-align:center">Buy me a noodle</button><button class="btn w" id="b2">Phew</button></p>`; $("#b1").onclick = () => openFund(); $("#b2").onclick = close_ }, 1500) } else if (Math.random() < .5) $("#pl").textContent = L[k++ % L.length]; $("#pb").style.width = p + "%" }, 350) }
        $("#rb").onclick = () => { rn++; snd(rn === 5 ? "alarm" : rn % 2 ? "horn" : "boom"); $("#rc").textContent = "Presses: " + rn; if (rn === 5) return bomb(); $("#rm").textContent = rn < 5 ? R1[rn - 1] : R2[Math.floor(Math.random() * R2.length)] };
        // roast machine (roasts the name, never the person)
        const RO = ["{n} sounds like a startup with 3 users. Two of them are you.", "I looked up {n}. Even my search engine yawned.", "{n} has the energy of a Monday email.", "The roadmap for {n} is a screenshot in a Notes app.", "{n} pivoted so many times it forgot where it started.", "If {n} were a snack, it’d be the last rice cake in the pack.", "{n} is why “coming soon” exists.", "Bold to call it {n}. Bolder to launch on a Friday.", "{n} is doing great. In the founder’s head.", "I’m unemployed and even I’d ask {n} for a business plan.", "{n} has a five-year plan. Year one is still loading.", "{n}: 12 features, 0 users, 100% confidence.", "People say {n} is ahead of its time. Time is not interested.", "{n} walked so that someone else could run it properly.", "{n} is the kind of name that sounds funded. It isn’t."];
        let rl = -1; $("#rg").onclick = () => { const n = $("#ri").value.trim(); if (!n) return toast("Type a name or product first."); let k; do { k = Math.floor(Math.random() * RO.length) } while (k === rl); rl = k; snd("rim"); $("#ro").textContent = RO[k].replace(/\{n\}/g, n); $("#ra").style.display = "block"; $("#rf").textContent = CFG.btn + " a noodle to thank me" };
        $("#rs").onclick = async () => { try { await navigator.clipboard.writeText($("#ro").textContent + " " + location.href); toast("Roast copied.") } catch (e) { toast("Couldn’t copy.") } }; $("#rf").onclick = () => openFund();
        // excuses
        const EX = ["I had a plan. The plan had a nap in it.", "The inbox and I are on a break.", "I was about to start, then lunch got in the way.", "There is one deadline. It’s next year.", "My to-do list is a work of fiction.", "Productivity is a lifestyle. I’m exploring other lifestyles.", "I’m waiting for the right moment. It’s been a while.", "I do my best work later. Much later.", "I could, but the couch has seniority.", "I’m saving my energy for something important. Not found yet.", "The wifi was too comfortable to leave.", "I’m not late. I’m early for tomorrow.", "I was going to start, but the noodles needed me.", "I can’t work on an empty stomach. Or a full one."];
        let xi = -1; $("#exb").onclick = () => { snd("boing"); let n; do { n = Math.floor(Math.random() * EX.length) } while (n === xi); xi = n; $("#ex").textContent = EX[n] };
        $("#exc").onclick = async () => { try { await navigator.clipboard.writeText($("#ex").textContent); toast("Copied. Use it wisely.") } catch (e) { toast("Couldn’t copy.") } };
        // exit intent (once)
        let ex1 = false; document.addEventListener("mouseout", e => { if (!e.relatedTarget && e.clientY <= 0 && !ex1 && !$("#md").classList.contains("on")) { ex1 = true; snd("dun"); $("#mb").innerHTML = `<h2>Wait, you’re leaving?</h2><p>I did nothing the entire time you were here. The least you could do is buy me a noodle.</p><p style="display:flex;gap:10px"><button class="btn" id="a1" style="flex:1;text-align:center">Fine, buy the noodle</button><button class="btn w" id="a2">I have no heart</button></p>`; $("#md").classList.add("on"); $("#a1").onclick = () => openFund(); $("#a2").onclick = () => { close_(); toast("Wow. Okay. Noted.") } } });
        // ===== FOUNDER CONSOLE (Authenticated securely against Supabase; hidden from normal users) =====
        let unlocked = false, atab = "entries", editing = null;
        function openFounderConsole() {
            if (!unlocked) {
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
                        snd("fan");
                        renderAdmin();
                        toast("Welcome, Founder.");
                    } else {
                        snd("sad");
                        toast("Incorrect passcode stored in Supabase.");
                        $("#pw").value = "";
                        $("#pw").focus();
                    }
                };
                $("#pw").onkeydown = (e) => { if (e.key === "Enter") $("#pwb").click(); };
                setTimeout(() => $("#pw")?.focus(), 120);
                return;
            }
            renderAdmin();
        }

        function renderAdmin() {
            if (!unlocked) return openFounderConsole();
            $("#md").classList.add("on");
            let h = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h2 style="margin:0;">Founder Console</h2>
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
                <div style="max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">` +
                LOCAL.map(x => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1.5px solid var(--ink);border-radius:10px;background:#fff;">
                    <div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><b>${esc(x.name)}</b> - ${money(x.amt)} <small style="color:var(--mut);">(${new Date(x.t).toLocaleDateString()})</small></div>
                    <div style="display:flex;gap:6px;"><button class="btn sm" style="padding:4px 8px;font-size:12px;" data-ed="${x.id}">Edit</button><button class="btn sm w" style="padding:4px 8px;font-size:12px;" data-dl="${x.id}">Delete</button></div>
                </div>`).join("") + `</div>
                <p style="margin-top:12px;display:flex;gap:8px;"><button class="chip" id="cla">Clear local entries</button><button class="chip" id="csv">Export CSV</button></p>
                <div id="csvo"></div>`;
            }

            if (atab === "settings") {
                h += `<div class="panel">
                    <label>Payment URL (optional checkout / stripe)</label><input id="s1" value="${esc(CFG.pay)}" placeholder="https://...">
                    <label>Timezone for daily reset</label><input id="s2" value="${esc(CFG.tz)}">
                    <label>Hero tag</label><input id="s3" value="${esc(CFG.tag)}">
                    <label>Main button label</label><input id="s4" value="${esc(CFG.btn)}">
                    <label>Small text under button</label><input id="s5" value="${esc(CFG.sub)}">
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
            $("#adCl").onclick = close_;
            $$("[data-tab]").forEach(b => b.onclick = () => { atab = b.dataset.tab; editing = null; renderAdmin(); });
            const on = (i, f) => { const el = $("#" + i); if (el) el.onclick = f; };

            on("esv", async () => {
                const n = $("#e1").value.trim(), a = +$("#e3").value;
                if (!n || !(a > 0)) return toast("Name and positive amount are required.");
                const o = { name: n, url: safeUrl($("#e2").value) || $("#e2").value.trim(), amt: a, desc: $("#e4").value.trim(), t: Date.now(), anon: $("#e6").checked, src: "manual" };
                const newM = { id: (editing && editing.id) ? editing.id : "m" + Date.now(), img: "", ...o };
                if (editing && editing.id) {
                    const idx = LOCAL.findIndex(x => x.id === editing.id);
                    if (idx !== -1) LOCAL[idx] = newM;
                    await StorageService.updateEntry(editing.id, newM);
                } else {
                    LOCAL.unshift(newM);
                    await StorageService.addEntry(newM);
                }
                editing = null;
                saveLocal();
                renderAdmin();
                render();
                toast("Saved to Supabase.");
            });

            on("ecn", () => { editing = null; renderAdmin(); });
            $$("[data-ed]").forEach(b => b.onclick = () => { editing = LOCAL.find(x => x.id === b.dataset.ed); renderAdmin(); });
            $$("[data-dl]").forEach(b => b.onclick = async () => {
                const delId = b.dataset.dl;
                LOCAL = LOCAL.filter(x => x.id !== delId);
                await StorageService.deleteEntry(delId);
                saveLocal();
                renderAdmin();
                render();
                toast("Deleted.");
            });

            on("cla", () => { if (confirm("Clear local entries?")) { LOCAL = []; saveLocal(); renderAdmin(); render(); } });
            on("csv", () => { $("#csvo").innerHTML = `<textarea style="min-height:100px;margin-top:8px;">${esc("name,url,amount,date,source\n" + LOCAL.map(x => [x.name, x.url, x.amt, new Date(x.t).toISOString(), x.src].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n"))}</textarea>`; });
            on("ssv", () => {
                CFG.pay = $("#s1").value.trim();
                CFG.tz = $("#s2").value.trim() || "Asia/Kolkata";
                CFG.tag = $("#s3").value;
                CFG.btn = $("#s4").value.trim() || "Buy me";
                CFG.sub = $("#s5").value;
                saveCfg();
                render();
                toast("Settings saved.");
            });
            on("bim", () => {
                try {
                    const j = JSON.parse($("#b2").value);
                    if (j.cfg) Object.assign(CFG, j.cfg);
                    if (Array.isArray(j.entries)) LOCAL = j.entries;
                    saveCfg();
                    saveLocal();
                    renderAdmin();
                    render();
                    toast("Imported.");
                } catch (e) {
                    toast("Invalid JSON format.");
                }
            });
        }

        // Secret keyboard shortcut (Ctrl + Shift + A) to open founder console
        addEventListener("keydown", e => {
            if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
                e.preventDefault();
                window.location.href = "/founder-gate";
            }
        });

        // Secret sleeper click counter (5 clicks opens founder console)
        let sleeperClicks = 0, sleeperResetTimer = null;
        const slpEl = document.querySelector(".sleeper");
        if (slpEl) {
            slpEl.addEventListener("click", () => {
                sleeperClicks++;
                clearTimeout(sleeperResetTimer);
                sleeperResetTimer = setTimeout(() => { sleeperClicks = 0; }, 2000);
                if (sleeperClicks >= 5) {
                    sleeperClicks = 0;
                    snd("fan");
                    window.location.href = "/founder-gate";
                }
            });
        }

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
                const cv = document.getElementById("gl"), R = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true }); R.setPixelRatio(Math.min(devicePixelRatio, 1.75));
                const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(45, 1, .1, 100); C.position.z = 14;
                S.add(new THREE.AmbientLight(0xffffff, .85)); const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(4, 6, 8); S.add(dl);
                const COLS = [0x2F4BFF, 0xFFD23F, 0x101010, 0xE8412C, 0x0E9F6E, 0xffffff];
                const GEO = [() => new THREE.IcosahedronGeometry(1, 0), () => new THREE.OctahedronGeometry(1, 0), () => new THREE.BoxGeometry(1.4, 1.4, 1.4), () => new THREE.TorusGeometry(.9, .34, 12, 24), () => new THREE.ConeGeometry(.9, 1.6, 5), () => new THREE.SphereGeometry(1, 14, 10), () => new THREE.DodecahedronGeometry(1, 0), () => new THREE.TorusKnotGeometry(.7, .24, 64, 8)];
                let HW = 8, HH = 5.8, P = 35; const sh = [], N = innerWidth < 700 ? 16 : 26, mob = () => innerWidth < 700;
                function dims() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix(); HH = Math.tan(C.fov * Math.PI / 360) * C.position.z; HW = HH * C.aspect; P = 6 * HH } dims();
                for (let i = 0; i < N; i++) {
                    const m = new THREE.Mesh(GEO[i % GEO.length](), new THREE.MeshStandardMaterial({ color: COLS[i % COLS.length], flatShading: true, roughness: .55, metalness: .05 })); S.add(m);
                    const side = Math.random() < .5 ? -1 : 1; sh.push({ m, x: side * (.45 + Math.random() * .55), f: i / N, z: -4 + Math.random() * 6, s: .9 + Math.random() * 1.2, rx: (Math.random() - .5) * 1.6, ry: (Math.random() - .5) * 2, o: [0, 0, 0], v: [0, 0, 0], pulse: 0, sp: 0 })
                }
                // one big hero shape, top right
                sh[7].x = .55; sh[7].f = .99; sh[7].z = -1; sh[7].s = 2.8; sh[0].x = -.7;
                let px = 0, py = 0, cy = 0, last = performance.now();
                addEventListener("pointermove", e => { px = e.clientX / innerWidth * 2 - 1; py = -(e.clientY / innerHeight * 2 - 1) }, { passive: true });
                addEventListener("resize", () => { dims(); frame(0, performance.now()) });
                window.shock = (cx, cyp, k = 1) => { if (RM2) return; const wx = (cx / innerWidth * 2 - 1) * HW, wy = cy + (-(cyp / innerHeight * 2 - 1)) * HH; sh.forEach(s => { const p = s.m.position, dx = p.x - wx, dy = p.y - wy, d = Math.hypot(dx, dy) || .01, f = k * 9 / (1 + d * d * .07); s.v[0] += dx / d * f; s.v[1] += dy / d * f; s.v[2] += (Math.random() - .4) * f * .5; s.sp += (Math.random() - .5) * f * 1.2; s.pulse = Math.max(s.pulse, Math.min(1, f / 6)) }) };
                function frame(dt, t) {
                    cy = -scrollY / innerHeight * 2 * HH; C.position.set(px * .5, cy + py * .35, 14); C.lookAt(px * .2, cy, 0);
                    sh.forEach(s => {
                        const base = -s.f * P, off = (((base - cy) % P) + P) % P - P / 2;
                        for (let a = 0; a < 3; a++) { s.v[a] += -3 * s.o[a] * dt; s.v[a] *= Math.pow(.04, dt); s.o[a] += s.v[a] * dt }
                        s.sp *= Math.pow(.15, dt); s.pulse *= Math.pow(.02, dt);
                        s.m.position.set(s.x * HW * (mob() ? .9 : 1) + Math.cos(t * .0008 + s.f * 13) * .6 + s.o[0], cy + off + Math.sin(t * .0012 + s.f * 20) * .8 + s.o[1], s.z + s.o[2]);
                        s.m.rotation.x += (s.rx + s.sp) * dt; s.m.rotation.y += (s.ry + s.sp * .7) * dt;
                        const k = (mob() ? .7 : 1) * s.s * (1 + s.pulse * .35); s.m.scale.setScalar(k)
                    });
                    R.render(S, C)
                }
                (function loop(now) { requestAnimationFrame(loop); if (document.hidden) { last = now; return } const dt = RM2 ? 0 : Math.min(.05, (now - last) / 1000); last = now; frame(dt, RM2 ? 0 : now) })(performance.now());
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
                if (e.pointerType === "mouse") { a1 += d; if (a1 > 24 && !RM2) { a1 = 0; spark(x, y) } if (fine && !RM2) cube.style.display = "block"; }
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
        const slp = document.querySelector(".sleeper"); if (slp) slp.addEventListener("click", () => { toast("Huh? I wasn’t sleeping. I was resting my eyes."); snd("yawn") });
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
    
// Supabase Backend Sync
(async () => {
    try {
        const remote = await StorageService.syncFromSupabase();
        if (remote && remote.length) {
            LOCAL = remote;
            DATA.entries = remote;
            render();
        }
    } catch (err) {
        console.warn('Initial Supabase sync fallback:', err);
    }

    try {
        SupabaseService.subscribeToEntries(async () => {
            const updated = await StorageService.syncFromSupabase();
            LOCAL = updated;
            DATA.entries = updated;
            render();
        });
    } catch (err) {
        console.warn('Supabase realtime subscription fallback:', err);
    }
})();
