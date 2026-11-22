import { AppConfig, LeaderboardEntry } from '../types';
import { DEFAULT_CONFIG, INITIAL_LEADERBOARD } from '../data/defaults';

const STORAGE_KEYS = {
  CONFIG: 'idn_cfg',
  ENTRIES: 'idn_entries',
  BEST_STILLNESS: 'idn_best_stillness',
  SOUND: 'idn_snd'
} as const;

export class StorageService {
  public static getConfig(): AppConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to parse config from storage:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  public static saveConfig(cfg: AppConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }

  public static getEntries(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse entries from storage:', e);
    }
    // Return seeds on initial load
    return [...INITIAL_LEADERBOARD];
  }

  public static saveEntries(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries:', e);
    }
  }

  public static addEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
    const list = this.getEntries();
    list.unshift(entry);
    this.saveEntries(list);
    return list;
  }

  public static getBestStillness(): number {
    try {
      return parseFloat(localStorage.getItem(STORAGE_KEYS.BEST_STILLNESS) || '0');
    } catch {
      return 0;
    }
  }

  public static saveBestStillness(seconds: number): void {
    try {
      const current = this.getBestStillness();
      if (seconds > current) {
        localStorage.setItem(STORAGE_KEYS.BEST_STILLNESS, seconds.toString());
      }
    } catch (e) {
      console.error('Failed to save stillness:', e);
    }
  }
}
