/**
 * Doing Nothing SaaS - Data & Presets
 */

export const DEFAULT_CONFIG = {
  payUrl: "", // Live payment gateway URL (e.g. Stripe Payment Link, LemonSqueezy)
  timezone: "Asia/Kolkata",
  adminPasscode: "admin123",
  tagline: "Unemployed since 2026. Proud of it.",
  buttonText: "Buy me",
  subText: "and get on today’s board",
  targetGoal: 100, // Daily meal funding target in USD
  socials: {
    twitter: "https://x.com",
    github: "https://github.com/theYugrathee/DoingNothing"
  }
};

export const ROTATING_LINES = [
  "Today I ate: nothing. Yesterday: instant noodles. Progress.",
  "Employee of the month at my own couch.",
  "Unemployed, undefeated, underfed.",
  "My diet is 80% noodles, 20% excuses.",
  "Current net worth: one cup of spicy ramen.",
  "Last meal: spaghetti with ketchup. Michelin-adjacent.",
  "I’m not unemployed. I’m pre-productive.",
  "The cheapest meal in town? I’m the honorary mayor there.",
  "My LinkedIn headline says: 'Open to Nap Opportunities'.",
  "I once tried working. It was a Saturday, so I stopped.",
  "Hustle culture called. I let it go straight to voicemail.",
  "I’m the reason ergonomic couches were invented.",
  "Dinner tonight: cup noodles. Dessert: ice water.",
  "The worst employee you will happily never hire.",
  "Professional bed comfort evaluator (self-assigned, unpaid).",
  "Hunger status: high noodle priority alert.",
  "My fridge light is the hardest working component in this house.",
  "I have a 10-year masterplan. It involves sleeping in.",
  "Day 1 of my startup. Day 4,000 of resting my eyes.",
  "My bank account is an inspiring minimalist art piece.",
  "I’m self-employed. Salary: pure positive vibes.",
  "Lunch is a social construct. My stomach is a void.",
  "Currently accepting angel investment in the form of hot pizza.",
  "Not lazy. Simply maintaining extreme energy conservation.",
  "Recruiters keep searching for 10x engineers; I’m a 0.01x master."
];

export const DODGE_QUOTES = [
  "Nice try, HR!",
  "Resume: 1 line ('Can sleep 12 hrs').",
  "I'm overqualified for employment.",
  "My hands are allergic to spreadsheets.",
  "Can this job be done horizontally?",
  "Error 404: Motivation not found.",
  "I’m disruption-resistant.",
  "LinkedIn blocked me for excessive chill.",
  "I’d work, but Mercury is in retrograde.",
  "My couch needs emotional support.",
  "Interview question: 'Where do you see yourself in 5 years?' Me: 'Right here.'",
  "Even my shadow decided to take the day off.",
  "Working 9 to 5? I wake up at 5 PM.",
  "I don’t suffer from insanity, I enjoy every minute of doing nothing.",
  "I’m quiet-quitting life’s hustle.",
  "Will trade software advice for hot samosas.",
  "Synergy? I don't even have standard energy.",
  "Circle back with me in 2030.",
  "Out of office: Permanently booked by bed.",
  "Please pay me to stay away from your codebase.",
  "I tested positive for lack of enthusiasm.",
  "I have an allergy to Monday mornings.",
  "Don't tell my parents you found this site.",
  "My alarm clock surrendered 3 weeks ago.",
  "Every meeting could have been a nap."
];

export const ROAST_TEMPLATES = [
  "{n} sounds like a SaaS with 3 active users. And two of them are your test accounts.",
  "I searched for {n} on Google and even the algorithm seemed unenthusiastic.",
  "{n} possesses the precise energetic aura of a corporate Friday 4:55 PM email.",
  "The entire product roadmap for {n} is clearly a blurry screenshot in Apple Notes.",
  "{n} pivoted so frequently that it ended up right back where it failed initially.",
  "If {n} was an office snack, it’d be the stale rice cake at the bottom of the drawer.",
  "{n} is the ultimate definition of 'Coming Soon' on Product Hunt.",
  "Bold decision naming it {n}. Bolder still to deploy it to production on a Friday.",
  "{n} is dominating every market metric—strictly inside the founder's imagination.",
  "I am literally unemployed and even I would ask {n} for a viable monetization strategy.",
  "{n} has a five-year financial projection. Year one is still buffered at 0%.",
  "{n}: 45 features, zero retention, 1000% irrational founder confidence.",
  "Folks claim {n} is ahead of its time. Time took one look and walked away.",
  "{n} is the kind of project name that raises $2M in a bull market and delivers a Notion page.",
  "I showed {n} to my cat. It walked away and took a four-hour nap in protest."
];

export const EXCUSES_LIST = [
  "I had an airtight master plan. Then a nap happened.",
  "My inbox and I are currently experiencing mutual estrangement.",
  "I was literally about to open VS Code, but lunch was ready.",
  "Deadlines are merely philosophical suggestions.",
  "My to-do list has evolved into a work of historical fiction.",
  "Productivity is a lifestyle choice. I chose horizontal alignment.",
  "I am awaiting the exact cosmic alignment before writing line 1.",
  "I produce my finest creative work under zero pressure, preferably next year.",
  "The couch has 12 years of workplace seniority over me.",
  "Conserving cognitive bandwidth for unforeseen galactic emergencies.",
  "The Wi-Fi was behaving with suspicious tranquility.",
  "I’m not procrastinating; I’m performing background asynchronous incubation.",
  "I cannot code on an empty stomach, nor on a full one.",
  "My keyboard keys are on an unannounced tea break."
];

export const INITIAL_LEADERBOARD = [
  {
    id: "sample-1",
    name: "Alex Dev Studios",
    url: "https://github.com",
    amt: 150.00,
    desc: "Huge fans of doing absolutely nothing. Keep inspiring the world!",
    img: "",
    anon: false,
    t: Date.now() - 1000 * 60 * 35,
    src: "seed"
  },
  {
    id: "sample-2",
    name: "PixelPulse SaaS",
    url: "https://pixelpulse.io",
    amt: 75.00,
    desc: "We build analytics while you nap. Here's lunch on us!",
    img: "",
    anon: false,
    t: Date.now() - 1000 * 60 * 120,
    src: "seed"
  },
  {
    id: "sample-3",
    name: "@sarah_designs",
    url: "https://x.com",
    amt: 35.00,
    desc: "Proud supporter of the horizontal economy.",
    img: "",
    anon: false,
    t: Date.now() - 1000 * 60 * 240,
    src: "seed"
  },
  {
    id: "sample-4",
    name: "Anonymous Hero",
    url: "",
    amt: 20.00,
    desc: "May your instant noodles always have flavor packets.",
    img: "",
    anon: true,
    t: Date.now() - 1000 * 60 * 360,
    src: "seed"
  },
  {
    id: "sample-5",
    name: "Chai & Code Club",
    url: "https://linkedin.com",
    amt: 10.00,
    desc: "Fueling the non-productive revolution, one cup at a time.",
    img: "",
    anon: false,
    t: Date.now() - 1000 * 60 * 500,
    src: "seed"
  }
];
