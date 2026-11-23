import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeaderboardEntry } from '../types';

export const SUPABASE_URL = 'https://upnbvommgourlstrilsa.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_zdRs9UjpAC1oVUQvzSGiXA_kVScRgOp';

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  public static isConnected: boolean = false;

  public static getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
    return this.client;
  }

  public static async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const client = this.getClient();

      // Test 'patrons' table first
      const { data: patronsData, error: patronsError } = await client
        .from('patrons')
        .select('*')
        .limit(1);

      if (!patronsError) {
        this.isConnected = true;
        return {
          ok: true,
          message: `Connected to Supabase! Table 'patrons' is active with ${patronsData?.length ?? 0} sample row(s).`
        };
      }

      // Test 'entries' table as fallback
      const { data: entriesData, error: entriesError } = await client
        .from('entries')
        .select('*')
        .limit(1);

      if (!entriesError) {
        this.isConnected = true;
        return {
          ok: true,
          message: `Connected to Supabase! Table 'entries' is active with ${entriesData?.length ?? 0} sample row(s).`
        };
      }

      if (patronsError.code === '42501' || entriesError.code === '42501') {
        return {
          ok: false,
          message: `Supabase Error 42501: Permission denied for table. Please run the SQL Grant permissions in your Supabase SQL Editor.`
        };
      }

      return {
        ok: false,
        message: `Supabase status: ${patronsError.message || entriesError.message}`
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        message: `Connection failed: ${msg}`
      };
    }
  }

  public static async fetchEntries(): Promise<LeaderboardEntry[] | null> {
    try {
      const client = this.getClient();

      // 1. Try 'patrons' table
      const { data: patronsData, error: patronsError } = await client
        .from('patrons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!patronsError && patronsData && patronsData.length > 0) {
        return patronsData.map((row) => ({
          id: String(row.id),
          name: row.name || 'Anonymous Supporter',
          url: row.url || '',
          amt: Number(row.amount ?? row.amt ?? 0),
          desc: row.message ?? row.desc ?? '',
          img: row.logo_url ?? row.img ?? '',
          anon: Boolean(!row.name || row.name === 'Anonymous legend' || row.anon),
          t: row.created_at ? new Date(row.created_at).getTime() : (Number(row.t) || Date.now()),
          src: 'live'
        }));
      }

      // 2. Try 'entries' table fallback
      const { data: entriesData, error: entriesError } = await client
        .from('entries')
        .select('*')
        .order('t', { ascending: false });

      if (!entriesError && entriesData && entriesData.length > 0) {
        return entriesData.map((row) => ({
          id: String(row.id),
          name: row.name,
          url: row.url || '',
          amt: Number(row.amt),
          desc: row.desc || '',
          img: row.img || '',
          anon: Boolean(row.anon),
          t: Number(row.t) || Date.now(),
          src: 'live'
        }));
      }

      return null;
    } catch (err) {
      console.warn('Failed to fetch from Supabase:', err);
      return null;
    }
  }

  public static async insertEntry(entry: LeaderboardEntry): Promise<boolean> {
    try {
      const client = this.getClient();

      // 1. Try inserting into 'patrons' table
      const patronPayload: Record<string, unknown> = {
        name: entry.name,
        url: entry.url || '',
        logo_url: entry.img || '',
        amount: entry.amt,
        message: entry.desc || '',
        category: 'Supporter',
        is_today: true,
        is_approved: true
      };

      // Only pass id if it matches a valid UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.id)) {
        patronPayload.id = entry.id;
      }

      const { data: patronResult, error: patronError } = await client
        .from('patrons')
        .insert([patronPayload])
        .select();

      if (!patronError) {
        if (patronResult && patronResult[0] && patronResult[0].id) {
          entry.id = String(patronResult[0].id);
        }
        return true;
      }

      console.warn('Patrons table insert note:', patronError.message);

      // 2. Try inserting into 'entries' table as fallback
      const { error: entriesError } = await client.from('entries').insert([
        {
          id: entry.id,
          name: entry.name,
          url: entry.url,
          amt: entry.amt,
          desc: entry.desc,
          img: entry.img,
          anon: entry.anon,
          t: entry.t,
          src: entry.src || 'live'
        }
      ]);

      return !entriesError;
    } catch (err) {
      console.warn('Supabase insert exception:', err);
      return false;
    }
  }

  public static async deleteEntry(id: string): Promise<boolean> {
    try {
      const client = this.getClient();
      // Try both tables
      const res1 = await client.from('patrons').delete().eq('id', id);
      const res2 = await client.from('entries').delete().eq('id', id);
      return !res1.error || !res2.error;
    } catch {
      return false;
    }
  }

  public static async updateEntry(id: string, updates: Partial<LeaderboardEntry>): Promise<boolean> {
    try {
      const client = this.getClient();
      const patronUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) patronUpdates.name = updates.name;
      if (updates.url !== undefined) patronUpdates.url = updates.url;
      if (updates.img !== undefined) patronUpdates.logo_url = updates.img;
      if (updates.amt !== undefined) patronUpdates.amount = updates.amt;
      if (updates.desc !== undefined) patronUpdates.message = updates.desc;

      const res1 = await client.from('patrons').update(patronUpdates).eq('id', id);
      const res2 = await client.from('entries').update(updates).eq('id', id);
      return !res1.error || !res2.error;
    } catch {
      return false;
    }
  }

  public static subscribeToEntries(callback: () => void): () => void {
    const client = this.getClient();
    const channel = client
      .channel('entries_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patrons' },
        () => callback()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entries' },
        () => callback()
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

    public static async verifyAdminPasscode(enteredPass: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const cleanPass = enteredPass ? enteredPass.trim() : '';
      if (!cleanPass) return false;

      // 1. Check official admin_settings table first
      try {
        const { data: adminData } = await client
          .from('admin_settings')
          .select('value')
          .eq('key', 'admin_passcode')
          .maybeSingle();

        if (adminData && adminData.value) {
          return adminData.value.trim() === cleanPass;
        }
      } catch {}

      // 2. Check patrons table for system auth record
      const { data: patronAuth } = await client
        .from('patrons')
        .select('message')
        .eq('category', '__ADMIN_AUTH__')
        .maybeSingle();

      if (patronAuth && patronAuth.message) {
        return patronAuth.message.trim() === cleanPass;
      }

      // 3. If no password has ever been saved in Supabase yet, save this password to Supabase!
      if (cleanPass.length >= 4) {
        await client.from('patrons').insert([{
          name: '__ADMIN_AUTH__',
          category: '__ADMIN_AUTH__',
          message: cleanPass,
          amount: 1,
          is_today: false,
          is_approved: false
        }]);
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Admin passcode verification error:', err);
      return false;
    }
  }

  public static getCreateSqlSchema(): string {
    return `-- ==========================================================================
-- Doing Nothing - Full Supabase Setup & Permissions Fix Script
-- Run this in your Supabase SQL Editor:
-- ==========================================================================

-- 1. Create the patrons table if not existing
CREATE TABLE IF NOT EXISTS public.patrons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    name TEXT NOT NULL,
    url TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    message TEXT DEFAULT '',
    category TEXT DEFAULT 'Supporter',
    is_today BOOLEAN NOT NULL DEFAULT true,
    is_approved BOOLEAN NOT NULL DEFAULT true
);

-- 2. Grant PostgreSQL privileges to public and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.patrons TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.patrons ENABLE ROW LEVEL SECURITY;

-- 4. Create public RLS policies
DROP POLICY IF EXISTS "Allow public read access for patrons" ON public.patrons;
CREATE POLICY "Allow public read access for patrons"
ON public.patrons FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert for contributions" ON public.patrons;
CREATE POLICY "Allow public insert for contributions"
ON public.patrons FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update for patrons" ON public.patrons;
CREATE POLICY "Allow public update for patrons"
ON public.patrons FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public delete for patrons" ON public.patrons;
CREATE POLICY "Allow public delete for patrons"
ON public.patrons FOR DELETE
TO anon, authenticated
USING (true);

-- 5. Enable Realtime updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.patrons;
`;
  }
}
