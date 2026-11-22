import { AppConfig, LeaderboardEntry } from '../types';
import { DEFAULT_CONFIG, INITIAL_LEADERBOARD } from '../data/defaults';
import { SupabaseService } from './supabase';

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
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          lines: parsed.lines && parsed.lines.length ? parsed.lines : DEFAULT_CONFIG.lines,
          dodgeQuotes: parsed.dodgeQuotes && parsed.dodgeQuotes.length ? parsed.dodgeQuotes : DEFAULT_CONFIG.dodgeQuotes,
          roastTemplates: parsed.roastTemplates && parsed.roastTemplates.length ? parsed.roastTemplates : DEFAULT_CONFIG.roastTemplates,
          excusesList: parsed.excusesList && parsed.excusesList.length ? parsed.excusesList : DEFAULT_CONFIG.excusesList,
          presets: parsed.presets && parsed.presets.length ? parsed.presets : DEFAULT_CONFIG.presets
        };
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
    return [...INITIAL_LEADERBOARD];
  }

  public static saveEntries(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save entries:', e);
    }
  }

  public static async syncFromSupabase(): Promise<LeaderboardEntry[]> {
    const remote = await SupabaseService.fetchEntries();
    if (remote && remote.length > 0) {
      this.saveEntries(remote);
      return remote;
    }
    return this.getEntries();
  }

  public static async addEntry(entry: LeaderboardEntry): Promise<LeaderboardEntry[]> {
    const list = this.getEntries();
    list.unshift(entry);
    this.saveEntries(list);

    // Asynchronously send to Supabase
    SupabaseService.insertEntry(entry).catch((err) => {
      console.warn('Supabase remote insert fallback:', err);
    });

    return list;
  }

  public static async deleteEntry(id: string): Promise<LeaderboardEntry[]> {
    let list = this.getEntries();
    list = list.filter((x) => x.id !== id);
    this.saveEntries(list);

    SupabaseService.deleteEntry(id).catch((err) => {
      console.warn('Supabase remote delete error:', err);
    });

    return list;
  }

  public static async updateEntry(id: string, updates: Partial<LeaderboardEntry>): Promise<LeaderboardEntry[]> {
    const list = this.getEntries();
    const idx = list.findIndex((x) => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveEntries(list);
    }

    SupabaseService.updateEntry(id, updates).catch((err) => {
      console.warn('Supabase remote update error:', err);
    });

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
