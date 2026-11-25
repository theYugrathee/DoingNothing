import { AppConfig, LeaderboardEntry } from '../types';
import { DEFAULT_CONFIG } from '../data/defaults';
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
        if (Array.isArray(parsed)) {
          // Remove any leftover dummy/seed data
          return parsed.filter(
            (e) =>
              e.src !== 'seed' &&
              !String(e.id).startsWith('seed-') &&
              e.name !== 'Alex Dev Studios' &&
              e.name !== 'PixelPulse SaaS' &&
              e.name !== '@sarah_designs' &&
              e.name !== 'Chai & Chill Club'
          );
        }
      }
    } catch (e) {
      console.warn('Failed to parse entries from storage:', e);
    }
    return [];
  }

  public static saveEntries(entries: LeaderboardEntry[]): void {
    try {
      // Never save dummy seed rows
      const cleaned = entries.filter(
        (e) =>
          e.src !== 'seed' &&
          !String(e.id).startsWith('seed-') &&
          e.name !== 'Alex Dev Studios' &&
          e.name !== 'PixelPulse SaaS' &&
          e.name !== '@sarah_designs'
      );
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(cleaned));
    } catch (e) {
      console.error('Failed to save entries:', e);
    }
  }

  public static async syncFromSupabase(): Promise<LeaderboardEntry[]> {
    const remote = await SupabaseService.fetchEntries();
    if (remote !== null) {
      // Filter out any dummy data
      const cleanedRemote = remote.filter(
        (r) =>
          r.src !== 'preview' &&
          r.src !== 'seed' &&
          !String(r.id).startsWith('seed-') &&
          r.name !== 'Alex Dev Studios' &&
          r.name !== 'PixelPulse SaaS' &&
          r.name !== '@sarah_designs'
      );

      // Strict deduplication map
      const map = new Map<string, LeaderboardEntry>();
      for (const r of cleanedRemote) {
        const key = r.id || (r.name.trim().toLowerCase() + '_' + r.amt);
        if (!map.has(key)) map.set(key, r);
      }

      // Keep previews and unsynced admin edits local. Never silently discard
      // pending work when Supabase is reachable again.
      for (const cached of this.getEntries()) {
        const isLegacyPending = cached.src === 'manual' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cached.id);
        if (cached.src !== 'preview' && cached.src !== 'pending' && !isLegacyPending) continue;
        const key = cached.id || (cached.name.trim().toLowerCase() + '_' + cached.amt);
        if (!map.has(key)) map.set(key, { ...cached, src: cached.src === 'preview' ? 'preview' : 'pending' });
      }

      // Supabase is authoritative for live entries; only browser-local previews
      // are retained so they never need to be uploaded to remain visible.
      const combined = Array.from(map.values());
      this.saveEntries(combined);
      return combined;
    }
    return this.getEntries();
  }

  public static async addEntry(entry: LeaderboardEntry): Promise<LeaderboardEntry[]> {
    const previousId = entry.id;
    const existing = this.getEntries();
    if (!await SupabaseService.insertEntry(entry)) {
      const pending = { ...entry, src: 'pending' as const };
      const list = existing.filter((item) => item.id !== previousId && item.id !== pending.id);
      list.unshift(pending);
      this.saveEntries(list);
      throw new Error(SupabaseService.lastErrorMessage || 'Supabase did not accept the entry.');
    }
    entry.src = 'live';
    const list = existing.filter((item) => item.id !== previousId && item.id !== entry.id);
    list.unshift(entry);
    this.saveEntries(list);
    return this.syncFromSupabase();
  }

  public static async deleteEntry(id: string): Promise<LeaderboardEntry[]> {
    const list = this.getEntries();
    const existing = list.find((entry) => entry.id === id);
    if (existing?.src !== 'preview' && !await SupabaseService.deleteEntry(id)) {
      throw new Error(SupabaseService.lastErrorMessage || 'Supabase did not delete the entry.');
    }
    const cleaned = list.filter((x) => x.id !== id);
    this.saveEntries(cleaned);
    return cleaned;
  }

  public static async updateEntry(id: string, updates: Partial<LeaderboardEntry>): Promise<LeaderboardEntry[]> {
    const list = this.getEntries();
    const existing = list.find((entry) => entry.id === id);
    if (existing?.src === 'preview') {
      const localOnly = list.map((entry) => entry.id === id ? { ...entry, ...updates } : entry);
      this.saveEntries(localOnly);
      return localOnly;
    }
    const updatedEntry = { ...existing, ...updates, id } as LeaderboardEntry;
    if (existing?.src === 'pending' || (existing?.src === 'manual' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      return this.addEntry({ ...updatedEntry, src: 'manual' });
    }
    if (!await SupabaseService.updateEntry(id, updates)) {
      throw new Error(SupabaseService.lastErrorMessage || 'Supabase did not update the entry.');
    }
    const updated: LeaderboardEntry[] = list.map((entry) => entry.id === id ? { ...entry, ...updates, src: 'live' as const } : entry);
    this.saveEntries(updated);
    return updated;
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
