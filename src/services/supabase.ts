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
      const { data, error } = await client.from('entries').select('id').limit(1);

      if (error) {
        if (error.code === '42P01') {
          return {
            ok: true,
            message: 'Connected to Supabase! (Note: The "entries" table needs to be created in your Supabase SQL editor).'
          };
        }
        return {
          ok: false,
          message: `Supabase error (${error.code}): ${error.message}`
        };
      }

      this.isConnected = true;
      return {
        ok: true,
        message: `Connected to Supabase! Found ${data ? data.length : 0} test row(s).`
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
      const { data, error } = await client
        .from('entries')
        .select('*')
        .order('t', { ascending: false });

      if (error || !data) {
        return null;
      }

      return data.map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url || '',
        amt: Number(row.amt),
        desc: row.desc || '',
        img: row.img || '',
        anon: Boolean(row.anon),
        t: Number(row.t) || Date.now(),
        src: row.src || 'live'
      }));
    } catch {
      return null;
    }
  }

  public static async insertEntry(entry: LeaderboardEntry): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client.from('entries').insert([
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

      return !error;
    } catch {
      return false;
    }
  }

  public static async deleteEntry(id: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client.from('entries').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  }

  public static async updateEntry(id: string, updates: Partial<LeaderboardEntry>): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client.from('entries').update(updates).eq('id', id);
      return !error;
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
        { event: '*', schema: 'public', table: 'entries' },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }

  public static getCreateSqlSchema(): string {
    return `-- Run this in your Supabase SQL Editor:
create table if not exists public.entries (
  id text primary key,
  name text not null,
  url text default '',
  amt numeric not null default 1,
  "desc" text default '',
  img text default '',
  anon boolean default false,
  t bigint not null,
  src text default 'live',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable public read & insert policies for your viral app:
alter table public.entries enable row level security;

create policy "Public can read entries"
on public.entries for select
using (true);

create policy "Public can insert contributions"
on public.entries for insert
with check (true);

create policy "Public can update entries"
on public.entries for update
using (true);

create policy "Public can delete entries"
on public.entries for delete
using (true);

-- Enable Realtime
alter publication supabase_realtime add table public.entries;
`;
  }
}
