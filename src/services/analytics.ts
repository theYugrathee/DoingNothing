import { LeaderboardEntry, DailyStats, BoardFilterMode, ContributionTier } from '../types';
import { CONTRIBUTION_TIERS } from '../data/defaults';

export class AnalyticsService {
  public static calculateDailyStats(entries: LeaderboardEntry[], targetGoal: number): DailyStats {
    const todayEntries = this.filterToday(entries);
    const totalToday = todayEntries.reduce((sum, item) => sum + item.amt, 0);

    const sortedByAmt = [...todayEntries].sort((a, b) => b.amt - a.amt);
    const topSupporter = sortedByAmt[0] ? sortedByAmt[0].name : 'Nobody yet';

    // Countdown calculation to midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diffSec = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));

    const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const s = String(diffSec % 60).padStart(2, '0');

    const goalPercent = Math.min(100, Math.round((totalToday / Math.max(1, targetGoal)) * 100));

    return {
      collectedToday: totalToday,
      feedersToday: todayEntries.length,
      topSupporter,
      resetCountdownFormatted: `${h}:${m}:${s}`,
      goalPercent
    };
  }

  public static getTodayDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  public static filterToday(entries: LeaderboardEntry[]): LeaderboardEntry[] {
    const todayDate = this.getTodayDateString();
    return entries.filter((e) => {
      const d = new Date(e.t);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayDate;
    });
  }

  public static getSortedBoard(entries: LeaderboardEntry[], mode: BoardFilterMode): LeaderboardEntry[] {
    const today = this.filterToday(entries);
    if (mode === 'recent') {
      return [...today].sort((a, b) => b.t - a.t);
    }
    return [...today].sort((a, b) => b.amt - a.amt || a.t - b.t);
  }

  public static getHallOfFame(entries: LeaderboardEntry[], limit: number = 100): LeaderboardEntry[] {
    return [...entries].sort((a, b) => b.amt - a.amt || a.t - b.t).slice(0, limit);
  }

  public static getMealName(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 11) return 'breakfast';
    if (h >= 11 && h < 16) return 'lunch';
    if (h >= 16 && h < 22) return 'dinner';
    return 'a midnight snack';
  }

  public static getTier(amt: number): ContributionTier {
    for (const tier of CONTRIBUTION_TIERS) {
      if (amt >= tier.minAmount) {
        return tier;
      }
    }
    return CONTRIBUTION_TIERS[CONTRIBUTION_TIERS.length - 1];
  }

  public static getTimeAgo(timestamp: number): string {
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  public static formatMoney(n: number): string {
    return '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  public static safeUrl(u?: string): string {
    u = (u || '').trim();
    if (!u || u[0] === '@') return '';
    try {
      const x = new URL(/^https?:/i.test(u) ? u : 'https://' + u);
      return /^https?:$/.test(x.protocol) && x.hostname.includes('.') ? x.href : '';
    } catch {
      return '';
    }
  }

  public static getHost(u?: string): string {
    try {
      const safe = this.safeUrl(u);
      return safe ? new URL(safe).hostname.replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  }

  public static escapeHtml(s: string): string {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c] || c));
  }
}
