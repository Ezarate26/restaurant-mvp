-- Billing: suscripciones Pro + pases por sala
-- Ejecutar en Supabase SQL Editor o via supabase db push

-- Perfil de facturación por usuario (1:1 con auth.users)
CREATE TABLE IF NOT EXISTS public.user_billing (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  plan_tier text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  pro_expires_at timestamptz,
  stripe_subscription_id text UNIQUE,
  subscription_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pases de sala (pago único → Pro temporal en una conversación)
CREATE TABLE IF NOT EXISTS public.room_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  stripe_checkout_session_id text UNIQUE,
  expires_at timestamptz NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_passes_conversation
  ON public.room_passes(conversation_id);

CREATE INDEX IF NOT EXISTS idx_room_passes_user_active
  ON public.room_passes(user_id, expires_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_user_billing_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_billing_updated_at ON public.user_billing;
CREATE TRIGGER user_billing_updated_at
  BEFORE UPDATE ON public.user_billing
  FOR EACH ROW EXECUTE FUNCTION public.set_user_billing_updated_at();

-- RLS
ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own billing"
  ON public.user_billing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own room passes"
  ON public.room_passes FOR SELECT
  USING (auth.uid() = user_id);

-- Escritura solo vía service role (webhooks Stripe)
-- No policies INSERT/UPDATE para authenticated → el webhook usa service role

COMMENT ON TABLE public.user_billing IS 'Plan y cliente Stripe por usuario registrado';
COMMENT ON TABLE public.room_passes IS 'Pase Pro temporal por sala (pago único)';
