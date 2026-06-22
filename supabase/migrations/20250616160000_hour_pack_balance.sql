-- Bolsa de horas (Plan 24 h) — saldo por usuario + registro de compras

CREATE TABLE IF NOT EXISTS public.user_hour_balance (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_ms bigint NOT NULL DEFAULT 0 CHECK (balance_ms >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hour_pack_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id text UNIQUE NOT NULL,
  amount_ms bigint NOT NULL CHECK (amount_ms > 0),
  purchased_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hour_pack_purchases_user
  ON public.hour_pack_purchases(user_id, purchased_at DESC);

ALTER TABLE public.user_hour_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_pack_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own hour balance"
  ON public.user_hour_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own hour pack purchases"
  ON public.hour_pack_purchases FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_hour_balance IS 'Saldo de bolsa de horas (ms) — se consume en sesiones activas';
COMMENT ON TABLE public.hour_pack_purchases IS 'Compras del Plan 24 Horas vía Stripe';
