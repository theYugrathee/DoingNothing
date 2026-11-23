import { AppConfig, LeaderboardEntry, ContributionTier } from '../types';

export const ROTATING_LINES: string[] = [
  "bro i literally just woke up",
  "my mom thinks i'm applying for jobs right now",
  "can't work today, vibe is completely off",
  "eating maggi for dinner for the 4th day in a row",
  "my bank account has like $1.40 in it",
  "i sent 1 job application in 2024 and i'm still recovering",
  "opened linkedin for 2 mins and got an existential crisis",
  "interview? nah i'd get nervous and cry",
  "bro leave me alone i'm tired",
  "i'm not broke, i just have zero money",
  "pls don't tell my dad you saw this website",
  "who even came up with the idea of working 40 hours a week anyway",
  "currently busy staring at my ceiling thinking about life",
  "my bed was literally begging me not to get up",
  "i was gonna be productive today but then lunch happened",
  "salary: zero. stress: also zero.",
  "my alarm went off at 8am and i just laughed",
  "just 5 more mins (said 5 hours ago)",
  "i have big plans for life, just not today",
  "someone please buy me food i'm too lazy to cook",
  "my back hurts from lying down all day",
  "thinking about working made me need a nap"
];

export const DODGE_QUOTES: string[] = [
  "nah i'm good",
  "bro chill",
  "in this economy?!",
  "leave me alone",
  "i'm sleepy",
  "ask me tomorrow",
  "too much work",
  "i'm busy doing nothing",
  "my mom already told me that",
  "no thanks",
  "can't, vibe is off",
  "who's gonna hire me anyway",
  "try again lol",
  "missed me",
  "nice try though",
  "i'm comfortable here",
  "working is overrated",
  "pay me to stop",
  "don't look at me",
  "shh i'm napping",
  "bro please stop clicking",
  "not happening today"
];

export const ROAST_TEMPLATES: string[] = [
  "{n} sounds like something you made at 3am and regretted the next morning.",
  "i looked at {n} and honestly? even your close friends haven't visited it.",
  "{n} has 2 active users: you and your other test gmail account.",
  "the founder of {n} definitely talks about AI on twitter all day but has zero paying customers.",
  "bro named it {n} and genuinely thought he did something revolutionary.",
  "if {n} was a person, it would still be living in its parents' basement.",
  "{n} is the kind of project that stays 'launching next month' until 2035.",
  "i asked my cat about {n} and it literally just walked away to sleep.",
  "{n} sounds like a startup that raised zero dollars and somehow still lost all of it.",
  "bro {n} has more buttons and dropdowns than actual active users.",
  "i showed {n} to my mom and she asked if it was a virus.",
  "the roadmap for {n} is definitely just 3 bullet points in Apple Notes."
];

export const EXCUSES_LIST: string[] = [
  "bro my internet was acting weird",
  "i was about to start and then my friend called",
  "can't right now, my head hurts a little",
  "i'll do it tonight after dinner i swear",
  "i got distracted by a 3-hour youtube video about medieval castles",
  "my laptop was updating",
  "i need to clean my room first before i can focus",
  "tomorrow 100% no cap",
  "i had to walk my neighbor's dog",
  "it's too late in the day to start something new anyway",
  "my coffee was too hot to drink, so i paused everything",
  "i'm waiting for the right mood to kick in"
];

export const DEFAULT_CONFIG: AppConfig = {
  payUrl: '',
  timezone: 'Asia/Kolkata',
  adminPasscode: 'admin123',
  tagline: 'Unemployed since 2026. Proud of it.',
  heroTitle: 'I do nothing.',
  buttonText: 'Buy me',
  subText: 'and get on today’s board',
  targetGoal: 100,
  minAmount: 1,
  presets: [5, 10, 25, 50, 100],
  currency: 'USD',
  lines: [...ROTATING_LINES],
  dodgeQuotes: [...DODGE_QUOTES],
  roastTemplates: [...ROAST_TEMPLATES],
  excusesList: [...EXCUSES_LIST],
  socials: {
    twitter: 'https://x.com/YugRathee',
    github: ''
  }
};

export const CONTRIBUTION_TIERS: ContributionTier[] = [
  { name: 'Legend', color: '#E8412C', minAmount: 100 },
  { name: 'Big Spender', color: '#8B3DFF', minAmount: 25 },
  { name: 'Supporter', color: '#0E9F6E', minAmount: 5 },
  { name: 'Noodle Fan', color: '#6C6A64', minAmount: 1 }
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [];
