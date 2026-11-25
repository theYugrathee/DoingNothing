/**
 * Core TypeScript Interfaces & Types for Doing Nothing SaaS
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export type PaymentGateway = 'stripe' | 'razorpay' | 'paypal' | 'crypto';

export type ContributionTierName = 'Legend' | 'Big Spender' | 'Supporter' | 'Noodle Fan';

export interface ContributionTier {
  name: ContributionTierName;
  color: string;
  minAmount: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  url: string;
  amt: number;
  desc: string;
  img: string;
  anon: boolean;
  t: number; // Unix timestamp in ms
  src?: 'preview' | 'manual' | 'pending' | 'seed' | 'live';
  gateway?: PaymentGateway;
  currency?: Currency;
}

export interface AppConfig {
  payUrl: string;
  timezone: string;
  adminPasscode: string;
  tagline: string;
  heroTitle: string;
  buttonText: string;
  subText: string;
  targetGoal: number;
  minAmount: number;
  presets: number[];
  currency: Currency;
  lines: string[];
  dodgeQuotes: string[];
  roastTemplates: string[];
  excusesList: string[];
  socials: {
    twitter: string;
    github: string;
  };
}

export interface DailyStats {
  collectedToday: number;
  feedersToday: number;
  topSupporter: string;
  resetCountdownFormatted: string;
  goalPercent: number;
}

export interface PaymentPayload {
  name: string;
  url?: string;
  amount: number;
  desc?: string;
  img?: string;
  anon: boolean;
  gateway: PaymentGateway;
  currency?: Currency;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  entry?: LeaderboardEntry;
  redirectUrl?: string;
  error?: string;
}

export type SoundEffectName =
  | 'pop'
  | 'bonk'
  | 'squeak'
  | 'boing'
  | 'blorp'
  | 'honk'
  | 'tick'
  | 'up'
  | 'kaching'
  | 'sad'
  | 'horn'
  | 'boom'
  | 'alarm'
  | 'rim'
  | 'fanfare'
  | 'dun'
  | 'scratch';

export type BoardFilterMode = 'recent' | 'top';

export type AppPage =
  | 'home'
  | 'red'
  | 'roast'
  | 'hall-of-fame'
  | 'challenge'
  | 'excuses'
  | 'about'
  | 'rules'
  | 'privacy'
  | 'terms'
  | 'admin';
