-- ==========================================================================
-- Doing Nothing (doingnothing.lol) - Supabase Database Setup & Permissions
-- Run this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/upnbvommgourlstrilsa/sql/new
-- ==========================================================================

-- 1. Create the patrons table if it doesn't exist
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

-- 2. Fast query index for leaderboard ranking
CREATE INDEX IF NOT EXISTS idx_patrons_board 
ON public.patrons (is_today, is_approved, amount DESC, created_at DESC);

-- 3. Grant table privileges to anon and authenticated roles (Resolves Error 42501)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.patrons TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.patrons ENABLE ROW LEVEL SECURITY;

-- 5. Public RLS Policies (Read, Insert, Update, Delete)
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

-- 6. Enable Realtime updates for live board sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.patrons;

-- 7. Insert starter seed data so the board is active immediately on launch
INSERT INTO public.patrons (name, url, amount, message, category, is_today, is_approved)
VALUES
('Alex Dev Studios', 'https://github.com', 150.00, 'Huge fans of doing absolutely nothing. Keep inspiring the world!', 'Legend', true, true),
('PixelPulse SaaS', 'https://pixelpulse.io', 75.00, 'We build analytics while you nap. Here''s lunch on us!', 'Big Spender', true, true),
('@sarah_designs', 'https://x.com', 35.00, 'Proud supporter of the horizontal economy.', 'Big Spender', true, true)
ON CONFLICT DO NOTHING;
