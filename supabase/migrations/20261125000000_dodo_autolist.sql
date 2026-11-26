-- Private order staging for Dodo checkout. Only the Edge Functions use the
-- service role; browser clients must not read or write these rows.
ALTER TABLE public.patrons
  ADD COLUMN IF NOT EXISTS payment_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.patrons'::regclass
      AND conname = 'patrons_payment_id_key'
  ) THEN
    ALTER TABLE public.patrons
      ADD CONSTRAINT patrons_payment_id_key UNIQUE (payment_id);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  message TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  dodo_session_id TEXT,
  payment_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_orders FROM anon, authenticated;
GRANT ALL ON TABLE public.payment_orders TO service_role;

-- Allow 0 or greater for test/free checkouts
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_amount_check;
ALTER TABLE public.payment_orders ADD CONSTRAINT payment_orders_amount_check CHECK (amount >= 0);

ALTER TABLE public.patrons DROP CONSTRAINT IF EXISTS patrons_amount_check;
ALTER TABLE public.patrons ADD CONSTRAINT patrons_amount_check CHECK (amount >= 0);

-- Payment confirmations update patrons immediately; this table is already
-- added by the existing setup script, but ensure the publication is present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'patrons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patrons;
  END IF;
END;
$$;
